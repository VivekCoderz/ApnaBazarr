import { useEffect, useState } from 'react';
import { usePincode } from './location';
import { isPanipatPincode } from '../config/store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Shipping quotes come from the server (POST /orders/calculate-shipping) so product
// cost/margin never reaches the browser. Quotes are cached per cart composition and
// delivery area (only Panipat changes the charge: free delivery on every order there).
const quoteCache = new Map();

const itemsKey = (items) =>
  items
    .filter(item => item.quantity > 0)
    .map(item => `${item.id || item.productId}:${item.quantity}`)
    .sort()
    .join('|');

// Returns { shipping, loading }: shipping is null until the quote arrives (or if it failed).
// pincode: the delivery pincode to quote for; defaults to the shopper's saved pincode
// (header "Deliver to" chip). Checkout passes the address pincode.
export function useShippingQuote(items, pincode) {
  const savedPincode = usePincode();
  const deliveryPincode = String(pincode ?? savedPincode ?? '').trim();
  const panipat = isPanipatPincode(deliveryPincode);
  const cartKey = itemsKey(items);
  const key = cartKey ? `${cartKey}${panipat ? '@panipat' : ''}` : '';
  const [, setVersion] = useState(0);
  const [failedKey, setFailedKey] = useState(null);

  useEffect(() => {
    if (!key || quoteCache.has(key)) return;
    let cancelled = false;

    // Debounce so rapid +/- quantity clicks send a single request
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE_URL}/orders/calculate-shipping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...(panipat ? { deliveryPincode } : {}),
            items: cartKey.split('|').map(part => {
              const [productId, quantity] = part.split(':');
              return { productId, quantity: Number(quantity) };
            })
          })
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        quoteCache.set(key, data.shippingCharges);
        if (!cancelled) setVersion(v => v + 1);
      } catch (err) {
        console.warn('Failed to fetch shipping quote:', err);
        if (!cancelled) setFailedKey(key);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  // key covers cartKey + panipat; deliveryPincode only matters through panipat
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { shipping: 0, loading: false };
  if (quoteCache.has(key)) return { shipping: quoteCache.get(key), loading: false };
  return { shipping: null, loading: failedKey !== key };
}
