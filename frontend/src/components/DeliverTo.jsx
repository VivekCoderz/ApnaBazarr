import { useEffect, useRef, useState } from 'react';
import { MapPin, ChevronDown, LocateFixed, Loader2, AlertCircle, X } from 'lucide-react';
import { usePincode, usePlace, savePincode, pincodeFromCurrentLocation } from '../utils/location';
import { isPanipatPincode, FREE_DELIVERY_ABOVE, DELIVERY_CHARGE, PANIPAT_VOUCHER_AMOUNT, PANIPAT_VOUCHER_MIN } from '../config/store';

// Header "Deliver to <pincode>" chip (like Amazon) with a small popover: type a pincode or
// "Use my current location". Location is asked for ONLY when that button is tapped.
// variant "desktop": two-line chip next to the logo; "mobile": slim line under the search.
export default function DeliverTo({ variant = 'desktop' }) {
  const pin = usePincode();
  const place = usePlace(pin);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  const panipat = isPanipatPincode(pin);
  const placeLabel = place?.district ? `${place.district} ${pin}` : pin;

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      setDraft(pin);
      setError('');
    }
    setOpen(o => !o);
  };

  const apply = (e) => {
    e.preventDefault();
    if (!savePincode(draft)) {
      setError('Please enter a 6-digit pincode.');
      inputRef.current?.focus();
      return;
    }
    setError('');
    setOpen(false);
  };

  const locateMe = async () => {
    if (locating) return;
    setLocating(true);
    setError('');
    try {
      const found = await pincodeFromCurrentLocation();
      savePincode(found);
      setDraft(found);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  };

  const desktop = variant === 'desktop';

  return (
    <div ref={rootRef} className={desktop ? 'relative' : 'relative pb-2'}>
      {desktop ? (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex h-11 items-center gap-1.5 rounded-lg px-2 text-left transition-colors hover:bg-brand-cream active:bg-blue-100"
        >
          <MapPin className="h-4 w-4 shrink-0 text-brand-navy" aria-hidden="true" />
          <span className="leading-tight">
            <span className="block text-[11px] text-slate-500">{panipat ? 'Free delivery to' : 'Deliver to'}</span>
            <span className="block max-w-[140px] truncate text-sm font-semibold text-ink">{pin ? placeLabel : 'Enter pincode'}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      ) : (
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          className="flex min-h-8 w-full items-center gap-1.5 text-left text-xs text-slate-600"
        >
          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-navy" aria-hidden="true" />
          <span className="min-w-0 truncate">
            {pin ? <>Deliver to <span className="font-semibold text-ink">{placeLabel}</span></> : <span className="font-semibold text-brand-navy">Enter pincode for delivery info</span>}
            {panipat && <span className="font-semibold text-emerald-700"> · Free delivery</span>}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden="true" />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Choose delivery pincode"
          className={`absolute z-50 mt-1 rounded-lg border border-line bg-white p-4 shadow-lift animate-fade-in ${desktop ? 'left-0 top-full w-80' : 'left-0 right-0 top-full'}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-brand-navy">Where should we deliver?</p>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="-mr-2 flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="mb-3 text-xs text-slate-600">
            <span className="font-semibold text-emerald-700">Free delivery in Panipat on every order, plus ₹{PANIPAT_VOUCHER_AMOUNT} off your first order.</span>{' '}
            Elsewhere free above ₹{FREE_DELIVERY_ABOVE}, otherwise ₹{DELIVERY_CHARGE}.
          </p>
          <form onSubmit={apply} className="flex gap-2">
            <label htmlFor={`deliver-pin-${variant}`} className="sr-only">Pincode</label>
            <input
              ref={inputRef}
              id={`deliver-pin-${variant}`}
              inputMode="numeric"
              autoComplete="postal-code"
              maxLength={6}
              value={draft}
              onChange={(e) => { setDraft(e.target.value.replace(/\D/g, '')); setError(''); }}
              placeholder="6-digit pincode"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-ink placeholder:text-slate-400 focus:border-brand-navy focus:outline-none sm:text-sm"
            />
            <button type="submit" className="min-h-10 rounded-lg bg-brand-navy px-4 text-sm font-semibold text-white hover:bg-blue-700">
              Apply
            </button>
          </form>
          <button
            type="button"
            onClick={locateMe}
            disabled={locating}
            className="mt-2 flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-line text-sm font-semibold text-brand-navy hover:bg-brand-cream disabled:opacity-60"
          >
            {locating
              ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              : <LocateFixed className="h-4 w-4" aria-hidden="true" />}
            {locating ? 'Finding your pincode…' : 'Use my current location'}
          </button>
          {error && (
            <p role="alert" className="mt-2 flex items-start gap-1.5 text-xs text-[#B91C1C]">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden="true" />{error}
            </p>
          )}
          {pin && !error && (
            <p className="mt-2 text-xs text-slate-500">
              Now: {place ? `${place.district}, ${place.state}` : 'Pincode'} ({pin})
              {panipat && <span className="block font-semibold text-emerald-700">FREE delivery — we deliver in Panipat ourselves</span>}
              {panipat && <span className="block font-semibold text-emerald-700">Plus ₹{PANIPAT_VOUCHER_AMOUNT} off your first order (₹{PANIPAT_VOUCHER_MIN}+)</span>}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
