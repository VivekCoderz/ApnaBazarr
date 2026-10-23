import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { IndianRupee, Share2, Copy, Check, Wallet, Package, TrendingUp, Clock, Loader2, AlertCircle, Users, Truck, Sparkles } from 'lucide-react';
import { whatsappShareUrl, productShareLink } from '../utils/referral';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function ResellerPage({ currentUser, products = [], onAuthSuccess, onOpenAuth }) {
  const [dashboard, setDashboard] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [joining, setJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState('');

  const code = currentUser?.resellerProfile?.code;
  const loading = Boolean(code) && !dashboard && !errorMsg;

  const loadDashboard = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reseller/me`, { credentials: 'include' });
      const result = await res.json();
      if (result.success) setDashboard(result);
    } catch {
      setErrorMsg('Dashboard load nahi ho paaya. Thodi der baad try karein.');
    }
  };

  useEffect(() => {
    if (code) loadDashboard();
  }, [code]);

  const handleJoin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setJoining(true);
    try {
      const res = await fetch(`${BASE_URL}/reseller/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ upiId, phone })
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      onAuthSuccess(result.user);
    } catch (err) {
      setErrorMsg(err.message || 'Join nahi ho paaya. Dobara try karein.');
    } finally {
      setJoining(false);
    }
  };

  const copyText = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      // Clipboard blocked — user can still long-press the link
    }
  };

  const shareableProducts = products.filter(p => p.inStock !== false);

  // ── Not a reseller yet: pitch + join form ──────────────────────────
  if (!code) {
    return (
      <div className="bg-slate-50 min-h-screen">
        <div className="bg-slate-900 text-white px-4 py-14">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <span className="inline-block bg-emerald-500/20 text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider">
              ApnaBazarr Reseller Program
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Ghar baithe <span className="text-emerald-400">paise kamao</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto">
              Panipat ke blankets, bedsheets aur home decor WhatsApp pe share karo. Har order pe commission seedha aapke UPI mein.
            </p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 -mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: IndianRupee, title: 'Zero investment', text: 'Na stock, na paisa. Bas link share karo.' },
            { icon: Truck, title: 'Delivery hum karenge', text: 'Packing, shipping, COD sab humara kaam.' },
            { icon: Wallet, title: 'UPI pe payment', text: 'Order deliver hote hi commission aapke UPI pe.' }
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 space-y-2">
              <Icon className="w-6 h-6 text-emerald-600" />
              <h3 className="font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-600">{text}</p>
            </div>
          ))}
        </div>

        <div className="max-w-md mx-auto px-4 py-10">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <h2 className="text-xl font-black text-slate-900">Reseller bano (free)</h2>

            {!currentUser ? (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">Shuru karne ke liye pehle login ya sign up karein.</p>
                <button
                  onClick={onOpenAuth}
                  className="w-full py-3 bg-brand-navy hover:bg-blue-700 text-white font-black rounded-xl text-sm"
                >
                  Login / Sign Up
                </button>
              </div>
            ) : (
              <form onSubmit={handleJoin} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">WhatsApp number</span>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    required
                    inputMode="tel"
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-brand-navy"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-bold text-slate-700">UPI ID (commission isme aayega)</span>
                  <input
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    required
                    placeholder="naam@upi"
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-brand-navy"
                  />
                </label>
                {errorMsg && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4" /> {errorMsg}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black rounded-xl text-sm flex items-center justify-center gap-2"
                >
                  {joining && <Loader2 className="w-4 h-4 animate-spin" />}
                  Join karo
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Reseller dashboard ─────────────────────────────────────────────
  const stats = dashboard?.stats || { orders: 0, earned: 0, paid: 0, pending: 0 };
  const storeLink = `${window.location.origin}/?ref=${code}`;

  return (
    <div className="bg-slate-50 min-h-screen px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Reseller Dashboard</p>
            <h1 className="text-2xl font-black">Namaste {currentUser.name} 🙏</h1>
            {dashboard && (
              <p className="text-sm text-slate-300">
                Har order pe aapko <span className="text-emerald-400 font-black">{dashboard.commissionPercent}%</span> commission milega.
              </p>
            )}
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400">Aapka store link · Code: {code}</p>
              <p className="text-sm font-bold truncate">{storeLink}</p>
            </div>
            <button
              onClick={() => copyText(storeLink, 'store')}
              className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shrink-0"
            >
              {copied === 'store' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied === 'store' ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Package, label: 'Orders', value: stats.orders },
            { icon: TrendingUp, label: 'Total kamai', value: `₹${stats.earned}` },
            { icon: Clock, label: 'Milna baaki', value: `₹${stats.pending}` },
            { icon: Wallet, label: 'Mil chuka', value: `₹${stats.paid}` }
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white rounded-2xl p-4 border border-slate-200">
              <Icon className="w-5 h-5 text-brand-navy" />
              <p className="text-2xl font-black text-slate-900 mt-2">{loading ? '…' : value}</p>
              <p className="text-xs text-slate-500 font-bold">{label}</p>
            </div>
          ))}
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Aaj ye products share karo
          </h2>
          {shareableProducts.length === 0 ? (
            <p className="text-sm text-slate-500">Abhi koi product available nahi hai.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {shareableProducts.map(product => (
                <div key={product.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
                  <Link to={`/product/${product.id}`}>
                    <img src={product.image} alt={product.name} className="w-full aspect-square object-cover" loading="lazy" />
                  </Link>
                  <div className="p-3 flex-1 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-800 line-clamp-2">{product.name}</p>
                    <p className="text-sm font-black text-slate-900">
                      ₹{product.price}
                      {dashboard && (
                        <span className="block text-[11px] font-bold text-emerald-600">
                          Aapki kamai ₹{Math.round((product.price * dashboard.commissionPercent) / 100)}
                        </span>
                      )}
                    </p>
                    <div className="mt-auto grid grid-cols-[1fr_auto] gap-1.5">
                      <a
                        href={whatsappShareUrl(product, code)}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 bg-[#25D366] hover:bg-[#1ebe5b] text-white rounded-lg text-[11px] font-black flex items-center justify-center gap-1"
                      >
                        <Share2 className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                      <button
                        onClick={() => copyText(productShareLink(product.id, code), product.id)}
                        title="Link copy karo"
                        className="px-2.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                      >
                        {copied === product.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-navy" /> Aapke orders
          </h2>
          {!dashboard?.orders?.length ? (
            <p className="text-sm text-slate-500 bg-white rounded-2xl border border-slate-200 p-5">
              Abhi tak koi order nahi. Upar se products WhatsApp pe share karo. Pehla order jaldi aayega! 💪
            </p>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
              {dashboard.orders.map(order => (
                <div key={order.orderId} className="p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-900">{order.orderId}</p>
                    <p className="text-xs text-slate-500">
                      {order.customerName}, {order.city} · {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-600 truncate">
                      {order.items.map(i => `${i.name} ×${i.quantity}`).join(', ')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">+₹{order.commission}</p>
                    <p className="text-[11px] font-bold text-slate-500">
                      {order.orderStatus} · {order.payoutStatus === 'paid' ? 'Paid ✅' : 'Pending'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
