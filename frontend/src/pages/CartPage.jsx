import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft, Truck } from 'lucide-react';
import { useShippingQuote } from '../utils/shipping';
import { formatPrice, cloudinaryImage } from '../utils/format';
import { FREE_DELIVERY_ABOVE } from '../config/store';

const MIN_ORDER = 100;

export default function CartPage({ cartItems, onUpdateQuantity, onRemoveItem }) {
  const navigate = useNavigate();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Shipping is quoted by the server (same rule it charges at checkout)
  const { shipping, loading: shippingLoading } = useShippingQuote(cartItems);
  const total = subtotal + (shipping || 0);
  const belowMinimum = !shippingLoading && total < MIN_ORDER;
  const neededForFree = Math.max(0, FREE_DELIVERY_ABOVE - subtotal);

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between gap-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-navy tracking-tight">Your Cart</h1>
          <Link to="/shop" className="text-sm font-semibold text-brand-navy flex items-center gap-1 hover:underline shrink-0">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue shopping</span>
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-4">
            <div className="p-4 bg-slate-100 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Your cart is empty.</h3>
            <Link to="/shop" className="inline-flex min-h-11 items-center px-6 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-lg">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

            {/* Cart Items List */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cartItems.map((item) => (
                <div key={`${item.id}-${item.customText || ''}-${item.customImage || ''}-${item.selectedSize || ''}-${item.selectedColor || ''}`} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col space-y-3">

                  {/* Top Row: Image, Info & Delete Button */}
                  <div className="flex items-start space-x-3 w-full">
                    <img src={cloudinaryImage(item.image, 160)} alt={item.name} width="80" height="80" loading="lazy" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl bg-slate-50 border border-slate-100 shrink-0" />

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug">{item.name}</h4>
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.selectedSize && (
                          <span className="inline-block text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            Size: {item.selectedSize}
                          </span>
                        )}
                        {item.selectedColor && item.selectedColor !== 'Default' && (
                          <span className="inline-block text-xs font-semibold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded border border-slate-200">
                            Colour: {item.selectedColor}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id, item.customText, item.customImage, item.selectedSize, item.selectedColor)}
                      className="p-1.5 text-slate-400 hover:text-red-600 transition-colors cursor-pointer shrink-0"
                      title="Remove"
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Customization Details */}
                  {(item.customText || item.customImage) && (
                    <div className="p-2.5 bg-amber-50/70 border border-amber-200/60 rounded-xl space-y-1 text-[11px] text-amber-900 font-semibold w-full">
                      {item.customText && (
                        <div>
                          <span className="text-slate-500 font-bold">Text: </span>
                          <span className="text-slate-800 font-extrabold">"{item.customText}"</span>
                        </div>
                      )}
                      {item.customImage && (
                        <div className="flex items-center space-x-1.5 pt-0.5">
                          <span className="text-slate-500 font-bold">Photo: </span>
                          <img src={item.customImage} alt="Custom Preview" className="w-6 h-6 object-cover rounded border" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom Row: Quantity Controls & Subtotal */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 w-full">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.customText, item.customImage, item.selectedSize, item.selectedColor)}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-l-lg cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-sm font-bold text-slate-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.customText, item.customImage, item.selectedSize, item.selectedColor)}
                        className="p-2 text-slate-600 hover:bg-slate-200 rounded-r-lg cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-heading text-base sm:text-lg font-bold text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                  </div>

                </div>
              ))}
            </div>

            {/* Summary Sidebar */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

              {/* Free-delivery progress */}
              <div className={`flex items-start gap-2 p-3 rounded-xl text-sm font-semibold ${neededForFree > 0 ? 'bg-brand-peach text-brand-navy' : 'bg-emerald-50 text-emerald-700'}`}>
                <Truck className="w-4 h-4 mt-0.5 shrink-0" />
                <span>
                  {neededForFree > 0
                    ? `Add ${formatPrice(neededForFree)} more for free delivery`
                    : 'You get free delivery'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {shippingLoading ? '...' : shipping === null ? 'At checkout' : shipping === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatPrice(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-heading text-lg text-brand-cta">{formatPrice(total)}</span>
                </div>
              </div>

              {belowMinimum && (
                <p className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 font-semibold">
                  Minimum order value is ₹{MIN_ORDER}.
                </p>
              )}

              <button
                onClick={() => navigate('/checkout')}
                disabled={belowMinimum || shippingLoading}
                className={`w-full min-h-12 py-3.5 text-white font-semibold text-base rounded-lg transition-colors flex items-center justify-center space-x-2 ${
                  belowMinimum || shippingLoading
                    ? 'bg-slate-300 cursor-not-allowed opacity-60'
                    : 'bg-brand-cta hover:bg-brand-cta-hover'
                }`}
              >
                <span>Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-xs text-slate-500 text-center">Cash on delivery available · No login needed</p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
