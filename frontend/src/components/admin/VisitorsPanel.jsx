import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, PanelHeader, StatTile, FilterTabs, EmptyState } from './AdminUi';
import { BASE_URL, adminHeaders } from './adminApi';
import { btn } from './adminStyles';
import { rupees } from './orderUtils';

const LIVE_MS = 15000;
const RANGES = [{ id: 1, label: 'Today' }, { id: 7, label: '7 days' }, { id: 30, label: '30 days' }];
const SOURCE_NAMES = {
  direct: 'Direct / typed link', fb_profile: 'FB profile', fb_story: 'FB story', fb_page: 'FB Page', fb_groups: 'FB groups',
  fb_marketplace: 'FB Marketplace', facebook: 'Facebook (other)', instagram: 'Instagram', google: 'Google', qr: 'QR label on mat',
  reseller: 'Reseller link', linkedin: 'LinkedIn'
};
const sourceName = (s) => SOURCE_NAMES[s] || (s.startsWith('reseller-') ? `Reseller ${s.slice(9).toUpperCase()}` : s);
const PAGE_NAMES = { '/': 'Home', '/shop': 'Shop', '/cart': 'Cart', '/checkout': 'Checkout', '/recycle': 'Exchange page', '/track': 'Track order' };
const pageName = (p) => PAGE_NAMES[p] || (p.startsWith('/product/') ? 'A product page' : p.startsWith('/trace/') ? 'QR page (scanned)' : p);

const TYPE_LABEL = { page: 'Opened', product: 'Looked at', add_to_cart: 'Added to cart', checkout: 'Reached checkout', order: 'Placed order' };
const AREA = { panipat: { text: 'Panipat', cls: 'bg-emerald-50 text-emerald-700' }, outside: { text: 'Outside Panipat', cls: 'bg-blue-50 text-brand-navy' }, unknown: { text: 'Area unknown', cls: 'bg-slate-100 text-slate-600' } };
const when = (d) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

// One visitor's full journey, newest first
function Journey({ vid }) {
  const [state, setState] = useState({ vid: '', events: null, error: '' });
  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/analytics/visitor/${encodeURIComponent(vid)}`, { headers: adminHeaders(), credentials: 'include' })
      .then(r => r.json())
      .then(j => { if (alive) setState({ vid, events: j.success ? j.events : [], error: j.success ? '' : (j.message || 'Could not load.') }); })
      .catch(() => { if (alive) setState({ vid, events: [], error: 'Could not load.' }); });
    return () => { alive = false; };
  }, [vid]);
  if (state.vid !== vid) return <p className="py-2 text-xs text-slate-500">Loading journey…</p>;
  if (state.error) return <p className="py-2 text-xs text-red-700">{state.error}</p>;
  return (
    <ol className="mt-2 max-h-72 space-y-1 overflow-y-auto border-l-2 border-line pl-3 text-xs">
      {state.events.map((e, i) => (
        <li key={i} className="text-slate-600">
          <span className="tabular-nums text-slate-400">{when(e.at)}</span> · <span className="font-medium text-ink">{TYPE_LABEL[e.type] || e.type}</span>{' '}
          {e.product ? e.product : pageName(e.path)}{e.orderId ? ` (${e.orderId})` : ''}
        </li>
      ))}
    </ol>
  );
}

function PersonRow({ p }) {
  const [open, setOpen] = useState(false);
  const area = AREA[p.area] || AREA.unknown;
  return (
    <li className="py-2.5">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full text-left cursor-pointer">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-ink">Visitor {p.id}</span>
          <span className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${area.cls}`}>{area.text}{p.pincode ? ` · ${p.pincode}` : ''}</span>
          {p.orders.length > 0 && <span className="rounded bg-emerald-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">Ordered ✓</span>}
          {p.orders.length === 0 && p.carted.length > 0 && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-semibold text-amber-800">Added to cart, no order</span>}
          <span className="ml-auto text-xs text-slate-500">{open ? 'Hide' : 'Journey ›'}</span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600">
          Came <b>{p.visits}×</b> · {p.pages} pages · from {sourceName(p.source)} · {p.device} · first {when(p.firstSeen)} · last {when(p.lastSeen)}
        </p>
        {p.viewed.length > 0 && <p className="mt-0.5 text-xs text-slate-600">Looked at: {p.viewed.join(', ')}</p>}
        {p.carted.length > 0 && <p className="text-xs text-slate-600">Cart: {p.carted.join(', ')}</p>}
        {p.orders.length > 0 && <p className="text-xs text-emerald-700">Orders: {p.orders.join(', ')}</p>}
      </button>
      {open && <Journey vid={p.vid} />}
    </li>
  );
}

function Bar({ value, max, tone = 'bg-brand-navy' }) {
  const w = max > 0 ? Math.max(3, Math.round((value / max) * 100)) : 0;
  return <div className="h-2 w-full rounded bg-slate-100"><div className={`h-2 rounded ${tone}`} style={{ width: `${w}%` }} /></div>;
}

