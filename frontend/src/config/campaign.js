// Homepage campaign (hero + announcement bar). One campaign at a time, picked by date.
// The hero is illustrated (no photo) until the founder has real photos. To use a photo,
// put a Cloudinary URL (4:5, about 1080x1350) in `image`; no code change needed.
// `motif` picks the illustration: 'diya' (Diwali) or 'blanket' (Winter).
// `gridTitle` is the homepage product grid heading while the campaign runs (default "All Products").
// Test another date with ?previewDate=2026-11-09 in the URL.

export const CAMPAIGNS = [
  {
    id: 'diwali-2026',
    start: '2026-10-01T00:00:00+05:30',
    end: '2026-11-08T23:59:59+05:30',
    kicker: 'Diwali, 8 Nov · Straight from Panipat',
    headline: 'Diwali shopping at factory prices',
    subline: 'Suit sets and co-ord sets, straight from Panipat. Pay cash on delivery.',
    offer: 'Free delivery on orders above ₹499',
    image: null,
    motif: 'diya',
    gridTitle: 'Diwali Picks',
    featured: { tag: 'diwali' },
    cta: { label: 'Shop the Diwali collection', tag: 'diwali' },
    secondary: { label: 'Become a reseller and earn from home', to: '/reseller' },
    // 3rd item of the announcement bar until the Diwali cut-off, then the default
    announcementExtra: { text: 'Order by 4 Nov for Diwali delivery', until: '2026-11-04T23:59:59+05:30' }
  },
  {
    id: 'winter-2026',
    start: '2026-11-09T00:00:00+05:30',
    end: '2027-01-31T23:59:59+05:30',
    kicker: 'Winter Special · Panipat blankets',
    headline: 'Winter is here: Panipat blankets at factory prices',
    subline: 'Mink blankets, dohars and bedsheets. Weight and size clearly listed. Cash on delivery.',
    offer: 'Free delivery on orders above ₹499',
    image: null,
    motif: 'blanket',
    featured: { category: 'Kambal & Dohar' },
    cta: { label: 'Shop blankets', category: 'Kambal & Dohar' },
    secondary: { label: 'Suit sets for the wedding season', category: 'Suit Sets' }
  }
];

// Used when no dated campaign is running
const DEFAULT_CAMPAIGN = {
  id: 'default',
  kicker: 'Straight from Panipat',
  headline: 'Panipat quality at factory prices',
  subline: 'Bedsheets, blankets and suit sets, straight from Panipat. Pay cash on delivery.',
  offer: 'Free delivery on orders above ₹499',
  image: null,
  motif: 'weave',
  cta: { label: 'Shop all products', to: '/shop' },
  secondary: { label: 'Become a reseller and earn from home', to: '/reseller' }
};

export const DEFAULT_ANNOUNCEMENT_EXTRA = '7-day easy returns';

// A CTA must lead to at least this many live products, otherwise it falls back to /shop
const MIN_PRODUCTS_FOR_CTA = 4;
const ALL_PRODUCTS_CTA = { label: 'Shop all products', to: '/shop' };

// "Now", or the date from ?previewDate=YYYY-MM-DD (to check a campaign before it starts)
export function getNow() {
  try {
    const preview = new URLSearchParams(window.location.search).get('previewDate');
    if (preview && /^\d{4}-\d{2}-\d{2}$/.test(preview)) {
      return new Date(`${preview}T12:00:00+05:30`);
    }
  } catch { /* ignore */ }
  return new Date();
}

export function getActiveCampaign(now = getNow()) {
  return CAMPAIGNS.find(c => now >= new Date(c.start) && now <= new Date(c.end)) || DEFAULT_CAMPAIGN;
}

export function getAnnouncementItems(now = getNow()) {
  const campaign = getActiveCampaign(now);
  const extra = campaign.announcementExtra;
  const third = extra && now <= new Date(extra.until) ? extra.text : DEFAULT_ANNOUNCEMENT_EXTRA;
  return ['Cash on delivery', 'Free delivery above ₹499', third];
}

const countFor = (link, products) => {
  if (link.tag) {
    const tag = link.tag.toLowerCase();
    return products.filter(p => (p.tags || []).some(t => String(t).toLowerCase() === tag)).length;
  }
  if (link.category) return products.filter(p => p.category === link.category).length;
  return Infinity;
};

const hrefFor = (link) => {
  if (link.to) return link.to;
  if (link.tag) return `/shop?tag=${encodeURIComponent(link.tag)}`;
  return `/shop?category=${encodeURIComponent(link.category)}`;
};

// Link guarded so it never leads to an (almost) empty page. Returns null when it should be hidden.
export function resolveLink(link, products, { fallbackToAll = true } = {}) {
  if (!link) return null;
  if (countFor(link, products) >= MIN_PRODUCTS_FOR_CTA) return { label: link.label, href: hrefFor(link) };
  return fallbackToAll ? { label: ALL_PRODUCTS_CTA.label, href: ALL_PRODUCTS_CTA.to } : null;
}

// Off-season items that are still live until the founder hides them in admin
export const NOT_FOR_HERO = /rakhi|thali|chain/i;
const HERO_PRODUCT_COUNT = 3;

const isOffSeason = (p) => NOT_FOR_HERO.test(`${p.name} ${p.category}`);
const isFeatured = (campaign, p) => Boolean(campaign.featured) && countFor(campaign.featured, [p]) > 0;

// Products shown in the hero: the campaign's tag/category first, then other in-stock items
export function getHeroProducts(campaign, products) {
  const live = products.filter(p => p.inStock !== false && p.image && !isOffSeason(p));
  const featured = live.filter(p => isFeatured(campaign, p));
  const rest = live.filter(p => !featured.includes(p));
  return [...featured, ...rest].slice(0, HERO_PRODUCT_COUNT);
}

// Homepage grid order: campaign-featured first, then in-stock, then out of stock,
// and off-season items (rakhi/thali/chain) last. Stable within each group (API = newest first).
export function sortForHomeGrid(campaign, products) {
  const rank = (p) => {
    if (isOffSeason(p)) return 3;
    if (p.inStock === false || p.stock <= 0) return 2;
    return isFeatured(campaign, p) ? 0 : 1;
  };
  return products
    .map((p, i) => ({ p, i, r: rank(p) }))
    .sort((a, b) => a.r - b.r || a.i - b.i)
    .map(x => x.p);
}

// Everything the hero needs, with the photo fallback and CTA guard applied
export function getHero(products = [], now = getNow()) {
  const campaign = getActiveCampaign(now);
  return {
    id: campaign.id,
    kicker: campaign.kicker,
    headline: campaign.headline,
    subline: campaign.subline,
    offer: campaign.offer,
    products: getHeroProducts(campaign, products),
    image: campaign.image || null,
    motif: campaign.motif || 'weave',
    cta: resolveLink(campaign.cta, products),
    secondary: resolveLink(campaign.secondary, products, { fallbackToAll: false })
  };
}
