import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Banknote, Truck, Heart, ArrowRight, PackageCheck } from 'lucide-react';
import { formatPrice, displayName, discountPercent } from '../utils/format';
import { FREE_DELIVERY_ABOVE, DELIVERY_CHARGE, categoryLabel } from '../config/store';
import Button from './ui/Button';
import Badge from './ui/Badge';

// Cloudinary resize for large spotlight images
const sized = (url, w) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/w_${w},c_limit,q_auto,f_auto/`)
    : url;

// Large "featured" layout used on the homepage when only 1–3 products are live,
// so a single product looks intentional instead of a lonely small card.
export default function ProductSpotlight({ product, onAddToCart, onToggleWishlist, isWishlisted = false }) {
  const navigate = useNavigate();
  const sizes = product.sizes || [];
  const [size, setSize] = useState(sizes[0] || '');
  const isOutOfStock = product.inStock === false || product.stock <= 0;
  // Customizable products need input on the product page first
  const canQuickBuy = !isOutOfStock && !product.isCustomizable && Boolean(onAddToCart);
  const off = discountPercent(product);
  const freeDelivery = product.price >= FREE_DELIVERY_ABOVE;
  const href = `/product/${product.id}`;

  const buyNow = () => {
    if (!canQuickBuy) return navigate(href);
    onAddToCart(product, 1, { selectedSize: size });
    navigate('/checkout');
  };

  return (
    <article className="grid overflow-hidden rounded-lg border border-line bg-white shadow-card md:grid-cols-2">
      <Link to={href} className="group relative block aspect-[4/5] overflow-hidden bg-brand-cream md:aspect-auto md:min-h-[480px]">
        <img
          src={sized(product.image, 900)}
          alt={displayName(product.name)}
          loading="lazy"
          width="900"
          height="1000"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 z-10 flex flex-col items-start gap-1.5">
          {off > 0 && <Badge tone="sale">{off}% off</Badge>}
        </span>
      </Link>

      <div className="flex flex-col justify-center gap-5 p-5 sm:p-8 lg:p-12">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="new">Featured</Badge>
            <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="text-sm font-semibold text-slate-600 hover:text-brand-navy">
              {categoryLabel(product.category)}
            </Link>
          </div>
          <h3 className="text-2xl font-semibold leading-tight text-brand-navy sm:text-2xl">
            <Link to={href} className="hover:text-brand-cta">{displayName(product.name)}</Link>
          </h3>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-3xl font-semibold text-brand-cta sm:text-4xl">{formatPrice(product.price)}</span>
          {off > 0 && (
            <>
              <s className="text-base text-slate-500">{formatPrice(product.originalPrice)}</s>
              <span className="text-sm font-semibold text-emerald-700">You save {formatPrice(product.originalPrice - product.price)}</span>
            </>
          )}
        </div>

        <ul className="flex flex-wrap gap-x-5 gap-y-2 border-y border-line py-3 text-sm">
          <li className="inline-flex items-center gap-1.5 font-medium text-emerald-700">
            <Banknote className="h-4 w-4" aria-hidden="true" /> Cash on Delivery
          </li>
          <li className="inline-flex items-center gap-1.5 text-slate-700">
            <Truck className="h-4 w-4" aria-hidden="true" /> {freeDelivery ? 'Free delivery' : `₹${DELIVERY_CHARGE} delivery`}
          </li>
          <li className="inline-flex items-center gap-1.5 text-slate-700">
            <PackageCheck className="h-4 w-4" aria-hidden="true" /> Ships in 2 days
          </li>
        </ul>

        {sizes.length > 0 && canQuickBuy && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">Select size</legend>
            <div className="flex flex-wrap gap-2">
              {sizes.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  aria-pressed={size === s}
                  className={`min-h-11 min-w-12 rounded-md border px-4 text-sm font-semibold transition-colors ${
                    size === s ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-300 bg-white text-ink hover:border-brand-navy'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" onClick={buyNow} disabled={isOutOfStock} className="sm:min-w-[220px]">
            {isOutOfStock ? 'Out of stock' : 'Buy Now · Cash on Delivery'}
          </Button>
          <Button to={href} variant="secondary" size="lg">
            View details <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(product)}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
              aria-pressed={isWishlisted}
              className={`hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg border transition-colors sm:inline-flex ${
                isWishlisted ? 'border-[#B91C1C] bg-[#B91C1C] text-white' : 'border-slate-300 text-slate-600 hover:border-[#B91C1C] hover:text-[#B91C1C]'
              }`}
            >
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export function ProductSpotlightSkeleton() {
  return (
    <div className="grid animate-pulse overflow-hidden rounded-lg border border-line bg-white md:grid-cols-2" role="status" aria-label="Loading products">
      <div className="aspect-[4/5] bg-slate-200 md:aspect-auto md:min-h-[460px]" />
      <div className="space-y-4 p-5 sm:p-8 lg:p-12">
        <div className="h-5 w-24 rounded-md bg-slate-200" />
        <div className="h-8 w-11/12 rounded bg-slate-200" />
        <div className="h-8 w-2/3 rounded bg-slate-200" />
        <div className="h-10 w-1/3 rounded bg-slate-200" />
        <div className="flex gap-2"><div className="h-8 w-32 rounded-md bg-slate-200" /><div className="h-8 w-28 rounded-md bg-slate-200" /></div>
        <div className="h-12 w-full rounded-md bg-slate-200 sm:w-2/3" />
      </div>
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
