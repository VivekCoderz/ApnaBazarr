import React from 'react';

const CATEGORIES = [
  { name: "Backpacks", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=300&q=80", itemsCount: 10 },
  { name: "Jackets", image: "https://images.unsplash.com/photo-1520975954732-35dd22299614?auto=format&fit=crop&w=300&q=80", itemsCount: 15 },
  { name: "Footwear", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=300&q=80", itemsCount: 20 },
  { name: "Dresses & Tops", image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=300&q=80", itemsCount: 12 },
  { name: "Handbags & Bags", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=300&q=80", itemsCount: 8 },
  { name: "Watches & Smartwear", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80", itemsCount: 14 }
];

export default function FeaturedCategories({ onSelectCategory }) {
  return (
    <section id="categories" className="py-16 bg-slate-50 border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Featured Categories
          </h2>
          <p className="text-slate-500 text-sm">
            Browse our wide selection of top premium fashion categories
          </p>
          <div className="w-12 h-1 bg-[#0066cc] rounded-full mx-auto mt-3" />
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {CATEGORIES.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onSelectCategory(cat.name)}
              className="group bg-white rounded-xl p-4 text-center cursor-pointer border border-slate-200/80 custom-card-shadow transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-20 h-20 mx-auto rounded-full overflow-hidden mb-3 bg-slate-100 ring-2 ring-blue-50 group-hover:ring-[#0066cc] transition-all">
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#0066cc] transition-colors truncate">
                {cat.name}
              </h4>
              <span className="text-[11px] text-slate-400 font-semibold mt-0.5 block">
                {cat.itemsCount} Products
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
