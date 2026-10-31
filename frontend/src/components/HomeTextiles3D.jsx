import { useEffect, useRef, useState } from 'react';
import '../styles/textiles3d.css';

// Free-licence Unsplash photos of Indian block-print fabric (same three as AlmirahShowcase),
// used as the print on CSS-built bedsheets and cushion covers. Each has an average colour
// shown while the photo is still loading.
const img = (id) => `url(https://images.unsplash.com/photo-${id}?w=360&q=60&auto=format)`;
const PRINTS = {
  orangeBlock: [img('1783764245498-31991c8a6cae'), '#D8742E'],
  paisley: [img('1783763624907-b9974ce1dbe3'), '#8C8279'],
  blueGeo: [img('1783762774159-b0c266382e2f'), '#D9D2C2']
};
// Print as CSS variables so the stylesheet can layer folds and shading over the photo
const print = (name, load, pos = '0 0') => ({
  backgroundColor: PRINTS[name][1],
  '--print': load ? PRINTS[name][0] : undefined,
  '--pos': pos
});

// Cuboid centred on (x, y, z). y grows downwards, the floor is y = 0. Only the faces the
// camera can see are rendered.
function Box({ x = 0, y = 0, z = 0, w, h, d, className = '', faces = ['front', 'top', 'right'], style, children }) {
  return (
    <div
      className={`tx-box ${className}`}
      style={{ '--x': `${x}px`, '--y': `${y}px`, '--z': `${z}px`, '--w': `${w}px`, '--h': `${h}px`, '--d': `${d}px`, ...style }}
    >
      {faces.map(f => <span key={f} className={`tx-f tx-${f}`} />)}
      {children}
    </div>
  );
}

// Horizontal plane centred on (x, y, z), w wide and d deep
function Flat({ x = 0, y = 0, z = 0, w, d, className = '' }) {
  return (
    <span
      className={`tx-flat ${className}`}
      style={{ width: w, height: d, marginLeft: -w / 2, marginTop: -d / 2, transform: `translate3d(${x}px, ${y}px, ${z}px) rotateX(90deg)` }}
    />
  );
}

/* ── Bed ───────────────────────────────────────────────────────────────── */

const SHEET_STRIPS = 4;
const STRIP_LEN = 95; // 4 x 95 = 380 = mattress length

// The sheet is four hinged strips (an accordion fold) with drapes hinged on their edges.
// Unfolding = every hinge rotating back to its resting angle.
function SheetStrip({ i, load }) {
  const last = i === SHEET_STRIPS - 1;
  const pos = (dx, dy) => `${dx}px ${dy - i * STRIP_LEN}px`;
  return (
    <span className={`tx-strip tx-fold-${i}`} style={{ ...print('blueGeo', load, pos(0, 0)), '--i': i }}>
      <span className="tx-drape tx-drape-l" style={{ ...print('blueGeo', load, pos(38, 0)), '--i': i }} />
      <span className="tx-drape tx-drape-r" style={{ ...print('blueGeo', load, pos(-284, 0)), '--i': i }} />
      {last && <span className="tx-drape tx-drape-foot" style={print('blueGeo', load, pos(0, -STRIP_LEN))} />}
      {!last && <SheetStrip i={i + 1} load={load} />}
    </span>
  );
}

