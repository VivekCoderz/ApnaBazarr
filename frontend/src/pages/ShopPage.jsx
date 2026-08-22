import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { Filter, SlidersHorizontal, X } from 'lucide-react';

export default function ShopPage({ products, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || 'All';

  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedGender, setSelectedGender] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [maxPrice, setMaxPrice] = useState(6000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(initialQuery);
  const [followersCount, setFollowersCount] = useState(250);

  const isWishlisted = (id) => wishlistItems.some(item => item.id === id);
  const isCartAdded = (id) => cartItems.some(item => item.id === id);

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
  const genders = ['All', 'Men', 'Women', 'Kids', 'Unisex'];

  const renderFilters = () => (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Categories</h4>
        <div className="space-y-1 text-xs max-h-56 overflow-y-auto pr-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0066cc] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Gender Collection Filter */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">Target Audience</h4>
        <div className="flex flex-wrap gap-1.5">
          {genders.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGender(g)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                selectedGender === g
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-400'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Price Slider */}
      <div className="border-t border-slate-100 pt-4 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-800 uppercase tracking-wider">Max Price</span>
          <span className="font-extrabold text-[#0066cc]">₹{maxPrice}</span>
        </div>
        <input
          type="range"
          min="300"
          max="6000"
          step="100"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#0066cc] cursor-pointer"
        />
      </div>
    </div>
  );

  const sellerId = searchParams.get('sellerId') || '';
  const sellerProductSample = products.find(p => p.seller && String(p.seller.id) === String(sellerId));
  const sellerInfo = sellerProductSample ? sellerProductSample.seller : null;

  useEffect(() => {
    if (sellerInfo) {
      document.title = `${sellerInfo.shopName} — Apna Bazarr`;
      // Generate realistic dynamic follower count
      const hash = sellerInfo.shopName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      setFollowersCount((hash % 380) + 120);
    } else if (initialQuery) {
      document.title = `Search: ${initialQuery} — Apna Bazarr`;
    } else {
      document.title = `Shop All Products — Apna Bazarr`;
    }
    return () => {
      document.title = `Apna Bazarr — Customize Style`;
    };
  }, [sellerInfo, initialQuery]);

  useEffect(() => {
    setLocalSearchQuery(initialQuery);
  }, [initialQuery]);

  const handleFollowToggle = () => {
    if (isFollowing) {
      setFollowersCount(prev => prev - 1);
    } else {
      setFollowersCount(prev => prev + 1);
    }
    setIsFollowing(!isFollowing);
  };

  // Filter products by seller scope if parameters exist
  const baseProducts = sellerId ? products.filter(p => p.seller && String(p.seller.id) === String(sellerId)) : products;

  // Filter products
  let filtered = baseProducts.filter(p => {
    const matchesQuery = localSearchQuery === '' || p.name.toLowerCase().includes(localSearchQuery.toLowerCase()) || p.category.toLowerCase().includes(localSearchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesGender = selectedGender === 'All' || p.gender === selectedGender;
    const matchesPrice = p.price <= maxPrice;
    return matchesQuery && matchesCategory && matchesGender && matchesPrice;
  });

  // Sort products
  if (sortBy === 'low-high') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'high-low') {
    filtered.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header Banner - Custom Seller Boutique vs Standard Breadcrumb */}
        {sellerInfo ? (
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-955 min-h-[260px] flex flex-col justify-end p-6 sm:p-8">
            {/* Dark glassmorphic background layer */}
            <div className="absolute inset-0 bg-black/45 z-1" />
            
            {sellerInfo.shopBanner ? (
              <img 
                src={sellerInfo.shopBanner} 
                alt={sellerInfo.shopName} 
                className="absolute inset-0 w-full h-full object-cover opacity-50 z-0" 
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-[#0a2342] via-slate-900 to-[#ff5e14]/25 opacity-90 z-0" />
            )}
            
            {/* Ambient background decoration */}
            <div className="absolute w-72 h-72 bg-[#ff5e14]/15 rounded-full blur-3xl -top-20 -right-20 pointer-events-none z-0" />
            <div className="absolute w-96 h-96 bg-[#0066cc]/10 rounded-full blur-3xl -bottom-32 -left-32 pointer-events-none z-0" />
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 w-full text-white">
              <div className="flex items-start space-x-5">
                {sellerInfo.shopLogo ? (
                  <img 
                    src={sellerInfo.shopLogo} 
                    alt="Logo" 
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-white bg-white shrink-0 shadow-2xl hidden sm:block animate-fade-in" 
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-white bg-gradient-to-tr from-[#ff5e14] to-orange-400 text-white flex items-center justify-center font-black text-2xl shrink-0 shadow-2xl hidden sm:block">
                    {sellerInfo.shopName ? sellerInfo.shopName[0] : 'S'}
                  </div>
                )}
                <div className="space-y-2.5">
                  <div className="flex items-center space-x-2 flex-wrap gap-2">
                    <span className="bg-[#ff5e14]/20 text-[#ff7d42] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#ff5e14]/30 flex items-center gap-1">
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                      Verified Boutique
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                      sellerInfo.isOpen 
                        ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40' 
                        : 'bg-red-500/25 text-red-300 border-red-500/40'
                    }`}>
                      {sellerInfo.isOpen ? '🟢 Open Now' : '🔴 Closed (Holiday)'}
                    </span>
                    <button 
                      onClick={handleFollowToggle}
                      className={`px-3.5 py-1 rounded-full text-[9.5px] font-black uppercase tracking-wider transition-all border cursor-pointer flex items-center gap-1.5 ${
                        isFollowing 
                          ? 'bg-rose-500/30 text-rose-200 border-rose-500/40 hover:bg-rose-500/40 shadow-xs'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                      }`}
                    >
                      {isFollowing ? '❤️ Following' : '🖤 Follow Store'}
                    </button>
                  </div>
                  <div className="flex items-center space-x-3">
                    {!sellerInfo.shopLogo && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#ff5e14] to-orange-400 text-white flex items-center justify-center font-black text-sm shrink-0 sm:hidden">
                        {sellerInfo.shopName ? sellerInfo.shopName[0] : 'S'}
                      </div>
                    )}
                    {sellerInfo.shopLogo && (
                      <img 
                        src={sellerInfo.shopLogo} 
                        alt="Logo" 
                        className="w-10 h-10 rounded-xl object-cover border border-white bg-white shrink-0 shadow-md sm:hidden" 
                      />
                    )}
                    <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md leading-none font-sans">
                      {sellerInfo.shopName}
                    </h1>
                  </div>
                  <p className="text-xs text-slate-200 max-w-xl font-medium leading-relaxed drop-shadow-sm">
                    {sellerInfo.shopDescription || "Welcome to our customized boutique. Experience high-quality items designed exclusively for you. Shop our products below."}
                  </p>
                  
                  {/* Policies display */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] text-slate-300 font-extrabold">
                    <span className="flex items-center gap-1">🛡️ Return: {sellerInfo.returnPolicy || '7 Days Return Policy'}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1">🚚 Shipping: {sellerInfo.deliveryInformation || 'Delivered in 3-5 business days.'}</span>
                    <span className="text-slate-500">•</span>
                    <span className="flex items-center gap-1 text-[#ff7d42]">👥 {followersCount} Followers</span>
                  </div>

                  {sellerInfo.isOpen === false && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl px-3 py-2 text-[10px] font-bold inline-block leading-normal">
                      ⚠️ Holiday Notice: This shop is currently closed. Ordering from this seller is temporarily disabled.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 border-t border-slate-800 pt-4 md:border-t-0 md:pt-0 text-[10px] text-slate-300">
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-xs flex flex-col justify-center">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Boutique Location</span>
                  <span className="font-extrabold text-slate-200 mt-0.5">{sellerInfo.shopAddress || 'Online Boutique'}</span>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 backdrop-blur-xs flex flex-col justify-center">
                  <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Helpline</span>
                  <a href={`tel:${sellerInfo.phone}`} className="font-extrabold text-slate-200 hover:text-white mt-0.5">{sellerInfo.phone || 'Contact Support'}</a>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Breadcrumb Header */
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {initialQuery ? `Search Results for "${initialQuery}"` : "Shop All Products"}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Showing {filtered.length} of {products.length} products available across India
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Mobile Filter Toggle Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg transition-colors text-xs font-bold cursor-pointer"
              >
                <Filter className="w-4 h-4 text-[#0066cc]" />
                <span>Filters</span>
                {(selectedCategory !== 'All' || selectedGender !== 'All' || maxPrice < 6000) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0066cc]" />
                <span className="text-xs font-bold text-slate-700">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#0066cc]"
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="low-high">Price: Low to High (₹)</option>
                  <option value="high-low">Price: High to Low (₹)</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Boutique Sub-header Bar (Only visible if viewing a boutique) */}
        {sellerInfo && (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Boutique Catalogue</span>
              <span className="bg-[#ff5e14]/10 text-[#ff5e14] text-[10px] font-black px-3 py-0.5 rounded-md">
                {filtered.length} Items Available
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Boutique Search */}
              <div className="relative flex-1 md:w-64 min-w-[200px]">
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  placeholder="Search in this store..."
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#ff5e14] focus:bg-white text-slate-700 font-semibold transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                </span>
                {localSearchQuery && (
                  <button 
                    onClick={() => setLocalSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center space-x-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg transition-colors text-xs font-bold cursor-pointer"
              >
                <Filter className="w-4 h-4 text-[#ff5e14]" />
                <span>Filters</span>
                {(selectedCategory !== 'All' || selectedGender !== 'All' || maxPrice < 6000) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                )}
              </button>

              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#ff5e14]" />
                <span className="text-xs font-bold text-slate-700">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-[#ff5e14]"
                >
                  <option value="featured">Featured First</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="low-high">Price: Low to High (₹)</option>
                  <option value="high-low">Price: High to Low (₹)</option>
                  <option value="rating">Top Customer Rated</option>
                </select>
              </div>

              {/* Reset to All Products Button */}
              <button
                onClick={() => {
                  window.location.href = '/shop';
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-slate-850 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                Exit Store
              </button>
            </div>
          </div>
        )}

        {/* Main Grid: Sidebar Filters + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Sidebar Filters (Desktop) */}
          <div className="hidden lg:block space-y-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs h-fit">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Filter className="w-4 h-4 text-[#0066cc]" />
              <h3 className="font-extrabold text-sm text-slate-900">Filter Products</h3>
            </div>
            {renderFilters()}
          </div>

          {/* Mobile Filter Drawer (Drawer) */}
          {isMobileFilterOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              {/* Backdrop */}
              <div 
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
                onClick={() => setIsMobileFilterOpen(false)}
              />
              {/* Drawer Container */}
              <div className="fixed inset-y-0 right-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col animate-slide-in p-6 space-y-6 overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4.5 h-4.5 text-[#0066cc]" />
                    <h3 className="font-extrabold text-sm text-slate-900 uppercase tracking-tight">Filter Products</h3>
                  </div>
                  <button 
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {renderFilters()}

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="w-full py-3 bg-[#0066cc] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-blue-700 transition-colors cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Right Product Cards Grid */}
          <div className="lg:col-span-3">
            {filtered.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-slate-500 text-sm font-semibold">No products found matching your current filter choices.</p>
                <button
                  onClick={() => { setSelectedCategory('All'); setSelectedGender('All'); setMaxPrice(6000); }}
                  className="px-4 py-2 bg-[#0066cc] text-white text-xs font-bold rounded-lg"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onQuickView={onQuickView}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={isWishlisted(product.id)}
                    isCartAdded={isCartAdded(product.id)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
