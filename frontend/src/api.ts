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
  if (!response.ok) throw new Error('Failed to submit report');
  return response.json();
}

export async function fetchWeather(lat: number, lng: number) {
  const response = await fetch(`${API_BASE}/weather?lat=${lat}&lng=${lng}`);
  if (!response.ok) throw new Error('Failed to fetch weather');
  return response.json();
}
