import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Gift, Sparkles, ChevronLeft, ChevronRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function HeroBanner() {
  const [currentSlide, setCurrentSlide] = useState(0);

  const timerRef = useRef(null);

  const slides = [
    {
      id: 1,
      subtitleScript: "Rakhi Special Offers 🪔",
      title: "SURPRISE YOUR SISTER THIS RAKHI",
      discount: "Min. 35–70% Off + Free Roli-Chawal & Sweets Kit",
      description: "Surprise your sister with luxury golden clutches, ethnic suits, designer hampers & Kundan Rakhis! Apna Bazarr par Har Fashion Ka Saamaan Milega.",
      image: "/images/rakhi-surprise.jpg",
      fallbackImage: "https://images.unsplash.com/photo-1628155930542-3c7a64e2c833?auto=format&fit=crop&w=900&q=80",
      ctaPrimary: "SHOP RAKHI GIFTS",
      ctaSecondary: "EXPLORE ALL FASHION",
      showOverlays: true
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
      ctaSecondary: "VIEW GIFT HAMPERS",
      showOverlays: false
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
      ctaSecondary: "VIEW CATALOG",
      showOverlays: false
    }
  ];

  const features = [
    { icon: ShieldCheck, text: "Best Prices Guaranteed" },
    { icon: ShieldCheck, text: "Secure Shopping 100% Safe" },
    { icon: Truck, text: "Fast Delivery At Your Doorstep" },
    { icon: RefreshCw, text: "Easy Returns Hassle Free" }
  ];

  useEffect(() => {
      timerRef.current = setInterval(() => {
        setCurrentSlide(prev => (prev + 1) % slides.length);
      }, 4000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length]);

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#fff6e6] via-white to-[#fff0f5] py-6 sm:py-12 md:py-16 lg:py-20 group/banner">
      {/* Background Decorative Shapes */}
      <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 lg:w-96 lg:h-96 bg-[#0a2540] rounded-bl-[160px] sm:rounded-bl-[240px] lg:rounded-bl-[320px] pointer-events-none -z-0 transition-all duration-500" />
      <div className="absolute bottom-0 right-0 w-16 h-48 sm:w-24 sm:h-72 lg:w-32 lg:h-[450px] bg-orange-600 rounded-tl-[80px] sm:rounded-tl-[120px] lg:rounded-tl-[160px] pointer-events-none -z-0 transition-all duration-500" />
      
      {/* Slides wrapper */}
      <div className="overflow-hidden relative w-full">
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={slide.id} className="w-full flex-shrink-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-8 lg:gap-12">
                  
                  {/* Left Text Column */}
                  <div className="lg:col-span-7 space-y-4 sm:space-y-6 text-center lg:text-left">
                    
                    {/* Brand Logo inside slide */}
                    <div className="flex justify-center lg:justify-start items-center space-x-2 mb-2 sm:mb-4">
                      <img 
                        src="/logo.png" 
                        alt="Apna Bazarr Logo" 
                        className="h-8 sm:h-12 w-auto object-contain"
                      />
                    </div>

                    {/* Script Subtitle */}
                    <div className="inline-flex items-center space-x-2 bg-rose-950/5 border border-rose-950/10 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full">
                      <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                      <span className="font-script text-xl sm:text-4xl md:text-5xl text-rose-800 font-bold tracking-wide">
                        {slide.subtitleScript}
                      </span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-2xl sm:text-5xl lg:text-[54px] font-black text-[#0a2540] tracking-tight leading-none uppercase">
                      {slide.title}
                    </h1>

                    {/* Discount Tagline */}
                    <div className="inline-flex items-center space-x-2 bg-[#0a2540] text-white font-extrabold text-xs sm:text-lg px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl shadow-md border border-[#1e3a5f]">
                      <Gift className="w-3.5 h-3.5 text-orange-400 animate-bounce" />
                      <span>{slide.discount}</span>
                    </div>

                    {/* Tagline Paragraph */}
                    <p className="text-slate-700 max-w-xl mx-auto lg:mx-0 text-xs sm:text-base font-semibold leading-relaxed">
                      {slide.description}
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-4 pt-2">
                      <a
                        href="#shop"
                        className="px-5 py-2.5 sm:px-8 sm:py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2 group cursor-pointer"
                      >
                        <Gift className="w-4 h-4 mr-1 text-white" />
                        <span>{slide.ctaPrimary}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>

                      <a
                        href="#featured"
                        className="px-5 py-2.5 sm:px-8 sm:py-3.5 bg-white border-2 border-slate-300 hover:border-slate-800 text-slate-800 hover:text-slate-900 font-extrabold text-[10px] sm:text-xs uppercase tracking-wider rounded-xl shadow-xs hover:shadow-md transition-all flex items-center space-x-2 cursor-pointer"
                      >
                        <span>{slide.ctaSecondary}</span>
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Integrated Service Badges */}
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 sm:gap-x-6 gap-y-2 pt-4 sm:pt-6 border-t border-amber-300/40 mt-6 sm:mt-8">
                      {features.map((feat, fidx) => {
                        const Icon = feat.icon;
                        return (
                          <div key={fidx} className="flex items-center space-x-1.5 text-slate-800">
                            <Icon className="w-3.5 h-3.5 text-[#0a2540] shrink-0" />
                            <span className="text-[10px] sm:text-[13px] font-bold tracking-tight">{feat.text}</span>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                  {/* Right Image Frame Column */}
                  <div className="lg:col-span-5 flex justify-center relative py-4 sm:py-6">
                    <div className="relative w-full max-w-[280px] sm:max-w-md lg:max-w-none">
                      
                      {/* Double border contour wrapper */}
                      <div className="absolute -inset-2.5 sm:-inset-4 rounded-tl-[64px] sm:rounded-tl-[80px] rounded-br-[64px] sm:rounded-br-[80px] rounded-tr-[20px] sm:rounded-tr-[28px] rounded-bl-[20px] sm:rounded-bl-[28px] border-2 border-amber-400/80 -z-10 pointer-events-none" />

                      {/* Image frame */}
                      <div className="overflow-hidden rounded-tl-[60px] sm:rounded-tl-[76px] rounded-br-[60px] sm:rounded-br-[76px] rounded-tr-[16px] sm:rounded-tr-[24px] rounded-bl-[16px] sm:rounded-bl-[24px] border-4 border-white bg-white shadow-2xl relative z-10">
                        <img
                          src={slide.image}
                          onError={(e) => {
                            e.target.src = slide.fallbackImage;
                          }}
                          alt={slide.title}
                          className="w-full h-[220px] sm:h-[420px] lg:h-[460px] object-cover object-center transform hover:scale-105 transition-transform duration-700"
                        />
                      </div>

                      {/* Blue Circular Gift Badge */}
                      <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-[#0a2540] text-white rounded-full p-1.5 sm:p-3 w-16 h-16 sm:w-28 sm:h-28 flex flex-col items-center justify-center text-center shadow-2xl border-2 border-dashed border-white/70 z-20">
                        <Gift className="w-3.5 h-3.5 sm:w-5 sm:h-5 mb-0.5 text-orange-400" />
                        <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-wider text-orange-300">Free</span>
                        <span className="text-[8px] sm:text-[11px] font-extrabold leading-tight">Roli-Chawal & Sweets Kit</span>
                      </div>
 
                      {/* Sweets Thali Overlay */}
                      {slide.showOverlays && (
                        <img
                          src="/images/sweets-thali.jpg"
                          alt="Sweets Thali"
                          className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-12 w-20 h-20 sm:w-56 sm:h-56 object-contain z-20 select-none pointer-events-none mix-blend-multiply"
                        />
                      )}
 
                      {/* Blue Gift Box Overlay */}
                      {slide.showOverlays && (
                        <img
                          src="/images/blue-gift-box.jpg"
                          alt="Gift Box"
                          className="absolute -bottom-4 -right-4 sm:-bottom-8 sm:-right-10 w-14 h-14 sm:w-36 sm:h-36 object-contain z-20 select-none pointer-events-none mix-blend-multiply"
                        />
                      )}

                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Chevron Buttons */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md hover:shadow-lg hover:scale-105 transition-all opacity-0 group-hover/banner:opacity-100 duration-300 cursor-pointer"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-[#0a2540]" />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/85 hover:bg-white text-slate-800 shadow-md hover:shadow-lg hover:scale-105 transition-all opacity-0 group-hover/banner:opacity-100 duration-300 cursor-pointer"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-[#0a2540]" />
      </button>

      {/* Carousel Dots Indicators */}
      <div className="relative z-20 mt-6 flex items-center justify-center space-x-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
              currentSlide === idx ? 'bg-orange-600 ring-4 ring-orange-200 scale-110' : 'bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
