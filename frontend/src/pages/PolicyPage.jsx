import React, { useState } from 'react';
import { Shield, FileText, Truck, RefreshCw, Mail, Phone, MapPin, CheckCircle, Send } from 'lucide-react';

export default function PolicyPage({ type }) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setContactForm({ name: '', email: '', subject: '', message: '' });
      setSubmitted(false);
      alert("Thank you! Your message has been sent to our customer care team.");
    }, 1500);
  };

  const renderContent = () => {
    switch (type) {
      case 'terms':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-4">
              <FileText className="w-8 h-8 text-[#0066cc]" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Terms & Conditions</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 13, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <p>Welcome to Apna Bazarr. These terms and conditions outline the rules and regulations for the use of Apna Bazarr's Website.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">1. Intellectual Property Rights</h3>
              <p>Other than the content you own, under these Terms, Apna Bazarr and/or its licensors own all the intellectual property rights and materials contained in this Website.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">2. Restrictions</h3>
              <p>You are specifically restricted from all of the following: publishing any Website material in any other media; selling, sublicensing and/or otherwise commercializing any Website material; publicly performing and/or showing any Website material; using this Website in any way that is or may be damaging to this Website.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">3. Limitation of Liability</h3>
              <p>In no event shall Apna Bazarr, nor any of its officers, directors and employees, be held liable for anything arising out of or in any way connected with your use of this Website whether such liability is under contract.</p>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-4">
              <Shield className="w-8 h-8 text-[#0066cc]" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Privacy Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 13, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <p>At Apna Bazarr, accessible from Apna Bazarr, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Apna Bazarr and how we use it.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Information We Collect</h3>
              <p>The personal information that you are asked to provide, and the reasons why you are asked to provide it, will be made clear to you at the point we ask you to provide your personal information.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">How We Use Your Information</h3>
              <p>We use the information we collect in various ways, including to: Provide, operate, and maintain our website; Improve, personalize, and expand our website; Understand and analyze how you use our website; Develop new products, services, features, and functionality.</p>
            </div>
          </div>
        );
      case 'shipping':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-4">
              <Truck className="w-8 h-8 text-[#0066cc]" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shipping Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 13, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <p>Thank you for visiting and shopping at Apna Bazarr. Following are the terms and conditions that constitute our Shipping Policy.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Shipment Processing Time</h3>
              <p>All orders are processed within 1-2 business days. Orders are not shipped or delivered on weekends or holidays.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Shipping Rates & Delivery Estimates</h3>
              <p>Shipping charges for your orders will be calculated and displayed at checkout. Standard shipping to metro cities in India takes 3-5 business days. Express shipping takes 1-2 business days.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Shipment Confirmation & Order Tracking</h3>
              <p>You will receive a Shipment Confirmation email once your order contains your tracking number(s). The tracking number will be active within 24 hours.</p>
            </div>
          </div>
        );
      case 'refunds':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-4">
              <RefreshCw className="w-8 h-8 text-[#0066cc]" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Cancellation & Refund Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: August 13, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <p>We want you to be completely satisfied with your purchase. If you are not entirely happy, we're here to help.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Returns & Exchanges</h3>
              <p>You have 7 calendar days to return or exchange an item from the date you received it. To be eligible for a return, your item must be unused, in the same condition that you received it, and in the original packaging.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Refund Processing</h3>
              <p>Once we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your original method of payment (or store wallet). You will receive the credit within 5-7 business days.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Cancellations</h3>
              <p>You can cancel your order anytime before it has been shipped. Once shipped, the standard return policy will apply.</p>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center space-x-3 border-b pb-4">
                <Mail className="w-8 h-8 text-[#0066cc]" />
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Contact Us</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Have questions about your order, custom sizing, or shipping estimates? Reach out to our customer care team directly. We are active 24/7!
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <Phone className="w-5 h-5 text-[#0066cc]" />
                  <a href="tel:+919306810726" className="hover:underline">+91 9306810726</a>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <Mail className="w-5 h-5 text-[#0066cc]" />
                  <a href="mailto:appnabaazar@gmail.com" className="hover:underline">appnabaazar@gmail.com</a>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <MapPin className="w-5 h-5 text-[#0066cc]" />
                  <span>123 Commerce Way, Tech City, IN 400001</span>
                </div>
              </div>
            </div>

            {/* Inquiry Form (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-lg font-black text-slate-900 border-b pb-2">Send an Inquiry Message</h3>
              
              {submitted ? (
                <div className="py-8 text-center space-y-2">
                  <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
                  <h4 className="font-extrabold text-slate-900 text-sm">Message Sent Successfully!</h4>
                  <p className="text-xs text-slate-500">We will respond to your email address within 2-4 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
                      <input
                        type="text"
                        required
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        placeholder="Enter your name"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                      <input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        placeholder="Enter your email"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      required
                      value={contactForm.subject}
                      onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                      placeholder="e.g. Order Tracking Inquiry"
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Message Comment *</label>
                    <textarea
                      rows={4}
                      required
                      value={contactForm.message}
                      onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                      placeholder="Describe your query in detail..."
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        );
      default:
        return <div className="text-center py-10 text-xs text-slate-400">Page not found.</div>;
    }
  };

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xs">
        {renderContent()}
      </div>
    </div>
  );
}
