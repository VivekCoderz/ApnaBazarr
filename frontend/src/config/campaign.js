import { whatsappUrl } from './store';
import { displayName, formatPrice } from '../utils/format';

// Homepage campaign (hero carousel + announcement bar). One campaign at a time, picked by date.
// The hero is an auto-sliding carousel: each campaign lists its `slides` (see SLIDE_* below).
// The hero is illustrated (no photo) until the founder has real photos. To use a photo,
// put a Cloudinary URL (4:5, about 1080x1350) in `image`; no code change needed.
// `motif` picks the illustration: 'diya' (Diwali) or 'blanket' (Winter).
// `gridTitle` is the homepage product grid heading while the campaign runs (default "All Products").
// Test another date with ?previewDate=2026-11-09 in the URL.


// Hero carousel: time each slide stays before auto-advancing (founder: 2 seconds).
// Autoplay pauses on hover/focus, when the tab is hidden, and is off for reduced motion.
export const AUTOPLAY_MS = 2000;

// ── Hero carousel slides ────────────────────────────────────────────────
// Professional, photo-led banners (no clipart). Slide kinds:
//   products – one banner per live product photo (featured/tagged products first, up to `max`).
//              With a single live product a second, full-bleed crop of the same photo is added.
//   offer | waitlist | reseller – clean typographic banners.
// Any slide may set `bannerImage` (Cloudinary URL, landscape ~1600x700) to use a real banner
// photo full-bleed with a dark gradient behind the text; no code change needed.
// `theme`: navy | light. `hideWhenLive` hides the slide once that category has products.
export const SLIDE_OFFER = {
  id: 'offer',
  kind: 'offer',
  theme: 'navy',
  kicker: 'Free delivery · Cash on Delivery',
  headline: 'Free delivery on orders above ₹499',
  subline: 'Pay in cash when your parcel arrives. Below ₹499, delivery is just ₹49.',
  cta: { label: 'Shop now', to: '/shop' }
};

export const SLIDE_WAITLIST = {
  id: 'waitlist',
  kind: 'waitlist',
  theme: 'light',
  kicker: 'Coming soon',
  headline: 'Panipat blankets and bedsheets are on the way',
  subline: 'Get the first look and launch prices on WhatsApp. No spam.',
  cta: { label: 'Notify me on WhatsApp', whatsapp: 'Hi Dhagaro, please notify me when blankets and bedsheets are available.' },
  hideWhenLive: 'Kambal & Dohar'
};

export const SLIDE_RESELLER = {
  id: 'reseller',
  kind: 'reseller',
  theme: 'light',
  kicker: 'Reseller program',
  headline: 'Earn from home as a Dhagaro reseller',
  subline: 'Share our products on WhatsApp and earn a commission on every order, paid to your UPI.',
  cta: { label: 'Join free', to: '/reseller' }
};

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
    announcementExtra: { text: 'Order by 4 Nov for Diwali delivery', until: '2026-11-04T23:59:59+05:30' },
    slides: [
      {
        id: 'diwali',
        kind: 'products',
        pick: 'any',
        max: 3,
        theme: 'navy',
        kicker: 'Diwali, 8 Nov · Straight from Panipat',
        headline: 'Diwali shopping at factory prices',
        subline: 'Suit sets and co-ord sets from Panipat. Pay cash on delivery.',
        cta: { label: 'Shop the Diwali collection', tag: 'diwali' }
      },
      SLIDE_OFFER,
      SLIDE_WAITLIST,
      SLIDE_RESELLER
    ]
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
    secondary: { label: 'Suit sets for the wedding season', category: 'Suit Sets' },
    slides: [
      {
        id: 'winter',
        kind: 'products',
        pick: 'featured',
        max: 3,
        theme: 'navy',
        kicker: 'Winter Special · Panipat blankets',
        headline: 'Panipat blankets at factory prices',
        subline: 'Mink blankets, dohars and bedsheets. Weight and size clearly listed.',
        cta: { label: 'Shop blankets', category: 'Kambal & Dohar' }
      },
      SLIDE_OFFER,
      SLIDE_WAITLIST,
      SLIDE_RESELLER
    ]
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
  secondary: { label: 'Become a reseller and earn from home', to: '/reseller' },
  slides: [
    {
      id: 'panipat',
      kind: 'products',
      pick: 'any',
      max: 3,
      theme: 'navy',
      kicker: 'Straight from Panipat',
      headline: 'Panipat quality at factory prices',
      subline: 'Bedsheets, blankets and suit sets, straight from Panipat. Pay cash on delivery.',
      cta: { label: 'Shop all products', to: '/shop' }
    },
    SLIDE_OFFER,
    SLIDE_WAITLIST,
    SLIDE_RESELLER
  ]
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

// Hero carousel slides for the active campaign: product banners expanded from live photos,
// CTAs guarded (never lead to an empty page), waitlist hidden once its category is live.
export function getHeroSlides(products = [], now = getNow()) {
  const campaign = getActiveCampaign(now);
  const heroProducts = getHeroProducts(campaign, products);
  const ctaFor = (cta) => cta?.whatsapp
    ? { label: cta.label, href: whatsappUrl(cta.whatsapp), whatsapp: true }
    : resolveLink(cta, products);
  const productCta = (p) => ({ label: 'Buy now', href: `/product/${p.id}` });
  const productCopy = (p) => ({
    kicker: 'New in · Straight from Panipat',
    headline: displayName(p.name),
    subline: `${formatPrice(p.price)} · ${p.price >= 499 ? 'Free delivery' : '₹49 delivery'} · Cash on Delivery`
  });

  const out = [];
  let extra = [];
  (campaign.slides || DEFAULT_CAMPAIGN.slides)
    .filter(slide => !slide.hideWhenLive || !products.some(p => p.category === slide.hideWhenLive))
    .forEach(slide => {
      if (slide.kind !== 'products') {
        out.push({ ...slide, layout: slide.bannerImage ? 'fullbleed' : 'text', image: slide.bannerImage || null, cta: ctaFor(slide.cta) });
        if (extra.length) { out.push(...extra); extra = []; }
        return;
      }
      const pool = slide.pick === 'featured' ? heroProducts.filter(p => isFeatured(campaign, p)) : heroProducts;
      const picks = pool.slice(0, slide.max || 3);
      if (slide.bannerImage || picks.length === 0) {
        // No photo yet (loading, or nothing live): typographic banner with the campaign copy
        out.push({ ...slide, layout: slide.bannerImage ? 'fullbleed' : 'split', image: slide.bannerImage || null, product: picks[0] || null, cta: ctaFor(slide.cta) });
        return;
      }
      out.push({ ...slide, layout: 'split', image: picks[0].image, product: picks[0], cta: ctaFor(slide.cta) });
      // Other live products get their own banner; a single product also gets a full-bleed crop.
      // These are shown after the next slide so photo and text banners alternate.
      extra = picks.length > 1
        ? picks.slice(1).map(p => ({ id: `product-${p.id}`, kind: 'product', theme: 'light', layout: 'split', image: p.image, product: p, ...productCopy(p), cta: productCta(p) }))
        : [{ id: `product-${picks[0].id}-wide`, kind: 'product', theme: 'navy', layout: 'fullbleed', image: picks[0].image, product: picks[0], ...productCopy(picks[0]), cta: productCta(picks[0]) }];
    });
  if (extra.length) out.push(...extra);
  return out;
}
