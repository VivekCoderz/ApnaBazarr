import React from 'react';
import { X, Search, Heart, ShoppingBag, User, Phone, Mail, ChevronRight } from 'lucide-react';

export default function MobileDrawer({ isOpen, onClose, cartCount, wishlistCount, onOpenCart, onOpenWishlist, onOpenSearch }) {
  if (!isOpen) return null;

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'Shop', href: '#shop' },
    { label: 'Categories', href: '#categories' },
    { label: 'Men\'s Fashion', href: '#featured' },
    { label: 'Women\'s Wear', href: '#featured' },
    { label: 'Deals & Offers', href: '#deals' },
    { label: 'Blog', href: '#' },
  ];

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
        <div className="p-4 border-b flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Apna Bazarr Logo" 
              className="h-8 w-auto object-contain" 
            />
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Action Badges */}
        <div className="p-4 bg-slate-50 border-b flex justify-around items-center">
          <button 
            onClick={() => { onClose(); onOpenSearch(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-[#0066cc]"
          >
            <Search className="w-5 h-5 mb-1 text-slate-700" />
            <span>Search</span>
          </button>
          <button 
            onClick={() => { onClose(); onOpenWishlist(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-[#0066cc] relative"
          >
            <Heart className="w-5 h-5 mb-1 text-slate-700" />
            <span>Wishlist</span>
            {wishlistCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => { onClose(); onOpenCart(); }}
            className="flex flex-col items-center text-xs text-slate-600 hover:text-[#0066cc] relative"
          >
            <ShoppingBag className="w-5 h-5 mb-1 text-slate-700" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 right-2 bg-[#0066cc] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navLinks.map((link, idx) => (
            <a
              key={idx}
              href={link.href}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-[#0066cc] transition-colors"
            >
              <span>{link.label}</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </nav>

        {/* Mobile Footer Contact */}
        <div className="p-4 border-t bg-slate-50 text-xs text-slate-500 space-y-2">
          <a href="mailto:appnabaazar@gmail.com" className="flex items-center space-x-2 hover:text-slate-900 transition-colors">
            <Mail className="w-4 h-4 text-[#0066cc]" />
            <span>appnabaazar@gmail.com</span>
          </a>
          <a href="tel:+919306810726" className="flex items-center space-x-2 hover:text-slate-900 transition-colors">
            <Phone className="w-4 h-4 text-[#0066cc]" />
            <span>+91 9306810726</span>
          </a>
        </div>

      </div>
    </div>
  );
}
