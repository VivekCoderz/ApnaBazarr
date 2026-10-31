import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, MessageCircle, X, Search } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import ProductSpotlight from '../components/ProductSpotlight';
import { ProductGridSkeleton } from '../components/ProductSkeleton';
import CategoryShowcase from '../components/CategoryShowcase';
import WaitlistBand from '../components/WaitlistBand';
import Container from '../components/ui/Container';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import CategoryGlyph from '../components/ui/CategoryGlyph';
import { categoryLabel, categoryTiles, notifyMeUrl } from '../config/store';

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4';
// Below this many results the page also shows categories + waitlist so it never looks empty
const FEW_RESULTS = 4;
const MIN_FULL_CATALOGUE = 8;

const SORTS = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest first' },
  { value: 'low-high', label: 'Price: low to high' },
  { value: 'high-low', label: 'Price: high to low' }
];

function SellerHeader({ seller, count }) {
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        {seller.shopLogo ? (
          <img src={seller.shopLogo} alt="" className="h-16 w-16 shrink-0 rounded-lg border border-line bg-white object-cover" />
        ) : (
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-brand-navy text-2xl font-semibold text-white">
            {seller.shopName ? seller.shopName[0] : 'S'}
          </span>
        )}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold leading-tight text-brand-navy sm:text-2xl">{seller.shopName}</h1>
          {seller.shopDescription && <p className="max-w-xl text-sm text-slate-600">{seller.shopDescription}</p>}
          <p className="text-sm text-slate-600">
            {count} {count === 1 ? 'product' : 'products'}
            {seller.returnPolicy ? ` · Returns: ${seller.returnPolicy}` : ''}
          </p>
          {seller.isOpen === false && (
            <p className="inline-block rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-[#B91C1C]">
              This shop is closed for now. Ordering from this seller is paused.
            </p>
          )}
        </div>
      </div>
      <Button to="/shop" variant="secondary" size="sm">Back to all products</Button>
    </div>
  );
}

