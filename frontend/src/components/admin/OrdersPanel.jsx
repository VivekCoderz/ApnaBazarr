import { useMemo, useState } from 'react';
import { Phone, Copy, Check, Plus, Search, X } from 'lucide-react';
import WhatsAppIcon from '../ui/WhatsAppIcon';
import { orderWhatsappLinks, reviewRequestMessage } from '../../utils/orderWhatsapp';
import { whatsappChatUrl } from '../../config/store';
import { BASE_URL, adminHeaders } from './adminApi';
import { Card, PanelHeader, Pill, FilterTabs, EmptyState } from './AdminUi';
import { btn, input } from './adminStyles';
import {
  ORDER_FILTERS, ORDER_STATUSES, STATUS_TONE, sortNewestFirst, matchesSearch, rupees, orderDate,
  fullAddress, telHref, paymentLabel
} from './orderUtils';

const PAGE = 30;

// "Ask for review" on delivered orders: fetches signed review links (admin-only endpoint)
// and opens WhatsApp with them. The window is opened on the click itself so popup
// blockers allow it, then pointed at WhatsApp once the links arrive.
function AskReviewButton({ order, phone }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setBusy(true);
    setError('');
    const win = window.open('', '_blank');
    try {
      const res = await fetch(`${BASE_URL}/orders/${encodeURIComponent(order.orderId)}/review-links`, {
        headers: adminHeaders(),
        credentials: 'include'
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.links?.length) throw new Error(data.message || 'Could not create review links.');
      const url = whatsappChatUrl(phone, reviewRequestMessage(order, data.links));
      if (win) win.location.href = url;
      else window.location.href = url;
    } catch (err) {
      if (win) win.close();
      setError(err.message || 'Could not create review links.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={handleClick} disabled={busy} className={btn.outline} title="Ask the customer for a review on WhatsApp">
        <WhatsAppIcon className="h-4 w-4 shrink-0" /> {busy ? 'Opening…' : 'Ask for review'}
      </button>
      {error && <p className="col-span-2 text-xs text-red-700" role="alert">{error}</p>}
    </>
  );
}

// "Confirm on WhatsApp" / "Send shipped update" buttons for one order
function OrderWhatsappActions({ order }) {
  const links = orderWhatsappLinks(order);
  if (!links) {
    return <p className="text-xs text-slate-500">No valid mobile number for WhatsApp.</p>;
  }
  const delivered = order.orderStatus === 'Delivered';
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <a href={links.confirm} target="_blank" rel="noopener noreferrer" className={btn.whatsapp} title="Send order confirmation on WhatsApp">
        <WhatsAppIcon className="h-4 w-4 shrink-0" /> Confirm order
      </a>
      <a href={links.shipped} target="_blank" rel="noopener noreferrer" className={btn.outline} title="Send shipped update on WhatsApp">
        <WhatsAppIcon className="h-4 w-4 shrink-0" /> Shipped msg
      </a>
      {delivered && <AskReviewButton order={order} phone={links.phone} />}
    </div>
  );
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Older phones / http: fall back to a hidden textarea
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

function OrderCard({ order, onUpdateOrderStatus }) {
  const [copied, setCopied] = useState(false);
  const a = order.shippingAddress || {};
  const address = fullAddress(a);
  const pay = paymentLabel(order);
  const status = order.orderStatus || 'Order Placed';
  const units = (order.items || []).reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

  const copyAddress = async () => {
    const text = [a.fullName, a.phone, address].filter(Boolean).join('\n');
    if (await copyText(text)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="overflow-hidden">
      {/* Top: id, date, status */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-slate-50 px-4 py-2.5">
        <div className="min-w-0">
          <span className="text-sm font-semibold text-ink">{order.orderId}</span>
          <span className="ml-2 text-xs text-slate-500">{orderDate(order)}</span>
        </div>
        <Pill tone={STATUS_TONE[status]}>{status}</Pill>
      </div>

      <div className="space-y-3 px-4 py-3">
        {/* Customer */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-base font-semibold text-ink">{a.fullName || 'Customer'}</p>
            {a.phone && (
              <a href={telHref(a.phone)} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-brand-navy hover:bg-slate-50">
                <Phone className="h-4 w-4" /> {a.phone}
              </a>
            )}
          </div>
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0 flex-1 text-sm leading-snug text-slate-600 break-words">{address || 'No address'}</p>
            {address && (
              <button type="button" onClick={copyAddress} className={`${btn.ghost} shrink-0 !px-2.5 text-xs`}>
                {copied ? <><Check className="h-4 w-4 text-emerald-600" /> Copied</> : <><Copy className="h-4 w-4" /> Copy address</>}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Pill tone={pay.tone}>{pay.text}</Pill>
            {order.source && <Pill tone="navy" title="Where this customer came from">From: {order.source}</Pill>}
            {order.resellerCode && <Pill tone="neutral" title="Reseller code used on this order">Reseller: {order.resellerCode}</Pill>}
            {order.isGuest && <Pill tone="neutral">Guest checkout</Pill>}
          </div>
        </div>

        {/* Items */}
        <ul className="divide-y divide-line rounded-lg border border-line">
          {(order.items || []).map((item, i) => {
            const size = item.size || item.selectedSize;
            const color = item.color || item.selectedColor;
            return (
              <li key={i} className="flex gap-3 p-2.5">
                {item.image ? (
                  <img src={item.image} alt="" loading="lazy" className="h-12 w-12 shrink-0 rounded border border-line bg-slate-50 object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium text-ink">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {[
                      color && color !== 'Default' && `Colour: ${color}`,
                      size && `Size: ${size}`,
                      `Qty ${item.quantity}`,
                      `${rupees(item.price)} each`
                    ].filter(Boolean).join(' · ')}
                  </p>
                  {(item.customText || item.customImage) && (
                    <div className="mt-1.5 space-y-1 rounded bg-amber-50 px-2 py-1.5 text-xs text-slate-700">
                      {item.customText && <p><span className="text-slate-500">Custom text: </span>"{item.customText}"</p>}
                      {item.customImage && (
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-500">Custom photo:</span>
                          <img src={item.customImage} alt="Customer upload" className="h-6 w-6 rounded border object-cover" />
                          <a href={item.customImage} target="_blank" rel="noreferrer" className="font-medium text-brand-navy underline">Open</a>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-sm font-medium tabular-nums text-ink">{rupees(item.price * item.quantity)}</span>
              </li>
            );
          })}
        </ul>

        {/* Total */}
        <div className="flex items-end justify-between gap-3">
          <span className="text-xs text-slate-500">{units} unit{units === 1 ? '' : 's'}</span>
          <div className="text-right">
            {order.onlineDiscount > 0 && <p className="text-xs text-emerald-700">Online discount −{rupees(order.onlineDiscount)}</p>}
            <p className="text-xs text-slate-500">{order.paymentMethod === 'COD' ? 'To collect (COD)' : 'Amount paid'}</p>
            <p className="text-lg font-semibold tabular-nums text-brand-navy">{rupees(order.totalAmount)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <OrderWhatsappActions order={order} />
          <label className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-600">Status</span>
            <select
              value={status}
              onChange={(e) => onUpdateOrderStatus(order.orderId, e.target.value)}
              className={`${input} w-auto flex-1 font-medium sm:w-48 sm:flex-none`}
            >
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
        </div>
      </div>
    </Card>
  );
}

export default function OrdersPanel({ orders, filter, onFilterChange, search, onSearchChange, onUpdateOrderStatus, onAddOfflineOrder }) {
  const [limit, setLimit] = useState(PAGE);

  const sorted = useMemo(() => sortNewestFirst(orders), [orders]);
  const searched = useMemo(() => sorted.filter(o => matchesSearch(o, search)), [sorted, search]);

  const tabs = ORDER_FILTERS.map(f => ({
    id: f.id,
    label: f.label,
    count: f.statuses ? searched.filter(o => f.statuses.includes(o.orderStatus || 'Order Placed')).length : searched.length
  }));
  const active = ORDER_FILTERS.find(f => f.id === filter) || ORDER_FILTERS[0];
  const list = active.statuses ? searched.filter(o => active.statuses.includes(o.orderStatus || 'Order Placed')) : searched;
  const shown = list.slice(0, limit);

  return (
    <div className="space-y-4">
      <PanelHeader title="Orders" note={`${orders.length} orders in total, newest first`}>
        <button type="button" onClick={onAddOfflineOrder} className={btn.primary}>
          <Plus className="h-4 w-4" /> Offline order
        </button>
      </PanelHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => { onSearchChange(e.target.value); setLimit(PAGE); }}
          placeholder="Search order ID, name or phone"
          className={`${input} pl-9 pr-10`}
        />
        {search && (
          <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search" className="absolute right-0 top-0 inline-flex h-10 w-10 items-center justify-center text-slate-400 hover:text-ink cursor-pointer">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <FilterTabs tabs={tabs} active={active.id} onChange={(id) => { onFilterChange(id); setLimit(PAGE); }} />

      {list.length === 0 ? (
        <Card><EmptyState>{orders.length === 0 ? 'No orders yet.' : 'No orders match.'}</EmptyState></Card>
      ) : (
        <div className="space-y-3">
          {shown.map(o => <OrderCard key={o.orderId || o._id} order={o} onUpdateOrderStatus={onUpdateOrderStatus} />)}
          {list.length > shown.length && (
            <button type="button" onClick={() => setLimit(l => l + PAGE)} className={`${btn.outline} w-full`}>
              Show more ({list.length - shown.length} left)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
