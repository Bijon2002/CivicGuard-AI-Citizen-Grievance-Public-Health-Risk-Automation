import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, User } from 'lucide-react';
import { adminLogin } from '../api';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await adminLogin(username, password);
      localStorage.setItem('isAdminLoggedIn', 'true');
      localStorage.setItem('token', data.access_token);
      navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-night/95 p-8 shadow-glow backdrop-blur-md transition-all hover:border-white/20">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('admin_login')}</h1>
          <p className="mt-2 text-sm text-slate-300">Authenticate to view the dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">{t('username')}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <User className="h-5 w-5" />
              </div>
              <input
                type="text"
                className="input pl-12 focus:border-emerald-400"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-200">{t('password')}</label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                <Lock className="h-5 w-5" />
              </div>
              <input
                type="password"
                className="input pl-12 focus:border-emerald-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
              />
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400 border border-red-500/20">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-full bg-emerald-400 px-6 py-3 font-bold text-night transition hover:scale-105 hover:bg-emerald-300"
          >
            {t('login')}
          </button>
        </form>
      </div>
    </div>
  );
}
