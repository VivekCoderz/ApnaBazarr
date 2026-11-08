import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BedDouble, Building, Scissors, Dumbbell, Stethoscope, Check, Download, AlertCircle } from 'lucide-react';
import Container, { Section } from '../components/ui/Container';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import { buttonClass } from '../components/ui/buttonClass';
import WhatsAppIcon from '../components/ui/WhatsAppIcon';
import { whatsappUrl, normalizeIndianPhone, PHONE_DISPLAY, EMAIL } from '../config/store';
import { cloudinaryImage } from '../utils/format';

const RATE_CARD = '/bulk/Dhagaro-Wholesale-Rate-Card.pdf';
const DEFAULT_TITLE = 'Dhagaro — Panipat se Seedha, Aapke Ghar Tak';
const META_DESCRIPTION =
  'Bath mats in bulk for hotels, PGs, salons and gyms. Made in Panipat at wholesale rates, from 10 pieces. Free delivery and a free sample within Panipat.';

const QUOTE_MESSAGE =
  'Hi Dhagaro, I would like a bulk quote for bath mats.\nBusiness:\nQuantity:\nArea:';

// Wholesale rates per piece (keep in sync with business plan/b2b rate card).
// `match` is the live catalogue product name; `fallback` is used before products load.
const RATES = [
  {
    name: 'Microfiber bath mat',
    colours: 'Brown, Navy',
    small: 129,
    large: 115,
    match: 'Microfiber Bath Mat, Pack of 2',
    fallback: 'https://res.cloudinary.com/dnqvijzxj/image/upload/v1793626077/apna-bazarr/products/dwg6goc7ktejcb1aqj0y.jpg'
  },
  {
    name: 'Striped microfiber bath mat',
    colours: 'Navy & White, Brown & White',
    small: 129,
    large: 115,
    match: 'Striped Microfiber Bath Mat, Pack of 2',
    fallback: 'https://res.cloudinary.com/dnqvijzxj/image/upload/v1793626097/apna-bazarr/products/zcjmtlneaujo3zjqxjpa.jpg'
  },
  {
    name: 'Sherpa bath mat',
    colours: 'Teal',
    small: 99,
    large: 89,
    match: 'Sherpa Bath Mat, Teal Green',
    fallback: 'https://res.cloudinary.com/dnqvijzxj/image/upload/v1793626101/apna-bazarr/products/qoqhgymkdeagnxty61rc.jpg'
  },
  {
    name: '3D pebble bath mat',
    colours: 'Grey, Beige, Maroon',
    note: 'Limited batches',
    small: 179,
    large: 165,
    match: '3D Pebble Bath Mat',
    fallback: 'https://res.cloudinary.com/dnqvijzxj/image/upload/v1793626106/apna-bazarr/products/zk2kkkrmcw8fm0ryvp6j.jpg'
  },
  {
    name: 'Towels',
    colours: 'Hotel and gym towels',
    comingSoon: true,
    fallback: '/products/towels-480.webp'
  }
];

const TERMS = [
  'Minimum 10 pieces per order. You can mix colours.',
  'Free sample shown in person within Panipat.',
  'Free delivery within Panipat.',
  'Pay on delivery, in cash or by UPI.',
  'A damaged piece is replaced within 7 days.',
  'GST invoice on request.'
];

const AUDIENCE = [
  { icon: BedDouble, label: 'Hotels' },
  { icon: Building, label: 'PGs & hostels' },
  { icon: Scissors, label: 'Salons' },
  { icon: Dumbbell, label: 'Gyms' },
  { icon: Stethoscope, label: 'Hospitals & clinics' }
];

const BUSINESS_TYPES = ['Hotel', 'PG / Hostel', 'Salon', 'Gym', 'Hospital / Clinic', 'Other'];

const inputCls =
  'w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/15';

