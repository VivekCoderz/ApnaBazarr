// Admin WhatsApp messages to a customer about their order. Plain text only (no emojis:
// 4-byte characters break on WhatsApp Web), prices as "Rs".
import { whatsappChatUrl, normalizeIndianPhone, SITE_URL } from '../config/store';
import { displayName } from './format';

const rupees = (amount) => `Rs ${Math.round(Number(amount) || 0).toLocaleString('en-IN')}`;

const firstName = (order) => (order.shippingAddress?.fullName || '').trim().split(/\s+/)[0] || 'there';

const isCod = (order) => order.paymentMethod === 'COD';

// Public tracking page with the order prefilled (TrackOrderPage). The 10-digit phone is
// the one on the order, so the link only works for the customer it is sent to.
export function trackingUrl(order) {
  const phone = normalizeIndianPhone(order.shippingAddress?.phone).slice(2);
  const params = new URLSearchParams({ id: order.orderId || '' });
  if (phone) params.set('phone', phone);
  return `${SITE_URL}/track?${params}`;
}

function itemLine(item) {
  const options = [
    item.size && `Size ${item.size}`,
    item.color && item.color !== 'Default' && `Colour ${item.color}`
  ].filter(Boolean);
  const name = displayName(item.name) + (options.length ? ` (${options.join(', ')})` : '');
  return `- ${name} x ${item.quantity} = ${rupees(item.price * item.quantity)}`;
}

function addressLine(address = {}) {
  const parts = [address.flatNo, address.area, address.city, address.state].map(p => (p || '').trim()).filter(Boolean);
  return `${parts.join(', ')}${address.pincode ? ` - ${address.pincode}` : ''}`;
}

function paymentLine(order) {
  if (isCod(order)) return `Payment: Cash on Delivery - please keep ${rupees(order.totalAmount)} ready`;
  if (order.isOffline) return `Payment: ${order.paymentMethod}`;
  return order.paymentStatus === 'Completed' ? 'Payment: Paid online' : `Payment: ${order.paymentMethod}`;
}

export function orderConfirmMessage(order) {
  const items = order.items || [];
  const shipping = items.reduce((sum, item) => sum + (item.shippingCharges || 0), 0);
  const lines = [
    `Hello ${firstName(order)}, thank you for ordering from Dhagaro.`,
    '',
    `Order ID: ${order.orderId}`,
    'Items:',
    ...items.map(itemLine),
    `Delivery: ${shipping > 0 ? rupees(shipping) : 'FREE'}`
  ];
  if (order.voucherDiscount > 0) lines.push(`${order.voucherCode || 'Voucher'} (first order in Panipat): -${rupees(order.voucherDiscount)}`);
  if (order.onlineDiscount > 0) lines.push(`Online payment discount: -${rupees(order.onlineDiscount)}`);
  lines.push(
    `Total: ${rupees(order.totalAmount)}`,
    paymentLine(order),
    '',
    `Delivery address: ${addressLine(order.shippingAddress)}`,
    '',
    `Track your order: ${trackingUrl(order)}`,
    '',
    'Reply YES to confirm your order.'
  );
  return lines.join('\n');
}

export function orderShippedMessage(order) {
  const lines = [
    `Hello ${firstName(order)}, good news! Your Dhagaro order ${order.orderId} has been shipped.`
  ];
  if (order.estimatedDelivery && order.estimatedDelivery !== 'Completed') lines.push(`Expected delivery: ${order.estimatedDelivery}`);
  if (isCod(order)) lines.push(`Amount to pay on delivery: ${rupees(order.totalAmount)} (cash)`);
  lines.push('', `Track your order: ${trackingUrl(order)}`, '', 'Thank you for shopping with Dhagaro.');
  return lines.join('\n');
}

// Hinglish "please review" message after delivery; one signed link per product
// (links come from GET /orders/:orderId/review-links). Plain text, no emojis.
export function reviewRequestMessage(order, links = []) {
  const lines = [
    `Namaste ${firstName(order)}, aapka Dhagaro order ${order.orderId} deliver ho gaya. Kaisa laga?`,
    '1 minute mein review de dijiye, photo ke saath ho to aur achha:'
  ];
  if (links.length === 1) {
    lines.push(links[0].url);
  } else {
    links.forEach(l => lines.push('', `${displayName(l.name)}:`, l.url));
  }
  lines.push('', 'Thank you!');
  return lines.join('\n');
}

// WhatsApp links to the customer's number, or null when the order has no valid Indian mobile
export function orderWhatsappLinks(order) {
  const phone = normalizeIndianPhone(order.shippingAddress?.phone);
  if (!phone) return null;
  return {
    phone,
    confirm: whatsappChatUrl(phone, orderConfirmMessage(order)),
    shipped: whatsappChatUrl(phone, orderShippedMessage(order))
  };
}
