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
      newVisitor: b.newVisitor === true
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
    const rows = await Visit.find({ at: { $gte: startIst } }).select('vid sid type path productId source device newVisitor at').lean();

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

    res.json({ success: true, days, visitors, sessions, live, pageViews, returning: Math.max(0, returning), daily, products, sources, pages, funnel, devices });
  } catch (err) {
    console.error('Analytics summary error:', err);
    res.status(500).json({ success: false, message: 'Could not load visitor numbers.' });
  }
});

module.exports = router;
