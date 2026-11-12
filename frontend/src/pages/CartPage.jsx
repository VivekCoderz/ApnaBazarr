import { Link, useNavigate } from 'react-router-dom';
import { Plus, Minus, Trash2, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';
import { useShippingQuote } from '../utils/shipping';
import { formatPrice, cloudinaryImage, displayName, isOrderable } from '../utils/format';
import { categoryLabel, onlineDiscountFor, hasFreeDeliveryTag, isPanipatPincode } from '../config/store';
import { usePincode } from '../utils/location';
import FreeDeliveryProgress from '../components/FreeDeliveryProgress';

const MIN_ORDER = 100;
const MAX_SUGGESTIONS = 3;

// "Complete the set": up to 3 orderable products not already in the cart, other
// categories first. Products that need personalisation are left out (they can't be
// added with one tap). Coming-soon / out-of-stock products never appear here.
function cartSuggestions(products, cartItems) {
  const inCart = new Set(cartItems.map(item => String(item.id)));
  const cartCategories = new Set(cartItems.map(item => item.category));
  return products
    .filter(p => isOrderable(p) && !inCart.has(String(p.id)) && !p.isCustomizable && p.image)
    .map((p, index) => ({ p, index, sameCategory: cartCategories.has(p.category) }))
    .sort((a, b) => Number(a.sameCategory) - Number(b.sameCategory) || a.index - b.index)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ p }) => p);
}

export default function CartPage({ cartItems, onUpdateQuantity, onRemoveItem, products = [], onAddToCart }) {
  const navigate = useNavigate();
  const suggestions = onAddToCart ? cartSuggestions(products, cartItems) : [];
  const inPanipat = isPanipatPincode(usePincode());
  // Upsell: exactly one "Pack of 2" in the cart and no combo yet -> show the free-delivery combo
  const isPack = (p) => /pack of 2/i.test(p?.name || '') && !hasFreeDeliveryTag(p);
  const packQty = cartItems.filter(isPack).reduce((n, i) => n + i.quantity, 0);
  const packPrice = cartItems.find(isPack)?.price || 0;
  const comboOffer = packQty === 1 && !cartItems.some(hasFreeDeliveryTag)
    ? products.find(p => hasFreeDeliveryTag(p) && isOrderable(p))
    : null;

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  // Shipping is quoted by the server (same rule it charges at checkout)
  const { shipping, loading: shippingLoading } = useShippingQuote(cartItems);
  const total = subtotal + (shipping || 0);
  const belowMinimum = !shippingLoading && total < MIN_ORDER;

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

              {/* Complete the set: hidden when nothing orderable is left to suggest */}
              {suggestions.length > 0 && (
                <section aria-labelledby="cart-suggestions" className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <h2 id="cart-suggestions" className="text-base font-bold text-brand-navy">Complete the set</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Frequently bought together</p>
                  <ul className={`mt-3 grid grid-cols-1 gap-3 ${suggestions.length > 1 ? 'sm:grid-cols-2' : 'sm:max-w-md'}`}>
                    {suggestions.map(p => (
                      <li key={p.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-2.5">
                        <Link to={`/product/${p.id}`} className="shrink-0">
                          <img src={cloudinaryImage(p.image, 128)} alt="" width="56" height="56" loading="lazy" className="w-14 h-14 object-cover rounded-lg bg-slate-50" />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <Link to={`/product/${p.id}`} className="block text-sm font-semibold text-slate-900 line-clamp-2 leading-snug hover:underline">
                            {displayName(p.name)}
                          </Link>
                          <p className="text-xs text-slate-500 truncate">{categoryLabel(p.category)}</p>
                          <p className="text-sm font-bold text-slate-900">{formatPrice(p.price)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onAddToCart(p, 1)}
                          aria-label={`Add ${displayName(p.name)} to cart`}
                          className="shrink-0 inline-flex min-h-10 items-center gap-1 rounded-lg border border-brand-navy px-3 text-sm font-semibold text-brand-navy hover:bg-brand-cream motion-safe:active:scale-95 transition-transform"
                        >
                          <Plus className="w-4 h-4" aria-hidden="true" /> Add
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            {/* Summary Sidebar */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs h-fit space-y-4">
              <h3 className="font-bold text-base text-slate-900 border-b border-slate-100 pb-3">Order Summary</h3>

              {/* Free-delivery progress */}
              <FreeDeliveryProgress subtotal={subtotal} freeByOffer={cartItems.some(hasFreeDeliveryTag)} />
              {comboOffer && (
                <Link to={`/product/${comboOffer.id}`} className="mt-3 block rounded-lg border border-brand-orange/40 bg-brand-peach p-3 text-sm hover:border-brand-orange">
                  <span className="block font-semibold text-brand-navy">Make it 2 packs for {formatPrice(comboOffer.price)}, free delivery</span>
                  <span className="mt-0.5 block text-slate-600">4 mats in the {displayName(comboOffer.name).split(':')[0]}. Saves {formatPrice(Math.max(0, 2 * packPrice + 49 - comboOffer.price))} vs 2 packs bought separately →</span>
                </Link>
              )}

              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery</span>
                  <span className="font-semibold text-slate-800">
                    {shippingLoading ? '...' : shipping === null ? 'At checkout' : shipping === 0 && inPanipat ? <span className="text-right"><span className="font-bold text-emerald-700">FREE</span> <span className="text-xs text-slate-400 line-through">₹49</span><span className="block text-xs font-medium text-emerald-700">Free delivery in Panipat</span></span> : shipping === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatPrice(shipping)}
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
              <p className="text-xs text-slate-500 text-center">
                Cash on delivery available · No login needed
                {onlineDiscountFor(total) > 0 && <><br />Pay online (UPI/card) & save {formatPrice(onlineDiscountFor(total))}</>}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
