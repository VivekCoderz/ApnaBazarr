import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { whatsappUrl, CATEGORIES } from '../config/store';

export default function Footer({ products = [] }) {
  // Only link categories that have live products (no empty pages)
  const liveCategories = CATEGORIES.filter(c => products.some(p => p.category === c.name));
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">

          {/* Column 1: Brand Info (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/brand-lockup-reverse.png"
                alt="Apna Bazarr"
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-slate-200 font-semibold">Panipat se Seedha, Aapke Ghar Tak</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Blankets, bedsheets, cushion covers and women's suit sets from Panipat at factory prices, with cash on delivery.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-brand-orange" />
                <span>Panipat, Haryana</span>
              </div>
              <a href="tel:+919306810726" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-brand-orange" />
                <span>+91 93068 10726</span>
              </a>
              <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="flex items-center space-x-2 hover:text-white transition-colors">
                <MessageCircle className="w-4 h-4 text-brand-orange" />
                <span>WhatsApp: +91 93068 10726</span>
              </a>
              <a href="mailto:appnabaazar@gmail.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-brand-orange" />
                <span>appnabaazar@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              Shop
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              {liveCategories.map((category) => (
                <li key={category.name}>
                  <Link to={`/shop?category=${encodeURIComponent(category.name)}`} className="hover:text-white hover:underline transition-colors">
                    {category.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/shop" className="hover:text-white hover:underline transition-colors">All Products</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help + Kamaayein */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white tracking-wider">
              Help
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              <li>
                <Link to="/shipping" className="hover:text-white hover:underline transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-white hover:underline transition-colors">Returns & Refunds</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white hover:underline transition-colors">Contact</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:underline transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/reseller" className="hover:text-white hover:underline transition-colors">Become a Reseller</Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 <span className="text-slate-300 font-bold">Apna Bazarr</span>, Panipat.</p>

          <div className="flex items-center space-x-3 text-slate-400">
            <span className="font-semibold text-[11px] text-slate-500">Payment:</span>
            <div className="flex space-x-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">COD</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">UPI</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">Cards (Razorpay)</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
