import { useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, Trash2, Search } from 'lucide-react';
import { Card, PanelHeader, Pill, FilterTabs, EmptyState } from './AdminUi';
import { btn, input } from './adminStyles';
import { cloudinaryImage, isComingSoon } from '../../utils/format';
import { categoryLabel } from '../../config/store';
import { rupees } from './orderUtils';
import QrLabelButton from './QrLabelButton';

const isHidden = (p) => p.isActive === false;
const isOut = (p) => p.inStock === false || p.stock <= 0;

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'live', label: 'Live', test: (p) => !isHidden(p) },
  { id: 'hidden', label: 'Hidden', test: isHidden },
  { id: 'out', label: 'Out of stock', test: isOut }
];

const smallBtn = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors cursor-pointer';

function ProductRow({ p, onEdit, onToggleStock, onToggleActive, onDeleteProduct }) {
  const hidden = isHidden(p);
  const out = isOut(p);
  return (
    <li className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${hidden ? 'bg-slate-50' : ''}`}>
      <div className="flex min-w-0 flex-1 gap-3">
        <img
          src={cloudinaryImage(p.image, 120)}
          alt=""
          loading="lazy"
          className={`h-14 w-14 shrink-0 rounded border border-line bg-slate-100 object-cover ${hidden ? 'opacity-50' : ''}`}
        />
        <div className="min-w-0 flex-1">
          <p className={`line-clamp-2 text-sm font-medium ${hidden ? 'text-slate-500' : 'text-ink'}`}>{p.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{categoryLabel(p.category)}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold tabular-nums text-ink">{rupees(p.price)}</span>
            {p.originalPrice > p.price && <span className="text-xs tabular-nums text-slate-400 line-through">{rupees(p.originalPrice)}</span>}
            <span className="text-xs text-slate-500">· Stock {p.stock ?? '-'}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {hidden && <Pill tone="dark">Hidden</Pill>}
            {out && <Pill tone="red">Out of stock</Pill>}
            {p.badge && <Pill tone={isComingSoon(p) ? 'orange' : 'neutral'}>{p.badge}</Pill>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5 sm:flex sm:shrink-0">
        {onEdit && (
          <button type="button" onClick={() => onEdit(p)} className={`${smallBtn} border-line bg-white text-ink hover:bg-slate-50`}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        )}
        {onToggleActive && (
          <button
            type="button"
            onClick={() => onToggleActive(p.id)}
            title={hidden ? 'Show this product in the store again' : 'Hide this product from the store'}
            className={`${smallBtn} ${hidden ? 'border-brand-navy bg-brand-navy text-white hover:bg-blue-700' : 'border-line bg-white text-ink hover:bg-slate-50'}`}
          >
            {hidden ? <><Eye className="h-3.5 w-3.5" /> Show</> : <><EyeOff className="h-3.5 w-3.5" /> Hide</>}
          </button>
        )}
        <button
          type="button"
          onClick={() => onToggleStock(p.id)}
          title={p.inStock !== false ? 'Mark out of stock' : 'Mark in stock'}
          className={`${smallBtn} ${p.inStock !== false ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100'}`}
        >
          {p.inStock !== false ? 'In stock' : 'Sold out'}
        </button>
        <QrLabelButton product={p} className={`${smallBtn} border-line bg-white text-ink hover:bg-slate-50`} />
        <button type="button" onClick={() => onDeleteProduct(p.id)} title="Delete product" aria-label="Delete product" className={`${smallBtn} border-line bg-white text-slate-500 hover:border-red-200 hover:text-red-600`}>
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export default function ProductsPanel({ products, onAdd, onEdit, onToggleStock, onToggleActive, onDeleteProduct }) {
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();
  const searched = q ? products.filter(p => `${p.name} ${p.category}`.toLowerCase().includes(q)) : products;
  const tabs = FILTERS.map(f => ({ id: f.id, label: f.label, count: searched.filter(f.test).length }));
  const list = searched.filter((FILTERS.find(f => f.id === filter) || FILTERS[0]).test);

  return (
    <div className="space-y-4">
      <PanelHeader
        title="Products"
        note={`${products.filter(p => !isHidden(p)).length} live · ${products.filter(isHidden).length} hidden (not shown in the store)`}
      >
        <button type="button" onClick={onAdd} className={btn.primary}>
          <Plus className="h-4 w-4" /> Add product
        </button>
      </PanelHeader>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className={`${input} pl-9`} />
      </div>

      <FilterTabs tabs={tabs} active={filter} onChange={setFilter} />

      <Card>
        {list.length === 0 ? (
          <EmptyState>{products.length === 0 ? 'No products yet.' : 'No products match.'}</EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {list.map(p => (
              <ProductRow key={p.id} p={p} onEdit={onEdit} onToggleStock={onToggleStock} onToggleActive={onToggleActive} onDeleteProduct={onDeleteProduct} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