function BedScene({ load }) {
  return (
    <div className="tx-rig">
      {/* Room: wall behind the headboard, floor, rug, contact shadow */}
      <span className="tx-wall tx-wall-plaster bed-wall" />
      <Flat y={0.5} z={130} w={980} d={700} className="bed-floor" />
      <Flat y={0} z={70} w={520} d={330} className="tx-rug" />
      <Flat y={-0.5} z={-6} w={380} d={460} className="tx-shadow" />

      {/* Headboard: navy channel-tufted upholstery */}
      <Box className="bed-head" y={-96} z={-206} w={332} h={192} d={16} />
      {/* Base: navy upholstered frame on walnut legs */}
      <Box className="bed-leg" x={-146} y={-4} z={188} w={10} h={8} d={10} faces={['front', 'right']} />
      <Box className="bed-leg" x={146} y={-4} z={188} w={10} h={8} d={10} faces={['front', 'right']} />
      <Box className="bed-leg" x={146} y={-4} z={-188} w={10} h={8} d={10} faces={['front', 'right']} />
      <Box className="bed-base" y={-25} z={0} w={304} h={34} d={398} />
      {/* Mattress: white quilted */}
      <Box className="bed-mattress" y={-62} z={0} w={280} h={40} d={380} />

      {/* Bedsheet */}
      <div className="tx-sheet">
        <SheetStrip i={0} load={load} />
      </div>

      {/* Pillows: shadow on the sheet + the pillow leaning on the headboard */}
      {[-70, 70].map((x, i) => (
        <div key={x} className="tx-at" style={{ transform: `translate3d(${x}px, -85px, -152px)` }}>
          <span className="tx-pillow-shadow" style={{ '--i': i }} />
          <div className="tx-drop tx-drop-pillow" style={{ '--i': i }}>
            <span className="tx-pillow" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Cushions on a sofa ────────────────────────────────────────────────── */

const CUSHIONS = [
  { x: -73, tilt: -3, fill: 'orangeBlock', pos: '20% 30%' },
  { x: 0, tilt: 2, fill: 'paisley', pos: '40% 40%' },
  { x: 73, tilt: -2, fill: 'blueGeo', pos: '60% 20%' }
];

function CushionScene({ load }) {
  return (
    <div className="tx-rig">
      <span className="tx-wall tx-wall-plaster cush-wall" />
      <Flat y={0.5} z={40} w={520} d={220} className="tx-floor" />
      <Flat y={0} z={4} w={310} d={130} className="tx-shadow" />
      <Box className="sofa-leg" x={-112} y={-5} z={40} w={8} h={10} d={8} faces={['front', 'right']} />
      <Box className="sofa-leg" x={112} y={-5} z={40} w={8} h={10} d={8} faces={['front', 'right']} />
      <Box className="sofa-fab sofa-base" y={-20} z={0} w={252} h={20} d={92} />
      <Box className="sofa-fab sofa-back" y={-64} z={-35} w={252} h={68} d={22} />
      <Box className="sofa-fab sofa-seat" y={-40} z={6} w={220} h={20} d={80} />
      <Box className="sofa-fab sofa-arm" x={-118} y={-54} z={0} w={16} h={48} d={92} />
      <Box className="sofa-fab sofa-arm" x={118} y={-54} z={0} w={16} h={48} d={92} />
      {CUSHIONS.map((c, i) => (
        <div key={i} className="tx-at" style={{ transform: `translate3d(${c.x}px, -51px, -6px)` }}>
          <span className="tx-cushion-shadow" style={{ '--i': i }} />
          <div className="tx-drop tx-drop-cushion" style={{ '--i': i }}>
            <span className="tx-cushion" style={{ ...print(c.fill, load, c.pos), '--tilt': `${c.tilt}deg` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Towels: two on a rail, three folding into a stack ─────────────────── */

const RAIL_TOWELS = [
  { x: -72, tone: 'navy' },
  { x: 2, tone: 'ivory' }
];
const STACK = ['stone', 'ivory', 'navy'];

function TowelScene() {
  return (
    <div className="tx-rig">
      <span className="tx-wall tx-wall-tile" />
      <Flat y={0} z={60} w={460} d={140} className="tx-floor" />
      {/* Rail with two wall brackets */}
      <Box className="towel-bracket" x={-112} y={-174} z={14} w={6} h={6} d={24} faces={['front', 'top', 'right']} />
      <Box className="towel-bracket" x={40} y={-174} z={14} w={6} h={6} d={24} faces={['front', 'top', 'right']} />
      <span className="towel-rail" />
      {RAIL_TOWELS.map((t, i) => (
        <div key={i} className={`tx-towel tx-towel-${t.tone}`} style={{ '--i': i, transform: `translate3d(${t.x}px, -177px, 26px)` }}>
          <div className="towel-drop">
            <span className="towel-back" />
            <span className="towel-over" />
            <span className="towel-front"><span className="towel-front-inner" /></span>
          </div>
        </div>
      ))}
      {/* Teak stool with a folded stack */}
      <Flat x={104} y={-0.5} z={34} w={110} d={84} className="tx-shadow" />
      <Box className="towel-stool" x={104} y={-28} z={34} w={72} h={56} d={56} />
      {STACK.map((tone, i) => (
        <div key={i} className="tx-at" style={{ transform: `translate3d(${104 + [0, -2, 1][i]}px, ${-62 - i * 12}px, 34px)` }}>
          <div className="tx-drop tx-drop-fold" style={{ '--i': i }}>
            <Box className={`towel-fold tx-towel-${tone}`} w={62} h={12} d={46} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Curtains: two pleated linen panels that fall from the rod, then draw open ── */

const PLEATS = 8;

// Each pleat is hinged to the previous one, alternating left/right, so the panel is a real
// 3D zig-zag. Widening the hinge angle (--a) gathers the panel towards its end of the rod.
function Pleat({ i, side }) {
  const lit = (side === 'l') === (i % 2 === 0);
  return (
    <span className={`tx-pleat ${lit ? 'is-lit' : 'is-shade'} ${i === 0 ? 'is-first' : i % 2 ? 'is-odd' : 'is-even'}`}>
      {i < PLEATS - 1 && <Pleat i={i + 1} side={side} />}
    </span>
  );
}

function CurtainScene() {
  return (
    <div className="tx-rig">
      <span className="tx-wall tx-wall-plaster" />
      <Flat y={0} z={60} w={460} d={140} className="tx-floor" />
      <span className="cur-window"><span className="cur-glass" /></span>
      <Box className="cur-sill" y={-60} z={6} w={176} h={6} d={14} />
      <span className="cur-rod" />
      {['l', 'r'].map(side => (
        <div key={side} className={`cur-at cur-${side}`}>
          <div className="cur-sway">
            <div className="cur-fall">
              <Pleat i={0} side={side} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const SCENES = { bed: BedScene, cushions: CushionScene, towels: TowelScene, curtains: CurtainScene };

const prefersReduced = () => typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// One CSS-3D textile scene for a hero slide (bed, cushions, towels or curtains).
// The scene plays while its slide is the active one and the hero is on screen, and resets
// (instantly, after it has slid out) so it replays next time. Pure CSS transforms; no 3D library.
export default function TextileScene({ scene, active }) {
  const ref = useRef(null);
  const [reduced] = useState(prefersReduced);
  const [inView, setInView] = useState(true);
  const [on, setOn] = useState(reduced);
  const [loadLater, setLoadLater] = useState(false);

  // Hero on/off screen (observe the carousel, not the slide: slides are clipped sideways)
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const target = el.closest('[aria-roledescription="carousel"]') || el;
    const obs = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    obs.observe(target);
    return () => obs.disconnect();
  }, []);

  // Fabric photos: now for the active slide, a moment later for the others
  useEffect(() => {
    const t = setTimeout(() => setLoadLater(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const load = active || loadLater;

  const playing = active && inView;
  useEffect(() => {
    if (reduced) return undefined;
    if (playing) {
      // two frames so the reset state is painted before the reveal starts
      let f2 = 0;
      const f1 = requestAnimationFrame(() => { f2 = requestAnimationFrame(() => setOn(true)); });
      return () => { cancelAnimationFrame(f1); cancelAnimationFrame(f2); };
    }
    // reset once the slide has left the screen (or straight away when the hero is off screen)
    const t = setTimeout(() => setOn(false), inView ? 650 : 0);
    return () => clearTimeout(t);
  }, [playing, inView, reduced]);

  const Scene = SCENES[scene] || BedScene;
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden rounded-lg shadow-lift lg:w-[540px]">
      <div className={`tx-stage tx-${scene} ${on ? 'is-on' : ''}`} aria-hidden="true">
        <div className="tx-scale">
          <Scene load={load} />
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-1.5 py-0.5 text-[10px] leading-none text-slate-600">
        Illustration. Fabrics shown are for styling only.
      </span>
    </div>
  );
}
