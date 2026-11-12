// Saved delivery addresses.
// Logged-in shoppers: kept on the account (/auth/addresses, session cookie).
// Guests: the last few addresses used on this device, in localStorage (best effort).
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const LOCAL_KEY = 'dhagaro_addresses';
const LOCAL_MAX = 3;

export const ADDRESS_FIELDS = ['fullName', 'phone', 'pincode', 'flatNo', 'area', 'city', 'state'];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim",
  "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal", "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// India Post state names -> our dropdown values ("NCT of Delhi" -> "Delhi", "Chattisgarh" -> ...)
const squash = (s) => String(s || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z]/g, '');
const STATE_ALIASES = {
  nctofdelhi: 'Delhi',
  newdelhi: 'Delhi',
  chattisgarh: 'Chhattisgarh',
  orissa: 'Odisha',
  pondicherry: 'Puducherry',
  uttaranchal: 'Uttarakhand',
  dadraandnagarhaveli: 'Dadra and Nagar Haveli and Daman and Diu',
  damananddiu: 'Dadra and Nagar Haveli and Daman and Diu',
  andamanandnicobar: 'Andaman and Nicobar Islands'
};
export function stateOption(name) {
  const key = squash(name);
  if (!key) return '';
  if (STATE_ALIASES[key]) return STATE_ALIASES[key];
  return INDIAN_STATES.find(st => squash(st) === key)
    || INDIAN_STATES.find(st => key.includes(squash(st)) || squash(st).includes(key))
    || '';
}

export const cleanPhone = (raw) => {
  let d = String(raw || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  else if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return d.slice(0, 10);
};

// Same rule as the server: all fields, ignoring case and extra spaces
export const addressKey = (a) => ADDRESS_FIELDS
  .map(f => (f === 'phone' ? cleanPhone(a?.[f]) : String(a?.[f] || '').replace(/\s+/g, ' ').trim().toLowerCase()))
  .join('|');

// Only the order's address fields, as trimmed strings
export const pickAddress = (a) => {
  const out = { addressType: a?.addressType || 'Home' };
  ADDRESS_FIELDS.forEach(f => { out[f] = String(a?.[f] || '').trim(); });
  out.phone = cleanPhone(out.phone);
  return out;
};

export const formatAddressLine = (a) =>
  [a.flatNo, a.area, a.city, `${a.state} ${a.pincode}`.trim()].filter(Boolean).join(', ');

// ─── Guests: this device ───────────────────────────────────────────────
export function readLocalAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter(a => a && typeof a === 'object' && ADDRESS_FIELDS.every(f => typeof a[f] === 'string' && a[f]))
      .slice(0, LOCAL_MAX)
      .map((a, i) => ({ ...pickAddress(a), _id: String(a._id || `local-${i}`) }));
  } catch {
    return [];
  }
}

function writeLocalAddresses(list) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list.slice(0, LOCAL_MAX))); } catch { /* storage blocked */ }
}

// Newest first; an identical address moves to the top instead of being added again
export function rememberLocalAddress(address, replaceId) {
  const clean = pickAddress(address);
  const key = addressKey(clean);
  const rest = readLocalAddresses().filter(a => a._id !== replaceId && addressKey(a) !== key);
  const next = [{ ...clean, _id: `local-${Date.now()}` }, ...rest];
  writeLocalAddresses(next);
  return next.slice(0, LOCAL_MAX);
}

export function removeLocalAddress(id) {
  const next = readLocalAddresses().filter(a => a._id !== id);
  writeLocalAddresses(next);
  return next;
}

// ─── Logged in: the account ────────────────────────────────────────────
async function call(path, method = 'GET', body) {
  const res = await fetch(`${BASE_URL}/auth/addresses${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* not JSON (server waking up) */ }
  if (!res.ok || !data?.success) throw new Error(data?.message || 'Could not update your addresses. Please try again.');
  return data.addresses || [];
}

export const fetchAccountAddresses = () => call('');
export const addAccountAddress = (address, isDefault = false) => call('', 'POST', { ...pickAddress(address), isDefault });
export const updateAccountAddress = (id, changes) => call(`/${encodeURIComponent(id)}`, 'PUT', changes);
export const deleteAccountAddress = (id) => call(`/${encodeURIComponent(id)}`, 'DELETE');

// Default first, then the rest in saved order
export const sortAddresses = (list) => [...(list || [])].sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));
