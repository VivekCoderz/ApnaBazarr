// Grey pulse placeholder shaped like a ProductCard (shown while products load)
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-lg border border-line bg-white" aria-hidden="true">
      <div className="aspect-[4/5] bg-slate-200" />
      <div className="space-y-2 p-3 sm:p-4">
        <div className="h-3 w-1/3 rounded bg-slate-200" />
        <div className="h-3.5 w-11/12 rounded bg-slate-200" />
        <div className="h-3.5 w-2/3 rounded bg-slate-200" />
        <div className="mt-2 h-5 w-1/3 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, className = 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={className} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, i) => <ProductCardSkeleton key={i} />)}
      <span className="sr-only">Loading products…</span>
    </div>
  );
}
