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

// The product page's main photo, exactly as ProductDetailPage requests it
// (cloudinaryImage(url, 900) in src/utils/format.js), so the browser can start downloading
// it with the HTML instead of after the JS and the catalogue have loaded.
const pageImage = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return null;
  if (/\/upload\/[^/]*(w_|f_auto|q_auto)/.test(url)) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto,c_limit,w_900/');
};

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

  const title = `${product.name} – ₹${product.price} | Dhagaro`;
  // First sentence of the description, cut at a word boundary (never mid-word)
  const firstLine = (() => {
    const s = String(product.description || '').split('\n')[0].trim().split(/(?<=\.)\s/)[0];
    return s.length <= 110 ? s : s.slice(0, 110).replace(/\s+\S*$/, '') + '…';
  })();
  const priceLine = product.originalPrice && product.originalPrice > product.price
    ? `Only ₹${product.price} (MRP ₹${product.originalPrice}).`
    : `Only ₹${product.price}.`;
  const description = `${firstLine ? firstLine + ' ' : ''}${priceLine} Straight from Panipat, cash on delivery, 7-day easy returns.`.slice(0, 200);
  const url = `${origin}/product/${product.id}`;
  const image = previewImage(product.image);
  const heroImage = pageImage(product.images && product.images.length > 0 ? product.images[0] : product.image);

  // Google rich results: price, stock, returns, delivery and (only real) ratings
  const comingSoon = /coming soon/i.test(product.badge || '');
  const inStock = !comingSoon && product.inStock !== false && !(product.stock <= 0);
  const freeShipping = product.price >= 499 || (product.tags || []).includes('free-delivery');
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        name: product.name,
        image: (product.images && product.images.length ? product.images : [product.image]).filter(Boolean).slice(0, 6),
        description: String(product.description || description).slice(0, 1000),
        sku: String(product.id),
        brand: { '@type': 'Brand', name: 'Dhagaro' },
        category: product.category,
        offers: {
          '@type': 'Offer',
          url,
          priceCurrency: 'INR',
          price: String(product.price),
          priceValidUntil: new Date(Date.now() + 90 * 864e5).toISOString().slice(0, 10),
          itemCondition: 'https://schema.org/NewCondition',
          availability: comingSoon ? 'https://schema.org/PreOrder' : inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: { '@type': 'Organization', name: 'Dhagaro' },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IN',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 7,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/FreeReturn'
          },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
            shippingRate: { '@type': 'MonetaryAmount', value: freeShipping ? '0' : '49', currency: 'INR' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 2, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 6, unitCode: 'DAY' }
            }
          }
        },
        ...(product.reviewsCount > 0 && product.rating
          ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: String(product.rating), reviewCount: String(product.reviewsCount) } }
          : {})
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: product.category || 'Shop', item: `${origin}/shop?category=${encodeURIComponent(product.category || '')}` },
          { '@type': 'ListItem', position: 3, name: product.name, item: url }
        ]
      }
    ]
  };
  const ldJson = JSON.stringify(ld).replace(/</g, '\\u003c');

  const tags = `
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="Dhagaro" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:width" content="600" />
    <meta property="og:image:height" content="600" />
    <meta property="product:price:amount" content="${escapeHtml(product.price)}" />
    <meta property="product:price:currency" content="INR" />
    <meta name="twitter:card" content="summary_large_image" />
    <link rel="canonical" href="${escapeHtml(url)}" />
    <script type="application/ld+json">${ldJson}</script>${heroImage ? `
    <link rel="preload" as="image" href="${escapeHtml(heroImage)}" fetchpriority="high" />` : ''}`;

  // Drop the shell's generic title/description/og tags and put the product ones in
  const html = shell
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta (name="description"|property="og:[^"]*"|name="twitter:[^"]*")[^>]*>\s*/g, '')
    .replace(/<link rel="canonical"[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>\s*/g, '')
    .replace('</head>', `${tags}\n  </head>`);

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=86400');
  return res.status(200).send(html);
}
