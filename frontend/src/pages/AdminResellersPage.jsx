import { useState, useEffect } from 'react';
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
      setMessage(err.message || 'Could not load resellers.');
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
    setMessage(result.success ? `Commission set to ${result.commissionPercent}%.` : result.message);
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

  const card = 'rounded-lg border border-line bg-white shadow-card';

  return (
    <div className="min-h-screen bg-brand-cream text-ink">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 sm:px-6">
        <button onClick={() => navigate('/admin')} className="-ml-2 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Admin
        </button>
        <span className="text-sm font-semibold text-ink">Reseller payouts</span>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 sm:px-6 space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className={`${card} p-3 sm:p-4`}>
            <p className="text-xs font-medium text-slate-500">Resellers</p>
            <p className="mt-1 text-xl sm:text-2xl font-semibold tabular-nums">{resellers.length}</p>
          </div>
          <div className={`${card} p-3 sm:p-4`}>
            <p className="text-xs font-medium text-slate-500">Payout pending</p>
            <p className="mt-1 text-xl sm:text-2xl font-semibold tabular-nums text-brand-cta">₹{totalPending}</p>
          </div>
          <div className={`${card} col-span-2 sm:col-span-1 p-3 sm:p-4 space-y-2`}>
            <label htmlFor="reseller-commission" className="block text-xs font-medium text-slate-500">Commission %</label>
            <div className="flex gap-2">
              <input
                id="reseller-commission"
                type="number"
                min="0"
                max="50"
                value={commissionPercent}
                onChange={e => setCommissionPercent(e.target.value)}
                className="w-24 min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy"
              />
              <button onClick={saveCommission} className="min-h-10 rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-blue-700 cursor-pointer">
                Save
              </button>
            </div>
          </div>
        </div>

        {message && <p className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-slate-700">{message}</p>}

        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        ) : resellers.length === 0 ? (
          <p className={`${card} flex items-center gap-2 p-4 text-sm text-slate-500`}>
            <Users className="w-4 h-4" /> No resellers yet. Send people the /reseller page link.
          </p>
        ) : (
          resellers.map(r => (
            <div key={r.id} className={`${card} p-4 space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.name} <span className="text-xs font-normal text-slate-500">· {r.code}</span></p>
                  <p className="text-xs text-slate-500 break-all">{r.email}</p>
                  {r.phone && <a href={`tel:${r.phone}`} className="text-xs font-medium text-brand-navy">{r.phone}</a>}
                  <button onClick={() => copyUpi(r.upiId)} className="mt-1 flex min-h-9 items-center gap-1.5 text-xs font-medium text-brand-navy cursor-pointer">
                    UPI: {r.upiId} {copiedUpi === r.upiId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="text-right text-xs text-slate-600">
                  <p>{r.stats.orders} orders · Earned ₹{r.stats.earned}</p>
                  <p className="text-sm font-semibold text-brand-cta">Pending ₹{r.stats.pending}</p>
                </div>
              </div>
              {r.orders.length > 0 && (
                <div className="divide-y divide-line border-t border-line">
                  {r.orders.map(o => (
                    <div key={o.orderId} className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-slate-700">{o.orderId} · ₹{o.totalAmount} · {o.orderStatus}</span>
                      <span className="flex items-center gap-2">
                        <span className="font-semibold tabular-nums">₹{o.commission}</span>
                        {o.payoutStatus === 'paid' ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-semibold text-emerald-700">Paid</span>
                        ) : (
                          <button onClick={() => markPaid(o.orderId)} className="min-h-9 rounded-lg border border-slate-300 bg-white px-3 font-semibold text-ink hover:bg-slate-50 cursor-pointer">
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
