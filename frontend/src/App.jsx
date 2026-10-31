import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, useNavigationType } from 'react-router-dom';

import Header from './components/Header';
import TopBar from './components/TopBar';
import MobileDrawer from './components/MobileDrawer';
import QuickViewModal from './components/QuickViewModal';
import AuthModal from './components/AuthModal';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import FeedbackForm from './components/FeedbackForm';
import Footer from './components/Footer';
import WhatsAppFab from './components/WhatsAppFab';

// Pages: the shopping path (home, shop, product, cart) ships in the main bundle;
// everything else is a separate chunk loaded on first visit, so shoppers on cheap
// phones don't download and parse the admin/seller dashboards.
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
const loadCheckoutPage = () => import('./pages/CheckoutPage');
const CheckoutPage = lazy(loadCheckoutPage);
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage = lazy(() => import('./pages/AdminLoginPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const PolicyPage = lazy(() => import('./pages/PolicyPage'));
const RegisterSellerPage = lazy(() => import('./pages/RegisterSellerPage'));
const SellerDashboardPage = lazy(() => import('./pages/SellerDashboardPage'));
const ResellerPage = lazy(() => import('./pages/ResellerPage'));
const AdminResellersPage = lazy(() => import('./pages/AdminResellersPage'));

// Shown while a page chunk downloads (usually a fraction of a second)
function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" role="status" aria-label="Loading page">
      <span className="h-8 w-8 rounded-full border-2 border-slate-200 border-t-brand-navy animate-spin" />
    </div>
  );
}
import { captureReferral } from './utils/referral';

import { Check, ShieldCheck } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};
const getToken = () => getCookie('apna_admin_token');

// Guest cart lives in localStorage so it survives a refresh; merged into the account cart on login
const GUEST_CART_KEY = 'apna_guest_cart';
const readGuestCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};
const writeGuestCart = (items) => {
  try {
    if (items.length > 0) localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    else localStorage.removeItem(GUEST_CART_KEY);
  } catch { /* storage blocked: cart still works for this visit */ }
};
// Same per-line limit as the server (backend/controllers/order.js MAX_QTY_PER_LINE)
const MAX_QTY_PER_LINE = 50;
const cartLineKey = (item) =>
  [item.id, item.customText || '', item.customImage || '', item.selectedSize || '', item.selectedColor || ''].join('|');
// Account cart + guest cart; the same line keeps the larger quantity (no doubling)
const mergeCarts = (accountItems, guestItems) => {
  const merged = new Map(accountItems.map(item => [cartLineKey(item), item]));
  guestItems.forEach(item => {
    const key = cartLineKey(item);
    const existing = merged.get(key);
    merged.set(key, existing ? { ...existing, quantity: Math.max(existing.quantity, item.quantity) } : item);
  });
  return [...merged.values()];
};
const accountCartToItems = (cart = []) => cart.map(c => ({
  id: c.productId,
  name: c.name,
  price: c.price,
  quantity: c.quantity,
  image: c.image,
  selectedSize: c.selectedSize || '',
  selectedColor: c.selectedColor || ''
}));
const clearToken = () => {
  document.cookie = "apna_admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
};

