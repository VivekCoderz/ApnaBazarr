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

// Categories always shown on the homepage/shop, even before they have stock
// (then as "Coming soon" with a WhatsApp notify link). Others appear once they have products.
export const CORE_CATEGORIES = ['Kambal & Dohar', 'Bedsheet', 'Cushion & Sofa Cover', 'Suit Sets', 'Co-ord Sets'];

// Desktop header nav: the main categories (plus the reseller link)
export const NAV_CATEGORIES = ['Kambal & Dohar', 'Bedsheet', 'Suit Sets', 'Co-ord Sets'];

export const EMAIL = 'appnabaazar@gmail.com';

export function notifyMeUrl(label) {
  return whatsappUrl(`Hi Dhagaro, please notify me when ${label} are available.`);
}

export const categoryHref = (name) => `/shop?category=${encodeURIComponent(name)}`;

// Category tiles: live categories first, then the core ones that are "coming soon"
export function categoryTiles(products = []) {
  const counts = {};
  products.forEach(p => {
    const cat = p.category?.trim();
    if (cat) counts[cat] = (counts[cat] || 0) + 1;
  });
  const known = CATEGORIES.filter(c => counts[c.name] || CORE_CATEGORIES.includes(c.name));
  const others = Object.keys(counts)
    .filter(name => !CATEGORIES.some(c => c.name === name))
    .map(name => ({ name, label: name }));
  return [...known, ...others]
    .map(c => ({ ...c, count: counts[c.name] || 0 }))
    .sort((a, b) => (b.count > 0) - (a.count > 0));
}
