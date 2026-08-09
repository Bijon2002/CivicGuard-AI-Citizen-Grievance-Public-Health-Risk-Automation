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
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-xs transition-all">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-emerald-500/25 shadow-md group-hover:scale-105 transition-transform duration-200">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-black tracking-tight text-slate-900 group-hover:text-emerald-700 transition-colors">
              CivicGuard <span className="text-emerald-600">AI</span>
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-3">
          
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-100/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:border-emerald-300 transition">
            <Globe className="h-3.5 w-3.5 text-emerald-600" />
            <select
              className="cursor-pointer appearance-none bg-transparent pr-1 font-bold text-slate-800 outline-none"
              value={i18n?.language ?? 'en'}
              onChange={(e) => { if (i18n && typeof i18n.changeLanguage === 'function') { i18n.changeLanguage(e.target.value); } }}
            >
              <option value="en">English</option>
              <option value="si">සිංහල</option>
              <option value="ta">தமிழ்</option>
            </select>
          </div>
          
          <div className="hidden sm:block h-4 w-px bg-slate-200" />
          
          {/* Nav Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${
                location.pathname === '/' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="h-3.5 w-3.5" />
              Citizens Portal
            </Link>

            {isLoggedIn ? (
              <>
                <div className="hidden md:flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100/90 px-3 py-1 text-xs font-bold text-slate-700">
                  <User className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{roleLabel}</span>
                  {userDept && <span className="text-slate-400 font-normal">({userDept})</span>}
                </div>

                {!isDashboardPage && (
                  <Link
                    to="/admin/dashboard"
                    className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:from-emerald-500 hover:to-teal-500 transition-all active:scale-95"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50/80 px-3.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 hover:border-red-300 transition-all"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-md ${
                  location.pathname === '/login' || location.pathname === '/admin/login'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/25 ring-2 ring-emerald-500/20'
                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <LogIn className="h-3.5 w-3.5" />
                Official Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
