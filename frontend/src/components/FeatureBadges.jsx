import React from 'react';
import { Truck, ShieldCheck, RefreshCw, Headset } from 'lucide-react';

export default function FeatureBadges() {
  const features = [
    {
      icon: Truck,
      title: "Free Shipping",
      subtitle: "On All Orders Over $99"
    },
    {
      icon: ShieldCheck,
      title: "Secure Payment",
      subtitle: "We ensure secure payment"
    },
    {
      icon: RefreshCw,
      title: "100% Money Back",
      subtitle: "30 Days Return Policy"
    },
    {
      icon: Headset,
      title: "Online Support",
      subtitle: "24/7 Dedicated Support"
    }
  ];

  return (
    <section className="py-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <div
                key={idx}
                className="flex items-center space-x-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group cursor-default"
              >
                <div className="p-3 bg-blue-50 text-[#0066cc] rounded-full group-hover:bg-[#0066cc] group-hover:text-white transition-colors duration-300">
                  <IconComponent className="w-6 h-6 stroke-[1.75]" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-800 tracking-tight">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
