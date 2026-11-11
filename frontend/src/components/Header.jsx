import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, Package, Settings, LogOut, ChevronDown, X, LogIn, ShieldCheck, MessageCircle } from 'lucide-react';
import { formatPrice, cloudinaryImage, displayName } from '../utils/format';
import { pop } from './ui/motion';
import { categoryLabel, categoryHref, NAV_CATEGORIES, whatsappUrl, PHONE_DISPLAY, SELLER_MARKETPLACE_ENABLED } from '../config/store';

// Typewriter search hint. Its own component so the ticks re-render only this <span>,
// not the whole header. Each tick still costs a style/paint/composite pass on the whole
// page (expensive next to the 3D hero on cheap phones), so: words are typed but cleared
// in one step (no per-letter delete), and after two rounds it rests on the first word.
// Shows a static word for reduced-motion users and pauses while the tab is hidden.
const TYPEWRITER_WORDS = ['bath mats', 'pebble mats', 'sherpa mats'];
const TYPEWRITER_ROUNDS = 2;

function TypewriterWord() {
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [shown, setShown] = useState(1); // words typed so far
  const [resumeTick, setResumeTick] = useState(0);
  const done = shown > TYPEWRITER_WORDS.length * TYPEWRITER_ROUNDS;

  useEffect(() => {
    if (reduceMotion || done) return undefined;
    const full = TYPEWRITER_WORDS[textIndex];
    let delay;
    let step;
    if (charIndex < full.length) { delay = 75; step = () => setCharIndex(c => c + 1); }
    else {
      delay = 1800;
      step = () => {
        setShown(n => n + 1);
        setTextIndex(i => (i + 1) % TYPEWRITER_WORDS.length);
        setCharIndex(0);
      };
    }
    if (document.hidden) return undefined; // resumed by the visibility listener below
    const timer = setTimeout(step, delay);
    return () => clearTimeout(timer);
  }, [charIndex, textIndex, reduceMotion, done, resumeTick]);

  useEffect(() => {
    const onVisible = () => { if (!document.hidden) setResumeTick(t => t + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const word = TYPEWRITER_WORDS[textIndex];
  return <span className="font-semibold text-brand-navy">{reduceMotion || done ? TYPEWRITER_WORDS[0] : word.substring(0, charIndex)}</span>;
}

export default function Header({
  cartCount,
  wishlistCount,
  products = [],
  currentUser,
  isAdminAuthenticated,
  onOpenCart,
  onOpenWishlist,
  onOpenMobileMenu,
  onOpenAuth,
  onLogout
}) {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const activeCategory = pathname === '/shop' ? new URLSearchParams(search).get('category') : null;
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearchDropdown, setShowMobileSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hideHeaderTop, setHideHeaderTop] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1); // highlighted suggestion (keyboard)

  const profileRef = useRef(null);
  const cartBadgeRef = useRef(null);
  const lastCartCount = useRef(cartCount);
  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const lastScrollY = useRef(0);

  // Close popups on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target)) {
        setShowMobileSearchDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cart badge: small bump whenever something is added
  useEffect(() => {
    if (cartCount > lastCartCount.current) pop(cartBadgeRef.current, 1.35, 420);
    lastCartCount.current = cartCount;
  }, [cartCount]);

  // Listen to window scroll to collapse top navbar row on mobile
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth >= 768) {
        setHideHeaderTop(false);
        return;
      }
      const currentScrollY = window.scrollY;
      if (currentScrollY > 70 && currentScrollY > lastScrollY.current) {
        setHideHeaderTop(true);
      } else if (currentScrollY < lastScrollY.current) {
        setHideHeaderTop(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const searchResults = query === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        (p.category || '').toLowerCase().includes(query) ||
        (p.gender && p.gender.toLowerCase().includes(query))
      ).slice(0, 5);

  const closeSearch = () => {
    setShowSearchDropdown(false);
    setShowMobileSearchDropdown(false);
    setActiveIndex(-1);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      closeSearch();
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const openProduct = (item) => {
    closeSearch();
    setSearchQuery('');
    navigate(`/product/${item.id}`);
  };

  // Keyboard: ↓/↑ move through suggestions, Enter opens the highlighted one, Esc closes
  const handleSearchKeyDown = (e, setDropdown) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (searchResults.length === 0) return;
      e.preventDefault();
      setDropdown(true);
      const step = e.key === 'ArrowDown' ? 1 : -1;
      // -1 = back in the text box; wraps around at both ends
      setActiveIndex(i => {
        const next = i + step;
        if (next >= searchResults.length) return -1;
        if (next < -1) return searchResults.length - 1;
        return next;
      });
    } else if (e.key === 'Enter' && activeIndex >= 0 && searchResults[activeIndex]) {
      e.preventDefault();
      openProduct(searchResults[activeIndex]);
    } else if (e.key === 'Escape') {
      if (searchQuery) setSearchQuery('');
      closeSearch();
    }
  };

  // Matched part of a product name in bold
  const highlight = (text) => {
    const i = query ? text.toLowerCase().indexOf(query) : -1;
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark className="bg-transparent font-bold text-brand-navy">{text.slice(i, i + query.length)}</mark>{text.slice(i + query.length)}</>;
  };

  // Cart works without login (guest cart); only the wishlist needs an account
  const handleCartClick = () => {
    onOpenCart ? onOpenCart() : navigate('/cart');
  };

  const handleWishlistClick = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      navigate('/wishlist');
    }
  };

  // Suggestions panel. With an empty box it offers the categories; with text, matching
  // products (instant, from the catalogue already in memory) and "all results".
  const renderResults = (listId, extraClass, focused) => {
    if (query && searchResults.length === 0) {
      return (
        <div className={`${extraClass} z-50 overflow-hidden rounded-lg border border-line bg-white shadow-lift animate-fade-in`}>
          <p className="px-4 py-3 text-sm text-slate-600">No product names match “{searchQuery.trim()}”.</p>
          <button type="button" onClick={handleSearchSubmit} className="w-full border-t border-slate-100 bg-brand-cream p-3 text-center text-sm font-semibold text-brand-navy hover:underline active:bg-blue-100">
            Search the whole shop →
          </button>
        </div>
      );
    }
    if (!query) {
      if (!focused) return null;
      return (
        <div className={`${extraClass} z-50 rounded-lg border border-line bg-white p-3 shadow-lift animate-fade-in`}>
          <p className="px-1 pb-2 text-xs font-semibold text-slate-500">Popular categories</p>
          <div className="flex flex-wrap gap-2">
            {NAV_CATEGORIES.map(name => (
              <Link
                key={name}
                to={categoryHref(name)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={closeSearch}
                className="inline-flex min-h-9 items-center rounded-md border border-line px-3 text-sm font-semibold text-ink transition-colors hover:border-brand-navy hover:text-brand-navy active:bg-brand-cream"
              >
                {categoryLabel(name)}
              </Link>
            ))}
          </div>
        </div>
      );
    }
    return (
      <div className={`${extraClass} z-50 overflow-hidden rounded-lg border border-line bg-white shadow-lift animate-fade-in`}>
        <ul id={listId} role="listbox" aria-label="Product suggestions" className="max-h-72 divide-y divide-slate-100 overflow-y-auto p-2">
          {searchResults.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              // mousedown, not click: runs before the input's blur closes the panel
              onMouseDown={(e) => { e.preventDefault(); openProduct(item); }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg p-2.5 text-left transition-colors active:bg-blue-100 ${i === activeIndex ? 'bg-brand-cream' : ''}`}
            >
              <img src={cloudinaryImage(item.image, 96)} alt="" width="44" height="44" loading="lazy" className="h-11 w-11 rounded-lg bg-slate-100 object-cover" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">{highlight(displayName(item.name))}</span>
                <span className="text-xs text-slate-500">{categoryLabel(item.category)}</span>
              </span>
              <span className="text-sm font-semibold text-brand-cta">{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleSearchSubmit}
          className="w-full border-t border-slate-100 bg-brand-cream p-3 text-center text-sm font-semibold text-brand-navy hover:underline active:bg-blue-100"
        >
          View all results for “{searchQuery.trim()}” →
        </button>
      </div>
    );
  };

  const renderSearchForm = (focused, setFocused, setDropdown, listId, dropdownOpen) => (
    <form onSubmit={handleSearchSubmit} className="relative" role="search">
      <input
        type="search"
        value={searchQuery}
        role="combobox"
        aria-expanded={Boolean(dropdownOpen && query && searchResults.length > 0)}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
        enterKeyHint="search"
        autoComplete="off"
        onFocus={() => {
          setDropdown(true);
          setFocused(true);
        }}
        onBlur={() => {
          setTimeout(() => setFocused(false), 200);
        }}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setActiveIndex(-1);
          setDropdown(true);
        }}
        onKeyDown={(e) => handleSearchKeyDown(e, setDropdown)}
        placeholder="Search for bath mats…"
        aria-label="Search products"
        className="h-11 w-full rounded-lg border border-line bg-brand-cream pl-11 pr-10 text-sm text-ink transition-colors placeholder:text-transparent focus:border-brand-navy focus:bg-white focus:outline-none focus:placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {!searchQuery && !focused && (
        <div className="pointer-events-none absolute left-11 top-1/2 flex -translate-y-1/2 select-none items-center gap-1 text-sm text-slate-500" aria-hidden="true">
          <span>Search for</span>
          <TypewriterWord />
          <span className="animate-pulse font-light text-brand-navy">|</span>
        </div>
      )}
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      {searchQuery && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => {
            setSearchQuery('');
            setActiveIndex(-1);
            // keep typing straight away
            e.currentTarget.closest('form')?.querySelector('input')?.focus();
          }}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-700 active:bg-slate-200"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );

  const iconBtn = 'relative flex h-11 w-11 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-brand-cream active:bg-blue-100';

  return (
    <header className={`sticky top-0 z-40 border-b border-line bg-white md:bg-white/95 md:backdrop-blur transition-transform duration-300 ease-out motion-reduce:transition-none ${hideHeaderTop ? '-translate-y-[52px]' : 'translate-y-0'}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4 lg:h-[72px]">

          {/* LEFT: Logo & Mobile Hamburger */}
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={onOpenMobileMenu}
              className={`${iconBtn} -ml-2 lg:hidden`}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <Link to="/" className="flex items-center" aria-label="Dhagaro home">
              <img
                src="/dhagaro-logo.svg"
                alt="Dhagaro"
                className="h-8 w-auto sm:h-9"
              />
            </Link>
          </div>

          {/* CENTER: Live search (desktop) */}
          <div className="relative hidden max-w-xl flex-1 md:block" ref={searchRef}>
            {renderSearchForm(isSearchFocused, setIsSearchFocused, setShowSearchDropdown, 'search-suggest-desktop', showSearchDropdown)}
            {showSearchDropdown && renderResults('search-suggest-desktop', 'absolute left-0 right-0 top-full mt-2', isSearchFocused)}
          </div>

          {/* RIGHT: actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <button
              onClick={handleWishlistClick}
              className={`${iconBtn} hidden sm:flex`}
              title={currentUser ? 'Wishlist' : 'Log in to view Wishlist'}
              aria-label="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {currentUser && wishlistCount > 0 && (
                <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-[#B91C1C] px-1 text-[10px] font-semibold text-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            <button onClick={handleCartClick} className={iconBtn} title="Cart" aria-label={`Cart${cartCount ? `, ${cartCount} items` : ''}`}>
              <ShoppingBag className="h-5 w-5" />
              {cartCount > 0 && (
                <span ref={cartBadgeRef} className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-brand-cta px-1 text-[10px] font-semibold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {isAdminAuthenticated && (
              <Link
                to="/admin"
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-amber-100 px-3 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-200"
                title="Go to Admin Panel"
              >
                <ShieldCheck className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            )}

            {!currentUser ? (
              <button
                onClick={onOpenAuth}
                className="flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-navy px-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 sm:px-4"
                aria-label="Log in"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Login</span>
              </button>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex h-11 items-center gap-1.5 rounded-lg px-1.5 text-ink transition-colors hover:bg-brand-cream sm:px-2"
                  aria-label="Account menu"
                  aria-expanded={showProfileMenu}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-xs font-semibold text-white">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden max-w-[90px] truncate text-sm font-semibold sm:inline">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="hidden h-4 w-4 text-slate-500 sm:inline" />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 z-50 mt-2 w-60 divide-y divide-slate-100 rounded-lg border border-line bg-white py-2 shadow-lift animate-fade-in">
                    <div className="px-4 py-3">
                      <p className="truncate text-sm font-semibold text-ink">{currentUser.name}</p>
                      <p className="truncate text-xs text-slate-500">{currentUser.email}</p>
                    </div>

                    <div className="py-1 text-sm">
                      {currentUser.email === 'admin@apnabazarr.com' && (
                        <Link to="/admin" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-amber-900 hover:bg-amber-50">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Switch to Admin Panel</span>
                        </Link>
                      )}
                      {SELLER_MARKETPLACE_ENABLED && currentUser?.role === 'seller' ? (
                        <Link to="/seller" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-emerald-800 hover:bg-emerald-50">
                          <ShieldCheck className="h-4 w-4" />
                          <span>Seller Dashboard</span>
                        </Link>
                      ) : null}
                      {currentUser.email !== 'admin@apnabazarr.com' && (
                        <Link to="/reseller" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy">
                          <Package className="h-4 w-4 text-slate-500" />
                          <span>{currentUser.resellerProfile?.code ? 'Reseller Dashboard' : 'Become a Reseller'}</span>
                        </Link>
                      )}
                      <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy">
                        <User className="h-4 w-4 text-slate-500" />
                        <span>My Profile</span>
                      </Link>
                      <Link to="/orders" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy">
                        <Package className="h-4 w-4 text-slate-500" />
                        <span>My Orders</span>
                      </Link>
                      <Link to="/settings" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-2.5 px-4 py-2.5 font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy">
                        <Settings className="h-4 w-4 text-slate-500" />
                        <span>Account Settings</span>
                      </Link>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-[#B91C1C] hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Mobile search row. When the logo row slides up (transform only: no padding or
            height animation, which re-laid-out the page on every frame) 12px of it stays
            visible as the gap above the search box. */}
        <div className="relative block pb-3 md:hidden" ref={mobileSearchRef}>
          {renderSearchForm(isMobileSearchFocused, setIsMobileSearchFocused, setShowMobileSearchDropdown, 'search-suggest-mobile', showMobileSearchDropdown)}
          {showMobileSearchDropdown && renderResults('search-suggest-mobile', 'absolute left-0 right-0 mt-2', isMobileSearchFocused)}
        </div>
      </div>

      {/* Desktop category nav */}
      <nav aria-label="Categories" className="hidden border-t border-line lg:block">
        <div className="mx-auto flex h-12 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center gap-1">
            {NAV_CATEGORIES.map(name => {
              const active = activeCategory === name;
              return (
                <li key={name}>
                  <Link
                    to={categoryHref(name)}
                    aria-current={active ? 'page' : undefined}
                    className={`relative flex h-12 items-center px-3 text-[15px] font-semibold transition-colors ${active ? 'text-brand-cta' : 'text-ink hover:text-brand-cta'}`}
                  >
                    {categoryLabel(name)}
                    {active && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-brand-cta" />}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                to="/shop"
                className={`relative flex h-12 items-center px-3 text-[15px] font-semibold transition-colors ${pathname === '/shop' && !activeCategory ? 'text-brand-cta' : 'text-ink hover:text-brand-cta'}`}
              >
                All products
              </Link>
            </li>
          </ul>
          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link to="/reseller" className="flex h-12 items-center gap-1.5 text-brand-navy hover:text-brand-cta">
              <span className="h-2 w-2 rounded-full bg-brand-orange" aria-hidden="true" />
              Become a Reseller
            </Link>
            <Link to="/bulk" className="flex h-12 items-center text-brand-navy hover:text-brand-cta">
              Bulk orders
            </Link>
            <Link to="/track" className="flex h-12 items-center text-brand-navy hover:text-brand-cta">
              Track order
            </Link>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="flex h-12 items-center gap-1.5 text-slate-600 hover:text-brand-navy">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Help: {PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </nav>
    </header>
  );
}
