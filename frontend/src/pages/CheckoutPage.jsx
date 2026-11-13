import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Banknote, CreditCard, Loader2, MessageCircle } from 'lucide-react';

import { getReferral } from '../utils/referral';
import { getSource } from '../utils/source';
import { useShippingQuote, clearQuoteCache } from '../utils/shipping';
import { getSavedPincode, savePincode, isValidPincode, lookupPlace } from '../utils/location';
import {
  pickAddress, cleanPhone, stateOption, sortAddresses, readLocalAddresses, rememberLocalAddress,
  removeLocalAddress, fetchAccountAddresses, updateAccountAddress, deleteAccountAddress
} from '../utils/addresses';
import AddressForm, { inputClass, labelClass, FieldError } from '../components/checkout/AddressForm';
import AddressPicker from '../components/checkout/AddressPicker';
import { formatPrice } from '../utils/format';
import { COD_MAX_AMOUNT, whatsappUrl, onlineDiscountFor, hasFreeDeliveryTag, isPanipatPincode, PANIPAT_VOUCHER_AMOUNT, PANIPAT_VOUCHER_CODE, EXCHANGE_CREDIT, voucherLabel } from '../config/store';
import FreeDeliveryProgress from '../components/FreeDeliveryProgress';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const MIN_ORDER = 100;
const GUEST_EMAIL = 'guest@apnabazarr.com';

const MAX_SAVED_ADDRESSES = 5;

// Blank address for "Add a new address": name/phone from the account, pincode from "Deliver to"
const newAddressFor = (user) => {
  const phone = cleanPhone(user?.phone);
  return {
    fullName: user?.name || '',
    phone: /^[6-9]\d{9}$/.test(phone) ? phone : '',
    pincode: getSavedPincode(),
    flatNo: '',
    area: '',
    city: '',
    state: '',
    addressType: 'Home'
  };
};

// City + state for the dropdown from the India Post lookup
const placeFields = (place) => {
  const state = stateOption(place?.state);
  return { city: state === 'Delhi' ? 'Delhi' : (place?.district || ''), state };
};

// Fills city/state only when empty or still holding what we filled last time, so the
// shopper's own typing is never overwritten. Ignored if the pincode changed meanwhile.
const placeUpdater = (pin, fields, lastAuto) => (prev) => {
  if (prev.pincode !== pin) return prev;
  const next = { ...prev };
  if (fields.city && (!prev.city.trim() || prev.city === lastAuto.city)) next.city = fields.city;
  if (fields.state && (!prev.state || prev.state === lastAuto.state)) next.state = fields.state;
  return next;
};

// Plain-text WhatsApp message (no emojis: they break on WhatsApp Web)
const confirmMessage = (order) =>
  `Hello Dhagaro, I confirm my order #${order.orderId}. ` +
  `Name: ${order.shippingAddress?.fullName || ''}. ` +
  `Total: Rs ${Math.round(order.totalAmount)} (${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid online'}` +
  `${order.voucherDiscount > 0 ? `, ${order.voucherCode || PANIPAT_VOUCHER_CODE} -Rs ${order.voucherDiscount} applied` : ''}). Yes, please ship it.`;

// Prefilled /track link for the success screen
const trackHref = (order) => {
  const params = new URLSearchParams({ id: order.orderId || '' });
  const phone = String(order.shippingAddress?.phone || '').replace(/\D/g, '').slice(-10);
  if (phone) params.set('phone', phone);
  return `/track?${params}`;
};

// PANIPAT30 status from the server quote: applied, or how much more to add (Panipat only)
function VoucherNote({ voucher, nudge }) {
  if (voucher?.amount > 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
        {voucher.code} applied · {formatPrice(voucher.amount)} off ({voucherLabel(voucher.code, voucher.label).toLowerCase()})
      </p>
    );
  }
  if (nudge > 0) {
    return (
      <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
        Add {formatPrice(nudge)} more to get ₹{PANIPAT_VOUCHER_AMOUNT} off your first Panipat order
      </p>
    );
  }
  return null;
}

