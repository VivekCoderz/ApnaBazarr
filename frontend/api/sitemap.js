// /sitemap.xml for Google: the public pages plus every product that is on sale or
// marked "Coming soon" (hidden products are not returned by the API, so never listed).
const BACKEND_URL = process.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';
const SITE = 'https://dhagaro.vercel.app';

const STATIC_PAGES = [
  { path: '/', priority: '1.0', freq: 'daily' },
  { path: '/shop', priority: '0.9', freq: 'daily' },
  { path: '/recycle', priority: '0.6', freq: 'monthly' },
  { path: '/bulk', priority: '0.6', freq: 'monthly' },
  { path: '/reseller', priority: '0.5', freq: 'monthly' },
  { path: '/track', priority: '0.3', freq: 'yearly' },
  { path: '/shipping', priority: '0.3', freq: 'yearly' },
  { path: '/refunds', priority: '0.3', freq: 'yearly' },
  { path: '/contact', priority: '0.4', freq: 'yearly' },
  { path: '/terms', priority: '0.2', freq: 'yearly' },
  { path: '/privacy', priority: '0.2', freq: 'yearly' }
];

const xmlEscape = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c]));

async function fetchProducts() {
  try {
    const res = await fetch(`${BACKEND_URL}/products`, { signal: AbortSignal.timeout(8000) });
    const json = await res.json();
    return json.success && Array.isArray(json.data) ? json.data : [];
  } catch {
    return []; // backend asleep: still serve the static pages
  }
}

export default async function handler(req, res) {
  const products = await fetchProducts();
  const today = new Date().toISOString().slice(0, 10);
  const categories = [...new Set(products.filter(p => p.isActive !== false).map(p => p.category).filter(Boolean))];

  const urls = [
    ...STATIC_PAGES.map(p => ({ loc: SITE + p.path, priority: p.priority, freq: p.freq, lastmod: today })),
    ...categories.map(c => ({ loc: `${SITE}/shop?category=${encodeURIComponent(c)}`, priority: '0.8', freq: 'weekly', lastmod: today })),
    ...products.filter(p => p.isActive !== false).map(p => ({
      loc: `${SITE}/product/${p.id}`,
      priority: /coming soon/i.test(p.badge || '') ? '0.4' : '0.8',
      freq: 'weekly',
      lastmod: today,
      image: p.image,
      title: p.name
    }))
  ];

  const body = urls.map(u => `  <url>
    <loc>${xmlEscape(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>${u.image ? `
    <image:image><image:loc>${xmlEscape(u.image)}</image:loc><image:title>${xmlEscape(u.title)}</image:title></image:image>` : ''}
  </url>`).join('\n');

  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body}
</urlset>
`);
}
