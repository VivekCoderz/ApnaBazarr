// "Buy Now" checks out just that one product (like Amazon/Flipkart) and leaves the cart
// untouched. The item lives in sessionStorage so a refresh on /checkout keeps it.
const KEY = 'dhagaro_buynow';
export const BUY_NOW_PATH = '/checkout?mode=buynow';

export function startBuyNow(product, quantity = 1, opts = {}) {
  const line = {
    ...product,
    quantity,
    customText: opts.customText || '',
    customImage: opts.customImage || '',
    selectedSize: opts.selectedSize || product.selectedSize || product.sizes?.[0] || '',
    selectedColor: opts.selectedColor || product.selectedColor || product.colors?.[0] || '',
  };
  try { sessionStorage.setItem(KEY, JSON.stringify([line])); } catch { /* storage blocked */ }
  memory = [line];
  return BUY_NOW_PATH;
}

let memory = [];

export function getBuyNowItems() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* ignore */ }
  return memory;
}

export function clearBuyNow() {
  memory = [];
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
}