export default function CheckoutPage({ cartItems, onOrderComplete, currentUser, buyNow = false }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  // Saved addresses: the account's for logged-in shoppers, this device's for guests.
  // With any saved, the first (default / most recent) is pre-selected; otherwise the form shows.
  const [init] = useState(() => {
    const list = currentUser ? sortAddresses(currentUser.addresses) : readLocalAddresses();
    return list.length
      ? { saved: list, mode: 'pick', selectedId: list[0]._id, address: pickAddress(list[0]) }
      : { saved: [], mode: 'form', selectedId: null, address: newAddressFor(currentUser) };
  });
  const [saved, setSaved] = useState(init.saved);
  const [mode, setMode] = useState(init.mode); // 'pick' (saved cards) | 'form'
  const [selectedId, setSelectedId] = useState(init.selectedId);
  const [editingId, setEditingId] = useState(null); // saved address open in the form, null = new
  const [address, setAddress] = useState(init.address);
  const [saveForNext, setSaveForNext] = useState(true);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [listError, setListError] = useState('');
  const formTouchedRef = useRef(false); // shopper started typing: don't swap the form for the saved list
  const autoPlaceRef = useRef({ city: '', state: '' }); // city/state we filled from the pincode
  const [email, setEmail] = useState(currentUser?.email || '');

  const userKey = currentUser ? String(currentUser._id || currentUser.id || currentUser.email || 'me') : '';
  const userName = currentUser?.name || '';
  const userPhone = currentUser?.phone || '';

  // Logged in (also when the session is restored after this page opened): load the
  // account's saved addresses
  useEffect(() => {
    if (!userKey) return undefined;
    let cancelled = false;
    fetchAccountAddresses()
      .then(list => {
        if (cancelled) return;
        const sorted = sortAddresses(list);
        setSaved(sorted);
        if (formTouchedRef.current) return;
        if (sorted.length) {
          setMode('pick');
          setSelectedId(sorted[0]._id);
          setEditingId(null);
          setAddress(pickAddress(sorted[0]));
        } else {
          const blank = newAddressFor({ name: userName, phone: userPhone });
          setMode('form');
          setSelectedId(null);
          setAddress(prev => ({ ...prev, fullName: prev.fullName || blank.fullName, phone: prev.phone || blank.phone }));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [userKey, userName, userPhone]);

  // Opened straight on the form with a known pincode: fill city/state once
  useEffect(() => {
    const pin = init.address.pincode;
    if (init.mode !== 'form' || !isValidPincode(pin)) return undefined;
    let cancelled = false;
    lookupPlace(pin)
      .then(place => {
        if (cancelled || !place) return;
        const fields = placeFields(place);
        setAddress(placeUpdater(pin, fields, autoPlaceRef.current));
        autoPlaceRef.current = fields;
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [init]);

  const fillPlace = (pin) => {
    if (!isValidPincode(pin)) return;
    setPlaceLoading(true);
    lookupPlace(pin)
      .then(place => {
        if (!place) return;
        const fields = placeFields(place);
        setAddress(placeUpdater(pin, fields, autoPlaceRef.current));
        autoPlaceRef.current = fields;
      })
      .catch(() => {})
      .finally(() => setPlaceLoading(false));
  };

  const selectAddress = (a) => {
    setSelectedId(a._id);
    setAddress(pickAddress(a));
    setFormErrors({});
  };

  const openNewAddress = () => {
    formTouchedRef.current = true;
    const blank = newAddressFor(currentUser);
    autoPlaceRef.current = { city: '', state: '' };
    setEditingId(null);
    setMode('form');
    setAddress(blank);
    setFormErrors({});
    fillPlace(blank.pincode);
  };

  const editAddress = (a) => {
    formTouchedRef.current = true;
    autoPlaceRef.current = { city: a.city, state: a.state };
    setEditingId(a._id);
    setSelectedId(a._id);
    setMode('form');
    setAddress(pickAddress(a));
    setFormErrors({});
  };

  const backToSaved = () => {
    formTouchedRef.current = false;
    const current = saved.find(a => a._id === selectedId) || saved[0];
    setEditingId(null);
    setMode('pick');
    if (current) selectAddress(current);
  };

  const removeAddress = async (a) => {
    if (!window.confirm('Remove this address?')) return;
    setListError('');
    let next;
    if (currentUser) {
      setBusyId(a._id);
      try {
        next = sortAddresses(await deleteAccountAddress(a._id));
      } catch (err) {
        setListError(err.message);
        return;
      } finally {
        setBusyId(null);
      }
    } else {
      next = removeLocalAddress(a._id);
    }
    setSaved(next);
    if (!next.length) {
      setEditingId(null);
      setSelectedId(null);
      setMode('form');
      setAddress(newAddressFor(currentUser));
    } else if (a._id === selectedId) {
      selectAddress(next[0]);
    }
  };

  // COD first (trust first). Switched to online automatically when the order is above the COD limit.
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [placedOrder, setPlacedOrder] = useState(null);
  // "I'll hand over old clothes at delivery" (Panipat only; ₹40 off the next order once collected)
  const [exchangeOptIn, setExchangeOptIn] = useState(false);

  // Shipping quote from the server for the address pincode (free in Panipat); refreshed
  // again when the address is submitted. Until a full pincode is typed, the saved one is used.
  const addressPincode = address.pincode.trim();
  const quotePincode = isValidPincode(addressPincode) ? addressPincode : undefined;
  // With a Panipat pincode the phone is sent too, for the PANIPAT30 first-order voucher
  const quotePhone = cleanPhone(address.phone);
  const { shipping: quotedShipping, loading: quoteLoading, voucher, voucherNudge } = useShippingQuote(cartItems, quotePincode, quotePhone);
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
  // PANIPAT30 as quoted by the server (it decides again when the order is placed)
  const voucherAmount = voucher?.amount || 0;
  const total = subtotal + shipping - voucherAmount;
  const codAllowed = total <= COD_MAX_AMOUNT;
  const effectiveMethod = !codAllowed && paymentMethod === 'COD' ? 'UPI' : paymentMethod;
  // "Pay online & save": shown here, but the server applies it and sets the amount charged
  const onlineSaving = onlineDiscountFor(total);
  const payable = effectiveMethod === 'UPI' ? total - onlineSaving : total;

  React.useEffect(() => {
    if (cartItems.length > 0 && !quoteLoading && total < MIN_ORDER) {
      navigate('/cart');
    }
  }, [cartItems, total, quoteLoading, navigate]);

  const setField = (field, value) => {
    formTouchedRef.current = true;
    // Phone autofill may give "+91 98765 43210": keep the 10-digit number
    const v = field === 'phone' ? cleanPhone(value) : value;
    setAddress(prev => ({ ...prev, [field]: v }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'pincode' && isValidPincode(v)) fillPlace(v);
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!address.fullName.trim()) errors.fullName = 'Please enter your name.';
    if (!/^[6-9]\d{9}$/.test(cleanPhone(address.phone))) errors.phone = 'Please enter a valid 10-digit mobile number.';
    if (!/^\d{6}$/.test(address.pincode.trim())) errors.pincode = 'Pincode must be 6 digits.';
    if (!address.flatNo.trim()) errors.flatNo = 'Please enter your house or flat number.';
    if (!address.area.trim()) errors.area = 'Please enter your area or street.';
    if (!address.city.trim()) errors.city = 'Please enter your city.';
    if (!address.state) errors.state = 'Please select your state.';
    if (!currentUser && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errors.email = 'Please enter a valid email or leave it empty.';
    if (cartItems.length === 0) return;
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      // A saved address with something missing: open it in the form so it can be fixed
      if (mode === 'pick' && Object.keys(errors).some(k => k !== 'email')) {
        const current = saved.find(a => a._id === selectedId);
        if (current) {
          formTouchedRef.current = true;
          setEditingId(current._id);
          setMode('form');
        }
      }
      return;
    }

    // Edited a saved address: update it (account or this device), then show it selected.
    // If saving fails the order still uses the edited address (and the server saves it then).
    if (mode === 'form' && editingId) {
      let next = null;
      if (currentUser) {
        try { next = sortAddresses(await updateAccountAddress(editingId, pickAddress(address))); } catch { /* see above */ }
      } else {
        next = rememberLocalAddress(address, editingId);
      }
      if (next) {
        const match = next.find(a => a._id === editingId) || (!currentUser && next[0]);
        setSaved(next);
        if (match) {
          formTouchedRef.current = false;
          setSelectedId(match._id);
          setEditingId(null);
          setMode('pick');
        }
      }
    }

    savePincode(address.pincode.trim()); // header "Deliver to" + next visit
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
    phone: cleanPhone(address.phone),
    pincode: address.pincode.trim()
  });
  // Keep this address for next time: always for a saved one, for a new one only if the box is ticked.
  // Logged in: the server adds it to the account with the order. Guest: this device, after the order.
  const wantSave = !(mode === 'form' && !editingId && !saveForNext);

  // The success screen uses the order returned by the create/verify call (no extra lookup)
  const finishOrder = (savedOrder) => {
    const normalisedOrder = {
      ...savedOrder,
      createdAt: savedOrder.createdAt || new Date().toISOString(),
    };
    if (!currentUser && wantSave) setSaved(rememberLocalAddress(shippingAddress()));
    clearQuoteCache(); // this phone has ordered now: no first-order voucher in later quotes
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
          // Same pincode /verify will see in shippingAddress, so both server totals match
          // (free delivery in Panipat). The server calculates the amount; we never send it.
          // The phone is for the PANIPAT30 first-order check; /verify honours the voucher only
          // for the same phone. The session cookie lets the server check the account too.
          credentials: 'include',
          body: JSON.stringify({ items: orderItems(), deliveryPincode: address.pincode.trim(), phone: cleanPhone(address.phone) }),
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
                // Session cookie files the paid order under the logged-in account
                credentials: 'include',
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: buyerEmail,
                  items: orderItems(),
                  shippingAddress: shippingAddress(),
                  saveAddress: wantSave,
                  totalAmount: payable,
                  resellerCode: getReferral(),
                  source: getSource(),
                  exchangeOptIn: exchangeOptIn && isPanipatPincode(address.pincode.trim())
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
            saveAddress: wantSave,
            paymentMethod: 'COD',
            totalAmount: total,
            resellerCode: getReferral(),
            source: getSource(),
            exchangeOptIn: exchangeOptIn && isPanipatPincode(address.pincode.trim()),
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

        {buyNow && step < 3 && (
          <p className="mb-3 rounded-lg border border-line bg-brand-cream px-4 py-2.5 text-sm text-slate-700">
            You're buying just this item. Your cart is unchanged. <Link to="/cart" className="font-semibold text-brand-navy underline underline-offset-2">View cart</Link>
          </p>
        )}

        <div className="bg-white p-4 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          {step === 1 && cartItems.length > 0 && (
            <form onSubmit={handleAddressSubmit} noValidate className="space-y-4">
              <div className="flex items-center justify-between gap-3 border-b pb-2">
                <h3 className="font-bold text-lg text-slate-900">1. Delivery address</h3>
                {mode === 'form' && saved.length > 0 && (
                  <button type="button" onClick={backToSaved} className="text-sm font-semibold text-brand-navy underline underline-offset-4">
                    Saved addresses
                  </button>
                )}
              </div>

              {listError && <p className="text-sm text-red-700 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{listError}</p>}

              {mode === 'pick' ? (
                <AddressPicker
                  addresses={saved}
                  selectedId={selectedId}
                  onSelect={selectAddress}
                  onEdit={editAddress}
                  onRemove={removeAddress}
                  onAddNew={openNewAddress}
                  busyId={busyId}
                  firstBadge={currentUser ? 'Default' : 'Last used'}
                  canAddMore={!currentUser || saved.length < MAX_SAVED_ADDRESSES}
                />
              ) : (
                <>
                  {editingId && <p className="text-sm font-semibold text-slate-600">Editing a saved address</p>}
                  <AddressForm address={address} onChange={setField} errors={formErrors} placeLoading={placeLoading} />
                </>
              )}

              {!currentUser && (
                <div>
                  <label className={labelClass} htmlFor="co-email">Email (optional)</label>
                  <input id="co-email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setFormErrors(prev => ({ ...prev, email: '' })); }} placeholder="you@gmail.com" className={inputClass} />
                  <FieldError message={formErrors.email} />
                </div>
              )}

              {mode === 'form' && !editingId && (!currentUser || saved.length < MAX_SAVED_ADDRESSES) && (
                <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 accent-brand-navy" checked={saveForNext} onChange={(e) => setSaveForNext(e.target.checked)} />
                  {currentUser ? 'Save this address for next time' : 'Remember this address on this device'}
                </label>
              )}

              <VoucherNote voucher={voucher} nudge={voucherNudge} />
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
                  {shipping === 0 && isPanipatPincode(addressPincode)
                    ? <span className="text-right"><span className="font-bold text-emerald-700">FREE</span> <span className="text-xs text-slate-400 line-through">₹49</span><span className="block text-xs font-medium text-emerald-700">Free delivery in Panipat</span></span>
                    : <span className={`font-semibold ${shipping === 0 ? 'text-emerald-700' : 'text-slate-800'}`}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>}
                </div>
                {voucherAmount > 0 && (
                  <div className="flex justify-between gap-3">
                    <span className="text-emerald-700"><span className="font-bold">{voucher.code}</span> · {voucherLabel(voucher.code, voucher.label)}</span>
                    <span className="font-semibold text-emerald-700">−{formatPrice(voucherAmount)}</span>
                  </div>
                )}
                {effectiveMethod === 'UPI' && onlineSaving > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Online payment discount</span>
                    <span className="font-semibold text-emerald-700">−{formatPrice(onlineSaving)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 text-base">
                  <span className="text-slate-900">Total</span>
                  <span className="font-heading text-lg text-brand-cta">{formatPrice(payable)}</span>
                </div>
                <VoucherNote voucher={voucher} nudge={voucherNudge} />
                <FreeDeliveryProgress subtotal={subtotal} compact freeByOffer={cartItems.some(hasFreeDeliveryTag)} pincode={address.pincode.trim()} />
              </div>

              {isPanipatPincode(addressPincode) && (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald-700" checked={exchangeOptIn} onChange={(e) => setExchangeOptIn(e.target.checked)} />
                  <span>
                    <span className="block font-semibold text-emerald-900">♻ I'll hand over old clothes or an old mat at delivery</span>
                    <span className="block text-emerald-900/80">We send them for recycling in Panipat, and you get {formatPrice(EXCHANGE_CREDIT)} off your next order. <Link to="/recycle" className="font-semibold underline">How it works</Link></span>
                  </span>
                </label>
              )}

              <div className="space-y-3" role="radiogroup" aria-label="Payment method">
                <button
                  type="button"
                  role="radio"
                  aria-checked={effectiveMethod === 'UPI'}
                  onClick={() => setPaymentMethod('UPI')}
                  className={`w-full text-left p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${effectiveMethod === 'UPI' ? 'border-brand-navy bg-blue-50/50' : 'border-slate-200'}`}
                >
                  <CreditCard className="w-5 h-5 text-brand-navy shrink-0" />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-slate-800">Online Payment (UPI / Card)</h4>
                    <p className="text-sm text-slate-500">
                      {onlineSaving > 0 ? `Pay online & save ${formatPrice(onlineSaving)} · Fastest confirmation` : 'Fastest confirmation'}
                    </p>
                  </div>
                  {onlineSaving > 0 && (
                    <span className="shrink-0 rounded bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
                      Save {formatPrice(onlineSaving)}
                    </span>
                  )}
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
                    <span>Pay {formatPrice(payable)}</span>
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
                {placedOrder.voucherDiscount > 0 && (
                  <div className="flex justify-between gap-3"><span className="text-slate-500">{placedOrder.voucherCode || PANIPAT_VOUCHER_CODE} · {voucherLabel(placedOrder.voucherCode)}</span><span className="font-semibold text-emerald-700">−{formatPrice(placedOrder.voucherDiscount)}</span></div>
                )}
                {placedOrder.onlineDiscount > 0 && (
                  <div className="flex justify-between"><span className="text-slate-500">Online payment discount</span><span className="font-semibold text-emerald-700">−{formatPrice(placedOrder.onlineDiscount)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-slate-500">Total</span><span className="font-semibold">{formatPrice(placedOrder.totalAmount)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-semibold">{placedOrder.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online (paid)'}</span></div>
                <div className="flex justify-between gap-3"><span className="text-slate-500 shrink-0">Address</span><span className="font-semibold text-right">{placedOrder.shippingAddress?.city}, {placedOrder.shippingAddress?.pincode}</span></div>
              </div>
              {placedOrder.exchange?.optedIn && (
                <p className="mx-auto max-w-md rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                  ♻ Keep your old clothes ready in a bag. Once we pick them up, your next order gets {formatPrice(EXCHANGE_CREDIT)} off automatically.
                </p>
              )}

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
                <Link
                  to={trackHref(placedOrder)}
                  className="px-6 py-3 border border-brand-navy text-brand-navy text-sm font-semibold rounded-xl"
                >
                  Track your order
                </Link>
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
