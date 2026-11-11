import { useState } from 'react';
import { RefreshCw, Loader2 } from 'lucide-react';
import { Card, PanelHeader, Pill, EmptyState, Sheet } from './AdminUi';
import { btn } from './adminStyles';
import { BASE_URL, adminHeaders } from './adminApi';

// Third-party seller directory. Only shown while SELLER_MARKETPLACE_ENABLED is true.
const STATUS_TONE = { approved: 'green', rejected: 'red', pending: 'orange' };

function Info({ title, children }) {
  return (
    <div>
      <span className="block text-xs text-slate-500">{title}</span>
      <span className="block text-sm font-medium text-ink break-words">{children || 'N/A'}</span>
    </div>
  );
}

export default function SellersPanel({ sellers, loading, commission, onReload }) {
  const [selected, setSelected] = useState(null);

  const updateStatus = async (sellerId, nextStatus) => {
    if (!window.confirm(`Are you sure you want to change seller status to: ${nextStatus}?`)) return;
    try {
      const res = await fetch(`${BASE_URL}/auth/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers: adminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        onReload();
      } else {
        alert(result.message || 'Failed to update seller status.');
      }
    } catch (err) {
      alert('Error updating seller status: ' + err.message);
    }
  };

  return (
    <div className="space-y-4">
      <PanelHeader title="Sellers" note={`Commission: ${commission || '10'}%`}>
        <button type="button" onClick={onReload} className={btn.outline}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </PanelHeader>

      <Card>
        {loading ? (
          <EmptyState><Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-navy" /></EmptyState>
        ) : sellers.length === 0 ? (
          <EmptyState>No sellers registered yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {sellers.map(s => (
              <li key={s.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setSelected(s)} className="min-w-0 text-left cursor-pointer">
                  <p className="text-sm font-semibold text-brand-navy hover:underline">{s.shopName}</p>
                  <p className="text-xs text-slate-500">{s.name} · {s.email}</p>
                  <p className="text-xs text-slate-500">
                    {s.productsCount} products · ₹{Number(s.totalSales || 0).toLocaleString('en-IN')} sales · cut ₹{Number(s.commissionEarned || 0).toLocaleString('en-IN')}
                  </p>
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={STATUS_TONE[s.status || 'approved']}>{s.status || 'approved'}</Pill>
                  {s.phone && <a href={`tel:${s.phone}`} className={btn.ghost}>{s.phone}</a>}
                  {s.status !== 'approved' && <button type="button" onClick={() => updateStatus(s.id, 'approved')} className={btn.outline}>Approve</button>}
                  {s.status !== 'rejected' && <button type="button" onClick={() => updateStatus(s.id, 'rejected')} className={btn.danger}>Reject</button>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {selected && (
        <Sheet title={selected.shopName} onClose={() => setSelected(null)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Info title="Owner">{selected.name}</Info>
              <Info title="Email">{selected.email}</Info>
              <Info title="Phone">{selected.phone}</Info>
              <Info title="Shop address">{selected.shopAddress}</Info>
              <Info title="Pickup pincode">{selected.pickupPincode}</Info>
              <Info title="Return policy">{selected.returnPolicy}</Info>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3">
              <Info title="A/C holder">{selected.bankDetails?.accountName}</Info>
              <Info title="Bank">{selected.bankDetails?.bankName}</Info>
              <Info title="Account no.">{selected.bankDetails?.accountNumber}</Info>
              <Info title="IFSC">{selected.bankDetails?.ifscCode}</Info>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Info title="Products">{String(selected.productsCount ?? 0)}</Info>
              <Info title="Sales">₹{selected.totalSales}</Info>
              <Info title="Admin cut">₹{selected.commissionEarned}</Info>
            </div>
            <div className="flex gap-2">
              {selected.status !== 'approved' ? (
                <button type="button" className={btn.primary} onClick={async () => { await updateStatus(selected.id, 'approved'); setSelected(null); }}>Approve shop</button>
              ) : (
                <button type="button" className={btn.danger} onClick={async () => { await updateStatus(selected.id, 'rejected'); setSelected(null); }}>Suspend shop</button>
              )}
              <button type="button" className={btn.outline} onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </Sheet>
      )}
    </div>
  );
}
