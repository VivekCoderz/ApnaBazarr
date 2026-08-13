import React from 'react';
import HeroBanner from '../components/HeroBanner';
import FeatureBadges from '../components/FeatureBadges';
import CategoryGrid from '../components/CategoryGrid';
import FeaturedProducts from '../components/FeaturedProducts';
import PromoBanners from '../components/PromoBanners';
import FeaturedCategories from '../components/FeaturedCategories';
import RecentlyViewed from '../components/RecentlyViewed';
import FeedbackForm from '../components/FeedbackForm';

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
  return (
    <div className="space-y-4">
      {/* Main Top Hero Banner Carousel (3-sec auto scroll) */}
      <HeroBanner />

      {/* 4 Service Badges */}
      <FeatureBadges />

      {/* Asymmetric Promo Grid */}
      <CategoryGrid onSelectCategory={onSelectCategory} />

      {/* Tabbed Product Grid */}
      <FeaturedProducts
        products={products}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onToggleWishlist={onToggleWishlist}
        wishlistItems={wishlistItems}
        cartItems={cartItems}
      />

      {/* Mid-Page Promo Banners */}
      <PromoBanners onSelectCategory={onSelectCategory} />

      {/* Featured Categories Carousel Showcase */}
      <FeaturedCategories onSelectCategory={onSelectCategory} />

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

      {/* Customer Feedback Form */}
      <section className="py-12 bg-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FeedbackForm onSubmitFeedback={onSubmitFeedback} currentUser={currentUser} />
        </div>
      </section>
    </div>
  );
}
