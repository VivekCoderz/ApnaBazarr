import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, Check, Copy } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getCookie('apna_admin_token')}`
});

export default function AdminResellersPage() {
  const navigate = useNavigate();
  const [resellers, setResellers] = useState([]);
  const [commissionPercent, setCommissionPercent] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState('');

  const load = async () => {
    try {
      const res = await fetch(`${BASE_URL}/reseller/admin/all`, { headers: authHeaders() });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      setResellers(result.resellers);
      setCommissionPercent(String(result.commissionPercent));
    } catch (err) {
      setMessage(err.message || 'Resellers load nahi ho paaye.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveCommission = async () => {
    const res = await fetch(`${BASE_URL}/reseller/admin/commission`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ percent: Number(commissionPercent) })
    });
    const result = await res.json();
    setMessage(result.success ? `Commission ${result.commissionPercent}% set ho gaya.` : result.message);
  };

  const markPaid = async (orderId) => {
    const res = await fetch(`${BASE_URL}/reseller/admin/orders/${orderId}/paid`, {
      method: 'PUT',
      headers: authHeaders()
    });
    const result = await res.json();
    if (result.success) load();
    else setMessage(result.message);
  };

  const copyUpi = async (upi) => {
    try {
      await navigator.clipboard.writeText(upi);
      setCopiedUpi(upi);
      setTimeout(() => setCopiedUpi(''), 2000);
    } catch {
      // ignore
    }
  };

  const totalPending = resellers.reduce((acc, r) => acc + r.stats.pending, 0);

  return (
    <div className="bg-slate-900 min-h-screen text-white">
      <div className="px-4 sm:px-6 py-3.5 bg-slate-950 flex items-center justify-between border-b border-slate-800">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-1.5 text-xs font-black text-slate-300 hover:text-white">
          <ArrowLeft className="w-4 h-4 text-amber-400" /> Admin Panel
        </button>
        <span className="text-[10px] font-black tracking-widest uppercase text-amber-400">Reseller Payouts</span>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-bold">Resellers</p>
            <p className="text-2xl font-black">{resellers.length}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-xs text-slate-400 font-bold">Payout baaki</p>
            <p className="text-2xl font-black text-amber-400">₹{totalPending}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4 space-y-2">
            <p className="text-xs text-slate-400 font-bold">Commission %</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="50"
                value={commissionPercent}
                onChange={e => setCommissionPercent(e.target.value)}
                className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-sm font-bold"
              />
              <button onClick={saveCommission} className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-black">
                Save
              </button>
            </div>
          </div>
        </div>

        {message && <p className="text-sm text-amber-300 font-bold">{message}</p>}

        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        ) : resellers.length === 0 ? (
          <p className="text-sm text-slate-400 flex items-center gap-2">
            <Users className="w-4 h-4" /> Abhi koi reseller nahi hai. Unhe /reseller page ka link bhejo.
          </p>
        ) : (
          resellers.map(r => (
            <div key={r.id} className="bg-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black">{r.name} <span className="text-xs text-slate-400">· {r.code}</span></p>
                  <p className="text-xs text-slate-400">{r.email} · 📞 {r.phone}</p>
                  <button onClick={() => copyUpi(r.upiId)} className="text-xs text-emerald-300 font-bold flex items-center gap-1 mt-1">
                    UPI: {r.upiId} {copiedUpi === r.upiId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="text-right text-xs">
                  <p>{r.stats.orders} orders · Kamai ₹{r.stats.earned}</p>
                  <p className="text-amber-400 font-black">Baaki ₹{r.stats.pending}</p>
                </div>
              </div>
              {r.orders.length > 0 && (
                <div className="divide-y divide-slate-700 border-t border-slate-700">
                  {r.orders.map(o => (
                    <div key={o.orderId} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold">{o.orderId} · ₹{o.totalAmount} · {o.orderStatus}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-black text-emerald-300">₹{o.commission}</span>
                        {o.payoutStatus === 'paid' ? (
                          <span className="text-slate-400">Paid ✅</span>
                        ) : (
                          <button onClick={() => markPaid(o.orderId)} className="px-2 py-1 bg-emerald-600 rounded-md font-black">
                            Mark paid
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
