// Anonymous visitor analytics for the admin "Visitors" screen.
//   POST /analytics/event    public, from the shop (see frontend/src/utils/analytics.js)
//   GET  /analytics/summary  admin only: visitors, product views, sources, funnel
const router = require('express').Router();
const mongoose = require('mongoose');
const Visit = require('../models/Visit');
const Product = require('../models/Product');
const auth = require('../middlewares/auth');
const { limiters } = require('../middlewares/security');

const TYPES = ['page', 'product', 'add_to_cart', 'checkout', 'order'];
const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|preview|facebookexternalhit|whatsapp|curl|wget|python|axios|node-fetch/i;
const ID = /^[a-z0-9]{8,40}$/i;
const clean = (v, n) => (typeof v === 'string' ? v.replace(/[^\w\-/.?=& ]/g, '').slice(0, n) : '');

router.post('/event', limiters.analytics, async (req, res) => {
  try {
    const ua = String(req.headers['user-agent'] || '');
    const b = req.body || {};
    // Bots, link previews and our own headless test runs are not visitors
    if (BOT_UA.test(ua) || !ID.test(String(b.vid || '')) || !ID.test(String(b.sid || '')) || !TYPES.includes(b.type)) {
      return res.status(204).end();
    }
    const path = clean(b.path, 120);
    if (path.startsWith('/admin') || path.startsWith('/seller')) return res.status(204).end();
    await Visit.create({
      vid: b.vid,
      sid: b.sid,
      type: b.type,
      path,
      productId: mongoose.isValidObjectId(b.productId) ? String(b.productId) : '',
      source: clean(String(b.source || 'direct').toLowerCase(), 60) || 'direct',
      device: /mobile|android|iphone|ipad/i.test(ua) ? 'mobile' : 'desktop',
      newVisitor: b.newVisitor === true,
      pincode: /^\d{6}$/.test(String(b.pincode || '')) ? String(b.pincode) : '',
      orderId: b.type === 'order' ? clean(b.orderId, 30) : ''
    });
    res.status(204).end();
  } catch (err) {
    res.status(204).end(); // analytics never breaks the shop
  }
});

const adminOnly = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({ success: false, message: 'Admins only.' }));

// Day key in India time (UTC+5:30)
const IST_MS = 330 * 60 * 1000;
const dayKey = (d) => new Date(d.getTime() + IST_MS).toISOString().slice(0, 10);

