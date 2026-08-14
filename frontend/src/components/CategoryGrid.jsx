import React from 'react';
import { ChevronRight, Sparkles } from 'lucide-react';

export default function CategoryGrid({ onSelectCategory }) {
  return (
    <section className="py-8 md:py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* DESKTOP VIEW: Asymmetric Responsive Grid */}
        <div className="hidden md:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
          
          {/* Left Large Banner (5 cols on Desktop) */}
          <div className="lg:col-span-5 relative group overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 to-rose-950 p-8 min-h-[440px] flex flex-col justify-between shadow-md hover:shadow-xl transition-shadow text-white">
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
              alt="Sister's Ethnic Wear Gifts"
              className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950 via-rose-950/80 to-transparent" />
            <div className="relative z-10 space-y-3 max-w-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-300 bg-rose-900/80 border border-amber-300/40 px-3 py-1 rounded-full inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Rakhi Gift Specials</span>
              </span>
              <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight">
                Sister's Ethnic Gifts
              </h3>
              <p className="text-lg font-bold text-amber-300">
                Up to <span className="text-white font-extrabold">70% Off</span>
              </p>
            </div>
            <div className="relative z-10 pt-4">
              <button
                onClick={() => onSelectCategory("Women's Wear")}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Shop Sister Gifts
              </button>
            </div>
          </div>

          {/* Right Column Cards (7 cols on Desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Top Row: Two Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Gold Clutch & Handbag Card */}
              <div className="relative group overflow-hidden rounded-3xl bg-[#eaddca] p-6 min-h-[200px] flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
                <img
                  src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
                  alt="Gold Clutches & Handbags"
                  className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-amber-50/75 to-transparent" />
                <div className="relative z-10 space-y-1">
                  <span className="bg-rose-700 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase">
                    25% OFF
                  </span>
                  <h4 className="text-xl font-extrabold text-slate-900">
                    Festive Clutches & Bags
                  </h4>
                </div>
                <div className="relative z-10 pt-4">
                  <button
                    onClick={() => onSelectCategory("Handbags & Bags")}
                    className="text-xs font-black text-slate-900 group-hover:text-rose-700 flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>Shop Clutches</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Rakhi Luxury Hampers & Watches */}
              <div className="relative group overflow-hidden rounded-3xl bg-slate-900 p-6 min-h-[200px] flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow text-white">
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
                  alt="Rakhi Hampers & Watches"
                  className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700 opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
                <div className="relative z-10 space-y-1">
                  <span className="bg-amber-500 text-slate-950 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full inline-block uppercase">
                    45% OFF
                  </span>
                  <h4 className="text-xl font-extrabold text-white">
                    Rakhi Gift Hampers
                  </h4>
                </div>
                <div className="relative z-10 pt-4">
                  <button
                    onClick={() => onSelectCategory("Rakhi Specials")}
                    className="text-xs font-black text-amber-300 group-hover:text-white flex items-center space-x-1 transition-colors cursor-pointer"
                  >
                    <span>Shop Hampers</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom Row: Brother's Kurta & Footwear Card */}
            <div className="relative group overflow-hidden rounded-3xl bg-amber-900 p-6 sm:p-8 min-h-[208px] flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow text-white">
              <img
                src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80"
                alt="Brother's Kurta & Accessories"
                className="absolute inset-0 w-full h-full object-cover object-right group-hover:scale-105 transition-transform duration-700 opacity-85"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-950/80 to-transparent" />
              <div className="relative z-10 space-y-1 text-white max-w-sm">
                <span className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                  Brother's Festive Look
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Kurtas & Leather Footwear
                </h3>
                <p className="text-sm font-medium text-amber-200">
                  Min. <span className="text-amber-400 font-extrabold">40–80% Off</span>
                </p>
              </div>
              <div className="relative z-10 pt-4">
                <button
                  onClick={() => onSelectCategory("Men's Fashion")}
                  className="text-xs font-black text-amber-300 group-hover:text-amber-400 flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>Shop Brother's Kurtas</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* MOBILE VIEW: Horizontal Scrolling Scrollway */}
        <div className="flex md:hidden overflow-x-auto space-x-4 pb-4 snap-x snap-mandatory scrollbar-none scroll-smooth">
          
          {/* Card 1: Sister's Ethnic Wear Gifts */}
          <div className="w-[280px] shrink-0 snap-start relative group overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900 to-rose-950 p-6 min-h-[340px] flex flex-col justify-between shadow-md text-white">
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80"
              alt="Sister's Ethnic Wear Gifts"
              className="absolute inset-0 w-full h-full object-cover object-center opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950 via-rose-950/80 to-transparent" />
            <div className="relative z-10 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-rose-900/85 border border-amber-300/40 px-2.5 py-0.5 rounded-full inline-flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>Rakhi Gift Specials</span>
              </span>
              <h3 className="text-2xl font-black text-white leading-tight">
                Sister's Ethnic Gifts
              </h3>
              <p className="text-base font-bold text-amber-300">
                Up to <span className="text-white font-extrabold">70% Off</span>
              </p>
            </div>
            <div className="relative z-10 pt-4">
              <button
                onClick={() => onSelectCategory("Women's Wear")}
                className="px-4 py-2.5 bg-amber-400 text-slate-955 text-xs font-black uppercase tracking-wider rounded-xl shadow-xs cursor-pointer"
              >
                Shop Sister Gifts
              </button>
            </div>
          </div>

          {/* Card 2: Festive Clutches & Bags */}
          <div className="w-[280px] shrink-0 snap-start relative group overflow-hidden rounded-3xl bg-[#eaddca] p-6 min-h-[340px] flex flex-col justify-between shadow-xs">
            <img
              src="https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=600&q=80"
              alt="Gold Clutches & Handbags"
              className="absolute inset-0 w-full h-full object-cover object-right"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-50/95 via-amber-50/75 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="bg-rose-700 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full inline-block uppercase">
                25% OFF
              </span>
              <h4 className="text-xl font-extrabold text-slate-900">
                Festive Clutches & Bags
              </h4>
            </div>
            <div className="relative z-10 pt-4">
              <button
                onClick={() => onSelectCategory("Handbags & Bags")}
                className="text-xs font-black text-slate-900 flex items-center space-x-1 cursor-pointer"
              >
                <span>Shop Clutches</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Rakhi Gift Hampers */}
          <div className="w-[280px] shrink-0 snap-start relative group overflow-hidden rounded-3xl bg-slate-900 p-6 min-h-[340px] flex flex-col justify-between shadow-xs text-white">
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
              alt="Rakhi Hampers & Watches"
              className="absolute inset-0 w-full h-full object-cover object-right opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
            <div className="relative z-10 space-y-1">
              <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2 py-0.5 rounded-full inline-block uppercase">
                45% OFF
              </span>
              <h4 className="text-xl font-extrabold text-white">
                Rakhi Gift Hampers
              </h4>
            </div>
            <div className="relative z-10 pt-4">
              <button
                onClick={() => onSelectCategory("Rakhi Specials")}
                className="text-xs font-black text-amber-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>Shop Hampers</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Kurtas & Leather Footwear */}
          <div className="w-[280px] shrink-0 snap-start relative group overflow-hidden rounded-3xl bg-amber-900 p-6 min-h-[340px] flex flex-col justify-between shadow-xs text-white">
            <img
              src="https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=800&q=80"
              alt="Brother's Kurta & Accessories"
              className="absolute inset-0 w-full h-full object-cover object-right opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-950/80 to-transparent" />
            <div className="relative z-10 space-y-1 text-white max-w-[200px]">
              <span className="text-amber-300 font-bold text-[10px] uppercase tracking-wider">
                Brother's Festive Look
              </span>
              <h3 className="text-xl font-extrabold text-white leading-tight">
                Kurtas & Footwear
              </h3>
              <p className="text-xs font-medium text-amber-200">
                Min. <span className="text-amber-400 font-extrabold">40–80% Off</span>
              </p>
            </div>
            <div className="relative z-10 pt-4">
              <button
                onClick={() => onSelectCategory("Men's Fashion")}
                className="text-xs font-black text-amber-300 flex items-center space-x-1 cursor-pointer"
              >
                <span>Shop Kurtas</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
