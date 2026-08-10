const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

export type Department = {
  id: string;
  name: string;
  issue_types: string[];
  contact_email?: string | null;
};

export type Report = {
  id: string;
  photo_url: string;
  lat: number;
  lng: number;
  hazard_type: string;
  severity: string;
  dengue_risk: string;
  status: string;
  created_at: string;
  department_name?: string | null;
  description?: string | null;
};

export type HazardGuidance = {
  hazard_type: string;
  display_name: string;
  description?: string;
  incident_report?: string;
  issues?: string[];
  potential_problems?: string[];
  precautions?: string[];
  how_to_overcome?: string[];
  byproduct_issues?: string[];
  prevention_tips?: string[];
  emergency_note?: string;
};

export type PredictResponse = {
  hazard_type: string;
  severity: string;
  confidence: number;
  explanation: string;
  hazard_guidance?: HazardGuidance | null;
};

export type ReportDetail = Report & {
  description?: string | null;
  confidence: number;
  department_id?: string | null;
  is_duplicate_of?: string | null;
  updated_at: string;
  status_history: Array<{
    id: string;
    report_id: string;
    changed_by: string;
    old_status: string;
    new_status: string;
    changed_at: string;
  }>;
  predictions: Array<{
    id: string;
    report_id?: string | null;
    image_url: string;
    hazard_type: string;
    severity: string;
    confidence: number;
    model_name: string;
    raw_output?: string | null;
    created_at: string;
  }>;
  hazard_guidance?: HazardGuidance | null;
};

export async function fetchDepartments(): Promise<Department[]> {
  const response = await fetch(`${API_BASE}/departments`);
  if (!response.ok) throw new Error('Failed to fetch departments');
  return response.json();
}

export async function fetchReports(): Promise<Report[]> {
  const response = await fetch(`${API_BASE}/reports`);
  if (!response.ok) throw new Error('Failed to fetch reports');
  return response.json();
}

export async function fetchReportById(reportId: string): Promise<ReportDetail> {
  const response = await fetch(`${API_BASE}/reports/${reportId}`);
  if (!response.ok) throw new Error('Report not found');
  return response.json();
}

export async function submitReport(formData: FormData) {
  const response = await fetch(`${API_BASE}/reports`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const detail = errorData.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((d: any) => `${d.loc?.[1] || 'field'}: ${d.msg}`).join(', '));
    }
    throw new Error(typeof detail === 'string' ? detail : 'Failed to submit report');
  }
  return response.json();
}

export async function fetchWeather(lat: number, lng: number) {
  const response = await fetch(`${API_BASE}/weather?lat=${lat}&lng=${lng}`);
  if (!response.ok) throw new Error('Failed to fetch weather');
  return response.json();
}

export async function adminLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    // FastAPI validation errors return detail as an array; auth errors return a string
    const detail = errorData.detail;
    if (Array.isArray(detail)) {
      throw new Error(detail.map((d: any) => d.msg).join(', '));
    }
    throw new Error(typeof detail === 'string' ? detail : 'Invalid username or password');
  }
  return response.json();
}

export async function adminTestNotify(departmentEmail: string | null) {
  const url = `${API_BASE}/health/admin/test-notify`;
  const token = import.meta.env.VITE_INTERNAL_SERVICE_TOKEN ?? '';
  const payload = { department_email: departmentEmail };
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': token,
    },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Notification failed');
  }
  return response.json();
}

export async function fetchSupabaseHealth() {
  const url = `${API_BASE}/health/supabase`;
  const response = await fetch(url);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.detail ?? 'Supabase health check failed');
  }
  return response.json();
}

export async function updateReportStatus(reportId: string, status: string) {
  const token = localStorage.getItem('token') ?? '';
  const response = await fetch(`${API_BASE}/reports/${reportId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to update status');
  }
  return response.json();
}

export async function predictPhoto(formData: FormData): Promise<PredictResponse> {
  const response = await fetch(`${API_BASE}/reports/predict`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.detail || 'Prediction failed');
  }
  return response.json();
}
