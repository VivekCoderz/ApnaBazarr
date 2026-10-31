import React, { useState, useEffect, useRef } from 'react';
import { X, Star, ShoppingBag, Heart, Shield, Truck, Check } from 'lucide-react';
import { formatPrice, displayName, cloudinaryImage } from '../utils/format';

// Hooks live in the inner component (keyed by product) so the early return never
// changes the hook order and each product starts with its own size/colour choice
export default function QuickViewModal(props) {
  if (!props.product) return null;
  return <QuickViewContent key={props.product.id} {...props} />;
}

function QuickViewContent({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted }) {
  const hasColors = Array.isArray(product.colors) && product.colors.length > 0;
  const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
  const [selectedColor, setSelectedColor] = useState(hasColors ? product.colors[0] : '');
  const [selectedSize, setSelectedSize] = useState(hasSizes ? product.sizes[0] : '');
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const addedTimer = useRef(null);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(addedTimer.current);
    };
  }, [onClose]);

  const handleAdd = () => {
    onAddToCart({ ...product, selectedColor, selectedSize }, quantity);
    setAddedSuccess(true);
    clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAddedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden z-10 animate-fade-in my-auto border border-slate-200">
        
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Product Image */}
          <div className="relative aspect-square bg-slate-50 p-6 flex items-center justify-center">
            {product.discount && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xs tracking-wider">
                {product.discount}
              </span>
            )}
            <img
              src={cloudinaryImage(product.image, 640)}
              alt={product.name}
              width="640"
              height="640"
              decoding="async"
              className="w-full h-full object-cover rounded-xl shadow-xs"
            />
          </div>

          {/* Product Info & Actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-brand-navy tracking-wider">
                {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {displayName(product.name)}
              </h2>

              {/* Rating: only real reviews */}
              {product.reviewsCount > 0 && product.rating != null && (
                <div className="flex items-center space-x-1 py-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-slate-500 ml-1">
                    {product.rating.toFixed(1)} ({product.reviewsCount})
                  </span>
                </div>
              )}

              {/* Price in ₹ */}
              <div className="flex items-center space-x-3 pt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base font-semibold text-slate-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-2">
                {product.description}
              </p>
            </div>

            {/* Color & Size Selector */}
            <div className="space-y-3 border-t border-slate-100 pt-3">
              {hasColors && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Color:</span>
                  <div className="flex items-center space-x-2">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        type="button"
                        aria-label={`Colour ${color}`}
                        title={color}
                        aria-pressed={selectedColor === color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === color ? 'ring-2 ring-brand-navy ring-offset-2 scale-110' : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {hasSizes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Size:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                          selectedSize === size
                            ? 'bg-brand-navy text-white border-brand-navy'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-l-lg"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-extrabold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-r-lg"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs tracking-wider text-white shadow-md flex items-center justify-center space-x-2 transition-colors ${
                    addedSuccess ? 'bg-emerald-600' : 'bg-brand-cta hover:bg-brand-cta-hover'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Added to cart</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => onToggleWishlist(product)}
                  className={`p-3 rounded-xl border transition-colors ${
                    isWishlisted
                      ? 'bg-red-50 text-red-500 border-red-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-red-500'
                  }`}
                  title="Wishlist"
                  aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Guarantees */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5 text-brand-navy" />
                  <span>Free delivery on orders above ₹499</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-brand-navy" />
                  <span>100% Genuine Guarantee</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
