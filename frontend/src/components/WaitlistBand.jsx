import { Check, MessageCircle, Layers, BedDouble, Sofa } from 'lucide-react';
import { whatsappUrl } from '../config/store';
import Button from './ui/Button';

const UPCOMING = [
  { icon: Layers, label: 'Blankets & dohars' },
  { icon: BedDouble, label: 'Bedsheets' },
  { icon: Sofa, label: 'Cushion & sofa covers' }
];

// "New stock arriving" panel: turns visitors into a WhatsApp waitlist while the catalogue is small
export default function WaitlistBand() {
  return (
    <div className="grid items-center gap-6 rounded-lg border border-line bg-white p-5 sm:p-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-12">
      <div className="space-y-3">
        <p className="flex items-center gap-2 text-sm font-medium text-brand-cta">
          <span className="h-3.5 w-0.5 bg-brand-orange" aria-hidden="true" />
          New stock arriving
        </p>
        <h2 className="text-xl font-semibold leading-tight tracking-tight text-ink sm:text-2xl">
          Panipat blankets, dohars and bedsheets are coming soon
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
          We only list what we can deliver today. Join the WhatsApp list to get the first look and launch prices when new stock is in.
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-700">
          {['First look at new arrivals', 'Launch prices', 'No spam'].map(item => (
            <li key={item} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-emerald-700" strokeWidth={2} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <Button
            variant="whatsapp"
            size="lg"
            href={whatsappUrl('Hi Dhagaro, please notify me when blankets and bedsheets are available.')}
            className="w-full sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
            Notify me on WhatsApp
          </Button>
        </div>
      </div>

      <ul className="divide-y divide-line rounded-lg border border-line bg-brand-cream/60" aria-label="Coming soon">
        {UPCOMING.map(({ icon: Icon, label }) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3.5">
            <Icon className="h-5 w-5 shrink-0 text-brand-navy" strokeWidth={1.5} aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-ink">{label}</span>
            <span className="rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 ring-1 ring-inset ring-line">Coming soon</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
