import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Check, Package, AlertCircle, Search } from 'lucide-react';
import { Section } from '../components/ui/Container';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import { whatsappUrl } from '../config/store';
import { formatPrice, displayName, cloudinaryImage } from '../utils/format';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_TITLE = 'Dhagaro — Panipat se Seedha, Aapke Ghar Tak';

// Same order as the backend Order.orderStatus enum
const STEPS = ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

const isCod = (method) => /cod|cash/i.test(String(method || ''));
const last10 = (value) => String(value || '').replace(/\D/g, '').slice(-10);

const NOT_FOUND = "We couldn't find an order with that ID and phone number.";

// Looks the order up; resolves to { order } or { error }
async function lookupOrder(id, phone) {
  try {
    const params = new URLSearchParams({ orderId: String(id).trim(), phone: last10(phone) });
    const res = await fetch(`${BASE_URL}/orders/track?${params}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) return { error: data.message || NOT_FOUND };
    return { order: data.order };
  } catch {
    return { error: 'Could not connect. Please check your internet and try again.' };
  }
}

function formatDate(value) {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function Timeline({ status }) {
  const current = Math.max(0, STEPS.indexOf(status));
  return (
    <ol className="mt-4 space-y-0">
      {STEPS.map((step, i) => {
        const done = i <= current;
        const isCurrent = i === current;
        return (
          <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
            {i < STEPS.length - 1 && (
              <span
                aria-hidden="true"
                className={`absolute left-[11px] top-6 h-[calc(100%-1.25rem)] w-0.5 ${i < current ? 'bg-brand-cta' : 'bg-slate-200'}`}
              />
            )}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? 'border-brand-cta bg-brand-cta text-white' : 'border-slate-300 bg-white'
              }`}
            >
              {done && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </span>
            <span className={`pt-0.5 text-sm ${isCurrent ? 'font-semibold text-brand-navy' : done ? 'text-ink' : 'text-slate-400'}`}>
              {step}
              {isCurrent && <span className="sr-only"> (current status)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order }) {
  const cod = isCod(order.paymentMethod);
  const paid = !cod && /complete|paid|success/i.test(String(order.paymentStatus || ''));
  const delivered = order.orderStatus === 'Delivered';
  const helpMessage = `Hi Dhagaro, I need help with my order ${order.orderId}.`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs text-slate-500">Order ID</p>
          <p className="font-semibold text-brand-navy">{order.orderId}</p>
          {order.createdAt && <p className="mt-0.5 text-xs text-slate-500">Placed on {formatDate(order.createdAt)}</p>}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            delivered ? 'bg-green-100 text-green-800' : 'bg-orange-50 text-brand-cta'
          }`}
        >
          {order.orderStatus}
        </span>
      </div>

      {order.shippingAddress?.firstName && (
        <p className="mt-3 text-sm text-slate-600">
          Hi {order.shippingAddress.firstName}
          {order.shippingAddress.city ? `, delivering to ${order.shippingAddress.city}` : ''}.
        </p>
      )}

      {!delivered && order.estimatedDelivery && (
        <p className="mt-2 rounded-lg bg-brand-cream px-3 py-2 text-sm text-ink">
          Estimated delivery: <span className="font-semibold">{order.estimatedDelivery}</span>
        </p>
      )}

      <Timeline status={order.orderStatus} />

      <div className="mt-5 border-t border-slate-100 pt-4">
        <h3 className="text-sm font-semibold text-ink">Items</h3>
        <ul className="mt-2 divide-y divide-slate-100">
          {(order.items || []).map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex gap-3 py-2">
              {item.image ? (
                <img
                  src={cloudinaryImage(item.image, 120)}
                  alt=""
                  className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-cream">
                  <Package className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{displayName(item.name)}</p>
                <p className="text-xs text-slate-500">
                  Qty {item.quantity}
                  {item.color ? ` · ${item.color}` : ''}
                  {item.size ? ` · ${item.size}` : ''}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-ink">{formatPrice(item.price * item.quantity)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-sm text-slate-600">
            Total · {cod ? 'Cash on Delivery' : paid ? 'Paid online' : 'Online payment'}
          </span>
          <span className="text-base font-semibold text-brand-navy">{formatPrice(order.totalAmount)}</span>
        </div>
        {cod && !delivered && (
          <p className="mt-1 text-xs text-slate-500">Please keep {formatPrice(order.totalAmount)} ready at delivery.</p>
        )}
      </div>

      <div className="mt-5">
        <Button href={whatsappUrl(helpMessage)} variant="whatsapp" className="w-full sm:w-auto">
          <WhatsAppIcon className="h-4 w-4" />
          Need help? WhatsApp us
        </Button>
      </div>
    </div>
  );
}

export default function TrackOrderPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(() => searchParams.get('id') || '');
  const [phone, setPhone] = useState(() => searchParams.get('phone') || '');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  // Prefilled links (/track?id=XXX&phone=YYYY) look the order up straight away
  const [loading, setLoading] = useState(() => Boolean(searchParams.get('id') && searchParams.get('phone')));
  const autoSubmitted = useRef(false);

  useEffect(() => {
    document.title = 'Track your order — Dhagaro';
    return () => { document.title = DEFAULT_TITLE; };
  }, []);

  const showResult = (result) => {
    setOrder(result.order || null);
    setError(result.error || '');
    setLoading(false);
  };

  useEffect(() => {
    if (autoSubmitted.current) return;
    const id = searchParams.get('id');
    const ph = searchParams.get('phone');
    if (!id || !ph) return;
    autoSubmitted.current = true;
    lookupOrder(id, ph).then(showResult);
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim()) { setError('Please enter your order ID.'); return; }
    if (last10(phone).length !== 10) { setError('Please enter the 10-digit phone number used for the order.'); return; }
    setLoading(true);
    setError('');
    setOrder(null);
    showResult(await lookupOrder(orderId, phone));
  };

  const inputCls = 'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-ink focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/20';

  return (
    <Section tone="cream" containerClass="max-w-xl">
      <SectionHeader
        title="Track your order"
        description="Enter your order ID and the phone number you used at checkout."
      />

      <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium text-ink">
            Order ID
            <input
              type="text"
              value={orderId}
              onChange={e => setOrderId(e.target.value)}
              placeholder="e.g. AB-2026-K7Q2M9"
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={40}
              className={inputCls}
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Phone number
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="10-digit mobile number"
              autoComplete="tel"
              maxLength={16}
              className={inputCls}
            />
          </label>
        </div>
        <Button type="submit" className="mt-4 w-full" disabled={loading}>
          <Search className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Checking…' : 'Track order'}
        </Button>
        <p className="mt-3 text-xs text-slate-500">Your order ID is in the order confirmation and our WhatsApp messages.</p>
      </form>

      <div aria-live="polite" className="mt-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
            <Button
              href={whatsappUrl(`Hi Dhagaro, I want to track my order${orderId.trim() ? ` ${orderId.trim()}` : ''}.`)}
              variant="tertiary"
              size="sm"
              className="mt-1 ml-6"
            >
              Ask us on WhatsApp
            </Button>
          </div>
        )}
        {order && <OrderCard order={order} />}
      </div>
    </Section>
  );
}
