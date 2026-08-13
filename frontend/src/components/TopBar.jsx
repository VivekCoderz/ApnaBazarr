import React from 'react';
import { Mail, Phone, ChevronDown } from 'lucide-react';

export default function TopBar() {
  return (
    <div className="bg-[#0066cc] text-white text-xs py-2 px-4 border-b border-blue-600/30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        
        {/* Left Side: Contact Info */}
        <div className="flex items-center space-x-4 sm:space-x-6 text-blue-100 font-medium">
          <a href="mailto:appnabaazar@gmail.com" className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Mail className="w-3.5 h-3.5" />
            <span>appnabaazar@gmail.com</span>
          </a>
          <a href="tel:+919306810726" className="flex items-center space-x-1.5 hover:text-white transition-colors">
            <Phone className="w-3.5 h-3.5" />
            <span>+91 9306810726</span>
          </a>
        </div>

        {/* Right Side: Store Notice & Indian Preferences */}
        <div className="flex items-center space-x-4 sm:space-x-6 text-blue-100 font-medium">
          <span className="hidden md:inline text-blue-100">Welcome to Apna Bazarr India Store!</span>
          <div className="flex items-center space-x-4">
            <div className="relative group cursor-pointer flex items-center space-x-1 hover:text-white">
              <span>English</span>
              <ChevronDown className="w-3 h-3" />
            </div>
            <span className="text-blue-400">|</span>
            <div className="relative group cursor-pointer flex items-center space-x-1 hover:text-white font-bold text-white">
              <span>₹ INR (India)</span>
              <ChevronDown className="w-3 h-3" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
