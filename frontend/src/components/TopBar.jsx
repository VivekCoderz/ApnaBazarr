import React from 'react';
import { getAnnouncementItems } from '../config/campaign';

// Static announcement bar (no marquee). Text comes from src/config/campaign.js
export default function TopBar() {
  const items = getAnnouncementItems();

  return (
    <div className="bg-brand-navy text-white min-h-9 px-3 py-1.5 flex items-center justify-center">
      <p className="text-xs sm:text-sm font-semibold leading-snug text-center">
        {items.map((item, idx) => (
          <span key={item} className={idx === 2 ? 'hidden min-[360px]:inline' : undefined}>
            {idx > 0 && <span className="mx-1.5 text-brand-orange" aria-hidden="true">·</span>}
            {item}
          </span>
        ))}
      </p>
    </div>
  );
}