function AppContent() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const isAdminRoute = pathname.startsWith('/admin');
  const isNoNavRoute = pathname.startsWith('/admin') || pathname.startsWith('/seller') || pathname === '/register-seller';

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartItems, setCartItems] = useState(readGuestCart);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [orders, setOrders] = useState([]);

  // Fetch products from backend
  const loadProducts = async () => {
    try {
      const res = await fetch(`${BASE_URL}/products`);
      const result = await res.json();
      if (result.success && result.data) {
        setProducts(result.data);
        productsLoadedAt.current = Date.now();
      }
    } catch {
      console.warn('Could not reach backend for products.');
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch the checkout chunk in the background once the shopper opens the cart
  useEffect(() => {
    if (pathname !== '/cart') return undefined;
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 300));
    const cancel = window.cancelIdleCallback || clearTimeout;
    const handle = idle(() => { loadCheckoutPage().catch(() => {}); });
    return () => cancel(handle);
  }, [pathname]);

  // Remember the reseller who shared the link (?ref=CODE)
  useEffect(() => {
    captureReferral(search);
  }, [search]);

  // New page: start at the top. Back/forward: return to where the visitor was
  // (e.g. the same spot in the shop grid) instead of jumping to the top.
  const navigationType = useNavigationType();
  const { key: locationKey } = useLocation();
  const scrollPositions = useRef(new Map());
  const currentKey = useRef(locationKey);
  useEffect(() => {
    // Remember the scroll position of the page being viewed (once per frame at most)
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scrollPositions.current.set(currentKey.current, window.scrollY);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  useEffect(() => {
    currentKey.current = locationKey;
    const saved = navigationType === 'POP' ? scrollPositions.current.get(locationKey) : undefined;
    // Wait a frame so the new page has rendered before restoring the position
    const frame = requestAnimationFrame(() => window.scrollTo({ top: saved || 0, left: 0, behavior: 'instant' }));
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Refresh the catalogue on navigation, but at most once a minute: a full /products
  // download + re-render on every page change made navigation janky on cheap phones
  const productsLoadedAt = useRef(0);
  useEffect(() => {
    if (Date.now() - productsLoadedAt.current < 60000) return;
    loadProducts();
  }, [pathname]);
  
  // Customer Feedbacks State
  const [feedbacks, setFeedbacks] = useState([]);

  // Recently Viewed State
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const [currentUser, setCurrentUser] = useState(null);
  // False until the saved session (cookie) has been checked, so account pages don't
  // redirect or show "please log in" during the first second after a refresh
  const [authReady, setAuthReady] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  // ─── On Mount: restore session + load products ──────────────────────
  useEffect(() => {
    // Restore admin session from cookie
    const adminToken = getCookie('apna_admin_token');
    if (adminToken) setIsAdminAuthenticated(true);

    // Restore user session from cookie on refresh/mount (unconditionally try fetching)
    const restoreSession = async () => {
      try {
        const res = await fetch(`${BASE_URL}/auth/me`, {
          credentials: 'include'
        });
        const result = await res.json();
        if (result.success && result.user) {
          setCurrentUser(result.user);
          // Account cart + anything added as a guest before logging in
          setCartItems(mergeCarts(accountCartToItems(result.user.cart), readGuestCart()));
          writeGuestCart([]);
          if (result.user.wishlist && result.user.wishlist.length > 0) {
            setWishlistItems(result.user.wishlist.map(w => ({
              id: w.productId,
              name: w.name,
              price: w.price,
              image: w.image
            })));
          }
          if (result.user.recentlyViewed && result.user.recentlyViewed.length > 0) {
            setRecentlyViewed(result.user.recentlyViewed.map(r => ({
              id: r.productId,
              name: r.name,
              price: r.price,
              image: r.image
            })));
          }
          // Load their orders from backend
          loadUserOrders(result.user.email);
        }
      } catch {
        // Silently ignore if not logged in
      } finally {
        setAuthReady(true);
      }
    };

    restoreSession();
    // Products are loaded by the pathname effect above
  }, []);

  // Load feedbacks for admin from backend
  const loadFeedbacks = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${BASE_URL}/feedbacks`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data.success) setFeedbacks(data.feedbacks || []);
    } catch (err) {
      console.warn("Failed to load feedbacks:", err);
    }
  };

  // Admin-only purchase prices, keyed by product id (public /products never includes costPrice)
  const [adminCostPrices, setAdminCostPrices] = useState({});
  // Admin sees every product, including hidden (isActive: false) ones
  const [adminAllProducts, setAdminAllProducts] = useState(null);

  const loadAdminProducts = async () => {
    try {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/products?includeHidden=1`, { headers, credentials: 'include' });
      const result = await res.json();
      if (result.success && result.data) setAdminAllProducts(result.data);
    } catch (err) {
      console.warn("Failed to load admin products:", err);
    }
  };

  const loadAdminCostPrices = async () => {
    try {
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`${BASE_URL}/products/seller/my-products`, { headers, credentials: 'include' });
      const result = await res.json();
      if (result.success && result.data) {
        setAdminCostPrices(Object.fromEntries(result.data.map(p => [String(p.id), p.costPrice])));
      }
    } catch (err) {
      console.warn("Failed to load admin cost prices:", err);
    }
  };

  // Load all admin data when admin is authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      loadUserOrders(); // loads all orders
      loadFeedbacks(); // loads all feedbacks
      loadAdminCostPrices(); // loads costPrice for profit reports
      loadAdminProducts(); // includes hidden products
    } else {
      setAdminCostPrices({});
      setAdminAllProducts(null);
    }
  }, [isAdminAuthenticated]);

  // Public products + admin-only costPrice, used by the admin dashboard profit calculations
  const adminProducts = useMemo(
    () => (adminAllProducts || products).map(p => ({ ...p, costPrice: p.costPrice ?? adminCostPrices[String(p.id)] })),
    [products, adminAllProducts, adminCostPrices]
  );

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

  // Guests: keep the cart in localStorage
  useEffect(() => {
    if (!currentUser) writeGuestCart(cartItems);
  }, [cartItems, currentUser]);

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
              image: item.image,
              selectedSize: item.selectedSize || '',
              selectedColor: item.selectedColor || ''
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

  // Sync Recently Viewed to database when it changes
  useEffect(() => {
    if (!currentUser) return;
    const syncRecentlyViewed = async () => {
      try {
        const token = getToken();
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(`${BASE_URL}/auth/recently-viewed`, {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            recentlyViewed: recentlyViewed.map(item => ({
              productId: item.id,
              name: item.name,
              price: item.price,
              image: item.image
            }))
          })
        });
      } catch (err) {
        console.warn("Failed to sync recently viewed to database:", err);
      }
    };
    const timer = setTimeout(() => {
      syncRecentlyViewed();
    }, 500);
    return () => clearTimeout(timer);
  }, [recentlyViewed, currentUser]);

  // Cleanup deleted products from cart, wishlist, and recently viewed lists
  useEffect(() => {
    // Skip while loading, and when the list is empty (server asleep/unreachable) so carts are not wiped
    if (productsLoading || products.length === 0) return;
    const validProductIds = new Set(products.map(p => String(p.id)));

    const byId = new Map(products.map(p => [String(p.id), p]));
    // Drop removed products and refresh prices, so the cart total matches what the server charges
    setCartItems(prev => {
      const next = prev
        .filter(item => validProductIds.has(String(item.id)))
        .map(item => {
          const live = byId.get(String(item.id));
          return live && (live.price !== item.price || live.name !== item.name || live.image !== item.image)
            ? { ...item, price: live.price, name: live.name, image: live.image }
            : item;
        });
      return next.length === prev.length && next.every((item, i) => item === prev[i]) ? prev : next;
    });
    // Keep the same array when nothing was removed, so the account isn't re-synced on every page change
    const keepValid = prev => {
      const next = prev.filter(item => validProductIds.has(String(item.id)));
      return next.length === prev.length ? prev : next;
    };
    setWishlistItems(keepValid);
    setRecentlyViewed(keepValid);
  }, [products, productsLoading]);

  // Modal States
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimer = useRef(null);

  // One timer at a time: a new toast is not cut short by the previous toast's timer
  const showToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(''), 3500);
  };
  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // Track Recently Viewed Products
  const handleProductViewed = useCallback((product) => {
    if (!product) return;
    setRecentlyViewed(prev => {
      const filtered = prev.filter(p => p.id !== product.id);
      return [product, ...filtered].slice(0, 5); // Keep top 5 recently viewed
    });
  }, []);

  // Customer Feedback Submit Handler
  const handleSubmitFeedback = (newFeedback) => {
    setFeedbacks(prev => [newFeedback, ...prev]);
    showToast("Feedback submitted to store admin!");
  };

  // Cart Handler: works for guests too (no login needed to buy)
  const handleAddToCart = (product, quantityToAdd = 1, customizationOptions = {}) => {
    const defaultSize = product.sizes && product.sizes.length > 0 ? product.sizes[0] : '';
    const defaultColor = product.colors && product.colors.length > 0 ? product.colors[0] : '';
    const { 
      customText = '', 
      customImage = '', 
      selectedSize = product.selectedSize || defaultSize,
      selectedColor = product.selectedColor || defaultColor
    } = customizationOptions;

    setCartItems(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        (item.customText || '') === customText && 
        (item.customImage || '') === customImage &&
        (item.selectedSize || '') === selectedSize &&
        (item.selectedColor || '') === selectedColor
      );
      if (existing) {
        return prev.map(item =>
          (item.id === product.id && 
           (item.customText || '') === customText && 
           (item.customImage || '') === customImage &&
           (item.selectedSize || '') === selectedSize &&
           (item.selectedColor || '') === selectedColor)
            ? { ...item, quantity: Math.min(MAX_QTY_PER_LINE, item.quantity + quantityToAdd) }
            : item
        );
      } else {
        return [...prev, { 
          ...product, 
          quantity: quantityToAdd, 
          customText, 
          customImage,
          selectedSize,
          selectedColor
        }];
      }
    });
    showToast('Added to cart');
  };

  const handleUpdateQuantity = (id, newQty, customText = '', customImage = '', selectedSize = '', selectedColor = '') => {
    if (newQty <= 0) {
      handleRemoveFromCart(id, customText, customImage, selectedSize, selectedColor);
    } else {
      setCartItems(prev =>
        prev.map(item =>
          (item.id === id &&
           (item.customText || '') === customText &&
           (item.customImage || '') === customImage &&
           (item.selectedSize || '') === selectedSize &&
           (item.selectedColor || '') === selectedColor)
            ? { ...item, quantity: Math.min(MAX_QTY_PER_LINE, newQty) }
            : item
        )
      );
    }
  };

  const handleRemoveFromCart = (id, customText = '', customImage = '', selectedSize = '', selectedColor = '') => {
    setCartItems(prev =>
      prev.filter(item =>
        !(item.id === id &&
          (item.customText || '') === customText &&
          (item.customImage || '') === customImage &&
          (item.selectedSize || '') === selectedSize &&
          (item.selectedColor || '') === selectedColor)
      )
    );
  };

  // Wishlist Handler (STRICT GUEST LOGIN CHECK)
  const handleToggleWishlist = (product) => {
    if (!currentUser) {
      showToast("Please log in to use your wishlist");
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
    showToast(`Order ${newOrder.orderId} placed`);
  };

  // Admin Product & Order Handlers
  const handleAddProduct = async (newProduct) => {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify(newProduct)
      });
      const data = await res.json();
      if (data.success) {
        setProducts(prev => [data.data, ...prev]);
        if (isAdminAuthenticated) loadAdminProducts();
        showToast(`Product "${data.data.name}" published to store!`);
      } else {
        showToast(data.message || 'Could not add the product.');
      }
    } catch {
      showToast("Failed to add product to database.");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const token = getToken();
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${BASE_URL}/products/${productId}`, { 
          method: 'DELETE',
          headers,
          credentials: 'include'
        });
        const result = await res.json();
        if (result.success) {
          setProducts(prev => prev.filter(p => String(p.id) !== String(productId)));
          setAdminAllProducts(prev => prev && prev.filter(p => String(p.id) !== String(productId)));
          showToast("Product deleted successfully");
        } else {
          showToast(result.message || 'Could not delete the product.');
        }
      } catch {
        showToast("Failed to delete product from database.");
      }
    }
  };

  const handleToggleStock = async (productId) => {
    const targetProduct = (adminAllProducts || products).find(p => String(p.id) === String(productId));
    if (!targetProduct) return;
    const currentStockStatus = targetProduct.inStock !== false;
    const nextStatus = !currentStockStatus;
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ inStock: nextStatus, stock: nextStatus ? 50 : 0 })
      });
      const data = await res.json();
      if (data.success) {
        loadProducts();
        loadAdminProducts();
        showToast(`Stock updated to: ${nextStatus ? 'In Stock' : 'Out of Stock'}`);
      } else {
        showToast(data.message || 'Could not update stock.');
      }
    } catch {
      showToast("Failed to update stock status in database.");
    }
  };

  // Hide a product from the store (or show it again). Hidden products stay in the admin list.
  const handleToggleActive = async (productId) => {
    const targetProduct = (adminAllProducts || products).find(p => String(p.id) === String(productId));
    if (!targetProduct) return;
    const nextActive = targetProduct.isActive === false;
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ isActive: nextActive })
      });
      const data = await res.json();
      if (data.success) {
        setAdminAllProducts(prev => prev && prev.map(p => String(p.id) === String(productId) ? { ...p, isActive: nextActive } : p));
        loadProducts();
        showToast(nextActive ? 'Product is live in the store again' : 'Product hidden from the store');
      } else {
        showToast(data.message || 'Failed to update product.');
      }
    } catch {
      showToast("Failed to update product in database.");
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        setOrders(prev =>
          prev.map(ord => (ord.orderId === orderId ? { ...ord, orderStatus: newStatus } : ord))
        );
        showToast(`Order ${orderId} updated to: ${newStatus}`);
      } else {
        showToast(result.message || 'Could not update the order status.');
      }
    } catch {
      showToast("Failed to update status in database.");
    }
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
    // Keep what the guest already put in the cart
    setCartItems(prev => mergeCarts(accountCartToItems(userObj.cart), prev));
    writeGuestCart([]);
    if (userObj.wishlist && userObj.wishlist.length > 0) {
      setWishlistItems(userObj.wishlist.map(w => ({
        id: w.productId,
        name: w.name,
        price: w.price,
        image: w.image
      })));
    }
    if (userObj.recentlyViewed && userObj.recentlyViewed.length > 0) {
      setRecentlyViewed(userObj.recentlyViewed.map(r => ({
        id: r.productId,
        name: r.name,
        price: r.price,
        image: r.image
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
    setIsAdminAuthenticated(false);
    setCurrentUser(null);
    setOrders([]);
    setCartItems([]);
    setWishlistItems([]);
    setRecentlyViewed([]);
    showToast('Logged out successfully');
  };

  const totalCartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // No full-screen loader: the shell renders at once and pages show skeletons while
  // products load (the free Render server can take ~50 s to wake up).

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-800 antialiased selection:bg-brand-navy selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] max-w-[90vw] bg-slate-900 text-white text-sm font-semibold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-fade-in border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Ribbon */}
      {!isNoNavRoute && <TopBar />}

      {!isNoNavRoute && (
        <Header
          cartCount={totalCartCount}
          wishlistCount={wishlistItems.length}
          products={products}
          currentUser={currentUser}
          isAdminAuthenticated={isAdminAuthenticated}
          onOpenCart={() => navigate('/cart')}
          onOpenWishlist={() => {
            if (!currentUser) setIsAuthOpen(true);
            else navigate('/wishlist');
          }}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Multi-Page Routes */}
      <main className="flex-1">
        <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <HomePage
                products={products}
                loading={productsLoading}
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
                loading={productsLoading}
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
                loading={productsLoading}
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
            element={<ProfilePage currentUser={currentUser} authReady={authReady} onOpenAuth={() => setIsAuthOpen(true)} />}
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
            element={<OrdersPage orders={orders} currentUser={currentUser} authReady={authReady} onOpenAuth={() => setIsAuthOpen(true)} />}
          />

          <Route
            path="/settings"
            element={<SettingsPage currentUser={currentUser} authReady={authReady} onOpenAuth={() => setIsAuthOpen(true)} />}
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
            path="/register-seller"
            element={<RegisterSellerPage currentUser={currentUser} authReady={authReady} onAuthSuccess={handleAuthSuccess} onOpenAuth={() => setIsAuthOpen(true)} />}
          />

          <Route
            path="/seller"
            element={<SellerDashboardPage currentUser={currentUser} authReady={authReady} onLogout={handleLogout} onAuthSuccess={handleAuthSuccess} />}
          />

          <Route
            path="/reseller"
            element={<ResellerPage currentUser={currentUser} authReady={authReady} products={products} onAuthSuccess={handleAuthSuccess} onOpenAuth={() => setIsAuthOpen(true)} />}
          />

          <Route
            path="/admin/resellers"
            element={
              <ProtectedAdminRoute isAdminAuthenticated={isAdminAuthenticated} currentUser={currentUser}>
                <AdminResellersPage />
              </ProtectedAdminRoute>
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
                  products={adminProducts}
                  orders={orders}
                  feedbacks={feedbacks}
                  onAddProduct={handleAddProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                  onAdminLogout={handleAdminLogout}
                  onToggleStock={handleToggleStock}
                  onToggleActive={handleToggleActive}
                  onAddOfflineOrder={loadUserOrders}
                />
              </ProtectedAdminRoute>
            }
          />

          {/* Unknown URLs (old links, typos) */}
          <Route
            path="*"
            element={
              <div className="py-20 px-4 bg-slate-50 min-h-[60vh] text-center space-y-4">
                <h1 className="text-2xl font-bold text-brand-navy">Page not found</h1>
                <p className="text-base text-slate-600">This link is broken or the page has moved.</p>
                <Link to="/shop" className="inline-flex min-h-11 items-center px-6 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-lg">
                  Browse the shop
                </Link>
              </div>
            }
          />
        </Routes>
        </Suspense>
      </main>

      {/* Footer */}
      {!isNoNavRoute && <Footer products={products} />}

      {/* Floating WhatsApp help (hidden on checkout/admin inside the component) */}
      {!isNoNavRoute && <WhatsAppFab products={products} />}

      {/* Global Modals & Drawers */}
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        cartCount={totalCartCount}
        wishlistCount={wishlistItems.length}
        onOpenCart={() => navigate('/cart')}
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

      {/* Persistent Floating Switch to Admin Panel Button (Visible to admin on store pages) */}
      {!isAdminRoute && isAdminAuthenticated && (
        <button
          onClick={() => navigate('/admin')}
          className="fixed bottom-6 left-6 z-50 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-black text-xs px-4.5 py-3.5 rounded-full shadow-2xl flex items-center space-x-2 border-2 border-slate-950 transition-all hover:shadow-amber-500/20 active:shadow-none"
          title="Switch to Admin Dashboard"
        >
          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
          <span>Switch to Admin Panel</span>
        </button>
      )}

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