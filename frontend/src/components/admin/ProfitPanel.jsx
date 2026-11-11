import { useMemo } from 'react';
import { Card, PanelHeader, StatTile, EmptyState } from './AdminUi';
import { rupees } from './orderUtils';

// Revenue vs cost across all orders, and margin per product.
// Cost falls back to 60% of the selling price when no cost price is saved (same rule as before).
export default function ProfitPanel({ orders, products }) {
  const { totalRevenue, totalCost } = useMemo(() => {
    const revenue = orders.reduce((sum, ord) => sum + (Number(ord.totalAmount) || 0), 0);
    const cost = orders.reduce((sum, ord) => {
      const itemsCost = (ord.items || []).reduce((itemSum, item) => {
        const orig = products.find(p => String(p.id) === String(item.productId)) || products.find(p => p.name === item.name);
        const perPiece = orig && orig.costPrice ? orig.costPrice : item.price * 0.6;
        return itemSum + perPiece * item.quantity;
      }, 0);
      const offlineExpenses = ord.isOffline ? (ord.packagingCost || 0) + (ord.shippingCost || 0) : 0;
      return sum + itemsCost + offlineExpenses;
    }, 0);
    return { totalRevenue: revenue, totalCost: cost };
  }, [orders, products]);

  const netProfit = totalRevenue - totalCost;
  const marginPercent = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-5">
      <PanelHeader title="Profit" note="All orders. Cost price is private; customers only see the selling price." />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Revenue" value={rupees(totalRevenue)} sub={`${orders.length} orders`} />
        <StatTile label="Cost" value={rupees(totalCost)} sub="Purchase + offline costs" />
        <StatTile label="Profit" value={rupees(netProfit)} sub={`${marginPercent}% margin`} />
        <StatTile label="Products" value={products.length} />
      </div>

      <Card>
        <div className="border-b border-line px-4 py-3">
          <h3 className="text-sm font-semibold text-ink">Margin per product</h3>
          <p className="text-xs text-slate-500">Estimated at 60% cost where no cost price is saved</p>
        </div>
        {products.length === 0 ? (
          <EmptyState>No products yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            <li className="hidden grid-cols-[1fr_6rem_6rem_6rem_4rem] gap-3 px-4 py-2 text-xs font-medium text-slate-500 md:grid">
              <span>Product</span><span className="text-right">Cost</span><span className="text-right">Selling</span><span className="text-right">Profit</span><span className="text-right">Margin</span>
            </li>
            {products.map(item => {
              const cost = item.costPrice || item.price * 0.6;
              const profit = item.price - cost;
              const margin = item.price > 0 ? ((profit / item.price) * 100).toFixed(1) : '0.0';
              return (
                <li key={item.id} className="grid grid-cols-3 gap-x-3 gap-y-1 px-4 py-2.5 text-sm md:grid-cols-[1fr_6rem_6rem_6rem_4rem] md:items-center">
                  <span className="col-span-3 flex min-w-0 items-center gap-2 md:col-span-1">
                    <img src={item.image} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded border border-line object-cover" />
                    <span className="truncate text-ink">{item.name}</span>
                  </span>
                  <span className="tabular-nums text-slate-600 md:text-right"><span className="text-xs text-slate-400 md:hidden">Cost </span>₹{cost.toFixed(0)}</span>
                  <span className="tabular-nums text-ink md:text-right"><span className="text-xs text-slate-400 md:hidden">Sell </span>₹{Number(item.price).toFixed(0)}</span>
                  <span className="tabular-nums font-medium text-emerald-700 md:text-right"><span className="text-xs font-normal text-slate-400 md:hidden">Profit </span>₹{profit.toFixed(0)} <span className="text-xs font-normal text-slate-500 md:hidden">({margin}%)</span></span>
                  <span className="hidden tabular-nums text-slate-600 md:block md:text-right">{margin}%</span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
