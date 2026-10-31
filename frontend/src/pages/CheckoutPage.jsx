import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Banknote, CreditCard, Loader2, MessageCircle } from 'lucide-react';

import { getReferral } from '../utils/referral';
import { useShippingQuote } from '../utils/shipping';
import { formatPrice } from '../utils/format';
import { COD_MAX_AMOUNT, whatsappUrl } from '../config/store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MIN_ORDER = 100;
const GUEST_EMAIL = 'guest@apnabazarr.com';

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

const inputClass = 'w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy bg-white';
const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';

// Plain-text WhatsApp message (no emojis: they break on WhatsApp Web)
const confirmMessage = (order) =>
  `Hello Dhagaro, I confirm my order #${order.orderId}. ` +
  `Name: ${order.shippingAddress?.fullName || ''}. ` +
  `Total: Rs ${Math.round(order.totalAmount)} (${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid online'}). Yes, please ship it.`;

export default function CheckoutPage({ cartItems, onOrderComplete, currentUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    flatNo: '',
    area: '',
    city: '',
    state: '',
    addressType: 'Home'
  });
  const [email, setEmail] = useState(currentUser?.email || '');

  // COD first (trust first). Switched to online automatically when the order is above the COD limit.
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placedOrder, setPlacedOrder] = useState(null);

  // Initial shipping quote from the server; refreshed again once the delivery pincode is entered
  const { shipping: quotedShipping, loading: quoteLoading } = useShippingQuote(cartItems);
  const [shippingCharges, setShippingCharges] = useState(null);

  const calculateShippingFees = async (deliveryPincode) => {
    if (!deliveryPincode || deliveryPincode.trim().length !== 6) return;
    try {
      const res = await fetch(`${BASE_URL}/orders/calculate-shipping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryPincode,
          items: cartItems.map(item => ({
            productId: item.id || item.productId,
            quantity: item.quantity
          }))
        })
      });
      const data = await res.json();
      if (data.success) setShippingCharges(data.shippingCharges);
    } catch (err) {
      console.warn("Failed to calculate shipping:", err);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = shippingCharges ?? quotedShipping ?? 0;
  const total = subtotal + shipping;
  const codAllowed = total <= COD_MAX_AMOUNT;
  const effectiveMethod = !codAllowed && paymentMethod === 'COD' ? 'UPI' : paymentMethod;

  React.useEffect(() => {
    if (cartItems.length > 0 && !quoteLoading && total < MIN_ORDER) {
      navigate('/cart');
    }
  }, [cartItems, total, quoteLoading, navigate]);

  const setField = (field, value) => {
    setAddress(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(address.phone.trim())) errors.phone = 'Please enter a valid 10-digit mobile number.';
    if (!/^\d{6}$/.test(address.pincode.trim())) errors.pincode = 'Pincode must be 6 digits.';
    if (!address.flatNo.trim()) errors.flatNo = 'Please enter your house or flat number.';
    if (!address.area.trim()) errors.area = 'Please enter your area or street.';
    if (!address.city.trim()) errors.city = 'Please enter your city.';
    if (!address.state) errors.state = 'Please select your state.';
    if (!currentUser && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Please enter a valid email or leave it empty.';
    if (cartItems.length === 0) return;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;

    await calculateShippingFees(address.pincode.trim());
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const loadRazorpayScript = () => {
    // Load checkout.js once; retries reuse it instead of adding another <script>
    if (window.Razorpay) return Promise.resolve(true);
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
  const safeParseJSON = async (response) => {
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      throw new Error("Our server is starting up. Please try again in 10–15 seconds.");
    }
    return await response.json();
  };

  const buyerEmail = (currentUser?.email || email.trim() || GUEST_EMAIL);
  const orderItems = () => cartItems.map(item => ({
    productId: item.id,
    name: item.name,
    image: item.image,
    price: item.price,
    quantity: item.quantity,
    customText: item.customText || '',
    customImage: item.customImage || '',
    selectedSize: item.selectedSize || '',
    selectedColor: item.selectedColor || ''
  }));
  const shippingAddress = () => ({
    ...address,
    fullName: address.fullName.trim(),
    phone: address.phone.trim(),
    pincode: address.pincode.trim()
  });

  // The success screen uses the order returned by the create/verify call (no extra lookup)
  const finishOrder = (savedOrder) => {
    const normalisedOrder = {
      ...savedOrder,
      createdAt: savedOrder.createdAt || new Date().toISOString(),
    };
    setPlacedOrder(normalisedOrder);
    setStep(3);
    onOrderComplete(normalisedOrder);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderError('');

    try {
      if (effectiveMethod === 'UPI') {
        // Online Payment Flow (Razorpay)
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Could not open the payment page. Please check your internet and try again.");
        }

        const orderRes = await fetch(`${BASE_URL}/orders/razorpay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: orderItems() }),
        });
        const orderData = await safeParseJSON(orderRes);
        if (!orderData.success) {
          throw new Error(orderData.message || "Could not start the payment.");
        }

        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Dhagaro',
          description: 'Order payment',
          image: '/favicon-192.png',
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setOrderLoading(true);
              const verifyRes = await fetch(`${BASE_URL}/orders/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: buyerEmail,
                  items: orderItems(),
                  shippingAddress: shippingAddress(),
                  totalAmount: total,
                  resellerCode: getReferral()
                }),
              });
              const verifyResult = await safeParseJSON(verifyRes);
              if (!verifyResult.success) {
                throw new Error(verifyResult.message || "Payment could not be verified.");
              }
              finishOrder(verifyResult.order);
            } catch (err) {
              setOrderError(err.message || 'Payment could not be verified. Please WhatsApp us at +91 93068 10726.');
            } finally {
              setOrderLoading(false);
            }
          },
          prefill: {
            name: address.fullName,
            contact: address.phone,
            email: buyerEmail === GUEST_EMAIL ? undefined : buyerEmail
          },
          theme: {
            color: '#0B2A55'
          },
          modal: {
            ondismiss: function () {
              setOrderLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Cash on Delivery: open to everyone, up to the COD limit (also checked on the server)
        const res = await fetch(`${BASE_URL}/orders`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            userEmail: buyerEmail,
            items: orderItems(),
            shippingAddress: shippingAddress(),
            paymentMethod: 'COD',
            totalAmount: total,
            resellerCode: getReferral(),
          }),
        });
        const result = await safeParseJSON(res);
        if (!res.ok || !result.success) throw new Error(result.message || `Could not place the order (${res.status}).`);
        finishOrder(result.order);
      }
    } catch (err) {
      setOrderError(err.message || 'Could not place the order. Please try again.');
      // Also for online payment: an error before the Razorpay window opened must not
      // leave the button stuck on "Placing order..."
      setOrderLoading(false);
    } finally {
      if (effectiveMethod !== 'UPI') {
        setOrderLoading(false);
      }
    }
  };

  const fieldError = (field) => formErrors[field] && (
    <p className="text-sm text-red-600 font-semibold mt-1">{formErrors[field]}</p>
  );

  return (
    <div className="py-6 sm:py-10 bg-slate-50 min-h-screen">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">

        {/* Header */}
        {step < 3 && (
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold text-brand-navy">Order details</h1>
            <span className="text-sm font-semibold text-slate-500">Step {step} / 2</span>
          </div>
        )}

        <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          {step === 1 && cartItems.length > 0 && (
            <form onSubmit={handleAddressSubmit} noValidate className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 border-b pb-2">1. Delivery address</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="co-name">Full name *</label>
                  <input id="co-name" type="text" autoComplete="name" value={address.fullName} onChange={(e) => setField('fullName', e.target.value)} placeholder="Your name" className={inputClass} />
                  {fieldError('fullName')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-phone">Mobile number (WhatsApp) *</label>
                  <input id="co-phone" type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} value={address.phone} onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))} placeholder="9876543210" className={inputClass} />
                  <p className="text-xs text-slate-500 mt-1">We will WhatsApp or call you on this number</p>
                  {fieldError('phone')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-pincode">Pincode *</label>
                  <input id="co-pincode" type="text" inputMode="numeric" autoComplete="postal-code" maxLength={6} value={address.pincode} onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, ''))} placeholder="132103" className={inputClass} />
                  {fieldError('pincode')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-flat">House / flat no. *</label>
                  <input id="co-flat" type="text" autoComplete="address-line1" value={address.flatNo} onChange={(e) => setField('flatNo', e.target.value)} placeholder="H.No. 12, 2nd floor" className={inputClass} />
                  {fieldError('flatNo')}
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="co-area">Area / street *</label>
                <input id="co-area" type="text" autoComplete="address-line2" value={address.area} onChange={(e) => setField('area', e.target.value)} placeholder="Model Town, near the temple" className={inputClass} />
                {fieldError('area')}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="co-city">City *</label>
                  <input id="co-city" type="text" autoComplete="address-level2" value={address.city} onChange={(e) => setField('city', e.target.value)} placeholder="Panipat" className={inputClass} />
                  {fieldError('city')}
                </div>
                <div>
                  <label className={labelClass} htmlFor="co-state">State *</label>
                  <select id="co-state" value={address.state} onChange={(e) => setField('state', e.target.value)} className={inputClass}>
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                  {fieldError('state')}
                </div>
              </div>

              {!currentUser && (
                <div>
                  <label className={labelClass} htmlFor="co-email">Email (optional)</label>
                  <input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })); }} placeholder="you@gmail.com" className={inputClass} />
                  {fieldError('email')}
                </div>
              )}

              <button type="submit" className="w-full min-h-12 py-3.5 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold text-base rounded-lg flex items-center justify-center gap-2">
                <span>Continue · {formatPrice(total)}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && cartItems.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-slate-900 border-b pb-2">2. Payment</h3>

              {/* Order summary */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Items</span>
                  <span className="font-semibold text-slate-800">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Delivery</span>
                  <span className={`font-semibold ${shipping === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-base">
                  <span className="text-slate-900">Total</span>
                  <span className="font-heading text-lg text-brand-cta">{formatPrice(total)}</span>
                </div>
              </div>

              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={effectiveMethod === 'UPI'}
                  onClick={() => setPaymentMethod('UPI')}
                  className={`w-full text-left p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${effectiveMethod === 'UPI' ? 'border-brand-navy bg-blue-50/50' : 'border-slate-200'}`}
                >
                  <CreditCard className="w-5 h-5 text-brand-navy shrink-0" />
                  <div>
                    <h4 className="text-base font-semibold text-slate-800">Online Payment (UPI / Card)</h4>
                    <p className="text-sm text-slate-500">Fastest confirmation</p>
                  </div>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={effectiveMethod === 'COD'}
                  disabled={!codAllowed}
                  onClick={() => setPaymentMethod('COD')}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                    !codAllowed ? 'border-slate-200 opacity-60 cursor-not-allowed' : effectiveMethod === 'COD' ? 'border-emerald-600 bg-emerald-50/60 cursor-pointer' : 'border-slate-200 cursor-pointer'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-base font-semibold text-slate-800">Cash on Delivery</h4>
                    <p className="text-sm text-slate-500">
                      {codAllowed ? 'Pay when your order arrives' : `Available on orders up to ${formatPrice(COD_MAX_AMOUNT)}`}
                    </p>
                  </div>
                </button>
                <p className="text-xs text-slate-500">
                  Cash on delivery is available on orders up to {formatPrice(COD_MAX_AMOUNT)}. We confirm every order with you on WhatsApp.
                </p>
              </div>

              {orderError && (
                <p className="text-sm text-red-700 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {orderError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} disabled={orderLoading} className="min-h-12 px-5 py-3 bg-slate-100 text-slate-700 text-sm font-semibold rounded-lg flex items-center gap-1 disabled:opacity-50">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                  className="flex-1 min-h-12 py-3.5 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold text-base rounded-lg disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {orderLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>Placing order...</span></>
                  ) : effectiveMethod === 'COD' ? (
                    <span>Place Order · {formatPrice(total)} COD</span>
                  ) : (
                    <span>Pay {formatPrice(total)}</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && placedOrder && (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-bold text-brand-navy">
                Thank you {placedOrder.shippingAddress?.fullName?.split(' ')[0] || ''}! Order #{placedOrder.orderId} is confirmed.
              </h2>
              <p className="text-base text-slate-700">It will be dispatched within 2 days.</p>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-left space-y-1 max-w-md mx-auto">
                <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{formatPrice(placedOrder.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold">{placedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (paid)'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">Address</span><span className="font-semibold text-right">{placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.pincode}</span></div>
              </div>

              {placedOrder.paymentMethod === 'COD' && (
                <p className="text-base font-semibold text-slate-800 max-w-md mx-auto">
                  Please confirm your order on WhatsApp. We ship cash-on-delivery orders once you confirm.
                </p>
              )}

              <a
                href={whatsappUrl(confirmMessage(placedOrder))}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full max-w-md px-6 py-3.5 bg-[#25D366] text-brand-navy text-base font-bold rounded-xl shadow-md"
              >
                <MessageCircle className="w-5 h-5" />
                <span>Confirm order on WhatsApp</span>
              </a>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {currentUser && (
                  <button onClick={() => navigate('/orders')} className="px-6 py-3 bg-brand-navy text-white text-sm font-semibold rounded-xl">
                    My Orders
                  </button>
                )}
                <Link to="/shop" className="px-6 py-3 text-brand-navy text-sm font-semibold underline underline-offset-4">
                  Continue shopping
                </Link>
              </div>
            </div>
          )}

          {step < 3 && cartItems.length === 0 && (
            <p className="text-sm text-slate-600 mt-4">
              Your cart is empty. <Link to="/shop" className="text-brand-navy font-semibold underline">Start shopping</Link>
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
