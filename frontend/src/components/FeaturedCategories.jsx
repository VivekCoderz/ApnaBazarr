import React from 'react';

export default function FeaturedCategories({ products = [], onSelectCategory }) {
  // Dynamically extract unique categories, group product counts, and use the first product's image
  const categoriesMap = products.reduce((acc, p) => {
    if (!p.category) return acc;
    const catName = p.category.trim();
    if (!acc[catName]) {
      acc[catName] = {
        name: catName,
        image: p.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80",
        itemsCount: 0
      };
    }
    acc[catName].itemsCount += 1;
    return acc;
  }, {});

  const dynamicCategories = Object.values(categoriesMap);

  if (dynamicCategories.length === 0) return null;

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
          {dynamicCategories.map((cat, idx) => (
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
                {cat.itemsCount} {cat.itemsCount === 1 ? 'Product' : 'Products'}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
