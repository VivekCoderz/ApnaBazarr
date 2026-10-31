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
export function cloudinaryImage(url, width, extra = 'c_limit') {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  if (/\/upload\/[^/]*(w_|f_auto|q_auto)/.test(url)) return url; // already transformed
  return url.replace('/upload/', `/upload/f_auto,q_auto,${extra},w_${width}/`);
}
