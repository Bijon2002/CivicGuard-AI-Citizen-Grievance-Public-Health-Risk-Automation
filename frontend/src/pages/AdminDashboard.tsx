import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, ShieldCheck, Building2, HeartPulse, Truck, Droplets, AlertTriangle, CheckCircle2, Clock, FileText, TrendingUp, RefreshCw, Eye, Sparkles, Info, Users, Activity, Play, Send, ShieldAlert, CheckCircle, Zap, LayoutGrid, MapPin, BarChart3, Navigation, ChevronRight, Layers, SlidersHorizontal, AlertCircle, Radio } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchDepartments, fetchReports, fetchSupabaseHealth, type Department, type Report } from '../api';
import { HazardGuidancePanel } from '../components/HazardGuidancePanel';

const ROLE_CONFIG: Record<string, { icon: any; gradient: string; label: string }> = {
  admin: { icon: ShieldCheck, gradient: 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700', label: 'System Administrator' },
  officer_mc: { icon: Building2, gradient: 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700', label: 'Municipal Council' },
  officer_rda: { icon: Truck, gradient: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700', label: 'Road Development Authority' },
  officer_wb: { icon: Droplets, gradient: 'bg-gradient-to-r from-sky-600 via-blue-600 to-cyan-700', label: 'Water Board' },
  health_official: { icon: HeartPulse, gradient: 'bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-700', label: 'Public Health Office' },
};

type DeptPreset = {
  commandTitle: string;
  subTitle: string;
  graphicImg: string;
  accentBg: string;
  accentBorder: string;
  badgeBg: string;
  badgeText: string;
  crews: Array<{ id: string; name: string; vehicle: string; status: 'En Route' | 'On Site' | 'Standby'; location: string }>;
  metrics: Array<{ label: string; value: string; detail: string; icon: any; progress: number }>;
  actions: Array<{ label: string; actionKey: string; icon: any }>;
};

const DEPT_PRESETS: Record<string, DeptPreset> = {
  'Municipal Council': {
    commandTitle: 'Sanitation & Waste Management Command',
    subTitle: 'Real-time dispatch control for garbage clearance, overgrown terrain, and municipal drainage.',
    graphicImg: '/dept_council.png',
    accentBg: 'bg-gradient-to-r from-amber-50 to-orange-50/70',
    accentBorder: 'border-amber-200/90',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-950',
    crews: [
      { id: 'MC-1', name: 'Sanitation Unit Alpha', vehicle: 'Garbage Truck #04', status: 'En Route', location: 'Uduvil Road, Jaffna' },
      { id: 'MC-2', name: 'Heavy Clearing Squad', vehicle: 'JCB Backhoe #02', status: 'On Site', location: 'Chunnakam Market' },
      { id: 'MC-3', name: 'Drainage Clear Squad', vehicle: 'Vacuum Van #01', status: 'Standby', location: 'Council Depot' },
    ],
    metrics: [
      { label: 'Active Field Crews', value: '6 Teams', detail: '4 Sanitation / 2 Heavy', icon: Users, progress: 85 },
      { label: 'Avg SLA Dispatch', value: '22 Mins', detail: 'Target: < 30 mins', icon: Clock, progress: 92 },
      { label: 'SLA Resolution', value: '94%', detail: 'On-time clearance rate', icon: CheckCircle2, progress: 94 },
    ],
    actions: [
      { label: 'Dispatch Sanitation Crew', actionKey: 'dispatch_sanitation', icon: Send },
      { label: 'Issue Overgrowth Notice', actionKey: 'clear_overgrowth', icon: Zap },
      { label: 'Export Sanitation Log', actionKey: 'export_log', icon: FileText },
    ],
  },
  'Public Health Office': {
    commandTitle: 'Public Health & Hazard Safety Command',
    subTitle: 'Public health risk mitigation, sanitation, water contamination response, and environmental safety.',
    graphicImg: '/dept_health.png',
    accentBg: 'bg-gradient-to-r from-cyan-50 to-teal-50/70',
    accentBorder: 'border-cyan-200/90',
    badgeBg: 'bg-cyan-100 text-cyan-900 border-cyan-300',
    badgeText: 'text-cyan-950',
    crews: [
      { id: 'PH-1', name: 'Sanitation Squad A', vehicle: 'Inspection Van #01', status: 'On Site', location: 'Kopay North Sector 4' },
      { id: 'PH-2', name: 'Water Safety Team', vehicle: 'Mobile Lab Unit #03', status: 'En Route', location: 'Nallur Main Line' },
      { id: 'PH-3', name: 'Environmental Inspection Unit', vehicle: 'Lab Van #02', status: 'Standby', location: 'Health Office HQ' },
    ],
    metrics: [
      { label: 'Sanitation Squads', value: '4 Squads', detail: 'Mobile Field Units', icon: HeartPulse, progress: 78 },
      { label: 'Public Health Index', value: 'Moderate', detail: 'Public Health Containment Safe', icon: Activity, progress: 65 },
      { label: 'Water Quality Zones', value: '12 Zones', detail: 'Treatment Active', icon: ShieldAlert, progress: 88 },
    ],
    actions: [
      { label: 'Deploy Chemical Fogging Squad', actionKey: 'fogging_squad', icon: Send },
      { label: 'Apply Chemical Larvicide', actionKey: 'apply_larvicide', icon: Zap },
      { label: 'Broadcast Health Alert', actionKey: 'health_alert', icon: AlertTriangle },
    ],
  },
  'Road Development Authority': {
    commandTitle: 'Highways & Infrastructure Repair Command',
    subTitle: 'Rapid response for asphalt potholes, fallen tree removal, and highway safety hazards.',
    graphicImg: '/dept_roads.png',
    accentBg: 'bg-gradient-to-r from-blue-50 to-indigo-50/70',
    accentBorder: 'border-blue-200/90',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'text-blue-950',
    crews: [
      { id: 'RDA-1', name: 'Asphalt Patch Crew 1', vehicle: 'Hot-Mix Roller #05', status: 'On Site', location: 'A9 Highway Km 24' },
      { id: 'RDA-2', name: 'Road Obstruction Team', vehicle: 'Flatbed Crane #02', status: 'En Route', location: 'Point Pedro Junction' },
      { id: 'RDA-3', name: 'Culvert Inspection Unit', vehicle: 'Inspection Van #01', status: 'Standby', location: 'RDA Sub-Depot' },
    ],
    metrics: [
      { label: 'Asphalt Patch Units', value: '5 Heavy Teams', detail: 'Mobile Repair Vans', icon: Truck, progress: 90 },
      { label: 'Asphalt Stock', value: '45 Tons', detail: 'Ready for Immediate Laying', icon: TrendingUp, progress: 75 },
      { label: 'Highway Score', value: '98% Clear', detail: 'Main Corridors Open', icon: CheckCircle2, progress: 98 },
    ],
    actions: [
      { label: 'Dispatch Asphalt Repair Team', actionKey: 'dispatch_asphalt', icon: Send },
      { label: 'Erect Road Safety Barrier', actionKey: 'erect_barrier', icon: ShieldAlert },
      { label: 'Request Traffic Diversion', actionKey: 'traffic_diversion', icon: Zap },
    ],
  },
  'Water Board': {
    commandTitle: 'Water Supply & Mains Isolation Command',
    subTitle: 'Main pipe burst isolation, sewage containment, and drinking water quality testing.',
    graphicImg: '/dept_water.png',
    accentBg: 'bg-gradient-to-r from-sky-50 to-cyan-50/70',
    accentBorder: 'border-sky-200/90',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: 'text-sky-950',
    crews: [
      { id: 'WB-1', name: 'Hydro Repair Unit 1', vehicle: 'Pipe Excavator #03', status: 'On Site', location: 'Kankesanthurai Road' },
      { id: 'WB-2', name: 'Mains Isolation Squad', vehicle: 'Utility Rig #02', status: 'En Route', location: 'Palaly Road Main' },
      { id: 'WB-3', name: 'Water Assay Lab', vehicle: 'Mobile Testing Truck', status: 'Standby', location: 'Water Board HQ' },
    ],
    metrics: [
      { label: 'Pressure Monitor', value: '42 PSI', detail: 'Mains Grid Stable', icon: Activity, progress: 84 },
      { label: 'Emergency Leak Teams', value: '3 Units', detail: 'Hydro-Repair On-Call', icon: Droplets, progress: 92 },
      { label: 'Water Saved Est.', value: '120k Liters', detail: 'Prevented Supply Waste', icon: CheckCircle2, progress: 96 },
    ],
    actions: [
      { label: 'Isolate Damaged Main Pipe', actionKey: 'isolate_main', icon: Zap },
      { label: 'Dispatch Leak Repair Unit', actionKey: 'dispatch_leak_crew', icon: Send },
      { label: 'Run Water Quality Assay', actionKey: 'water_assay', icon: Activity },
    ],
  },
};

function getRoleKey(): string {
  const role = localStorage.getItem('userRole') ?? '';
  const dept = localStorage.getItem('userDepartmentName') ?? '';
  if (role === 'admin') return 'admin';
  if (role === 'health_official') return 'health_official';
  if (dept.includes('Municipal')) return 'officer_mc';
  if (dept.includes('Road')) return 'officer_rda';
  if (dept.includes('Water')) return 'officer_wb';
  return 'admin';
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState<'triage' | 'crews' | 'analytics' | 'matrix'>('triage');
  
  const [severityFilter, setSeverityFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  const roleKey = getRoleKey();
  const isAdmin = roleKey === 'admin';
  const userDeptName = localStorage.getItem('userDepartmentName') ?? '';
  const config = ROLE_CONFIG[roleKey] ?? ROLE_CONFIG.admin;
  const RoleIcon = config.icon;
  const deptPreset = DEPT_PRESETS[userDeptName];

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
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDepartmentId');
    localStorage.removeItem('userDepartmentName');
    navigate('/login');
  };

  function showToast(message: string, type: 'info' | 'success' | 'error' = 'info') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function checkSupabase() {
    try {
      const result = await fetchSupabaseHealth();
      showToast('Supabase Connection OK (' + (result.storage_sample ?? 'active') + ')', 'success');
    } catch (err) {
      showToast('Supabase check failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
    }
  }

  const roleFilteredReports = useMemo(() => {
    if (isAdmin) return reports;
    return reports.filter(r => r.department_name === userDeptName);
  }, [reports, isAdmin, userDeptName]);

  const filteredReports = useMemo(() => {
    return roleFilteredReports.filter(r => {
      if (severityFilter !== 'All' && r.severity !== severityFilter) return false;
      if (riskFilter !== 'All' && r.dengue_risk !== riskFilter) return false;
      if (statusFilter !== 'All' && r.status !== statusFilter) return false;
      if (departmentFilter !== 'All' && r.department_name !== departmentFilter) return false;
      return true;
    });
  }, [roleFilteredReports, severityFilter, riskFilter, statusFilter, departmentFilter]);

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

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1').replace(/\/api\/v1$/, '');

  async function handleStatusChange(reportId: string, newStatus: string) {
    setUpdatingStatus(true);
    try {
      const { updateReportStatus } = await import('../api');
      const updated = await updateReportStatus(reportId, newStatus);
      showToast(`Status updated to '${newStatus}'`, 'success');
      setSelectedReport(updated);
      await loadData();
    } catch (err) {
      showToast('Failed to update status: ' + (err instanceof Error ? err.message : String(err)), 'error');
    } finally {
      setUpdatingStatus(false);
    }
  }

  function handleDeptQuickAction(label: string) {
    showToast(`Action Dispatched: ${label}`, 'success');
  }

  const totalReports = roleFilteredReports.length;
  const highRiskCount = roleFilteredReports.filter(r => r.dengue_risk === 'High').length;
  const severeCount = roleFilteredReports.filter(r => r.severity === 'severe').length;
  const resolvedCount = roleFilteredReports.filter(r => r.status === 'Resolved').length;
  const inProgressCount = roleFilteredReports.filter(r => r.status === 'In Progress').length;
  const reportedCount = roleFilteredReports.filter(r => r.status === 'Reported').length;

  return (
    <div className="mx-auto flex min-h-[90vh] max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 text-slate-800 animate-fadeIn">
      <AdminToast toast={toast} />
      
      {/* Vibrant Command Center Banner with Custom 3D Department Graphic */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-6 rounded-2xl ${config.gradient} text-white p-6 sm:p-7 shadow-xl shadow-emerald-600/20 relative overflow-hidden`}>
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-md">
              <RoleIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {isAdmin ? 'System Administrator Command' : `${userDeptName} Portal`}
                </h1>
                <span className="rounded-full bg-white/20 text-white border border-white/30 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <Radio className="h-3 w-3 text-amber-300 animate-pulse" /> Live AI Dispatch
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5 font-medium">
                {isAdmin ? 'System-wide grievance triage, department routing & public safety automation' : `Departmental incident triage & rapid risk response`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {isAdmin && (
              <button onClick={checkSupabase} className="inline-flex items-center gap-1.5 rounded-xl border border-white/30 bg-white/20 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 transition shadow-2xs">
                <RefreshCw className="h-3.5 w-3.5" />
                Storage Check
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-red-300/40 bg-red-500/30 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-red-500/50 transition shadow-2xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              {t('logout')}
            </button>
          </div>
        </div>

        {/* Embedded Custom 3D Department Telemetry Graphic */}
        <div className="hidden lg:block shrink-0 relative z-10">
          <div className="rounded-2xl p-1.5 bg-white/20 backdrop-blur-md border border-white/30 shadow-2xl">
            <img 
              src={deptPreset ? deptPreset.graphicImg : '/dashboard_analytics.png'} 
              alt="Department Telemetry Graphic" 
              className="h-36 w-64 rounded-xl object-cover shadow-lg"
              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* Staff Department Mission Control Hub — Rendered for Staff Officers */}
      {!isAdmin && deptPreset && (
        <div className={`glass-card rounded-2xl border ${deptPreset.accentBorder} ${deptPreset.accentBg} p-5 sm:p-6 shadow-sm space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3.5">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-slate-900">{deptPreset.commandTitle}</h2>
                <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${deptPreset.badgeBg}`}>
                  Operational Mode
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 font-medium">{deptPreset.subTitle}</p>
            </div>
            
            {/* Quick Dispatch Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {deptPreset.actions.map((act) => {
                const ActIcon = act.icon;
                return (
                  <button
                    key={act.actionKey}
                    onClick={() => handleDeptQuickAction(act.label)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-200/90 px-3.5 py-2 text-xs font-bold text-slate-800 shadow-2xs hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 transition active:scale-95"
                  >
                    <ActIcon className="h-3.5 w-3.5 text-emerald-600" />
                    {act.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Department Specialized Metrics with Progress Bars */}
          <div className="grid gap-3.5 sm:grid-cols-3">
            {deptPreset.metrics.map((m) => {
              const MIcon = m.icon;
              return (
                <div key={m.label} className="rounded-xl border border-slate-200/80 bg-white/90 p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                    <span>{m.label}</span>
                    <MIcon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-slate-900 tracking-tight">{m.value}</span>
                    <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {m.progress}% Optimal
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full" style={{ width: `${m.progress}%` }} />
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium pt-0.5">{m.detail}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('triage')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'triage'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Live Triage & Heatmap
          </button>

          {!isAdmin && (
            <button
              onClick={() => setActiveTab('crews')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'crews'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Field Crews ({deptPreset?.crews.length ?? 0})
            </button>
          )}

          <button
            onClick={() => setActiveTab('analytics')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Predictive Telemetry
          </button>

          {isAdmin && (
            <button
              onClick={() => setActiveTab('matrix')}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                activeTab === 'matrix'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Building2 className="h-3.5 w-3.5" />
              Routing Matrix
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          Auto-Refreshing every 30s
        </div>
      </div>

      {/* Glowing Metric Cards Grid */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <ProMetricCard icon={FileText} label="Total Incident Reports" value={totalReports} color="emerald" change="+12% this week" />
        <ProMetricCard icon={AlertTriangle} label="High Health & Safety Risk" value={highRiskCount} color="red" isPulse change="Active Alert" />
        <ProMetricCard icon={TrendingUp} label="Active In-Progress" value={inProgressCount} color="amber" change="Under Action" />
        <ProMetricCard icon={CheckCircle2} label="Resolved Tickets" value={resolvedCount} color="blue" change="Closed SLA" />
      </div>

      {/* Tab 1: Triage & Heatmap */}
      {activeTab === 'triage' && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
          
          {/* Filter Toolbar */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 pb-1">
            <FilterSelect label="Severity" options={['All', 'mild', 'moderate', 'severe']} value={severityFilter} onChange={setSeverityFilter} />
            <FilterSelect label="Public Health Risk" options={['All', 'Low', 'Medium', 'High']} value={riskFilter} onChange={setRiskFilter} />
            <FilterSelect label="Status" options={['All', 'Reported', 'Assigned', 'In Progress', 'Resolved']} value={statusFilter} onChange={setStatusFilter} />
            {isAdmin ? (
              <FilterSelect label="Department Scope" options={['All', ...departments.map(d => d.name)]} value={departmentFilter} onChange={setDepartmentFilter} />
            ) : (
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Department Scope</label>
                <div className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">{userDeptName}</div>
              </div>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            
            {/* Incident Queue Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-emerald-600" />
                  {isAdmin ? 'Live Incident Queue' : `${userDeptName} Queue`}
                </h2>
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                  <Info className="h-3 w-3 text-emerald-600" />
                  Click row to inspect ticket
                </span>
              </div>

              <div className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/50">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-md text-slate-700 font-extrabold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Hazard</th>
                      <th className="p-3">Severity</th>
                      <th className="p-3">Status</th>
                      {isAdmin && <th className="p-3">Dept</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {filteredReports.map(r => (
                      <tr 
                        key={r.id} 
                        onClick={() => setSelectedReport(r)}
                        className={`transition-colors cursor-pointer ${
                          selectedReport?.id === r.id ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-emerald-50/40'
                        }`}
                      >
                        <td className="p-3 font-bold capitalize text-slate-900">{r.hazard_type.replace('_', ' ')}</td>
                        <td className="p-3 capitalize">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            r.severity === 'severe' ? 'bg-red-500 text-white' : r.severity === 'moderate' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                          }`}>{r.severity}</span>
                        </td>
                        <td className="p-3">
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${
                            r.status === 'Resolved' ? 'bg-emerald-600 text-white' : r.status === 'In Progress' ? 'bg-blue-600 text-white' : r.status === 'Assigned' ? 'bg-amber-600 text-white' : 'bg-slate-600 text-white'
                          }`}>{r.status}</span>
                        </td>
                        {isAdmin && <td className="p-3 text-[11px] text-slate-500 font-medium truncate max-w-[100px]">{r.department_name ?? '—'}</td>}
                      </tr>
                    ))}
                    {filteredReports.length === 0 && (
                      <tr><td colSpan={isAdmin ? 4 : 3} className="p-8 text-center text-slate-400 font-medium">No matching incident reports found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* GIS Hazard Map */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Eye className="h-4 w-4 text-emerald-600" /> GIS Hazard & Public Safety Heatmap
              </h2>
              <div className="h-[440px] overflow-hidden rounded-xl border border-slate-200 shadow-inner">
                <MapContainer center={mapCenter} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%', background: '#f8fafc' }}>
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CARTO &copy; OpenStreetMap'
                  />
                  {filteredReports.map(r => (
                    r.lat && r.lng ? (
                      <CircleMarker 
                        key={r.id}
                        center={[r.lat, r.lng]} 
                        radius={10}
                        eventHandlers={{ click: () => setSelectedReport(r) }}
                        pathOptions={{
                          color: r.dengue_risk === 'High' ? '#dc2626' : r.dengue_risk === 'Medium' ? '#d97706' : '#2563eb',
                          fillColor: r.dengue_risk === 'High' ? '#dc2626' : r.dengue_risk === 'Medium' ? '#d97706' : '#2563eb',
                          fillOpacity: 0.75,
                          weight: 1.5
                        }}
                      >
                        <Popup>
                          <div className="font-bold text-xs">{r.hazard_type}</div>
                          <div className="text-[11px] text-slate-600">Severity: {r.severity}</div>
                          <div className="text-[11px] text-slate-600">Risk: <strong>{r.dengue_risk}</strong></div>
                        </Popup>
                      </CircleMarker>
                    ) : null
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Field Crews Dispatch Hub */}
      {activeTab === 'crews' && deptPreset && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-emerald-600" />
                {userDeptName} Active Field Units
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Live tracking & dispatch management for field crews</p>
            </div>
            <button 
              onClick={() => showToast('Dispatched new emergency field unit!', 'success')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 transition active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              Deploy New Crew
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {deptPreset.crews.map((crew) => (
              <div key={crew.id} className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold bg-slate-100 px-2 py-0.5 rounded text-slate-600">{crew.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    crew.status === 'On Site' ? 'bg-emerald-100 text-emerald-800' : crew.status === 'En Route' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {crew.status}
                  </span>
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">{crew.name}</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{crew.vehicle}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium truncate flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                    {crew.location}
                  </span>
                  <button 
                    onClick={() => showToast(`Contacting ${crew.name}...`, 'info')}
                    className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0"
                  >
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Predictive Risk Analytics */}
      {activeTab === 'analytics' && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <BarChart3 className="h-4.5 w-4.5 text-emerald-600" />
                Predictive Hazard & Public Safety Telemetry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Automated risk forecasting & resolution progress indicators</p>
            </div>
            <span className="rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 text-xs font-bold">
              AI Forecast Confidence: 96.4%
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            
            {/* Risk Breakdown Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs">
              <h3 className="text-xs font-extrabold text-slate-900">Incident Severity Distribution</h3>
              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Severe Priority Incidents</span>
                    <span className="text-red-600">{severeCount} reports</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-red-500 h-full rounded-full" style={{ width: `${Math.min(100, (severeCount / Math.max(1, totalReports)) * 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>High Public Health Risk</span>
                    <span className="text-amber-600">{highRiskCount} reports</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: `${Math.min(100, (highRiskCount / Math.max(1, totalReports)) * 100)}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                    <span>Closed & Resolved Tickets</span>
                    <span className="text-emerald-600">{resolvedCount} reports</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${Math.min(100, (resolvedCount / Math.max(1, totalReports)) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Recommendation Box */}
            <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 p-4 space-y-2.5 shadow-2xs text-xs">
              <h3 className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-amber-500" /> AI Strategic Dispatch Recommendation
              </h3>
              <p className="text-slate-700 leading-relaxed font-medium">
                Based on 5-day Open-Meteo rainfall forecasts (&gt;15mm expected) in Northern Province, mosquito breeding risk is predicted to peak in 48 hours.
              </p>
              <div className="pt-2 flex items-center justify-between">
                <span className="font-bold text-emerald-800">Priority Zone: Uduvil & Kopay</span>
                <button 
                  onClick={() => showToast('Fumigation schedule auto-generated and dispatched!', 'success')}
                  className="rounded-lg bg-emerald-600 px-3 py-1.5 font-bold text-white hover:bg-emerald-700 transition shadow-2xs"
                >
                  Auto-Schedule Fogging
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Routing Matrix (Admin) */}
      {activeTab === 'matrix' && isAdmin && (
        <div className="glass-card rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3 animate-fadeIn">
          <h2 className="text-sm font-extrabold text-slate-900">Department Dispatch Routing Reference</h2>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-extrabold">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Automated Triggers</th>
                  <th className="p-3">Contact Email</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {departments.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-bold text-emerald-700">{d.name}</td>
                    <td className="p-3 text-slate-500 font-medium">{d.issue_types.join(', ')}</td>
                    <td className="p-3 text-slate-600 flex items-center gap-2">
                      <span>{d.contact_email}</span>
                      <button
                        onClick={async () => {
                          try {
                            if (typeof (window as any).fetchAdminTestNotify === 'function') {
                              await (window as any).fetchAdminTestNotify(d.contact_email ?? null);
                            } else {
                              const token = (import.meta.env.VITE_INTERNAL_SERVICE_TOKEN ?? '') as string;
                              const res = await fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1'}/health/admin/test-notify`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'X-Internal-Token': token },
                                body: JSON.stringify({ department_email: d.contact_email }),
                              });
                              if (!res.ok) throw new Error('Request failed');
                            }
                            showToast('Test notification sent.', 'success');
                          } catch (err) {
                            showToast('Notification failed: ' + (err instanceof Error ? err.message : String(err)), 'error');
                          }
                        }}
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs"
                      >
                        Test Notify
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* Triage Inspector Modal */}
      {selectedReport ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-md animate-fadeIn">
          <div className="glass-card relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200/90 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Incident Inspector
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 capitalize mt-1">{selectedReport.hazard_type.replace('_', ' ')}</h3>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                {selectedReport.photo_url ? (
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-xs">
                    <img 
                      src={`${API_BASE}${selectedReport.photo_url}`} 
                      alt="Evidence" 
                      className="h-40 w-full object-cover"
                      onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                    />
                  </div>
                ) : null}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div><strong className="text-slate-900">Report ID:</strong> <code className="font-mono text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded font-bold">{selectedReport.id}</code></div>
                  <div><strong className="text-slate-900">Department:</strong> {selectedReport.department_name ?? 'Unassigned'}</div>
                  <div><strong className="text-slate-900">Coordinates:</strong> {selectedReport.lat}, {selectedReport.lng}</div>
                  <div><strong className="text-slate-900">Created:</strong> {selectedReport.created_at}</div>
                </div>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Public Health & Safety Risk</label>
                  <span className={`inline-block rounded-full px-3 py-1 font-extrabold ${
                    selectedReport.dengue_risk === 'High' ? 'bg-red-500 text-white' : selectedReport.dengue_risk === 'Medium' ? 'bg-amber-500 text-white' : 'bg-emerald-600 text-white'
                  }`}>
                    {selectedReport.dengue_risk} Risk
                  </span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Severity Level</label>
                  <span className="capitalize font-bold text-slate-800 text-sm">{selectedReport.severity}</span>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Update Ticket Status</label>
                  <select
                    disabled={updatingStatus}
                    value={selectedReport.status}
                    onChange={(e) => void handleStatusChange(selectedReport.id, e.target.value)}
                    className="w-full cursor-pointer rounded-xl border border-emerald-300 bg-emerald-50/50 px-3.5 py-2.5 text-xs font-extrabold text-emerald-800 outline-none focus:border-emerald-500 shadow-2xs"
                  >
                    {['Reported', 'Assigned', 'In Progress', 'Resolved'].map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {selectedReport.description ? (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Citizen Description</label>
                    <p className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-700 leading-relaxed font-medium">
                      {selectedReport.description}
                    </p>
                  </div>
                ) : null}

                <HazardGuidancePanel guidance={selectedReport.hazard_guidance} />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedReport(null)}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2 text-xs font-bold text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-md"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AdminToast({ toast }: { toast: { message: string; type: 'info' | 'success' | 'error' } | null }) {
  if (!toast) return null;
  const colors = {
    info: 'bg-white text-slate-800 border-slate-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  } as const;
  return (
    <div className={`fixed right-5 top-5 z-50 rounded-xl border px-4 py-3 text-xs font-bold shadow-xl ${colors[toast.type]} animate-fadeIn`}>
      {toast.message}
    </div>
  );
}

