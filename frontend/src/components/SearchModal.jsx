import React, { useState } from 'react';
import { Search, X, ShoppingBag } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, products, onQuickView, onAddToCart }) {
  if (!isOpen) return null;

  const [query, setQuery] = useState('');

  const filtered = query.trim() === '' 
    ? [] 
    : products.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase()) || 
        p.category.toLowerCase().includes(query.toLowerCase()) ||
        (p.gender && p.gender.toLowerCase().includes(query.toLowerCase()))
      );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 lg:p-8 flex items-start justify-center pt-20">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Search Box Card */}
      <div className="relative bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 animate-fade-in border border-slate-200">
        
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center space-x-3 bg-slate-50">
          <Search className="w-5 h-5 text-[#0066cc]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Men, Women, Kids, Backpacks, Earbuds, Sarees..."
            className="flex-1 bg-transparent text-slate-800 font-semibold placeholder-slate-400 text-sm focus:outline-none"
            autoFocus
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-3">
          {query.trim() === '' ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Search by product name, category, or gender (e.g. "Kids", "Saree", "Jeans", "Smartwatch")...
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No products found matching "<span className="font-bold text-slate-800">{query}</span>"
            </div>
          ) : (
            filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50/60 border border-slate-100 transition-colors group cursor-pointer"
                onClick={() => {
                  onClose();
                  onQuickView(item);
                }}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-100"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#0066cc] transition-colors">
                      {item.name}
                    </h4>
                    <span className="text-[11px] text-slate-400">{item.category} • {item.gender}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-xs font-extrabold text-slate-900">
                    ₹{item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddToCart(item);
                    }}
                    className="p-2 bg-[#0066cc] text-white rounded-lg hover:bg-blue-700 transition-colors"
                    title="Add to Cart"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
