// Push alert to the owners' phones when an order comes in, via ntfy.sh (free, no account).
// Set NTFY_TOPIC on Render to a long random name and subscribe to it in the ntfy app.
// Only the order ID, amount, payment type and item names are sent: no customer details.
const NTFY_TOPIC = process.env.NTFY_TOPIC;

function notifyNewOrder(order) {
  if (!NTFY_TOPIC || !order) return;
  const items = (order.items || []).map(i => `${i.quantity} x ${i.name}${i.color ? ` (${i.color})` : ''}`).join(', ');
  const body = `${order.orderId} | Rs ${order.totalAmount} | ${order.paymentMethod}\n${items}`.slice(0, 900);
  fetch(`https://ntfy.sh/${encodeURIComponent(NTFY_TOPIC)}`, {
    method: 'POST',
    headers: { Title: 'New Dhagaro order', Tags: 'package', Priority: 'high', Click: 'https://dhagaro.vercel.app/admin' },
    body
  }).catch(() => { /* an alert failure must never affect the order */ });
}

module.exports = { notifyNewOrder };
