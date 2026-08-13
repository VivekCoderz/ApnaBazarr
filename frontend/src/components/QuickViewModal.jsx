import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, Shield, Truck, Check } from 'lucide-react';

export default function QuickViewModal({ product, onClose, onAddToCart, onToggleWishlist, isWishlisted }) {
  if (!product) return null;

  const [selectedColor, setSelectedColor] = useState(product.colors ? product.colors[0] : null);
  const [selectedSize, setSelectedSize] = useState(product.sizes ? product.sizes[0] : null);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const handleAdd = () => {
    onAddToCart({ ...product, selectedColor, selectedSize }, quantity);
    setAddedSuccess(true);
    setTimeout(() => setAddedSuccess(false), 2000);
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
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Product Image */}
          <div className="relative aspect-square bg-slate-50 p-6 flex items-center justify-center">
            {product.discount && (
              <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-xs px-2.5 py-1 rounded-xs uppercase tracking-wider">
                {product.discount}
              </span>
            )}
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-xl shadow-xs"
            />
          </div>

          {/* Product Info & Actions */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-4">
            
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#0066cc] uppercase tracking-wider">
                {product.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
                {product.name}
              </h2>

              {/* Rating */}
              <div className="flex items-center space-x-1 py-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < product.rating
                        ? 'text-amber-400 fill-amber-400'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  {product.rating}.0 ({product.reviewsCount} customer reviews)
                </span>
              </div>

              {/* Price in ₹ */}
              <div className="flex items-center space-x-3 pt-1">
                <span className="text-2xl font-extrabold text-slate-900">
                  ₹{product.price.toFixed(2)}
                </span>
                {product.originalPrice && (
                  <span className="text-base font-semibold text-slate-400 line-through">
                    ₹{product.originalPrice.toFixed(2)}
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
              {product.colors && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Color:</span>
                  <div className="flex items-center space-x-2">
                    {product.colors.map((color, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === color ? 'ring-2 ring-[#0066cc] ring-offset-2 scale-110' : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {product.sizes && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-700">Size:</span>
                  <div className="flex items-center space-x-2">
                    {product.sizes.map((size, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(size)}
                        className={`px-3 py-1 text-xs font-bold rounded-md border transition-all ${
                          selectedSize === size
                            ? 'bg-[#0066cc] text-white border-[#0066cc]'
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
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-l-lg"
                  >
                    -
                  </button>
                  <span className="px-3 text-sm font-extrabold text-slate-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-r-lg"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAdd}
                  className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-xs uppercase tracking-wider text-white shadow-md flex items-center justify-center space-x-2 transition-colors ${
                    addedSuccess ? 'bg-emerald-600' : 'bg-[#0066cc] hover:bg-blue-700'
                  }`}
                >
                  {addedSuccess ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ADDED TO CART!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      <span>ADD TO CART</span>
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
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>

              {/* Guarantees */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-1">
                  <Truck className="w-3.5 h-3.5 text-[#0066cc]" />
                  <span>Free Express Delivery Across India</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3.5 h-3.5 text-[#0066cc]" />
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
