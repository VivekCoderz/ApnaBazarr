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
  'Damaged, wrong item or wrong size? Return or exchange within 7 days and we arrange a free pickup. If you change your mind, we offer an exchange.';

// Shop categories in display order (website plan §6.2). `name` is the value stored on
// the product (admin dropdown); `label` is the English text shown to customers.
export const CATEGORIES = [
  { name: 'Kambal & Dohar', label: 'Blankets & Dohars' },
  { name: 'Bedsheet', label: 'Bedsheets' },
  { name: 'Cushion & Sofa Cover', label: 'Cushion & Sofa Covers' },
  { name: 'Mats & Table Runner', label: 'Mats & Table Runners' },
  { name: 'Suit Sets', label: 'Suit Sets' },
  { name: 'Co-ord Sets', label: 'Co-ord Sets' },
  { name: "Women's Wear", label: "Women's Wear" }
];

export function categoryLabel(name) {
  return CATEGORIES.find(c => c.name === name)?.label || name;
}
