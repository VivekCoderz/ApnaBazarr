import React, { useState } from 'react';
import { X, Check, ShieldCheck, MapPin, CreditCard, Smartphone, Banknote, Building, Truck, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cartItems, onOrderComplete }) {
  if (!isOpen) return null;

  const [step, setStep] = useState(1); // 1: Address, 2: Payment, 3: Confirmation
  
  // Address State
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

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI', 'COD', 'CARD', 'NETBANKING'
  const [upiId, setUpiId] = useState('');
  const [cardInfo, setCardInfo] = useState({ number: '', expiry: '', cvv: '' });

  // Placed Order Result State
  const [placedOrder, setPlacedOrder] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shipping = subtotal >= 999 ? 0 : 99.00;
  const total = subtotal + shipping;

  const indianStates = [
    "Delhi", "Maharashtra", "Karnataka", "Uttar Pradesh", "Tamil Nadu", 
    "Gujarat", "West Bengal", "Rajasthan", "Haryana", "Punjab", "Telangana", "Kerala", "Bihar", "Madhya Pradesh"
  ];

  const handlePincodeChange = (val) => {
    setAddress(prev => ({ ...prev, pincode: val }));
    if (val === '110001') {
      setAddress(prev => ({ ...prev, city: 'New Delhi', state: 'Delhi' }));
    } else if (val === '400001') {
      setAddress(prev => ({ ...prev, city: 'Mumbai', state: 'Maharashtra' }));
    } else if (val === '560001') {
      setAddress(prev => ({ ...prev, city: 'Bengaluru', state: 'Karnataka' }));
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!address.fullName || !address.phone || !address.pincode || !address.flatNo || !address.area) {
      alert("Please fill in all required address fields.");
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AB-2026-${randomNum}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const newOrder = {
      orderId,
      items: [...cartItems],
      shippingAddress: { ...address },
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'Pending (COD)' : 'Paid Online',
      orderStatus: 'Order Placed',
      totalAmount: total,
      createdAt: new Date().toISOString(),
      estimatedDelivery: estimatedDeliveryStr
    };

    setPlacedOrder(newOrder);
    setStep(3);
    onOrderComplete(newOrder);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={step === 3 ? onClose : undefined}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 animate-fade-in my-auto border border-slate-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#0066cc]" />
            <h3 className="font-extrabold text-base tracking-tight">
              {step === 1 && "1. Delivery Address"}
              {step === 2 && "2. Payment Method"}
              {step === 3 && "3. Order Confirmed!"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Step Indicator */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
          <div className={`flex items-center space-x-1 ${step >= 1 ? 'text-[#0066cc]' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? 'bg-[#0066cc] text-white' : 'bg-slate-200 text-slate-600'}`}>1</span>
            <span>Address</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-1 ${step >= 2 ? 'text-[#0066cc]' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? 'bg-[#0066cc] text-white' : 'bg-slate-200 text-slate-600'}`}>2</span>
            <span>Payment</span>
          </div>
          <div className="w-8 h-0.5 bg-slate-200" />
          <div className={`flex items-center space-x-1 ${step === 3 ? 'text-emerald-600' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'}`}>3</span>
            <span>Confirmation</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          
          {/* STEP 1: ADDRESS FORM */}
          {step === 1 && (
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    placeholder="Enter your name"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number (+91) *</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={address.phone}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pincode (6 digits) *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Flat / House No / Building *</label>
                  <input
                    type="text"
                    required
                    value={address.flatNo}
                    onChange={(e) => setAddress({ ...address, flatNo: e.target.value })}
                    placeholder="e.g. House No 42, Block C"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street / Area / Locality *</label>
                <input
                  type="text"
                  required
                  value={address.area}
                  onChange={(e) => setAddress({ ...address, area: e.target.value })}
                  placeholder="e.g. Connaught Place, Near Metro Station"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City / District *</label>
                  <input
                    type="text"
                    required
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    placeholder="e.g. New Delhi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State *</label>
                  <select
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]"
                  >
                    {indianStates.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Total Overview */}
              <div className="bg-blue-50/60 p-3 rounded-lg flex items-center justify-between border border-blue-100 mt-4">
                <span className="text-xs font-bold text-slate-700">Total Payable Amount:</span>
                <span className="text-base font-extrabold text-[#0066cc]">₹{total.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
              >
                <span>CONTINUE TO PAYMENT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">Select Payment Option:</label>
                
                {/* UPI Option */}
                <div
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'UPI' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-[#0066cc]" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">UPI Instant Payment</h4>
                      <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM UPI</p>
                    </div>
                  </div>
                  <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2 py-0.5 rounded">FASTEST</span>
                </div>

                {paymentMethod === 'UPI' && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 animate-fade-in">
                    <label className="block text-[11px] font-bold text-slate-600">Enter UPI ID (VPA):</label>
                    <input
                      type="text"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="e.g. mobile@upi or username@okicici"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                )}

                {/* Cash On Delivery Option */}
                <div
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'COD' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Cash on Delivery (COD)</h4>
                      <p className="text-[11px] text-slate-500">Pay cash when package arrives at your doorstep</p>
                    </div>
                  </div>
                </div>

                {/* Credit / Debit Card Option */}
                <div
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    paymentMethod === 'CARD' ? 'border-[#0066cc] bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">Credit / Debit Card</h4>
                      <p className="text-[11px] text-slate-500">Visa, Mastercard, RuPay, Maestro</p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Price Breakdown */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Charges</span>
                  <span className="font-bold text-emerald-600">{shipping === 0 ? "FREE" : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Amount</span>
                  <span className="text-[#0066cc]">₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                >
                  <span>PLACE ORDER & PAY ₹{total.toFixed(2)}</span>
                  <Check className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

          {/* STEP 3: ORDER CONFIRMED */}
          {step === 3 && placedOrder && (
            <div className="text-center space-y-4 py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Order Successfully Placed!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Thank you for shopping with <span className="font-bold text-slate-800">Apna Bazarr</span>
                </p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-50 text-[#0066cc] font-extrabold text-xs rounded-full border border-blue-100">
                  Order ID: {placedOrder.orderId}
                </span>
              </div>

              {/* Delivery Timeline Box */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                  <span className="font-bold text-slate-700">Estimated Delivery:</span>
                  <span className="font-extrabold text-[#0066cc]">{placedOrder.estimatedDelivery}</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p className="font-bold text-slate-800">Deliver To:</p>
                  <p>{placedOrder.shippingAddress.fullName} ({placedOrder.shippingAddress.phone})</p>
                  <p className="text-slate-500">{placedOrder.shippingAddress.flatNo}, {placedOrder.shippingAddress.area}, {placedOrder.shippingAddress.city}, {placedOrder.shippingAddress.state} - {placedOrder.shippingAddress.pincode}</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors"
              >
                CONTINUE SHOPPING
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
