import React, { useState, useEffect, useRef } from 'react';
import HeroBanner from '../components/HeroBanner';
import PromoBanners from '../components/PromoBanners';
import FeaturedCategories from '../components/FeaturedCategories';
import RecentlyViewed from '../components/RecentlyViewed';
import FeedbackForm from '../components/FeedbackForm';
import ProductCard from '../components/ProductCard';

export default function HomePage({
  products = [],
  recentlyViewed = [],
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  wishlistItems = [],
  cartItems = [],
  onSelectCategory,
  onSubmitFeedback,
  currentUser
}) {
  const [activeTab, setActiveTab] = useState('New Arrival');
  const [visibleCount, setVisibleCount] = useState(5);
  const [isLoading, setIsLoading] = useState(false);

  // Filter & sort products based on selected tab
  let sortedProducts = [];
  if (activeTab === 'New Arrival') {
    // Sort by creation date descending
    sortedProducts = [...products]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else if (activeTab === 'Best Selling') {
    // Sort by reviewsCount descending, fallback to price ascending (cheaper items sell more)
    sortedProducts = [...products]
      .sort((a, b) => {
        const revDiff = (b.reviewsCount || 0) - (a.reviewsCount || 0);
        if (revDiff !== 0) return revDiff;
        return (a.price || 0) - (b.price || 0);
      });
  } else if (activeTab === 'Top Rated') {
    // Sort by rating descending, fallback to price descending (premium top-rated items)
    sortedProducts = [...products]
      .sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.price || 0) - (a.price || 0);
      });
  }

  const sentinelRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && visibleCount < sortedProducts.length) {
          setIsLoading(true);
          // Show a nice dynamic spinner for 500ms before loading products
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 5, sortedProducts.length));
            setIsLoading(false);
          }, 500);
        }
      },
      {
        rootMargin: '400px', // trigger 400px before reaching the sentinel
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [sortedProducts.length, visibleCount, isLoading]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setVisibleCount(5);
  };

  return (
    <div className="space-y-4">
      {/* Main Top Hero Banner Carousel (3-sec auto scroll) */}
      <HeroBanner />

      {/* Recently Viewed Products Section */}
      {recentlyViewed.length > 0 && (
        <RecentlyViewed
          items={recentlyViewed}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onToggleWishlist={onToggleWishlist}
          wishlistItems={wishlistItems}
          cartItems={cartItems}
        />
      )}

      {/* Merged Explore Collection with Tab Filters & Infinite Scroll */}
      <section id="explore-collection" className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Dropdown Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10 pb-4 border-b border-slate-200">
            <div className="text-left">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Explore Our Collection
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                Scroll down to discover more amazing products
              </p>
            </div>
            
            {/* Filter Dropdown */}
            <div className="flex items-center space-x-2 shrink-0">
              <span className="text-xs font-bold text-slate-500">Sort By:</span>
              <select
                value={activeTab}
                onChange={(e) => handleTabChange(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 rounded-xl shadow-xs outline-none focus:border-[#0066cc] cursor-pointer"
              >
                <option value="New Arrival">🆕 New Arrival</option>
                <option value="Best Selling">🔥 Best Selling</option>
                <option value="Top Rated">⭐ Top Rated</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-6">
            {sortedProducts.slice(0, visibleCount).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onQuickView={onQuickView}
                onToggleWishlist={onToggleWishlist}
                isWishlisted={wishlistItems.some(item => item.id === product.id)}
                isCartAdded={cartItems.some(item => item.id === product.id)}
              />
            ))}
          </div>

          {/* Sentinel for Intersection Observer */}
          <div ref={sentinelRef} className="h-2 w-full mt-4" />

          {/* Loading Indicator Spinner */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center space-y-2 mt-8">
              <div className="w-8 h-8 border-4 border-[#0066cc] border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-extrabold">Loading more products...</p>
            </div>
          )}

          {/* Load More Button for Backup click */}
          {!isLoading && visibleCount < sortedProducts.length && (
            <div className="flex justify-center mt-10">
              <button
                onClick={() => {
                  setIsLoading(true);
                  setTimeout(() => {
                    setVisibleCount(prev => Math.min(prev + 5, sortedProducts.length));
                    setIsLoading(false);
                  }, 500);
                }}
                className="px-6 py-3 bg-[#0066cc] hover:bg-blue-700 text-white text-xs font-bold rounded-2xl shadow-md transition-colors cursor-pointer"
              >
                Load More Products
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Mid-Page Promo Banners */}
      <PromoBanners products={products} />

      {/* Featured Categories Carousel Showcase */}
      <FeaturedCategories products={products} onSelectCategory={onSelectCategory} />

      {/* Customer Feedback Form */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeedbackForm onSubmitFeedback={onSubmitFeedback} currentUser={currentUser} />
        </div>
      </section>
    </div>
  );
}
