// Small rectangular badges with fixed meanings (marketplace style)
const TONES = {
  sale: 'bg-emerald-50 text-emerald-700',
  cod: 'bg-slate-100 text-slate-700',
  soon: 'bg-slate-100 text-slate-600',
  new: 'bg-brand-navy text-white',
  live: 'bg-white text-slate-700 ring-1 ring-inset ring-line',
  neutral: 'bg-slate-100 text-slate-700',
  muted: 'bg-slate-700 text-white'
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
