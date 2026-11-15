// Anonymous visitor analytics (admin → Visitors). Sends small events to the backend:
// page, product, add_to_cart, checkout, order. No name, phone or email is ever sent:
// `vid` is a random id kept in this browser, `sid` a random id for this visit (30 min idle = new visit).
import { getSource } from './source';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const VID_KEY = 'dhagaro_vid';
const SID_KEY = 'dhagaro_sid';
const SESSION_IDLE_MS = 30 * 60 * 1000;

const rand = () => Array.from(crypto.getRandomValues(new Uint8Array(12)), b => b.toString(36).padStart(2, '0')).join('').slice(0, 20);

let memVid = '';
let memSid = { id: '', at: 0 };
let isNew = false;

function visitorId() {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v) { v = rand(); localStorage.setItem(VID_KEY, v); isNew = true; }
    return v;
  } catch {
    if (!memVid) { memVid = rand(); isNew = true; }
    return memVid;
  }
}

function sessionId() {
  const now = Date.now();
  try {
    const s = JSON.parse(sessionStorage.getItem(SID_KEY) || 'null');
    const id = s && now - s.at < SESSION_IDLE_MS ? s.id : rand();
    sessionStorage.setItem(SID_KEY, JSON.stringify({ id, at: now }));
    return id;
  } catch {
    if (!memSid.id || now - memSid.at >= SESSION_IDLE_MS) memSid = { id: rand(), at: now };
    memSid.at = now;
    return memSid.id;
  }
}

export function track(type, data = {}) {
  try {
    const path = window.location.pathname;
    if (path.startsWith('/admin') || path.startsWith('/seller')) return;
    const body = JSON.stringify({
      vid: visitorId(),
      sid: sessionId(),
      type,
      path,
      productId: data.productId ? String(data.productId) : '',
      source: getSource(),
      newVisitor: isNew
    });
    fetch(`${BASE_URL}/analytics/event`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
  } catch {
    // analytics must never break the shop
  }
}
