import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MessageCircle } from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import FeaturedCategories from '../components/FeaturedCategories';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';
import { whatsappUrl } from '../config/store';

const RAIL_SIZE = 8;

// Website plan §3.8 (return answer per the founder's return policy)
const FAQS = [
  {
    q: 'Kya Cash on Delivery hai?',
    a: 'Haan. Saman ghar aane par paise dein. Order ke baad hum WhatsApp pe confirm karte hain.'
  },
  {
    q: 'Delivery kab tak hogi?',
    a: 'Order ke 2 din mein Panipat se dispatch. Haryana/Delhi 2–4 din, baaki India 4–8 din.'
  },
  {
    q: 'Return ho sakta hai?',
    a: 'Haan, delivery ke 7 din tak. Kharab, galat ya size ki problem — WhatsApp karein. Pickup hum karwayenge. Mann badal gaya to sirf exchange.'
  },
  {
    q: 'Free delivery kab milti hai?',
    a: '₹499 ya usse zyada ke order par. Usse kam par ₹49.'
  },
  {
    q: 'Aap kaun hain?',
    a: 'Panipat ke log, Panipat ka maal. Phone/WhatsApp: +91 93068 10726.'
  }
];

export default function HomePage({
  products = [],
  recentlyViewed = [],
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  wishlistItems = [],
  cartItems = [],
  onSelectCategory
}) {
  // Call items "bestsellers" only once there are real sales; until then show the newest
  const totalSales = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
  const showBestsellers = totalSales >= 5;
  const railProducts = showBestsellers
    ? [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, RAIL_SIZE)
    : products.slice(0, RAIL_SIZE); // API returns newest first

  return (
    <div>
      <HeroBanner products={products} />

      <FeaturedCategories products={products} onSelectCategory={onSelectCategory} />

      {/* Product rail */}
      {railProducts.length > 0 && (
        <section className="py-6 sm:py-10 bg-brand-cream">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between gap-3 mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-brand-navy">
                {showBestsellers ? 'Sabse Zyada Bikne Wale' : 'Naye Products'}
              </h2>
              <Link to="/shop" className="text-sm font-semibold text-brand-navy hover:text-brand-cta shrink-0">
                Sab dekhein →
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {railProducts.map((product) => (
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

            <div className="flex justify-center mt-6">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-brand-navy text-brand-navy font-semibold text-sm rounded-xl hover:bg-brand-navy hover:text-white transition-colors"
              >
                <span>Sab Products Dekhein</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

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
              Ghar baithe kamaayein — Apna Bazarr Reseller baniye
            </h2>
            <p className="text-sm sm:text-base text-blue-100">
              Product WhatsApp pe share karein. Har order pe commission seedha UPI mein. Joining free.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 shrink-0">
            <Link
              to="/reseller"
              className="inline-flex items-center justify-center px-6 py-3 bg-brand-cta hover:bg-brand-cta-hover text-white font-semibold rounded-xl transition-colors"
            >
              Reseller Baniye
            </Link>
            <a
              href={whatsappUrl('Namaste Apna Bazarr, mujhe reseller banne ke baare mein jaankari chahiye.')}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-white underline underline-offset-4 decoration-brand-orange"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Pehle baat karein</span>
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-8 sm:py-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-4">Aapke sawal</h2>
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
            Apna Bazarr Panipat, Haryana se blankets, bedsheets, cushion covers aur women's suit sets
            seedha factory daam pe bhejta hai. Panipat India ka "City of Weavers" hai — hum wahi se maal
            uthate hain, check karke pack karte hain. Poore India mein Cash on Delivery aur ₹499 se upar
            free delivery.
          </p>
        </div>
      </section>
    </div>
  );
}
