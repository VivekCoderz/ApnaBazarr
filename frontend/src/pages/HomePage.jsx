import { useState } from 'react';
import {
  ChevronDown, MessageCircle, Factory, PackageCheck, ClipboardCheck, ShoppingBag, Home as HomeIcon,
  UserPlus, Share2, Wallet, Phone, Mail, ArrowRight
} from 'lucide-react';
import HeroBanner from '../components/HeroBanner';
import TrustStrip from '../components/TrustStrip';
import CategoryShowcase from '../components/CategoryShowcase';
import WaitlistBand from '../components/WaitlistBand';
import ProductSpotlight, { ProductSpotlightSkeleton } from '../components/ProductSpotlight';
import RecentlyViewed from '../components/RecentlyViewed';
import ProductCard from '../components/ProductCard';
import Container, { Section } from '../components/ui/Container';
import SectionHeader from '../components/ui/SectionHeader';
import Button from '../components/ui/Button';
import { whatsappUrl, PHONE_DISPLAY, EMAIL } from '../config/store';
import { getActiveCampaign, sortForHomeGrid } from '../config/campaign';

const PAGE_SIZE = 12;
// Below this many live products the homepage also shows the "new stock" WhatsApp waitlist
const MIN_FULL_CATALOGUE = 8;
// From this many products the homepage shows a grid; below it a large "featured" spotlight
const MIN_FOR_GRID = 4;

const GRID_CLASS = 'grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 lg:grid-cols-4';

// Website plan §3.8, in English (return answer per the founder's return policy)
const FAQS = [
  {
    q: 'Do you offer cash on delivery?',
    a: 'Yes. Pay when your order arrives (orders up to ₹3,000). After you order, we confirm it with you on WhatsApp.'
  },
  {
    q: 'How long does delivery take?',
    a: 'We dispatch from Panipat within 2 days (Monday to Saturday). Delivery takes 2–4 days in Haryana and Delhi, and 4–8 days to the rest of India.'
  },
  {
    q: 'Can I return an item?',
    a: 'Yes, within 7 days of delivery if it is damaged, wrong or the wrong size. Message us on WhatsApp and we will arrange a free pickup. If you simply changed your mind, we offer an exchange.'
  },
  {
    q: 'When is delivery free?',
    a: 'On orders of ₹499 or more. Below that, delivery is ₹49.'
  },
  {
    q: 'Who are you?',
    a: 'We are from Panipat, and so are our products. Phone/WhatsApp: +91 93068 10726.'
  }
];

const STORY_POINTS = [
  { icon: Factory, title: 'Straight from Panipat makers', text: 'We buy directly in Panipat, without layers of wholesalers in between. That is why the price is lower.' },
  { icon: ClipboardCheck, title: 'We check every piece', text: 'Every item is checked and packed by us before it leaves Panipat.' },
  { icon: PackageCheck, title: 'Only what we can deliver', text: 'We list only stock that is ready to ship, so your order leaves within 2 days.' }
];

const STEPS = [
  { icon: ShoppingBag, title: 'Order on the website or WhatsApp', text: 'Choose your product and pay cash on delivery or online. We confirm your order on WhatsApp.' },
  { icon: PackageCheck, title: 'We check and pack it in Panipat', text: 'Your item is quality-checked and dispatched within 2 days, Monday to Saturday.' },
  { icon: HomeIcon, title: 'Delivered to your door', text: 'Pay cash when it arrives. Not right? 7-day return or exchange with free pickup.' }
];

const FACTS = [
  { label: 'Panipat, Haryana', big: 'City of Weavers', note: 'What India calls our home town' },
  { label: 'Home-furnishing exporters', big: '4,000+', note: 'firms in Panipat*' },
  { label: 'Dispatch', big: '2 days', note: 'Every order leaves Panipat within 2 days, Mon–Sat' }
];

const RESELLER_BENEFITS = [
  { icon: UserPlus, title: 'Free to join', text: 'No joining fee and no stock to buy.' },
  { icon: Share2, title: 'Share on WhatsApp', text: 'Send products to friends and family with your own link.' },
  { icon: Wallet, title: 'Commission to your UPI', text: 'Earn on every order that comes through your link.' }
];

