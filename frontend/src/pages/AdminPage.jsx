import { useNavigate } from 'react-router-dom';
import AdminDashboardModal from '../components/AdminDashboardModal';

export default function AdminPage({ products, orders, feedbacks = [], onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateOrderStatus, onAdminLogout, onToggleStock, onToggleActive, onAddOfflineOrder }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.cookie = "apna_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    onAdminLogout();
    navigate('/admin/login');
  };

  // The dashboard draws its own layout (sidebar on desktop, bottom bar on phones),
  // including the "View store", "Reseller payouts" and "Log out" links.
  return (
    <AdminDashboardModal
      isOpen={true}
      onClose={() => navigate('/')}
      onLogout={handleLogout}
      onOpenResellers={() => navigate('/admin/resellers')}
      products={products}
      orders={orders}
      feedbacks={feedbacks}
      onAddProduct={onAddProduct}
      onUpdateProduct={onUpdateProduct}
      onDeleteProduct={onDeleteProduct}
      onUpdateOrderStatus={onUpdateOrderStatus}
      onToggleStock={onToggleStock}
      onToggleActive={onToggleActive}
      onAddOfflineOrder={onAddOfflineOrder}
    />
  );
}
