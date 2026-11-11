import { useEffect, useMemo, useState } from 'react';
import { MapPin, Truck, Banknote, AlertCircle } from 'lucide-react';

// "Check delivery" on the product page: delivery date range + whether Cash on Delivery is
// available for this pincode. Rules mirror the backend (orders: 'cod-panipat-only' tag) and
// our shipping promise (dispatch in 2 days Mon–Sat; Panipat we deliver ourselves,
// Haryana/Delhi 2–4 days, rest of India 4–8 days). The pincode is remembered for checkout.
const PINCODE_KEY = 'dhagaro_pincode'; // also prefills the checkout pincode
const PANIPAT = /^1321\d\d$/;

const zoneFor = (pin) => {
  if (PANIPAT.test(pin)) return { name: 'Panipat', min: 0, max: 1, note: 'We deliver in Panipat ourselves' };
  if (/^1[123]/.test(pin)) return { name: 'Haryana / Delhi', min: 2, max: 4 };
  return { name: 'rest of India', min: 4, max: 8 };
};

// Add n working days (Sundays skipped)
const addWorkingDays = (date, n) => {
  const d = new Date(date);
  let left = n;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) left -= 1;
  }
  return d;
};
const fmt = (d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

const readSaved = () => {
  try { return localStorage.getItem(PINCODE_KEY) || ''; } catch { return ''; }
};

function computeResult(p, product) {
  if (!/^\d{6}$/.test(p)) return null;
  const zone = zoneFor(p);
  const today = new Date();
  const tags = (product?.tags || []).map(t => String(t).toLowerCase());
  return {
    pin: p,
    zone,
    from: addWorkingDays(today, 1 + zone.min),
    to: addWorkingDays(today, 2 + zone.max),
    codAlone: !(tags.includes('cod-panipat-only') && !PANIPAT.test(p)),
  };
}

export default function PincodeCheck({ product }) {
  const [pin, setPin] = useState(readSaved);
  // The pincode last checked (a pincode saved on an earlier visit counts as checked)
  const [checked, setChecked] = useState(() => (/^\d{6}$/.test(readSaved()) ? readSaved() : ''));
  const [error, setError] = useState('');
  const [place, setPlace] = useState({ pin: '', name: '' });
  const result = useMemo(() => computeResult(checked, product), [checked, product]);

  const check = () => {
    const p = String(pin).trim();
    if (!/^\d{6}$/.test(p)) { setError('Please enter a 6-digit pincode.'); return; }
    setError('');
    try { localStorage.setItem(PINCODE_KEY, p); } catch { /* storage blocked */ }
    setChecked(p);
  };

  // Best effort: show the district for the pincode (free India Post API)
  useEffect(() => {
    if (!checked) return undefined;
    let cancelled = false;
    fetch(`https://api.postalpincode.in/pincode/${checked}`)
      .then(r => r.json())
      .then(data => {
        const po = data?.[0]?.PostOffice?.[0];
        if (!cancelled && po) setPlace({ pin: checked, name: `${po.District}, ${po.State}` });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [checked]);
  const placeName = place.pin === checked ? place.name : '';

  return (
    <div className="rounded-lg border border-line p-4">
      <form
        className="flex gap-2"
        onSubmit={(e) => { e.preventDefault(); check(); }}
      >
        <label htmlFor="pdp-pincode" className="sr-only">Delivery pincode</label>
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="pdp-pincode"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter pincode"
            className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-base text-ink placeholder:text-slate-400 focus:border-brand-navy focus:outline-none sm:text-sm"
          />
        </div>
        <button type="submit" className="min-h-11 rounded-lg border border-brand-navy px-4 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white">
          Check
        </button>
      </form>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-[#B91C1C]"><AlertCircle className="h-4 w-4" aria-hidden="true" />{error}</p>
      )}
      {result && !error && (
        <ul className="mt-3 space-y-2 text-sm">
          {placeName && <li className="text-slate-500">Delivering to {placeName} ({result.pin})</li>}
          <li className="flex items-start gap-2">
            <Truck className="mt-0.5 h-4 w-4 shrink-0 text-brand-cta" aria-hidden="true" />
            <span>
              <span className="font-semibold text-ink">Delivery by {fmt(result.from)} – {fmt(result.to)}</span>
              {result.zone.note && <span className="block text-xs text-slate-500">{result.zone.note}</span>}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <Banknote className={`mt-0.5 h-4 w-4 shrink-0 ${result.codAlone ? 'text-emerald-700' : 'text-amber-600'}`} aria-hidden="true" />
            {result.codAlone ? (
              <span className="font-semibold text-emerald-700">Cash on Delivery available</span>
            ) : (
              <span className="text-slate-700">
                <span className="font-semibold">Cash on Delivery for this mat alone is only in Panipat.</span>{' '}
                Add another bath mat to your order, or pay online.
              </span>
            )}
          </li>
        </ul>
      )}
    </div>
  );
}
