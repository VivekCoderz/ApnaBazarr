import { useState, useEffect } from 'react';
import {
  LayoutDashboard, ShoppingBag, Package, TrendingUp, MessageSquare, Star, Store, Settings,
  MoreHorizontal, Users, ExternalLink, LogOut, ChevronRight
} from 'lucide-react';
import { SELLER_MARKETPLACE_ENABLED } from '../config/store';
import { BASE_URL, adminHeaders } from './admin/adminApi';
import { isNewOrder } from './admin/orderUtils';
import OverviewPanel from './admin/OverviewPanel';
import OrdersPanel from './admin/OrdersPanel';
import ProductsPanel from './admin/ProductsPanel';
import ProductForm from './admin/ProductForm';
import OfflineOrderModal from './admin/OfflineOrderModal';
import ProfitPanel from './admin/ProfitPanel';
import FeedbackPanel from './admin/FeedbackPanel';
import SettingsPanel from './admin/SettingsPanel';
import SellersPanel from './admin/SellersPanel';

// Hooks live in the inner component so the early return never changes the hook order
export default function AdminDashboardModal(props) {
  if (!props.isOpen) return null;
  return <AdminDashboardContent {...props} />;
}

const MOBILE_TABS = ['overview', 'orders', 'products', 'more'];

function AdminDashboardContent({
  onClose, products, orders, onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateOrderStatus,
  onToggleStock, onToggleActive, onAddOfflineOrder, onLogout, onOpenResellers
}) {
  // 'overview' | 'orders' | 'products' | 'productForm' | 'profit' | 'feedbacks' | 'reviews' | 'sellers' | 'settings' | 'more'
  const [activeTab, setActiveTab] = useState('overview');
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showOfflineOrder, setShowOfflineOrder] = useState(false);

  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(true);
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  const [settings, setSettings] = useState({ secret_cod_code: 'APNACOD', commission_percentage: '10' });
  const [codCode, setCodCode] = useState('');
  const [commission, setCommission] = useState('');

  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(SELLER_MARKETPLACE_ENABLED);

  const fetchSellers = () => {
    if (!SELLER_MARKETPLACE_ENABLED) return Promise.resolve();
    return fetch(`${BASE_URL}/auth/admin/sellers`, { headers: adminHeaders(), credentials: 'include' })
      .then(r => r.json())
      .then(result => { if (result.success) setSellers(result.sellers); })
      .catch(err => console.warn('Failed to fetch sellers:', err))
      .finally(() => setSellersLoading(false));
  };

  const reloadSellers = () => {
    setSellersLoading(true);
    fetchSellers();
  };

  useEffect(() => {
    // Feedback list, reviewer emails and the COD code are admin-only on the server: send the admin token
    const init = { credentials: 'include', headers: adminHeaders() };
    fetch(`${BASE_URL}/feedbacks`, init)
      .then(r => r.json())
      .then(d => { if (d.success) setFeedbacks(d.feedbacks || []); })
      .catch(() => {})
      .finally(() => setFeedbacksLoading(false));
    fetch(`${BASE_URL}/reviews`, init)
      .then(r => r.json())
      .then(d => { if (d.success) setAllReviews(d.reviews || []); })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
    fetch(`${BASE_URL}/settings`, init)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setSettings(d.settings);
          setCodCode(d.settings.secret_cod_code);
          setCommission(d.settings.commission_percentage || '10');
        }
      })
      .catch(() => {});
    fetchSellers();
  }, []);

  const go = (tab) => {
    setActiveTab(tab);
    if (tab === 'sellers') reloadSellers();
    window.scrollTo(0, 0);
  };

  const openOrders = (filter = 'all', search = '') => {
    setOrderFilter(filter);
    setOrderSearch(search);
    go('orders');
  };

  const openProductForm = (product = null) => {
    setEditingProduct(product);
    go('productForm');
  };

  const newOrders = orders.filter(isNewOrder).length;

  const NAV = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ShoppingBag, badge: newOrders },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'profit', label: 'Profit', icon: TrendingUp },
    { id: 'feedbacks', label: 'Feedback', icon: MessageSquare, count: feedbacks.length },
    { id: 'reviews', label: 'Reviews', icon: Star, count: allReviews.length },
    ...(SELLER_MARKETPLACE_ENABLED ? [{ id: 'sellers', label: 'Sellers', icon: Store, count: sellers.length }] : []),
    { id: 'settings', label: 'Settings', icon: Settings }
  ];
  const navById = Object.fromEntries(NAV.map(n => [n.id, n]));
  const highlighted = activeTab === 'productForm' ? 'products' : activeTab;
  const mobileHighlighted = MOBILE_TABS.includes(highlighted) ? highlighted : 'more';

  const extraLinks = [
    onOpenResellers && { id: 'resellers', label: 'Reseller payouts', icon: Users, onClick: onOpenResellers },
    { id: 'store', label: 'View store', icon: ExternalLink, onClick: onClose },
    onLogout && { id: 'logout', label: 'Log out', icon: LogOut, onClick: onLogout }
  ].filter(Boolean);

  const sideItem = (item, active) => {
    const Icon = item.icon;
    return (
      <button
        key={item.id}
        type="button"
        onClick={item.onClick || (() => go(item.id))}
        className={`flex min-h-10 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors cursor-pointer ${
          active ? 'bg-blue-50 text-brand-navy' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge > 0 && <span className="rounded bg-brand-cta px-1.5 text-xs font-semibold leading-5 text-white tabular-nums">{item.badge}</span>}
        {!item.badge && item.count > 0 && <span className="text-xs text-slate-400 tabular-nums">{item.count}</span>}
      </button>
    );
  };

  let content;
  switch (activeTab) {
    case 'orders':
      content = (
        <OrdersPanel
          orders={orders}
          filter={orderFilter}
          onFilterChange={setOrderFilter}
          search={orderSearch}
          onSearchChange={setOrderSearch}
          onUpdateOrderStatus={onUpdateOrderStatus}
          onAddOfflineOrder={() => setShowOfflineOrder(true)}
        />
      );
      break;
    case 'products':
      content = (
        <ProductsPanel
          products={products}
          onAdd={() => openProductForm(null)}
          onEdit={onUpdateProduct ? (p) => openProductForm(p) : null}
          onToggleStock={onToggleStock}
          onToggleActive={onToggleActive}
          onDeleteProduct={onDeleteProduct}
        />
      );
      break;
    case 'productForm':
      content = (
        <ProductForm
          key={editingProduct ? editingProduct.id : 'new'}
          product={editingProduct}
          onSubmit={editingProduct ? (fields) => onUpdateProduct(editingProduct.id, fields) : onAddProduct}
          onCancel={() => { setEditingProduct(null); go('products'); }}
        />
      );
      break;
    case 'profit':
      content = <ProfitPanel orders={orders} products={products} />;
      break;
    case 'feedbacks':
      content = <FeedbackPanel mode="feedback" items={feedbacks} loading={feedbacksLoading} />;
      break;
    case 'reviews':
      content = <FeedbackPanel mode="reviews" items={allReviews} loading={reviewsLoading} />;
      break;
    case 'sellers':
      content = SELLER_MARKETPLACE_ENABLED
        ? <SellersPanel sellers={sellers} loading={sellersLoading} commission={settings.commission_percentage} onReload={reloadSellers} />
        : null;
      break;
    case 'settings':
      content = (
        <SettingsPanel
          codCode={codCode}
          commission={commission}
          onCodCodeChange={setCodCode}
          onCommissionChange={setCommission}
          onSaved={(s) => {
            setSettings(s);
            setCodCode(s.secret_cod_code);
            setCommission(s.commission_percentage);
            if (SELLER_MARKETPLACE_ENABLED) reloadSellers();
          }}
        />
      );
      break;
    case 'more':
      content = (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-ink">More</h2>
          <div className="divide-y divide-line rounded-lg border border-line bg-white shadow-card">
            {[...NAV.filter(n => !MOBILE_TABS.includes(n.id)), ...extraLinks].map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick || (() => go(item.id))}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-sm font-medium text-ink hover:bg-slate-50 cursor-pointer"
                >
                  <Icon className="h-5 w-5 text-slate-500" />
                  <span className="flex-1">{item.label}</span>
                  {item.count > 0 && <span className="text-xs text-slate-400 tabular-nums">{item.count}</span>}
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      );
      break;
    default:
      content = <OverviewPanel orders={orders} products={products} onOpenOrders={openOrders} />;
  }

  return (
    <div className="min-h-screen w-full bg-brand-cream text-ink antialiased md:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-white md:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="border-b border-line px-5 py-4">
            <p className="text-lg font-bold tracking-tight text-brand-navy">Dhagaro</p>
            <p className="text-xs text-slate-500">Admin</p>
          </div>
          <nav className="flex-1 space-y-0.5 overflow-y-auto p-3" aria-label="Admin">
            {NAV.map(item => sideItem(item, highlighted === item.id))}
          </nav>
          <div className="space-y-0.5 border-t border-line p-3">
            {extraLinks.map(item => sideItem(item, false))}
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-white px-4 md:hidden">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold tracking-tight text-brand-navy">Dhagaro</span>
            <span className="text-xs text-slate-500">Admin</span>
          </div>
          <span className="truncate text-sm font-medium text-slate-600">
            {activeTab === 'productForm' ? (editingProduct ? 'Edit product' : 'Add product') : navById[activeTab]?.label || ''}
          </span>
        </header>

        <main className="mx-auto w-full max-w-5xl px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 md:py-8 md:pb-10">
          {content}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Admin"
      >
        {MOBILE_TABS.map(id => {
          const item = id === 'more' ? { id, label: 'More', icon: MoreHorizontal } : navById[id];
          const Icon = item.icon;
          const active = mobileHighlighted === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => go(id)}
              className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-medium cursor-pointer ${active ? 'text-brand-navy' : 'text-slate-500'}`}
            >
              {active && <span className="absolute inset-x-6 top-0 h-0.5 rounded-b bg-brand-navy" />}
              <span className="relative">
                <Icon className="h-5 w-5" />
                {item.badge > 0 && (
                  <span className="absolute -right-3 -top-1.5 min-w-4 rounded bg-brand-cta px-1 text-[10px] font-semibold leading-4 text-white tabular-nums">{item.badge}</span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {showOfflineOrder && (
        <OfflineOrderModal products={products} onClose={() => setShowOfflineOrder(false)} onSaved={onAddOfflineOrder} />
      )}
    </div>
  );
}
