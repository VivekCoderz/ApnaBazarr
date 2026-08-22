import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Check, Smartphone, Banknote, CreditCard, Loader2, MapPin } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => '';

export default function CheckoutPage({ cartItems, onOrderComplete, currentUser }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderError, setOrderError] = useState('');

  const [address, setAddress] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    flatNo: '',
    area: '',
    city: '',
    state: 'Delhi',
    addressType: 'Home'
  });

  const [locationOption, setLocationOption] = useState('manual'); // 'auto' or 'manual'
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationSuccess, setLocationSuccess] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  // COD configurations
  const [codCodeInput, setCodCodeInput] = useState('');
  const [isCodEnabled, setIsCodEnabled] = useState(false);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [calculatingShipping, setCalculatingShipping] = useState(false);

  const calculateShippingFees = async (deliveryPincode) => {
    if (!deliveryPincode || deliveryPincode.trim().length !== 6) return;
    setCalculatingShipping(true);
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
      if (data.success) {
        setShippingCharges(data.shippingCharges);
      }
    } catch (err) {
      console.warn("Failed to calculate shipping:", err);
    } finally {
      setCalculatingShipping(false);
    }
  };
  const [codVerificationError, setCodVerificationError] = useState('');
  const [codVerificationSuccess, setCodVerificationSuccess] = useState('');
  const [verifyingCodCode, setVerifyingCodCode] = useState(false);

  const handleVerifyCodCode = async () => {
    if (!codCodeInput.trim()) return;
    setVerifyingCodCode(true);
    setCodVerificationError('');
    setCodVerificationSuccess('');

    try {
      const res = await fetch(`${BASE_URL}/settings/verify-cod`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codCodeInput })
      });
      const data = await res.json();
      if (data.success && data.isValid) {
        setIsCodEnabled(true);
        setCodVerificationSuccess('✅ Secret COD Code accepted! Cash on Delivery option is now available.');
      } else {
        setIsCodEnabled(false);
        setCodVerificationError('❌ Invalid Secret COD Code. Please contact admin.');
      }
    } catch (err) {
      setCodVerificationError('Failed to verify code. Please try again.');
    } finally {
      setVerifyingCodCode(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = shippingCharges;
  const total = subtotal + shipping;

  React.useEffect(() => {
    if (cartItems.length > 0 && total < 100) {
      navigate('/cart');
    }
  }, [cartItems, total, navigate]);

  const indianStates = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", 
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", 
    "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", 
    "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", 
    "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", 
    "West Bengal", "Andaman and Nicobar Islands", "Chandigarh", 
    "Dadra and Nagar Haveli and Daman and Diu", "Delhi", 
    "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
  ];

  const handlePincodeChange = (val) => {
    setAddress(prev => ({ ...prev, pincode: val }));
    if (val === '110001') setAddress(prev => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
    else if (val === '400001') setAddress(prev => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
    else if (val === '560001') setAddress(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
  };

  const fetchLiveLocation = () => {
    setFetchingLocation(true);
    setLocationError('');
    setLocationSuccess('');

    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      setFetchingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'ApnaBazarr/1.0 (apnabazarr@example.com)'
              }
            }
          );
          if (!response.ok) {
            throw new Error('Failed to fetch address details.');
          }
          const data = await response.json();
          
          const addr = data.address || {};
          const pincode = addr.postcode || '';
          const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || '';
          const state = addr.state || '';
          
          // Construct area name
          const areaParts = [];
          if (addr.road) areaParts.push(addr.road);
          if (addr.neighbourhood) areaParts.push(addr.neighbourhood);
          if (addr.suburb && addr.suburb !== city) areaParts.push(addr.suburb);
          const area = areaParts.join(', ') || data.display_name || '';

          let matchedState = 'Delhi';
          if (state) {
            const found = indianStates.find(s => s.toLowerCase() === state.toLowerCase());
            if (found) {
              matchedState = found;
            } else {
              const foundPartial = indianStates.find(s => s.toLowerCase().includes(state.toLowerCase()) || state.toLowerCase().includes(s.toLowerCase()));
              if (foundPartial) {
                matchedState = foundPartial;
              }
            }
          }

          const cleanedPincode = pincode.replace(/\s+/g, '').substring(0, 6);

          setAddress(prev => ({
            ...prev,
            pincode: cleanedPincode || prev.pincode,
            city: city || prev.city,
            state: matchedState || prev.state,
            area: area || prev.area
          }));

          if (cleanedPincode && cleanedPincode.trim().length === 6) {
            calculateShippingFees(cleanedPincode);
          }

          setLocationSuccess('📍 Location fetched successfully! Please fill in your name, phone, and flat number.');
        } catch (err) {
          console.error(err);
          setLocationError('Failed to fetch address details. Please fill manually.');
        } finally {
          setFetchingLocation(false);
        }
      },
      (error) => {
        console.error(error);
        let errorMsg = 'Unable to retrieve location.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Location permission denied. Please allow permission or enter manually.';
        }
        setLocationError(errorMsg);
        setFetchingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.pincode || !address.flatNo || !address.area) {
      alert("Please fill in all required delivery address fields.");
      return;
    }
    await calculateShippingFees(address.pincode);
    setStep(2);
  };

  const loadRazorpayScript = () => {
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
      throw new Error("Server is waking up or temporarily busy. Please try again in 10-15 seconds.");
    }
    return await response.json();
  };

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderError('');

    try {
      if (paymentMethod === 'UPI') {
        // Online Payment Flow (Razorpay)
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          throw new Error("Failed to load Razorpay SDK. Please check your internet connection.");
        }

        // 1. Create Razorpay order on backend
        const orderRes = await fetch(`${BASE_URL}/orders/razorpay`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: total }),
        });
        const orderData = await safeParseJSON(orderRes);
        if (!orderData.success) {
          throw new Error(orderData.message || "Failed to create payment order.");
        }

        // 2. Open Razorpay Checkout Modal
        const options = {
          key: orderData.key,
          amount: orderData.amount,
          currency: 'INR',
          name: 'Apna Bazarr',
          description: 'Secure Payment Gateway',
          image: '/logo.png',
          order_id: orderData.order_id,
          handler: async function (response) {
            try {
              setOrderLoading(true);
              // 3. Verify payment signature on backend and save order
              const verifyRes = await fetch(`${BASE_URL}/orders/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: currentUser?.email || 'guest@apnabazarr.com',
                  items: cartItems.map(item => ({
                    productId: item.id,
                    name: item.name,
                    image: item.image,
                    price: item.price,
                    quantity: item.quantity,
                    customText: item.customText || '',
                    customImage: item.customImage || ''
                  })),
                  shippingAddress: { ...address },
                  totalAmount: total
                }),
              });
              const verifyResult = await safeParseJSON(verifyRes);
              if (!verifyResult.success) {
                throw new Error(verifyResult.message || "Payment verification failed.");
              }

              const savedOrder = verifyResult.order;
              const normalisedOrder = {
                ...savedOrder,
                createdAt: savedOrder.createdAt || new Date().toISOString(),
              };

              setPlacedOrder(normalisedOrder);
              setStep(3);
              onOrderComplete(normalisedOrder);
            } catch (err) {
              setOrderError(err.message || 'Payment verification failed.');
            } finally {
              setOrderLoading(false);
            }
          },
          prefill: {
            name: address.fullName,
            contact: address.phone,
            email: currentUser?.email || 'guest@apnabazarr.com'
          },
          theme: {
            color: '#0066cc'
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
        // Cash on Delivery (COD) Flow
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/orders`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            userEmail: currentUser?.email || 'guest@apnabazarr.com',
            items: cartItems.map(item => ({
              productId: item.id,
              name: item.name,
              image: item.image,
              price: item.price,
              quantity: item.quantity,
              customText: item.customText || '',
              customImage: item.customImage || ''
            })),
            shippingAddress: { ...address },
            paymentMethod: 'COD',
            totalAmount: total,
          }),
        });
        const result = await safeParseJSON(res);
        if (!res.ok) throw new Error(result.message || `Request failed: ${res.status}`);

        const savedOrder = result.order;
        const normalisedOrder = {
          ...savedOrder,
          createdAt: savedOrder.createdAt || new Date().toISOString(),
        };

        setPlacedOrder(normalisedOrder);
        setStep(3);
        onOrderComplete(normalisedOrder);
      }
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      if (paymentMethod !== 'UPI') {
        setOrderLoading(false);
      }
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center shadow-md">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#0066cc]" />
            <h1 className="text-xl font-extrabold">Secure Checkout (India)</h1>
          </div>
          <span className="text-xs text-slate-400 font-bold shrink-0">100% Encrypted Payment</span>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 border-b pb-2">1. Enter Delivery Address</h3>

              {/* Location Mode Toggle */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocationOption('auto');
                    setLocationError('');
                    setLocationSuccess('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${locationOption === 'auto' ? 'bg-white text-[#0066cc] shadow-xs' : 'text-slate-600 hover:text-slate-950'}`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Auto-detect Live Location</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocationOption('manual');
                    setLocationError('');
                    setLocationSuccess('');
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 ${locationOption === 'manual' ? 'bg-white text-[#0066cc] shadow-xs' : 'text-slate-600 hover:text-slate-955'}`}
                >
                  <span>Enter Location Manually</span>
                </button>
              </div>

              {/* Auto Fetch Action Box */}
              {locationOption === 'auto' && (
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center space-y-2.5">
                  <p className="text-xs text-slate-650 font-semibold leading-relaxed">
                    We will automatically detect your coordinates and fill the Address, Pincode, City and State fields.
                  </p>
                  <button
                    type="button"
                    onClick={fetchLiveLocation}
                    disabled={fetchingLocation}
                    className="px-5 py-2.5 bg-[#0066cc] text-white font-extrabold text-xs uppercase tracking-wider rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center space-x-2 mx-auto disabled:opacity-75 cursor-pointer shadow-xs animate-pulse hover:animate-none"
                  >
                    {fetchingLocation ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Detecting Location...</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Detect My Live Location</span>
                      </>
                    )}
                  </button>

                  {locationError && (
                    <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-lg border border-rose-100 max-w-md mx-auto">
                      ⚠️ {locationError}
                    </div>
                  )}
                  {locationSuccess && (
                    <div className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100 max-w-md mx-auto">
                      {locationSuccess}
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input type="text" required value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} placeholder="Enter your name" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile (+91) *</label>
                  <input type="tel" required maxLength={10} value={address.phone} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="9876543210" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode (6 digits) *</label>
                  <input type="text" required maxLength={6} value={address.pincode} onChange={(e) => handlePincodeChange(e.target.value)} placeholder="110001" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flat / House No *</label>
                  <input type="text" required value={address.flatNo} onChange={(e) => setAddress({ ...address, flatNo: e.target.value })} placeholder="Flat 402, Building C" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street / Area / Locality *</label>
                <input type="text" required value={address.area} onChange={(e) => setAddress({ ...address, area: e.target.value })} placeholder="Connaught Place, Near Metro" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City *</label>
                  <input type="text" required value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="New Delhi" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <select value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]">
                    {indianStates.map((st, idx) => <option key={idx} value={st}>{st}</option>)}
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full py-3.5 bg-[#0066cc] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center space-x-2">
                <span>CONTINUE TO PAYMENT (₹{total.toFixed(2)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 border-b pb-2">2. Select Payment Option</h3>
              
              {/* Dynamic Billing Summary */}
              <div className="bg-slate-50 p-4.5 rounded-2xl border border-slate-250 space-y-2 text-xs">
                <h4 className="font-black text-slate-800 uppercase tracking-widest mb-1.5">Order Invoice Summary</h4>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-550">Items Subtotal:</span>
                  <span className="text-slate-800">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-550">Volumetric Shipping Charges:</span>
                  <span className="text-[#0066cc]">₹{shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black border-t border-slate-200/80 pt-2 text-sm mt-1">
                  <span className="text-slate-900">Total Payable Amount:</span>
                  <span className="text-slate-900">₹{total.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div onClick={() => setPaymentMethod('UPI')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'UPI' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-[#0066cc]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">UPI (GPay / PhonePe / Paytm / BHIM)</h4>
                      <p className="text-[11px] text-slate-500">Instant approval</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded">FASTEST</span>
                </div>

                {isCodEnabled && (
                  <div onClick={() => setPaymentMethod('COD')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'COD' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200'}`}>
                    <div className="flex items-center space-x-3">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">Cash on Delivery (COD)</h4>
                        <p className="text-[11px] text-slate-500">Pay cash upon delivery</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COD note and Verification */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs mt-4">
                <div className="text-slate-700 font-bold text-center leading-relaxed space-y-1.5">
                  <p>
                    📢 <span className="text-rose-700 font-extrabold">English Note:</span> If you want <span className="font-extrabold text-slate-900">Cash on Delivery (COD)</span>, please contact us at <span className="font-black text-rose-700 text-sm">9306810726</span>.
                  </p>
                  <p className="border-t border-slate-200/50 pt-1.5 mt-1.5">
                    📢 <span className="text-rose-700 font-extrabold">Hindi Note:</span> अगर आपको <span className="font-extrabold text-slate-900">Cash on Delivery (COD)</span> चाहिए, तो कृपया हमसे <span className="font-black text-rose-700 text-sm">9306810726</span> पर संपर्क करें।
                  </p>
                </div>
                
                <div className="border-t border-slate-200/80 pt-3 space-y-2">
                  <label className="block text-[11px] font-extrabold text-slate-650 uppercase">
                    Have a Secret COD Code?
                  </label>
                  <div className="flex space-x-2">
                    <input 
                      type="text"
                      value={codCodeInput}
                      onChange={(e) => setCodCodeInput(e.target.value)}
                      placeholder="Enter secret COD code..."
                      className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc] bg-white text-slate-850 uppercase font-bold"
                    />
                    <button 
                      onClick={handleVerifyCodCode}
                      disabled={verifyingCodCode || !codCodeInput.trim()}
                      className="px-4 py-2 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0 flex items-center space-x-1 cursor-pointer"
                    >
                      {verifyingCodCode && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Verify</span>
                    </button>
                  </div>
                  {codVerificationError && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">{codVerificationError}</p>
                  )}
                  {codVerificationSuccess && (
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">{codVerificationSuccess}</p>
                  )}
                </div>
              </div>

              {orderError && (
                <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  ⚠️ {orderError}
                </p>
              )}
              <div className="flex space-x-3 pt-3">
                <button onClick={() => setStep(1)} disabled={orderLoading} className="px-4 py-3 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1 disabled:opacity-50">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={orderLoading}
                  className="flex-1 py-3.5 bg-[#0066cc] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md disabled:opacity-70 flex items-center justify-center space-x-2"
                >
                  {orderLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /><span>PLACING ORDER...</span></>
                  ) : (
                    <span>PLACE ORDER NOW (₹{total.toFixed(2)})</span>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && placedOrder && (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h2 className="text-2xl font-extrabold text-slate-900">Order Placed Successfully!</h2>
              <span className="inline-block px-3 py-1 bg-blue-50 text-[#0066cc] font-extrabold text-xs rounded-full border border-blue-100">
                Order ID: {placedOrder.orderId}
              </span>
              <div className="pt-2">
                <button onClick={() => navigate('/orders')} className="px-8 py-3.5 bg-[#0066cc] text-white text-xs font-extrabold rounded-xl shadow-md">
                  VIEW IN MY ORDERS
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
