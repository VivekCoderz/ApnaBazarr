import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Store, ArrowRight, ShieldCheck, Phone, MapPin, AlignLeft, AlertCircle, ShoppingBag, Landmark } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => '';

export default function RegisterSellerPage({ currentUser, onAuthSuccess }) {
  const navigate = useNavigate();

  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/auth/register-seller`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          shopName,
          shopDescription,
          shopAddress,
          phone
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to register shop');

      if (result.success && result.user) {
        onAuthSuccess(result.user);
        navigate('/seller');
      } else {
        throw new Error('Registration failed');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Something went wrong during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left Pane - Marketing and Info */}
      <div className="lg:w-1/2 bg-slate-900 text-white p-8 lg:p-16 flex flex-col justify-between relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute w-96 h-96 bg-[#0066cc]/10 rounded-full blur-3xl -top-20 -left-20 pointer-events-none" />
        <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -bottom-20 -right-20 pointer-events-none" />

        <div className="relative space-y-4">
          <div className="flex items-center space-x-2.5">
            <span className="bg-[#0066cc]/20 text-[#3b82f6] px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              Apna Bazarr Partner
            </span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight">
            Launch your <span className="text-[#3b82f6]">online store</span> in minutes.
          </h1>
          <p className="text-slate-400 text-sm max-w-md font-medium leading-relaxed">
            Join thousands of merchants selling fashion, craft, electronics, and accessories. Set up shop, upload products, and manage orders effortlessly.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 my-12 lg:my-0">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 bg-[#0066cc]/20 rounded-xl flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-[#3b82f6]" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Unlimited Listings</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">Publish as many items as you want with customization support.</p>
            </div>
          </div>

          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
              <Landmark className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">Direct Earnings</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">Manage cash flows and track order totals directly from dashboard.</p>
            </div>
          </div>
        </div>

        <div className="relative text-xs text-slate-500 font-bold uppercase tracking-wider">
          © Apna Bazarr Multi-Vendor Network
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="lg:w-1/2 p-6 lg:p-16 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl border border-slate-150 relative z-10 space-y-6">
          <div className="space-y-1.5">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Create Seller Profile</h2>
            <p className="text-xs text-slate-400 font-semibold">Tell us about your brand to activate your listing capability.</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop/Brand Name</span>
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Royal Handloom Boutique"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-350 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Shop Description</span>
              </label>
              <textarea
                value={shopDescription}
                onChange={(e) => setShopDescription(e.target.value)}
                placeholder="Briefly describe what products your shop specializes in..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs border border-slate-350 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold text-slate-800 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Support Contact</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-350 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Shop Address / City</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="City, State"
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-350 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold text-slate-800"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs font-semibold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-slate-900 hover:bg-[#0066cc] active:scale-[0.98] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'REGISTERING...' : 'REGISTER & ACCESS SELLER DASHBOARD'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 flex items-center justify-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Secured Apna Bazarr Merchant Authorization</span>
          </div>
        </div>
      </div>
    </div>
  );
}
