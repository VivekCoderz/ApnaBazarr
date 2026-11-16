import { useEffect } from 'react';
import { CheckCircle2, MapPin, XCircle } from 'lucide-react';
import { Section } from './ui/Container';
import SectionHeader from './ui/SectionHeader';
import { formatPrice } from '../utils/format';
import { usePincode } from '../utils/location';
import { isPanipatPincode, EXCHANGE_CREDIT, EXCHANGE_MIN_ORDER, EXCHANGE_MIN_KG } from '../config/store';

// The full rules of the old-clothes exchange, in one place, plus "am I eligible?"
const RULES = [
  ['Panipat only', 'The exchange is available on deliveries to Panipat pincodes (1321xx), where we deliver ourselves.'],
  ['Tick the box at checkout', 'Choose "I\'ll hand over old clothes or an old mat at delivery" on the payment step, before you place the order.'],
  [`At least ${EXCHANGE_MIN_KG} kg`, `Keep at least ${EXCHANGE_MIN_KG} kg (about 3–4 pieces) ready in a bag. We weigh it at your door, in front of you.`],
  ['Clean and dry only', 'Old clothes, bedsheets, towels, curtains or a used mat. Torn is fine; wet, oily or dirty items are not.'],
  [`${formatPrice(EXCHANGE_CREDIT)} off your next order`, `Each collection earns one ${formatPrice(EXCHANGE_CREDIT)} credit, applied automatically on your next order of ${formatPrice(EXCHANGE_MIN_ORDER)} or more placed with the same phone number.`],
  ['One credit per order, not cash', 'A credit cannot be exchanged for cash and is not combined with the first-order offer; the bigger saving is applied.'],
  ['Less than 1 kg?', 'We can still take it for recycling, but it does not earn a credit. Bring a little more next time.']
];
const ACCEPTED = ['Old clothes (any size)', 'Bedsheets & pillow covers', 'Towels', 'Curtains', 'Used bath mats'];
const NOT_ACCEPTED = ['Wet or oily items', 'Shoes & bags', 'Plastic or non-textile waste'];

export default function ExchangeRules() {
  const pin = usePincode();
  // Links to /recycle#rules land on this section (after the app's scroll-to-top on page change)
  useEffect(() => {
    if (window.location.hash !== '#rules') return undefined;
    const t = setTimeout(() => document.getElementById('rules')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 350);
    return () => clearTimeout(t);
  }, []);
  const known = /^\d{6}$/.test(pin || '');
  const eligible = known && isPanipatPincode(pin);

  return (
    <Section id="rules" aria-labelledby="rules-title">
      <SectionHeader id="rules-title" eyebrow="Before you start" title="Exchange rules" />

      <div className={`mb-5 flex items-start gap-3 rounded-xl p-4 text-sm ring-1 ${eligible ? 'bg-emerald-50 text-emerald-900 ring-emerald-200' : 'bg-amber-50 text-amber-900 ring-amber-200'}`}>
        <MapPin className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <p>
          {eligible && <><b>Your pincode {pin} is in Panipat.</b> You can use the exchange on your next order.</>}
          {known && !eligible && <><b>Your pincode {pin} is outside Panipat.</b> The exchange is only in Panipat for now; you can still order mats with cash on delivery.</>}
          {!known && <><b>Only for Panipat (1321xx) right now.</b> Set your pincode at the top of the page to check.</>}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        {RULES.map(([title, text], i) => (
          <li key={title} className="flex gap-3 rounded-xl border border-line bg-white p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">{i + 1}</span>
            <span>
              <span className="block text-[15px] font-semibold text-ink">{title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{text}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-emerald-50 p-4 ring-1 ring-emerald-200">
          <p className="mb-2 text-sm font-semibold text-emerald-900">We accept</p>
          <ul className="space-y-1 text-sm text-emerald-900">{ACCEPTED.map(a => <li key={a} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />{a}</li>)}</ul>
        </div>
        <div className="rounded-xl bg-red-50 p-4 ring-1 ring-red-200">
          <p className="mb-2 text-sm font-semibold text-red-900">We can't take</p>
          <ul className="space-y-1 text-sm text-red-900">{NOT_ACCEPTED.map(a => <li key={a} className="flex items-center gap-2"><XCircle className="h-4 w-4" aria-hidden="true" />{a}</li>)}</ul>
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">This is a pilot. We may change or end it with notice on this page; credits already earned will always be honoured.</p>
    </Section>
  );
}
