import { useEffect, useState } from 'react';

// The shopper's delivery pincode ("Deliver to" in the header, product page pincode check,
// checkout prefill). Kept in localStorage; every component using usePincode() updates
// together through a window event. Works (in memory only) when storage is blocked.
const PINCODE_KEY = 'dhagaro_pincode';
const CHANGE_EVENT = 'dhagaro:pincode';
let memoryPincode = '';

export const isValidPincode = (pin) => /^\d{6}$/.test(String(pin || '').trim());

export function getSavedPincode() {
  try {
    const saved = localStorage.getItem(PINCODE_KEY) || '';
    return isValidPincode(saved) ? saved : memoryPincode;
  } catch {
    return memoryPincode;
  }
}

export function savePincode(pin) {
  const p = String(pin || '').trim();
  if (!isValidPincode(p)) return false;
  memoryPincode = p;
  try { localStorage.setItem(PINCODE_KEY, p); } catch { /* storage blocked */ }
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: p }));
  return true;
}

// Current saved pincode ('' when none), re-rendering when it changes here or in another tab
export function usePincode() {
  const [pin, setPin] = useState(getSavedPincode);
  useEffect(() => {
    const update = () => setPin(getSavedPincode());
    const onStorage = (e) => { if (e.key === PINCODE_KEY) update(); };
    window.addEventListener(CHANGE_EVENT, update);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(CHANGE_EVENT, update);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return pin;
}

// District/state for a pincode via the free India Post API (best effort, cached per pincode)
const placeCache = new Map();
export async function lookupPlace(pin) {
  if (!isValidPincode(pin)) return null;
  if (placeCache.has(pin)) return placeCache.get(pin);
  const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
  const data = await res.json();
  const po = data?.[0]?.PostOffice?.[0];
  const place = po ? { district: po.District, state: po.State } : null;
  placeCache.set(pin, place);
  return place;
}

// { pin, place } for the given pincode; place is null until (or unless) the lookup succeeds
export function usePlace(pin) {
  const [found, setFound] = useState({ pin: '', place: null });
  useEffect(() => {
    if (!isValidPincode(pin)) return undefined;
    let cancelled = false;
    lookupPlace(pin)
      .then(place => { if (!cancelled) setFound({ pin, place }); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [pin]);
  return found.pin === pin ? found.place : null;
}

// "Use my current location": only ever called from a tap. Browser location ->
// OpenStreetMap Nominatim reverse geocode (one request per tap, per their usage policy)
// -> 6-digit Indian pincode. Rejects with a shopper-friendly message.
export function pincodeFromCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error("Your browser can't share location. Please type your pincode."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`;
          const res = await fetch(url, { headers: { Accept: 'application/json' } });
          if (!res.ok) throw new Error('lookup failed');
          const data = await res.json();
          const pin = String(data?.address?.postcode || '').replace(/\s/g, '');
          if (!isValidPincode(pin)) {
            reject(new Error("We couldn't find a pincode for your location. Please type it."));
            return;
          }
          resolve(pin);
        } catch {
          reject(new Error("We couldn't look up your location right now. Please type your pincode."));
        }
      },
      (err) => {
        reject(new Error(err?.code === 1
          ? 'Location permission was denied. Please type your pincode.'
          : "We couldn't get your location. Please type your pincode."));
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
    );
  });
}
