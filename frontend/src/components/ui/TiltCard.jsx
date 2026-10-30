import { useRef } from 'react';

// 3D card: tilts toward the pointer with a moving glare. On touch / no hover it
// gently floats instead (CSS .tilt-float); reduced-motion turns both off.
const MAX_TILT = 8; // degrees

export default function TiltCard({ children, className = '' }) {
  const cardRef = useRef(null);

  const handleMove = (e) => {
    if (e.pointerType !== 'mouse') return;
    const card = cardRef.current;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    card.style.setProperty('--rx', `${(0.5 - y) * MAX_TILT * 2}deg`);
    card.style.setProperty('--ry', `${(x - 0.5) * MAX_TILT * 2}deg`);
    card.style.setProperty('--gx', `${x * 100}%`);
    card.style.setProperty('--gy', `${y * 100}%`);
    card.dataset.active = 'true';
  };

  const handleLeave = () => {
    const card = cardRef.current;
    card.style.setProperty('--rx', '0deg');
    card.style.setProperty('--ry', '0deg');
    delete card.dataset.active;
  };

  return (
    <div className="tilt-scene">
      <div ref={cardRef} className={`tilt-card ${className}`} onPointerMove={handleMove} onPointerLeave={handleLeave}>
        {children}
        <span aria-hidden="true" className="tilt-glare" />
      </div>
    </div>
  );
}
