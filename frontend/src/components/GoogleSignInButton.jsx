import { useEffect, useRef, useState } from 'react';

// "Continue with Google" via Google Identity Services. Renders nothing until
// VITE_GOOGLE_CLIENT_ID is set (Vercel env), so the site works without it.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

let gsiPromise;
function loadGsi() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!gsiPromise) {
    gsiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_SRC;
      s.async = true;
      s.onload = resolve;
      s.onerror = () => { gsiPromise = null; reject(new Error('Could not load Google sign-in.')); };
      document.head.appendChild(s);
    });
  }
  return gsiPromise;
}


export default function GoogleSignInButton({ onCredential, text = 'continue_with' }) {
  const box = useRef(null);
  const cb = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => { cb.current = onCredential; }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !box.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => cb.current?.(resp.credential),
          ux_mode: 'popup',
          context: 'signin',
        });
        window.google.accounts.id.renderButton(box.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'center',
          width: Math.min(box.current.offsetWidth || 360, 400),
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [text]);

  if (!CLIENT_ID || failed) return null;
  return <div ref={box} className="flex min-h-[44px] w-full justify-center" />;
}
