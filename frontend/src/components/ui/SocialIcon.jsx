// Monochrome brand glyphs for the footer social links (lucide has no brand icons).
// 24x24, inherit currentColor.
const PATHS = {
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </>
  ),
  Facebook: (
    <path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.45A21 21 0 0 0 14.3 4.3c-2.3 0-3.8 1.4-3.8 3.95v2.25H7.9v3h2.6V21h3Z" />
  ),
  LinkedIn: (
    <path fill="currentColor" d="M5 3.5a2 2 0 1 1 0 4 2 2 0 0 1 0-4ZM3.25 9h3.5v11.5h-3.5V9Zm5.75 0h3.35v1.6h.05c.47-.88 1.6-1.8 3.3-1.8 3.53 0 4.18 2.32 4.18 5.34v6.36h-3.5v-5.64c0-1.35-.02-3.08-1.88-3.08-1.88 0-2.17 1.47-2.17 2.98v5.74H9V9Z" />
  )
};

export default function SocialIcon({ name, className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      {PATHS[name]}
    </svg>
  );
}
