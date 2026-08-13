import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle, CreditCard, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => {
        setEmail('');
        setSubscribed(false);
      }, 3000);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Column 1: Brand Info (2 Cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <a href="#" className="flex items-center space-x-1">
              <span className="font-black text-2xl tracking-tight text-white">Apna Bazarr</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066cc]"></span>
            </a>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Apna Bazarr is your ultimate destination for luxury fashion, premium footwear, sleek watches, and handpicked accessories. We deliver unmatched quality straight to your doorstep.
            </p>
            <div className="space-y-2 text-xs text-slate-400 pt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-[#0066cc]" />
                <span>123 Commerce Way, Tech City, IN 400001</span>
              </div>
              <a href="tel:+919306810726" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-[#0066cc]" />
                <span>+91 9306810726</span>
              </a>
              <a href="mailto:appnabaazar@gmail.com" className="flex items-center space-x-2 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-[#0066cc]" />
                <span>appnabaazar@gmail.com</span>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs text-slate-400 font-semibold">
              <li>
                <Link to="/" className="hover:text-white hover:underline transition-colors">About Apna Bazarr</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white hover:underline transition-colors">Shop All Products</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white hover:underline transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white hover:underline transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/shipping" className="hover:text-white hover:underline transition-colors">Shipping Policy</Link>
              </li>
              <li>
                <Link to="/refunds" className="hover:text-white hover:underline transition-colors">Cancellation & Refund</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white hover:underline transition-colors">Contact Us</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Categories */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Top Categories
            </h4>
            <ul className="space-y-2 text-xs">
              {['Backpacks & Luggage', 'Men\'s Jackets', 'Casual Boots', 'Women\'s Tops', 'Leather Handbags', 'Smartwatches'].map((item, idx) => (
                <li key={idx}>
                  <a href="#featured" className="hover:text-white hover:underline transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">
              Newsletter
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals!
            </p>

            <form onSubmit={handleSubscribe} className="space-y-2 pt-1">
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address..."
                  className="w-full bg-slate-800 border border-slate-700 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#0066cc] placeholder-slate-500"
                  required
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 bg-[#0066cc] hover:bg-blue-600 text-white rounded-md transition-colors flex items-center justify-center"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>

              {subscribed && (
                <div className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold pt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Subscribed! Check your inbox for 10% OFF coupon.</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 <span className="text-slate-300 font-bold">Apna Bazarr</span>. All rights reserved.</p>
          
          <div className="flex items-center space-x-3 text-slate-400">
            <span className="font-semibold text-[11px] text-slate-500">Secured Payments:</span>
            <div className="flex space-x-2">
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">VISA</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">MASTERCARD</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">PAYPAL</span>
              <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-slate-300">APPLE PAY</span>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
