import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User, ShieldCheck, Building2, HeartPulse, Droplets, Truck, ArrowRight, KeyRound, Zap, Sparkles, CheckCircle2, ShieldAlert } from 'lucide-react';
import { adminLogin } from '../api';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const performLogin = async (userEmail: string, passStr: string) => {
    setLoading(true);
    setError('');
    try {
      const data = await adminLogin(userEmail, passStr);
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userEmail', data.email);
      localStorage.setItem('userDepartmentId', data.department_id ?? '');
      localStorage.setItem('userDepartmentName', data.department_name ?? '');
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void performLogin(username, password);
  };

  return (
    <div className="relative flex min-h-[88vh] items-center justify-center px-4 py-8 overflow-hidden">
      
      {/* Background Graphic Illustration Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-multiply pointer-events-none scale-105 transition-transform duration-1000"
        style={{ backgroundImage: `url('/login_bg.png')` }}
      />
      
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-1/4 left-1/4 -mt-20 -ml-20 h-96 w-96 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none animate-pulseGlow" />
      <div className="absolute bottom-1/4 right-1/4 -mb-20 -mr-20 h-96 w-96 rounded-full bg-teal-400/20 blur-3xl pointer-events-none animate-pulseGlow" />

      {/* Main Split Glass Container */}
      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-12 items-center animate-fadeIn">
        
        {/* Left Column: Visual Hero Banner with Generated AI Graphic (Hidden on mobile, 5 cols on desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between rounded-3xl border border-white/80 bg-white/75 backdrop-blur-xl p-7 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/90 text-emerald-800 border border-emerald-200 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
              <ShieldAlert className="h-3.5 w-3.5 text-emerald-600" />
              CivicGuard Official Access
            </div>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">
              Smart Municipal & Public Health Automation
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Secure, AI-automated triage and incident dispatch portal for municipal authorities, health officers, and civil engineering departments.
            </p>
          </div>

          {/* AI Banner Visual Asset */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 shadow-md">
            <img 
              src="/login_bg.png" 
              alt="Civic Automation Graphic" 
              className="h-44 w-full object-cover transform hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent flex items-end p-4">
              <span className="text-white text-xs font-bold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" /> Real-time GIS Vector Monitoring
              </span>
            </div>
          </div>

          {/* Feature Bullets */}
          <div className="space-y-2 text-xs font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Automated Department Dispatching</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Dengue High-Risk Cluster Detection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Open-Meteo Weather Rainfall Integration</span>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Login Card (7 cols on desktop) */}
        <div className="lg:col-span-7 glass-card relative w-full overflow-hidden rounded-3xl border border-white/90 bg-white/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          <div className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-600/30">
              <KeyRound className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">Official Portal Login</h1>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">Select your department for 1-click access or enter password</p>
          </div>

          {/* 1-Click Quick Department Logins */}
          <div className="rounded-2xl border border-slate-200/90 bg-slate-50/90 p-3.5 space-y-2.5 shadow-inner">
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 flex items-center justify-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              1-Click Quick Department Logins
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => void performLogin('admin@civicguard.local', 'Admin@1234!')}
                className="sm:col-span-2 flex items-center justify-between rounded-xl border-l-4 border-l-emerald-600 border border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50/70 p-2.5 text-xs font-bold text-slate-800 hover:scale-[1.01] transition-all shadow-2xs group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-700" />
                  <div className="min-w-0 text-left">
                    <div className="font-extrabold text-xs text-emerald-950">System Administrator</div>
                    <div className="text-[10px] text-emerald-700 truncate font-medium">admin@civicguard.local</div>
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-emerald-700 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => void performLogin('council@civicguard.local', 'Council@1234!')}
                className="flex items-center gap-2 rounded-xl border-l-4 border-l-amber-500 border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50/70 p-2.5 text-xs font-bold text-slate-800 hover:scale-[1.01] transition-all shadow-2xs"
              >
                <Building2 className="h-3.5 w-3.5 shrink-0 text-amber-700" />
                <div className="min-w-0 text-left">
                  <div className="font-extrabold text-[11px] text-amber-950 truncate">Municipal Council</div>
                  <div className="text-[10px] text-amber-700 truncate font-medium">council@civicguard.local</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void performLogin('health@civicguard.local', 'Health@1234!')}
                className="flex items-center gap-2 rounded-xl border-l-4 border-l-cyan-500 border border-cyan-200 bg-gradient-to-r from-cyan-50 to-teal-50/70 p-2.5 text-xs font-bold text-slate-800 hover:scale-[1.01] transition-all shadow-2xs"
              >
                <HeartPulse className="h-3.5 w-3.5 shrink-0 text-cyan-700" />
                <div className="min-w-0 text-left">
                  <div className="font-extrabold text-[11px] text-cyan-950 truncate">Public Health</div>
                  <div className="text-[10px] text-cyan-700 truncate font-medium">health@civicguard.local</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void performLogin('roads@civicguard.local', 'Roads@1234!')}
                className="flex items-center gap-2 rounded-xl border-l-4 border-l-blue-500 border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50/70 p-2.5 text-xs font-bold text-slate-800 hover:scale-[1.01] transition-all shadow-2xs"
              >
                <Truck className="h-3.5 w-3.5 shrink-0 text-blue-700" />
                <div className="min-w-0 text-left">
                  <div className="font-extrabold text-[11px] text-blue-950 truncate">Road Dev Auth</div>
                  <div className="text-[10px] text-blue-700 truncate font-medium">roads@civicguard.local</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => void performLogin('waterboard@civicguard.local', 'Water@1234!')}
                className="flex items-center gap-2 rounded-xl border-l-4 border-l-sky-500 border border-sky-200 bg-gradient-to-r from-sky-50 to-cyan-50/70 p-2.5 text-xs font-bold text-slate-800 hover:scale-[1.01] transition-all shadow-2xs"
              >
                <Droplets className="h-3.5 w-3.5 shrink-0 text-sky-700" />
                <div className="min-w-0 text-left">
                  <div className="font-extrabold text-[11px] text-sky-950 truncate">Water Board</div>
                  <div className="text-[10px] text-sky-700 truncate font-medium">waterboard@civicguard.local</div>
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
            <span className="relative bg-white px-3 text-[10px] uppercase tracking-wider text-slate-400 font-extrabold">Or enter credentials</span>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Email Address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  className="input pl-9 text-xs"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin@civicguard.local"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  className="input pl-9 text-xs"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="rounded-xl bg-red-50 p-3 text-center text-xs font-bold text-red-600 border border-red-200">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all disabled:opacity-60"
            >
              {loading ? 'Authenticating...' : t('login')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
