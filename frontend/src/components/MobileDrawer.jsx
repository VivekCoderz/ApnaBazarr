import React from 'react';
import { Link } from 'react-router-dom';
import { X, Search, Heart, ShoppingBag, Phone, Mail, ChevronRight } from 'lucide-react';
import { CATEGORIES, CORE_CATEGORIES, categoryHref } from '../config/store';
import CategoryGlyph from './ui/CategoryGlyph';

export default function MobileDrawer({ isOpen, onClose, cartCount, wishlistCount, onOpenCart, onOpenWishlist, onOpenSearch, currentUser }) {
  if (!isOpen) return null;

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'All Products', to: '/shop' },
    { label: 'Cart', to: '/cart' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
  ];

  if (currentUser?.role === 'seller') {
    navLinks.push({ label: 'Seller Dashboard', to: '/seller' });
  }

  if (currentUser?.email !== 'admin@apnabazarr.com') {
    navLinks.push({ label: currentUser?.resellerProfile?.code ? 'Reseller Dashboard' : 'Become a Reseller', to: '/reseller' });
  }

  navLinks.push(
    { label: 'Shipping Policy', to: '/shipping' },
    { label: 'Returns & Refunds', to: '/refunds' },
    { label: 'Contact', to: '/contact' }
  );

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-2xl z-50 flex flex-col animate-fade-in">
        
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-brand-navy text-white">
          <div className="flex items-center">
            <img 
              src="/dhagaro-logo-white.svg" 
              alt="Dhagaro" 
              className="h-7 w-auto" 
            />
          </div>
          <button 
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors" aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Action Badges */}
        <div className="p-4 bg-slate-50 border-b flex justify-around items-center">
          <button 
            onClick={() => { onClose(); onOpenSearch(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-brand-navy"
          >
            <Search className="w-5 h-5 mb-1 text-slate-700" />
            <span>Search</span>
          </button>
          <button 
            onClick={() => { onClose(); onOpenWishlist(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-brand-navy relative"
          >
            <Heart className="w-5 h-5 mb-1 text-slate-700" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                {wishlistCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => { onClose(); onOpenCart(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-brand-navy relative"
          >
            <ShoppingBag className="w-5 h-5 mb-1 text-slate-700" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-2 bg-brand-navy text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-semibold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Menu">
          <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-brand-cta">Shop by category</p>
          {CATEGORIES.filter(c => CORE_CATEGORIES.includes(c.name)).map(c => (
            <Link
              key={c.name}
              to={categoryHref(c.name)}
              onClick={onClose}
              className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy transition-colors"
            >
              <CategoryGlyph name={c.name} className="h-5 w-5 shrink-0 text-slate-500" />
              <span>{c.label}</span>
            </Link>
          ))}
          <div className="my-3 border-t border-line" />
          {navLinks.map((link, idx) => (
            <Link
              key={idx}
              to={link.to}
              onClick={onClose}
              className="flex min-h-11 items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-brand-cream hover:text-brand-navy transition-colors"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </Link>
          ))}
        </nav>

        {/* Mobile Footer Contact */}
        <div className="p-4 border-t bg-slate-50 text-xs text-slate-500 space-y-2">
          <a href="mailto:appnabaazar@gmail.com" className="flex items-center space-x-2 hover:text-slate-900 transition-colors">
            <Mail className="w-4 h-4 text-brand-navy" />
            <span>appnabaazar@gmail.com</span>
          </a>
          <a href="tel:+919306810726" className="flex items-center space-x-2 hover:text-slate-900 transition-colors">
            <Phone className="w-4 h-4 text-brand-navy" />
            <span>+91 93068 10726</span>
          </a>
        </div>

      </div>
    </div>
  );
}
