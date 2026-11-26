import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Microsoft Clarity (session recordings + heatmaps) loads ONLY after the shopper taps "Allow".
// Clarity masks typed text (passwords, addresses, phone numbers) by default.
// Never loads on admin/seller pages.
const CLARITY_ID = 'zjk6qt78u9';
const KEY = 'dhagaro_consent'; // 'yes' | 'no'

const readChoice = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const saveChoice = (v) => { try { localStorage.setItem(KEY, v); } catch { /* private mode */ } };

let loaded = false;
function loadClarity() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  window.clarity = window.clarity || function (...args) { (window.clarity.q = window.clarity.q || []).push(args); };
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(s);
  window.clarity('consent');
}

export default function ConsentBanner({ hidden }) {
  const [choice, setChoice] = useState(readChoice);

  useEffect(() => {
    if (choice === 'yes' && !hidden) loadClarity();
  }, [choice, hidden]);

  if (hidden || choice) return null;

  const decide = (v) => { saveChoice(v); setChoice(v); };

  return (
    <div role="dialog" aria-label="Cookie choice" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 rounded-2xl border border-line bg-white p-4 shadow-xl sm:flex-row sm:items-center">
        <p className="flex-1 text-sm leading-relaxed text-slate-700">
          We use cookies to see how shoppers use the site (for example where people get stuck), so we can make it better.
          What you type is never recorded. <Link to="/privacy" className="font-medium text-brand-navy underline underline-offset-2">Privacy policy</Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => decide('no')} className="min-h-11 rounded-lg border border-line px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            No thanks
          </button>
          <button onClick={() => decide('yes')} className="min-h-11 rounded-lg bg-brand-cta px-5 text-sm font-semibold text-white hover:bg-brand-cta-hover">
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}
