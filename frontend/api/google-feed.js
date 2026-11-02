// Google Merchant Center product feed (RSS 2.0 + g: namespace), served at
// https://dhagaro.vercel.app/feed.xml (vercel.json rewrites /feed.xml here).
//
// Only products a customer can order right now are listed. "Coming soon" and out-of-stock
// products are left out instead of being sent as preorder/out_of_stock: Google requires an
// availability_date for preorder items (we don't have one), and listing items nobody can
// buy only spends ad budget and risks "landing page doesn't allow purchase" disapprovals.
// They appear in the feed automatically once the admin puts them in stock.
/* global process */
const BACKEND_URL = process.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';
const SITE_URL = 'https://dhagaro.vercel.app';
const BRAND = 'Dhagaro';

// Same rule as the store (frontend/src/config/store.js, backend/utils/shipping.js)
const FREE_DELIVERY_ABOVE = 499;
const DELIVERY_CHARGE = 49;

// Admin form's default description; replaced by a generated one
const GENERIC_DESCRIPTION = /^high quality product from (dhagaro|apna bazarr)\.?$/i;

// Google product taxonomy, only where the category is unambiguous. Apparel also gets
// gender/age_group and one item per size (grouped by item_group_id).
const CATEGORY_MAP = {
  'Kambal & Dohar': { google: 'Home & Garden > Linens & Bedding > Bedding > Blankets', type: 'Home > Blankets & Dohars' },
  'Bedsheet': { google: 'Home & Garden > Linens & Bedding > Bedding > Bed Sheets', type: 'Home > Bedsheets' },
  'Cushion & Sofa Cover': { type: 'Home > Cushion & Sofa Covers' },
  'Mats & Table Runner': { type: 'Home > Mats & Table Runners' },
  'Towels': { google: 'Home & Garden > Linens & Bedding > Towels > Bath Towels & Washcloths', type: 'Home > Towels' },
  'Curtains': { google: 'Home & Garden > Decor > Window Treatments > Curtains & Drapes', type: 'Home > Curtains' },
  'Suit Sets': { google: 'Apparel & Accessories > Clothing > Outfit Sets', type: "Women > Suit Sets", apparel: true },
  'Co-ord Sets': { google: 'Apparel & Accessories > Clothing > Outfit Sets', type: 'Women > Co-ord Sets', apparel: true },
  "Women's Wear": { google: 'Apparel & Accessories > Clothing', type: "Women > Women's Wear", apparel: true }
};

const escapeXml = (text) =>
  String(text ?? '')
    // Characters XML 1.0 does not allow
    // eslint-disable-next-line no-control-regex
    .replace(/[^\x09\x0A\x0D\x20-퟿-�\u{10000}-\u{10FFFF}]/gu, '')
    .replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[ch]));

// Same cleanup as displayName() in src/utils/format.js: no emojis, no SHOUTED titles
function cleanName(name) {
  const clean = String(name || '').replace(/[^\p{L}\p{N}\s&+.,'()/-]/gu, '').replace(/\s+/g, ' ').trim();
  const letters = clean.replace(/[^\p{L}]/gu, '');
  if (letters && letters === letters.toUpperCase()) {
    return clean.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());
  }
  return clean;
}

const isComingSoon = (p) => /coming soon/i.test(p.badge || '');
const isOrderable = (p) => p.isActive !== false && p.inStock !== false && !(p.stock <= 0) && !isComingSoon(p);

const money = (amount) => `${Number(amount).toFixed(2)} INR`;

// Absolute image URL (site images are stored as /products/... on this domain)
function absoluteImage(url) {
  if (!url || typeof url !== 'string') return null;
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith('/')) return `${SITE_URL}${url}`;
  return null;
}

function description(p, name) {
  const own = String(p.description || '').trim();
  if (own && !GENERIC_DESCRIPTION.test(own)) return own.slice(0, 5000);
  const parts = [`${name} by ${BRAND}, shipped straight from Panipat.`];
  if (p.sizes && p.sizes.length) parts.push(`Sizes: ${p.sizes.join(', ')}.`);
  parts.push('Cash on delivery available. Free delivery on orders of Rs 499 or more. 7-day returns on damaged, wrong or wrong-size items.');
  return parts.join(' ');
}

function itemXml(p, { id, groupId, size }) {
  const name = cleanName(p.name);
  const map = CATEGORY_MAP[p.category] || {};
  const images = [...new Set([p.image, ...(p.images || [])].map(absoluteImage).filter(Boolean))];
  const onSale = Number(p.originalPrice) > Number(p.price);
  const title = (size && map.apparel ? `${name} - Size ${size}` : name).slice(0, 150);
  const shipping = Number(p.price) >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_CHARGE;

  const fields = [
    ['g:id', id],
    ['g:title', title],
    ['g:description', description(p, name)],
    // A size variant's link opens the product page with that size selected
    ['g:link', `${SITE_URL}/product/${p.id}${groupId && size ? `?size=${encodeURIComponent(size)}` : ''}`],
    ['g:image_link', images[0]],
    ...images.slice(1, 11).map(url => ['g:additional_image_link', url]),
    ['g:availability', 'in_stock'],
    ['g:price', money(onSale ? p.originalPrice : p.price)],
    onSale && ['g:sale_price', money(p.price)],
    ['g:brand', BRAND],
    ['g:condition', 'new'],
    ['g:identifier_exists', 'no'],
    map.google && ['g:google_product_category', map.google],
    ['g:product_type', map.type || p.category],
    groupId && ['g:item_group_id', groupId],
    size && ['g:size', size],
    map.apparel && ['g:gender', 'female'],
    map.apparel && ['g:age_group', 'adult']
  ].filter(Boolean);

  const shippingXml = `
      <g:shipping>
        <g:country>IN</g:country>
        <g:service>Standard</g:service>
        <g:price>${money(shipping)}</g:price>
      </g:shipping>`;

  return `
    <item>${fields.map(([tag, value]) => `
      <${tag}>${escapeXml(value)}</${tag}>`).join('')}${shippingXml}
    </item>`;
}

// One item per product; apparel with several sizes becomes one item per size
function productItems(p) {
  const map = CATEGORY_MAP[p.category] || {};
  const sizes = (p.sizes || []).map(s => String(s).trim()).filter(Boolean);
  if (map.apparel && sizes.length > 1) {
    return sizes.map(size => itemXml(p, { id: `${p.id}_${size.replace(/[^A-Za-z0-9]+/g, '-')}`, groupId: String(p.id), size }));
  }
  return [itemXml(p, { id: String(p.id), size: sizes.length === 1 ? sizes[0] : undefined })];
}

async function fetchProducts() {
  // The free Render server can take ~50 s to wake up
  const res = await fetch(`${BACKEND_URL}/products`, { signal: AbortSignal.timeout(55000) });
  const result = await res.json();
  if (!result.success || !Array.isArray(result.data)) throw new Error('Bad products response');
  return result.data;
}

export default async function handler(req, res) {
  let products;
  try {
    products = await fetchProducts();
  } catch {
    // Never answer with an empty feed: Google would drop every product. A 503 makes
    // Merchant Center keep the last feed and retry.
    res.setHeader('Retry-After', '120');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(503).send('Product feed temporarily unavailable. Please retry.');
  }

  const items = products
    .filter(p => isOrderable(p) && Number(p.price) > 0 && absoluteImage(p.image))
    .flatMap(productItems)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>${BRAND}</title>
    <link>${SITE_URL}</link>
    <description>Home textiles from Panipat and women's suit sets, with cash on delivery.</description>${items}
  </channel>
</rss>
`;

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  return res.status(200).send(xml);
}
