import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Banknote, Truck, RotateCcw } from 'lucide-react';
import { getHero } from '../config/campaign';
import { formatPrice } from '../utils/format';

// Panipat Weave Stripe tile (same as business plan/brand/assets/weave-stripe.svg), repeated horizontally
const WEAVE_TILE = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16"><rect width="32" height="16" fill="#FFFFFF"/><rect width="32" height="5" fill="#0B2A55"/><rect y="7" width="32" height="4" fill="#F47A1F"/><path d="M8 7 L12 9 L8 11 L4 9 Z M24 7 L28 9 L24 11 L20 9 Z" fill="#0B2A55"/><rect y="13" width="32" height="3" fill="#0B2A55"/></svg>'
)}")`;

function WeaveStripe({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`h-4 w-full ${className}`}
      style={{ backgroundImage: WEAVE_TILE, backgroundRepeat: 'repeat-x', backgroundSize: '32px 16px' }}
    />
  );
}

// Small diya (oil lamp) for Diwali mode
function DiyaMotif() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#FFE9D6" />
      {/* flame */}
      <path d="M60 22 C68 36 70 46 60 56 C50 46 52 36 60 22 Z" fill="#F47A1F" />
      <path d="M60 34 C64 42 64 48 60 53 C56 48 56 42 60 34 Z" fill="#FFF8F1" />
      {/* lamp */}
      <path d="M24 62 H96 C94 80 80 92 60 92 C40 92 26 80 24 62 Z" fill="#C2410C" />
      <path d="M24 62 H96" stroke="#0B2A55" strokeWidth="4" strokeLinecap="round" />
      <path d="M38 74 H82" stroke="#FFE9D6" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 6" />
      <rect x="48" y="92" width="24" height="6" rx="3" fill="#0B2A55" />
    </svg>
  );
}

// Folded blanket stack + snowflake for Sardi mode
function BlanketMotif() {
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      <circle cx="60" cy="60" r="56" fill="#FFE9D6" />
      <rect x="22" y="70" width="76" height="16" rx="6" fill="#0B2A55" />
      <rect x="26" y="54" width="68" height="16" rx="6" fill="#F47A1F" />
      <rect x="30" y="38" width="60" height="16" rx="6" fill="#0B2A55" />
      <path d="M30 46 H90 M26 62 H94 M22 78 H98" stroke="#FFF8F1" strokeWidth="2" strokeDasharray="3 5" />
      <g stroke="#0B2A55" strokeWidth="3" strokeLinecap="round" transform="translate(92 24)">
        <path d="M0 -10 V10 M-9 -5 L9 5 M-9 5 L9 -5" />
      </g>
    </svg>
  );
}

function Motif({ type }) {
  if (type === 'diya') return <DiyaMotif />;
  if (type === 'blanket') return <BlanketMotif />;
  return null;
}

