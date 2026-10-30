import { Banknote, Truck, RotateCcw, MapPin } from 'lucide-react';
import { COD_MAX_AMOUNT, FREE_DELIVERY_ABOVE, DELIVERY_CHARGE } from '../config/store';
import { formatPrice } from '../utils/format';

const TRUST_ITEMS = [
  { icon: Banknote, title: 'Cash on Delivery', sub: `Pay when it arrives, up to ${formatPrice(COD_MAX_AMOUNT)}` },
  { icon: Truck, title: `Free delivery above ₹${FREE_DELIVERY_ABOVE}`, sub: `Otherwise ₹${DELIVERY_CHARGE} · ships in 2 days` },
  { icon: RotateCcw, title: '7-day easy returns', sub: 'Damaged, wrong item or size' },
  { icon: MapPin, title: 'Made in Panipat', sub: 'Checked and packed by us' }
];

// 4 store promises with small monochrome line icons
export default function TrustStrip() {
  return (
    <ul className="grid grid-cols-2 gap-y-4 lg:grid-cols-4 lg:divide-x lg:divide-line">
      {TRUST_ITEMS.map(({ icon: Icon, title, sub }) => (
        <li key={title} className="flex items-start gap-3 pr-3 lg:px-6 lg:first:pl-0">
          <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" strokeWidth={1.5} aria-hidden="true" />
          <span>
            <span className="block text-[13px] font-semibold leading-tight text-ink sm:text-sm">{title}</span>
            <span className="mt-0.5 block text-xs leading-snug text-slate-500">{sub}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
