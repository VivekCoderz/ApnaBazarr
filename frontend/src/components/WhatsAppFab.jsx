import React from 'react';
import { useLocation } from 'react-router-dom';
import { whatsappUrl } from '../config/store';

const HIDDEN_PREFIXES = ['/checkout', '/admin', '/seller', '/register-seller'];

// Floating WhatsApp chat button. On a product page the message names the product.
export default function WhatsAppFab({ products = [] }) {
  const { pathname } = useLocation();
  if (HIDDEN_PREFIXES.some(prefix => pathname.startsWith(prefix))) return null;

  let message = 'Hello Apna Bazarr, I have a question about an order.';
  const match = pathname.match(/^\/product\/([^/]+)/);
  if (match) {
    const product = products.find(p => String(p.id) === match[1]);
    if (product) {
      message = `Hello, I am interested in this product: ${product.name} - ${window.location.origin}/product/${product.id}`;
    }
  }

  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="#ffffff" aria-hidden="true">
        <path d="M16.004 3C8.832 3 3 8.83 3 16c0 2.29.6 4.53 1.74 6.5L3 29l6.68-1.75A12.96 12.96 0 0 0 16.004 29C23.17 29 29 23.17 29 16S23.17 3 16.004 3Zm0 23.62c-2.03 0-4.02-.55-5.75-1.58l-.41-.24-3.96 1.04 1.06-3.86-.27-.4A10.6 10.6 0 0 1 5.38 16c0-5.86 4.77-10.62 10.63-10.62 5.85 0 10.61 4.76 10.61 10.62 0 5.86-4.76 10.62-10.62 10.62Zm5.83-7.95c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.72.16-.21.32-.82 1.04-1.01 1.25-.19.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59-.95-.85-1.59-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.72-1.73-.98-2.37-.26-.62-.52-.54-.72-.55h-.61c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66s1.15 3.09 1.31 3.3c.16.21 2.26 3.45 5.47 4.84.76.33 1.36.53 1.83.68.77.24 1.47.21 2.02.13.62-.09 1.89-.77 2.16-1.52.27-.75.27-1.39.19-1.52-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  );
}
