import { useEffect, useRef, useState } from 'react';
import { PartyPopper, X } from 'lucide-react';
import { usePincode } from '../utils/location';
import { isPanipatPincode, DELIVERY_CHARGE } from '../config/store';

// When the shopper's pincode becomes a Panipat one (typed, or "Use my current location"),
// tell them clearly that delivery is free BECAUSE they are in Panipat. Shown when the
// pincode changes to Panipat during the visit; it hides after 8 seconds or on close.
export default function PanipatWelcome() {
  const pin = usePincode();
  const prev = useRef(pin);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const was = prev.current;
    prev.current = pin;
    if (pin && pin !== was && isPanipatPincode(pin)) {
      const open = setTimeout(() => setShow(true), 0);
      const close = setTimeout(() => setShow(false), 8000);
      return () => { clearTimeout(open); clearTimeout(close); };
    }
    return undefined;
  }, [pin]);

  if (!show) return null;
  return (
    <div className="fixed inset-x-0 top-3 z-[60] flex justify-center px-4" role="status" aria-live="polite">
      <div className="animate-fade-in flex w-full max-w-md items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-lg">
        <PartyPopper className="mt-0.5 h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" />
        <div className="flex-1">
          <p className="font-semibold text-emerald-800">Aap Panipat mein ho, isliye delivery FREE! 🎉</p>
          <p className="mt-0.5 text-sm text-emerald-900/80">
            Panipat mein har order pe free delivery, chahe ₹129 ka ho. ₹{DELIVERY_CHARGE} bach gaye. Hum khud ghar tak pahunchate hain.
          </p>
        </div>
        <button type="button" onClick={() => setShow(false)} aria-label="Close" className="-mr-1 -mt-1 flex h-8 w-8 items-center justify-center rounded-full text-emerald-800 hover:bg-emerald-100">
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
