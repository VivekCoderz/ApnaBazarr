import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';

export default function AdminLoginPage({ onAdminLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      // Valid credentials check (admin@apnabazarr.com / admin123 or admin)
      if ((email.toLowerCase() === 'admin@apnabazarr.com' || email.toLowerCase() === 'admin') && (password === 'admin123' || password === 'admin')) {
        const adminData = {
          email: 'admin@apnabazarr.com',
          role: 'admin',
          token: 'apnabazarr_admin_token_2026'
        };
        localStorage.setItem('apna_admin_token', adminData.token);
        onAdminLogin(adminData);
        navigate('/admin');
      } else {
        setErrorMsg('Invalid Admin Email or Password! (Default: admin@apnabazarr.com / admin123)');
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      {/* Glow Effects */}
      <div className="absolute w-96 h-96 bg-[#0066cc]/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden z-10 animate-fade-in border border-slate-700">
        
        {/* Header */}
        <div className="p-8 bg-slate-950 text-white text-center space-y-2 border-b border-slate-800">
          <div className="w-14 h-14 bg-amber-500 text-slate-950 rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white pt-2">Store Admin Portal</h2>
          <p className="text-xs text-slate-400">Single Seller / Owner Security Checkpoint</p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@apnabazarr.com"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Admin Security Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-[#0066cc] text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition-colors flex items-center justify-center space-x-2"
            >
              <span>{loading ? "AUTHENTICATING..." : "LOGIN TO ADMIN DASHBOARD"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Security Note */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 text-center space-y-1">
            <p className="font-bold text-slate-700">🔒 Protected Seller Access</p>
            <p>Default Credentials: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-bold">admin@apnabazarr.com</code> / <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 font-bold">admin123</code></p>
          </div>
        </div>

      </div>
    </div>
  );
}
