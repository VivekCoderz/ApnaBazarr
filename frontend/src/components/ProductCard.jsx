import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Eye } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { FREE_DELIVERY_ABOVE, DELIVERY_CHARGE } from '../config/store';

export default function ProductCard({ product, onToggleWishlist, isWishlisted, compact = false }) {
  const navigate = useNavigate();

  const isOutOfStock = product.inStock === false || product.stock <= 0;
  const isClosed = product.seller && product.seller.isOpen === false;
  // Stars only for real reviews (rating is null when there are none)
  const hasReviews = product.reviewsCount > 0 && product.rating != null;

  const openProduct = () => navigate(`/product/${product.id}`);

  return (
    <div
      onClick={openProduct}
      className={`group bg-white rounded-xl overflow-hidden border border-slate-100 custom-card-shadow transition-all duration-300 flex flex-col justify-between h-full relative cursor-pointer ${
        isOutOfStock || isClosed ? 'opacity-90' : ''
      }`}
    >

      {/* Top Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-xs shadow-xs">
              Stock khatam
            </span>
          ) : isClosed ? (
            <span className="bg-amber-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-xs shadow-xs">
              Shop band hai
            </span>
          ) : (
            <>
              <span className="bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-xs shadow-xs">
                COD
              </span>
              {product.discount && (
                <span className="bg-white/95 text-emerald-700 font-bold text-[10px] px-2 py-0.5 rounded-xs shadow-xs">
                  {product.discount}
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Floating Button */}
        {onToggleWishlist && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist(product);
            }}
            className={`absolute top-2.5 right-2.5 z-10 p-2 rounded-full shadow-md transition-all duration-200 ${
              isWishlisted
                ? 'bg-red-500 text-white'
                : 'bg-white/90 text-slate-600 hover:text-red-500 hover:bg-white'
            }`}
            title="Wishlist mein rakhein"
            aria-label="Wishlist mein rakhein"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Product Main Image */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width="400"
          height="400"
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
        />

        {/* Desktop hover action: size is chosen on the product page */}
        <div className="hidden sm:flex absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
          <span className="px-3 py-2 bg-white text-slate-800 rounded-lg shadow-md text-xs font-semibold flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>Dekhein</span>
          </span>
        </div>

      </div>

      {/* Product Details Section */}
      <div className="p-2 sm:p-3 flex flex-col justify-between flex-1 space-y-1 sm:space-y-1.5">

        <h4 className="text-xs sm:text-sm font-semibold text-slate-800 group-hover:text-brand-navy transition-colors line-clamp-2 leading-snug">
          {product.name}
        </h4>

        <div>
          {/* Rating: only when there are real reviews */}
          {!compact && hasReviews && (
            <div className="flex items-center gap-1 my-0.5">
              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
              <span className="text-[11px] font-semibold text-slate-700">{product.rating.toFixed(1)}</span>
              <span className="text-[11px] text-slate-400">({product.reviewsCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-1.5 pt-0.5">
            <span className="font-heading text-base sm:text-lg font-bold text-brand-cta">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice > product.price && (
              <span className="text-[11px] font-semibold text-slate-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Delivery line (flat rule: ₹499+ free, otherwise ₹49) */}
          {!compact && (
            <p className={`text-[11px] font-semibold mt-0.5 ${product.price >= FREE_DELIVERY_ABOVE ? 'text-emerald-700' : 'text-slate-500'}`}>
              {product.price >= FREE_DELIVERY_ABOVE
                ? 'Free Delivery'
                : `₹${DELIVERY_CHARGE} delivery · ₹${FREE_DELIVERY_ABOVE}+ par free`}
            </p>
          )}
        </div>

        {/* Mobile button: goes to the product page (size is chosen there) */}
        {!compact && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openProduct();
            }}
            className="w-full mt-1.5 py-2 rounded-lg text-sm font-semibold sm:hidden bg-brand-cta text-white hover:bg-brand-cta-hover transition-colors"
          >
            {isOutOfStock ? 'Stock khatam' : 'Dekhein'}
          </button>
        )}

      </div>

    </div>
  );
}