function ComingSoonPanel({ category }) {
  const label = categoryLabel(category);
  return (
    <div className="grid items-center gap-6 rounded-lg border border-line bg-white p-6 shadow-card sm:grid-cols-[auto_1fr] sm:gap-10 sm:p-10">
      <span className="mx-auto flex h-32 w-40 items-center justify-center rounded-lg border border-line bg-brand-cream sm:h-40 sm:w-48">
        <CategoryGlyph name={category} className="h-12 w-12 text-slate-400" />
      </span>
      <div className="space-y-3 text-center sm:text-left">
        <p className="text-xs font-semibold text-brand-cta">Coming soon</p>
        <h2 className="text-2xl font-semibold leading-tight text-brand-navy sm:text-2xl">{label} are on the way</h2>
        <p className="max-w-lg text-base text-slate-600">
          We only list what we can deliver today. Get a WhatsApp message with launch prices as soon as {label.toLowerCase()} are in stock.
        </p>
        <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
          <Button href={notifyMeUrl(label.toLowerCase())} variant="whatsapp">
            <MessageCircle className="h-5 w-5" aria-hidden="true" /> Notify me on WhatsApp
          </Button>
          <Button to="/shop" variant="secondary">See what's in stock</Button>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage({ products, loading = false, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const tagFilter = (searchParams.get('tag') || '').toLowerCase();
  const sellerId = searchParams.get('sellerId') || '';
  const [sortBy, setSortBy] = useState('featured');

  const sellerInfo = products.find(p => p.seller && String(p.seller.id) === String(sellerId))?.seller || null;

  useEffect(() => {
    if (sellerInfo) document.title = `${sellerInfo.shopName} — Dhagaro`;
    else if (searchQuery) document.title = `Search: ${searchQuery} — Dhagaro`;
    else if (selectedCategory !== 'All') document.title = `${categoryLabel(selectedCategory)} — Dhagaro`;
    else document.title = 'Shop All Products — Dhagaro';
    return () => {
      document.title = 'Dhagaro — Panipat se Seedha, Aapke Ghar Tak';
    };
  }, [sellerInfo, searchQuery, selectedCategory]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const baseProducts = sellerId ? products.filter(p => p.seller && String(p.seller.id) === String(sellerId)) : products;
  const q = searchQuery.toLowerCase();

  const filtered = baseProducts.filter(p => {
    const matchesQuery = !q || p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchesTag = !tagFilter || (p.tags || []).some(t => String(t).toLowerCase() === tagFilter);
    return matchesQuery && matchesCategory && matchesTag;
  });

  if (sortBy === 'low-high') filtered.sort((a, b) => a.price - b.price);
  else if (sortBy === 'high-low') filtered.sort((a, b) => b.price - a.price);
  // 'newest': the API already returns products newest first (and has no createdAt field),
  // so the server order is kept; sorting on the missing date did nothing
  else if (sortBy === 'newest') filtered.sort((a, b) => products.indexOf(a) - products.indexOf(b));

  const tiles = categoryTiles(products);
  const categoryIsEmpty = selectedCategory !== 'All' && !products.some(p => p.category === selectedCategory);
  const title = searchQuery
    ? `Results for “${searchQuery}”`
    : selectedCategory !== 'All' ? categoryLabel(selectedCategory)
    : tagFilter ? `${tagFilter.charAt(0).toUpperCase()}${tagFilter.slice(1)} collection`
    : 'All products';
  const showExtras = !loading && !sellerInfo && filtered.length < FEW_RESULTS;

  const chipCls = (active) =>
    `inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-md border px-3.5 text-sm font-semibold transition-colors ${
      active ? 'border-brand-navy bg-brand-navy text-white' : 'border-line bg-white text-ink hover:border-brand-navy'
    }`;

  return (
    <div className="bg-white">
      {/* Page header */}
      <div className="border-b border-line bg-brand-cream">
        <Container className="py-6 sm:py-10">
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-sm text-slate-600">
            <Link to="/" className="hover:text-brand-navy">Home</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="font-semibold text-ink">Shop</span>
          </nav>

          {sellerInfo ? (
            <SellerHeader seller={sellerInfo} count={filtered.length} />
          ) : (
            <>
              <h1 className="text-[28px] font-semibold leading-tight text-brand-navy sm:text-3xl">{title}</h1>
              <p className="mt-1 text-base text-slate-600">
                {loading && products.length === 0
                  ? 'Loading products…'
                  : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'} · straight from Panipat · cash on delivery`}
              </p>

              {/* Category chips */}
              <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Categories">
                <button type="button" onClick={() => setParam('category', '')} className={chipCls(selectedCategory === 'All')} aria-pressed={selectedCategory === 'All'}>
                  All
                </button>
                {tiles.map(tile => (
                  <button
                    key={tile.name}
                    type="button"
                   
                    onClick={() => setParam('category', tile.name)}
                    className={chipCls(selectedCategory === tile.name)}
                    aria-pressed={selectedCategory === tile.name}
                  >
                    {tile.label}
                    {tile.count === 0 && !loading && (
                      <span className={`rounded px-1 text-[10px] font-semibold ${selectedCategory === tile.name ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </Container>
      </div>

      <Container className="py-6 sm:py-10">
        {/* Toolbar */}
        {!(categoryIsEmpty && !loading) && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {searchQuery && (
                <button type="button" onClick={() => setParam('search', '')} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-brand-cream px-3 text-sm font-semibold text-brand-navy hover:bg-blue-100">
                  <Search className="h-4 w-4" aria-hidden="true" /> “{searchQuery}” <X className="h-4 w-4" aria-label="Clear search" />
                </button>
              )}
              {tagFilter && (
                <button type="button" onClick={() => setParam('tag', '')} className="inline-flex min-h-10 items-center gap-1.5 rounded-md bg-brand-cream px-3 text-sm font-semibold text-brand-navy hover:bg-blue-100">
                  {tagFilter} <X className="h-4 w-4" aria-label="Clear collection filter" />
                </button>
              )}
            </div>
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              Sort by
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-10 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink focus:border-brand-navy focus:outline-none"
              >
                {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </label>
          </div>
        )}

        {loading && products.length === 0 ? (
          <ProductGridSkeleton count={8} className={GRID_CLASS} />
        ) : categoryIsEmpty && !searchQuery ? (
          <ComingSoonPanel category={selectedCategory} />
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-line bg-white p-8 text-center shadow-card sm:p-12">
            <p className="text-xl font-semibold text-brand-navy">No products found</p>
            <p className="mt-1 text-slate-600">Try another word or category, or ask us on WhatsApp.</p>
            <Button to="/shop" variant="secondary" className="mt-5">Show all products</Button>
          </div>
        ) : filtered.length === 1 ? (
          <ProductSpotlight
            product={filtered[0]}
            onAddToCart={onAddToCart}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlistItems.some(item => item.id === filtered[0].id)}
          />
        ) : (
          <div className={GRID_CLASS}>
            {filtered.map((product) => (
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
        )}

        {/* Few results: show the other categories and the waitlist instead of a big empty page */}
        {showExtras && (
          <div className="mt-12 space-y-12 border-t border-line pt-10 sm:mt-16 sm:pt-14">
            <div>
              <SectionHeader eyebrow="Explore" title="Shop by category" description="Live categories ship today. Tap a coming-soon one to get notified on WhatsApp." />
              <CategoryShowcase products={products} />
            </div>
            {products.length < MIN_FULL_CATALOGUE && <WaitlistBand />}
          </div>
        )}
      </Container>
    </div>
  );
}
