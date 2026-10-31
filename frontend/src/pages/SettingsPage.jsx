import React from 'react';
import { Settings, Lock, MessageCircle } from 'lucide-react';
import SignInPrompt from '../components/SignInPrompt';
import { whatsappUrl, PHONE_DISPLAY } from '../config/store';

// There is no password-change or notification API yet, so this page does not pretend
// to save anything: it points the customer to WhatsApp support instead.
export default function SettingsPage({ currentUser, authReady = true, onOpenAuth }) {
  if (!currentUser) {
    return <SignInPrompt authReady={authReady} onOpenAuth={onOpenAuth} message="Log in to manage your account." />;
  }

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <Settings className="w-6 h-6 text-brand-navy shrink-0" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Account & Security Settings</h1>
            <p className="text-xs text-slate-500">Signed in as {currentUser.email}</p>
          </div>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand-navy" />
            <span>Change password or account details</span>
          </h3>
          <p className="text-sm text-slate-600">
            To change your password, phone number or email, message us on WhatsApp from your registered number
            and we will update it for you, usually within a few hours.
          </p>
          <a
            href={whatsappUrl(`Hi Dhagaro, please help me update my account (${currentUser.email}).`)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-2 px-5 bg-[#25D366] text-brand-navy text-sm font-bold rounded-lg"
          >
            <MessageCircle className="w-4 h-4" />
            <span>WhatsApp {PHONE_DISPLAY}</span>
          </a>
          <p className="text-xs text-slate-500">
            Order updates are sent on WhatsApp to the number you enter at checkout.
          </p>
        </div>

      </div>
    </div>
  );
}
