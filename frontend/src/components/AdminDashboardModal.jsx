import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Package, ShoppingBag, Plus, Trash2, CheckCircle, ShieldCheck, Tag, MessageSquare, Star, Video, Upload, Loader2, Settings } from 'lucide-react';

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

export default function AdminDashboardModal({ isOpen, onClose, products, orders, onAddProduct, onDeleteProduct, onUpdateOrderStatus, onToggleStock }) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'addProduct', 'inventory', 'orders', 'feedbacks', 'reviews', 'settings'

  // Fetch feedbacks from DB
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbacksLoading, setFeedbacksLoading] = useState(false);

  // Fetch product reviews from DB
  const [allReviews, setAllReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Settings configuration state
  const [settings, setSettings] = useState({ secret_cod_code: 'APNACOD' });
  const [newCodCode, setNewCodCode] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [settingsError, setSettingsError] = useState('');

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!newCodCode.trim()) return;
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret_cod_code: newCodCode })
      });
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setNewCodCode(data.settings.secret_cod_code);
        setSettingsSuccess('✅ Secret COD Code updated successfully!');
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
        }
      })
      .catch(() => {});
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
    return sum + ord.items.reduce((itemSum, item) => {
      const origProd = products.find(p => p.id === item.id || p.name === item.name);
      const costPerPiece = origProd && origProd.costPrice ? origProd.costPrice : (item.price * 0.6);
      return itemSum + (costPerPiece * item.quantity);
    }, 0);
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
        <div className="p-4 sm:p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl">
              <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-black text-lg sm:text-xl tracking-tight text-white">Single-Seller Admin Panel & Business Hub</h2>
                <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">OWNER PORTAL</span>
              </div>
              <p className="text-xs text-slate-400">Manage Products, Track Purchase vs Selling Prices (Kharida vs Becha), Net Profit & Customer Feedbacks</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <X className="w-4 h-4" />
            <span>Exit Dashboard</span>
          </button>
        </div>

        {/* Analytics Top Metric Cards */}
        <div className="bg-slate-900 text-white px-4 sm:px-8 py-5 border-b border-slate-800 grid grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 shrink-0">
          
          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Revenue (Becha)</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">₹{totalRevenue.toFixed(2)}</div>
            <span className="text-[10px] text-slate-400">{orders.length} total order(s)</span>
          </div>

          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Cost (Kharida)</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-300 mt-1">₹{totalCost.toFixed(2)}</div>
            <span className="text-[10px] text-slate-400">Purchase cost</span>
          </div>

          <div className="bg-emerald-950/90 p-4 rounded-2xl border border-emerald-700/60">
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">Net Profit (Munafa)</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">₹{netProfit.toFixed(2)}</div>
            <span className="text-[10px] text-emerald-300 font-bold">{marginPercent}% profit margin</span>
          </div>

          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Products</span>
            <div className="text-xl sm:text-2xl font-extrabold text-white mt-1">{products.length} Items</div>
            <span className="text-[10px] text-slate-400">Active catalog</span>
          </div>

          <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 col-span-2 md:col-span-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Feedbacks & Reviews</span>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-400 mt-1">{feedbacks.length + allReviews.length}</div>
            <span className="text-[10px] text-slate-400">{feedbacks.length} feedback · {allReviews.length} reviews</span>
          </div>

        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="bg-slate-100 px-4 sm:px-8 flex space-x-6 border-b border-slate-200 text-xs font-bold shrink-0 overflow-x-auto">
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
                <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                              <img src={item.image} alt={item.name} className="w-9 h-9 rounded object-cover" />
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

              <div className="overflow-x-auto rounded-xl border border-slate-200">
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
                            <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
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
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4 max-w-6xl mx-auto">
              <h4 className="text-sm font-extrabold text-slate-900 border-b pb-3">Customer Orders History ({orders.length})</h4>
              
              {orders.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No orders placed yet.</div>
              ) : (
                <div className="space-y-3">
                  {orders.map((ord, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                        <div>
                          <span className="font-extrabold text-slate-900">{ord.orderId}</span>
                          {ord.paymentMethod === 'COD' ? (
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc] bg-white text-slate-850 uppercase font-bold"
                  />
                  <p className="text-[10px] text-slate-400">
                    If a customer enters this code on checkout, the Cash on Delivery (COD) payment option will be unlocked.
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
                  disabled={settingsLoading || !newCodCode.trim()}
                  className="px-6 py-2.5 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 cursor-pointer"
                >
                  {settingsLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Settings</span>
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
