import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Package, ShoppingBag, Plus, Trash2, CheckCircle, ShieldCheck, Tag, MessageSquare, Star, Video, Upload, Loader2, Settings, Store, RefreshCw, Eye, ChevronDown } from 'lucide-react';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};
const getToken = () => getCookie('apna_admin_token');

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

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AdminDashboardModal({ isOpen, onClose, products, orders, onAddProduct, onDeleteProduct, onUpdateOrderStatus, onToggleStock, onAddOfflineOrder }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'addProduct', 'inventory', 'orders', 'feedbacks', 'reviews', 'settings'
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
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });
      const result = await res.json();
      if (result.success) {
        alert("Offline order recorded successfully!");
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
        
        if (onAddOfflineOrder) {
          onAddOfflineOrder();
        }
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

  // Fetch feedbacks from DB
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  // Fetch product reviews from DB
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Settings configuration state
  const [settings, setSettings] = useState({ secret_cod_code: 'APNACOD', commission_percentage: '10' });
  const [newCodCode, setNewCodCode] = useState('');
  const [newCommission, setNewCommission] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  // Sellers configuration state
  const [sellers, setSellers] = useState([]);
  const [sellersLoading, setSellersLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const loadSellers = async () => {
    try {
      setSellersLoading(true);
      const token = getToken();
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/auth/admin/sellers`, { headers, credentials: 'include' });
      const result = await res.json();
      if (result.success) {
        setSellers(result.sellers);
      }
    } catch (err) {
      console.warn("Failed to fetch sellers:", err);
    } finally {
      setSellersLoading(false);
    }
  };

  const handleUpdateSellerStatus = async (sellerId, nextStatus) => {
    if (!window.confirm(`Are you sure you want to change seller status to: ${nextStatus}?`)) return;
    try {
      const token = getToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${BASE_URL}/auth/admin/sellers/${sellerId}/status`, {
        method: 'PUT',
        headers,
        credentials: 'include',
        body: JSON.stringify({ status: nextStatus })
      });
      const result = await res.json();
      if (result.success) {
        alert(result.message);
        loadSellers();
      } else {
        alert(result.message || "Failed to update seller status.");
      }
    } catch (err) {
      alert("Error updating seller status: " + err.message);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!newCodCode.trim() || !newCommission.trim()) return;
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          secret_cod_code: newCodCode,
          commission_percentage: newCommission
        })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setNewCodCode(data.settings.secret_cod_code);
        setNewCommission(data.settings.commission_percentage);
        setSettingsSuccess('✅ Store configurations saved successfully!');
        loadSellers();
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (err) {
      setSettingsError(err.message || 'Something went wrong');
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    // Load feedbacks
    setFeedbacksLoading(true);
    fetch(`${BASE_URL}/feedbacks`)
      .then(r => r.json())
      .then(d => { if (d.success) setFeedbacks(d.feedbacks || []); })
      .catch(() => {})
      .finally(() => setFeedbacksLoading(false));
    // Load all reviews
    setReviewsLoading(true);
    fetch(`${BASE_URL}/reviews`)
      .then(r => r.json())
      .then(d => { if (d.success) setAllReviews(d.reviews || []); })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
    // Load settings
    fetch(`${BASE_URL}/settings`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.settings) {
          setSettings(d.settings);
          setNewCodCode(d.settings.secret_cod_code);
          setNewCommission(d.settings.commission_percentage || '10');
        }
      })
      .catch(() => {});
    loadSellers();
  }, [isOpen]);

  // New Product Form State
  const [newProd, setNewProd] = useState({
    name: '',
    category: "Men's Fashion",
    gender: 'Men',
    costPrice: '',     // Kharida Price
    price: '',         // Becha Price
    originalPrice: '', // M.R.P Price
    stock: 50,
    image: '',
    description: '',
    isCustomizable: false,
    customizationType: 'text',
    customizationPrompt: ''
  });

  const [successToast, setSuccessToast] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  // Revenue & Profit Calculations across all orders
  const totalRevenue = orders.reduce((sum, ord) => sum + ord.totalAmount, 0);

  // Compute total cost price of sold items across orders
  const totalCost = orders.reduce((sum, ord) => {
    const itemsCost = ord.items.reduce((itemSum, item) => {
      const origProd = products.find(p => p.id === item.id || p.name === item.name || String(p._id) === String(item.productId));
      const costPerPiece = origProd && origProd.costPrice ? origProd.costPrice : (item.price * 0.6);
      return itemSum + (costPerPiece * item.quantity);
    }, 0);
    const offlineExpenses = ord.isOffline ? ((ord.packagingCost || 0) + (ord.shippingCost || 0)) : 0;
    return sum + itemsCost + offlineExpenses;
  }, 0);

  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Live profit preview for add product form
  const kharida = parseFloat(newProd.costPrice) || 0;
  const becha = parseFloat(newProd.price) || 0;
  const profitPerItem = becha - kharida;
  const itemMarginPercent = becha > 0 ? ((profitPerItem / becha) * 100).toFixed(1) : 0;
  
  // Calculate discount % for add product form
  const mrp = parseFloat(newProd.originalPrice) || 0;
  const discountPercent = mrp > becha && becha > 0 ? Math.round(((mrp - becha) / mrp) * 100) : 0;

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.price || !newProd.costPrice || !newProd.image) {
      alert("Please fill in Name, Cost Price (Kharida), Selling Price (Becha), and Image URL.");
      return;
    }

    const createdItem = {
      id: Date.now(),
      name: newProd.name,
      category: newProd.category,
      gender: newProd.gender,
      costPrice: parseFloat(newProd.costPrice),
      price: parseFloat(newProd.price),
      originalPrice: newProd.originalPrice ? parseFloat(newProd.originalPrice) : null,
      discount: discountPercent > 0 ? `${discountPercent}% OFF` : null,
      badge: "NEW ARRIVAL",
      rating: 5,
      reviewsCount: 1,
      image: newProd.image,
      description: newProd.description || "High quality product from Apna Bazarr.",
      tags: ["New Arrival", "Best Selling"],
      inStock: true,
      stock: parseInt(newProd.stock) || 50,
      isCustomizable: newProd.isCustomizable,
      customizationType: newProd.isCustomizable ? newProd.customizationType : 'none',
      customizationPrompt: newProd.isCustomizable ? newProd.customizationPrompt : ''
    };

    onAddProduct(createdItem);
    setSuccessToast(`Product "${createdItem.name}" added successfully!`);
    setNewProd({
      name: '',
      category: "Men's Fashion",
      gender: 'Men',
      costPrice: '',
      price: '',
      originalPrice: '',
      stock: 50,
      image: '',
      description: '',
      isCustomizable: false,
      customizationType: 'text',
      customizationPrompt: ''
    });

    setTimeout(() => {
      setSuccessToast('');
      setActiveTab('inventory');
    }, 1500);
  };

  return (
    <div className="w-full min-h-screen bg-slate-900 text-slate-800 antialiased flex flex-col">
      
      {/* 100% Full-Viewport Workspace Container */}
      <div className="w-full flex-1 bg-white flex flex-col">
        
        {/* Header Ribbon */}
        <div className="p-4 sm:p-6 bg-slate-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 shrink-0">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="p-2 bg-amber-500 text-slate-950 rounded-xl sm:rounded-2xl shrink-0 mt-1 sm:mt-0">
              <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-black text-sm sm:text-lg tracking-tight text-white">Single-Seller Admin Panel & Business Hub</h2>
                <span className="bg-amber-500 text-slate-950 font-black text-[8px] sm:text-[10px] px-2 py-0.5 rounded-full uppercase shrink-0">OWNER PORTAL</span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">Manage Products, Track Purchase vs Selling Prices (Kharida vs Becha), Net Profit & Customer Feedbacks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto justify-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <X className="w-4 h-4" />
            <span>Exit Dashboard</span>
          </button>
        </div>

        {/* Analytics Top Metric Cards */}
        <div className="bg-slate-900 text-white px-4 sm:px-8 py-5 border-b border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 shrink-0">
          
          <div className="bg-slate-800/90 p-3 sm:p-4 rounded-2xl border border-slate-700">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue (Becha)</span>
            <div className="text-base sm:text-xl md:text-2xl font-extrabold text-white mt-1">₹{totalRevenue.toFixed(2)}</div>
            <span className="text-[9px] sm:text-[10px] text-slate-400">{orders.length} total order(s)</span>
          </div>

          <div className="bg-slate-800/90 p-3 sm:p-4 rounded-2xl border border-slate-700">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost (Kharida)</span>
            <div className="text-base sm:text-xl md:text-2xl font-extrabold text-amber-300 mt-1">₹{totalCost.toFixed(2)}</div>
            <span className="text-[9px] sm:text-[10px] text-slate-400">Purchase cost</span>
          </div>

          <div className="bg-emerald-950/90 p-3 sm:p-4 rounded-2xl border border-emerald-700/60">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Net Profit (Munafa)</span>
            <div className="text-base sm:text-xl md:text-2xl font-black text-emerald-400 mt-1">₹{netProfit.toFixed(2)}</div>
            <span className="text-[9px] sm:text-[10px] text-emerald-300 font-bold">{marginPercent}% margin</span>
          </div>

          <div className="bg-slate-800/90 p-3 sm:p-4 rounded-2xl border border-slate-700">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Products</span>
            <div className="text-base sm:text-xl md:text-2xl font-extrabold text-white mt-1">{products.length} Items</div>
            <span className="text-[9px] sm:text-[10px] text-slate-400">Active catalog</span>
          </div>

          <div className="bg-slate-800/90 p-3 sm:p-4 rounded-2xl border border-slate-700 col-span-2 md:col-span-1">
            <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Feedbacks & Reviews</span>
            <div className="text-base sm:text-xl md:text-2xl font-extrabold text-amber-400 mt-1">{feedbacks.length + allReviews.length}</div>
            <span className="text-[9px] sm:text-[10px] text-slate-400">{feedbacks.length} feedback · {allReviews.length} reviews</span>
          </div>

        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-slate-100 px-4 sm:px-6 flex space-x-4 sm:space-x-6 border-b border-slate-200 text-xs font-bold shrink-0 overflow-x-auto whitespace-nowrap scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'overview' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Analytics & Profit Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('addProduct')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'addProduct' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product (Kharida vs Becha)</span>
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'inventory' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Package className="w-4 h-4" />
            <span>Products Catalog ({products.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'orders' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('feedbacks')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'feedbacks' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Customer Feedbacks ({feedbacks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'reviews' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Star className="w-4 h-4" />
            <span>Product Reviews ({allReviews.length})</span>
          </button>
          <button
            onClick={() => { setActiveTab('sellers'); loadSellers(); }}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'sellers' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Store className="w-4 h-4" />
            <span>Sellers Directory ({sellers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3.5 transition-colors border-b-2 flex items-center space-x-1.5 ${activeTab === 'settings' ? 'border-[#0066cc] text-[#0066cc]' : 'border-transparent text-slate-600 hover:text-slate-900'}`}
          >
            <Settings className="w-4 h-4" />
            <span>Store Settings</span>
          </button>
        </div>

        {/* Workspace Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-slate-50">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              <div className="bg-blue-50/80 p-5 rounded-2xl border border-blue-200 text-xs text-slate-700 space-y-1.5">
                <h4 className="font-extrabold text-slate-900 text-sm">💡 Single-Seller Profit Calculation Rule:</h4>
                <p>• <span className="font-bold text-slate-900">Kharida Price (Cost Price)</span>: The exact price you paid to purchase/manufacture the item.</p>
                <p>• <span className="font-bold text-slate-900">Becha Price (Selling Price)</span>: The price shown to customers on Apna Bazarr.</p>
                <p>• <span className="font-bold text-emerald-700 font-extrabold">Profit Per Piece</span> = Selling Price - Cost Price.</p>
                <p className="text-[11px] text-slate-500 italic pt-1">* Buyers can only see the Selling Price and Discount %. Your Cost Price remains completely private.</p>
              </div>

              {/* Products Margin Analysis Table */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h4 className="font-extrabold text-base text-slate-900">Live Margin Analysis Per Product</h4>
                {/* Desktop Margin Table (Visible on md and larger) */}
                <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-amber-700">₹ Kharida Price</th>
                        <th className="p-3 text-[#0066cc]">₹ Becha Price</th>
                        <th className="p-3 text-emerald-700">₹ Profit / Piece</th>
                        <th className="p-3">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((item) => {
                        const cost = item.costPrice || (item.price * 0.6);
                        const profit = item.price - cost;
                        const margin = ((profit / item.price) * 100).toFixed(1);
                        return (
                          <tr key={item.id} className="hover:bg-slate-50">
                            <td className="p-3 font-bold text-slate-800 flex items-center space-x-2">
                              <img src={item.image} alt={item.name} className="w-9 h-9 rounded object-cover shrink-0" />
                              <span className="truncate max-w-xs">{item.name}</span>
                            </td>
                            <td className="p-3 text-slate-500">{item.category}</td>
                            <td className="p-3 font-bold text-amber-800">₹{cost.toFixed(2)}</td>
                            <td className="p-3 font-extrabold text-[#0066cc]">₹{item.price.toFixed(2)}</td>
                            <td className="p-3 font-black text-emerald-600">+₹{profit.toFixed(2)}</td>
                            <td className="p-3 font-bold text-slate-700">{margin}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Margin Cards (Visible on mobile only) */}
                <div className="block md:hidden space-y-3">
                  {products.map((item) => {
                    const cost = item.costPrice || (item.price * 0.6);
                    const profit = item.price - cost;
                    const margin = ((profit / item.price) * 100).toFixed(1);
                    return (
                      <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5">
                        <div className="flex items-center space-x-3">
                          <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover border bg-white shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{item.category}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-[10px] border-t border-slate-205/50 pt-2">
                          <div>
                            <span className="text-slate-400 block font-bold">Kharida</span>
                            <span className="font-extrabold text-amber-800">₹{cost.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Becha</span>
                            <span className="font-extrabold text-[#0066cc]">₹{item.price.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Profit</span>
                            <span className="font-extrabold text-emerald-600">+₹{profit.toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block font-bold">Margin</span>
                            <span className="font-black text-slate-700">{margin}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ADD PRODUCT FORM */}
          {activeTab === 'addProduct' && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-3xl mx-auto">
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <h3 className="font-extrabold text-base text-slate-900 border-b pb-3">Publish New Product with Cost & Selling Price</h3>

                {successToast && (
                  <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{successToast}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Title / Name *</label>
                    <input
                      type="text"
                      required
                      value={newProd.name}
                      onChange={(e) => setNewProd({ ...newProd, name: e.target.value })}
                      placeholder="e.g. Pure Cotton Silk Kurta Set"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-slate-700">Category *</label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategory(!isCustomCategory)}
                        className="text-[10px] text-[#0066cc] font-extrabold hover:underline cursor-pointer"
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
                        placeholder="e.g. Sweets & Gifts"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] font-semibold bg-white text-slate-850"
                      />
                    ) : (
                      <select
                        value={newProd.category}
                        onChange={(e) => setNewProd({ ...newProd, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] bg-white text-slate-850"
                      >
                        <option value="Men's Fashion">Men's Fashion</option>
                        <option value="Women's Wear">Women's Wear</option>
                        <option value="Kids' Collection">Kids' Collection</option>
                        <option value="Rakhi Specials">Rakhi Specials 🪔</option>
                        <option value="Footwear & Shoes">Footwear & Shoes</option>
                        <option value="Watches & Gadgets">Watches & Gadgets</option>
                        <option value="Backpacks">Backpacks & Luggage</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* PRICING SECTION: KHARIDA VS BECHA */}
                <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200 space-y-3">
                  <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center space-x-1">
                    <Tag className="w-4 h-4 text-amber-700" />
                    <span>Pricing & Profit Configuration (Kharida vs Becha)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    <div>
                      <label className="block text-xs font-bold text-amber-900 mb-1">
                        ₹ Kharida Price (Cost) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step="any"
                        value={newProd.costPrice}
                        onChange={(e) => setNewProd({ ...newProd, costPrice: e.target.value })}
                        placeholder="e.g. 500"
                        className="w-full px-3 py-2 text-xs border border-amber-300 rounded-lg focus:outline-none focus:border-amber-600 font-bold text-amber-900 bg-white"
                      />
                      <span className="text-[10px] text-amber-700">Cost to you (Private)</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-blue-900 mb-1">
                        ₹ Becha Price (Selling) *
                      </label>
                      <input
                        type="number"
                        required
                        min={0}
                        step="any"
                        value={newProd.price}
                        onChange={(e) => setNewProd({ ...newProd, price: e.target.value })}
                        placeholder="e.g. 899"
                        className="w-full px-3 py-2 text-xs border border-blue-300 rounded-lg focus:outline-none focus:border-[#0066cc] font-extrabold text-[#0066cc] bg-white"
                      />
                      <span className="text-[10px] text-blue-700">Customer price</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ₹ M.R.P. (Original Price)
                      </label>
                      <input
                        type="number"
                        min={0}
                        step="any"
                        value={newProd.originalPrice}
                        onChange={(e) => setNewProd({ ...newProd, originalPrice: e.target.value })}
                        placeholder="e.g. 1299"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-slate-500 bg-white"
                      />
                      <span className="text-[10px] text-slate-500">For discount tag</span>
                    </div>

                  </div>

                  {/* Live Profit Preview Box */}
                  {becha > 0 && kharida > 0 && (
                    <div className="bg-emerald-100 border border-emerald-300 p-3 rounded-lg flex items-center justify-between text-xs animate-fade-in">
                      <div>
                        <span className="text-emerald-900 font-bold">Estimated Profit per item: </span>
                        <span className="text-emerald-900 font-black text-sm">₹{profitPerItem.toFixed(2)}</span>
                      </div>
                      <div className="text-right">
                        <span className="bg-emerald-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                          {itemMarginPercent}% Profit Margin
                        </span>
                        {discountPercent > 0 && (
                          <span className="ml-2 bg-blue-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded">
                            {discountPercent}% OFF Tag
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Target Gender / Collection</label>
                    <select
                      value={newProd.gender}
                      onChange={(e) => setNewProd({ ...newProd, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    >
                      <option value="Men">Men</option>
                      <option value="Women">Women</option>
                      <option value="Kids">Kids</option>
                      <option value="Unisex">Unisex</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={newProd.stock}
                      onChange={(e) => setNewProd({ ...newProd, stock: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Image *</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        setImageUploading(true);
                        try {
                          const url = await uploadToCloudinary(file, 'product-image');
                          setNewProd(prev => ({ ...prev, image: url }));
                        } catch (err) {
                          alert("Image upload failed: " + err.message);
                        } finally {
                          setImageUploading(false);
                        }
                      }}
                      className="hidden"
                      id="admin-image-upload"
                    />
                    <label
                      htmlFor="admin-image-upload"
                      className="cursor-pointer px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition-colors flex items-center space-x-1.5 shrink-0"
                    >
                      {imageUploading ? (
                        <><Loader2 className="w-4 h-4 animate-spin text-slate-700" /><span>Uploading...</span></>
                      ) : (
                        <><Upload className="w-4 h-4 text-slate-700" /><span>Upload Image File</span></>
                      )}
                    </label>
                    <input
                      type="url"
                      value={newProd.image}
                      onChange={(e) => setNewProd({ ...newProd, image: e.target.value })}
                      placeholder="Or enter image URL manually..."
                      className="flex-1 px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                  {newProd.image && (
                    <div className="mt-2 flex items-center space-x-2">
                      <img src={newProd.image} alt="Preview" className="w-12 h-12 object-cover rounded-lg border" />
                      <span className="text-[10px] text-emerald-600 font-bold">Image loaded successfully!</span>
                    </div>
                  )}
                </div>

                {/* Product Customization Options */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="admin-is-customizable"
                      checked={newProd.isCustomizable || false}
                      onChange={(e) => setNewProd({ ...newProd, isCustomizable: e.target.checked })}
                      className="w-4 h-4 text-[#0066cc] border-slate-350 focus:ring-[#0066cc] rounded cursor-pointer"
                    />
                    <label htmlFor="admin-is-customizable" className="text-xs font-bold text-slate-800 cursor-pointer select-none">
                      Is this product customizable? (Requires customer text or photo upload)
                    </label>
                  </div>

                  {(newProd.isCustomizable || false) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-200 animate-fade-in">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Customization Input Type</label>
                        <select
                          value={newProd.customizationType || 'text'}
                          onChange={(e) => setNewProd({ ...newProd, customizationType: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] bg-white text-slate-850 font-bold"
                        >
                          <option value="text">Text Input Only (Name, wish note, etc.)</option>
                          <option value="image">Photo Upload Only (Custom user design)</option>
                          <option value="both">Both Text & Photo Upload</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Customization Instruction / Prompt</label>
                        <input
                          type="text"
                          required={newProd.isCustomizable}
                          value={newProd.customizationPrompt || ''}
                          onChange={(e) => setNewProd({ ...newProd, customizationPrompt: e.target.value })}
                          placeholder="e.g. Enter name to print / Upload your photo"
                          className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc] bg-white text-slate-850 font-semibold"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Product Description</label>
                  <textarea
                    rows={3}
                    value={newProd.description}
                    onChange={(e) => setNewProd({ ...newProd, description: e.target.value })}
                    placeholder="Describe material, sizing, and details..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>SAVE & PUBLISH PRODUCT TO STORE</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PRODUCTS INVENTORY */}
          {activeTab === 'inventory' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-6xl mx-auto">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-sm font-extrabold text-slate-900">All Live Store Products ({products.length})</h4>
                <button
                  onClick={() => setActiveTab('addProduct')}
                  className="px-4 py-2 bg-[#0066cc] text-white text-xs font-bold rounded-xl flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Product</span>
                </button>
              </div>

              {/* Desktop Inventory Table (Visible on md and larger) */}
              <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Product</th>
                      <th className="p-3">Category</th>
                      <th className="p-3 text-amber-800">Kharida (Cost)</th>
                      <th className="p-3 text-[#0066cc]">Becha (Sell)</th>
                      <th className="p-3 text-emerald-700">Profit / Item</th>
                      <th className="p-3">Stock</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((p) => {
                      const cost = p.costPrice || (p.price * 0.6);
                      const profit = p.price - cost;
                      return (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-800 flex items-center space-x-2">
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0" />
                            <span className="line-clamp-1 max-w-xs">{p.name}</span>
                          </td>
                          <td className="p-3 text-slate-500">{p.category}</td>
                          <td className="p-3 font-bold text-amber-800">₹{cost.toFixed(2)}</td>
                          <td className="p-3 font-extrabold text-[#0066cc]">₹{p.price.toFixed(2)}</td>
                          <td className="p-3 font-black text-emerald-600">+₹{profit.toFixed(2)}</td>
                          <td className="p-3">
                            <div className="flex flex-col space-y-1">
                              <span className="font-semibold text-slate-700">{p.stock || 50} in stock</span>
                              <button
                                type="button"
                                onClick={() => onToggleStock(p.id)}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold w-max transition-colors ${
                                  p.inStock !== false
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                }`}
                              >
                                {p.inStock !== false ? '● In Stock' : '○ Out of Stock'}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Inventory Cards (Visible on mobile only) */}
              <div className="block md:hidden space-y-3">
                {products.map((p) => {
                  const cost = p.costPrice || (p.price * 0.6);
                  const profit = p.price - cost;
                  return (
                    <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-205/60 space-y-3">
                      <div className="flex items-start space-x-3">
                        <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border bg-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-800 line-clamp-2">{p.name}</h5>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{p.category}</span>
                        </div>
                        <button
                          onClick={() => onDeleteProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10px] border-t border-slate-200/50 pt-2.5">
                        <div>
                          <span className="text-slate-400 block font-bold">Kharida (Cost)</span>
                          <span className="font-extrabold text-amber-800">₹{cost.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">Becha (Sell)</span>
                          <span className="font-extrabold text-[#0066cc]">₹{p.price.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold">Profit</span>
                          <span className="font-extrabold text-emerald-600">+₹{profit.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/50">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold text-slate-650">{p.stock || 50} in stock</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleStock(p.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition-colors ${
                            p.inStock !== false
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          }`}
                        >
                          {p.inStock !== false ? '● In Stock' : '○ Out of Stock'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-6xl mx-auto">
              <div className="flex justify-between items-center border-b pb-3">
                <h4 className="text-sm font-extrabold text-slate-900">Customer Orders History ({orders.length})</h4>
                <button
                  onClick={() => setShowAddOfflineOrderModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4 text-white" />
                  <span>Add Offline Order</span>
                </button>
              </div>
              
              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No orders placed yet.</div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-extrabold text-slate-900">{ord.orderId}</span>
                          {ord.isOffline ? (
                            <span className="bg-blue-100 text-blue-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-lg ml-2 border border-blue-250 uppercase tracking-wide">
                              Offline ({ord.paymentMethod})
                            </span>
                          ) : ord.paymentMethod === 'COD' ? (
                            <span className="bg-rose-100 text-rose-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-lg ml-2 border border-rose-200">
                              Cash on Delivery (COD)
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-700 font-extrabold text-[10px] px-2.5 py-0.5 rounded-lg ml-2 border border-emerald-200">
                              Online Payment (Razorpay/UPI)
                            </span>
                          )}
                        </div>

                        {/* Status Updater Dropdown */}
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold text-slate-500">Status:</span>
                          <select
                            value={ord.orderStatus}
                            onChange={(e) => onUpdateOrderStatus(ord.orderId, e.target.value)}
                            className="text-xs font-extrabold bg-blue-50 text-[#0066cc] border border-blue-200 rounded px-2.5 py-1 focus:outline-none"
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Processing">Processing</option>
                            <option value="Packed">Packed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Out for Delivery">Out for Delivery</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-xs text-slate-600">
                        <span className="font-bold">Customer: </span>
                        <span>{ord.shippingAddress.fullName} ({ord.shippingAddress.phone}) — {ord.shippingAddress.flatNo}, {ord.shippingAddress.city}, {ord.shippingAddress.state} - {ord.shippingAddress.pincode}</span>
                      </div>

                      {/* Detailed Order Items Breakdown */}
                      <div className="pl-3 border-l-2 border-slate-300 space-y-2 mt-2">
                        {ord.items.map((item, itemIdx) => (
                          <div key={itemIdx} className="flex items-center justify-between text-xs bg-white p-2.5 rounded-xl border border-slate-200">
                            <div className="flex items-center space-x-3">
                              {item.image && (
                                <img src={item.image} alt={item.name} className="w-9 h-9 rounded object-cover border shrink-0 bg-slate-50" />
                              )}
                              <div>
                                <span className="font-bold text-slate-800 block truncate max-w-md">{item.name}</span>
                                <span className="text-[10px] text-slate-500 block mt-0.5">
                                  Price: ₹{item.price} • Qty: {item.quantity}
                                </span>
                                {(item.customText || item.customImage) && (
                                  <div className="mt-1.5 p-2 bg-amber-50/70 border border-amber-200/50 rounded-lg text-[10px] text-amber-900 font-semibold space-y-0.5 max-w-sm">
                                    {item.customText && (
                                      <div>
                                        <span className="text-slate-500 font-bold">Custom Text: </span>
                                        <span className="text-slate-800 font-extrabold">"{item.customText}"</span>
                                      </div>
                                    )}
                                    {item.customImage && (
                                      <div className="flex items-center space-x-1.5 pt-0.5">
                                        <span className="text-slate-500 font-bold">Custom Photo: </span>
                                        <img src={item.customImage} alt="User Upload" className="w-5 h-5 object-cover rounded border bg-white" />
                                        <a href={item.customImage} target="_blank" rel="noreferrer" className="text-[#0066cc] underline text-[9px] hover:text-blue-800 font-bold">View Link</a>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="font-extrabold text-slate-900 shrink-0">₹{(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 mt-2">
                        <span className="text-slate-500 font-bold">Grand total count: {ord.items.reduce((acc, it) => acc + it.quantity, 0)} unit(s)</span>
                        <span className="font-black text-[#0066cc] text-sm">Amount Paid: ₹{ord.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: CUSTOMER FEEDBACKS */}
          {activeTab === 'feedbacks' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-6xl mx-auto">
              <h4 className="text-sm font-extrabold text-slate-900 border-b pb-3">System-Level Customer Feedbacks ({feedbacks.length})</h4>
              
              {feedbacksLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading feedbacks...</div>
              ) : feedbacks.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No customer feedbacks submitted yet.</div>
              ) : (
                <div className="space-y-4">
                  {feedbacks.map((fb) => (
                    <div key={fb._id || fb.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-xs text-slate-900">{fb.name}</span>
                          <span className="text-[11px] text-slate-400">({fb.email})</span>
                          <span className="bg-blue-100 text-[#0066cc] text-[10px] font-bold px-2 py-0.5 rounded">{fb.category}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < fb.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">"{fb.message}"</p>

                      <div className="flex items-center space-x-4 pt-1">
                        {fb.photoUrl && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-500">Photo:</span>
                            <img src={fb.photoUrl} alt="Feedback Photo" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          </div>
                        )}
                        {fb.videoUrl && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-500">Video:</span>
                            <video src={fb.videoUrl} controls className="w-24 h-16 object-cover rounded-lg border border-slate-200" />
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 text-right">
                        Submitted on {fb.createdAt ? new Date(fb.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PRODUCT REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-6xl mx-auto">
              <h4 className="text-sm font-extrabold text-slate-900 border-b pb-3">Product-Level Customer Reviews ({allReviews.length})</h4>
              
              {reviewsLoading ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading product reviews...</div>
              ) : allReviews.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No product reviews posted yet.</div>
              ) : (
                <div className="space-y-4">
                  {allReviews.map((rev) => (
                    <div key={rev._id || rev.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-amber-100 text-amber-900 font-extrabold text-xs px-2.5 py-0.5 rounded-lg">
                            Product: {rev.productName || `ID #${rev.productId}`}
                          </span>
                          <span className="font-extrabold text-xs text-slate-900">{rev.userName || rev.name}</span>
                          {rev.userEmail && <span className="text-[11px] text-slate-400">({rev.userEmail})</span>}
                        </div>

                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < rev.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-semibold">"{rev.comment}"</p>

                      <div className="flex items-center space-x-4 pt-1">
                        {rev.photoUrl && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-500">Review Photo:</span>
                            <img src={rev.photoUrl} alt="Review Photo" className="w-16 h-16 object-cover rounded-lg border border-slate-200" />
                          </div>
                        )}
                        {rev.videoUrl && (
                          <div className="flex items-center space-x-2">
                            <span className="text-[11px] font-bold text-slate-500">Review Video:</span>
                            <video src={rev.videoUrl} controls className="w-24 h-16 object-cover rounded-lg border border-slate-200" />
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-slate-400 text-right">
                        Posted on {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: STORE SETTINGS */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6 max-w-2xl mx-auto">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 border-b pb-3">Store Configurations</h4>
                <p className="text-xs text-slate-500 mt-1">Manage global website options and secret codes.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-650 uppercase">
                    Secret COD Unlock Code
                  </label>
                  <input 
                    type="text"
                    value={newCodCode}
                    onChange={(e) => setNewCodCode(e.target.value)}
                    placeholder="Enter new secret code (e.g. APNACOD)..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc] bg-white text-slate-855 uppercase font-bold"
                  />
                  <p className="text-[10px] text-slate-400">
                    If a customer enters this code on checkout, the Cash on Delivery (COD) payment option will be unlocked.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-650 uppercase">
                    Admin profit commission Cut (%)
                  </label>
                  <input 
                    type="number"
                    min={0}
                    max={100}
                    value={newCommission}
                    onChange={(e) => setNewCommission(e.target.value)}
                    placeholder="e.g. 10..."
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc] bg-white text-slate-855 font-bold"
                  />
                  <p className="text-[10px] text-slate-400">
                    The percentage cut the website receives from all sales generated by multiple sellers.
                  </p>
                </div>

                {settingsError && (
                  <p className="text-xs text-red-655 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    ⚠️ {settingsError}
                  </p>
                )}

                {settingsSuccess && (
                  <p className="text-xs text-emerald-700 font-semibold bg-emerald-50 border border-emerald-250 rounded-lg px-3 py-2">
                    {settingsSuccess}
                  </p>
                )}

                <button 
                  type="submit"
                  disabled={settingsLoading || !newCodCode.trim() || !newCommission.trim()}
                  className="px-6 py-2.5 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
                >
                  {settingsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Settings</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 8: SELLERS DIRECTORY */}
          {activeTab === 'sellers' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-905">Sellers Directory & Commission Earnings</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage active sellers and monitor website profit cuts (Currently set to: <strong className="text-[#0066cc]">{settings.commission_percentage || '10'}% Commission</strong>).
                  </p>
                </div>
                <button
                  onClick={loadSellers}
                  className="px-4 py-2 border rounded-xl text-xs font-black text-slate-700 hover:bg-slate-50 bg-white shadow-2xs flex items-center space-x-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>REFRESH LIST</span>
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                {sellersLoading ? (
                  <div className="p-16 text-center space-y-2">
                    <Loader2 className="w-8 h-8 text-[#0066cc] animate-spin mx-auto" />
                    <p className="text-xs text-slate-450 font-black uppercase">Loading registered sellers...</p>
                  </div>
                ) : sellers.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <Store className="w-12 h-12 text-slate-350 mx-auto" />
                    <div>
                      <h4 className="text-sm font-black text-slate-800">No sellers registered yet</h4>
                      <p className="text-xs text-slate-400 font-semibold mt-1">Once a user completes seller registration, their shop profile details will show here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-450 uppercase tracking-widest border-b border-slate-200">
                          <th className="px-6 py-4">Shop Details</th>
                          <th className="px-6 py-4">Seller Owner</th>
                          <th className="px-6 py-4">Products Listed</th>
                          <th className="px-6 py-4">Total Sales</th>
                          <th className="px-6 py-4">Admin Commission Cut ({settings.commission_percentage || '10'}%)</th>
                          <th className="px-6 py-4">Contact Phone</th>
                          <th className="px-6 py-4 text-right">Approval Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sellers.map(s => (
                          <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-4.5">
                              <h4 
                                onClick={() => setSelectedSeller(s)}
                                className="text-xs font-black text-[#0066cc] hover:underline cursor-pointer flex items-center"
                              >
                                <Eye className="w-3.5 h-3.5 mr-1" />
                                {s.shopName}
                              </h4>
                              <p className="text-[10px] text-slate-400 font-bold truncate max-w-xs mt-0.5" title={s.shopDescription}>
                                {s.shopDescription || 'No description provided.'}
                              </p>
                              <span className="text-[9px] text-slate-500 font-bold block mt-1">📍 {s.shopAddress}</span>
                            </td>

                            <td className="px-6 py-4.5">
                              <div className="text-xs font-black text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-slate-450 font-bold mt-0.5">{s.email}</div>
                            </td>

                            <td className="px-6 py-4.5">
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full border">
                                {s.productsCount} items
                              </span>
                            </td>

                            <td className="px-6 py-4.5">
                              <span className="text-xs font-black text-slate-900">₹{s.totalSales.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-slate-450 font-bold block mt-0.5">{s.totalItems} items sold</span>
                            </td>

                            <td className="px-6 py-4.5">
                              <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                +₹{s.commissionEarned.toLocaleString('en-IN')}
                              </span>
                            </td>

                            <td className="px-6 py-4.5 text-xs font-black text-slate-700">
                              <a href={`tel:${s.phone}`} className="text-[#0066cc] hover:underline">
                                {s.phone || 'N/A'}
                              </a>
                            </td>

                            <td className="px-6 py-4.5 text-right">
                              <div className="flex flex-col items-end space-y-1.5">
                                <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border inline-block ${
                                  s.status === 'approved' 
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                    : s.status === 'rejected' 
                                    ? 'bg-red-50 text-red-700 border-red-200' 
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {s.status || 'approved'}
                                </span>
                                <div className="flex items-center space-x-1.5">
                                  {s.status !== 'approved' && (
                                    <button
                                      onClick={() => handleUpdateSellerStatus(s.id, 'approved')}
                                      className="text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {s.status !== 'rejected' && (
                                    <button
                                      onClick={() => handleUpdateSellerStatus(s.id, 'rejected')}
                                      className="text-[9px] font-bold bg-red-650 hover:bg-red-705 text-white px-2 py-0.5 rounded cursor-pointer transition-colors"
                                    >
                                      Reject
                                    </button>
                                  )}
                                </div>
                              </div>
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

          {selectedSeller && (
                <div className="fixed inset-0 z-55 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={() => setSelectedSeller(null)} />
                  
                  <div className="relative bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-200 z-10">
                    <div className="bg-slate-950 text-white p-5 flex justify-between items-center border-b border-slate-900">
                      <div>
                        <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest block">Seller Detail Record</span>
                        <h3 className="text-sm font-black text-white">{selectedSeller.shopName}</h3>
                      </div>
                      <button 
                        onClick={() => setSelectedSeller(null)} 
                        className="w-7 h-7 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-800 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Owner Name</span>
                          <p className="font-extrabold text-slate-800">{selectedSeller.name}</p>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Email ID</span>
                          <p className="font-extrabold text-slate-850 truncate">{selectedSeller.email}</p>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Contact Phone</span>
                          <p className="font-extrabold text-slate-800">{selectedSeller.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Shop Location</span>
                          <p className="font-extrabold text-slate-800">{selectedSeller.shopAddress || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Pickup Pincode</span>
                          <p className="font-extrabold text-slate-800">📍 {selectedSeller.pickupPincode || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="block text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">Return Policy</span>
                          <p className="font-extrabold text-slate-800">🛡️ {selectedSeller.returnPolicy || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 space-y-2.5">
                        <span className="text-[10px] text-[#0066cc] font-black uppercase tracking-widest block font-sans">Bank Payout details</span>
                        <div className="bg-slate-50 border p-3 rounded-2xl grid grid-cols-2 gap-3 text-xs border-slate-200">
                          <div>
                            <span className="block text-[8px] text-slate-450 uppercase font-black leading-none mb-0.5">A/C Holder</span>
                            <span className="font-bold text-slate-800">{selectedSeller.bankDetails?.accountName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-455 uppercase font-black leading-none mb-0.5">Bank Name</span>
                            <span className="font-bold text-slate-800">{selectedSeller.bankDetails?.bankName || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-450 uppercase font-black leading-none mb-0.5">Account Number</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedSeller.bankDetails?.accountNumber || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] text-slate-455 uppercase font-black leading-none mb-0.5">IFSC Code</span>
                            <span className="font-bold text-slate-800 font-mono">{selectedSeller.bankDetails?.ifscCode || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-3 text-center">
                        <div className="bg-slate-50 border p-2 rounded-xl">
                          <span className="block text-[8px] text-slate-400 font-black uppercase">Products</span>
                          <span className="text-xs font-black text-slate-800">{selectedSeller.productsCount}</span>
                        </div>
                        <div className="bg-slate-50 border p-2 rounded-xl">
                          <span className="block text-[8px] text-slate-400 font-black uppercase">Sales Total</span>
                          <span className="text-xs font-black text-slate-800">₹{selectedSeller.totalSales}</span>
                        </div>
                        <div className="bg-slate-50 border p-2 rounded-xl bg-emerald-50/20 border-emerald-105">
                          <span className="block text-[8px] text-emerald-600 font-black uppercase">Admin Cut</span>
                          <span className="text-xs font-black text-emerald-700">₹{selectedSeller.commissionEarned}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex gap-2">
                        {selectedSeller.status !== 'approved' ? (
                          <button
                            onClick={async () => {
                              await handleUpdateSellerStatus(selectedSeller.id, 'approved');
                              setSelectedSeller(null);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-750 text-white font-black text-[9.5px] uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Approve Shop
                          </button>
                        ) : (
                          <button
                            onClick={async () => {
                              await handleUpdateSellerStatus(selectedSeller.id, 'rejected');
                              setSelectedSeller(null);
                            }}
                            className="bg-red-600 hover:bg-red-750 text-white font-black text-[9.5px] uppercase px-4 py-2 rounded-xl transition-all cursor-pointer"
                          >
                            Suspend Shop
                          </button>
                        )}
                      </div>
                      <button
                        onClick={() => setSelectedSeller(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-[9.5px] uppercase rounded-xl transition-all cursor-pointer"
                      >
                        Close
                      </button>
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
                                <label className="block text-[8px] font-bold text-slate-400 mb-0.5">Quantity *</label>
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
      </div>
    </div>
  );
}
