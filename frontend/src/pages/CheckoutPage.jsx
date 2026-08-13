import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, ArrowLeft, Check, Smartphone, Banknote, CreditCard, Loader2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';
const getToken = () => localStorage.getItem('apna_token');

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

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiId, setUpiId] = useState('');
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99.00;
  const total = subtotal + shipping;

  const indianStates = ["Delhi", "Maharashtra", "Karnataka", "Uttar Pradesh", "Tamil Nadu", "Gujarat", "West Bengal", "Rajasthan", "Haryana", "Punjab"];

  const handlePincodeChange = (val) => {
    setAddress(prev => ({ ...prev, pincode: val }));
    if (val === '110001') setAddress(prev => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
    else if (val === '400001') setAddress(prev => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
    else if (val === '560001') setAddress(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.pincode || !address.flatNo || !address.area) {
      alert("Please fill in all required delivery address fields.");
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setOrderLoading(true);
    setOrderError('');
    try {
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
            id: item.id,
            name: item.name,
            image: item.image,
            price: item.price,
            quantity: item.quantity,
          })),
          shippingAddress: { ...address },
          paymentMethod,
          totalAmount: total,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || `Request failed: ${res.status}`);

      const savedOrder = result.order;
      // Normalise to match the shape the rest of the app expects
      const normalisedOrder = {
        ...savedOrder,
        paymentStatus: paymentMethod === 'COD' ? 'Pending (COD)' : 'Paid Online',
        createdAt: savedOrder.createdAt || new Date().toISOString(),
      };

      setPlacedOrder(normalisedOrder);
      setStep(3);
      onOrderComplete(normalisedOrder);
    } catch (err) {
      setOrderError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setOrderLoading(false);
    }
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 rounded-2xl flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-[#0066cc]" />
            <h1 className="text-xl font-extrabold">Secure Checkout (India)</h1>
          </div>
          <span className="text-xs text-slate-400 font-bold">100% Encrypted Payment</span>
        </div>

        {/* Form Container */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-900 border-b pb-2">1. Enter Delivery Address</h3>
              
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

                <div onClick={() => setPaymentMethod('COD')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${paymentMethod === 'COD' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200'}`}>
                  <div className="flex items-center space-x-3">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Cash on Delivery (COD)</h4>
                      <p className="text-[11px] text-slate-500">Pay cash upon delivery</p>
                    </div>
                  </div>
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
