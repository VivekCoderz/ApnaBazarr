// Homepage campaign (hero + announcement bar). One campaign at a time, picked by date.
// The hero is illustrated (no photo) until the founder has real photos. To use a photo,
// put a Cloudinary URL (4:5, about 1080x1350) in `image`; no code change needed.
// `motif` picks the illustration: 'diya' (Diwali) or 'blanket' (Sardi).
// Test another date with ?previewDate=2026-11-09 in the URL.

export const CAMPAIGNS = [
  {
    id: 'diwali-2026',
    start: '2026-10-01T00:00:00+05:30',
    end: '2026-11-08T23:59:59+05:30',
    kicker: 'Diwali 8 Nov · Panipat se Seedha',
    headline: 'Diwali ki Shopping, Factory Daam pe',
    subline: 'Suit sets aur co-ord sets, seedha Panipat se. Ghar pe paise dein (COD).',
    offer: '₹499+ par FREE Delivery',
    image: null,
    motif: 'diya',
    featured: { tag: 'diwali' },
    cta: { label: 'Diwali Collection Dekhein', tag: 'diwali' },
    secondary: { label: 'Reseller baniye, ghar baithe kamaayein', to: '/reseller' },
    // 3rd item of the announcement bar until the Diwali cut-off, then the default
    announcementExtra: { text: 'Diwali orders 4 Nov tak bhejein', until: '2026-11-04T23:59:59+05:30' }
  },
  {
    id: 'sardi-2026',
    start: '2026-11-09T00:00:00+05:30',
    end: '2027-01-31T23:59:59+05:30',
    kicker: 'Sardi Special · Panipat ke Kambal',
    headline: 'Sardi aa gayi — Panipat ke Kambal, Factory Daam pe',
    subline: 'Mink blanket, dohar aur bedsheet. Weight aur size saaf likha hai. Cash on Delivery.',
    offer: '₹499+ par FREE Delivery',
    image: null,
    motif: 'blanket',
    featured: { category: 'Kambal & Dohar' },
    cta: { label: 'Kambal Dekhein', category: 'Kambal & Dohar' },
    secondary: { label: 'Shaadi season ke Suit Sets', category: 'Suit Sets' }
  }
];

// Used when no dated campaign is running
const DEFAULT_CAMPAIGN = {
  id: 'default',
  kicker: 'Panipat se Seedha, Aapke Ghar Tak',
  headline: 'Panipat ka Maal, Factory Daam pe',
  subline: 'Bedsheet, kambal aur suit sets — seedha Panipat se. Ghar pe paise dein (COD).',
  offer: '₹499+ par FREE Delivery',
  image: null,
  motif: 'weave',
  cta: { label: 'Sab Products Dekhein', to: '/shop' },
  secondary: { label: 'Reseller baniye, ghar baithe kamaayein', to: '/reseller' }
};


export const DEFAULT_ANNOUNCEMENT_EXTRA = '7-din Easy Return';

// A CTA must lead to at least this many live products, otherwise it falls back to /shop
const MIN_PRODUCTS_FOR_CTA = 4;
const ALL_PRODUCTS_CTA = { label: 'Sab Products Dekhein', to: '/shop' };

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
  return ['Cash on Delivery', '₹499+ par Free Delivery', third];
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
const NOT_FOR_HERO = /rakhi|thali|chain/i;
const HERO_PRODUCT_COUNT = 3;

// Products shown in the hero: the campaign's tag/category first, then other in-stock items
export function getHeroProducts(campaign, products) {
  const live = products.filter(p => p.inStock !== false && p.image && !NOT_FOR_HERO.test(`${p.name} ${p.category}`));
  const featured = campaign.featured ? live.filter(p => countFor(campaign.featured, [p]) > 0) : [];
  const rest = live.filter(p => !featured.includes(p));
  return [...featured, ...rest].slice(0, HERO_PRODUCT_COUNT);
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
