import { useEffect, useState } from 'react';
import { Recycle, Truck, BadgePercent, QrCode, Shirt, MapPin } from 'lucide-react';
import { Section } from '../components/ui/Container';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import { formatPrice } from '../utils/format';
import { EXCHANGE_CREDIT, EXCHANGE_MIN_ORDER } from '../config/store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_TITLE = 'Dhagaro — Panipat se Seedha, Aapke Ghar Tak';

// /recycle: the old-clothes exchange (pilot in Panipat), the recycled range we are building,
// and the QR code on each mat. Impact numbers come from real collections only.
const STEPS = [
  { icon: Shirt, title: 'Tick the box at checkout', text: 'Ordering to a Panipat address? Tick "I\'ll hand over old clothes" on the payment step.' },
  { icon: Truck, title: 'Hand them over at delivery', text: 'Keep at least 1 kg (about 3–4 pieces) of clean old clothes, bedsheets, towels or an old mat ready in a bag. We collect them when we deliver.' },
  { icon: BadgePercent, title: `${formatPrice(EXCHANGE_CREDIT)} off your next order`, text: `Once collected, your next order of ${formatPrice(EXCHANGE_MIN_ORDER)} or more with the same phone number gets the discount automatically. No code needed.` }
];

const FAQ = [
  ['What can I give?', 'Any clean, dry textile: old clothes, bedsheets, towels, curtains or a used mat. No wet, oily or dirty items.'],
  ['Where does it go?', 'Panipat is known as the textile-recycling capital of the world. We hand what we collect to local recycling units, where it is turned back into yarn and new textiles.'],
  ['Is it only for Panipat?', 'Yes, for now. We deliver in Panipat ourselves, so we can collect at your door. More cities will follow.'],
  ['How many times can I use it?', `Every collection of 1 kg or more earns one ${formatPrice(EXCHANGE_CREDIT)} credit, used on your next order of ${formatPrice(EXCHANGE_MIN_ORDER)} or more.`]
];

function useImpact() {
  const [impact, setImpact] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/orders/impact`)
      .then(r => r.json().catch(() => ({})))
      .then(d => { if (alive && d && d.success) setImpact({ collections: d.collections, kg: d.kg }); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return impact;
}

export default function RecyclePage() {
  const impact = useImpact();
  useEffect(() => {
    document.title = 'Old clothes in, new mats out — Dhagaro';
    return () => { document.title = DEFAULT_TITLE; };
  }, []);

  return (
    <>
      <Section tone="cream">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
            <Recycle className="h-4 w-4" aria-hidden="true" /> Now piloting in Panipat
          </p>
          <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">Old clothes in, new mats out</h1>
          <p className="text-[15px] leading-relaxed text-slate-600 sm:text-base">
            Panipat is known as the textile-recycling capital of the world. Dhagaro is built right here, so we are
            closing the loop: give us your old clothes when we deliver, and get {formatPrice(EXCHANGE_CREDIT)} off your next order of {formatPrice(EXCHANGE_MIN_ORDER)}+.
          </p>
          {impact && impact.collections > 0 && (
            <div className="mx-auto grid max-w-sm grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-2xl font-semibold tabular-nums text-emerald-700">{impact.kg} kg</p>
                <p className="text-xs text-slate-500">textile collected</p>
              </div>
              <div className="rounded-xl bg-white p-3 ring-1 ring-line">
                <p className="text-2xl font-semibold tabular-nums text-emerald-700">{impact.collections}</p>
                <p className="text-xs text-slate-500">homes joined</p>
              </div>
            </div>
          )}
          <div className="pt-2"><Button to="/shop" size="lg">Shop mats</Button></div>
        </div>
      </Section>

      <Section>
        <SectionHeader eyebrow="Old-clothes exchange" title="How it works" />
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-line bg-white p-4">
              <s.icon className="h-6 w-6 text-emerald-700" aria-hidden="true" />
              <p className="mt-2 text-sm font-semibold text-ink">{i + 1}. {s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="peach">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <Recycle className="h-6 w-6 text-emerald-700" aria-hidden="true" />
            <h2 className="mt-2 text-lg font-semibold text-ink">Recycled range: coming soon</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              We are working with Panipat recycling units on mats and rugs made from recycled textile. Each one will
              show how much cloth it kept out of landfill.
            </p>
          </div>
          <div className="rounded-2xl bg-white p-5 ring-1 ring-line">
            <QrCode className="h-6 w-6 text-brand-navy" aria-hidden="true" />
            <h2 className="mt-2 text-lg font-semibold text-ink">A QR code on every mat</h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Scan it to see where your mat was made, what it is made of, how to care for it, and to order it again in one tap.
            </p>
          </div>
        </div>
      </Section>

      <Section containerClass="max-w-2xl">
        <SectionHeader title="Questions" />
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-4">
              <summary className="cursor-pointer list-none text-[15px] font-semibold text-ink">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{a}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" aria-hidden="true" /> Exchange is available on deliveries to Panipat pincodes (1321xx).</p>
      </Section>
    </>
  );
}
