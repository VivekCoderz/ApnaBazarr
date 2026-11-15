import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Card, PanelHeader, StatTile, FilterTabs, EmptyState } from './AdminUi';
import { BASE_URL, adminHeaders } from './adminApi';
import { btn } from './adminStyles';
import { rupees } from './orderUtils';

const RANGES = [{ id: 1, label: 'Today' }, { id: 7, label: '7 days' }, { id: 30, label: '30 days' }];
const SOURCE_NAMES = {
  direct: 'Direct / typed link', fb_profile: 'FB profile', fb_story: 'FB story', fb_page: 'FB Page', fb_groups: 'FB groups',
  fb_marketplace: 'FB Marketplace', facebook: 'Facebook (other)', instagram: 'Instagram', google: 'Google', qr: 'QR label on mat',
  reseller: 'Reseller link', linkedin: 'LinkedIn'
};
const PAGE_NAMES = { '/': 'Home', '/shop': 'Shop', '/cart': 'Cart', '/checkout': 'Checkout', '/recycle': 'Exchange page', '/track': 'Track order' };
const pageName = (p) => PAGE_NAMES[p] || (p.startsWith('/product/') ? 'A product page' : p.startsWith('/trace/') ? 'QR page (scanned)' : p);

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
        if (alive) setResult({ key, data: json, error: '' });
      })
      .catch((e) => { if (alive) setResult(prev => ({ key, data: prev.data, error: e.message })); });
    return () => { alive = false; };
  }, [days, nonce, key]);

  const maxDay = data ? Math.max(1, ...data.daily.map(d => d.visitors)) : 1;
  const maxSrc = data ? Math.max(1, ...data.sources.map(s => s.visitors)) : 1;
  const top = data?.funnel?.[0]?.sessions || 0;

  return (
    <div className="space-y-4">
      <PanelHeader title="Visitors" note="Who visits the store and what they look at. Anonymous: no names or numbers are recorded.">
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
                        <p className="text-xs text-slate-500">{rupees(p.price)} · {p.views} views · {p.carts} added to cart</p>
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
                      <div className="mb-1 flex justify-between text-sm"><span className="text-ink">{SOURCE_NAMES[s.source] || s.source}</span><span className="tabular-nums text-slate-600">{s.visitors}</span></div>
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
        </>
      )}
    </div>
  );
}
