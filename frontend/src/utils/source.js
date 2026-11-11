// Where did this visitor come from? Remembered for 30 days (last non-direct visit wins)
// and sent with the order, so the admin can see which channel brings sales:
// ?utm_source=fb_marketplace links, Facebook/Instagram app clicks (fbclid/igshid), Google, etc.
const KEY = 'dhagaro_src';
const DAYS = 30;

const clean = (v) => String(v || '').toLowerCase().replace(/[^a-z0-9_.\-/ ]/g, '').slice(0, 40);

function fromReferrer(ref) {
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (!host || host === window.location.hostname) return '';
    if (/(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(host)) return 'facebook';
    if (/instagram\.com$/.test(host)) return 'instagram';
    if (/(^|\.)google\./.test(host)) return 'google';
    if (/linkedin\.com$|lnkd\.in$/.test(host)) return 'linkedin';
    return host;
  } catch {
    return '';
  }
}

export function captureSource(search, referrer = document.referrer) {
  const q = new URLSearchParams(search);
  let src = clean(q.get('utm_source'));
  const med = clean(q.get('utm_medium'));
  const camp = clean(q.get('utm_campaign'));
  if (!src && q.get('fbclid')) src = 'facebook';
  if (!src && q.get('igshid')) src = 'instagram';
  if (!src && q.get('gclid')) src = 'google ads';
  if (!src && q.get('ref')) src = 'reseller';
  if (!src) src = fromReferrer(referrer);
  if (!src) return; // direct visit: keep whatever brought them before
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: [src, med, camp].filter(Boolean).join(' / '), at: Date.now() }));
  } catch {
    // storage blocked: source just won't be remembered
  }
}

export function getSource() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && Date.now() - s.at < DAYS * 864e5) return s.v;
  } catch {
    // ignore
  }
  return 'direct';
}
