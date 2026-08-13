import React, { useState } from 'react';
import { Settings, Lock, Bell, Shield, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center space-x-3">
          <Settings className="w-6 h-6 text-[#0066cc]" />
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Account & Security Settings</h1>
            <p className="text-xs text-slate-500">Manage password, login notifications, and email preferences</p>
          </div>
        </div>

        {/* Settings Form */}
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          {saved && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Change Password</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input type="password" placeholder="••••••••" className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc]" />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <h3 className="font-extrabold text-sm text-slate-900 border-b pb-2">Notification Preferences</h3>
            <div className="space-y-2 text-xs text-slate-700">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#0066cc]" />
                <span>Receive WhatsApp & SMS order tracking updates (+91)</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#0066cc]" />
                <span>Email alerts for Rakhi Specials & Diwali sale discounts</span>
              </label>
            </div>
          </div>

          <button type="submit" className="px-6 py-3 bg-[#0066cc] text-white text-xs font-extrabold rounded-xl shadow-md">
            SAVE SETTINGS
          </button>
        </form>

      </div>
    </div>
  );
}
