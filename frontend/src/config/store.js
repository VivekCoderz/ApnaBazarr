// Store-wide facts shown in several places. Keep in sync with the backend
// (backend/utils/shipping.js and backend/utils/cod.js).

export const FREE_DELIVERY_ABOVE = 499;
export const DELIVERY_CHARGE = 49;
export const COD_MAX_AMOUNT = 3000;

export const WHATSAPP_NUMBER = '919306810726';
export const PHONE_DISPLAY = '+91 93068 10726';

// Pre-filled WhatsApp chat link. Keep messages to plain text: emojis outside the
// basic range (4-byte characters) turn into "�" on WhatsApp Web, so product names go
// through displayName() first. api.whatsapp.com/send keeps the text intact where wa.me's
// redirect sometimes mangles it.
export function whatsappChatUrl(phone, message = '') {
  // encodeURIComponent (spaces as %20, not "+") like whatsappShareUrl in utils/referral.js
  const base = `https://api.whatsapp.com/send?phone=${encodeURIComponent(phone)}`;
  return message ? `${base}&text=${encodeURIComponent(message)}` : base;
}

export function whatsappUrl(message = '') {
  return whatsappChatUrl(WHATSAPP_NUMBER, message);
}

// Indian mobile number in WhatsApp format (91XXXXXXXXXX), or '' when it doesn't look like one.
// Accepts "+91 98765 43210", "098765 43210", "9876543210", "91-9876543210".
export function normalizeIndianPhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 13 && digits.startsWith('091')) digits = digits.slice(1);
  if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? `91${digits}` : '';
}

// Online (UPI/card via Razorpay) payment discount. Display only: the server applies the
// same rule (backend/utils/payment.js ONLINE_PAYMENT_DISCOUNT) and decides the amount charged.
export const ONLINE_PAYMENT_DISCOUNT = 25;
export const onlineDiscountFor = (orderTotal) => (Number(orderTotal) > ONLINE_PAYMENT_DISCOUNT ? ONLINE_PAYMENT_DISCOUNT : 0);

export const SITE_URL = 'https://dhagaro.vercel.app';

export const SOCIAL_LINKS = [
  { name: 'Instagram', href: 'https://www.instagram.com/dhagaro.in/' },
  { name: 'Facebook', href: 'https://www.facebook.com/dhagaro' },
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/dhagaro/' }
];

export const RETURN_POLICY_LINE =
  'Damaged, wrong item or wrong size? Return or exchange within 7 days and we arrange a free pickup. If you change your mind, we offer an exchange.';

// Shop categories in display order (website plan §6.2). `name` is the value stored on
// the product (admin dropdown); `label` is the English text shown to customers.
export const CATEGORIES = [
  { name: 'Kambal & Dohar', label: 'Blankets & Dohars' },
  { name: 'Bedsheet', label: 'Bedsheets' },
  { name: 'Cushion & Sofa Cover', label: 'Cushion & Sofa Covers' },
  { name: 'Mats & Table Runner', label: 'Bath Mats' },
  { name: 'Towels', label: 'Towels' },
  { name: 'Curtains', label: 'Curtains' },
  { name: 'Suit Sets', label: 'Suit Sets' },
  { name: 'Co-ord Sets', label: 'Co-ord Sets' },
  { name: "Women's Wear", label: "Women's Wear" }
];

export function categoryLabel(name) {
  return CATEGORIES.find(c => c.name === name)?.label || name;
}

// Categories always shown on the homepage/shop, even before they have stock
// (then as "Coming soon" with a WhatsApp notify link). Others appear once they have products.
export const CORE_CATEGORIES = ['Mats & Table Runner', 'Kambal & Dohar', 'Bedsheet', 'Towels', 'Cushion & Sofa Cover'];

// Desktop header nav: the main categories (plus the reseller link)
export const NAV_CATEGORIES = ['Mats & Table Runner', 'Bedsheet', 'Towels', 'Cushion & Sofa Cover'];

export const EMAIL = 'dhagaro.in@gmail.com';

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

// Third-party seller marketplace is switched off for now: Dhagaro sources and checks every
// product itself. The seller pages stay in the code; set to true to bring them back.
export const SELLER_MARKETPLACE_ENABLED = false;
