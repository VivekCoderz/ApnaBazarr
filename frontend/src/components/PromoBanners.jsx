import React from 'react';
import { ChevronRight, Gift, Sparkles } from 'lucide-react';

export default function PromoBanners({ onSelectCategory }) {
  return (
    <section className="py-10 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Banner 1: Rakhi Sweets & Silver Kundan Hampers (Matching Photo 3) */}
          <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 p-6 sm:p-8 min-h-[220px] flex items-center justify-between shadow-md hover:shadow-xl transition-shadow text-white border border-amber-800/40">
            <div className="relative z-10 space-y-2 max-w-xs">
              <div className="inline-flex items-center space-x-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-extrabold px-3 py-0.5 rounded-full">
                <Gift className="w-3 h-3 text-amber-400" />
                <span>Rakhi Sweets & Silver Hampers 🪔</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Kundan Rakhi & Sweets Combo
              </h3>
              <p className="text-sm font-extrabold text-amber-400">
                Flat 60% Off + Free Roli-Chawal Kit
              </p>
              <button
                onClick={() => onSelectCategory("Rakhi Specials")}
                className="pt-2 text-xs font-black text-amber-300 group-hover:text-white flex items-center space-x-1 transition-colors"
              >
                <span>Shop Rakhi Combos</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <img
              src="https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=600&q=80"
              alt="Rakhi Sweets & Silver Hampers"
              className="absolute right-0 bottom-0 w-1/2 h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-amber-950 via-amber-950/85 to-transparent" />
          </div>

          {/* Banner 2: Brother & Sister Festive Wear (Matching Photo 1 & 2) */}
          <div className="relative group overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 p-6 sm:p-8 min-h-[220px] flex items-center justify-between shadow-md hover:shadow-xl transition-shadow text-white border border-rose-800/40">
            <div className="relative z-10 space-y-2 max-w-xs">
              <div className="inline-flex items-center space-x-1 bg-rose-500/20 border border-rose-400/40 text-rose-300 text-[11px] font-extrabold px-3 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-rose-300" />
                <span>Festive Wear Sale 🥻</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                Bhaiya & Sister Festive Apparel
              </h3>
              <p className="text-sm font-extrabold text-amber-300">
                Min. 35–70% Off Across Kurtas & Sarees
              </p>
              <button
                onClick={() => onSelectCategory("Dresses & Tops")}
                className="pt-2 text-xs font-black text-rose-300 group-hover:text-white flex items-center space-x-1 transition-colors"
              >
                <span>Shop Festive Apparel</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80"
              alt="Brother & Sister Festive Apparel"
              className="absolute right-0 bottom-0 w-1/2 h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-rose-950 via-rose-950/85 to-transparent" />
          </div>

        </div>
      </div>
    </section>
  );
}
