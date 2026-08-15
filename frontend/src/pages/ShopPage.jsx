import React, { useState } from 'react';
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

  // Filter products
  let filtered = products.filter(p => {
    const matchesQuery = initialQuery === '' || p.name.toLowerCase().includes(initialQuery.toLowerCase()) || p.category.toLowerCase().includes(initialQuery.toLowerCase());
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
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Breadcrumb Header */}
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
                <option value="low-high">Price: Low to High (₹)</option>
                <option value="high-low">Price: High to Low (₹)</option>
                <option value="rating">Top Customer Rated</option>
              </select>
            </div>
          </div>
        </div>

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
