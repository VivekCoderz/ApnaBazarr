import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, Package, ShoppingBag, Plus, Trash2, CheckCircle, 
  Tag, Upload, Loader2, DollarSign, MapPin, Phone, 
  FileText, LogOut, ArrowRight, ArrowLeft, Eye, RefreshCw, X, AlertCircle, Menu, Settings, Image, Star, CreditCard, Landmark, LifeBuoy, AlertTriangle,
  Search, Bell, HelpCircle, ChevronDown, TrendingUp
} from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const getToken = () => '';
const STANDARD_CATEGORIES = ["Clothing", "Footwear", "Accessories", "Electronics", "Home Decor", "Gifts & Hampers"];

async function uploadToCloudinary(file, endpoint) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload/${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
    return data.url;
  } else {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 150)}`);
  }
}

export default function SellerDashboardPage({ currentUser, onLogout, onAuthSuccess }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview'); // overview, products, orders, payouts, support, settings
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reviewsData, setReviewsData] = useState({ reviews: [], averageSellerRating: 5 });
  const [myTickets, setMyTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Interactive dashboard states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRangeFilter, setDateRangeFilter] = useState('7days');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [coupons, setCoupons] = useState([
    { code: 'SAVE10', type: 'percentage', value: 10, expiry: '2026-12-31' },
    { code: 'FESTIVE150', type: 'flat', value: 150, expiry: '2026-09-30' }
  ]);
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');
  const [newCouponValue, setNewCouponValue] = useState('');
  const [newCouponExpiry, setNewCouponExpiry] = useState('');

  // Shop settings state (initialized from currentUser)
  const [shopName, setShopName] = useState(currentUser?.sellerProfile?.shopName || '');
  const [shopDescription, setShopDescription] = useState(currentUser?.sellerProfile?.shopDescription || '');
  const [shopAddress, setShopAddress] = useState(currentUser?.sellerProfile?.shopAddress || '');
  const [shopPhone, setShopPhone] = useState(currentUser?.sellerProfile?.phone || '');
  const [shopIsOpen, setShopIsOpen] = useState(currentUser?.sellerProfile?.isOpen ?? true);
  const [shopBanner, setShopBanner] = useState(currentUser?.sellerProfile?.shopBanner || '');
  const [shopLogo, setShopLogo] = useState(currentUser?.sellerProfile?.shopLogo || '');
  const [pickupPincode, setPickupPincode] = useState(currentUser?.sellerProfile?.pickupPincode || '');
  const [returnPolicy, setReturnPolicy] = useState(currentUser?.sellerProfile?.returnPolicy || '7 Days Return Policy');
  const [deliveryInformation, setDeliveryInformation] = useState(currentUser?.sellerProfile?.deliveryInformation || 'Delivered in 3-5 business days.');
  const [logoUploading, setLogoUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Bank Payout details state
  const [accountName, setAccountName] = useState(currentUser?.sellerProfile?.bankDetails?.accountName || '');
  const [accountNumber, setAccountNumber] = useState(currentUser?.sellerProfile?.bankDetails?.accountNumber || '');
  const [ifscCode, setIfscCode] = useState(currentUser?.sellerProfile?.bankDetails?.ifscCode || '');
  const [bankName, setBankName] = useState(currentUser?.sellerProfile?.bankDetails?.bankName || '');

  // Support & Tickets Form State
  const [ticketCategory, setTicketCategory] = useState('Bug / System Error');
  const [ticketPriority, setTicketPriority] = useState('Medium');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSubmitting, setTicketSubmitting] = useState(false);

  // Add Product Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null); 
  const [imageUploading, setImageUploading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  const initialProductState = {
    name: '',
    category: 'Clothing',
    gender: 'Unisex',
    price: '',
    originalPrice: '',
    costPrice: '',
    discount: '',
    badge: '',
    stock: 50,
    image: '',
    description: '',
    tags: '',
    isCustomizable: false,
    customizationType: 'none',
    customizationPrompt: '',
    weight: 500,
    length: 20,
    width: 10,
    height: 5
  };
  const [newProd, setNewProd] = useState(initialProductState);

  const [showAddOfflineOrderModal, setShowAddOfflineOrderModal] = useState(false);
  const [offlineCustName, setOfflineCustName] = useState('');
  const [offlineCustPhone, setOfflineCustPhone] = useState('');
  const [offlineCustEmail, setOfflineCustEmail] = useState('');
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState('Offline Cash');
  const [offlineFlat, setOfflineFlat] = useState('');
  const [offlineArea, setOfflineArea] = useState('');
  const [offlineCity, setOfflineCity] = useState('');
  const [offlineState, setOfflineState] = useState('');
  const [offlinePincode, setOfflinePincode] = useState('');
  const [offlinePackagingCost, setOfflinePackagingCost] = useState('0');
  const [offlineShippingCost, setOfflineShippingCost] = useState('0');
  const [offlinePackagingCharge, setOfflinePackagingCharge] = useState('0');
  const [offlineShippingCharge, setOfflineShippingCharge] = useState('0');
  const [offlineItems, setOfflineItems] = useState([{ productId: '', price: '', quantity: 1 }]);
  const [offlineActionLoading, setOfflineActionLoading] = useState(false);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [prodSearchQueries, setProdSearchQueries] = useState({});

  const updateSearchQuery = (index, value) => {
    setProdSearchQueries(prev => ({ ...prev, [index]: value }));
  };

  const filteredProductsForSearch = (index) => {
    const query = (prodSearchQueries[index] || '').toLowerCase();
    if (!query) return products;
    return products.filter(p => p.name.toLowerCase().includes(query));
  };

  const addOfflineItemRow = () => {
    setOfflineItems([...offlineItems, { productId: '', price: '', quantity: 1 }]);
  };

  const removeOfflineItemRow = (index) => {
    setOfflineItems(offlineItems.filter((_, i) => i !== index));
  };

  const updateOfflineItem = (index, field, value) => {
    const updated = [...offlineItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const prod = products.find(p => String(p._id) === String(value));
      if (prod) {
        updated[index]['price'] = prod.price;
      }
    }
    setOfflineItems(updated);
  };

  // Real-time calculations
  const subtotalAmount = offlineItems.reduce((sum, it) => {
    const priceVal = Number(it.price) || 0;
    const qtyVal = Number(it.quantity) || 1;
    return sum + (priceVal * qtyVal);
  }, 0);

  const grandTotalAmount = subtotalAmount + (Number(offlinePackagingCharge) || 0) + (Number(offlineShippingCharge) || 0);

  const handleOfflineOrderSubmit = async (e) => {
    e.preventDefault();
    if (offlineItems.some(it => !it.productId)) {
      alert("Please select a product for all item rows.");
      return;
    }
    setOfflineActionLoading(true);
    try {
      const orderPayload = {
        userEmail: offlineCustEmail || 'offline@apnabazarr.com',
        paymentMethod: offlinePaymentMethod,
        packagingCost: Number(offlinePackagingCost) || 0,
        shippingCost: Number(offlineShippingCost) || 0,
        packagingCharge: Number(offlinePackagingCharge) || 0,
        shippingCharge: Number(offlineShippingCharge) || 0,
        shippingAddress: {
          fullName: offlineCustName,
          phone: offlineCustPhone,
          flatNo: offlineFlat,
          area: offlineArea,
          city: offlineCity,
          state: offlineState,
          pincode: offlinePincode,
          addressType: 'Home'
        },
        items: offlineItems.map(it => ({
          productId: it.productId,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1
        }))
      };

      const res = await fetch(`${BASE_URL}/orders/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });
      const result = await res.json();
      if (result.success) {
        showToastMsg("Offline order recorded successfully!");
        setShowAddOfflineOrderModal(false);
        // Clear state
        setOfflineCustName('');
        setOfflineCustPhone('');
        setOfflineCustEmail('');
        setOfflineFlat('');
        setOfflineArea('');
        setOfflineCity('');
        setOfflineState('');
        setOfflinePincode('');
        setOfflinePackagingCost('0');
        setOfflineShippingCost('0');
        setOfflinePackagingCharge('0');
        setOfflineShippingCharge('0');
        setOfflineItems([{ productId: '', price: '', quantity: 1 }]);
        
        loadSellerData();
      } else {
        alert(result.message || "Failed to create offline order.");
      }
    } catch (error) {
      console.error(error);
      alert("Error submitting offline order.");
    } finally {
      setOfflineActionLoading(false);
    }
  };

  const showToastMsg = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const loadSellerData = async () => {
    try {
      setLoading(true);
      // Fetch Seller's Products
      const prodRes = await fetch(`${BASE_URL}/products/seller/my-products`, { credentials: 'include' });
      const prodData = await prodRes.json();
      if (prodData.success) {
        setProducts(prodData.data);
      }

      // Fetch Seller's Orders
      const orderRes = await fetch(`${BASE_URL}/orders/seller/my-orders`, { credentials: 'include' });
      const orderData = await orderRes.json();
      if (orderData.success) {
        setOrders(orderData.orders);
      }

      // Fetch Seller's Reviews & Rating averages
      const reviewsRes = await fetch(`${BASE_URL}/reviews/seller/my-reviews`, { credentials: 'include' });
      const reviewsResult = await reviewsRes.json();
      if (reviewsResult.success) {
        setReviewsData({
          reviews: reviewsResult.reviews || [],
          averageSellerRating: reviewsResult.averageSellerRating || 5
        });
      }

      // Fetch Support tickets
      await loadSupportTickets();

    } catch (err) {
      console.error("Error loading seller dashboard data:", err);
      showToastMsg("Error loading dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  const loadSupportTickets = async () => {
    try {
      setTicketsLoading(true);
      const res = await fetch(`${BASE_URL}/feedbacks`);
      const result = await res.json();
      if (result.success && result.feedbacks) {
        // Filter feedbacks/tickets belonging to this seller
        const sellerTickets = result.feedbacks.filter(
          fb => fb.email === currentUser?.email && 
          (fb.category === 'Seller Support Ticket' || fb.category === 'Seller Feedback')
        );
        setMyTickets(sellerTickets);
      }
    } catch (err) {
      console.warn("Failed to load tickets:", err);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/');
      return;
    }
    if (currentUser.role !== 'seller') {
      navigate('/register-seller');
      return;
    }
    loadSellerData();

    // Sync state fields with updated currentUser info
    setShopName(currentUser?.sellerProfile?.shopName || '');
    setShopDescription(currentUser?.sellerProfile?.shopDescription || '');
    setShopAddress(currentUser?.sellerProfile?.shopAddress || '');
    setShopPhone(currentUser?.sellerProfile?.phone || '');
    setShopIsOpen(currentUser?.sellerProfile?.isOpen ?? true);
    setShopBanner(currentUser?.sellerProfile?.shopBanner || '');
    setShopLogo(currentUser?.sellerProfile?.shopLogo || '');
    setPickupPincode(currentUser?.sellerProfile?.pickupPincode || '');
    setReturnPolicy(currentUser?.sellerProfile?.returnPolicy || '7 Days Return Policy');
    setDeliveryInformation(currentUser?.sellerProfile?.deliveryInformation || 'Delivered in 3-5 business days.');
    
    // Sync Bank details
    setAccountName(currentUser?.sellerProfile?.bankDetails?.accountName || '');
    setAccountNumber(currentUser?.sellerProfile?.bankDetails?.accountNumber || '');
    setIfscCode(currentUser?.sellerProfile?.bankDetails?.ifscCode || '');
    setBankName(currentUser?.sellerProfile?.bankDetails?.bankName || '');
  }, [currentUser]);

  // Raise Support ticket / Feedback submission
  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (!ticketSubject || !ticketMessage) {
      alert("Please fill in subject and description details.");
      return;
    }
    setTicketSubmitting(true);
    try {
      const messageBody = `Priority: ${ticketPriority}\nCategory: ${ticketCategory}\nSubject: ${ticketSubject}\n\nDescription: ${ticketMessage}`;
      const res = await fetch(`${BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser?.name || 'Seller partner',
          email: currentUser?.email || '',
          rating: 5,
          category: 'Seller Support Ticket',
          message: messageBody
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg("Support ticket raised successfully!");
        setTicketSubject('');
        setTicketMessage('');
        await loadSupportTickets();
      } else {
        alert("Failed to submit support ticket.");
      }
    } catch (err) {
      alert("Error submitting ticket: " + err.message);
    } finally {
      setTicketSubmitting(false);
    }
  };

  // Handle saving shop profile configurations in database
  const handleSaveShopSettings = async (e) => {
    if (e) e.preventDefault();
    setSaveLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/auth/seller/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shopName,
          shopDescription,
          shopAddress,
          phone: shopPhone,
          isOpen: shopIsOpen,
          shopBanner,
          shopLogo,
          pickupPincode,
          returnPolicy,
          deliveryInformation,
          bankDetails: {
            accountName,
            accountNumber,
            ifscCode,
            bankName
          }
        })
      });
      const result = await res.json();
      if (result.success && result.user) {
        onAuthSuccess(result.user);
        showToastMsg("Shop settings saved successfully!");
      } else {
        alert(result.message || "Failed to save shop settings");
      }
    } catch (err) {
      alert("Error saving shop settings: " + err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  // Switch Shop Status (Open/Closed)
  const handleToggleShopOpen = async (nextStatus) => {
    setShopIsOpen(nextStatus);
    try {
      const res = await fetch(`${BASE_URL}/auth/seller/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          shopName,
          shopDescription,
          shopAddress,
          phone: shopPhone,
          isOpen: nextStatus,
          shopBanner,
          shopLogo,
          pickupPincode,
          returnPolicy,
          deliveryInformation,
          bankDetails: {
            accountName,
            accountNumber,
            ifscCode,
            bankName
          }
        })
      });
      const result = await res.json();
      if (result.success && result.user) {
        onAuthSuccess(result.user);
        showToastMsg(nextStatus ? "Your Shop is now OPEN!" : "Your Shop is now CLOSED (Holiday Mode)!");
      }
    } catch {
      showToastMsg("Failed to update shop status.");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price || !newProd.image) {
      alert("Please fill in name, price, and upload an image.");
      return;
    }
    setActionLoading(true);
    try {
      const body = {
        ...newProd,
        tags: newProd.tags.split(',').map(t => t.trim()).filter(Boolean),
        price: Number(newProd.price),
        originalPrice: newProd.originalPrice ? Number(newProd.originalPrice) : undefined,
        costPrice: newProd.costPrice ? Number(newProd.costPrice) : undefined,
        weight: Number(newProd.weight) || 500,
        length: Number(newProd.length) || 20,
        width: Number(newProd.width) || 10,
        height: Number(newProd.height) || 5
      };

      let url = `${BASE_URL}/products`;
      let method = 'POST';

      if (editProduct) {
        url = `${BASE_URL}/products/${editProduct.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(editProduct ? "Product updated successfully!" : "Product published successfully!");
        setShowAddForm(false);
        setEditProduct(null);
        setNewProd(initialProductState);
        loadSellerData();
      } else {
        alert(data.message || "Failed to save product.");
      }
    } catch (err) {
      alert("Error saving product: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartEdit = (prod) => {
    setEditProduct(prod);
    const isCustom = !STANDARD_CATEGORIES.includes(prod.category || 'Clothing');
    setIsCustomCategory(isCustom);
    setNewProd({
      name: prod.name || '',
      category: prod.category || 'Clothing',
      gender: prod.gender || 'Unisex',
      price: prod.price || '',
      originalPrice: prod.originalPrice || '',
      costPrice: prod.costPrice || '',
      discount: prod.discount || '',
      badge: prod.badge || '',
      stock: prod.stock ?? 50,
      image: prod.image || '',
      description: prod.description || '',
      tags: prod.tags ? prod.tags.join(', ') : '',
      isCustomizable: prod.isCustomizable || false,
      customizationType: prod.customizationType || 'none',
      customizationPrompt: prod.customizationPrompt || '',
      weight: prod.weight || 500,
      length: prod.length || 20,
      width: prod.width || 10,
      height: prod.height || 5
    });
    setShowAddForm(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await res.json();
      if (result.success) {
        showToastMsg("Product deleted successfully!");
        loadSellerData();
      } else {
        alert(result.message || "Failed to delete product.");
      }
    } catch (err) {
      alert("Error deleting product.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStock = async (productId, currentStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ inStock: !currentStatus, stock: !currentStatus ? 50 : 0 })
      });
      const result = await res.json();
      if (result.success) {
        showToastMsg("Stock status updated!");
        loadSellerData();
      }
    } catch {
      showToastMsg("Failed to update stock status.");
    }
  };

  // Financial Metrics aggregations (Frontend calculated in-real-time based on date filter)
  const now = new Date();
  const filteredOrdersForMetrics = orders.filter(order => {
    if (dateRangeFilter === 'all') return true;
    const orderDate = new Date(order.createdAt);
    const diffTime = Math.abs(now - orderDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (dateRangeFilter === '7days') return diffDays <= 7;
    if (dateRangeFilter === '30days') return diffDays <= 30;
    return true;
  });

  let totalSalesVal = 0;
  let totalOrdersCount = filteredOrdersForMetrics.length;
  let pendingOrdersCount = 0;
  let completedOrdersCount = 0;
  let commissionVal = 0;
  let shippingVal = 0;
  let payoutVal = 0;
  let pendingPayoutVal = 0;
  let paidPayoutVal = 0;
  let totalOfflinePackagingCost = 0;
  let totalOfflineShippingCost = 0;
  let totalCostOfItemsSold = 0;
  
  const transactionsList = [];

  filteredOrdersForMetrics.forEach(order => {
    if (order.isOffline) {
      totalOfflinePackagingCost += order.packagingCost || 0;
      totalOfflineShippingCost += order.shippingCost || 0;
      payoutVal += (order.packagingCharge || 0) + (order.shippingCharge || 0);
      totalSalesVal += (order.packagingCharge || 0) + (order.shippingCharge || 0);
    }

    order.items.forEach(item => {
      const matchedProd = products.find(p => String(p._id) === String(item.productId));
      const costPrice = matchedProd && matchedProd.costPrice ? matchedProd.costPrice : (item.price * 0.6);
      totalCostOfItemsSold += costPrice * item.quantity;

      totalSalesVal += item.price * item.quantity;
      commissionVal += item.commissionAmount || 0;
      shippingVal += item.shippingCharges || 0;
      payoutVal += item.sellerPayout || 0;

      if (item.payoutStatus === 'paid') {
        paidPayoutVal += item.sellerPayout || 0;
      } else {
        pendingPayoutVal += item.sellerPayout || 0;
      }

      if (item.itemStatus === 'Delivered') {
        completedOrdersCount++;
      } else if (item.itemStatus !== 'Cancelled' && item.itemStatus !== 'Returned') {
        pendingOrdersCount++;
      }

      transactionsList.push({
        id: order.orderId + '-' + item.productId,
        orderId: order.orderId,
        date: order.createdAt,
        productName: item.name,
        quantity: item.quantity,
        saleTotal: item.price * item.quantity,
        commission: item.commissionAmount || 0,
        shipping: item.shippingCharges || 0,
        payout: item.sellerPayout || 0,
        status: item.payoutStatus || 'pending'
      });
    });
  });

  const netProfitVal = payoutVal - totalCostOfItemsSold - totalOfflinePackagingCost - totalOfflineShippingCost;

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-white border-r border-slate-200 select-none">
      <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        {/* Apna Bazar Premium Logo */}
        <div className="flex flex-col space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 bg-[#ff5e14] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm shrink-0">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-base font-black text-[#0a2342] tracking-tight block">Apna Bazar</span>
              <span className="text-[7.5px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none">Sab Kuch, Apke Liye</span>
            </div>
          </div>
        </div>

        {/* Sidebar Nav with all reference items */}
        <nav className="space-y-1">
          {[
            { id: 'overview', label: 'Dashboard', icon: Store, hasArrow: false },
            { id: 'products', label: 'Products', icon: Package, hasArrow: true },
            { id: 'orders', label: 'Orders', icon: ShoppingBag, hasArrow: true },
            { id: 'payouts', label: 'Earnings', icon: DollarSign, hasArrow: false },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp, hasArrow: false },
            { id: 'reviews', label: 'Reviews', icon: Star, hasArrow: false },
            { id: 'marketing', label: 'Marketing', icon: Tag, hasArrow: true },
            { id: 'mystore', label: 'My Store', icon: Store, hasArrow: true },
            { id: 'payouts_sec', label: 'Payouts', icon: CreditCard, hasArrow: false },
            { id: 'settings', label: 'Settings', icon: Settings, hasArrow: true },
            { id: 'support', label: 'Support', icon: LifeBuoy, hasArrow: false }
          ].map(tab => {
            const Icon = tab.icon;
            let isActive = activeTab === tab.id;
            if (tab.id === 'payouts_sec' && activeTab === 'payouts') isActive = true;

            const handleTabClick = () => {
              setMobileMenuOpen(false);
              setNotificationsOpen(false);
              setProfileDropdownOpen(false);
              if (tab.id === 'mystore') {
                window.open(`/shop?sellerId=${currentUser?.id || currentUser?._id || ''}`, '_blank');
                return;
              }
              if (tab.id === 'payouts_sec') {
                setActiveTab('payouts');
                setShowAddForm(false);
                return;
              }
              setActiveTab(tab.id);
              setShowAddForm(false);
            };

            return (
              <button
                key={tab.id}
                onClick={handleTabClick}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isActive 
                    ? 'bg-[#ff5e14] text-white border-[#ff5e14] shadow-xs' 
                    : 'bg-slate-50/70 text-slate-700 border-slate-100/80 hover:bg-slate-100/90 hover:text-slate-900 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </div>
                {tab.hasArrow && (
                  <ChevronDown className={`w-3.5 h-3.5 stroke-[2] transition-transform ${isActive ? 'text-white' : 'text-slate-450 rotate-270'}`} />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Grow Your Business Widget */}
      <div className="p-4 mt-auto shrink-0 border-t border-slate-100">
        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4.5 space-y-3 relative overflow-hidden">
          <div className="absolute w-24 h-24 bg-[#ff5e14]/5 rounded-full blur-2xl -bottom-8 -right-8" />
          <div className="space-y-1 relative z-10">
            <h4 className="text-xs font-bold text-slate-800">Grow Your Business</h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">Boost sales with Apna Bazar promotions and offers.</p>
          </div>
          <button 
            onClick={() => { setActiveTab('support'); setMobileMenuOpen(false); }}
            className="w-full py-2 bg-[#ff5e14] hover:bg-orange-600 active:scale-95 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-xs cursor-pointer relative z-10"
          >
            Explore Now
          </button>
        </div>
      </div>
    </div>
  );

  // Status updating handler for orders
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });
      const result = await res.json();
      if (result.success) {
        showToastMsg(`Order status updated to: ${newStatus}`);
        loadSellerData();
      } else {
        alert(result.message || "Failed to update order status.");
      }
    } catch (err) {
      alert("Error updating order status: " + err.message);
    }
  };

  // Payout request handler
  const handleRequestPayout = async () => {
    if (pendingPayoutVal <= 0) {
      alert("You do not have any available balance to request payout.");
      return;
    }
    if (!accountNumber || !ifscCode || !bankName) {
      alert("Please update your Bank Settlement details in Settings first before requesting a payout.");
      setActiveTab('settings');
      return;
    }
    
    setActionLoading(true);
    try {
      // Auto-raise a payout request support ticket so the admin can process it!
      const messageBody = `Priority: High\nCategory: Payout Issue\nSubject: Payout Request for ₹${pendingPayoutVal}\n\nDescription: Seller requested payout of ₹${pendingPayoutVal} to Bank: ${bankName}, A/c: ${accountNumber}, IFSC: ${ifscCode}.`;
      const res = await fetch(`${BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: currentUser?.name || 'Seller partner',
          email: currentUser?.email || '',
          rating: 5,
          category: 'Seller Support Ticket',
          message: messageBody
        })
      });
      const data = await res.json();
      if (data.success) {
        showToastMsg(`Payout request for ₹${pendingPayoutVal.toLocaleString('en-IN')} submitted successfully!`);
        await loadSupportTickets();
      } else {
        alert("Failed to submit payout request. Please try again.");
      }
    } catch (err) {
      alert("Error requesting payout: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#ff5e14] animate-spin" />
        <p className="text-xs text-slate-500 font-extrabold tracking-wider uppercase">Loading Seller Hub...</p>
      </div>
    );
  }

  // Calculate dynamic weekly chart curve based on filtered orders
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailySales = [0, 0, 0, 0, 0, 0, 0];
  const dailyOrders = [0, 0, 0, 0, 0, 0, 0];
  const dailyEarnings = [0, 0, 0, 0, 0, 0, 0];
  const chartSales = dailySales;

  filteredOrdersForMetrics.forEach(order => {
    const date = new Date(order.createdAt);
    let dayIndex = date.getDay(); // 0 Sunday, 1 Monday...
    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map to Mon=0...Sun=6
    
    let orderSales = 0;
    let orderEarnings = 0;
    order.items.forEach(item => {
      orderSales += item.price * item.quantity;
      orderEarnings += item.sellerPayout || 0;
    });

    if (dayIndex >= 0 && dayIndex < 7) {
      dailySales[dayIndex] += orderSales;
      dailyOrders[dayIndex] += 1;
      dailyEarnings[dayIndex] += orderEarnings;
    }
  });

  // Top Selling Products Calculations based on filtered metrics
  const prodSalesMap = {};
  filteredOrdersForMetrics.forEach(order => {
    order.items.forEach(item => {
      const prodId = item.productId;
      if (!prodSalesMap[prodId]) {
        prodSalesMap[prodId] = {
          name: item.name,
          image: item.image,
          category: item.category,
          quantity: 0,
          revenue: 0
        };
      }
      prodSalesMap[prodId].quantity += item.quantity;
      prodSalesMap[prodId].revenue += item.price * item.quantity;
    });
  });

  const calculatedTopProducts = Object.values(prodSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 3);

  // Dynamic welcome date range calculations
  const getPastDateStr = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const currentDateRangeStr = dateRangeFilter === '7days' 
    ? `${getPastDateStr(7)} – ${getPastDateStr(0)}` 
    : dateRangeFilter === '30days'
    ? `${getPastDateStr(30)} – ${getPastDateStr(0)}`
    : 'All Time Records';

  // Calculate store performance fulfillment rate
  const storeFulfillmentRate = totalOrdersCount > 0 
    ? Math.round((completedOrdersCount / totalOrdersCount) * 100) 
    : 100;

  const hasSales = totalSalesVal > 0;
  const recentOrdersList = filteredOrdersForMetrics.slice(0, 5);

  // Search filtering logic
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(ord => 
    ord.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ord.items.some(item => item.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    ord.shippingAddress?.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter actual pending orders for the notifications drawer
  const actualPendingOrders = orders.filter(ord => 
    ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled'
  );

  // handle marketing coupon addition
  const handleCreateCoupon = (e) => {
    e.preventDefault();
    if (!newCouponCode || !newCouponValue || !newCouponExpiry) {
      alert("Please fill in all coupon code details.");
      return;
    }
    const dup = coupons.some(c => c.code.toUpperCase() === newCouponCode.toUpperCase());
    if (dup) {
      alert("A coupon with this code already exists.");
      return;
    }

    setCoupons([
      ...coupons,
      {
        code: newCouponCode.toUpperCase().trim(),
        type: newCouponType,
        value: Number(newCouponValue),
        expiry: newCouponExpiry
      }
    ]);
    setNewCouponCode('');
    setNewCouponValue('');
    setNewCouponExpiry('');
    showToastMsg(`Coupon ${newCouponCode.toUpperCase()} added successfully!`);
  };

  const handleDeleteCoupon = (code) => {
    setCoupons(coupons.filter(c => c.code !== code));
    showToastMsg(`Coupon ${code} deleted successfully.`);
  };

  return (
    <div className="h-screen bg-[#f8fafc] flex relative overflow-hidden text-slate-800 font-sans">
      {/* Sidebar - Desktop */}
      <aside className="w-64 h-screen bg-white text-slate-700 hidden lg:flex flex-col shrink-0 border-r border-slate-200 shadow-xs z-20">
        {sidebarContent}
      </aside>

      {/* Sidebar - Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex animate-fade-in">
          <div 
            className="fixed inset-0 bg-[#0a2342]/40 backdrop-blur-xs transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] h-full bg-white shadow-2xl flex flex-col animate-slide-right z-10 border-r border-slate-200">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 p-1 rounded-full bg-slate-100 border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-2xs z-30 relative">
          <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="text-sm font-extrabold text-[#0a2342] uppercase tracking-wide shrink-0 hidden md:block select-none">
              {activeTab === 'overview' && 'Dashboard'}
              {activeTab === 'products' && 'Showroom Catalog'}
              {activeTab === 'orders' && 'Orders Ledger'}
              {activeTab === 'payouts' && 'Earnings Ledger'}
              {activeTab === 'analytics' && 'Analytics Hub'}
              {activeTab === 'reviews' && 'Reviews Ledger'}
              {activeTab === 'marketing' && 'Marketing Center'}
              {activeTab === 'settings' && 'Boutique Settings'}
              {activeTab === 'support' && 'Support Desk'}
            </div>

            {/* Premium Search Bar */}
            <div className="relative max-w-md w-full hidden sm:block">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search anything..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-[#ff5e14] focus:bg-white text-slate-700 font-semibold transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4 relative">
            {/* Notifications with real orders dropdown */}
            <div className="relative">
              <div 
                onClick={() => { setNotificationsOpen(!notificationsOpen); setProfileDropdownOpen(false); }}
                className="relative cursor-pointer hover:scale-105 transition-all p-1"
              >
                <Bell className="w-5 h-5 text-slate-500 hover:text-slate-800" />
                {actualPendingOrders.length > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-[#ff5e14] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                    {actualPendingOrders.length}
                  </span>
                )}
              </div>

              {notificationsOpen && (
                <div className="absolute right-0 mt-3.5 w-72 bg-white rounded-2xl border border-slate-200 shadow-2xl p-4 space-y-3 z-50 text-xs animate-fade-in">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-black uppercase text-[9px] text-[#0a2342]">
                    <span>Fulfillment Alerts</span>
                    <span className="text-[#ff5e14]">{actualPendingOrders.length} Pending</span>
                  </div>
                  {actualPendingOrders.length === 0 ? (
                    <p className="text-slate-400 py-4 text-center font-semibold">All orders processed! No new notifications.</p>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                      {actualPendingOrders.slice(0, 4).map((ord, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => { setActiveTab('orders'); setNotificationsOpen(false); }}
                          className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer border border-transparent hover:border-slate-200 transition-all font-semibold"
                        >
                          <span className="font-bold text-slate-850 block">New Order #{ord.orderId}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">Amount: ₹{ord.totalAmount} • Status: {ord.orderStatus}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => { setActiveTab('orders'); setNotificationsOpen(false); }}
                    className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 text-[#0a2342] font-black uppercase text-[9px] rounded-xl transition-all block"
                  >
                    View All Orders
                  </button>
                </div>
              )}
            </div>

            {/* Help */}
            <HelpCircle 
              onClick={() => setActiveTab('support')}
              className="w-5 h-5 text-slate-500 hover:text-slate-800 cursor-pointer transition-transform hover:scale-105" 
            />

            {/* Vertical Splitter */}
            <div className="w-px h-6 bg-slate-200" />

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <div 
                onClick={() => { setProfileDropdownOpen(!profileDropdownOpen); setNotificationsOpen(false); }}
                className="flex items-center space-x-2.5 cursor-pointer select-none"
              >
                {shopLogo ? (
                  <img src={shopLogo} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 bg-blue-50 text-[#0066cc] rounded-full flex items-center justify-center font-bold text-xs">
                    {shopName ? shopName[0] : 'S'}
                  </div>
                )}
                <div className="hidden md:block leading-none text-left">
                  <h4 className="text-xs font-black text-slate-800">{shopName || currentUser?.name || 'Seller'}</h4>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mt-0.5">Seller</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-3.5 w-48 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 z-50 text-xs font-bold text-slate-700 animate-fade-in space-y-1">
                  <button 
                    onClick={() => { setActiveTab('settings'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Boutique Settings</span>
                  </button>
                  <button 
                    onClick={() => { navigate('/'); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-slate-50 text-slate-700 rounded-xl transition-colors text-left"
                  >
                    <Store className="w-4 h-4 text-slate-400" />
                    <span>Switch to Buyer Mode</span>
                  </button>
                  <div className="border-t my-1 border-slate-100" />
                  <button 
                    onClick={() => { onLogout(); setProfileDropdownOpen(false); }}
                    className="w-full flex items-center space-x-2.5 px-3.5 py-2 hover:bg-rose-50 text-rose-600 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Logout Merchant</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {toast && (
            <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2 animate-fade-in border border-slate-700">
              <CheckCircle className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span>{toast}</span>
            </div>
          )}

          {showAddForm ? (
            <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Catalog</span>
                </button>
                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#ff5e14] block font-sans">Product Catalog Manager</span>
                  <h2 className="text-lg font-black text-slate-900 leading-none mt-1">{editProduct ? 'Edit Shop Listing' : 'Publish New Product'}</h2>
                </div>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-6 pb-12">
                {/* Product Basics Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">📦 Product Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Name *</label>
                      <input
                        type="text"
                        required
                        value={newProd.name}
                        onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                        placeholder="e.g. Silk Embroidered Kurta"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-bold text-slate-700">Product Category *</label>
                        <button
                          type="button"
                          onClick={() => {
                            const nextVal = !isCustomCategory;
                            setIsCustomCategory(nextVal);
                            if (!nextVal) {
                              setNewProd(prev => ({ ...prev, category: 'Clothing' }));
                            }
                          }}
                          className="text-[10px] text-[#ff5e14] font-bold underline hover:text-orange-600"
                        >
                          {isCustomCategory ? "Select from list" : "Enter custom"}
                        </button>
                      </div>
                      {isCustomCategory ? (
                        <input
                          type="text"
                          required
                          value={newProd.category}
                          onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                          placeholder="e.g. Handmade Crafts"
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-800 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                        />
                      ) : (
                        <select
                          value={newProd.category}
                          onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold bg-white text-slate-805 focus:ring-1 focus:ring-[#ff5e14]"
                        >
                          {STANDARD_CATEGORIES.map((cat, idx) => (
                            <option key={idx} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Department / Gender *</label>
                      <select
                        value={newProd.gender}
                        onChange={(e) => setNewProd({ ...newProd, gender: e.target.value })}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold bg-white text-slate-805 focus:ring-1 focus:ring-[#ff5e14]"
                      >
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                        <option value="Unisex">Unisex</option>
                        <option value="Home">Home</option>
                        <option value="Electronics">Electronics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inventory Stock Count *</label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={newProd.stock}
                        onChange={(e) => setNewProd({ ...newProd, stock: Number(e.target.value) })}
                        placeholder="50"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
                    <textarea
                      value={newProd.description}
                      onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                      placeholder="Enter details on material quality, sizing guide, delivery estimates..."
                      rows={4}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-800 resize-none focus:ring-1 focus:ring-[#ff5e14] bg-white"
                    />
                  </div>
                </div>

                {/* Pricing & Promotion Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">💰 Pricing & Tags</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newProd.price}
                          onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                          placeholder="e.g. 599"
                          className="w-full pl-7 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Original Price (MRP) (Strike)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={newProd.originalPrice}
                          onChange={(e) => setNewProd({ ...newProd, originalPrice: e.target.value })}
                          placeholder="e.g. 999"
                          className="w-full pl-7 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cost Price (Kharida Daam)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₹</span>
                        <input
                          type="number"
                          value={newProd.costPrice}
                          onChange={(e) => setNewProd({ ...newProd, costPrice: e.target.value })}
                          placeholder="e.g. 300"
                          className="w-full pl-7 pr-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-800 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Discount Tag (e.g. 30% OFF)</label>
                      <input
                        type="text"
                        value={newProd.discount}
                        onChange={(e) => setNewProd({ ...newProd, discount: e.target.value })}
                        placeholder="e.g. 30% OFF"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-800 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pill Badge (e.g. Best Seller)</label>
                      <input
                        type="text"
                        value={newProd.badge}
                        onChange={(e) => setNewProd({ ...newProd, badge: e.target.value })}
                        placeholder="e.g. Best Seller"
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Keywords / Search Tags (comma separated)</label>
                    <input
                      type="text"
                      value={newProd.tags}
                      onChange={(e) => setNewProd({ ...newProd, tags: e.target.value })}
                      placeholder="e.g. cotton, embroidered, partywear"
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                    />
                  </div>
                </div>

                {/* Product Image Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">🖼️ Product Media</h3>
                  
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Image *</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative shrink-0 w-full sm:w-auto">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="seller-image-upload-page"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setImageUploading(true);
                              try {
                                const url = await uploadToCloudinary(file, 'product-image');
                                setNewProd(prev => ({ ...prev, image: url }));
                                showToastMsg("Image uploaded successfully!");
                              } catch (err) {
                                alert("Image upload failed: " + err.message);
                              } finally {
                                setImageUploading(false);
                              }
                            }
                          }}
                        />
                        <label
                          htmlFor="seller-image-upload-page"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 flex items-center justify-center space-x-2 cursor-pointer transition-colors border-dashed select-none"
                        >
                          {imageUploading ? (
                            <><Loader2 className="w-4 h-4 text-slate-700 animate-spin" /><span>Uploading...</span></>
                          ) : (
                            <><Upload className="w-4 h-4 text-slate-700" /><span>Upload File</span></>
                          )}
                        </label>
                      </div>
                      <input
                        type="text"
                        required
                        value={newProd.image}
                        onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                        placeholder="Or paste image URL link here..."
                        className="flex-1 px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold text-slate-805 focus:ring-1 focus:ring-[#ff5e14] bg-white"
                      />
                    </div>
                    {newProd.image && (
                      <div className="pt-2.5 flex items-center space-x-3 animate-fade-in">
                        <img src={newProd.image} alt="Preview" className="w-16 h-16 object-cover rounded-xl border border-slate-200 shadow-sm" />
                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">✓ Image Uploaded</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping & Customization Section */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">🚚 Logistics & Customization</h3>

                  <div className="border border-slate-200 p-4.5 rounded-2xl bg-slate-50 space-y-3">
                    <span className="block text-xs font-black text-slate-800 uppercase tracking-wider font-sans">📦 Shipping Logistics dimensions</span>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Weight (grams)</label>
                        <input
                          type="number"
                          required
                          min={10}
                          value={newProd.weight}
                          onChange={(e) => setNewProd({ ...newProd, weight: Number(e.target.value) })}
                          placeholder="500"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Length (cm)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newProd.length}
                          onChange={(e) => setNewProd({ ...newProd, length: Number(e.target.value) })}
                          placeholder="20"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Width (cm)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newProd.width}
                          onChange={(e) => setNewProd({ ...newProd, width: Number(e.target.value) })}
                          placeholder="10"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] bg-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-0.5">Height (cm)</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={newProd.height}
                          onChange={(e) => setNewProd({ ...newProd, height: Number(e.target.value) })}
                          placeholder="5"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] bg-white font-bold"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-200 p-4.5 rounded-2xl bg-slate-50 space-y-3.5">
                    <div className="flex items-center space-x-2.5">
                      <input
                        type="checkbox"
                        id="seller-prod-customizable-page"
                        checked={newProd.isCustomizable}
                        onChange={(e) => setNewProd({ ...newProd, isCustomizable: e.target.checked })}
                        className="w-4 h-4 text-[#ff5e14] focus:ring-[#ff5e14] border-slate-300 rounded cursor-pointer"
                      />
                      <label htmlFor="seller-prod-customizable-page" className="text-xs font-extrabold text-slate-800 cursor-pointer select-none">
                        Enable Personalization details for customers
                      </label>
                    </div>

                    {newProd.isCustomizable && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in pt-1">
                        <div>
                          <label className="block text-[11px] font-black text-slate-755 mb-1">User Customization Source</label>
                          <select
                            value={newProd.customizationType}
                            onChange={(e) => setNewProd({ ...newProd, customizationType: e.target.value })}
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] font-semibold bg-white text-slate-805"
                          >
                            <option value="text">Custom Text / Messages</option>
                            <option value="image">Custom Graphic / Image Uploads</option>
                            <option value="both">Both Text Messages & Graphic Uploads</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-black text-slate-755 mb-1">Instructions for Customization</label>
                          <input
                            type="text"
                            value={newProd.customizationPrompt}
                            onChange={(e) => setNewProd({ ...newProd, customizationPrompt: e.target.value })}
                            placeholder="e.g. Enter name to print"
                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#ff5e14] font-semibold"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-3 border border-slate-300 rounded-xl text-xs font-black text-slate-655 hover:bg-slate-100 uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-7 py-3 bg-[#0a2342] hover:bg-blue-900 text-white text-xs font-black rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 uppercase tracking-wider cursor-pointer"
                  >
                    {actionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{editProduct ? 'Save Product Details' : 'Publish Product'}</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top Welcome Title Banner */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                        Good morning, {currentUser?.name || 'Vivek'}! <span className="animate-wiggle">👋</span>
                      </h2>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Here's what's happening with your store today.</p>
                    </div>

                    {/* Dynamic Date Filter Dropdown */}
                    <div className="relative">
                      <select 
                        value={dateRangeFilter}
                        onChange={(e) => setDateRangeFilter(e.target.value)}
                        className="flex items-center space-x-2 bg-white border border-slate-200 px-4 py-2.5 rounded-2xl shadow-2xs text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-50 select-none focus:outline-none"
                      >
                        <option value="7days">📅 Last 7 Days ({currentDateRangeStr})</option>
                        <option value="30days">📅 Last 30 Days</option>
                        <option value="all">📅 All Time Records</option>
                      </select>
                    </div>
                  </div>

                  {/* 5 Premium Stat Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    {/* Card 1: Total Sales */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Total Sales</span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">₹{totalSalesVal.toLocaleString('en-IN')}</h3>
                        </div>
                        <div className="w-9 h-9 bg-blue-50 text-[#0066cc] rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                          <span className="font-extrabold text-sm">₹</span>
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                        <span>Real-time calculation</span>
                      </div>
                    </div>

                    {/* Card 2: Total Orders */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Total Orders</span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{totalOrdersCount}</h3>
                        </div>
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                          <ShoppingBag className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                        <span>Store orders ledger</span>
                      </div>
                    </div>

                    {/* Card 3: Your Earnings */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Your Earnings</span>
                          <h3 className="text-xl sm:text-2xl font-black text-[#ff5e14] tracking-tight">₹{(totalSalesVal - commissionVal).toLocaleString('en-IN')}</h3>
                        </div>
                        <div className="w-9 h-9 bg-orange-50 text-[#ff5e14] rounded-xl flex items-center justify-center shrink-0 border border-orange-100">
                          <CreditCard className="w-4 h-4 text-[#ff5e14]" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                        <span>Net seller payout</span>
                      </div>
                    </div>

                    {/* Card 4: Net Profit */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Net Profit</span>
                          <h3 className={`text-xl sm:text-2xl font-black tracking-tight ${netProfitVal >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ₹{netProfitVal.toLocaleString('en-IN')}
                          </h3>
                        </div>
                        <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        </div>
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                        <span>Margin: <strong className="text-slate-800">{totalSalesVal > 0 ? ((netProfitVal / totalSalesVal) * 100).toFixed(1) : 0}%</strong></span>
                      </div>
                    </div>

                    {/* Card 4: Pending Orders */}
                    <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs flex flex-col justify-between space-y-4 hover:shadow-xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block leading-none">Pending Orders</span>
                          <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">{pendingOrdersCount}</h3>
                        </div>
                        <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
                          <AlertTriangle className="w-4 h-4 text-purple-600" />
                        </div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase tracking-wider block ${pendingOrdersCount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                        {pendingOrdersCount > 0 ? 'Needs attention' : 'All caught up!'}
                      </div>
                    </div>

                  </div>

                  {/* Middle Row: Sales Overview & Recent Orders */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Sales Overview Chart Container */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 lg:col-span-2 shadow-2xs space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-[#0a2342] uppercase tracking-wider">Sales Overview</h3>
                        <div className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border">WEEKLY LINE GRAPH</div>
                      </div>

                      {/* Custom Responsive SVG Graph or Empty State */}
                      {!hasSales ? (
                        <div className="h-[170px] flex flex-col items-center justify-center space-y-2 text-slate-400">
                          <span className="text-2xl">📊</span>
                          <p className="text-xs font-bold font-sans">No sales activity recorded for this period yet.</p>
                        </div>
                      ) : (
                        <div className="w-full pt-2">
                          <svg viewBox="0 0 500 200" className="w-full overflow-visible">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0066cc" stopOpacity="0.25"/>
                                <stop offset="100%" stopColor="#0066cc" stopOpacity="0.00"/>
                              </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="80" x2="500" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="130" x2="500" y2="130" stroke="#f1f5f9" strokeWidth="1" />
                            <line x1="0" y1="170" x2="500" y2="170" stroke="#e2e8f0" strokeWidth="1.5" />

                            {/* SVG Plot path calculation */}
                            {(() => {
                              const maxVal = Math.max(...chartSales, 10000);
                              const points = chartSales.map((val, idx) => {
                                const x = idx * (500 / 6);
                                const y = 170 - (val / maxVal) * 120;
                                return { x, y };
                              });

                              // Smooth Line path using Cubic Beziers or line path
                              let pathD = "M " + points[0].x + " " + points[0].y;
                              let areaD = "M " + points[0].x + " 170 L " + points[0].x + " " + points[0].y;
                              
                              for (let i = 1; i < points.length; i++) {
                                const cpX1 = points[i-1].x + (500 / 18);
                                const cpY1 = points[i-1].y;
                                const cpX2 = points[i].x - (500 / 18);
                                const cpY2 = points[i].y;
                                pathD += " C " + cpX1 + " " + cpY1 + ", " + cpX2 + " " + cpY2 + ", " + points[i].x + " " + points[i].y;
                                areaD += " C " + cpX1 + " " + cpY1 + ", " + cpX2 + " " + cpY2 + ", " + points[i].x + " " + points[i].y;
                              }
                              
                              areaD += " L " + points[points.length-1].x + " 170 Z";

                              return (
                                <>
                                  {/* Gradient Area */}
                                  <path d={areaD} fill="url(#chartGrad)" />
                                  
                                  {/* Core Line */}
                                  <path d={pathD} fill="none" stroke="#0a2342" strokeWidth="2.5" strokeLinecap="round" />

                                  {/* Points and values */}
                                  {points.map((p, i) => (
                                    <g key={i}>
                                      <circle cx={p.x} cy={p.y} r="4" fill="#ffffff" stroke="#0a2342" strokeWidth="2" />
                                      {/* Tooltip over dot */}
                                      <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[7.5px] font-black fill-slate-700">
                                        ₹{Math.round(chartSales[i]).toLocaleString()}
                                      </text>
                                    </g>
                                  ))}
                                </>
                              );
                            })()}

                            {/* Axes Labels */}
                            {daysOfWeek.map((day, idx) => (
                              <text key={idx} x={idx * (500 / 6)} y="190" textAnchor="middle" className="text-[9px] font-extrabold fill-slate-400">
                                {day}
                              </text>
                            ))}
                          </svg>
                        </div>
                      )}

                      {/* Chart legend counters */}
                      <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Sales</span>
                          <span className="text-xs font-black text-slate-900 block">₹{totalSalesVal.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Orders</span>
                          <span className="text-xs font-black text-slate-900 block">{totalOrdersCount}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">Earnings</span>
                          <span className="text-xs font-black text-slate-900 block">₹{(totalSalesVal - commissionVal).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Orders List Container */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Recent Orders</h3>
                        <button onClick={() => setActiveTab('orders')} className="text-[10px] font-bold text-[#0066cc] hover:underline cursor-pointer">
                          View All Orders
                        </button>
                      </div>

                      {/* Orders summary */}
                      {recentOrdersList.length === 0 ? (
                        <div className="h-[200px] flex flex-col items-center justify-center space-y-2 text-slate-400 border border-dashed rounded-2xl p-4">
                          <span className="text-xl">📥</span>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-center">No orders received yet.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 space-y-1 max-h-[220px] overflow-y-auto pr-1">
                          {recentOrdersList.map((ord, idx) => {
                            const item = ord.items[0];
                            const formattedDate = new Date(ord.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
                            const status = ord.orderStatus || item.itemStatus || 'Pending';
                            
                            return (
                              <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center space-x-2.5 min-w-0">
                                  <img 
                                    src={item.image} 
                                    alt="product" 
                                    className="w-10 h-10 object-cover rounded-xl border bg-white shrink-0 shadow-3xs" 
                                  />
                                  <div className="min-w-0 leading-tight">
                                    <h4 className="font-extrabold text-slate-900 truncate max-w-[120px]">{item.name}</h4>
                                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">#{ord.orderId} • {formattedDate}</span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-extrabold text-slate-800 block">₹{ord.totalAmount}</span>
                                  <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 inline-block border \${
                                    status === 'Delivered'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                      : status === 'Shipped'
                                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                                      : 'bg-orange-50 text-orange-700 border-orange-100'
                                  }`}>
                                    {status}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <button onClick={() => setActiveTab('orders')} className="w-full text-center text-[10px] font-black text-slate-500 hover:text-slate-900 transition-colors uppercase pt-2 border-t">
                        View All Orders →
                      </button>
                    </div>

                  </div>

                  {/* Bottom Row: Store Performance, Top Selling Products, Payout Balance */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Ring gauge: Store Performance */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 text-center flex flex-col justify-between">
                      <div className="text-left pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-805 uppercase tracking-wider">Store Performance</h3>
                      </div>

                      <div className="py-2.5 flex items-center justify-center relative">
                        {/* Radial Ring Gauge */}
                        <svg className="w-24 h-24 transform -rotate-90">
                          <circle cx="48" cy="48" r="40" stroke="#f1f5f9" strokeWidth="8" fill="transparent" />
                          <circle cx="48" cy="48" r="40" stroke="#0a2342" strokeWidth="8" fill="transparent" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - (storeFulfillmentRate / 100))} 
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute font-black text-lg text-slate-850">
                          {storeFulfillmentRate}%
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[11px] text-slate-500 font-semibold leading-relaxed px-4">
                          {storeFulfillmentRate === 100 
                            ? "Amazing! All orders processed successfully." 
                            : "Great job! Keep processing pending orders to reach 100%."
                          }
                        </p>
                        <button onClick={() => setActiveTab('support')} className="text-[10px] font-extrabold text-[#0066cc] hover:underline uppercase block mx-auto">
                          View Insights →
                        </button>
                      </div>
                    </div>

                    {/* List: Top Selling Products */}
                    <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-2xs space-y-4 flex flex-col justify-between">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Top Selling Products</h3>
                        <button onClick={() => setActiveTab('products')} className="text-[9px] font-black text-[#0066cc] hover:underline uppercase tracking-wider">
                          View All
                        </button>
                      </div>

                      {calculatedTopProducts.length === 0 ? (
                        <div className="h-[120px] flex flex-col items-center justify-center space-y-2 text-slate-400 border border-dashed rounded-2xl">
                          <span className="text-lg">🛍️</span>
                          <p className="text-[9px] font-bold uppercase tracking-wider">No sales records yet.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100 space-y-1.5 flex-1 py-1">
                          {calculatedTopProducts.map((p, idx) => (
                            <div key={idx} className="py-2 flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3.5 min-w-0">
                                <span className="font-extrabold text-slate-400 text-xs shrink-0">{idx + 1}.</span>
                                <div className="min-w-0 leading-tight">
                                  <h4 className="font-extrabold text-slate-800 truncate max-w-[130px]">{p.name}</h4>
                                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{p.quantity} Orders</span>
                                </div>
                              </div>
                              <span className="font-black text-slate-900 shrink-0">₹{(p.revenue).toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Orange balance card */}
                    <div className="bg-[#fff6f0] border border-orange-200/80 rounded-3xl p-5 shadow-2xs flex flex-col justify-between space-y-5">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none">Available Balance</span>
                          <h3 className="text-2xl font-black text-[#ff5e14] tracking-tight">₹{pendingPayoutVal.toLocaleString('en-IN')}</h3>
                        </div>
                        <div className="w-10 h-10 bg-[#ff5e14]/10 rounded-2xl flex items-center justify-center shrink-0 border border-orange-200/40">
                          <CreditCard className="w-5 h-5 text-[#ff5e14]" />
                        </div>
                      </div>

                      <div className="space-y-3.5 mt-auto">
                        <span className="text-[10px] text-slate-500 font-extrabold block">
                          Pending Balance: <span className="font-black text-slate-800">₹{(commissionVal + shippingVal).toLocaleString('en-IN')}</span>
                        </span>
                        
                        <button 
                          onClick={handleRequestPayout}
                          className="w-full py-3 bg-[#ff5e14] hover:bg-orange-600 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                        >
                          Request Payout
                        </button>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </>
          )}

          {/* Tab: Products */}
          {activeTab === 'products' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Catalog Showcase</h3>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">Manage Store Products</h2>
                </div>
                <button
                  onClick={() => { setShowAddForm(true); setEditProduct(null); setNewProd(initialProductState); }}
                  className="px-4 py-2.5 bg-[#0a2342] hover:bg-blue-900 text-white text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add New Product</span>
                </button>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">
                    {searchQuery ? "No matching products found." : "No products uploaded yet. Get started by adding a product!"}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-2">Image</th>
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Category</th>
                        <th className="py-3 px-3">Inventory Status</th>
                        <th className="py-3 px-3 text-right">Price</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredProducts.map((prod) => (
                        <tr key={prod._id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-2">
                            <img src={prod.image} alt={prod.name} className="w-11 h-11 object-cover rounded-xl border bg-white shadow-3xs" />
                          </td>
                          <td className="py-3.5 px-3 font-extrabold text-slate-800">
                            <div className="space-y-0.5">
                              <span className="block truncate max-w-[200px]">{prod.name}</span>
                              <span className="text-[9px] text-slate-400 font-bold block">{prod.gender}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded border border-slate-200">
                              {prod.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleStock(prod._id, prod.inStock)}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider transition-colors \${
                                prod.inStock 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 hover:bg-emerald-100' 
                                  : 'bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100'
                              }`}
                            >
                              {prod.inStock ? 'In Stock' : 'Out of Stock'}
                            </button>
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-slate-800">
                            <div className="space-y-0.5">
                              <span className="block">₹{prod.price}</span>
                              {prod.originalPrice && (
                                <span className="text-[9.5px] text-slate-400 font-semibold line-through block">₹{prod.originalPrice}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleStartEdit(prod)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod._id)}
                                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab: Orders */}
          {activeTab === 'orders' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Sales History</h3>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">Orders Ledger</h2>
                </div>
                <button
                  onClick={() => setShowAddOfflineOrderModal(true)}
                  className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add Offline Order</span>
                </button>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-500">
                    {searchQuery ? "No matching orders found." : "No orders received yet. Once sales start, they will appear here!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord, oIdx) => {
                    const dateFormatted = new Date(ord.createdAt).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    });

                    return (
                      <div key={ord.orderId || oIdx} className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow bg-white">
                        {/* Order Header info bar */}
                        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                          <div>
                            <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[9px] block">Order Identifier</span>
                            <span className="font-black text-slate-800 text-sm">#{ord.orderId}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[9px] block">Received Date</span>
                            <span className="font-extrabold text-slate-700">{dateFormatted}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[9px] block">Payment Method</span>
                            <span className="font-extrabold text-slate-700 bg-white border px-2 py-0.5 rounded-md uppercase text-[10px]">{ord.paymentMethod || 'Razorpay'}</span>
                          </div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-slate-400 font-extrabold uppercase tracking-wide text-[9px]">Status</span>
                            <select
                              value={ord.orderStatus || 'Order Placed'}
                              onChange={(e) => handleUpdateOrderStatus(ord.orderId, e.target.value)}
                              className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider focus:outline-none bg-white \${
                                ord.orderStatus === 'Delivered'
                                  ? 'border-emerald-250 text-emerald-700 bg-emerald-50'
                                  : ord.orderStatus === 'Shipped'
                                  ? 'border-blue-250 text-blue-700 bg-blue-50'
                                  : 'border-orange-250 text-orange-700 bg-orange-50'
                              }`}
                            >
                              <option value="Order Placed">Placed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </div>
                        </div>

                        {/* Customer details & Product list */}
                        <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                          
                          {/* Left: Products list */}
                          <div className="lg:col-span-2 space-y-4">
                            {ord.items.map((item, iIdx) => (
                              <div key={iIdx} className="flex gap-4 text-xs">
                                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl border bg-white shadow-3xs shrink-0" />
                                <div className="space-y-1.5 min-w-0">
                                  <h4 className="font-black text-slate-900 truncate">{item.name}</h4>
                                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold">
                                    <span>Quantity: <strong className="text-slate-800">{item.quantity}</strong></span>
                                    <span>•</span>
                                    <span>Price: <strong className="text-slate-800">₹{item.price}</strong></span>
                                  </div>

                                  {/* Custom details */}
                                  {(item.customText || item.customImage) && (
                                    <div className="bg-orange-50/50 border border-orange-100 p-2.5 rounded-xl text-[10px] space-y-1 text-slate-700">
                                      <span className="font-black text-orange-800 uppercase tracking-wider block text-[8px]">✨ Personalization Requirements</span>
                                      {item.customText && (
                                        <p>Message: <strong className="text-slate-900">"{item.customText}"</strong></p>
                                      )}
                                      {item.customImage && (
                                        <div className="flex items-center space-x-2 pt-0.5">
                                          <span>File:</span>
                                          <a href={item.customImage} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold flex items-center gap-0.5 hover:text-blue-800">
                                            View Uploaded Graphic <ArrowRight className="w-3 h-3" />
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Right: Shipping Address card */}
                          <div className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 text-xs space-y-3.5 flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="font-black text-[#0a2342] uppercase tracking-wider text-[9px] block">Shipping Destination</span>
                              <div className="leading-relaxed text-slate-650 font-semibold">
                                <strong className="text-slate-850 font-black block mb-0.5">{ord.shippingAddress?.fullName}</strong>
                                <p>{ord.shippingAddress?.flatNo}, {ord.shippingAddress?.area}</p>
                                <p>{ord.shippingAddress?.city}, {ord.shippingAddress?.state} - {ord.shippingAddress?.pincode}</p>
                                <p className="mt-2.5 flex items-center gap-1.5 text-slate-750"><Phone className="w-3.5 h-3.5 text-slate-400" /> {ord.shippingAddress?.phone}</p>
                              </div>
                            </div>

                            <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                              <span className="font-bold text-slate-400">Total Receipt:</span>
                              <span className="font-black text-slate-950 text-sm">₹{ord.totalAmount}</span>
                            </div>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Tab: Earnings */}
          {activeTab === 'payouts' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Finances</h3>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">Earnings & Settlements</h2>
              </div>

              {/* Aggregation summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-slate-50 border p-4.5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Aggregate Sales</span>
                  <span className="text-lg font-black text-slate-850 block">₹{totalSalesVal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 border p-4.5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Platform Commission</span>
                  <span className="text-lg font-black text-rose-600 block">₹{commissionVal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 border p-4.5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Logistics/Shipping</span>
                  <span className="text-lg font-black text-slate-700 block">₹{shippingVal.toLocaleString('en-IN')}</span>
                </div>
                <div className="bg-slate-50 border p-4.5 rounded-2xl text-left space-y-1">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Net Payouts</span>
                  <span className="text-lg font-black text-[#ff5e14] block">₹{payoutVal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Transactions list */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Itemized Transactions ledger</h3>

                {transactionsList.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-2xl">
                    <p className="text-xs text-slate-500 font-bold">No transactions recorded yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                          <th className="py-2.5 px-2">Order ID</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Product Name</th>
                          <th className="py-2.5 px-3 text-right">Sale Total</th>
                          <th className="py-2.5 px-3 text-right text-rose-600">Comm.</th>
                          <th className="py-2.5 px-3 text-right text-slate-700">Ship.</th>
                          <th className="py-2.5 px-3 text-right text-[#ff5e14]">Payout</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {transactionsList.map((tx, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-3 px-2 font-black text-slate-800">#{tx.orderId}</td>
                            <td className="py-3 px-3 text-slate-500 font-bold">{new Date(tx.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                            <td className="py-3 px-3 font-semibold text-slate-700 truncate max-w-[150px]">{tx.productName}</td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800">₹{tx.saleTotal}</td>
                            <td className="py-3 px-3 text-right text-rose-600 font-semibold">-₹{tx.commission}</td>
                            <td className="py-3 px-3 text-right text-slate-700 font-semibold">-₹{tx.shipping}</td>
                            <td className="py-3 px-3 text-right text-[#ff5e14] font-black">₹{tx.payout}</td>
                            <td className="py-3 px-3 text-center">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border \${
                                tx.status === 'paid' 
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-250' 
                                  : 'bg-orange-50 text-orange-700 border-orange-250'
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Analytics */}
          {activeTab === 'analytics' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Performance metrics</h3>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">Analytics Hub</h2>
              </div>

              {/* Advanced aggregation stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 border p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Average Order Value (AOV)</span>
                  <h3 className="text-2xl font-black text-slate-950">₹{Math.round(totalSalesVal / (totalOrdersCount || 1)).toLocaleString('en-IN')}</h3>
                  <p className="text-[9.5px] text-slate-400 font-semibold pt-1">Total revenue divided by order counts.</p>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Items Dispatched Rate</span>
                  <h3 className="text-2xl font-black text-emerald-600">{storeFulfillmentRate}%</h3>
                  <p className="text-[9.5px] text-slate-400 font-semibold pt-1">Fulfillment speed performance.</p>
                </div>
                <div className="bg-slate-50 border p-5 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Registered Products</span>
                  <h3 className="text-2xl font-black text-blue-600">{products.length}</h3>
                  <p className="text-[9.5px] text-slate-400 font-semibold pt-1">Active showcase items catalog.</p>
                </div>
              </div>

              {/* Category Breakdown Horizontal chart */}
              <div className="border border-slate-150 p-5 rounded-2xl space-y-4">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b pb-2">Sales Contribution by Category</h3>
                
                {Object.keys(prodSalesMap).length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 py-4 text-center">No sales records available to generate breakdown.</p>
                ) : (
                  <div className="space-y-3.5">
                    {Object.values(prodSalesMap).map((catItem, idx) => {
                      const sharePct = Math.round((catItem.revenue / (totalSalesVal || 1)) * 100);
                      return (
                        <div key={idx} className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>{catItem.name}</span>
                            <span>₹{catItem.revenue.toLocaleString()} ({sharePct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-[#0a2342] h-full rounded-full" style={{ width: `${sharePct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Reviews */}
          {activeTab === 'reviews' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="pb-4 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Merchant Rating</h3>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">Customer Reviews</h2>
                </div>
                <div className="flex items-center space-x-1.5 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl text-yellow-700 text-xs font-black select-none">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span>{reviewsData.averageSellerRating.toFixed(1)} / 5 Rating</span>
                </div>
              </div>

              {reviewsData.reviews.length === 0 ? (
                <div className="text-center py-12 space-y-2 border border-dashed rounded-2xl">
                  <Star className="w-8 h-8 text-slate-355 mx-auto" />
                  <p className="text-xs font-bold text-slate-500">No customer reviews received yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsData.reviews.map((rev, idx) => (
                    <div key={rev._id || idx} className="border border-slate-200 rounded-2xl p-4.5 space-y-2 text-xs hover:shadow-2xs transition-shadow">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-slate-800 text-sm font-black block">{rev.customerName || 'Verified buyer'}</strong>
                          <div className="flex items-center space-x-0.5 mt-0.5">
                            {[...Array(5)].map((_, sIdx) => (
                              <Star 
                                key={sIdx} 
                                className={`w-3.5 h-3.5 \${
                                  sIdx < (rev.rating || 5) 
                                    ? 'fill-yellow-500 text-yellow-500' 
                                    : 'text-slate-200'
                                }`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">{new Date(rev.createdAt || Date.now()).toLocaleDateString('en-IN')}</span>
                      </div>
                      
                      <p className="text-slate-600 font-semibold leading-relaxed">{rev.comment || 'No comment provided.'}</p>
                      
                      {rev.productName && (
                        <div className="pt-1.5">
                          <span className="text-[9.5px] text-slate-400 font-bold bg-slate-100 border px-2 py-0.5 rounded">Product: {rev.productName}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Marketing */}
          {activeTab === 'marketing' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Promotional campaigns</h3>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">Marketing Center</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left: Create Coupon Form */}
                <div className="bg-slate-50 border p-5 rounded-2xl md:col-span-1 space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1.5 border-b border-slate-200">Create Discount Coupon</h3>
                  
                  <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Coupon Code *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. GET20"
                        value={newCouponCode}
                        onChange={(e) => setNewCouponCode(e.target.value)}
                        className="w-full p-2.5 border rounded-xl focus:outline-none focus:border-[#ff5e14] bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Discount Type</label>
                      <select
                        value={newCouponType}
                        onChange={(e) => setNewCouponType(e.target.value)}
                        className="w-full p-2.5 border rounded-xl focus:outline-none bg-white font-semibold"
                      >
                        <option value="percentage">Percentage Off (%)</option>
                        <option value="flat">Flat Price Off (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Discount Value *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        placeholder="e.g. 15"
                        value={newCouponValue}
                        onChange={(e) => setNewCouponValue(e.target.value)}
                        className="w-full p-2.5 border rounded-xl focus:outline-none bg-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Expiry Date *</label>
                      <input
                        type="date"
                        required
                        value={newCouponExpiry}
                        onChange={(e) => setNewCouponExpiry(e.target.value)}
                        className="w-full p-2.5 border rounded-xl focus:outline-none bg-white font-semibold"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-[#0a2342] hover:bg-blue-900 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Publish Coupon
                    </button>
                  </form>
                </div>

                {/* Right: Active coupons list */}
                <div className="md:col-span-2 space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1.5 border-b">Active Campaign Coupons</h3>
                  
                  {coupons.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-2xl space-y-2 text-slate-400">
                      <Tag className="w-8 h-8 mx-auto" />
                      <p className="font-bold">No active promo campaigns.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {coupons.map((c, idx) => {
                        const isExpired = new Date(c.expiry) < now;
                        return (
                          <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-white hover:shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 w-2.5 h-full bg-[#ff5e14]/10" />
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between items-center">
                                <span className="font-black text-sm text-[#0a2342] bg-[#0a2342]/5 px-2.5 py-0.5 rounded border tracking-wide uppercase">{c.code}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border \${
                                  isExpired 
                                    ? 'bg-rose-50 text-rose-700 border-rose-150' 
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-150'
                                }`}>
                                  {isExpired ? 'Expired' : 'Active'}
                                </span>
                              </div>
                              <p className="font-semibold text-slate-600">
                                Discount of <strong className="text-slate-900">{c.type === 'percentage' ? `${c.value}%` : `₹${c.value}`}</strong> across store items.
                              </p>
                              <p className="text-[10px] text-slate-400 font-bold">Expires: {new Date(c.expiry).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteCoupon(c.code)}
                              className="mt-4 text-rose-600 hover:text-rose-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Deactivate</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Settings */}
          {activeTab === 'settings' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Boutique Profile</h3>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">Shop Configuration Settings</h2>
                </div>
                
                {/* Shop status toggle */}
                <div className="flex items-center space-x-2 bg-slate-50 border p-2 rounded-xl">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Shop Open Status:</span>
                  <button
                    onClick={() => handleToggleShopOpen(!shopIsOpen)}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-wider transition-colors \${
                      shopIsOpen 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-250 hover:bg-rose-100'
                    }`}
                  >
                    {shopIsOpen ? 'Open' : 'Holiday Mode'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveShopSettings} className="space-y-6">
                
                {/* Shop Identity Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0a2342] border-b border-slate-100 pb-1.5">🏢 Shop Identity</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Official Boutique Shop Name *</label>
                      <input
                        type="text"
                        required
                        value={shopName}
                        onChange={(e) => setShopName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Boutique Contact Helpline Phone *</label>
                      <input
                        type="text"
                        required
                        value={shopPhone}
                        onChange={(e) => setShopPhone(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Boutique Brand Tagline / Description</label>
                    <textarea
                      value={shopDescription}
                      onChange={(e) => setShopDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] resize-none font-semibold"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Warehouse Pickup Address *</label>
                      <input
                        type="text"
                        required
                        value={shopAddress}
                        onChange={(e) => setShopAddress(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pickup Area Pincode *</label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={pickupPincode}
                        onChange={(e) => setPickupPincode(e.target.value.replace(/\D/g,''))}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] font-semibold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Boutique Logo Image</label>
                      <div className="flex gap-2.5">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="settings-logo-upload"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setLogoUploading(true);
                              try {
                                const url = await uploadToCloudinary(file, 'seller-logo');
                                setShopLogo(url);
                                showToastMsg("Logo uploaded successfully!");
                              } catch (err) {
                                alert("Logo upload failed: " + err.message);
                              } finally {
                                setLogoUploading(false);
                              }
                            }
                          }}
                        />
                        <label htmlFor="settings-logo-upload" className="border rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 cursor-pointer border-dashed flex items-center space-x-1 border-slate-300">
                          {logoUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>Upload Logo</span>
                        </label>
                        <input
                          type="text"
                          value={shopLogo}
                          onChange={(e) => setShopLogo(e.target.value)}
                          placeholder="Or paste Logo link url..."
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14]"
                        />
                      </div>
                      {shopLogo && <img src={shopLogo} alt="Logo" className="w-12 h-12 object-cover rounded-xl mt-2 border" />}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Boutique Banner Image</label>
                      <div className="flex gap-2.5">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="settings-banner-upload"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setBannerUploading(true);
                              try {
                                const url = await uploadToCloudinary(file, 'seller-banner');
                                setShopBanner(url);
                                showToastMsg("Banner uploaded successfully!");
                              } catch (err) {
                                alert("Banner upload failed: " + err.message);
                              } finally {
                                setBannerUploading(false);
                              }
                            }
                          }}
                        />
                        <label htmlFor="settings-banner-upload" className="border rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-50 cursor-pointer border-dashed flex items-center space-x-1 border-slate-300">
                          {bannerUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                          <span>Upload Banner</span>
                        </label>
                        <input
                          type="text"
                          value={shopBanner}
                          onChange={(e) => setShopBanner(e.target.value)}
                          placeholder="Or paste Banner link url..."
                          className="flex-1 px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14]"
                        />
                      </div>
                      {shopBanner && <img src={shopBanner} alt="Banner" className="w-20 h-10 object-cover rounded-xl mt-2 border" />}
                    </div>
                  </div>
                </div>

                {/* Bank Account Settings */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#0a2342] border-b border-slate-100 pb-1.5">🏦 Bank Settlement Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Account Holder Name</label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Name</label>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank Account Number</label>
                      <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Bank IFSC Code</label>
                      <input
                        type="text"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                        className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={saveLoading}
                  className="w-full py-3 bg-[#0a2342] hover:bg-blue-900 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center space-x-1.5"
                >
                  {saveLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Configuration Settings</span>
                </button>

              </form>
            </div>
          )}

          {/* Tab: Support */}
          {activeTab === 'support' && (
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xs space-y-6 animate-fade-in max-w-4xl mx-auto">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block">Help Desk</h3>
                <h2 className="text-xl font-extrabold text-slate-900 mt-1">Merchant Support Centre</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left: Open new ticket */}
                <form onSubmit={handleRaiseTicket} className="space-y-4 border border-slate-100 p-5 rounded-2xl bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-1">Raise Support Ticket</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Ticket Category</label>
                      <select
                        value={ticketCategory}
                        onChange={(e) => setTicketCategory(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Bug / System Error">Bug / System Error</option>
                        <option value="Catalog Issue">Catalog Issue</option>
                        <option value="Payout Issue">Payout Issue</option>
                        <option value="Other Support">Other Support</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Priority Level</label>
                      <select
                        value={ticketPriority}
                        onChange={(e) => setTicketPriority(e.target.value)}
                        className="w-full p-2 text-xs border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Brief Subject *</label>
                    <input
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g. Settlement delayed for order #102"
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-550 mb-0.5">Describe your issue in detail *</label>
                    <textarea
                      required
                      value={ticketMessage}
                      onChange={(e) => setTicketMessage(e.target.value)}
                      rows={4}
                      placeholder="Mention specific order IDs, dates, or details..."
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={ticketSubmitting}
                    className="w-full py-2.5 bg-[#0a2342] hover:bg-blue-900 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {ticketSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Submit Support Ticket</span>
                  </button>
                </form>

                {/* Right: Active support tickets list */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Active Tickets & Feedbacks</h3>

                  {myTickets.length === 0 ? (
                    <div className="text-center py-10 border border-dashed rounded-2xl space-y-2">
                      <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs text-slate-500 font-bold">No active help tickets raised yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                      {myTickets.map((t, idx) => (
                        <div key={t._id || idx} className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-3xs space-y-2">
                          <div className="flex justify-between items-start text-xs">
                            <span className="font-black text-slate-800">Ticket #{idx+1}</span>
                            <span className="text-[9px] text-slate-400 font-semibold">{new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="text-[11px] leading-relaxed text-slate-650">
                            {t.message.includes("Subject:") ? (
                              <p className="font-extrabold text-slate-850">Subject: {t.message.match(/Subject: (.*)/)?.[1] || 'General issue'}</p>
                            ) : (
                              <p className="font-extrabold text-slate-850">Feedback response registered</p>
                            )}
                            <p className="mt-1 line-clamp-2 text-[10px] text-slate-500 font-semibold">{t.message.replace(/Priority:[\s\S]+?Description:/, '').trim()}</p>
                          </div>

                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
                            <span className="text-[8.5px] font-black text-[#ff5e14] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-150 uppercase tracking-wide">
                              {t.category === 'Seller Support Ticket' ? 'Help Desk' : 'Merchant Feedback'}
                            </span>
                            <span className="text-[9px] font-black uppercase text-amber-600">Pending Review</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Add Offline Order Modal overlay */}
          {showAddOfflineOrderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 overflow-y-auto">
              <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto text-slate-800">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-5 h-5 text-emerald-600" />
                    <span>Add Offline Order</span>
                  </h3>
                  <button onClick={() => setShowAddOfflineOrderModal(false)} className="p-1 hover:bg-slate-150 rounded-lg cursor-pointer">
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleOfflineOrderSubmit} className="space-y-4">
                  {/* Customer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Customer Name *</label>
                      <input
                        type="text"
                        required
                        value={offlineCustName}
                        onChange={(e) => setOfflineCustName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        placeholder="e.g. Ramesh Kumar"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Customer Phone *</label>
                      <input
                        type="text"
                        required
                        value={offlineCustPhone}
                        onChange={(e) => setOfflineCustPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        placeholder="e.g. 9876543210"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Customer Email</label>
                      <input
                        type="email"
                        value={offlineCustEmail}
                        onChange={(e) => setOfflineCustEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        placeholder="e.g. ramesh@example.com (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Payment Method</label>
                      <select
                        value={offlinePaymentMethod}
                        onChange={(e) => setOfflinePaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      >
                        <option value="Offline Cash">Offline Cash</option>
                        <option value="UPI / QR Code">UPI / QR Code</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Card Payment">Card Payment</option>
                      </select>
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Customer Shipping Address</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Flat / House No. *</label>
                        <input
                          type="text"
                          required
                          value={offlineFlat}
                          onChange={(e) => setOfflineFlat(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                          placeholder="e.g. House No. 12"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Area / Street / Colony *</label>
                        <input
                          type="text"
                          required
                          value={offlineArea}
                          onChange={(e) => setOfflineArea(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                          placeholder="e.g. Sector 14"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">City *</label>
                        <input
                          type="text"
                          required
                          value={offlineCity}
                          onChange={(e) => setOfflineCity(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                          placeholder="e.g. Panipat"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">State *</label>
                        <input
                          type="text"
                          required
                          value={offlineState}
                          onChange={(e) => setOfflineState(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                          placeholder="e.g. Haryana"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Pincode *</label>
                        <input
                          type="text"
                          required
                          value={offlinePincode}
                          onChange={(e) => setOfflinePincode(e.target.value)}
                          className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                          placeholder="e.g. 132103"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Charges & Expenses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Charges (Billed to Customer)</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Packaging Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={offlinePackagingCharge}
                            onChange={(e) => setOfflinePackagingCharge(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Shipping Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={offlineShippingCharge}
                            onChange={(e) => setOfflineShippingCharge(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Expenses (Your Actual Costs)</span>
                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Packaging Cost (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={offlinePackagingCost}
                            onChange={(e) => setOfflinePackagingCost(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-slate-400 mb-0.5">Shipping Cost (₹)</label>
                          <input
                            type="number"
                            min="0"
                            value={offlineShippingCost}
                            onChange={(e) => setOfflineShippingCost(e.target.value)}
                            className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Items Selection */}
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Product Items List</span>
                      <button
                        type="button"
                        onClick={addOfflineItemRow}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] rounded-lg flex items-center space-x-1 uppercase cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-white" />
                        <span>Add Item</span>
                      </button>
                    </div>

                    {offlineItems.map((item, idx) => {
                      const selectedProd = products.find(p => String(p._id) === String(item.productId) || String(p.id) === String(item.productId));
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-2.5 items-end bg-white p-3 rounded-xl border border-slate-200">
                          <div className="flex-1 min-w-0 w-full">
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Product *</label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                                className="w-full flex items-center justify-between px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500"
                              >
                                {selectedProd ? (
                                  <div className="flex items-center space-x-2 truncate">
                                    <img src={selectedProd.image} className="w-6 h-6 object-cover rounded border" />
                                    <span className="truncate">{selectedProd.name}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-400">Select a Product</span>
                                )}
                                <ChevronDown className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              </button>

                              {openDropdownIdx === idx && (
                                <div className="absolute left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-30 p-2 max-h-60 overflow-y-auto space-y-2">
                                  <input
                                    type="text"
                                    placeholder="Search product..."
                                    value={prodSearchQueries[idx] || ''}
                                    onChange={(e) => updateSearchQuery(idx, e.target.value)}
                                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    autoFocus
                                  />
                                  <div className="divide-y divide-slate-100 max-h-44 overflow-y-auto">
                                    {filteredProductsForSearch(idx).map(p => (
                                      <button
                                        key={p._id || p.id}
                                        type="button"
                                        onClick={() => {
                                          updateOfflineItem(idx, 'productId', p._id || p.id);
                                          setOpenDropdownIdx(null);
                                          updateSearchQuery(idx, '');
                                        }}
                                        className="w-full flex items-center space-x-2.5 p-2 hover:bg-slate-50 text-left text-xs cursor-pointer rounded-lg"
                                      >
                                        <img src={p.image} className="w-8 h-8 object-cover rounded border shrink-0 bg-slate-50" />
                                        <div className="min-w-0 flex-1 leading-tight">
                                          <p className="font-extrabold text-slate-800 truncate">{p.name}</p>
                                          <span className="text-[10px] text-slate-500 font-semibold">₹{p.price}</span>
                                        </div>
                                      </button>
                                    ))}
                                    {filteredProductsForSearch(idx).length === 0 && (
                                      <p className="text-[10px] text-slate-400 text-center py-3">No products found</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="w-24 shrink-0">
                            <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Selling Price (₹)</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.price}
                              onChange={(e) => updateOfflineItem(idx, 'price', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                              placeholder={selectedProd ? selectedProd.price : ''}
                            />
                          </div>
                          <div className="w-20 shrink-0">
                            <label className="block text-[8px] font-bold text-slate-450 mb-0.5">Quantity *</label>
                            <input
                              type="number"
                              required
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOfflineItem(idx, 'quantity', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 bg-white rounded-lg text-xs"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeOfflineItemRow(idx)}
                            disabled={offlineItems.length === 1}
                            className="p-2 text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Calculations Summary */}
                  <div className="border-t border-slate-200 pt-4 flex flex-col items-end text-xs space-y-1.5 font-bold">
                    <div className="text-slate-500">Items Subtotal: ₹{subtotalAmount}</div>
                    <div className="text-slate-500">Packaging Fee (Billed to Customer): +₹{Number(offlinePackagingCharge) || 0}</div>
                    <div className="text-slate-500">Shipping Fee (Billed to Customer): +₹{Number(offlineShippingCharge) || 0}</div>
                    <div className="text-slate-900 text-sm font-black bg-slate-50 px-3 py-1.5 rounded-xl border">Grand Total (Customer Pays): ₹{grandTotalAmount}</div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddOfflineOrderModal(false)}
                      className="px-4 py-2 border rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={offlineActionLoading}
                      className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-black rounded-xl uppercase tracking-wider flex items-center space-x-1.5 cursor-pointer shadow-sm"
                    >
                      {offlineActionLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                      <span>Save Offline Order</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
