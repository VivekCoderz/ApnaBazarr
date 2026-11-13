import { useState } from 'react';
import { QrCode } from 'lucide-react';

// Downloads a printable label (PNG) for one product: QR code to its "where this mat comes
// from" page (/trace/:id), the product name and a one-line call to scan. utm_source=qr shows
// orders that came from a scanned label in the admin ("From: qr").
const LABEL_W = 600;
const LABEL_H = 760;

const traceUrl = (id) => `${window.location.origin}/trace/${id}?utm_source=qr`;

function wrap(ctx, text, maxWidth) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

async function makeLabel(product) {
  const { default: QRCode } = await import('qrcode');
  const qr = document.createElement('canvas');
  await QRCode.toCanvas(qr, traceUrl(product.id), { width: 440, margin: 1, color: { dark: '#0B2A55', light: '#ffffff' } });

  const c = document.createElement('canvas');
  c.width = LABEL_W;
  c.height = LABEL_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, LABEL_W, LABEL_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0B2A55';
  ctx.font = 'bold 44px system-ui, sans-serif';
  ctx.fillText('Dhagaro', LABEL_W / 2, 64);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText('Made in Panipat', LABEL_W / 2, 98);
  ctx.drawImage(qr, (LABEL_W - 440) / 2, 120);
  ctx.fillStyle = '#0B2A55';
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillText('Scan: where this mat comes from', LABEL_W / 2, 610);
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillStyle = '#334155';
  wrap(ctx, product.name, LABEL_W - 60).forEach((l, i) => ctx.fillText(l, LABEL_W / 2, 652 + i * 30));
  ctx.font = '18px system-ui, sans-serif';
  ctx.fillStyle = '#047857';
  ctx.fillText('Care guide · Reorder · Old-clothes exchange', LABEL_W / 2, 730);
  return c.toDataURL('image/png');
}

export default function QrLabelButton({ product, className }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const url = await makeLabel(product);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dhagaro-qr-${String(product.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}.png`;
      a.click();
    } catch (err) {
      alert('Could not make the QR label: ' + (err.message || err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" onClick={download} disabled={busy} title="Download a printable QR label for this product" className={className}>
      <QrCode className="h-3.5 w-3.5" /> {busy ? '…' : 'QR'}
    </button>
  );
}
