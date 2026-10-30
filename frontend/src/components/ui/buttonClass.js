// One button system for the whole store (8px radius, compact marketplace density).
// primary = deep orange solid (buy / main action), secondary = navy outline,
// tertiary = text link, whatsapp = green chat button. `onDark` variants are for navy backgrounds.
const VARIANTS = {
  primary: 'bg-brand-cta text-white hover:bg-brand-cta-hover',
  secondary: 'border border-brand-navy text-brand-navy bg-white hover:bg-brand-cream',
  secondaryOnDark: 'border border-white/50 text-white hover:bg-white/10',
  light: 'bg-white text-brand-navy hover:bg-brand-cream',
  whatsapp: 'bg-[#25D366] text-[#0B2A55] hover:bg-[#1ebe5b]',
  tertiary: 'text-brand-navy underline underline-offset-4 decoration-1 hover:text-brand-cta !px-0',
  tertiaryOnDark: 'text-white underline underline-offset-4 decoration-1 hover:text-brand-peach !px-0'
};

const SIZES = {
  sm: 'min-h-10 px-4 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-[15px]'
};

export const buttonClass = (variant = 'primary', size = 'md', extra = '') =>
  `inline-flex items-center justify-center gap-2 rounded-lg font-semibold leading-none transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed ${SIZES[size]} ${VARIANTS[variant]} ${extra}`;
