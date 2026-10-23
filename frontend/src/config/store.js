// Store-wide facts shown in several places. Keep in sync with the backend
// (backend/utils/shipping.js and backend/utils/cod.js).

export const FREE_DELIVERY_ABOVE = 499;
export const DELIVERY_CHARGE = 49;
export const COD_MAX_AMOUNT = 3000;

export const WHATSAPP_NUMBER = '919306810726';
export const PHONE_DISPLAY = '+91 93068 10726';

// Pre-filled WhatsApp chat link. Keep messages to plain text: emojis outside the
// basic range turn into "�" on WhatsApp Web.
export function whatsappUrl(message = '') {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const RETURN_POLICY_LINE =
  'Kharab, galat ya size galat nikla? 7 din mein return ya exchange, pickup hum karwayenge. Mann badal gaya to sirf exchange.';
