import { normalizeIndianPhone } from '../../config/store';

// Statuses the backend accepts for an order (backend/controllers/order.js ORDER_STATUSES)
export const ORDER_STATUSES = ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];

// Filter tabs on the Orders screen, each covering one or more backend statuses
export const ORDER_FILTERS = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'new', label: 'New', statuses: ['Order Placed'] },
  { id: 'processing', label: 'Confirmed', statuses: ['Processing', 'Packed'] },
  { id: 'shipped', label: 'Shipped', statuses: ['Shipped', 'Out for Delivery'] },
  { id: 'delivered', label: 'Delivered', statuses: ['Delivered'] }
];

export const STATUS_TONE = {
  'Order Placed': 'orange',
  Processing: 'navy',
  Packed: 'navy',
  Shipped: 'neutral',
  'Out for Delivery': 'neutral',
  Delivered: 'green'
};

export const isNewOrder = (o) => (o.orderStatus || 'Order Placed') === 'Order Placed';
export const isCodOrder = (o) => o.paymentMethod === 'COD';

export const orderTime = (o) => {
  const t = new Date(o.createdAt || 0).getTime();
  return Number.isFinite(t) ? t : 0;
};

export const sortNewestFirst = (orders) => [...orders].sort((a, b) => orderTime(b) - orderTime(a));

export function isToday(o) {
  if (!o.createdAt) return false;
  const d = new Date(o.createdAt);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export const rupees = (amount) => `₹${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

export function orderDate(o) {
  if (!o.createdAt) return '';
  return new Date(o.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

export function fullAddress(a = {}) {
  const parts = [a.flatNo, a.area, a.city, a.state].map(p => (p || '').trim()).filter(Boolean);
  return `${parts.join(', ')}${a.pincode ? ` - ${a.pincode}` : ''}`;
}

// tel: link that dials Indian mobiles with +91, anything else as typed
export function telHref(phone) {
  const n = normalizeIndianPhone(phone);
  return n ? `tel:+${n}` : `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

// Channel for the "orders by source" count: the utm_source part of "fb_marketplace / social / camp"
export function sourceChannel(o) {
  const s = String(o.source || '').trim().toLowerCase();
  if (!s) return o.isOffline ? 'offline' : 'not tracked';
  return s.split('/')[0].trim() || 'direct';
}

export function paymentLabel(o) {
  if (o.isOffline) return { text: `Offline · ${o.paymentMethod}`, tone: 'neutral' };
  if (isCodOrder(o)) return { text: 'COD', tone: 'orange' };
  return { text: 'Paid online', tone: 'green' };
}

export function matchesSearch(o, q) {
  if (!q) return true;
  const query = q.trim().toLowerCase();
  if (!query) return true;
  const a = o.shippingAddress || {};
  const digits = query.replace(/\D/g, '');
  return (
    String(o.orderId || '').toLowerCase().includes(query) ||
    String(a.fullName || '').toLowerCase().includes(query) ||
    (digits.length >= 3 && String(a.phone || '').replace(/\D/g, '').includes(digits))
  );
}
