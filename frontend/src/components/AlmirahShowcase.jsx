import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import Container from './ui/Container';
import Button from './ui/Button';

// Free-licence Unsplash photos of Indian block-print fabric, used as the print on CSS-built
// bedsheets and kurtas. Each has an average colour shown while the photo is still loading.
const img = (id) => `url(https://images.unsplash.com/photo-${id}?w=360&q=60&auto=format)`;
const PRINTS = {
  orangeBlock: [img('1783764245498-31991c8a6cae'), '#D8742E'],
  paisley: [img('1783763624907-b9974ce1dbe3'), '#8C8279'],
  blueGeo: [img('1783762774159-b0c266382e2f'), '#D9D2C2']
};
const fill = (name, load) => (PRINTS[name]
  ? { backgroundColor: PRINTS[name][1], backgroundImage: load ? PRINTS[name][0] : undefined }
  : { backgroundColor: name });

// Folded stacks. kind: knit (blankets), terry (towels), print (bedsheets).
// folds run bottom → top as [colour or print name, x-nudge in px, background-position]
const TOP_STACKS = [
  { kind: 'knit', x: 14, w: 128, h: 22, folds: [['#B9B3A9', 0], ['#C9A04A', 3], ['#E9E2D4', -2], ['#2C4366', 2]] },
  { kind: 'knit', x: 152, w: 128, h: 22, folds: [['#E9E2D4', 1], ['#8E7B68', -2], ['#C9A04A', 2], ['#B9B3A9', 0]] },
  { kind: 'knit', x: 290, w: 128, h: 22, folds: [['#2C4366', 0], ['#E9E2D4', -2], ['#B9B3A9', 2]] }
];
const SHELF_STACKS = [
  // Shelf 1: towels
  [{ kind: 'terry', x: 8, w: 70, h: 15, folds: [['#1E3A66', 0], ['#F2EFE9', 2], ['#1E3A66', -1], ['#F2EFE9', 1], ['#9FB2C8', 0], ['#F2EFE9', -2]] },
   { kind: 'terry', x: 84, w: 66, h: 15, folds: [['#C7B9A3', 0], ['#C7B9A3', 2], ['#E9E3D8', -1], ['#E9E3D8', 1], ['#F2EFE9', 0]] }],
  // Shelf 2: printed bedsheets
  [{ kind: 'print', x: 10, w: 140, h: 13, folds: [['blueGeo', 0, '20% 30%'], ['paisley', 2, '30% 50%'], ['blueGeo', -2, '60% 60%'], ['orangeBlock', 1, '40% 30%'], ['paisley', -1, '70% 20%'], ['blueGeo', 2, '10% 80%'], ['paisley', 0, '50% 70%']] }],
  // Shelf 3: blankets
  [{ kind: 'knit', x: 8, w: 142, h: 19, folds: [['#8E7B68', 0], ['#B9B3A9', 2], ['#E9E2D4', -2], ['#2C4366', 1], ['#C9A04A', 0]] }]
];

// Suit sets on the rail: printed kurta, optional dupatta
const GARMENTS = [
  { kurta: 'blueGeo', pos: '30% 20%', x: 8, delay: '0s' },
  { kurta: 'paisley', pos: '60% 40%', x: 56, delay: '-1.4s', dupatta: 'blueGeo' },
  { kurta: '#6E1F3A', x: 104, delay: '-2.6s', dupatta: 'paisley' },
  { kurta: 'orangeBlock', pos: '40% 30%', x: 150, delay: '-0.7s' }
];

function Stack({ stack, load }) {
  return (
    <div className="alm-stack" style={{ left: stack.x, width: stack.w }}>
      {stack.folds.map(([f, nudge, pos], i) => (
        <span
          key={i}
          className={`alm-fold alm-${stack.kind}`}
          style={{ ...fill(f, load), height: stack.h, backgroundPosition: pos, marginLeft: nudge }}
        />
      ))}
    </div>
  );
}

function Garment({ g, i, load }) {
  return (
    <div className="alm-garment" style={{ left: g.x, '--i': i }}>
      <div className="alm-swing" style={{ animationDelay: g.delay }}>
        <span className="alm-hook" />
        <span className="alm-hanger" />
        <span className={`alm-kurta ${PRINTS[g.kurta] ? '' : 'alm-solid'}`} style={{ ...fill(g.kurta, load), backgroundPosition: g.pos }} />
        {g.dupatta && <span className="alm-dupatta" style={fill(g.dupatta, load)} />}
      </div>
    </div>
  );
}

