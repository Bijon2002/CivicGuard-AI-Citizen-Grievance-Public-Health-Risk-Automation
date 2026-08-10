import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShieldAlert, LogOut, LayoutDashboard, LogIn, Home, User, Shield, HeartPulse } from 'lucide-react';

export default function Navigation() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';
  const isDashboardPage = location.pathname.startsWith('/admin/dashboard');
  const userRole = localStorage.getItem('userRole') ?? '';
  const userDept = localStorage.getItem('userDepartmentName') ?? '';

  const handleLogout = () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userDepartmentId');
    localStorage.removeItem('userDepartmentName');
    navigate('/login');
  };

  const roleLabel = userRole === 'admin' ? 'Admin' : userRole === 'health_official' ? 'Health Officer' : userRole === 'officer' ? 'Officer' : '';

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl shadow-xs transition-all pt-safe w-full max-w-full overflow-x-hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-2 sm:px-6 lg:px-8 w-full">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-white border border-slate-200/80 shadow-xs group-hover:scale-105 transition-transform duration-200 shrink-0 overflow-hidden p-0.5">
            <img 
              src="/image.png" 
              alt="CivicGuard AI Logo" 
              className="h-full w-full object-contain rounded-lg" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }} 
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              CivicGuard <span className="text-emerald-600 hidden xs:inline">AI</span>
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1 rounded-full border border-slate-200/80 bg-slate-100/80 px-2 sm:px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 transition shrink-0">
            <Globe className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <select
              className="cursor-pointer appearance-none bg-transparent pr-1 font-bold text-slate-800 outline-none text-xs"
              value={i18n?.language ?? 'en'}
              onChange={(e) => { if (i18n && typeof i18n.changeLanguage === 'function') { i18n.changeLanguage(e.target.value); } }}
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
          
          <div className="hidden md:block h-4 w-px bg-slate-200" />
          
          {/* Nav Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/"
              title="Citizens Portal"
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3.5 py-1.5 text-xs font-bold transition-all ${
                location.pathname === '/' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Citizens Portal</span>
            </Link>

            {isLoggedIn ? (
              <>
                <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/90 px-3 py-1 text-xs font-bold text-slate-700">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{roleLabel}</span>
                  {userDept && <span className="text-slate-400 font-normal">({userDept})</span>}
                </div>

                {!isDashboardPage && (
                  <Link
                    to="/admin/dashboard"
                    title="Dashboard"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    <span className="hidden md:inline">Dashboard</span>
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                title="Official Login"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 sm:px-4 py-1.5 text-xs font-bold transition-all shadow-md ${
                  location.pathname === '/login' || location.pathname === '/admin/login'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Official Login</span>
                <span className="md:hidden text-[11px]">Login</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
