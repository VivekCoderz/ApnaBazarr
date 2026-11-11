import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminLoginPage({ onAdminLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await res.json();
      if (result.success) {
        const adminData = result.admin;
        document.cookie = "apna_admin_token=" + adminData.token + "; path=/; max-age=604800; SameSite=Lax";
        onAdminLogin(adminData);
        navigate('/admin');
      } else {
        setErrorMsg(result.message || 'Invalid Admin Email or Password!');
      }
    } catch {
      setErrorMsg('Could not reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-2xl font-bold tracking-tight text-brand-navy">Dhagaro</p>
          <p className="mt-1 text-sm text-slate-500">Admin sign in</p>
        </div>

        <div className="rounded-lg border border-line bg-white p-5 shadow-card sm:p-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-1 block text-xs font-medium text-slate-600">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-email"
                  type="text"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-ink focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-1 block text-xs font-medium text-slate-600">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full min-h-11 rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-ink focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-navy text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60 cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <button type="button" onClick={() => navigate('/')} className="mx-auto mt-4 block min-h-10 text-sm text-slate-500 hover:text-brand-navy cursor-pointer">
          Back to store
        </button>
      </div>
    </div>
  );
}
