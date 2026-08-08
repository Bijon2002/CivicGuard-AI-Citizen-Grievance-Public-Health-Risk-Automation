from __future__ import annotations

from collections import Counter
import os

import pandas as pd
import pydeck as pdk
import requests
import streamlit as st


def get_api_base() -> str:
    default_api_base = os.getenv("API_BASE_URL", "http://localhost:8000/api/v1")
    try:
        return st.secrets.get("API_BASE_URL", default_api_base)
    except FileNotFoundError:
        return default_api_base


API_BASE = get_api_base()

st.set_page_config(page_title="CivicGuard AI Dashboard", page_icon="🛰️", layout="wide")

st.markdown(
    """
    <style>
      .block-container { padding-top: 1.5rem; }
      .hero {
        padding: 1.5rem 1.75rem;
        border-radius: 28px;
        background: linear-gradient(135deg, #10162b 0%, #0b1020 100%);
        border: 1px solid rgba(255,255,255,0.08);
      }
    </style>
    """,
    unsafe_allow_html=True,
)

# Authentication State
if "logged_in" not in st.session_state:
    st.session_state["logged_in"] = False

if not st.session_state["logged_in"]:
    with st.sidebar:
        st.header("Admin Login")
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        if st.button("Login"):
            if username == "admin" and password == "admin":
                st.session_state["logged_in"] = True
                st.rerun()
            else:
                st.error("Invalid username or password")
    
    st.markdown('<div class="hero"><h1>Citizen Grievance-to-Action Dashboard</h1><p>Please log in from the sidebar to access the admin dashboard.</p></div>', unsafe_allow_html=True)
    st.stop()
else:
    with st.sidebar:
        st.success("Logged in as Admin")
        if st.button("Logout"):
            st.session_state["logged_in"] = False
            st.rerun()

st.markdown('<div class="hero"><h1>Citizen Grievance-to-Action Dashboard</h1><p>Monitor hazards, routing, and dengue risk flags in one place.</p></div>', unsafe_allow_html=True)


@st.cache_data(ttl=30)
def load_reports() -> list[dict]:
    try:
        response = requests.get(f"{API_BASE}/reports", timeout=20)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        return []


@st.cache_data(ttl=300)
def load_departments() -> list[dict]:
    try:
        response = requests.get(f"{API_BASE}/departments", timeout=20)
        response.raise_for_status()
        return response.json()
    except (requests.RequestException, ValueError):
        return []


reports = load_reports()
departments = load_departments()

if not reports or not departments:
    st.warning("Backend API is unavailable, so the dashboard is showing an empty fallback view.")

severity_counts = Counter(report["severity"] for report in reports)
risk_counts = Counter(report["dengue_risk"] for report in reports)

col1, col2, col3, col4 = st.columns(4)
col1.metric("Reports", len(reports))
col2.metric("High risk", risk_counts.get("High", 0))
col3.metric("Severe", severity_counts.get("severe", 0))
col4.metric("Departments", len(departments))

filters = st.columns(4)
severity_filter = filters[0].selectbox("Severity", ["All", "mild", "moderate", "severe"])
risk_filter = filters[1].selectbox("Dengue risk", ["All", "Low", "Medium", "High"])
status_filter = filters[2].selectbox("Status", ["All", "Reported", "Assigned", "In Progress", "Resolved"])
department_filter = filters[3].selectbox("Department", ["All"] + [item["name"] for item in departments])

filtered = reports
if severity_filter != "All":
    filtered = [report for report in filtered if report["severity"] == severity_filter]
if risk_filter != "All":
    filtered = [report for report in filtered if report["dengue_risk"] == risk_filter]
if status_filter != "All":
    filtered = [report for report in filtered if report["status"] == status_filter]
if department_filter != "All":
    filtered = [report for report in filtered if report.get("department_name") == department_filter]

left, right = st.columns([1.1, 1.2])

with left:
    st.subheader("Live report queue")
    frame = pd.DataFrame(filtered)
    if frame.empty:
        st.info("No reports match the current filters.")
    else:
        st.dataframe(frame[["id", "hazard_type", "severity", "dengue_risk", "status", "department_name", "lat", "lng"]], use_container_width=True, hide_index=True)

with right:
    st.subheader("Hazard map")
    if filtered:
        map_data = pd.DataFrame(filtered)
        map_data["risk_score"] = map_data["dengue_risk"].map({"Low": 1, "Medium": 2, "High": 3}).fillna(1)
        layer = pdk.Layer(
            "ScatterplotLayer",
            data=map_data,
            get_position="[lng, lat]",
            get_fill_color="[255, 79, 55, 180]",
            get_radius=80,
            pickable=True,
        )
        view_state = pdk.ViewState(
            latitude=float(map_data["lat"].mean()),
            longitude=float(map_data["lng"].mean()),
            zoom=11,
        )
        st.pydeck_chart(pdk.Deck(layers=[layer], initial_view_state=view_state, tooltip={"text": "{hazard_type} | {severity} | {dengue_risk}"}))
    else:
        st.info("No map points to display yet.")

st.subheader("Routing reference")
st.table(pd.DataFrame(departments)[["name", "issue_types", "contact_email"]] if departments else pd.DataFrame(columns=["name", "issue_types", "contact_email"]))
