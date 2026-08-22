import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardModal from '../components/AdminDashboardModal';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function AdminPage({ products, orders, feedbacks = [], onAddProduct, onDeleteProduct, onUpdateOrderStatus, onAdminLogout, onToggleStock, onAddOfflineOrder }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "apna_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    onAdminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="bg-slate-900 min-h-screen w-full flex flex-col">
      {/* Top Admin Controls Header Bar */}
      <div className="w-full px-4 sm:px-6 py-3.5 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1.5 text-xs font-black text-slate-355 hover:text-white transition-colors shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Exit to Store</span>
        </button>

        <span className="hidden md:inline text-[10px] font-black tracking-widest uppercase text-amber-450 text-amber-400">
          Apna Bazarr — 100% Full-Screen Admin Workspace
        </span>

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-red-600/95 hover:bg-red-650 text-white text-xs font-black rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs shrink-0 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>

      <div className="flex-1 w-full">
        <AdminDashboardModal
          isOpen={true}
          onClose={() => navigate('/')}
          products={products}
          orders={orders}
          feedbacks={feedbacks}
          onAddProduct={onAddProduct}
          onDeleteProduct={onDeleteProduct}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onToggleStock={onToggleStock}
          onAddOfflineOrder={onAddOfflineOrder}
        />
      </div>
    </div>
  );
}
