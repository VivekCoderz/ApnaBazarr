import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';

import Header from './components/Header';
import TopBar from './components/TopBar';
import MobileDrawer from './components/MobileDrawer';
import QuickViewModal from './components/QuickViewModal';
import AuthModal from './components/AuthModal';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import FeedbackForm from './components/FeedbackForm';
import Footer from './components/Footer';

// Pages
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ProfilePage from './pages/ProfilePage';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';
import AdminLoginPage from './pages/AdminLoginPage';
import WishlistPage from './pages/WishlistPage';
import PolicyPage from './pages/PolicyPage';

import { Check } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://apnabazarr-backend.onrender.com';
const getToken = () => localStorage.getItem('apna_token');
const clearToken = () => localStorage.removeItem('apna_token');

function AppContent() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartItems, setCartItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apna_cart') || '[]');
    } catch {
      return [];
    }
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('apna_wishlist') || '[]');
    } catch {
      return [];
    }
  });
  const [orders, setOrders] = useState([]);
  
  // Customer Feedbacks State
  const [feedbacks, setFeedbacks] = useState([]);

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // Sync Cart and Wishlist to localStorage when updated
  useEffect(() => {
    localStorage.setItem('apna_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('apna_wishlist', JSON.stringify(wishlistItems));
  }, [wishlistItems]);

  // ─── On Mount: restore session + load products ──────────────────────
  useEffect(() => {
    // Restore admin session
    const adminToken = localStorage.getItem('apna_admin_token');
    if (adminToken) setIsAdminAuthenticated(true);

    // Restore user session from cookie on refresh/mount
    const restoreSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          credentials: 'include',
        });
        const result = await res.json();
        if (result.success && result.user) {
          setCurrentUser(result.user);
          // Set database cart & wishlist
          if (result.user.cart && result.user.cart.length > 0) {
            setCartItems(result.user.cart.map(c => ({
              id: c.productId,
              name: c.name,
              price: c.price,
              quantity: c.quantity,
              image: c.image
            })));
          }
          if (result.user.wishlist && result.user.wishlist.length > 0) {
            setWishlistItems(result.user.wishlist.map(w => ({
              id: w.productId,
              name: w.name,
              price: w.price,
              image: w.image
            })));
          }
          // Load their orders from backend
          loadUserOrders(result.user.email);
        }
      } catch {
        // Silently ignore if not logged in
      }
    };

    // Fetch products from backend
    const loadProducts = async () => {
      try {
        const res = await fetch(`${BASE_URL}/products`);
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
          setProducts(result.data);
        }
        // If backend returns empty, PRODUCTS fallback stays in state
      } catch {
        // Network error — keep static fallback
        console.warn('Could not reach backend for products — using local data.');
      } finally {
        setProductsLoading(false);
      }
    };

    restoreSession();
    loadProducts();
  }, []);

  // Load orders for a given user email from the backend
  const loadUserOrders = async (email) => {
    try {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = email ? `${BASE_URL}/orders?email=${email}` : `${BASE_URL}/orders`;
      const res = await fetch(url, { headers, credentials: 'include' });
      const result = await res.json();
      if (result.success) setOrders(result.orders || []);
    } catch {
      // Silently ignore — orders page will just be empty
    }
  };

  // Sync Cart to database when it changes
  useEffect(() => {
    if (!currentUser) return;
    const syncCart = async () => {
      try {
        await fetch(`${BASE_URL}/auth/cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            cart: cartItems.map(item => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image
            }))
          })
        });
      } catch (err) {
        console.warn("Failed to sync cart to database:", err);
      }
    };
    const timer = setTimeout(() => {
      syncCart();
    }, 500);
    return () => clearTimeout(timer);
  }, [cartItems, currentUser]);

  // Sync Wishlist to database when it changes
  useEffect(() => {
    if (!currentUser) return;
    const syncWishlist = async () => {
      try {
        await fetch(`${BASE_URL}/auth/wishlist`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            wishlist: wishlistItems.map(item => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              image: item.image
            }))
          })
        });
      } catch (err) {
        console.warn("Failed to sync wishlist to database:", err);
      }
    };
    const timer = setTimeout(() => {
      syncWishlist();
    }, 500);
    return () => clearTimeout(timer);
  }, [wishlistItems, currentUser]);

  // Modal States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Track Recently Viewed Products
  const handleProductViewed = (product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep top 5 recently viewed
    });
  };

  // Customer Feedback Submit Handler
  const handleSubmitFeedback = (newFeedback) => {
    setFeedbacks(prev => [newFeedback, ...prev]);
    showToast("Feedback submitted to store admin!");
  };

  // Cart Handler (STRICT GUEST LOGIN CHECK)
  const handleAddToCart = (product, quantityToAdd = 1) => {
    if (!currentUser) {
      showToast("🔒 Please log in to your account to add items to Cart!");
      setIsAuthOpen(true);
      return;
    }

    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantityToAdd }
            : item
        );
      } else {
        return [...prev, { ...product, quantity: quantityToAdd }];
      }
    });
    showToast(`Added "${product.name}" to cart!`);
  };

  const handleUpdateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(id);
    } else {
      setCartItems(prev =>
        prev.map(item => (item.id === id ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const handleRemoveFromCart = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  // Wishlist Handler (STRICT GUEST LOGIN CHECK)
  const handleToggleWishlist = (product) => {
    if (!currentUser) {
      showToast("🔒 Please log in to your account to save items to Wishlist!");
      setIsAuthOpen(true);
      return;
    }

    setWishlistItems(prev => {
      const exists = prev.some(item => item.id === product.id);
      if (exists) {
        showToast(`Removed "${product.name}" from Wishlist`);
        return prev.filter(item => item.id !== product.id);
      } else {
        showToast(`Saved "${product.name}" to Wishlist!`);
        return [...prev, product];
      }
    });
  };

  const handleCategorySelect = (catName) => {
    navigate(`/shop?category=${encodeURIComponent(catName)}`);
  };

  // Order Handler
  const handleOrderComplete = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    showToast(`🎉 Order ${newOrder.orderId} placed successfully!`);
  };

  // Admin Product & Order Handlers
  // Admin Product & Order Handlers
  const handleAddProduct = async (newProduct) => {
    try {
      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => [data.data, ...prev]);
        showToast(`Product "${data.data.name}" published to store!`);
      }
    } catch {
      showToast("Failed to add product to database.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const res = await fetch(`${BASE_URL}/products/${productId}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          setProducts(prev => prev.filter(p => p.id !== productId));
          showToast("Product deleted from database");
        }
      } catch {
        showToast("Failed to delete product from database.");
      }
    }
  };

  const handleToggleStock = async (productId) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;
    const currentStockStatus = targetProduct.inStock !== false;
    const nextStatus = !currentStockStatus;
    try {
      const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inStock: nextStatus, stock: nextStatus ? 50 : 0 })
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => prev.map(p => p.id === productId ? data.data : p));
        showToast("Product stock status updated in database!");
      }
    } catch {
      showToast("Failed to update stock status in database.");
    }
  };

  const handleUpdateOrderStatus = (orderId, newStatus) => {
    setOrders(prev =>
      prev.map(ord => (ord.orderId === orderId ? { ...ord, orderStatus: newStatus } : ord))
    );
    showToast(`Order ${orderId} updated to: ${newStatus}`);
  };

  const handleAdminLogin = (adminData) => {
    setIsAdminAuthenticated(true);
    showToast("Admin session authenticated!");
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    showToast("Logged out of Admin Panel");
  };

  // Auth Handler
  const handleAuthSuccess = (userObj) => {
    setCurrentUser(userObj);
    showToast(`Welcome back, ${userObj.name}!`);
    if (userObj.cart && userObj.cart.length > 0) {
      setCartItems(userObj.cart.map(c => ({
        id: c.productId,
        name: c.name,
        price: c.price,
        quantity: c.quantity,
        image: c.image
      })));
    }
    if (userObj.wishlist && userObj.wishlist.length > 0) {
      setWishlistItems(userObj.wishlist.map(w => ({
        id: w.productId,
        name: w.name,
        price: w.price,
        image: w.image
      })));
    }
    // Load their orders after login
    if (userObj.email) loadUserOrders(userObj.email);
  };

  const handleLogout = async () => {
    try {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', headers, credentials: 'include' });
    } catch { /* ignore */ }
    clearToken();
    setCurrentUser(null);
    setOrders([]);
    setCartItems([]);
    setWishlistItems([]);
    showToast('Logged out successfully');
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-4 border-slate-200 border-t-[#0066cc] rounded-full animate-spin"></div>
          <span className="absolute font-black text-xs text-slate-800">APNA</span>
        </div>
        <div className="text-center space-y-1">
          <h2 className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">Apna Bazarr</h2>
          <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Loading premium store assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-[#0066cc] selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Ribbon */}
      <TopBar />

      {/* Header */}
      <Header
        cartCount={totalCartCount}
        wishlistCount={wishlistItems.length}
        products={products}
        currentUser={currentUser}
        onOpenCart={() => {
          if (!currentUser) setIsAuthOpen(true);
          else navigate('/cart');
        }}
        onOpenWishlist={() => {
          if (!currentUser) setIsAuthOpen(true);
          else navigate('/wishlist');
        }}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      {/* Multi-Page Routes */}
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={products}
                recentlyViewed={recentlyViewed}
                onAddToCart={handleAddToCart}
                onQuickView={(p) => setQuickViewProduct(p)}
                onToggleWishlist={handleToggleWishlist}
                wishlistItems={wishlistItems}
                cartItems={cartItems}
                onSelectCategory={handleCategorySelect}
                onSubmitFeedback={handleSubmitFeedback}
                currentUser={currentUser}
              />
            }
          />

          <Route
            path="/shop"
            element={
              <ShopPage
                products={products}
                onAddToCart={handleAddToCart}
                onQuickView={(p) => setQuickViewProduct(p)}
                onToggleWishlist={handleToggleWishlist}
                wishlistItems={wishlistItems}
                cartItems={cartItems}
              />
            }
          />

          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
                products={products}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                wishlistItems={wishlistItems}
                cartItems={cartItems}
                onQuickView={(p) => setQuickViewProduct(p)}
                onProductViewed={handleProductViewed}
                currentUser={currentUser}
              />
            }
          />

          <Route
            path="/cart"
            element={
              <CartPage
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveFromCart}
              />
            }
          />

          <Route
            path="/checkout"
            element={
              <CheckoutPage
                cartItems={cartItems}
                currentUser={currentUser}
                onOrderComplete={handleOrderComplete}
              />
            }
          />

          <Route
            path="/profile"
            element={<ProfilePage currentUser={currentUser} />}
          />

          <Route
            path="/wishlist"
            element={
              <WishlistPage
                wishlistItems={wishlistItems}
                onAddToCart={handleAddToCart}
                onToggleWishlist={handleToggleWishlist}
                cartItems={cartItems}
              />
            }
          />

          <Route path="/terms" element={<PolicyPage type="terms" />} />
          <Route path="/privacy" element={<PolicyPage type="privacy" />} />
          <Route path="/shipping" element={<PolicyPage type="shipping" />} />
          <Route path="/refunds" element={<PolicyPage type="refunds" />} />
          <Route path="/contact" element={<PolicyPage type="contact" />} />

          <Route
            path="/orders"
            element={<OrdersPage orders={orders} />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />

          <Route
            path="/feedback"
            element={
              <div className="py-12 bg-slate-50">
                <FeedbackForm onSubmitFeedback={handleSubmitFeedback} currentUser={currentUser} />
              </div>
            }
          />

          <Route
            path="/admin/login"
            element={<AdminLoginPage onAdminLogin={handleAdminLogin} />}
          />

          {/* Protected Admin Route */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute isAdminAuthenticated={isAdminAuthenticated} currentUser={currentUser}>
                <AdminPage
                  products={products}
                  orders={orders}
                  feedbacks={feedbacks}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAdminLogout={handleAdminLogout}
                  onToggleStock={handleToggleStock}
                />
              </ProtectedAdminRoute>
            }
          />
        </Routes>
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals & Drawers */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        cartCount={totalCartCount}
        wishlistCount={wishlistItems.length}
        onOpenCart={() => {
          if (!currentUser) setIsAuthOpen(true);
          else navigate('/cart');
        }}
        onOpenWishlist={() => {
          if (!currentUser) setIsAuthOpen(true);
          else navigate('/wishlist');
        }}
        onOpenSearch={() => navigate('/shop')}
      />

      <QuickViewModal
        product={quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={handleAddToCart}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={quickViewProduct ? wishlistItems.some(i => i.id === quickViewProduct.id) : false}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}