// "Picked for you": remembers, in this browser only, which products the shopper opened
// and added to cart, and ranks the home grid so those (and others from the same
// category) come first. Nothing is sent to the server for this.
const KEY = 'dhagaro_interest';
const MAX_ITEMS = 30;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

export function recordInterest(product, kind = 'view') {
  if (!product?.id) return;
  try {
    const all = read();
    const id = String(product.id);
    const it = all[id] || { v: 0, c: 0, cat: product.category || '' };
    if (kind === 'cart') it.c += 1; else it.v += 1;
    it.t = Date.now();
    it.cat = product.category || it.cat;
    all[id] = it;
    const trimmed = Object.fromEntries(Object.entries(all).sort((a, b) => (b[1].t || 0) - (a[1].t || 0)).slice(0, MAX_ITEMS));
    localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    // storage blocked: no personalisation
  }
}

// { list, personalized }: products in the order this shopper is most likely to want.
// With no history the original order is kept.
export function rankForVisitor(products) {
  const interest = read();
  const ids = Object.keys(interest);
  if (!ids.length || !products.length) return { list: products, personalized: false };
  const catWeight = {};
  ids.forEach(id => {
    const it = interest[id];
    if (it.cat) catWeight[it.cat] = (catWeight[it.cat] || 0) + it.v + it.c * 3;
  });
  const now = Date.now();
  const score = (p) => {
    const it = interest[String(p.id)];
    let s = (catWeight[p.category] || 0) * 0.5;
    if (it) {
      const fresh = Math.max(0, 1 - (now - (it.t || 0)) / (14 * 864e5)); // fades over 2 weeks
      s += (it.c * 6 + it.v * 3) * (0.5 + fresh);
    }
    return s;
  };
  const scored = products.map((p, i) => ({ p, i, s: score(p) }));
  if (!scored.some(x => x.s > 0)) return { list: products, personalized: false };
  scored.sort((a, b) => b.s - a.s || a.i - b.i);
  return { list: scored.map(x => x.p), personalized: true };
}
