import { card, PILL_TONES } from './adminStyles';

export function Pill({ tone = 'neutral', className = '', children, title }) {
  return (
    <span title={title} className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-semibold leading-4 whitespace-nowrap ${PILL_TONES[tone] || PILL_TONES.neutral} ${className}`}>
      {children}
    </span>
  );
}

export function Card({ className = '', children }) {
  return <div className={`${card} ${className}`}>{children}</div>;
}

// Screen heading: title, optional one-line note and actions on the right
export function PanelHeader({ title, note, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-ink">{title}</h2>
        {note && <p className="mt-0.5 text-sm text-slate-500">{note}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

// One number with a label. `onClick` turns it into a button (e.g. jump to a filtered list).
export function StatTile({ label, value, sub, accent = false, onClick }) {
  const body = (
    <>
      <span className="block text-xs font-medium text-slate-500">{label}</span>
      <span className={`mt-1 block text-xl font-semibold tabular-nums sm:text-2xl ${accent ? 'text-brand-cta' : 'text-ink'}`}>{value}</span>
      {sub && <span className="mt-0.5 block text-xs text-slate-500">{sub}</span>}
    </>
  );
  const cls = `${card} block w-full p-3 text-left sm:p-4`;
  if (onClick) {
    return <button type="button" onClick={onClick} className={`${cls} cursor-pointer hover:border-brand-navy`}>{body}</button>;
  }
  return <div className={cls}>{body}</div>;
}

export function EmptyState({ children }) {
  return <div className="py-10 text-center text-sm text-slate-500">{children}</div>;
}

// Segmented filter chips that scroll sideways on narrow screens
export function FilterTabs({ tabs, active, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 [scrollbar-width:none]">
      <div className="flex w-max gap-1.5">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
              active === t.id ? 'border-brand-navy bg-brand-navy text-white' : 'border-line bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`tabular-nums text-xs ${active === t.id ? 'text-white/80' : 'text-slate-500'}`}>{t.count}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Modal sheet: full-width bottom sheet on phones, centred dialog on larger screens
export function Sheet({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative flex max-h-[92vh] w-full flex-col rounded-t-lg bg-white shadow-lift sm:rounded-lg ${wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h3 className="text-base font-semibold text-ink">{title}</h3>
          <button type="button" onClick={onClose} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 pb-[max(1rem,env(safe-area-inset-bottom))]">{children}</div>
      </div>
    </div>
  );
}
