import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Heart, Eye, ShoppingBag, Check } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onQuickView, onToggleWishlist, isWishlisted, isCartAdded, compact = false }) {
  const navigate = useNavigate();

  const isOutOfStock = product.inStock === false || product.stock <= 0;
  const isClosed = product.seller && product.seller.isOpen === false;

  // Delivery hint is computed server-side (GET /products) so cost/margin stays private
  const { itemsForFreeDelivery, deliveryChargeForOne } = product.shipping || {};

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div 
      onClick={handleCardClick}
      className={`group bg-white rounded-xl overflow-hidden border border-slate-100 custom-card-shadow transition-all duration-300 flex flex-col justify-between h-full relative cursor-pointer ${
        isOutOfStock || isClosed ? 'opacity-90' : ''
      }`}
    >
      
      {/* Top Image Container */}
      <div className="relative aspect-square overflow-hidden bg-slate-50">
        
        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-col items-start gap-1">
          {isOutOfStock ? (
            <span className="bg-red-600 text-white font-black text-[10px] px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs">
              OUT OF STOCK
            </span>
          ) : isClosed ? (
            <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs">
              SHOP CLOSED
            </span>
          ) : (
            <>
              {product.discount && (
                <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs">
                  {product.discount}
                </span>
              )}
              {product.badge && (
                <span className="bg-amber-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-xs tracking-wider uppercase shadow-xs">
                  {product.badge}
                </span>
              )}
            </>
          )}
        </div>

        {/* Wishlist Floating Button */}
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
          title="Add to Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Product Main Image */}
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500"
        />

        {/* Quick Action Overlay (On Hover) */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/product/${product.id}`);
            }}
            className="p-2 bg-white text-slate-800 rounded-lg hover:bg-brand-navy hover:text-white transition-colors shadow-md text-xs font-semibold flex items-center space-x-1"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">View Details</span>
          </button>

          <button
            disabled={isOutOfStock || isClosed}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock && !isClosed) onAddToCart(product);
            }}
            className={`p-2 rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-md transition-colors ${
              (isOutOfStock || isClosed)
                ? 'bg-slate-400 text-slate-200 cursor-not-allowed'
                : isCartAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-cta text-white hover:bg-brand-cta-hover'
            }`}
            title={isOutOfStock ? "Out of Stock" : isClosed ? "Shop Closed" : "Add to Cart"}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isClosed ? (
              <span>Closed</span>
            ) : isCartAdded ? (
              <>
                <Check className="w-4 h-4" />
                <span className="hidden sm:inline">Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Add to Cart</span>
              </>
            )}
          </button>

        </div>

      </div>

      {/* Product Details Section */}
      <div className="p-2 sm:p-3 flex flex-col justify-between flex-1 space-y-1 sm:space-y-1.5">
        
        <div>
          {!compact && (
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-medium text-slate-400 block truncate flex-1">
                {product.category}
              </span>
              {product.seller && (
                <span 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/shop?sellerId=${product.seller.id}`);
                  }}
                  className="text-[8px] sm:text-[9px] text-brand-navy hover:underline font-black cursor-pointer truncate max-w-[100px] shrink-0"
                  title={`View ${product.seller.shopName}`}
                >
                  {product.seller.shopName}
                </span>
              )}
              {product.gender && (
                <span className="text-[8px] sm:text-[9px] font-extrabold text-brand-navy bg-blue-50 px-1 py-0.5 rounded shrink-0">
                  {product.gender}
                </span>
              )}
            </div>
          )}

          <h4 
            className="text-[11px] sm:text-xs font-bold text-slate-800 hover:text-brand-navy transition-colors line-clamp-2 mt-0.5"
          >
            {product.name}
          </h4>
        </div>

        <div>
          {/* Star Rating Line */}
          {!compact && (
            <div className="flex items-center space-x-0.5 sm:space-x-1 my-0.5 sm:my-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                    i < Math.round(product.rating || 5)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-slate-200'
                  }`}
                />
              ))}
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium ml-1">
                ({product.reviewsCount})
              </span>
            </div>
          )}

          {/* Price Container in ₹ INR */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 pt-0.5 sm:pt-1">
            <span className="text-xs sm:text-sm font-extrabold text-slate-900">
              ₹{product.price.toFixed(2)}
            </span>
            {product.originalPrice && (
              <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400 line-through">
                ₹{product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Delivery Promotion Badge */}
          {!compact && product.shipping && (
            <div className="mt-1 bg-slate-50 border border-slate-200 p-1 sm:p-1.5 rounded-lg text-[9px] sm:text-[10px] space-y-0.5 select-none font-bold">
              {itemsForFreeDelivery <= 1 || deliveryChargeForOne <= 0 ? (
                <p className="text-emerald-700 font-extrabold flex items-center">
                  🚚 FREE DELIVERY
                </p>
              ) : (
                <>
                  <p className="text-brand-navy font-extrabold">
                    🚚 Free Delivery: buy {itemsForFreeDelivery} Pcs
                  </p>
                  <p className="text-slate-400 text-[8px] sm:text-[9px] font-semibold">
                    Otherwise: +₹{deliveryChargeForOne.toFixed(0)} delivery
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Mobile Quick Add Button */}
        {!compact && (
          <button
            disabled={isOutOfStock || isClosed}
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock && !isClosed) onAddToCart(product);
            }}
            className={`w-full mt-1.5 py-1.5 rounded-lg text-xs font-bold sm:hidden flex items-center justify-center space-x-1 transition-colors ${
              isOutOfStock || isClosed
                ? 'bg-slate-205 text-slate-400 cursor-not-allowed'
                : isCartAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-cta text-white hover:bg-brand-cta-hover'
            }`}
          >
            {isOutOfStock ? (
              <span>Out of Stock</span>
            ) : isClosed ? (
              <span>Shop Closed</span>
            ) : isCartAdded ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}

      </div>

    </div>
  );
}
