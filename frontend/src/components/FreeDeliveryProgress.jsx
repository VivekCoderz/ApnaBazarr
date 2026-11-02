import { Truck, CheckCircle } from 'lucide-react';
import { FREE_DELIVERY_ABOVE } from '../config/store';
import { formatPrice } from '../utils/format';

// "Add ₹X more for free delivery" with a slim progress bar, or "unlocked" once the
// items reach FREE_DELIVERY_ABOVE (same rule the server charges: backend/utils/shipping.js).
export default function FreeDeliveryProgress({ subtotal, compact = false }) {
  if (!(subtotal > 0)) return null;
  const needed = Math.max(0, FREE_DELIVERY_ABOVE - subtotal);
  const unlocked = needed === 0;
  const percent = Math.min(100, Math.round((subtotal / FREE_DELIVERY_ABOVE) * 100));

  return (
    <div className={`${compact ? 'pt-2' : 'rounded-xl p-3'} ${!compact && (unlocked ? 'bg-emerald-50' : 'bg-brand-peach')}`}>
      <p className={`flex items-start gap-2 text-sm font-semibold ${unlocked ? 'text-emerald-700' : 'text-brand-navy'}`}>
        {unlocked
          ? <CheckCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          : <Truck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />}
        <span>
          {unlocked
            ? "You've unlocked free delivery"
            : <>Add <span className="text-brand-cta">{formatPrice(needed)}</span> more for free delivery</>}
        </span>
      </p>
      {!unlocked && (
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/80 ring-1 ring-inset ring-brand-navy/10"
          role="progressbar"
          aria-label="Progress to free delivery"
          aria-valuemin={0}
          aria-valuemax={FREE_DELIVERY_ABOVE}
          aria-valuenow={Math.round(subtotal)}
        >
          <div className="h-full rounded-full bg-brand-cta transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      )}
    </div>
  );
}
