import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, ShoppingBag, User, Menu, Package, Settings, LogOut, ChevronDown, X, LogIn, ShieldCheck } from 'lucide-react';

export default function Header({
  cartCount,
  wishlistCount,
  products = [],
  currentUser,
  onOpenCart,
  onOpenWishlist,
  onOpenMobileMenu,
  onOpenAuth,
  onLogout
}) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showMobileSearchDropdown, setShowMobileSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hideHeaderTop, setHideHeaderTop] = useState(false);

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

  const handleCartClick = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      navigate('/cart');
    }
  };

  const handleWishlistClick = () => {
    if (!currentUser) {
      onOpenAuth();
    } else {
      navigate('/wishlist');
    }
  };

  return (
    <header className="bg-white sticky top-0 z-40 shadow-xs border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between gap-4 transition-all duration-300 overflow-hidden ${hideHeaderTop ? 'h-0 opacity-0 pointer-events-none' : 'h-20 opacity-100'}`}>
          
          {/* LEFT: Logo & Mobile Hamburger */}
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Open Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link to="/" className="flex items-center space-x-2 group">
              <img 
                src="/logo.png" 
                alt="Apna Bazarr Logo" 
                className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105" 
              />
            </Link>
          </div>

          {/* CENTER: Working Embedded Live Search Bar */}
          <div className="flex-1 max-w-xl relative hidden md:block" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearchDropdown(true);
                }}
                placeholder="Search products, brands, Rakhi hampers, Men, Women..."
                className="w-full bg-slate-50 border border-slate-200 rounded-full pl-11 pr-10 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#0066cc] focus:bg-white transition-all shadow-xs"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Live Search Results Dropdown Popup */}
            {showSearchDropdown && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
                <div className="p-2 divide-y divide-slate-100">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setShowSearchDropdown(false);
                        setSearchQuery('');
                        navigate(`/product/${item.id}`);
                      }}
                      className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer"
                    >
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                      <div className="flex-1 min-w-0">
                        <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                        <span className="text-[11px] text-slate-400">{item.category} • {item.gender}</span>
                      </div>
                      <span className="text-xs font-extrabold text-[#0066cc]">₹{item.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div 
                  onClick={handleSearchSubmit}
                  className="bg-slate-50 p-2.5 text-center text-xs font-bold text-[#0066cc] hover:underline border-t border-slate-100 cursor-pointer"
                >
                  View all results for "{searchQuery}" →
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Action Icons & Conditional Auth Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            
            {/* Wishlist Icon */}
            <button
              onClick={handleWishlistClick}
              className="p-2.5 text-slate-700 hover:text-[#0066cc] hover:bg-slate-50 rounded-full transition-colors relative"
              title={currentUser ? "Wishlist" : "Log in to view Wishlist"}
            >
              <Heart className="w-5 h-5" />
              {currentUser && wishlistCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon */}
            <button
              onClick={handleCartClick}
              className="p-2.5 text-slate-700 hover:text-[#0066cc] hover:bg-slate-50 rounded-full transition-colors relative"
              title={currentUser ? "Shopping Cart" : "Log in to view Cart"}
            >
              <ShoppingBag className="w-5 h-5" />
              {currentUser && cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#0066cc] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                  {cartCount}
                </span>
              )}
            </button>

            {/* CONDITIONAL AUTH / PROFILE AREA */}
            {!currentUser ? (
              /* GUEST USER: ONLY LOGIN / REGISTER BUTTON DISPLAYED */
              <button
                onClick={onOpenAuth}
                className="p-2 sm:px-4 sm:py-2 bg-slate-900 hover:bg-[#0066cc] text-white font-extrabold text-xs rounded-full sm:rounded-xl shadow-md transition-colors flex items-center space-x-1.5 shrink-0"
              >
                <LogIn className="w-4 h-4 text-white" />
                <span className="hidden sm:inline">Login / Register</span>
              </button>
            ) : (
              /* LOGGED-IN USER: FULL PROFILE DROPDOWN MENU */
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-1.5 p-1.5 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full sm:rounded-xl transition-all"
                  title="Account Menu"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden sm:inline text-xs font-bold text-slate-800 max-w-[90px] truncate">
                    {currentUser.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 hidden sm:inline" />
                </button>

                {/* Profile Dropdown Popup Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-fade-in divide-y divide-slate-100">
                    
                    {/* User Overview */}
                    <div className="px-4 py-3 bg-slate-50/80">
                      <p className="text-xs font-extrabold text-slate-900 truncate">
                        {currentUser.name}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {currentUser.email}
                      </p>
                    </div>

                    {/* Nav Links */}
                    <div className="py-1">
                      {currentUser.email === 'admin@apnabazarr.com' && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 border-b border-slate-100 transition-colors"
                        >
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                          <span>Switch to Admin Panel</span>
                        </Link>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0066cc] transition-colors"
                      >
                        <User className="w-4 h-4 text-slate-500" />
                        <span>My Profile</span>
                      </Link>

                      <Link
                        to="/orders"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0066cc] transition-colors"
                      >
                        <Package className="w-4 h-4 text-slate-500" />
                        <span>My Orders</span>
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-[#0066cc] transition-colors"
                      >
                        <Settings className="w-4 h-4 text-slate-500" />
                        <span>Account Settings</span>
                      </Link>

                    </div>

                    {/* Logout Action */}
                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          onLogout();
                        }}
                        className="w-full text-left flex items-center space-x-2.5 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>

                  </div>
                )}
              </div>
            )}

          </div>

        </div>

        {/* Mobile Search Bar Row (Visible on mobile only) */}
        <div className={`pb-3.5 block md:hidden transition-all duration-300 ${hideHeaderTop ? 'pt-3.5' : 'pt-0'}`} ref={mobileSearchRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onFocus={() => setShowMobileSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowMobileSearchDropdown(true);
              }}
              placeholder="Search products, brands, Rakhi hampers..."
              className="w-full bg-slate-50 border border-slate-205 rounded-full pl-11 pr-10 py-2.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-[#0066cc] focus:bg-white transition-all shadow-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Mobile Live Search Dropdown Popup */}
          {showMobileSearchDropdown && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-fade-in">
              <div className="p-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setShowMobileSearchDropdown(false);
                      setSearchQuery('');
                      navigate(`/product/${item.id}`);
                    }}
                    className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-blue-50/70 transition-colors cursor-pointer"
                  >
                    <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg bg-slate-100" />
                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                      <span className="text-[11px] text-slate-400">{item.category} • {item.gender}</span>
                    </div>
                    <span className="text-xs font-extrabold text-[#0066cc]">₹{item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div 
                onClick={handleSearchSubmit}
                className="bg-slate-50 p-2.5 text-center text-xs font-bold text-[#0066cc] hover:underline border-t border-slate-100 cursor-pointer"
              >
                View all results for "{searchQuery}" →
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
