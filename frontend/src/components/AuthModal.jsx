import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';


export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const url = isLogin ? `${BASE_URL}/auth/login` : `${BASE_URL}/auth/signup`;
      const body = isLogin
        ? { email: formData.email, password: formData.password }
        : { name: formData.name, email: formData.email, phone: formData.phone, password: formData.password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Request failed: ${res.status}`);

      if (result.token) {
        localStorage.setItem('apna_token', result.token);
      }

      onAuthSuccess(result.user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Auth Card */}
      <div className="relative bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden z-10 animate-fade-in border border-slate-200 my-auto">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0066cc]">
              Apna Bazarr Account
            </span>
            <h3 className="text-xl font-extrabold text-white">
              {isLogin ? "Welcome Back!" : "Create Your Account"}
            </h3>
            <p className="text-xs text-slate-400">
              {isLogin
                ? "Log in to track orders, save wishlists, and checkout faster."
                : "Sign up for exclusive sales and 10% off your first purchase."}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 mt-6">
            <button
              onClick={() => {
                setIsLogin(true);
                setErrorMessage("");
              }}
              className={`pb-2.5 text-xs font-bold flex-1 text-center transition-colors relative ${
                isLogin
                  ? "text-[#0066cc]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>LOGIN</span>
              {isLogin && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066cc]" />
              )}
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setErrorMessage("");
              }}
              className={`pb-2.5 text-xs font-bold flex-1 text-center transition-colors relative ${
                !isLogin
                  ? "text-[#0066cc]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>SIGN UP</span>
              {!isLogin && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066cc]" />
              )}
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Enter Your Name"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Mobile Number (+91)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="Enter Your Phone Number"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-xs text-red-600 font-semibold">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
            >
              <span>
                {loading
                  ? "PROCESSING..."
                  : isLogin
                    ? "LOG IN TO MY ACCOUNT"
                    : "CREATE ACCOUNT"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
