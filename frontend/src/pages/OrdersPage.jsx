import React from 'react';
import { Package, Truck, CheckCircle } from 'lucide-react';

export default function OrdersPage({ orders }) {
  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">My Placed Orders</h1>
            <p className="text-xs text-slate-500 mt-1">Track active shipments and review past purchases</p>
          </div>
          <span className="bg-[#0066cc] text-white text-xs px-3 py-1 rounded-full font-bold">
            {orders.length} Total Order(s)
          </span>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <div className="p-4 bg-slate-100 text-slate-400 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No orders placed yet</h3>
            <p className="text-xs text-slate-500">When you buy items, live tracking status will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((ord, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
                
                {/* Top Info */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-sm font-extrabold text-slate-900">{ord.orderId}</span>
                    <span className="text-xs text-slate-400 block sm:inline sm:ml-2">
                      Placed on {new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <span className="bg-blue-100 text-[#0066cc] font-extrabold text-xs px-3 py-1 rounded-full border border-blue-200">
                    {ord.orderStatus}
                  </span>
                </div>

                {/* Progress Bar Timeline */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span className="text-[#0066cc]">1. Ordered</span>
                    <span>2. Processing</span>
                    <span>3. Shipped</span>
                    <span>4. Delivered</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-[#0066cc] h-full w-3/4 rounded-full" />
                  </div>
                </div>

                {/* Item Previews */}
                <div className="space-y-2">
                  {ord.items.map((item, itemIdx) => (
                    <div key={itemIdx} className="flex items-center space-x-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg bg-white" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                        <span className="text-[11px] text-slate-400">Qty: {item.quantity} × ₹{item.price}</span>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900">₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <span className="text-slate-500">Payment: <strong className="text-slate-800">{ord.paymentMethod}</strong></span>
                  <span className="text-base font-extrabold text-[#0066cc]">Total Paid: ₹{ord.totalAmount.toFixed(2)}</span>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
