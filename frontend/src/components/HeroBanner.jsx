import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ChevronLeft, ChevronRight, MessageCircle, Pause, Play,
  Layers, BedDouble, Sofa, UserPlus, Share2, Wallet
} from 'lucide-react';
import { getHeroSlides, AUTOPLAY_MS } from '../config/campaign';
import { formatPrice, displayName, discountPercent } from '../utils/format';
import Container from './ui/Container';
import Button from './ui/Button';
import Badge from './ui/Badge';
import TextileScene from './HomeTextiles3D';

// Slide transition kept short so the 2-second autoplay still feels calm
const DURATION = 450;

// Two calm themes: navy (white text) and light grey (navy text, thin orange accent)
const THEMES = {
  navy: {
    bg: 'bg-brand-navy', title: 'text-white', sub: 'text-white/75', kicker: 'text-brand-orange',
    cta: 'primary', dark: true
  },
  light: {
    bg: 'bg-brand-cream', title: 'text-ink', sub: 'text-slate-600', kicker: 'text-brand-cta',
    cta: 'primary', dark: false
  }
};

// Cloudinary transform helper (crop + auto format/quality)
const cdn = (url, t) =>
  url && url.includes('res.cloudinary.com') && url.includes('/upload/')
    ? url.replace('/upload/', `/upload/${t}/`)
    : url;

/* ── Right-hand panels ─────────────────────────────────────────────── */

// Product photo, cleanly framed, with name + price label
function PhotoPanel({ slide, eager }) {
  const p = slide.product;
  const off = p ? discountPercent(p) : 0;
  return (
    <Link
      to={p ? `/product/${p.id}` : '/shop'}
      tabIndex={-1}
      draggable="false"
      className="group relative block h-full w-full overflow-hidden rounded-lg bg-white shadow-lift lg:aspect-[4/5] lg:w-auto"
    >
      <img
        src={cdn(slide.image, 'w_720,h_900,c_fill,g_auto,q_auto,f_auto')}
        alt={p ? displayName(p.name) : ''}
        width="720"
        height="900"
        loading={eager ? 'eager' : 'lazy'}
        draggable="false"
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
      />
      {off > 0 && <Badge tone="sale" className="absolute left-3 top-3">{off}% off</Badge>}
      {p && (
        <span className="absolute inset-x-3 bottom-3 hidden items-center justify-between gap-3 rounded-md bg-white/95 px-3 py-2 shadow-card lg:flex">
          <span className="truncate text-sm font-medium text-ink">{displayName(p.name)}</span>
          <span className="shrink-0 text-base font-semibold text-brand-cta">{formatPrice(p.price)}</span>
        </span>
      )}
    </Link>
  );
}

// Desktop: main photo plus two zoomed detail crops of the same photo (lookbook style)
function PhotoCollage({ slide, eager }) {
  const src = cdn(slide.image, 'w_720,h_900,c_fill,g_auto,q_auto,f_auto');
  const detail = (pos) => (
    <span className="block aspect-square w-[150px] overflow-hidden rounded-lg bg-white shadow-lift xl:w-[170px]">
      <img src={src} alt="" loading="lazy" draggable="false" className="h-full w-full scale-[1.9] object-cover" style={{ objectPosition: pos, transformOrigin: pos }} />
    </span>
  );
  return (
    <div className="flex h-full w-full items-center gap-4 lg:w-auto">
      <div className="hidden flex-col gap-4 lg:flex" aria-hidden="true">
        {detail('30% 20%')}
        {detail('70% 75%')}
      </div>
      <PhotoPanel slide={slide} eager={eager} />
    </div>
  );
}

function PhotoSkeleton() {
  return <div className="h-full w-full animate-pulse rounded-lg bg-white/10 lg:aspect-[4/5] lg:w-auto" aria-hidden="true" />;
}

