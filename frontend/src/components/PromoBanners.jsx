import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Gift, Star } from 'lucide-react';

export default function PromoBanners({ products = [] }) {
  const navigate = useNavigate();

  // Find best selling product (actual salesCount desc, fallback to reviewsCount desc)
  const topSelling = [...products]
    .sort((a, b) => {
      const salesDiff = (b.salesCount || 0) - (a.salesCount || 0);
      if (salesDiff !== 0) return salesDiff;
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    })[0];

  // Find top rated product (rating desc, fallback to reviewsCount desc)
  const topRated = [...products]
    .sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reviewsCount || 0) - (a.reviewsCount || 0);
    })[0];

  if (!topSelling || !topRated) return null;

  return (
    <section className="py-12 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Banner 1: Top Selling Product */}
          <div 
            onClick={() => navigate(`/product/${topSelling.id}`)}
            className="relative group overflow-hidden rounded-3xl bg-[#111622] p-6 sm:p-8 min-h-[220px] flex items-center justify-between border border-amber-500/10 shadow-lg hover:shadow-amber-500/5 hover:border-amber-500/35 transition-all duration-300 cursor-pointer"
          >
            {/* Background ambient gold glow */}
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

            <div className="relative z-10 space-y-3 max-w-[55%] flex flex-col justify-center">
              <div>
                <span className="inline-flex items-center space-x-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase">
                  <Gift className="w-3.5 h-3.5" />
                  <span>🏆 Best Seller</span>
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 leading-snug line-clamp-2">
                {topSelling.name}
              </h3>
              
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                <span className="text-amber-400 text-sm font-extrabold">₹{topSelling.price.toFixed(2)}</span>
                {topSelling.salesCount > 0 ? (
                  <span className="ml-2 font-medium">| {topSelling.salesCount} items sold</span>
                ) : (
                  <span className="ml-2 font-medium">| Best Seller Choice</span>
                )}
              </p>

              <div>
                <button className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer space-x-1">
                  <span>Buy Top Seller</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Framed Image Container */}
            <div className="absolute right-4 top-4 bottom-4 w-[38%] overflow-hidden rounded-2xl shadow-md border border-slate-700/40 bg-slate-900">
              <img
                src={topSelling.image}
                alt={topSelling.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

          {/* Banner 2: Top Rated Product */}
          <div 
            onClick={() => navigate(`/product/${topRated.id}`)}
            className="relative group overflow-hidden rounded-3xl bg-[#0b101b] p-6 sm:p-8 min-h-[220px] flex items-center justify-between border border-emerald-500/10 shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-500/35 transition-all duration-300 cursor-pointer"
          >
            {/* Background ambient emerald glow */}
            <div className="absolute -left-12 -top-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

            <div className="relative z-10 space-y-3 max-w-[55%] flex flex-col justify-center">
              <div>
                <span className="inline-flex items-center space-x-1.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black tracking-wider px-2.5 py-1 rounded-full uppercase">
                  <Star className="w-3.5 h-3.5 fill-emerald-400 text-emerald-400" />
                  <span>⭐ Top Rated</span>
                </span>
              </div>
              
              <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 leading-snug line-clamp-2">
                {topRated.name}
              </h3>
              
              <p className="text-xs sm:text-sm font-bold text-slate-400">
                <span className="text-emerald-400 text-sm font-extrabold">₹{topRated.price.toFixed(2)}</span>
                <span className="ml-2 font-medium">| {topRated.rating.toFixed(1)} Stars rating</span>
              </p>

              <div>
                <button className="inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-colors cursor-pointer space-x-1">
                  <span>View Top Rated</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Framed Image Container */}
            <div className="absolute right-4 top-4 bottom-4 w-[38%] overflow-hidden rounded-2xl shadow-md border border-slate-700/40 bg-slate-900">
              <img
                src={topRated.image}
                alt={topRated.name}
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
