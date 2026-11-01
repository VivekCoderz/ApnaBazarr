import { useEffect, useRef } from 'react';
import { Heart } from 'lucide-react';
import { pop } from './motion';

// Wishlist heart: filled when saved, with a small pop at the moment it becomes saved
// (not on first render, so already-saved items don't all bounce when a page opens).
export default function HeartIcon({ filled, className = '' }) {
  const ref = useRef(null);
  const wasFilled = useRef(filled);
  useEffect(() => {
    if (filled && !wasFilled.current) pop(ref.current);
    wasFilled.current = filled;
  }, [filled]);
  return <Heart ref={ref} className={`${className} ${filled ? 'fill-current' : ''}`} aria-hidden="true" />;
}