// "Open almirah" showcase: a CSS-3D wardrobe whose doors swing open when it scrolls into view.
// Pure CSS transforms + one IntersectionObserver; no 3D library.
export default function AlmirahShowcase() {
  const sectionRef = useRef(null);
  const rigRef = useRef(null);
  const [near, setNear] = useState(false); // load fabric textures only when close to the viewport
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return undefined;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      setOpen(true);
      return undefined;
    }
    const nearObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setNear(true); nearObs.disconnect(); }
    }, { rootMargin: '600px 0px' });
    const openObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setOpen(true); openObs.disconnect(); }
    }, { threshold: 0.35 });
    nearObs.observe(el);
    openObs.observe(el);
    return () => { nearObs.disconnect(); openObs.disconnect(); };
  }, []);

  // Gentle pointer parallax (desktop, mouse only, max ~4°)
  useEffect(() => {
    const el = sectionRef.current;
    const rig = rigRef.current;
    if (!el || !rig) return undefined;
    const fine = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return undefined;
    let frame = 0;
    const onMove = (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const clamp = (v) => Math.max(-0.5, Math.min(0.5, v));
        const px = clamp((e.clientX - r.left) / r.width - 0.5);
        const py = clamp((e.clientY - r.top) / r.height - 0.5);
        rig.style.setProperty('--ry', `${(px * 8).toFixed(2)}deg`);
        rig.style.setProperty('--rx', `${(-py * 5).toFixed(2)}deg`);
      });
    };
    const onLeave = () => {
      cancelAnimationFrame(frame);
      rig.style.setProperty('--ry', '0deg');
      rig.style.setProperty('--rx', '0deg');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      id="almirah"
      aria-labelledby="home-almirah-title"
      className="alm-section overflow-hidden py-10 sm:py-14"
    >
      <Container>
        <div className="grid items-center gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:gap-10">
          <div className="max-w-md">
            <p className="text-sm font-medium text-brand-cta">Made in Panipat</p>
            <h2 id="home-almirah-title" className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-ink sm:text-3xl">
              Straight from Panipat's looms to your almirah
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
              Blankets, towels, bedsheets and women's suit sets, checked and packed by us in Panipat.
              Our range is small today and more pieces are coming soon.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button to="/shop" size="lg">
                Shop what's in stock <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
              <span className="text-sm text-slate-500">More blankets, towels, bedsheets and suits coming soon</span>
            </div>
          </div>

          <figure className="m-0">
            <div className={`alm-stage ${open ? 'is-open' : ''}`} aria-hidden="true">
              <div className="alm-scale">
                <div className="alm-rig" ref={rigRef}>
                  <div className="alm-cabinet">
                    <div className="alm-crown" />

                    <div className="alm-interior">
                      <div className="alm-back" />
                      <div className="alm-wall alm-wall-l" />
                      <div className="alm-wall alm-wall-r" />
                      <div className="alm-wall alm-ceil" />
                      <div className="alm-wall alm-floor" />
                      <div className="alm-light" />

                      {/* Top compartment: folded blankets */}
                      <div className="alm-shelf" style={{ top: 108, left: 0, width: 432 }} />
                      <div className="alm-plane" style={{ top: 0, left: 0, width: 432, height: 108 }}>
                        {TOP_STACKS.map((s, i) => <Stack key={i} stack={s} load={near} />)}
                      </div>

                      {/* Hanging side */}
                      <div className="alm-divider" style={{ left: 262, top: 118, height: 382 }} />
                      <div className="alm-rod" style={{ top: 140, left: 0, width: 262 }} />
                      <div className="alm-hang" style={{ top: 140, left: 0, width: 262, height: 360 }}>
                        {GARMENTS.map((g, i) => <Garment key={i} g={g} i={i} load={near} />)}
                      </div>

                      {/* Right shelves */}
                      {[242, 376].map(top => (
                        <div key={top} className="alm-shelf" style={{ top, left: 272, width: 160 }} />
                      ))}
                      {SHELF_STACKS.map((stacks, i) => {
                        const top = [118, 252, 386][i];
                        const height = [124, 124, 114][i];
                        return (
                          <div key={i} className="alm-plane" style={{ top, left: 272, width: 160, height }}>
                            {stacks.map((s, j) => <Stack key={j} stack={s} load={near} />)}
                          </div>
                        );
                      })}
                    </div>

                    {/* Doors: navy lacquer outside, light laminate + mirror inside */}
                    <div className="alm-door alm-door-l">
                      <div className="alm-face alm-face-front"><span className="alm-panel" /><span className="alm-handle" /></div>
                      <span className="alm-edge" />
                      <div className="alm-face alm-face-back"><span className="alm-mirror" /></div>
                    </div>
                    <div className="alm-door alm-door-r">
                      <div className="alm-face alm-face-front"><span className="alm-panel" /><span className="alm-handle" /></div>
                      <span className="alm-edge" />
                      <div className="alm-face alm-face-back"><span className="alm-mirror" /></div>
                    </div>

                    <div className="alm-plinth" />
                  </div>
                  <div className="alm-floor-shadow" />
                </div>
              </div>
            </div>
            <figcaption className="mt-1 text-center text-[11px] text-slate-400">Illustration. Fabrics shown are for styling only.</figcaption>
          </figure>
        </div>
      </Container>
    </section>
  );
}
