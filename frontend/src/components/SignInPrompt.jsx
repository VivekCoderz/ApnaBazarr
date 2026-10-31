import React from 'react';
import { Loader2, LogIn } from 'lucide-react';

// Shown on account pages: a short wait while the saved session is checked, then a
// sign-in prompt for visitors who are not logged in
export default function SignInPrompt({ authReady, onOpenAuth, message }) {
  return (
    <div className="py-16 bg-slate-50 min-h-[60vh] px-4">
      <div className="max-w-md mx-auto bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        {!authReady ? (
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm font-semibold" role="status">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading your account...</span>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-brand-navy">Please log in</h1>
            <p className="text-sm text-slate-600">{message}</p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="inline-flex min-h-11 items-center gap-2 px-6 bg-brand-cta hover:bg-brand-cta-hover text-white text-sm font-semibold rounded-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Sign up</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
