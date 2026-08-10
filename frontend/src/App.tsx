import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import CitizenView from './pages/CitizenView';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 bg-hero-gradient text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      <Navigation />
      <div className="flex-1 w-full max-w-full overflow-x-hidden">
        <Routes>
          <Route path="/" element={<CitizenView />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}