function ProductsSection({ products, loading, onAddToCart, onQuickView, onToggleWishlist, wishlistItems, cartItems }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const campaign = getActiveCampaign();
  const gridTitle = campaign.gridTitle || 'All Products';
  const gridProducts = sortForHomeGrid(campaign, products);

  if (loading && products.length === 0) {
    return (
      <Section tone="cream" aria-label="Loading products">
        <SectionHeader eyebrow="Featured" title={gridTitle} />
        <ProductSpotlightSkeleton />
      </Section>
    );
  }
  if (gridProducts.length === 0) return null;

  const cardProps = (product) => ({
    product,
    onAddToCart,
    onQuickView,
    onToggleWishlist,
    isWishlisted: wishlistItems.some(item => item.id === product.id),
    isCartAdded: cartItems.some(item => item.id === product.id)
  });

  // 1–3 products: a large spotlight for the first, small cards for the rest
  if (gridProducts.length < MIN_FOR_GRID) {
    const [first, ...rest] = gridProducts;
    return (
      <Section tone="cream" aria-labelledby="home-grid-title">
        <SectionHeader
          id="home-grid-title"
          eyebrow="Featured"
          title={gridTitle}
          description="Hand-picked in Panipat and ready to ship."
          action={{ label: 'View all products', to: '/shop' }}
        />
        <ProductSpotlight
          product={first}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isWishlisted={wishlistItems.some(item => item.id === first.id)}
        />
        {rest.length > 0 && (
          <div className={`${GRID_CLASS} mt-6`}>
            {rest.map(product => <ProductCard key={product.id} {...cardProps(product)} />)}
          </div>
        )}
      </Section>
    );
  }

  const visibleProducts = gridProducts.slice(0, visibleCount);
  const remaining = gridProducts.length - visibleProducts.length;
  return (
    <Section tone="cream" aria-labelledby="home-grid-title">
      <SectionHeader
        id="home-grid-title"
        eyebrow={`${gridProducts.length} products`}
        title={gridTitle}
        action={{ label: 'View all', to: '/shop' }}
      />
      <div className={GRID_CLASS}>
        {visibleProducts.map(product => <ProductCard key={product.id} {...cardProps(product)} />)}
      </div>
      {remaining > 0 && (
        <div className="mt-8 flex justify-center">
          <Button variant="secondary" onClick={() => setVisibleCount(count => count + PAGE_SIZE)}>
            Load more ({remaining} more)
          </Button>
        </div>
      )}
    </Section>
  );
}

