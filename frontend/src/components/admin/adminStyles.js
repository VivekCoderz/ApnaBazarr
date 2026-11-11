// Shared class names for the admin panel. Same tokens as the storefront:
// navy brand, orange accents, Inter, white cards on #F3F5F9, rounded-lg, compact.
export const card = 'rounded-lg border border-line bg-white shadow-card';
export const input =
  'w-full min-h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-ink placeholder:text-slate-400 focus:outline-none focus:border-brand-navy focus:ring-1 focus:ring-brand-navy';
export const label = 'mb-1 block text-xs font-medium text-slate-600';
export const hint = 'mt-1 text-xs text-slate-500';
export const sectionTitle = 'text-base font-semibold text-ink';

const btnBase =
  'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';
export const btn = {
  primary: `${btnBase} bg-brand-navy text-white hover:bg-blue-700`,
  cta: `${btnBase} bg-brand-cta text-white hover:bg-brand-cta-hover`,
  outline: `${btnBase} border border-slate-300 bg-white text-ink hover:bg-slate-50`,
  ghost: `${btnBase} text-slate-600 hover:bg-slate-100 hover:text-ink`,
  danger: `${btnBase} border border-red-200 bg-white text-red-700 hover:bg-red-50`,
  whatsapp: `${btnBase} bg-[#25D366] text-[#0B2A55] hover:bg-[#1ebe5b]`
};

// Small status/info pills (rounded, not rainbow): one neutral, one brand, plus state colours
export const PILL_TONES = {
  neutral: 'bg-slate-100 text-slate-700',
  navy: 'bg-blue-50 text-brand-navy',
  orange: 'bg-amber-50 text-amber-800',
  green: 'bg-emerald-50 text-emerald-700',
  red: 'bg-red-50 text-red-700',
  dark: 'bg-slate-700 text-white'
};