router.get('/summary', auth, adminOnly, async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);
    const now = new Date();
    // From the start of the first day (IST)
    const startIst = new Date(dayKey(new Date(now.getTime() - (days - 1) * 864e5)) + 'T00:00:00+05:30');
    const rows = await Visit.find({ at: { $gte: startIst } }).select('vid sid type path productId source device newVisitor pincode orderId at').lean();

    const uniq = (arr) => new Set(arr).size;
    const visitors = uniq(rows.map(r => r.vid));
    const sessions = uniq(rows.map(r => r.sid));
    const live = uniq(rows.filter(r => now - r.at < 5 * 60 * 1000).map(r => r.vid));
    const pageViews = rows.filter(r => r.type === 'page').length;

    // Per day
    const byDay = {};
    for (let i = 0; i < days; i++) byDay[dayKey(new Date(startIst.getTime() + i * 864e5 + 6 * 3600e3))] = { visitors: new Set(), views: 0, orders: 0 };
    rows.forEach(r => {
      const d = byDay[dayKey(r.at)];
      if (!d) return;
      d.visitors.add(r.vid);
      if (r.type === 'page') d.views++;
      if (r.type === 'order') d.orders++;
    });
    const daily = Object.entries(byDay).map(([day, d]) => ({ day, visitors: d.visitors.size, views: d.views, orders: d.orders }));

    // Products: views, people, add-to-carts
    const prod = {};
    rows.forEach(r => {
      if (!r.productId) return;
      const p = prod[r.productId] || (prod[r.productId] = { views: 0, people: new Set(), carts: 0 });
      if (r.type === 'product') { p.views++; p.people.add(r.vid); }
      if (r.type === 'add_to_cart') p.carts++;
    });
    const ids = Object.keys(prod);
    const names = ids.length ? await Product.find({ _id: { $in: ids } }).select('name image price').lean() : [];
    const byId = Object.fromEntries(names.map(n => [String(n._id), n]));
    const products = ids.map(id => ({
      id, name: byId[id]?.name || 'Removed product', image: byId[id]?.image || '', price: byId[id]?.price || 0,
      views: prod[id].views, people: prod[id].people.size, carts: prod[id].carts
    })).sort((a, b) => b.people - a.people || b.views - a.views).slice(0, 20);

    // Sources: visitors per channel (the first part of "fb_profile / ...")
    const src = {};
    rows.forEach(r => {
      const k = (r.source || 'direct').split('/')[0].trim() || 'direct';
      (src[k] || (src[k] = new Set())).add(r.vid);
    });
    const sources = Object.entries(src).map(([source, s]) => ({ source, visitors: s.size })).sort((a, b) => b.visitors - a.visitors);

    // Pages
    const pg = {};
    rows.filter(r => r.type === 'page').forEach(r => { pg[r.path] = (pg[r.path] || 0) + 1; });
    const pages = Object.entries(pg).map(([path, views]) => ({ path, views })).sort((a, b) => b.views - a.views).slice(0, 12);

    // Funnel by session: how far each visit got
    const reached = (t) => uniq(rows.filter(r => r.type === t).map(r => r.sid));
    const funnel = [
      { step: 'Visited the store', sessions },
      { step: 'Opened a product', sessions: reached('product') },
      { step: 'Added to cart', sessions: reached('add_to_cart') },
      { step: 'Reached checkout', sessions: reached('checkout') },
      { step: 'Placed an order', sessions: reached('order') }
    ];

    const devices = { mobile: uniq(rows.filter(r => r.device === 'mobile').map(r => r.vid)), desktop: uniq(rows.filter(r => r.device === 'desktop').map(r => r.vid)) };
    const returning = uniq(rows.map(r => r.vid)) - uniq(rows.filter(r => r.newVisitor).map(r => r.vid));

    // Each visitor: how often they came, from where, what they looked at, whether they ordered
    const ppl = {};
    [...rows].sort((a, b) => a.at - b.at).forEach(r => {
      const p = ppl[r.vid] || (ppl[r.vid] = { vid: r.vid, sessions: new Set(), first: r.at, last: r.at, source: r.source, device: r.device, pincode: '', viewed: new Set(), carted: new Set(), orders: [], pages: 0 });
      p.sessions.add(r.sid); p.last = r.at;
      if (r.pincode) p.pincode = r.pincode;
      if (r.type === 'page') p.pages++;
      if (r.type === 'product' && r.productId) p.viewed.add(r.productId);
      if (r.type === 'add_to_cart' && r.productId) p.carted.add(r.productId);
      if (r.type === 'order' && r.orderId) p.orders.push(r.orderId);
    });
    const allPeople = Object.values(ppl);
    // First visit ever (may be before this date range)
    const firstEver = allPeople.length ? await Visit.aggregate([
      { $match: { vid: { $in: allPeople.map(p => p.vid) } } },
      { $group: { _id: '$vid', first: { $min: '$at' } } }
    ]) : [];
    const firstById = Object.fromEntries(firstEver.map(f => [f._id, f.first]));
    const prodName = async (ids) => {
      const missing = ids.filter(id => !byId[id] && mongoose.isValidObjectId(id));
      if (missing.length) (await Product.find({ _id: { $in: missing } }).select('name image price').lean()).forEach(n => { byId[String(n._id)] = n; });
      return ids.map(id => byId[id]?.name || 'Removed product');
    };
    const people = [];
    for (const p of allPeople.sort((a, b) => b.last - a.last).slice(0, 100)) {
      people.push({
        id: p.vid.slice(0, 6).toUpperCase(),
        vid: p.vid,
        visits: p.sessions.size,
        pages: p.pages,
        firstSeen: firstById[p.vid] || p.first,
        lastSeen: p.last,
        source: (p.source || 'direct').split('/')[0].trim() || 'direct',
        device: p.device,
        pincode: p.pincode,
        area: !p.pincode ? 'unknown' : /^1321\d\d$/.test(p.pincode) ? 'panipat' : 'outside',
        viewed: await prodName([...p.viewed]),
        carted: await prodName([...p.carted]),
        orders: p.orders
      });
    }
    const areas = { panipat: 0, outside: 0, unknown: 0 };
    allPeople.forEach(p => { areas[!p.pincode ? 'unknown' : /^1321\d\d$/.test(p.pincode) ? 'panipat' : 'outside']++; });

    res.json({ success: true, days, visitors, sessions, live, pageViews, returning: Math.max(0, returning), daily, products, sources, pages, funnel, devices, areas, people });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ success: false, message: 'Could not load visitor numbers.' });
  }
});

// One visitor's journey (latest 300 events), for the admin's visitor detail view
router.get('/visitor/:vid', auth, adminOnly, async (req, res) => {
  try {
    if (!ID.test(req.params.vid)) return res.status(404).json({ success: false, message: 'Visitor not found.' });
    const rows = await Visit.find({ vid: req.params.vid }).sort({ at: -1 }).limit(300).lean();
    const ids = [...new Set(rows.map(r => r.productId).filter(Boolean))];
    const names = ids.length ? await Product.find({ _id: { $in: ids } }).select('name').lean() : [];
    const nameOf = Object.fromEntries(names.map(n => [String(n._id), n.name]));
    res.json({
      success: true,
      events: rows.map(r => ({ at: r.at, type: r.type, path: r.path, product: r.productId ? (nameOf[r.productId] || 'Removed product') : '', source: r.source, pincode: r.pincode, orderId: r.orderId, visit: r.sid.slice(0, 4) }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Could not load this visitor.' });
  }
});

module.exports = router;
