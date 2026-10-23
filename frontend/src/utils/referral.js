// A reseller's ?ref=CODE is remembered for 30 days so the sale is credited even if
// the customer buys later.
const REF_KEY = 'apna_ref';
const REF_DAYS = 30;

export const captureReferral = (search) => {
  const code = new URLSearchParams(search).get('ref');
  if (!code) return;
  try {
    localStorage.setItem(REF_KEY, JSON.stringify({ code: code.toUpperCase(), at: Date.now() }));
  } catch {
    // Storage blocked — referral just won't be remembered
  }
};

export const getReferral = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(REF_KEY));
    if (saved && Date.now() - saved.at < REF_DAYS * 24 * 60 * 60 * 1000) return saved.code;
  } catch {
    // ignore
  }
  return '';
};

export const productShareLink = (productId, resellerCode) => {
  const url = `${window.location.origin}/product/${productId}`;
  return resellerCode ? `${url}?ref=${resellerCode}` : url;
};

export const whatsappShareUrl = (product, resellerCode) => {
  const lines = [
    `*${product.name}*`,
    product.originalPrice && product.originalPrice > product.price
      ? `Sirf ₹${product.price} (₹${product.originalPrice} ki jagah)`
      : `Sirf ₹${product.price}`,
    'Panipat se seedha aapke ghar 🏠',
    '',
    `Order karein 👉 ${productShareLink(product.id, resellerCode)}`
  ];
  return `https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`;
};
