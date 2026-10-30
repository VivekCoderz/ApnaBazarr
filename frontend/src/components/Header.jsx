import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, Package, Settings, LogOut, ChevronDown, X, LogIn, ShieldCheck, MessageCircle } from 'lucide-react';
import { formatPrice } from '../utils/format';
import { categoryLabel, categoryHref, NAV_CATEGORIES, whatsappUrl, PHONE_DISPLAY } from '../config/store';

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

  const profileRef = useRef(null);
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

  // Typewriter placeholder animation loop
  const placeholderTexts = [
    "suits",
    "co-ord sets",
    "bedsheets",
    "blankets"
  ];
  const [placeholder, setPlaceholder] = useState('');
  const [textIndex, setTextIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentFullText = placeholderTexts[textIndex];
    
    if (!isDeleting && charIndex < currentFullText.length) {
      timer = setTimeout(() => {
        setPlaceholder(currentFullText.substring(0, charIndex + 1));
        setCharIndex(prev => prev + 1);
      }, 50);
    } else if (isDeleting && charIndex > 0) {
      timer = setTimeout(() => {
        setPlaceholder(currentFullText.substring(0, charIndex - 1));
        setCharIndex(prev => prev - 1);
      }, 25);
    } else if (!isDeleting && charIndex === currentFullText.length) {
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setTextIndex(prev => (prev + 1) % placeholderTexts.length);
    }
    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, textIndex]);

  const searchResults = searchQuery.trim() === ''
    ? []
    : products.filter(p =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.gender && p.gender.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSearchDropdown(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
    }
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

  const renderResults = (results, close, extraClass) => (
    <div className={`${extraClass} overflow-hidden rounded-lg border border-line bg-white shadow-lift z-50 animate-fade-in`}>
      <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto p-2">
        {results.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              close();
              setSearchQuery('');
              navigate(`/product/${item.id}`);
            }}
            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-brand-cream"
          >
            <img src={item.image} alt="" className="h-11 w-11 rounded-lg bg-slate-100 object-cover" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{item.name}</span>
              <span className="text-xs text-slate-500">{categoryLabel(item.category)}</span>
            </span>
            <span className="text-sm font-semibold text-brand-cta">{formatPrice(item.price)}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSearchSubmit}
        className="w-full border-t border-slate-100 bg-brand-cream p-3 text-center text-sm font-semibold text-brand-navy hover:underline"
      >
        View all results for "{searchQuery}" →
      </button>
    </div>
  );

  const renderSearchForm = (focused, setFocused, setDropdown) => (
    <form onSubmit={handleSearchSubmit} className="relative" role="search">
      <input
        type="search"
        value={searchQuery}
        onFocus={() => {
          setDropdown(true);
          setFocused(true);
        }}
        onBlur={() => {
          setTimeout(() => setFocused(false), 200);
        }}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setDropdown(true);
        }}
        placeholder="Search for suits, co-ord sets, bedsheets…"
        aria-label="Search products"
        className="h-11 w-full rounded-lg border border-line bg-brand-cream pl-11 pr-10 text-sm text-ink placeholder:text-transparent focus:border-brand-navy focus:bg-white focus:outline-none focus:placeholder:text-slate-500 [&::-webkit-search-cancel-button]:hidden"
      />
      {!searchQuery && !focused && (
        <div className="pointer-events-none absolute left-11 top-1/2 flex -translate-y-1/2 select-none items-center gap-1 text-sm text-slate-500" aria-hidden="true">
          <span>Search for</span>
          <span className="font-semibold text-brand-navy">{placeholder}</span>
          <span className="animate-pulse font-light text-brand-navy">|</span>
        </div>
      )}
      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
      {searchQuery && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:bg-white hover:text-slate-700"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </form>
  );

  const iconBtn = 'relative flex h-11 w-11 items-center justify-center rounded-full text-brand-navy transition-colors hover:bg-brand-cream';

  return (
    <header className={`sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur transition-transform duration-300 ease-in-out ${hideHeaderTop ? '-translate-y-16' : 'translate-y-0'}`}>
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
            {renderSearchForm(isSearchFocused, setIsSearchFocused, setShowSearchDropdown)}
            {showSearchDropdown && searchResults.length > 0 &&
              renderResults(searchResults, () => setShowSearchDropdown(false), 'absolute left-0 right-0 top-full mt-2')}
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
                <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-white bg-brand-cta px-1 text-[10px] font-semibold text-white">
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
                      {currentUser?.role === 'seller' ? (
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

        {/* Mobile search row */}
        <div className={`relative block pb-3 transition-all duration-300 md:hidden ${hideHeaderTop ? 'pt-3' : 'pt-0'}`} ref={mobileSearchRef}>
          {renderSearchForm(isMobileSearchFocused, setIsMobileSearchFocused, setShowMobileSearchDropdown)}
          {showMobileSearchDropdown && searchResults.length > 0 &&
            renderResults(searchResults, () => setShowMobileSearchDropdown(false), 'absolute left-0 right-0 mt-2')}
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