// Large clean figures on navy: free delivery / COD / returns
function OfferPanel() {
  const items = [
    { big: '₹499', small: 'Free delivery above' },
    { big: 'COD', small: 'Pay on delivery, up to ₹3,000' },
    { big: '7 days', small: 'Easy return or exchange' }
  ];
  return (
    <ul className="grid w-full grid-cols-3 divide-x divide-white/15 rounded-lg border border-white/15 bg-white/[0.04] lg:max-w-[520px]">
      {items.map(i => (
        <li key={i.big} className="px-3 py-4 sm:px-5 lg:py-8">
          <span className="block text-2xl font-semibold tracking-tight text-white sm:text-3xl lg:text-[40px] lg:leading-none">{i.big}</span>
          <span className="mt-1.5 block text-xs leading-snug text-white/70 sm:text-sm">{i.small}</span>
        </li>
      ))}
    </ul>
  );
}

function ListPanel({ title, rows }) {
  return (
    <div className="w-full rounded-lg border border-line bg-white shadow-card lg:max-w-[440px]">
      <p className="border-b border-line px-4 py-2.5 text-xs font-semibold text-slate-500 sm:px-5">{title}</p>
      <ul className="divide-y divide-line">
        {rows.map(({ icon: Icon, label, note }) => (
          <li key={label} className="flex items-center gap-3 px-4 py-3 sm:px-5 lg:py-4">
            <Icon className="h-5 w-5 shrink-0 text-brand-navy" strokeWidth={1.5} aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-ink">{label}</span>
            <span className="text-xs text-slate-500">{note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const WAITLIST_ROWS = [
  { icon: Layers, label: 'Blankets & dohars', note: 'Coming soon' },
  { icon: BedDouble, label: 'Bedsheets', note: 'Coming soon' },
  { icon: Sofa, label: 'Cushion & sofa covers', note: 'Coming soon' }
];
const RESELLER_ROWS = [
  { icon: UserPlus, label: 'Join free', note: 'No fees, no stock' },
  { icon: Share2, label: 'Share on WhatsApp', note: 'Your own links' },
  { icon: Wallet, label: 'Earn commission', note: 'Paid to your UPI' }
];

function SidePanel({ slide, eager, loading, current }) {
  if (slide.kind === 'scene') return <TextileScene scene={slide.scene} active={current} />;
  if (slide.layout === 'split') {
    if (slide.image) return <PhotoCollage slide={slide} eager={eager} />;
    return loading ? <PhotoSkeleton /> : <OfferPanel />;
  }
  if (slide.kind === 'offer') return <OfferPanel />;
  if (slide.kind === 'waitlist') return <ListPanel title="New stock from Panipat" rows={WAITLIST_ROWS} />;
  if (slide.kind === 'reseller') return <ListPanel title="How it works" rows={RESELLER_ROWS} />;
  return null;
}

/* ── One slide ─────────────────────────────────────────────────────── */

function SlideText({ slide, theme, isFirst }) {
  const Heading = isFirst ? 'h1' : 'h2';
  const cta = slide.cta;
  return (
    <div className="flex flex-col gap-2.5 sm:gap-3">
      <p className={`flex items-center gap-2 text-sm font-medium ${theme.kicker}`}>
        <span className="h-3.5 w-0.5 bg-brand-orange" aria-hidden="true" />
        {slide.kicker}
      </p>
      <Heading className={`max-w-xl text-[26px] font-semibold leading-[1.15] tracking-tight sm:text-4xl lg:text-[44px] lg:leading-[1.1] ${theme.title}`}>
        {slide.headline}
      </Heading>
      <p className={`max-w-lg text-sm leading-relaxed line-clamp-2 sm:text-base lg:line-clamp-3 ${theme.sub}`}>{slide.subline}</p>
      {cta && (
        <div className="pt-2">
          <Button
            to={cta.whatsapp ? undefined : cta.href}
            href={cta.whatsapp ? cta.href : undefined}
            variant={cta.whatsapp ? 'whatsapp' : theme.cta}
            size="lg"
            draggable="false"
          >
            {cta.whatsapp && <MessageCircle className="h-5 w-5" aria-hidden="true" />}
            {cta.label}
            {!cta.whatsapp && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      )}
    </div>
  );
}

function Slide({ slide, isFirst, hidden, current, label, loading }) {
  const theme = THEMES[slide.theme] || THEMES.navy;
  const shell = (children, extra = '') => (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={`relative h-full w-full shrink-0 overflow-hidden ${extra}`}
    >
      {children}
    </div>
  );

  // Full-bleed photo with a dark gradient behind the text
  if (slide.layout === 'fullbleed') {
    return shell(
      <>
        <img
          src={cdn(slide.image, 'w_1600,h_900,c_fill,g_auto,q_auto,f_auto')}
          alt=""
          draggable="false"
          loading={isFirst ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-brand-navy via-brand-navy/70 to-brand-navy/10 lg:bg-gradient-to-r lg:from-brand-navy lg:via-brand-navy/75 lg:to-transparent" />
        <Container className="relative flex h-full items-end pb-20 lg:items-center lg:pb-12">
          <div className="max-w-xl"><SlideText slide={slide} theme={THEMES.navy} isFirst={isFirst} /></div>
        </Container>
      </>,
      'bg-brand-navy'
    );
  }

  const split = slide.layout === 'split';
  return shell(
    <>
      {!theme.dark && <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[3px] bg-brand-orange" />}
      <Container
        className={`relative grid h-full gap-5 pb-16 pt-5 lg:grid-cols-[1.1fr_0.9fr] lg:grid-rows-1 lg:items-center lg:gap-12 lg:pb-12 lg:pt-10 ${
          split ? 'grid-rows-[210px_1fr] sm:grid-rows-[240px_1fr]' : 'content-center'
        }`}
      >
        <div className={`${split ? 'order-last' : ''} flex flex-col justify-start lg:order-first lg:justify-center`}>
          <SlideText slide={slide} theme={theme} isFirst={isFirst} />
        </div>
        <div className={`${split ? 'order-first' : ''} flex min-h-0 items-center justify-center lg:order-last lg:h-[360px] lg:justify-end`}>
          <SidePanel slide={slide} eager={isFirst} loading={loading} current={current} />
        </div>
      </Container>
    </>,
    theme.bg
  );
}

/* ── Carousel logic ────────────────────────────────────────────────── */

function usePrefersReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)';
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

// Infinite loop: the track is [last clone, ...slides, first clone]; after the slide
// animation lands on a clone we jump (without animation) to the real slide.
function useLoopCarousel(count, reduced) {
  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(false);
  const onClone = pos === 0 || pos === count + 1;

  useEffect(() => {
    if (!onClone) return undefined;
    const t = setTimeout(() => {
      setAnimate(false);
      setPos(pos === 0 ? count : 1);
    }, reduced ? 0 : DURATION + 30);
    return () => clearTimeout(t);
  }, [pos, onClone, count, reduced]);

  const go = useCallback((target) => {
    if (onClone) return;
    setAnimate(!reduced);
    setPos(target);
  }, [onClone, reduced]);

  const next = useCallback(() => go(pos + 1), [go, pos]);
  const prev = useCallback(() => go(pos - 1), [go, pos]);
  const goTo = useCallback((i) => go(i + 1), [go]);
  const active = (pos - 1 + count) % count;
  return { pos, animate, active, next, prev, goTo };
}

/* ── Hero ──────────────────────────────────────────────────────────── */

// Auto-sliding hero banner (like big Indian marketplaces), built with CSS transforms.
// Slides, copy and dates live in src/config/campaign.js (getHeroSlides).
export default function HeroBanner({ products = [], loading = false }) {
  const slides = getHeroSlides(products);
  const count = slides.length;
  const reduced = usePrefersReducedMotion();
  const { pos, animate, active, next, prev, goTo } = useLoopCarousel(count, reduced);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [pageHidden, setPageHidden] = useState(false);
  const [dragX, setDragX] = useState(0);
  const drag = useRef({ x: 0, y: 0, active: false, moved: false });

  const playing = count > 1 && !reduced && !userPaused && !hovered && !focused && !pageHidden;

  useEffect(() => {
    const onVis = () => setPageHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const t = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [playing, next, pos]);

  // Touch / mouse drag
  const onPointerDown = (e) => {
    if (count < 2 || (e.pointerType === 'mouse' && e.button !== 0)) return;
    drag.current = { x: e.clientX, y: e.clientY, active: true, moved: false };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { d.active = false; return; }
      if (Math.abs(dx) < 8) return;
      d.moved = true;
      e.currentTarget.setPointerCapture?.(e.pointerId);
    }
    setDragX(dx);
  };
  const endDrag = (e) => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;
    if (d.moved) {
      const dx = e.clientX - d.x;
      if (dx < -50) next();
      else if (dx > 50) prev();
    }
    setDragX(0);
  };
  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  // Track order: [last clone, ...slides, first clone] (no clones for a single slide)
  const track = count > 1
    ? [{ slide: slides[count - 1], key: 'clone-last', clone: true }, ...slides.map((s, i) => ({ slide: s, key: s.id, index: i })), { slide: slides[0], key: 'clone-first', clone: true }]
    : slides.map((s, i) => ({ slide: s, key: s.id, index: i }));
  const offset = count > 1 ? pos : 0;
  const dragging = dragX !== 0;

  if (count === 0) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Offers and news"
      className="relative overflow-hidden bg-brand-navy"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}
      onKeyDown={onKeyDown}
    >
      <div
        className="h-[540px] select-none sm:h-[580px] lg:h-[460px]"
        style={{ touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        <div
          className="flex h-full"
          aria-live={playing ? 'off' : 'polite'}
          style={{
            transform: `translate3d(calc(${-offset * 100}% + ${dragX}px), 0, 0)`,
            transition: animate && !dragging ? `transform ${DURATION}ms cubic-bezier(0.22, 0.61, 0.36, 1)` : 'none'
          }}
        >
          {track.map(({ slide, key, clone, index }) => (
            <Slide
              key={key}
              slide={slide}
              isFirst={!clone && index === 0}
              hidden={clone || index !== active}
              current={clone ? (key === 'clone-first' ? active === 0 : active === count - 1) : index === active}
              label={clone ? undefined : `${index + 1} of ${count}: ${slide.headline}`}
              loading={loading}
            />
          ))}
        </div>
      </div>

      {/* Controls: prev · dots · next · pause */}
      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 sm:bottom-4">
          <Container className="flex justify-center lg:justify-start">
            <div className="pointer-events-auto flex items-center rounded-md border border-line bg-white px-1 shadow-card">
              <button type="button" onClick={prev} aria-label="Previous slide" className="hidden h-10 w-10 items-center justify-center rounded text-brand-navy hover:bg-brand-cream sm:flex">
                <ChevronLeft className="h-5 w-5" />
              </button>
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Go to slide ${i + 1}: ${s.headline}`}
                  aria-current={i === active ? 'true' : undefined}
                  className="flex h-11 w-7 items-center justify-center sm:h-10"
                >
                  <span className={`block h-1 rounded-sm transition-all duration-300 ${i === active ? 'w-6 bg-brand-navy' : 'w-3 bg-slate-300 hover:bg-slate-400'}`} />
                </button>
              ))}
              <button type="button" onClick={next} aria-label="Next slide" className="hidden h-10 w-10 items-center justify-center rounded text-brand-navy hover:bg-brand-cream sm:flex">
                <ChevronRight className="h-5 w-5" />
              </button>
              {!reduced && (
                <button
                  type="button"
                  onClick={() => setUserPaused(p => !p)}
                  aria-label={userPaused ? 'Play slideshow' : 'Pause slideshow'}
                  className="ml-0.5 flex h-11 w-11 items-center justify-center border-l border-line text-brand-navy hover:bg-brand-cream sm:h-10 sm:w-10"
                >
                  {userPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
              )}
            </div>
          </Container>
        </div>
      )}
    </section>
  );
}
