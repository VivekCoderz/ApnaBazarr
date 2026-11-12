import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import Badge from '../ui/Badge';
import { formatAddressLine } from '../../utils/addresses';

// Saved addresses as radio cards (Amazon/Flipkart style): tap one to deliver there.
// `firstBadge` labels the top card ("Default" for account addresses, "Last used" on this device).
export default function AddressPicker({
  addresses,
  selectedId,
  onSelect,
  onEdit,
  onRemove,
  onAddNew,
  busyId = null,
  firstBadge = 'Default',
  canAddMore = true
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-2" role="radiogroup" aria-label="Saved addresses">
        {addresses.map((a, i) => {
          const selected = a._id === selectedId;
          const showBadge = firstBadge === 'Default' ? a.isDefault : i === 0;
          return (
            <div
              key={a._id}
              className={`rounded-lg border-2 transition-colors ${selected ? 'border-brand-navy bg-brand-cream' : 'border-slate-200 bg-white'}`}
            >
              <label className="flex items-start gap-3 p-3 cursor-pointer">
                <input
                  type="radio"
                  name="saved-address"
                  className="mt-1 h-4 w-4 shrink-0 accent-brand-navy"
                  checked={selected}
                  onChange={() => onSelect(a)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-slate-900 break-words">{a.fullName}</span>
                    <span className="text-sm text-slate-600">· {a.phone}</span>
                    {showBadge && <Badge tone="new">{firstBadge}</Badge>}
                    {a.addressType && a.addressType !== 'Home' && <Badge>{a.addressType}</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm text-slate-600 break-words">{formatAddressLine(a)}</span>
                </span>
              </label>
              <div className="flex items-center gap-4 border-t border-slate-200/80 px-3 py-1.5 pl-10">
                <button type="button" onClick={() => onEdit(a)} disabled={busyId === a._id} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-brand-navy disabled:opacity-50">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button type="button" onClick={() => onRemove(a)} disabled={busyId === a._id} className="inline-flex min-h-9 items-center gap-1 text-sm font-semibold text-slate-600 hover:text-red-700 disabled:opacity-50">
                  {busyId === a._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddNew}
        className="w-full min-h-11 rounded-lg border-2 border-dashed border-slate-300 text-sm font-semibold text-brand-navy hover:border-brand-navy flex items-center justify-center gap-1.5"
      >
        <Plus className="h-4 w-4" /> Add a new address
      </button>
      {!canAddMore && (
        <p className="text-xs text-slate-500">You have 5 saved addresses. Remove one to save a new address for next time.</p>
      )}
    </div>
  );
}
