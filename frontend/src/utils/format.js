// Indian rupee price without paise: 1449 -> "₹1,449"
export function formatPrice(amount) {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString('en-IN')}`;
}

// Clean product title for display: drop emojis/symbols and turn SHOUTED titles into Title Case
// ("🦚 PREMIUM PEACOCK ART 3-PIECE SUIT SET 🦚" -> "Premium Peacock Art 3-Piece Suit Set")
export function displayName(name) {
  const clean = String(name || '').replace(/[^\p{L}\p{N}\s&+.,'()/-]/gu, '').replace(/\s+/g, ' ').trim();
  const letters = clean.replace(/[^\p{L}]/gu, '');
  if (letters && letters === letters.toUpperCase()) {
    return clean.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
  }
  return clean;
}

// Whole-number discount vs MRP: 1150 of 1399 -> 18
export function discountPercent(p) {
  return p.originalPrice > p.price ? Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100) : 0;
}

// Cloudinary delivery transform: smaller, modern-format images for the spot they fill
// (a 1200px JPEG of ~100 KB becomes a ~30 KB WebP at card size). Other URLs pass through.
// Products added ahead of stock carry the badge "Coming soon": shown, but not orderable
export const isComingSoon = (product) => /coming soon/i.test(product?.badge || '');
export const unavailableLabel = (product) => (isComingSoon(product) ? 'Coming soon' : 'Out of stock');
// Can be added to the cart / ordered right now (same rule as the server's unavailableItems)
export const isOrderable = (product) =>
  Boolean(product) && product.inStock !== false && !(product.stock <= 0) && !isComingSoon(product);

// Photos stored in public/products (e.g. "https://dhagaro.vercel.app/products/bedsheet.jpg")
// also exist as resized WebP files: name-480.webp and name-960.webp (bedsheet.jpg is 216 KB,
// its 480px WebP 35 KB). Only these names have variants; any other URL is left alone.
const LOCAL_VARIANTS = new Set(['bedsheet', 'curtains', 'cushion-covers', 'towels']);
export function localImage(url, width) {
  if (!url || typeof url !== 'string') return null;
  const m = url.match(/^(?:https:\/\/dhagaro\.vercel\.app)?\/products\/([a-z0-9-]+)\.jpg$/);
  if (!m || !LOCAL_VARIANTS.has(m[1])) return null;
  return `/products/${m[1]}-${width <= 480 ? 480 : 960}.webp`;
}

export function cloudinaryImage(url, width, extra = 'c_limit') {
  const local = localImage(url, width);
  if (local) return local;
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/[^/]*(w_|f_auto|q_auto)/.test(url)) return url; // already transformed
  return url.replace('/upload/', `/upload/f_auto,q_auto,${extra},w_${width}/`);
}
