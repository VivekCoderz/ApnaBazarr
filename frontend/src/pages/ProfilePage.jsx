import React from 'react';
import { User, Mail, Phone, MapPin, ShieldCheck, CheckCircle } from 'lucide-react';

export default function ProfilePage({ currentUser }) {
  const user = currentUser || {
    name: "Guest User",
    email: "guest@apnabazarr.com",
    phone: "9999999999"
  };

  return (
    <div className="py-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Profile Card Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-3xl flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 shadow-md">
          <div className="w-16 h-16 rounded-full bg-[#0066cc] text-white flex items-center justify-center font-black text-2xl shadow-inner shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">{user.name}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
            <span className="inline-block mt-2 text-[10px] font-extrabold bg-emerald-900/60 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-700">
              VERIFIED APNA BAZARR CUSTOMER
            </span>
          </div>
        </div>

        {/* Profile Details Form */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <h3 className="font-extrabold text-base text-slate-900 border-b pb-3">Personal Information</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Full Name</label>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                <User className="w-4 h-4 text-[#0066cc]" />
                <span>{user.name}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Email Address</label>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                <Mail className="w-4 h-4 text-[#0066cc]" />
                <span>{user.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Mobile Number (+91)</label>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                <Phone className="w-4 h-4 text-[#0066cc]" />
                <span>+91 {user.phone || '9876543210'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Default Region</label>
              <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800">
                <MapPin className="w-4 h-4 text-[#0066cc]" />
                <span>India (₹ INR)</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
