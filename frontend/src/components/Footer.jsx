import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, MessageCircle, Banknote } from 'lucide-react';
import { whatsappUrl, CATEGORIES, PHONE_DISPLAY, EMAIL, COD_MAX_AMOUNT, categoryHref } from '../config/store';
import { formatPrice } from '../utils/format';
import Button from './ui/Button';

const HELP_LINKS = [
  { to: '/shipping', label: 'Shipping Policy' },
  { to: '/refunds', label: 'Returns & Refunds' },
  { to: '/orders', label: 'Track my orders' },
  { to: '/contact', label: 'Contact us' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/privacy', label: 'Privacy Policy' }
];

const linkCls = 'inline-flex min-h-8 items-center text-sm text-white/70 transition-colors hover:text-white';

export default function Footer({ products = [] }) {
  // Only link categories that have live products (no empty pages)
  const liveCategories = CATEGORIES.filter(c => products.some(p => p.category === c.name));
  return (
    <footer className="bg-blue-800 text-white">
      <div aria-hidden="true" className="h-[3px] bg-brand-orange" />
      <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 border-b border-white/10 pb-10 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">

          {/* Brand */}
          <div className="col-span-2 space-y-4 lg:col-span-1">
            <Link to="/" className="inline-flex" aria-label="Dhagaro home">
              <img src="/dhagaro-logo-white.svg" alt="Dhagaro" className="h-10 w-auto" />
            </Link>
            <p className="text-lg font-semibold text-brand-orange">Panipat se Seedha, Aapke Ghar Tak</p>
            <p className="max-w-sm text-sm leading-relaxed text-white/70">
              Blankets, bedsheets, cushion covers and women's suit sets from Panipat, India's City of Weavers, at factory prices with cash on delivery.
            </p>
            <Button href={whatsappUrl('Hello Dhagaro, I have a question.')} variant="whatsapp" size="sm">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat on WhatsApp
            </Button>
          </div>

          {/* Shop */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-white">Shop</h2>
            <ul className="space-y-1">
              {liveCategories.map(category => (
                <li key={category.name}>
                  <Link to={categoryHref(category.name)} className={linkCls}>{category.label}</Link>
                </li>
              ))}
              <li><Link to="/shop" className={linkCls}>All Products</Link></li>
              <li><Link to="/reseller" className={linkCls}>Become a Reseller</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div>
            <h2 className="mb-3 text-base font-semibold text-white">Help</h2>
            <ul className="space-y-1">
              {HELP_LINKS.map(link => (
                <li key={link.to}><Link to={link.to} className={linkCls}>{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-1">
            <h2 className="mb-3 text-base font-semibold text-white">Contact</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <a href={whatsappUrl()} target="_blank" rel="noreferrer" className={`${linkCls} gap-2`}>
                  <MessageCircle className="h-4 w-4 text-brand-orange" aria-hidden="true" /> WhatsApp {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href="tel:+919306810726" className={`${linkCls} gap-2`}>
                  <Phone className="h-4 w-4 text-brand-orange" aria-hidden="true" /> {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={`mailto:${EMAIL}`} className={`${linkCls} gap-2`}>
                  <Mail className="h-4 w-4 text-brand-orange" aria-hidden="true" /> {EMAIL}
                </a>
              </li>
              <li className={`${linkCls} gap-2 hover:text-white/70`}>
                <MapPin className="h-4 w-4 text-brand-orange" aria-hidden="true" /> Panipat, Haryana, India
              </li>
            </ul>
            <p className="mt-4 text-xs text-white/60">We reply Monday to Saturday.</p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col gap-4 pt-6 text-xs text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 <span className="font-semibold text-white/80">Dhagaro</span>, Panipat.</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1 font-semibold text-white/90">
              <Banknote className="h-3.5 w-3.5 text-brand-orange" aria-hidden="true" /> Cash on Delivery up to {formatPrice(COD_MAX_AMOUNT)}
            </span>
            <span className="rounded bg-white/10 px-2.5 py-1 font-semibold text-white/90">UPI &amp; cards via Razorpay</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
