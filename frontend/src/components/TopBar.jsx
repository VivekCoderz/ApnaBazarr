import { getAnnouncementItems } from '../config/campaign';

// Slim static announcement bar (no marquee). Text comes from src/config/campaign.js
export default function TopBar() {
  const items = getAnnouncementItems();

  return (
    <div className="flex min-h-8 items-center justify-center bg-blue-800 px-3 py-1 text-white">
      <p className="text-center text-xs font-semibold leading-snug sm:text-[13px]">
        {items.map((item, idx) => (
          <span key={item} className={idx === 2 ? 'hidden min-[380px]:inline' : undefined}>
            {idx > 0 && <span className="mx-2 text-brand-orange" aria-hidden="true">•</span>}
            {item}
          </span>
        ))}
      </p>
    </div>
  );
}
