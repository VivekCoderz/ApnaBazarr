import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, MessageCircle } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import FeaturedCategories from '../components/FeaturedCategories';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductSkeleton';
import { whatsappUrl } from '../config/store';
import { getActiveCampaign, sortForHomeGrid } from '../config/campaign';

const PAGE_SIZE = 12;

// Website plan §3.8, in English (return answer per the founder's return policy)
const FAQS = [
  {
    q: 'Do you offer cash on delivery?',
    a: 'Yes. Pay when your order arrives. After you order, we confirm it with you on WhatsApp.'
  },
  {
    q: 'How long does delivery take?',
    a: 'We dispatch from Panipat within 2 days. Delivery takes 2–4 days in Haryana and Delhi, and 4–8 days to the rest of India.'
  },
  {
    q: 'Can I return an item?',
    a: 'Yes, within 7 days of delivery if it is damaged, wrong or the wrong size. Message us on WhatsApp and we will arrange a free pickup. If you simply changed your mind, we offer an exchange.'
  },
  {
    q: 'When is delivery free?',
    a: 'On orders of ₹499 or more. Below that, delivery is ₹49.'
  },
  {
    q: 'Who are you?',
    a: 'We are from Panipat, and so are our products. Phone/WhatsApp: +91 93068 10726.'
  }
];

export default function HomePage({
  products = [],
  loading = false,
  recentlyViewed = [],
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  wishlistItems = [],
  cartItems = [],
  onSelectCategory
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const campaign = getActiveCampaign();
  const gridTitle = campaign.gridTitle || 'All Products';
  const gridProducts = sortForHomeGrid(campaign, products);
  const visibleProducts = gridProducts.slice(0, visibleCount);
  const remaining = gridProducts.length - visibleProducts.length;

  return (
    <div>
      <HeroBanner products={products} loading={loading} />

      <FeaturedCategories products={products} onSelectCategory={onSelectCategory} />

      {/* All live products, 12 at a time */}
      <section className="py-6 sm:py-10 bg-brand-cream" aria-labelledby="home-grid-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 id="home-grid-title" className="text-xl sm:text-2xl font-bold text-brand-navy">
              {gridTitle}
            </h2>
            {gridProducts.length > 0 && (
              <span className="text-sm text-slate-500 shrink-0">{gridProducts.length} products</span>
            )}
          </div>

          {loading && products.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : gridProducts.length === 0 ? (
            <p className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-600">
              We couldn't load products right now. Please refresh the page in a minute.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                {visibleProducts.map((product) => (
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

              {remaining > 0 && (
                <div className="flex justify-center mt-6">
                  <button
                    type="button"
                    onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                    className="px-6 py-3 border-2 border-brand-navy text-brand-navy font-semibold text-sm rounded-xl hover:bg-brand-navy hover:text-white transition-colors"
                  >
                    Load more ({remaining} more)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Recently viewed: only when there is something worth showing */}
      {recentlyViewed.length >= 2 && (
        <RecentlyViewed
          items={recentlyViewed}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onToggleWishlist={onToggleWishlist}
          wishlistItems={wishlistItems}
          cartItems={cartItems}
        />
      )}

      {/* Reseller band */}
      <section className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <h2 className="text-xl sm:text-3xl font-bold leading-tight">
              Earn from home as an Apna Bazarr reseller
            </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Share our products on WhatsApp and earn a commission on every order, paid to your UPI. Joining is free.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <Link
              to="/reseller"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold rounded-xl transition-colors"
            >
              Become a reseller
            </Link>
            <a
              href={whatsappUrl('Hello Apna Bazarr, I would like to know more about becoming a reseller.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white underline underline-offset-4 decoration-brand-orange"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Chat with us first</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-4">Frequently asked questions</h2>
          <div className="divide-y divide-slate-200 border-y border-slate-200">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group py-3">
                <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-base font-semibold text-[#1A2233]">
                  <span>{q}</span>
                  <ChevronDown className="w-5 h-5 text-brand-navy shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="pt-2 text-sm sm:text-base text-slate-600 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>

          <p className="mt-6 text-xs sm:text-sm text-slate-500 leading-relaxed">
            Apna Bazarr sends blankets, bedsheets, cushion covers and women's suit sets from Panipat,
            Haryana at factory prices. Panipat is known as India's "City of Weavers" — we source there,
            check every piece and pack it ourselves. Cash on delivery across India, and free delivery on
            orders above ₹499.
          </p>
        </div>
      </section>
    </div>
  );
}
