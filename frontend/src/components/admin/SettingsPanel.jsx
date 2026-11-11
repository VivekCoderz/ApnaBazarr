import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Card, PanelHeader } from './AdminUi';
import { btn, input, label, hint } from './adminStyles';
import { BASE_URL, adminHeaders } from './adminApi';
import { SELLER_MARKETPLACE_ENABLED } from '../../config/store';

// Store settings (PUT /settings). The commission field only matters for the seller
// marketplace, so it is hidden while that is switched off (its saved value is still sent).
export default function SettingsPanel({ codCode, commission, onCodCodeChange, onCommissionChange, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const canSave = String(codCode || '').trim() && String(commission || '').trim();

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PUT',
        headers: adminHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ secret_cod_code: codCode, commission_percentage: commission })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to update settings');
      onSaved(data.settings);
      setSuccess('Settings saved.');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PanelHeader title="Settings" />
      <Card className="p-4">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className={label} htmlFor="st-cod">Secret COD unlock code</label>
            <input id="st-cod" type="text" value={codCode} onChange={(e) => onCodCodeChange(e.target.value)} placeholder="e.g. APNACOD" className={`${input} uppercase`} />
            <p className={hint}>If a customer enters this code at checkout, Cash on Delivery is unlocked.</p>
          </div>

          {SELLER_MARKETPLACE_ENABLED && (
            <div>
              <label className={label} htmlFor="st-comm">Seller commission (%)</label>
              <input id="st-comm" type="number" min={0} max={100} value={commission} onChange={(e) => onCommissionChange(e.target.value)} placeholder="e.g. 10" className={input} />
              <p className={hint}>Cut the website keeps from sales by other sellers.</p>
            </div>
          )}

          {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{success}</p>}

          <button type="submit" disabled={loading || !canSave} className={btn.primary}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save settings
          </button>
        </form>
      </Card>
    </div>
  );
}
