import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchDepartments, fetchReports, fetchSupabaseHealth, type Department, type Report } from '../api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  useEffect(() => {
    if (localStorage.getItem('isAdminLoggedIn') !== 'true') {
      navigate('/admin/login');
      return;
    }
    void loadData();
    const timer = setInterval(() => void loadData(), 30000);
    return () => clearInterval(timer);
  }, [navigate]);

  async function loadData() {
    const [reps, deps] = await Promise.all([fetchReports(), fetchDepartments()]);
    setReports(reps);
    setDepartments(deps);
  }

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    navigate('/admin/login');
  };

  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function checkSupabase() {
    try {
      const result = await fetchSupabaseHealth();
      showToast('Supabase OK (' + (result.storage_sample ?? 'n/a') + ')', 'success');
    } catch (err) {
      showToast('Supabase check failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  }

  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
      if (riskFilter !== 'All' && r.dengue_risk !== riskFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && r.department_name !== departmentFilter) return false;
      return true;
    });
  }, [reports, severityFilter, riskFilter, statusFilter, departmentFilter]);

  const mapCenter = useMemo(() => {
    if (filteredReports.length === 0) return [7.8731, 80.7718] as [number, number];
    const lats = filteredReports.map(r => r.lat).filter(Boolean);
    const lngs = filteredReports.map(r => r.lng).filter(Boolean);
    if (lats.length === 0 || lngs.length === 0) return [7.8731, 80.7718] as [number, number];
    return [
      lats.reduce((a,b) => a+b, 0) / lats.length,
      lngs.reduce((a,b) => a+b, 0) / lngs.length
    ] as [number, number];
  }, [filteredReports]);

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 text-white">
      <AdminToast toast={toast} />
      <div className="flex items-center justify-between rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md shadow-glow">
        <h1 className="text-3xl font-black tracking-tight">{t('dashboard')}</h1>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-full bg-red-500/20 px-4 py-2 text-sm font-bold text-red-400 hover:bg-red-500/30 transition border border-red-500/30 hover:scale-105"
        >
          <LogOut className="h-4 w-4" />
          {t('logout')}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <DashboardMetric label="Total Reports" value={reports.length} />
        <DashboardMetric label="High Risk" value={reports.filter(r => r.dengue_risk === 'High').length} accent="alert" />
        <DashboardMetric label="Severe" value={reports.filter(r => r.severity === 'severe').length} accent="sun" />
        <DashboardMetric label="Departments" value={departments.length} accent="sea" />
      </div>
        <div className="mt-3 flex items-center justify-end">
          <button onClick={checkSupabase} className="rounded-full bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/20">Check Supabase</button>
        </div>

      <div className="rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-glow backdrop-blur-md transition-all hover:border-white/20">
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <FilterSelect label="Severity" options={['All', 'mild', 'moderate', 'severe']} value={severityFilter} onChange={setSeverityFilter} />
          <FilterSelect label="Dengue Risk" options={['All', 'Low', 'Medium', 'High']} value={riskFilter} onChange={setRiskFilter} />
          <FilterSelect label="Status" options={['All', 'Reported', 'Assigned', 'In Progress', 'Resolved']} value={statusFilter} onChange={setStatusFilter} />
          <FilterSelect label="Department" options={['All', ...departments.map(d => d.name)]} value={departmentFilter} onChange={setDepartmentFilter} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <h2 className="mb-4 text-xl font-bold">Live Report Queue</h2>
            <div className="max-h-[500px] overflow-y-auto rounded-2xl border border-white/10 bg-black/20 p-2">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr>
                    <th className="p-3 font-semibold rounded-tl-xl">Hazard</th>
                    <th className="p-3 font-semibold">Severity</th>
                    <th className="p-3 font-semibold rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredReports.map(r => (
                    <tr key={r.id} className="hover:bg-white/5 transition-colors cursor-default">
                      <td className="p-3 font-medium">{r.hazard_type}</td>
                      <td className="p-3">{r.severity}</td>
                      <td className="p-3">
                        <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs">{r.status}</span>
                      </td>
                    </tr>
                  ))}
                  {filteredReports.length === 0 && (
                    <tr><td colSpan={3} className="p-8 text-center text-slate-400">No reports found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div>
            <h2 className="mb-4 text-xl font-bold">Hazard Map</h2>
            <div className="h-[500px] overflow-hidden rounded-2xl border border-white/10 shadow-inner">
              <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%', background: '#0b1020' }}>
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com/">Carto</a>'
                />
                {filteredReports.map(r => (
                  r.lat && r.lng ? (
                    <CircleMarker 
                      key={r.id}
                      center={[r.lat, r.lng]} 
                      radius={12}
                      pathOptions={{
                        color: r.dengue_risk === 'High' ? '#ef4444' : r.dengue_risk === 'Medium' ? '#eab308' : '#3b82f6',
                        fillColor: r.dengue_risk === 'High' ? '#ef4444' : r.dengue_risk === 'Medium' ? '#eab308' : '#3b82f6',
                        fillOpacity: 0.7,
                        weight: 2
                      }}
                    >
                      <Popup className="text-black rounded-xl">
                        <div className="font-bold mb-1">{r.hazard_type}</div>
                        <div className="text-sm">Severity: {r.severity}</div>
                        <div className="text-sm">Risk: <span className="font-semibold">{r.dengue_risk}</span></div>
                      </Popup>
                    </CircleMarker>
                  ) : null
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>
      
      <div className="rounded-[2rem] border border-white/10 bg-night/95 p-6 shadow-glow backdrop-blur-md transition-all hover:border-white/20">
        <h2 className="mb-4 text-xl font-bold">Routing Reference</h2>
        <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-slate-300">
              <tr>
                <th className="p-4 font-semibold rounded-tl-xl">Name</th>
                <th className="p-4 font-semibold">Issue Types</th>
                <th className="p-4 font-semibold rounded-tr-xl">Contact Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {departments.map(d => (
                <tr key={d.id} className="hover:bg-white/5 transition-colors cursor-default">
                  <td className="p-4 font-bold text-emerald-400">{d.name}</td>
                  <td className="p-4 text-slate-300">{d.issue_types.join(', ')}</td>
                  <td className="p-4 text-slate-300 flex items-center gap-3">
                    <span>{d.contact_email}</span>
                    <button
                      onClick={async () => {
                        try {
                          // call helper attached to window which invokes api.adminTestNotify
                          if (typeof (window as any).fetchAdminTestNotify === 'function') {
                            await (window as any).fetchAdminTestNotify(d.contact_email ?? null);
                          } else {
                            // fallback: call API directly using fetch and env token
                            const token = (import.meta.env.VITE_INTERNAL_SERVICE_TOKEN ?? '') as string;
                            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/health/admin/test-notify`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json', 'X-Internal-Token': token },
                              body: JSON.stringify({ department_email: d.contact_email }),
                            });
                            if (!res.ok) throw new Error('Request failed');
                          }
                          showToast('Test notification sent (check backend logs or inbox).', 'success');
                        } catch (err) {
                          showToast('Notification failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
                        }
                      }}
                      className="ml-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                    >
                      Test notify
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Toast element rendered by the AdminDashboard root; position fixed to top-right via global dom
export function AdminToast({ toast }: { toast: { message: string; type: 'info' | 'success' | 'error' } | null }) {
  if (!toast) return null;
  const colors = {
    info: 'bg-white/5 text-white border-white/10',
    success: 'bg-emerald-500/10 text-emerald-200 border-emerald-500/20',
    error: 'bg-red-500/10 text-red-200 border-red-500/20',
  } as const;
  return (
    <div className={`fixed right-6 top-6 z-50 rounded-xl border p-3 shadow-lg ${colors[toast.type]}`}>
      {toast.message}
    </div>
  );
}

function DashboardMetric({ label, value, accent = 'none' }: { label: string; value: number, accent?: 'none' | 'alert' | 'sun' | 'sea' }) {
  const accents = {
    none: 'bg-white/5 text-white border-white/10',
    alert: 'bg-red-500/10 text-red-400 border-red-500/20',
    sun: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    sea: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  };

  return (
    <div className={`rounded-3xl border p-5 backdrop-blur-md transition-transform hover:scale-105 ${accents[accent]}`}>
      <div className="text-sm font-semibold opacity-80 uppercase tracking-wider">{label}</div>
      <div className="mt-2 text-4xl font-black">{value}</div>
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select 
        className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:bg-black/40 transition-colors"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o} value={o} className="bg-[#0b1020]">{o}</option>
        ))}
      </select>
    </div>
  );
}
