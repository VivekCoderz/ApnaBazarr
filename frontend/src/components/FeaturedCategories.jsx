import React from 'react';

import { CATEGORIES } from '../config/store';

// Fixed shop order (website plan §6.2); categories not in the list are shown after these.
const CATEGORY_ORDER = CATEGORIES;

export default function FeaturedCategories({ products = [], onSelectCategory }) {
  // Only categories with at least one live product; image = first product's photo
  const firstImage = {};
  products.forEach(p => {
    const cat = p.category?.trim();
    if (cat && !firstImage[cat]) firstImage[cat] = p.image;
  });

  const known = CATEGORY_ORDER.filter(c => firstImage[c.name]);
  const others = Object.keys(firstImage)
    .filter(name => !CATEGORY_ORDER.some(c => c.name === name))
    .map(name => ({ name, label: name }));
  const categories = [...known, ...others].map(c => ({ ...c, image: firstImage[c.name] }));

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="py-6 sm:py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl sm:text-2xl font-bold text-brand-navy mb-4">
          Shop by Category
        </h2>

        <div className="flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-6 lg:overflow-visible">
          {categories.map((cat) => (
            <button
              key={cat.name}
              type="button"
              onClick={() => onSelectCategory(cat.name)}
              className="group snap-start shrink-0 w-20 sm:w-24 lg:w-auto flex flex-col items-center text-center cursor-pointer"
            >
              <span className="w-[72px] h-[72px] sm:w-20 sm:h-20 rounded-full overflow-hidden bg-brand-peach ring-2 ring-brand-peach group-hover:ring-brand-orange transition-all">
                <img
                  src={cat.image}
                  alt={cat.label}
                  width="80"
                  height="80"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </span>
              <span className="mt-2 text-xs sm:text-sm font-semibold text-[#1A2233] leading-tight group-hover:text-brand-navy">
                {cat.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
