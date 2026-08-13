import React, { useState, useEffect } from 'react';
import { ArrowRight, Gift, Sparkles } from 'lucide-react';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      subtitleScript: "Rakhi Special Offers 🪔",
      title: "SURPRISE YOUR SISTER THIS RAKHI",
      discount: "Min. 35–70% Off + Free Roli-Chawal & Sweets Kit",
      description: "Surprise your sister with luxury golden clutches, ethnic suits, designer hampers & Kundan Rakhis! Apna Bazarr par Har Fashion Ka Saamaan Milega.",
      image: "/images/rakhi-surprise.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=900&q=80",
      ctaPrimary: "SHOP RAKHI GIFTS (₹)",
      ctaSecondary: "EXPLORE ALL FASHION"
    },
    {
      id: 2,
      subtitleScript: "Sister's Gold Clutch & Accessories 👛",
      title: "LUXURY CLUTCHES & HANDBAG BAZARR",
      discount: "Flat 40% Off on Sister's Festive Gifts",
      description: "Bhaiya-Behen Rakhi special gifts! Exclusive metallic gold clutches, designer shoulder totes & traditional jewellery for your sister.",
      image: "/images/rakhi-clutch.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=80",
      ctaPrimary: "EXPLORE CLUTCHES",
      ctaSecondary: "VIEW GIFT HAMPERS"
    },
    {
      id: 3,
      subtitleScript: "Silver Kundan Rakhi Combos 🎁",
      title: "RAKHI SWEETS & GIFT BOX HAMPER",
      discount: "Flat 60% Off + Free Diya & Thali Kit",
      description: "Handcrafted Silver Kundan Rakhis paired with Kaju Katli sweets & luxury gift boxes delivered express across India.",
      image: "/images/rakhi-hamper.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=900&q=80",
      ctaPrimary: "SHOP RAKHI COMBOS",
      ctaSecondary: "VIEW CATALOG"
    }
  ];

  // Auto Horizontal Slide Interval every 3 seconds (3000ms)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-gradient-to-r from-[#fffbeb] via-[#fef3c7] to-[#fde68a] overflow-hidden py-12 md:py-20 lg:py-24 border-b border-amber-200">
      
      {/* Background Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl -z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-72 h-72 bg-rose-400/20 rounded-full blur-3xl -z-0 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
          
          {/* Left Text Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left animate-fade-in key={slide.id}">
            
            {/* Script Subtitle */}
            <div className="inline-flex items-center space-x-2 bg-rose-900/10 border border-rose-900/20 px-4 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-rose-700" />
              <span className="font-script text-3xl sm:text-4xl md:text-5xl text-rose-800 font-bold tracking-wide">
                {slide.subtitleScript}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              {slide.title}
            </h1>

            {/* Discount Tagline */}
            <div className="inline-block bg-rose-700 text-white font-extrabold text-lg sm:text-2xl px-4 py-1.5 rounded-xl shadow-xs">
              {slide.discount}
            </div>

            {/* Tagline Paragraph */}
            <p className="text-slate-800 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base font-semibold leading-relaxed">
              {slide.description}
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href="#shop"
                className="px-8 py-3.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 group"
              >
                <span>{slide.ctaPrimary}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#featured"
                className="px-8 py-3.5 bg-white border-2 border-slate-400 hover:border-slate-900 text-slate-900 font-bold text-xs uppercase tracking-wider rounded-xl shadow-xs transition-colors"
              >
                {slide.ctaSecondary}
              </a>
            </div>

          </div>

          {/* Right Image Canvas */}
          <div className="lg:col-span-5 flex justify-center relative">
            <div className="relative w-full max-w-md lg:max-w-none">
              
              <div className="absolute -inset-4 bg-amber-400/40 rounded-full blur-2xl -z-10" />

              <div className="overflow-hidden rounded-3xl shadow-2xl border-4 border-white bg-white">
                <img
                  src={slide.image}
                  onError={(e) => {
                    e.target.src = slide.fallbackImage;
                  }}
                  alt={slide.title}
                  className="w-full h-[360px] sm:h-[460px] lg:h-[500px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                />
              </div>

            </div>
          </div>

        </div>

        {/* Carousel Indicators */}
        <div className="mt-8 flex items-center justify-center space-x-3">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'bg-rose-700 ring-4 ring-rose-200 scale-110' : 'bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}
