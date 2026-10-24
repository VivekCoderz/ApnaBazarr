// Serves /product/:id with the product's name, price and photo in the <head>, so links
// shared on WhatsApp/Instagram/Facebook show a rich preview card. The React app still
// renders the page as usual in the browser.
const BACKEND_URL = process.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';

const escapeHtml = (text) =>
  String(text ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// WhatsApp skips preview images that are too large, so ask Cloudinary for a small square JPG
const previewImage = (url) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_600,h_600,c_fill,q_auto,f_jpg/')
    : url;

async function fetchProduct(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/products/${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(4000)
    });
    const result = await res.json();
    return result.success ? result.data : null;
  } catch {
    // Backend asleep or slow — fall back to the default site preview
    return null;
  }
}

export default async function handler(req, res) {
  const origin = `https://${req.headers.host}`;
  const shell = await fetch(`${origin}/index.html`).then((r) => r.text());
  const product = await fetchProduct(req.query.id);

  if (!product) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60');
    return res.status(200).send(shell);
  }

  const title = `${product.name} – ₹${product.price} | Apna Bazarr`;
  const description =
    product.originalPrice && product.originalPrice > product.price
      ? `Only ₹${product.price} (MRP ₹${product.originalPrice}). Straight from Panipat to your home. Cash on delivery available.`
      : `Only ₹${product.price}. Straight from Panipat to your home. Cash on delivery available.`;
  const url = `${origin}/product/${product.id}`;
  const image = previewImage(product.image);

  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Apna Bazarr" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="product:price:amount" content="${escapeHtml(product.price)}" />
    <meta property="product:price:currency" content="INR" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(url)}" />`;

  // Drop the shell's generic title/description/og tags and put the product ones in
  const html = shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/g, '')
    .replace('</head>', `${tags}\n  </head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  return res.status(200).send(html);
}
