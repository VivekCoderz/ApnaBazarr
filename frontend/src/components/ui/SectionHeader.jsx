import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Consistent section header: small label + title + optional description + optional link
export default function SectionHeader({ eyebrow, title, description, action, id, align = 'left', onDark = false, className = '' }) {
  const centered = align === 'center';
  return (
    <div className={`mb-5 flex flex-col gap-2 sm:mb-6 sm:flex-row sm:items-end sm:justify-between ${centered ? 'text-center sm:justify-center' : ''} ${className}`}>
      <div className={`space-y-1 ${centered ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
        {eyebrow && (
          <p className={`text-sm font-medium ${onDark ? 'text-brand-orange' : 'text-brand-cta'}`}>{eyebrow}</p>
        )}
        <h2 id={id} className={`text-xl font-semibold leading-tight tracking-tight sm:text-2xl ${onDark ? 'text-white' : 'text-ink'}`}>
          {title}
        </h2>
        {description && (
          <p className={`text-sm leading-relaxed sm:text-[15px] ${onDark ? 'text-white/75' : 'text-slate-600'}`}>{description}</p>
        )}
      </div>
      {action && (
        <Link
          to={action.to}
          className={`inline-flex min-h-10 shrink-0 items-center gap-0.5 text-sm font-semibold ${onDark ? 'text-white' : 'text-brand-navy'} hover:text-brand-cta`}
        >
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
