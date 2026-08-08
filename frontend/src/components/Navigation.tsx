import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, ShieldAlert, User } from 'lucide-react';

export default function Navigation() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1020]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 transition hover:opacity-80">
          <ShieldAlert className="h-6 w-6 text-emerald-400" />
          <span className="text-xl font-black tracking-tight text-white">{t('app_title')}</span>
        </Link>
        
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
            <Globe className="h-4 w-4 text-slate-400" />
            <select
              className="cursor-pointer appearance-none bg-transparent pr-4 text-sm font-medium text-slate-200 outline-none"
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en" className="bg-[#0b1020]">English</option>
              <option value="si" className="bg-[#0b1020]">සිංහල</option>
              <option value="ta" className="bg-[#0b1020]">தமிழ்</option>
            </select>
          </div>
          
          <div className="h-6 w-px bg-white/10" />
          
          {isAdmin ? (
            <Link to="/" className="text-sm font-semibold text-slate-300 hover:text-white transition">
              {t('nav_citizen')}
            </Link>
          ) : (
            <Link to="/admin/login" className="flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition">
              <User className="h-4 w-4" />
              {t('nav_admin')}
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
