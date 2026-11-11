import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { Card, PanelHeader, Pill, StatTile, EmptyState } from './AdminUi';
import { isToday, isNewOrder, isCodOrder, rupees, sourceChannel, sortNewestFirst, orderDate, paymentLabel } from './orderUtils';

export default function OverviewPanel({ orders, products, onOpenOrders }) {
  const stats = useMemo(() => {
    const today = orders.filter(isToday);
    const fresh = orders.filter(isNewOrder);
    const delivered = orders.filter(o => o.orderStatus === 'Delivered');
    const pending = orders.filter(o => o.orderStatus !== 'Delivered');
    const sum = (list) => list.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);

    const bySource = {};
    orders.forEach(o => {
      const ch = sourceChannel(o);
      bySource[ch] = (bySource[ch] || 0) + 1;
    });
    const sources = Object.entries(bySource).sort((a, b) => b[1] - a[1]);

    return {
      todayCount: today.length,
      todayValue: sum(today),
      newCount: fresh.length,
      newCod: fresh.filter(isCodOrder).length,
      deliveredValue: sum(delivered),
      deliveredCount: delivered.length,
      pendingValue: sum(pending),
      pendingCount: pending.length,
      sources,
      maxSource: sources[0]?.[1] || 1,
      needsAction: sortNewestFirst(fresh).slice(0, 5)
    };
  }, [orders]);

  const hiddenCount = products.filter(p => p.isActive === false).length;
  const outCount = products.filter(p => p.inStock === false || p.stock <= 0).length;

  return (
    <div className="space-y-5">
      <PanelHeader title="Overview" note={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Orders today" value={stats.todayCount} sub={rupees(stats.todayValue)} />
        <StatTile
          label="Needs action"
          value={stats.newCount}
          sub={stats.newCod > 0 ? `${stats.newCod} COD to confirm` : 'New orders'}
          accent={stats.newCount > 0}
          onClick={() => onOpenOrders('new')}
        />
        <StatTile label="Delivered revenue" value={rupees(stats.deliveredValue)} sub={`${stats.deliveredCount} orders`} />
        <StatTile label="Pending revenue" value={rupees(stats.pendingValue)} sub={`${stats.pendingCount} not delivered yet`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">New orders to confirm</h3>
            <button type="button" onClick={() => onOpenOrders('new')} className="inline-flex min-h-10 items-center gap-0.5 text-sm font-medium text-brand-navy hover:underline cursor-pointer">
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {stats.needsAction.length === 0 ? (
            <EmptyState>Nothing waiting. All new orders are handled.</EmptyState>
          ) : (
            <ul className="divide-y divide-line">
              {stats.needsAction.map(o => {
                const pay = paymentLabel(o);
                return (
                  <li key={o.orderId}>
                    <button type="button" onClick={() => onOpenOrders('new', o.orderId)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 cursor-pointer">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{o.shippingAddress?.fullName || 'Customer'}</p>
                        <p className="text-xs text-slate-500">{o.orderId} · {orderDate(o)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums text-ink">{rupees(o.totalAmount)}</p>
                        <Pill tone={pay.tone}>{pay.text}</Pill>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-sm font-semibold text-ink">Orders by source</h3>
            <p className="text-xs text-slate-500">Where customers came from (all {orders.length} orders)</p>
          </div>
          {stats.sources.length === 0 ? (
            <EmptyState>No orders yet.</EmptyState>
          ) : (
            <ul className="space-y-2.5 px-4 py-3">
              {stats.sources.map(([name, count]) => (
                <li key={name} title={`${name}: ${count} orders`}>
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate capitalize text-slate-700">{name.replace(/_/g, ' ')}</span>
                    <span className="shrink-0 font-semibold tabular-nums text-ink">{count}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-brand-navy" style={{ width: `${Math.max(4, (count / stats.maxSource) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Products" value={products.length} />
        <StatTile label="Hidden" value={hiddenCount} />
        <StatTile label="Out of stock" value={outCount} />
      </div>
    </div>
  );
}
