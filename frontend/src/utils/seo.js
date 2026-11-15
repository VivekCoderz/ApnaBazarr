// Per-page SEO for the single-page app: title, meta description, canonical URL and the
// matching Open Graph tags, updated on every page change (Google reads the rendered page).
// Product pages also get these in the first HTML from api/product.js, for link previews.
import { useEffect } from 'react';

export const SITE_URL = 'https://dhagaro.vercel.app';
export const DEFAULT_TITLE = 'Dhagaro | Bath Mats from Panipat from ₹129 · Cash on Delivery';
export const DEFAULT_DESCRIPTION = 'Buy soft, anti-slip bath mats online straight from Panipat, from ₹129. Cash on delivery, free delivery in Panipat and 7-day easy returns. Bedsheets, towels and cushion covers coming soon.';

// First sentence of a text, at most `max` characters, cut at a word boundary
export function firstSentence(text, max = 110) {
  const s = String(text || '').split('\n')[0].trim().split(/(?<=\.)\s/)[0];
  return s.length <= max ? s : s.slice(0, max).replace(/\s+\S*$/, '') + '…';
}

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function applySeo({ title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, path, noindex = false } = {}) {
  const url = SITE_URL + (path ?? window.location.pathname);
  const desc = String(description).replace(/\s+/g, ' ').trim().slice(0, 160);
  document.title = title;
  setMeta('name', 'description', desc);
  setMeta('name', 'robots', noindex ? 'noindex, follow' : 'index, follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:url', url);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);
  setCanonical(url);
}

// Page component hook. Pass `ready = false` while the page's data is still loading.
export function useSeo({ title, description, path, noindex = false, ready = true } = {}) {
  useEffect(() => {
    if (!ready) return;
    applySeo({ title, description, path, noindex });
  }, [title, description, path, noindex, ready]);
}
