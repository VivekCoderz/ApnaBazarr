import React from 'react';

// Grey pulse placeholder shaped like a ProductCard (shown while products load)
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100 animate-pulse" aria-hidden="true">
      <div className="aspect-square bg-slate-200" />
      <div className="p-2 sm:p-3 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-11/12" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-5 bg-slate-200 rounded w-1/3 mt-2" />
        <div className="h-8 bg-slate-200 rounded-lg sm:hidden" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className = 'grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6' }) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