function QuoteForm() {
  const [form, setForm] = useState({ business: '', type: 'Hotel', quantity: '', phone: '', area: '' });
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    const phone = normalizeIndianPhone(form.phone);
    if (!phone) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const qty = parseInt(form.quantity, 10);
    if (!qty || qty < 10) {
      setError('The minimum bulk order is 10 pieces.');
      return;
    }
    const message = [
      'Hi Dhagaro, I would like a bulk quote for bath mats.',
      `Business name: ${form.business.trim()}`,
      `Business type: ${form.type}`,
      `Quantity: ${qty} pieces`,
      `Phone: ${phone.slice(2)}`,
      `Area: ${form.area.trim()}`
    ].join('\n');
    window.open(whatsappUrl(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" noValidate>
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-slate-700">Business name</span>
        <input value={form.business} onChange={set('business')} required maxLength={80} placeholder="e.g. Hotel Sky Inn" className={inputCls} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Type of business</span>
          <select value={form.type} onChange={set('type')} className={inputCls}>
            {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Quantity (pieces)</span>
          <input value={form.quantity} onChange={set('quantity')} required type="number" min="10" inputMode="numeric" placeholder="Minimum 10" className={inputCls} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Mobile number</span>
          <input value={form.phone} onChange={set('phone')} required inputMode="tel" autoComplete="tel" placeholder="10-digit number" className={inputCls} />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-slate-700">Area / city</span>
          <input value={form.area} onChange={set('area')} required maxLength={80} placeholder="e.g. Model Town, Panipat" className={inputCls} />
        </label>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm font-medium text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}
      <button type="submit" className={buttonClass('primary', 'lg', 'w-full')}>
        <WhatsAppIcon className="h-5 w-5" />
        Send quote request on WhatsApp
      </button>
      <p className="text-xs text-slate-500">This opens WhatsApp with your details filled in. Nothing is saved on our website.</p>
    </form>
  );
}

export default function BulkOrdersPage({ products = [] }) {
  useEffect(() => {
    document.title = 'Bulk Bath Mats for Hotels, PGs, Salons & Gyms — Dhagaro';
    const meta = document.querySelector('meta[name="description"]');
    const previous = meta?.getAttribute('content');
    if (meta) meta.setAttribute('content', META_DESCRIPTION);
    return () => {
      document.title = DEFAULT_TITLE;
      if (meta && previous) meta.setAttribute('content', previous);
    };
  }, []);

  const productFor = (row) => (row.match ? products.find(p => p.name?.trim() === row.match) : null);

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-brand-navy text-white">
        <Container className="py-10 sm:py-16">
          <div className="max-w-3xl space-y-4">
            <p className="text-sm font-medium text-brand-orange">Bulk &amp; wholesale orders</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
              Bath mats in bulk for hotels, PGs, salons &amp; gyms
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/80 sm:text-lg">
              Made-in-Panipat quality at wholesale rates. Free delivery and a free sample within Panipat.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button href={whatsappUrl(QUOTE_MESSAGE)} variant="primary" size="lg">
                <WhatsAppIcon className="h-5 w-5" />
                Get a quote on WhatsApp
              </Button>
              <a href={RATE_CARD} download className={buttonClass('secondaryOnDark', 'lg')}>
                <Download className="h-5 w-5" aria-hidden="true" />
                Download rate card
              </a>
            </div>
          </div>
        </Container>
      </section>

      {/* Who it's for */}
      <section className="border-b border-slate-200 bg-slate-50" aria-label="Who it's for">
        <Container className="py-6">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {AUDIENCE.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
                <Icon className="h-5 w-5 shrink-0 text-brand-navy" strokeWidth={1.75} aria-hidden="true" />
                <span className="text-sm font-medium text-ink">{label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Rates */}
      <Section tone="white">
        <SectionHeader
          eyebrow="Wholesale rates"
          title="Price per piece"
          description="Rates include delivery within Panipat. Outside Panipat, ask us for delivery charges."
        />

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Product</th>
                <th scope="col" className="px-4 py-3 font-semibold">Colours</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">10–24 pcs</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">25+ pcs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {RATES.map(row => {
                const product = productFor(row);
                const img = cloudinaryImage(product?.image || row.fallback, 160, 'c_fill,ar_1:1');
                return (
                  <tr key={row.name}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={img} alt="" width="56" height="56" loading="lazy" className="h-14 w-14 rounded-lg bg-slate-100 object-cover" />
                        <div>
                          {product ? (
                            <Link to={`/product/${product.id}`} className="font-semibold text-ink hover:text-brand-cta">{row.name}</Link>
                          ) : (
                            <span className="font-semibold text-ink">{row.name}</span>
                          )}
                          {row.note && <p className="text-xs text-slate-500">{row.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{row.colours}</td>
                    {row.comingSoon ? (
                      <td colSpan={2} className="px-4 py-3 text-right text-slate-600">Coming soon — ask for rates</td>
                    ) : (
                      <>
                        <td className="px-4 py-3 text-right font-semibold text-ink">₹{row.small}</td>
                        <td className="px-4 py-3 text-right font-semibold text-brand-navy">₹{row.large}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {RATES.map(row => {
            const product = productFor(row);
            const img = cloudinaryImage(product?.image || row.fallback, 200, 'c_fill,ar_1:1');
            return (
              <li key={row.name} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                <img src={img} alt="" width="80" height="80" loading="lazy" className="h-20 w-20 shrink-0 rounded-lg bg-slate-100 object-cover" />
                <div className="min-w-0 flex-1 space-y-1">
                  {product ? (
                    <Link to={`/product/${product.id}`} className="block font-semibold text-ink">{row.name}</Link>
                  ) : (
                    <p className="font-semibold text-ink">{row.name}</p>
                  )}
                  <p className="text-xs text-slate-600">
                    {row.colours}{row.note && ` · ${row.note}`}
                  </p>
                  {row.comingSoon ? (
                    <p className="text-sm text-slate-600">Coming soon — ask for rates</p>
                  ) : (
                    <dl className="grid grid-cols-2 gap-2 pt-1 text-sm">
                      <div className="rounded-md bg-slate-50 px-2 py-1.5">
                        <dt className="text-xs text-slate-500">10–24 pcs</dt>
                        <dd className="font-semibold text-ink">₹{row.small}</dd>
                      </div>
                      <div className="rounded-md bg-slate-50 px-2 py-1.5">
                        <dt className="text-xs text-slate-500">25+ pcs</dt>
                        <dd className="font-semibold text-brand-navy">₹{row.large}</dd>
                      </div>
                    </dl>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-slate-500">All prices are per piece. The rate on your written quote is final.</p>
      </Section>

      {/* Terms + quote form */}
      <Section tone="cream">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
          <div>
            <SectionHeader eyebrow="How it works" title="Simple terms" />
            <ul className="space-y-3">
              {TERMS.map(term => (
                <li key={term} className="flex items-start gap-3 text-[15px] text-slate-700">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" aria-hidden="true" />
                  {term}
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1 text-sm text-slate-600">
              <p>Prefer to call? <a href={`tel:+${PHONE_DISPLAY.replace(/\D/g, '')}`} className="font-semibold text-brand-navy hover:text-brand-cta">{PHONE_DISPLAY}</a></p>
              <p>Email: <a href={`mailto:${EMAIL}`} className="font-semibold text-brand-navy break-all hover:text-brand-cta">{EMAIL}</a></p>
            </div>
          </div>
          <div>
            <SectionHeader eyebrow="Get a quote" title="Tell us what you need" description="Fill this in and we reply on WhatsApp with your quote." />
            <QuoteForm />
          </div>
        </div>
      </Section>
    </div>
  );
}
