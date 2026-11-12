import { INDIAN_STATES } from '../../utils/addresses';

export const inputClass = 'w-full px-3 py-2.5 text-base border border-slate-300 rounded-lg focus:outline-none focus:border-brand-navy bg-white';
export const labelClass = 'block text-sm font-semibold text-slate-700 mb-1';

export const FieldError = ({ message }) => (message
  ? <p className="text-sm text-red-600 font-semibold mt-1">{message}</p>
  : null);

// Delivery address fields, pincode first (city and state are filled from it by the page).
// Controlled: `address` + onChange(field, value). autoComplete/inputMode let the phone's
// own autofill (Google / iOS contacts) fill the whole form in one tap.
export default function AddressForm({ address, onChange, errors = {}, placeLoading = false }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="co-pincode">Pincode *</label>
          <input id="co-pincode" name="postal-code" type="text" inputMode="numeric" autoComplete="shipping postal-code" maxLength={6} value={address.pincode} onChange={(e) => onChange('pincode', e.target.value.replace(/\D/g, ''))} placeholder="132103" className={inputClass} />
          {placeLoading
            ? <p className="text-xs text-slate-500 mt-1">Finding your city...</p>
            : <p className="text-xs text-slate-500 mt-1">City and state fill in automatically</p>}
          <FieldError message={errors.pincode} />
        </div>
        <div>
          <label className={labelClass} htmlFor="co-flat">House / flat no. *</label>
          <input id="co-flat" name="address-line1" type="text" maxLength={100} autoComplete="shipping address-line1" value={address.flatNo} onChange={(e) => onChange('flatNo', e.target.value)} placeholder="H.No. 12, 2nd floor" className={inputClass} />
          <FieldError message={errors.flatNo} />
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="co-area">Area / street *</label>
        <input id="co-area" name="address-line2" type="text" maxLength={100} autoComplete="shipping address-line2" value={address.area} onChange={(e) => onChange('area', e.target.value)} placeholder="Model Town, near the temple" className={inputClass} />
        <FieldError message={errors.area} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="co-city">City *</label>
          <input id="co-city" name="address-level2" type="text" maxLength={100} autoComplete="shipping address-level2" value={address.city} onChange={(e) => onChange('city', e.target.value)} placeholder="Panipat" className={inputClass} />
          <FieldError message={errors.city} />
        </div>
        <div>
          <label className={labelClass} htmlFor="co-state">State *</label>
          <select id="co-state" name="address-level1" autoComplete="shipping address-level1" value={address.state} onChange={(e) => onChange('state', e.target.value)} className={inputClass}>
            <option value="">Select state</option>
            {INDIAN_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
          </select>
          <FieldError message={errors.state} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelClass} htmlFor="co-name">Full name *</label>
          <input id="co-name" name="name" type="text" maxLength={100} autoComplete="shipping name" value={address.fullName} onChange={(e) => onChange('fullName', e.target.value)} placeholder="Your name" className={inputClass} />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <label className={labelClass} htmlFor="co-phone">Mobile number (WhatsApp) *</label>
          <input id="co-phone" name="tel" type="tel" inputMode="numeric" autoComplete="shipping tel" maxLength={14} value={address.phone} onChange={(e) => onChange('phone', e.target.value)} placeholder="9876543210" className={inputClass} />
          <p className="text-xs text-slate-500 mt-1">We will WhatsApp or call you on this number</p>
          <FieldError message={errors.phone} />
        </div>
      </div>
    </div>
  );
}
