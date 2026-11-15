import { MessageCircle, Phone, BadgeCheck } from 'lucide-react';
import { Section } from './ui/Container';
import Button from './ui/Button';
import { whatsappUrl, PHONE_DISPLAY } from '../config/store';

// A real person behind a new brand: the biggest trust signal we can give for free.
export default function FounderNote() {
  return (
    <Section tone="cream" aria-labelledby="founder-title">
      <div className="mx-auto flex max-w-3xl flex-col gap-5 rounded-2xl border border-line bg-white p-5 shadow-card sm:flex-row sm:items-start sm:p-7">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-navy text-2xl font-semibold text-white" aria-hidden="true">V</div>
        <div className="space-y-3">
          <p className="text-sm font-medium text-brand-cta">A note from the founder</p>
          <h2 id="founder-title" className="text-xl font-semibold leading-snug text-ink sm:text-2xl">
            Hi, I'm Vivek, a student from Panipat.
          </h2>
          <p className="text-[15px] leading-relaxed text-slate-700">
            I started Dhagaro with three college friends to bring Panipat's home textiles straight to your home,
            without the middlemen. I check and pack every mat myself before it leaves Panipat. Pay only when it arrives, and
            if anything is wrong, we take it back within 7 days.
          </p>
          <p className="flex items-center gap-1.5 text-sm text-slate-600">
            <BadgeCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
            MSME (Udyam) registered business · Geeta University student startup
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button href={whatsappUrl('Hi Vivek, I have a question about Dhagaro mats.')} variant="whatsapp" size="sm">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask me on WhatsApp
            </Button>
            <Button href={`tel:${PHONE_DISPLAY.replace(/\s/g, '')}`} variant="secondary" size="sm">
              <Phone className="h-4 w-4" aria-hidden="true" /> Call {PHONE_DISPLAY}
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
}
