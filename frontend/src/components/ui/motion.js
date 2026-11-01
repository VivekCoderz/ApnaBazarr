// Tiny helpers for one-off UI feedback animations (Web Animations API: runs on the GPU,
// no re-render, no animation library). Every helper is a no-op for reduced-motion users.

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

// Short scale "pop" (wishlist heart, cart badge)
export function pop(el, scale = 1.28, duration = 360) {
  if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return;
  el.animate(
    [{ transform: 'scale(1)' }, { transform: `scale(${scale})`, offset: 0.4 }, { transform: 'scale(1)' }],
    { duration, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' }
  );
}
