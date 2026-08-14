import React, { useState } from 'react';
import ProductCard from './ProductCard';

export default function FeaturedProducts({ products, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  const [activeTab, setActiveTab] = useState('New Arrival');

  const tabs = ['New Arrival', 'Best Selling', 'Top Rated'];

  // Filter products based on selected tab
  const filteredProducts = products.filter(p => p.tags && p.tags.includes(activeTab));

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
          <div className="w-12 h-1 bg-[#0066cc] rounded-full" />

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 sm:space-x-8 pt-2 border-b border-slate-200">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs sm:text-sm font-bold tracking-wide transition-all relative ${
                  activeTab === tab
                    ? 'text-[#0066cc]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>{tab}</span>
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0066cc] animate-fade-in" />
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
