import { useEffect, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import Badge from '../ui/Badge';
import {
  sortAddresses, formatAddressLine, fetchAccountAddresses, updateAccountAddress, deleteAccountAddress
} from '../../utils/addresses';

// Profile page: the account's saved delivery addresses (added at checkout).
// Set one as default (pre-selected at checkout) or remove it.
export default function SavedAddresses({ initial = [] }) {
  const [list, setList] = useState(() => sortAddresses(initial));
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchAccountAddresses()
      .then(addresses => { if (!cancelled) setList(sortAddresses(addresses)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const run = async (id, action) => {
    setBusyId(id);
    setError('');
    try {
      setList(sortAddresses(await action()));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = (a) => {
    if (!window.confirm('Remove this address?')) return;
    run(a._id, () => deleteAccountAddress(a._id));
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
      <h3 className="font-extrabold text-base text-slate-900 border-b pb-3">Saved addresses</h3>
      {error && <p className="text-sm text-red-700 font-semibold bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {list.length === 0 ? (
        <p className="text-sm text-slate-600">
          No saved addresses yet. The address you use at checkout is saved here for next time.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map(a => (
            <li key={a._id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-navy mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-slate-900 break-words">{a.fullName}</span>
                    <span className="text-sm text-slate-600">· {a.phone}</span>
                    {a.isDefault && <Badge tone="new">Default</Badge>}
                  </div>
                  <p className="text-sm text-slate-600 break-words">{formatAddressLine(a)}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 pl-6">
                {busyId === a._id && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                {!a.isDefault && (
                  <button type="button" disabled={busyId === a._id} onClick={() => run(a._id, () => updateAccountAddress(a._id, { isDefault: true }))} className="min-h-9 text-sm font-semibold text-brand-navy disabled:opacity-50">
                    Set as default
                  </button>
                )}
                <button type="button" disabled={busyId === a._id} onClick={() => remove(a)} className="min-h-9 text-sm font-semibold text-slate-600 hover:text-red-700 disabled:opacity-50">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
