import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { formatPrice, displayName, discountPercent } from '../utils/format';
import { FREE_DELIVERY_ABOVE, DELIVERY_CHARGE, categoryLabel } from '../config/store';
import Badge from './ui/Badge';

// Cloudinary resize for card images (4:5)
const cardImage = (url) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', '/upload/w_480,h_600,c_fill,q_auto,f_auto/')
    : url;

export default function ProductCard({ product, onToggleWishlist, isWishlisted, compact = false }) {
  const isOutOfStock = product.inStock === false || product.stock <= 0;
  const isClosed = product.seller && product.seller.isOpen === false;
  // Stars only for real reviews (rating is null when there are none)
  const hasReviews = product.reviewsCount > 0 && product.rating != null;
  const off = discountPercent(product);
  const isNew = /new/i.test(product.badge || '');
  const href = `/product/${product.id}`;
  const name = displayName(product.name);

  return (
    <div className="group relative flex h-full flex-col overflow-hidden rounded-lg border border-line bg-white shadow-card transition-[box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:shadow-lift">
      <Link to={href} className="flex h-full flex-col" aria-label={`${name}, ${formatPrice(product.price)}`}>
        {/* Image 4:5 */}
        <span className="relative block aspect-[4/5] overflow-hidden bg-brand-cream">
          <img
            src={cardImage(product.image)}
            alt={name}
            loading="lazy"
            width="480"
            height="600"
            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${isOutOfStock ? 'opacity-60' : ''}`}
          />
          <span className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1">
            {isOutOfStock ? (
              <Badge tone="muted">Out of stock</Badge>
            ) : isClosed ? (
              <Badge tone="muted">Shop closed</Badge>
            ) : (
              <>
                {off > 0 && <Badge tone="sale">{off}% off</Badge>}
                {isNew && !compact && <Badge tone="new">New</Badge>}
              </>
            )}
          </span>
          {/* Desktop hover hint */}
          <span className="absolute inset-x-3 bottom-3 hidden translate-y-2 items-center justify-center rounded-md bg-white/95 py-2 text-sm font-semibold text-brand-navy opacity-0 shadow-card transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 sm:flex">
            View details
          </span>
        </span>

        {/* Details */}
        <span className={`flex flex-1 flex-col gap-1 ${compact ? 'p-2.5' : 'p-3 sm:p-4'}`}>
          {!compact && (
            <span className="text-xs font-semibold text-slate-500">{categoryLabel(product.category)}</span>
          )}
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-brand-navy sm:text-[15px]">
            {name}
          </span>

          {!compact && hasReviews && (
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />
              <span className="text-xs font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-slate-500">({product.reviewsCount})</span>
            </span>
          )}

          <span className="mt-auto flex flex-wrap items-baseline gap-x-2 pt-1">
            <span className="text-lg font-semibold text-brand-cta sm:text-xl">{formatPrice(product.price)}</span>
            {product.originalPrice > product.price && (
              <s className="text-xs text-slate-500 sm:text-sm">{formatPrice(product.originalPrice)}</s>
            )}
          </span>

          {!compact && (
            <span className="text-xs font-semibold text-slate-600">
              {product.price >= FREE_DELIVERY_ABOVE
                ? <><span className="text-emerald-700">Free delivery</span> · COD</>
                : `₹${DELIVERY_CHARGE} delivery · COD`}
            </span>
          )}
        </span>
      </Link>

      {onToggleWishlist && (
        <button
          type="button"
          onClick={() => onToggleWishlist(product)}
          className={`absolute right-2 top-2 z-10 flex h-10 w-10 items-center justify-center rounded-full shadow-card transition-colors ${
            isWishlisted ? 'bg-[#B91C1C] text-white' : 'bg-white/95 text-slate-600 hover:text-[#B91C1C]'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={Boolean(isWishlisted)}
          title="Save to wishlist"
        >
          <Heart className={`h-[18px] w-[18px] ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      )}
    </div>
  );
}