// Small, fast Cloudinary thumbnail for hero tiles
const thumb = (url, size) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/w_${size},h_${size},c_fill,q_auto,f_auto/`)
    : url;

function HeroProduct({ product, large = false }) {
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  return (
    <Link
      to={`/product/${product.id}`}
      className={`group relative block overflow-hidden rounded-2xl bg-white shadow-lg ${large ? 'row-span-2' : ''}`}
    >
      <img
        src={thumb(product.image, large ? 640 : 360)}
        alt={product.name}
        loading="eager"
        className="w-full h-full object-cover aspect-square transition-transform duration-300 group-hover:scale-105"
      />
      {discount > 0 && (
        <span className="absolute top-2 left-2 bg-[#B91C1C] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
          {discount}% off
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-brand-navy/90 to-transparent px-3 pt-8 pb-2.5">
        <p className={`text-white font-semibold leading-tight line-clamp-1 text-xs sm:text-sm ${large ? 'lg:text-base' : ''}`}>
          {product.name.replace(/[^\p{L}\p{N}\s&+.,'-]/gu, '').trim()}
        </p>
        <p className="flex items-baseline gap-1.5">
          <span className={`font-heading font-bold text-white text-sm sm:text-base ${large ? 'lg:text-xl' : ''}`}>{formatPrice(product.price)}</span>
          {discount > 0 && <s className="text-[11px] text-white/70">{formatPrice(product.originalPrice)}</s>}
        </p>
      </div>
    </Link>
  );
}

// One date-driven banner (no carousel): offer on the left, real products on the right.
// Copy, dates, featured products and optional photo live in src/config/campaign.js
export default function HeroBanner({ products = [] }) {
  const hero = getHero(products);
  const hasImage = Boolean(hero.image);
  const tiles = hasImage ? [] : hero.products;

  const trustItems = [
    { icon: Banknote, text: 'Cash on Delivery' },
    { icon: Truck, text: '2 din mein dispatch' },
    { icon: RotateCcw, text: '7-din Return' }
  ];

  return (
    <section className="relative bg-brand-navy overflow-hidden">
      <WeaveStripe />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
        <div className={`grid grid-cols-1 items-center gap-6 lg:gap-12 ${hasImage || tiles.length ? 'lg:grid-cols-[52fr_48fr]' : ''}`}>

          {/* Text + offer */}
          <div className="space-y-3 sm:space-y-5 text-left">
            <div className="flex items-center gap-3">
              {hero.motif !== 'weave' && (
                <span className="w-12 h-12 sm:w-16 sm:h-16 shrink-0">
                  <Motif type={hero.motif} />
                </span>
              )}
              <span className="inline-block bg-white/10 text-white text-xs sm:text-sm font-semibold px-3 py-1 rounded-full">
                {hero.kicker}
              </span>
            </div>

            <h1 className="text-[30px] leading-[1.12] sm:text-5xl lg:text-[54px] font-bold text-white tracking-tight max-w-3xl">
              {hero.headline}
            </h1>

            <p className="text-base sm:text-lg text-white/85 leading-relaxed max-w-xl">
              {hero.subline}
            </p>

            {hero.offer && (
              <p className="inline-flex items-center gap-2 bg-brand-orange text-brand-navy font-heading font-bold text-lg sm:text-2xl px-4 py-1.5 rounded-xl">
                <Truck className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2} />
                {hero.offer}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-1">
              {hero.cta && (
                <Link
                  to={hero.cta.href}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-brand-cta hover:bg-brand-cta-hover text-white text-base font-semibold rounded-xl shadow-md transition-colors"
                >
                  <span>{hero.cta.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
              {hero.secondary && (
                <Link
                  to={hero.secondary.href}
                  className="text-white text-sm sm:text-base font-semibold underline underline-offset-4 decoration-brand-orange decoration-2 hover:text-brand-peach"
                >
                  {hero.secondary.label}
                </Link>
              )}
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-3 sm:pt-4 border-t border-white/15">
              {trustItems.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-1.5 text-sm font-semibold text-white/90">
                  <Icon className="w-4 h-4" strokeWidth={1.75} />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Real products with prices: 3 across on mobile, 1 large + 2 small on desktop */}
          {tiles.length > 0 && (
            <div className={`grid gap-2.5 sm:gap-3 ${tiles.length === 3 ? 'grid-cols-3 lg:grid-cols-2 lg:grid-rows-2' : 'grid-cols-2'}`}>
              {tiles.map((product, idx) => (
                <div key={product.id} className={idx === 0 && tiles.length === 3 ? 'lg:row-span-2 [&>a]:h-full' : ''}>
                  <HeroProduct product={product} large={idx === 0 && tiles.length === 3} />
                </div>
              ))}
            </div>
          )}

          {/* Optional campaign photo: below the text on mobile, right column on desktop */}
          {hasImage && (
            <div className="mx-auto w-full max-w-sm sm:max-w-md lg:max-w-none">
              <img
                src={hero.image}
                alt={hero.headline}
                width="1080"
                height="1350"
                fetchpriority="high"
                className="block w-full aspect-[4/5] object-cover rounded-3xl bg-brand-peach"
              />
            </div>
          )}

        </div>
      </div>
      <WeaveStripe />
    </section>
  );
}
