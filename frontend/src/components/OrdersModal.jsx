import React from 'react';
import { X, Package, Clock, CheckCircle, MapPin, Truck } from 'lucide-react';

export default function OrdersModal({ isOpen, onClose, orders }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col animate-slide-left">
          
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-[#0066cc]" />
              <h3 className="font-extrabold text-base tracking-tight">My Placed Orders</h3>
              <span className="bg-[#0066cc] text-white text-xs px-2 py-0.5 rounded-full font-bold">
                {orders.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {orders.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="p-4 bg-slate-100 text-slate-400 rounded-full">
                  <Package className="w-10 h-10 stroke-[1.5]" />
                </div>
                <h4 className="font-bold text-slate-800 text-base">No orders placed yet</h4>
                <p className="text-slate-500 text-xs max-w-xs">
                  When you place an order, its live tracking status and details will appear right here.
                </p>
              </div>
            ) : (
              orders.map((ord, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3 custom-card-shadow">
                  
                  {/* Order Top Bar */}
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                    <div>
                      <span className="text-xs font-extrabold text-slate-900 block">{ord.orderId}</span>
                      <span className="text-[10px] text-slate-400 font-semibold">
                        Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>

                    <span className="bg-blue-100 text-[#0066cc] font-extrabold text-[10px] px-2.5 py-1 rounded-full border border-blue-200">
                      {ord.orderStatus}
                    </span>
                  </div>

                  {/* Status Progress Timeline */}
                  <div className="space-y-1 py-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                      <span className="text-[#0066cc] font-bold">Ordered</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-[#0066cc] h-full w-1/3 rounded-full" />
                    </div>
                  </div>

                  {/* Ordered Items Preview */}
                  <div className="space-y-2 pt-1">
                    {ord.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded-lg bg-slate-50"
                        />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                          <span className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price}</span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-900">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer Info */}
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 text-slate-600">
                    <div>
                      <span>Payment: </span>
                      <span className="font-bold text-slate-800">{ord.paymentMethod}</span>
                    </div>
                    <div>
                      <span>Total: </span>
                      <span className="font-extrabold text-[#0066cc] text-sm">₹{ord.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
