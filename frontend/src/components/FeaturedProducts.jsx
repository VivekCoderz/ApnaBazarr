import React, { useState } from 'react';
import ProductCard from './ProductCard';

export default function FeaturedProducts({ products, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  const [activeTab, setActiveTab] = useState('New Arrival');

  const tabs = ['New Arrival', 'Best Selling', 'Top Rated'];

  // Filter products based on selected tab
  let filteredProducts = [];
  if (activeTab === 'New Arrival') {
    // Sort by creation date descending
    filteredProducts = [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 10);
  } else if (activeTab === 'Best Selling') {
    // Sort by reviewsCount descending, fallback to price ascending (cheaper items sell more)
    filteredProducts = [...products]
      .sort((a, b) => {
        const revDiff = (b.reviewsCount || 0) - (a.reviewsCount || 0);
        if (revDiff !== 0) return revDiff;
        return (a.price || 0) - (b.price || 0);
      })
      .slice(0, 10);
  } else if (activeTab === 'Top Rated') {
    // Sort by rating descending, fallback to price descending (premium top-rated items)
    filteredProducts = [...products]
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.price || 0) - (a.price || 0);
      })
      .slice(0, 10);
  }

  const isWishlisted = (id) => wishlistItems.some(item => item.id === id);
  const isCartAdded = (id) => cartItems.some(item => item.id === id);

  return (
    <section id="featured" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col items-center text-center space-y-4 mb-10">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Featured Products
          </h2>
          <div className="w-12 h-1 bg-brand-navy rounded-full" />

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-8 pt-2 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition-all relative ${
                  activeTab === tab
                    ? 'text-brand-navy'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-navy animate-fade-in" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 5-Column Responsive Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
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

      </div>
    </section>
  );
}