// Anonymous visitor analytics from /analytics/summary (no names or phone numbers)
export default function VisitorsPanel() {
  const [days, setDays] = useState(7);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState({ key: '', data: null, error: '' });
  const key = `${days}:${nonce}`;
  const loading = result.key !== key;
  const data = result.data;
  const error = result.key === key ? result.error : '';

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/analytics/summary?days=${days}`, { headers: adminHeaders(), credentials: 'include' })
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok || !json.success) throw new Error(json.message || 'Could not load visitor numbers.');
        if (alive) setResult({ key, data: json, error: '', at: new Date() });
      })
      .catch((e) => { if (alive) setResult(prev => ({ key, data: prev.data, error: e.message, at: prev.at })); });
    return () => { alive = false; };
  }, [days, nonce, key]);

  // Live: reload every 15 s while this tab is on screen, and at once when it comes back
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') setNonce(n => n + 1); };
    const timer = setInterval(tick, LIVE_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, []);

  const maxDay = data ? Math.max(1, ...data.daily.map(d => d.visitors)) : 1;
  const maxSrc = data ? Math.max(1, ...data.sources.map(s => s.visitors)) : 1;
  const top = data?.funnel?.[0]?.sessions || 0;

  return (
    <div className="space-y-4">
      <PanelHeader title="Visitors" note="Who visits the store and what they look at. Anonymous: no names or numbers are recorded.">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Live{result.at ? ` · updated ${result.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', second: '2-digit' })}` : ''}
        </span>
        <button type="button" onClick={() => setNonce(n => n + 1)} className={btn.outline} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </PanelHeader>

      <FilterTabs tabs={RANGES} active={days} onChange={setDays} />

      {error && <Card className="p-4 text-sm text-red-700">{error}</Card>}
      {!data && loading && <Card><EmptyState>Loading…</EmptyState></Card>}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Visitors" value={data.visitors} sub={`${data.returning} came back again`} accent />
            <StatTile label="Online now" value={data.live} sub="last 5 minutes" />
            <StatTile label="Page views" value={data.pageViews} sub={`${data.sessions} visits`} />
            <StatTile label="Phone / Computer" value={`${data.devices.mobile} / ${data.devices.desktop}`} sub="visitors" />
          </div>

          {data.areas && (
            <div className="grid grid-cols-3 gap-3">
              <StatTile label="From Panipat" value={data.areas.panipat} sub="entered a 1321xx pincode" />
              <StatTile label="Outside Panipat" value={data.areas.outside} sub="other pincode" />
              <StatTile label="Area unknown" value={data.areas.unknown} sub="no pincode entered" />
            </div>
          )}

          {data.visitors === 0 && (
            <Card className="p-4 text-sm text-slate-600">
              No visitors recorded yet. Counting started when this screen was added; open the store on your phone to see yourself appear (admin pages are not counted).
            </Card>
          )}

          <Card className="p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">Where people drop off</h3>
            <ul className="space-y-2.5">
              {data.funnel.map((f, i) => (
                <li key={f.step}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-ink">{i + 1}. {f.step}</span>
                    <span className="tabular-nums text-slate-600">{f.sessions}{top > 0 && i > 0 ? ` · ${Math.round((f.sessions / top) * 100)}%` : ''}</span>
                  </div>
                  <Bar value={f.sessions} max={top} tone={i === data.funnel.length - 1 ? 'bg-emerald-600' : 'bg-brand-navy'} />
                </li>
              ))}
            </ul>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Products people looked at</h3>
              {data.products.length === 0 ? <EmptyState>No product opened yet.</EmptyState> : (
                <ul className="divide-y divide-line">
                  {data.products.map(p => (
                    <li key={p.id} className="flex items-center gap-3 py-2">
                      {p.image ? <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded border border-line object-cover" /> : <div className="h-10 w-10 shrink-0 rounded bg-slate-100" />}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-slate-500">{rupees(p.price)} · {p.views} views · {p.carts} {p.carts === 1 ? 'person' : 'people'} added to cart</p>
                      </div>
                      <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-ink">{p.people}<span className="block text-[11px] font-normal text-slate-500">people</span></span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Where visitors came from</h3>
              {data.sources.length === 0 ? <EmptyState>No visitors yet.</EmptyState> : (
                <ul className="space-y-2.5">
                  {data.sources.map(s => (
                    <li key={s.source}>
                      <div className="mb-1 flex justify-between text-sm"><span className="text-ink">{sourceName(s.source)}</span><span className="tabular-nums text-slate-600">{s.visitors}</span></div>
                      <Bar value={s.visitors} max={maxSrc} tone="bg-brand-cta" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Visitors per day</h3>
              <ul className="space-y-2">
                {data.daily.map(d => (
                  <li key={d.day} className="grid grid-cols-[72px_1fr_64px] items-center gap-2 text-sm">
                    <span className="text-slate-600">{new Date(d.day + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <Bar value={d.visitors} max={maxDay} />
                    <span className="text-right tabular-nums text-ink">{d.visitors}{d.orders ? ` · ${d.orders}🛒` : ''}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Most opened pages</h3>
              {data.pages.length === 0 ? <EmptyState>No page views yet.</EmptyState> : (
                <ul className="divide-y divide-line text-sm">
                  {data.pages.map(p => (
                    <li key={p.path} className="flex justify-between gap-3 py-1.5"><span className="truncate text-ink" title={p.path}>{pageName(p.path)}</span><span className="tabular-nums text-slate-600">{p.views}</span></li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-ink">People ({data.people?.length || 0})</h3>
            <p className="mb-1 text-xs text-slate-500">Newest first. Tap a visitor to see every step they took. Visitors are anonymous; the pincode shows only if they typed one.</p>
            {!data.people?.length ? <EmptyState>No visitors yet.</EmptyState> : (
              <ul className="divide-y divide-line">{data.people.map(p => <PersonRow key={p.vid} p={p} />)}</ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