export default function HomePage({
  products = [],
  loading = false,
  recentlyViewed = [],
  onAddToCart,
  onQuickView,
  onToggleWishlist,
  wishlistItems = [],
  cartItems = []
}) {
  return (
    <div>
      <HeroBanner products={products} loading={loading} />

      {/* Trust promises, directly under the carousel */}
      <div className="border-b border-line bg-white">
        <Container className="py-5 sm:py-6">
          <TrustStrip />
        </Container>
      </div>

      {/* Shop by category: photo tiles for live categories, "Coming soon" tiles for the rest */}
      <Section aria-labelledby="home-categories-title" id="categories">
        <SectionHeader
          id="home-categories-title"
          title="Shop by category"
          description="Home textiles and suits from Panipat. More stock is on the way."
          action={{ label: 'View all', to: '/shop' }}
        />
        <CategoryShowcase products={products} loading={loading} />
      </Section>

      <ProductsSection
        products={products}
        loading={loading}
        onAddToCart={onAddToCart}
        onQuickView={onQuickView}
        onToggleWishlist={onToggleWishlist}
        wishlistItems={wishlistItems}
        cartItems={cartItems}
      />

      {/* Recently viewed: only when there is something worth showing */}
      {recentlyViewed.length >= 2 && (
        <RecentlyViewed
          items={recentlyViewed}
          onAddToCart={onAddToCart}
          onQuickView={onQuickView}
          onToggleWishlist={onToggleWishlist}
          wishlistItems={wishlistItems}
          cartItems={cartItems}
        />
      )}

      {/* Story: why we are cheaper */}
      <Section aria-labelledby="home-story-title">
        <div className="grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <div>
            <SectionHeader
              id="home-story-title"
              eyebrow="Straight from Panipat"
              title="Why our prices are lower"
              description="Panipat makes blankets, bedsheets and home textiles for homes across India and the world. We buy at the source and send them straight to you."
            />
            <ul className="divide-y divide-line border-y border-line">
              {STORY_POINTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4 py-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-navy" strokeWidth={1.5} aria-hidden="true" />
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">{title}</span>
                    <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <dl className="grid gap-px overflow-hidden rounded-lg bg-white/10 bg-brand-navy text-white">
            {FACTS.map(f => (
              <div key={f.big} className="bg-brand-navy px-6 py-6 sm:px-8">
                <dt className="text-sm text-white/70">{f.label}</dt>
                <dd className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">{f.big}</dd>
                <dd className="mt-1 text-sm text-white/70">{f.note}</dd>
              </div>
            ))}
            <div className="bg-brand-navy px-6 pb-4 sm:px-8">
              <p className="text-[11px] text-white/50">*Source: Apparel Resources</p>
            </div>
          </dl>
        </div>
      </Section>

      {/* How it works */}
      <Section tone="cream" aria-labelledby="home-steps-title">
        <SectionHeader id="home-steps-title" eyebrow="How it works" title="From Panipat to your door in 3 steps" />
        <ol className="grid gap-3 sm:gap-5 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-lg border border-line bg-white p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <Icon className="h-6 w-6 text-brand-navy" strokeWidth={1.5} aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-400">0{i + 1}</span>
              </div>
              <p className="mt-4 text-[15px] font-semibold text-ink">{title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{text}</p>
            </li>
          ))}
        </ol>
      </Section>

      {/* While the catalogue is small, turn visitors into a WhatsApp waitlist */}
      {!loading && products.length < MIN_FULL_CATALOGUE && (
        <Section className="!pb-0">
          <WaitlistBand />
        </Section>
      )}

      {/* Reseller band */}
      <Section aria-labelledby="home-reseller-title">
        <div className="grid items-center gap-8 rounded-lg bg-brand-navy px-5 py-8 sm:px-10 sm:py-10 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <SectionHeader
              id="home-reseller-title"
              onDark
              eyebrow="Reseller program"
              title="Earn from home with Dhagaro"
              description="Share our Panipat products with people you know. When they order through your link, you earn a commission."
              className="!mb-5"
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <Button to="/reseller" size="lg">
                Become a reseller <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button href={whatsappUrl('Hello Dhagaro, I would like to know more about becoming a reseller.')} variant="tertiaryOnDark">
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Chat with us first
              </Button>
            </div>
          </div>
          <ul className="divide-y divide-white/10 rounded-lg border border-white/15">
            {RESELLER_BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-4 px-5 py-4">
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-orange" strokeWidth={1.5} aria-hidden="true" />
                <span>
                  <span className="block text-[15px] font-semibold text-white">{title}</span>
                  <span className="mt-0.5 block text-sm text-white/70">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* FAQ */}
      <Section tone="cream" aria-labelledby="home-faq-title">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeader id="home-faq-title" eyebrow="Help" title="Frequently asked questions" className="!mb-5" />
            <div className="rounded-lg border border-line bg-white p-5 sm:p-6">
              <p className="text-[15px] font-semibold text-ink">Still have a question?</p>
              <p className="mt-1 text-sm text-slate-600">We reply on WhatsApp, Monday to Saturday.</p>
              <Button href={whatsappUrl('Hello Dhagaro, I have a question.')} variant="whatsapp" className="mt-4 w-full sm:w-auto">
                <MessageCircle className="h-5 w-5" aria-hidden="true" /> Chat on WhatsApp
              </Button>
              <div className="mt-4 space-y-1 border-t border-line pt-4 text-sm text-slate-700">
                <a href="tel:+919306810726" className="flex min-h-9 items-center gap-2 hover:text-brand-navy"><Phone className="h-4 w-4 text-slate-500" aria-hidden="true" />{PHONE_DISPLAY}</a>
                <a href={`mailto:${EMAIL}`} className="flex min-h-9 items-center gap-2 hover:text-brand-navy"><Mail className="h-4 w-4 text-slate-500" aria-hidden="true" />{EMAIL}</a>
              </div>
            </div>
          </div>

          <div>
            <div className="divide-y divide-line rounded-lg border border-line bg-white">
              {FAQS.map(({ q, a }, i) => (
                <details key={q} open={i === 0} className="group">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-5 py-3 text-[15px] font-medium text-ink">
                    <span>{q}</span>
                    <ChevronDown className="h-5 w-5 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
                </details>
              ))}
            </div>
            <p className="mt-5 text-xs leading-relaxed text-slate-500">
              Dhagaro sends blankets, bedsheets, cushion covers and women's suit sets from Panipat,
              Haryana at factory prices. Panipat is known as India's "City of Weavers" — we source there,
              check every piece and pack it ourselves. Cash on delivery across India, and free delivery on
              orders above ₹499.
            </p>
          </div>
        </div>
      </Section>
    </div>
  );
}
