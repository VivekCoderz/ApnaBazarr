import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminDashboardModal from '../components/AdminDashboardModal';
import { LogOut, ArrowLeft } from 'lucide-react';

export default function AdminPage({ products, orders, feedbacks = [], onAddProduct, onDeleteProduct, onUpdateOrderStatus, onAdminLogout, onToggleStock }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('apna_admin_token');
    onAdminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="bg-slate-900 min-h-screen w-full flex flex-col">
      {/* Top Admin Controls Header Bar */}
      <div className="w-full px-6 py-3 bg-slate-950 flex items-center justify-between text-white border-b border-slate-800 shrink-0">
        <button
          onClick={() => navigate('/')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit Admin to Store</span>
        </button>

        <span className="text-xs font-black tracking-widest uppercase text-amber-400">Apna Bazarr — 100% Full-Screen Admin Workspace</span>

        <button
          onClick={handleLogout}
          className="px-3.5 py-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout Admin</span>
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
        />
      </div>
    </div>
  );
}
