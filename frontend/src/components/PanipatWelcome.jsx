import { useEffect, useRef, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { usePincode } from '../utils/location';
import { isPanipatPincode, DELIVERY_CHARGE, PANIPAT_VOUCHER_AMOUNT, PANIPAT_VOUCHER_MIN } from '../config/store';

// When the shopper's pincode becomes a Panipat one (typed, or "Use my current location"),
// tell them clearly that delivery is free BECAUSE they are in Panipat. Shown when the
// pincode changes to Panipat during the visit; it hides after 6 seconds or on any tap.
export default function PanipatWelcome() {
  const pin = usePincode();
  const prev = useRef(pin);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const was = prev.current;
    prev.current = pin;
    if (pin && pin !== was && isPanipatPincode(pin)) {
      const open = setTimeout(() => setShow(true), 0);
      const close = setTimeout(() => setShow(false), 6000);
      return () => { clearTimeout(open); clearTimeout(close); };
    }
    return undefined;
  }, [pin]);

  // Any tap or key anywhere on the page closes it (added a moment later so the tap
  // that saved the pincode doesn't close it straight away)
  useEffect(() => {
    if (!show) return undefined;
    const hide = () => setShow(false);
    const t = setTimeout(() => {
      window.addEventListener('pointerdown', hide);
      window.addEventListener('keydown', hide);
      window.addEventListener('scroll', hide, { passive: true });
    }, 400);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', hide);
      window.removeEventListener('keydown', hide);
      window.removeEventListener('scroll', hide);
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-fade-in flex w-full max-w-md items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-lg">
        <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-emerald-800">You're in Panipat, so delivery is FREE! 🎉</p>
          <p className="mt-0.5 text-sm text-emerald-900/80">
            Every Panipat order ships free, even a ₹129 mat. You save ₹{DELIVERY_CHARGE}, and we deliver it to your door ourselves.
          </p>
          <p className="mt-1 text-sm font-semibold text-emerald-800">
            Plus ₹{PANIPAT_VOUCHER_AMOUNT} off your first order (₹{PANIPAT_VOUCHER_MIN}+).
          </p>
        </div>
        <button type="button" onClick={() => setShow(false)} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-emerald-800 hover:bg-emerald-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