function ProMetricCard({ icon: Icon, label, value, color, isPulse = false, change }: { icon: any; label: string; value: number, color: string; isPulse?: boolean; change?: string }) {
  const colorMap: Record<string, { card: string; icon: string }> = {
    emerald: {
      card: 'bg-gradient-to-br from-emerald-50/80 to-teal-50/40 border-emerald-200/80 text-emerald-950',
      icon: 'bg-emerald-600 text-white shadow-emerald-600/30',
    },
    red: {
      card: 'bg-gradient-to-br from-red-50/80 to-rose-50/40 border-red-200/80 text-red-950',
      icon: 'bg-red-600 text-white shadow-red-600/30',
    },
    amber: {
      card: 'bg-gradient-to-br from-amber-50/80 to-orange-50/40 border-amber-200/80 text-amber-950',
      icon: 'bg-amber-600 text-white shadow-amber-600/30',
    },
    blue: {
      card: 'bg-gradient-to-br from-blue-50/80 to-cyan-50/40 border-blue-200/80 text-blue-950',
      icon: 'bg-blue-600 text-white shadow-blue-600/30',
    },
    slate: {
      card: 'bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200 text-slate-800',
      icon: 'bg-slate-700 text-white shadow-slate-700/30',
    },
    orange: {
      card: 'bg-gradient-to-br from-orange-50/80 to-amber-50/40 border-orange-200/80 text-orange-950',
      icon: 'bg-orange-600 text-white shadow-orange-600/30',
    },
    purple: {
      card: 'bg-gradient-to-br from-purple-50/80 to-indigo-50/40 border-purple-200/80 text-purple-950',
      icon: 'bg-purple-600 text-white shadow-purple-600/30',
    },
  };

  const current = colorMap[color] ?? colorMap.emerald;

  return (
    <div className={`glass-card glass-card-hover rounded-xl p-4 border shadow-xs flex flex-col justify-between ${current.card}`}>
      <div className="flex items-center justify-between gap-1 text-[10px] font-extrabold uppercase tracking-wider opacity-85">
        <span className="truncate">{label}</span>
        <div className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg shadow-sm ${current.icon}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="mt-2 flex items-baseline justify-between">
        <span className="text-2xl sm:text-3xl font-black tracking-tight">{value}</span>
        {isPulse && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
        )}
      </div>
      {change && (
        <div className="mt-1 text-[10px] font-bold opacity-75 truncate">
          {change}
        </div>
      )}
    </div>
  );
}

function FilterSelect({ label, options, value, onChange }: { label: string, options: string[], value: string, onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      <select 
        className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition shadow-2xs"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
