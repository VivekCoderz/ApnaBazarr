import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function RecentlyViewed({ items, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  if (!items || items.length === 0) return null;

  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-6 md:py-10 bg-slate-50 border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        
        {/* Header & Scroll Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-[#0066cc]" />
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Recently Viewed Products</h3>
            <span className="bg-blue-100 text-[#0066cc] font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {items.length}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 shadow-xs transition-colors"
              title="Scroll Left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-full border border-slate-200 shadow-xs transition-colors"
              title="Scroll Right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Scroll Container */}
        <div
          ref={scrollRef}
          className="flex space-x-5 overflow-x-auto scrollbar-none py-2 px-1 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {items.map((product) => (
            <div
              key={product.id}
              className="w-[200px] sm:w-64 shrink-0 snap-start"
            >
              <ProductCard
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistItems.some(i => i.id === product.id)}
                isCartAdded={cartItems.some(i => i.id === product.id)}
              />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
