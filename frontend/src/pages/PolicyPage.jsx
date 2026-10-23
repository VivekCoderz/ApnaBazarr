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
              <FileText className="w-8 h-8 text-brand-navy" />
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
              <Shield className="w-8 h-8 text-brand-navy" />
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
              <Truck className="w-8 h-8 text-brand-navy" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Shipping Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: October 24, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <p>Hum Panipat, Haryana se poore India mein deliver karte hain.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Dispatch</h3>
              <p>Order ke 2 din mein Panipat se dispatch (Monday se Saturday). Sunday aur tyohaar ki chhutti ke din dispatch nahi hota.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Delivery kitne din mein</h3>
              <p>Dispatch ke baad Haryana/Delhi mein aam taur par 2–4 din, baaki India mein 4–8 din. Door ke ilaakon (North-East, J&K, islands) mein thoda zyada time lag sakta hai. Hum koi express ya same-day delivery nahi dete.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Delivery charge</h3>
              <p>₹499 ya usse zyada ke order par delivery FREE. Usse kam par ₹49 flat.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Cash on Delivery</h3>
              <p>₹3,000 tak ke order par Cash on Delivery available hai. COD order ke baad hum WhatsApp pe confirm karte hain; confirm hone ke baad hi saman bheja jata hai.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Tracking</h3>
              <p>Dispatch hone par tracking number WhatsApp pe bheja jata hai. Koi sawal ho to WhatsApp karein: +91 93068 10726.</p>
            </div>
          </div>
        );
      case 'refunds':
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 border-b pb-4">
              <RefreshCw className="w-8 h-8 text-brand-navy" />
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Return & Refund Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: October 24, 2026</p>
            <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed font-semibold">
              <h3 className="text-base font-black text-slate-900 pt-2">7-din Return / Exchange</h3>
              <p>Saman kharab nikla, galat saman aaya, ya size sahi nahi hai? Delivery ke 7 din ke andar WhatsApp karein (+91 93068 10726) aur saman ki photo bhejein. Hum free pickup karwayenge — pickup ka kharcha hum dete hain.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Mann badal gaya?</h3>
              <p>Agar saman theek hai aur bas pasand nahi aaya, to sirf exchange hoga (refund nahi). Saman bina use kiye, tag ke saath, original packing mein hona chahiye.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Refund kab milega</h3>
              <p>Return saman hamare paas pahunchne aur check hone ke baad refund hota hai. Cash on Delivery orders ka refund aapke UPI ID par 5–7 din mein. Online payment ka refund usi account/card mein 5–7 din mein.</p>
              <h3 className="text-base font-black text-slate-900 pt-2">Order cancel karna</h3>
              <p>Dispatch se pehle order kabhi bhi cancel kar sakte hain — WhatsApp karein. Dispatch ke baad upar wali return policy lagu hogi.</p>
            </div>
          </div>
        );
      case 'contact':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Contact Details (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center space-x-3 border-b pb-4">
                <Mail className="w-8 h-8 text-brand-navy" />
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Contact Us</h1>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Have questions about your order, custom sizing, or shipping estimates? Order, size ya delivery ke baare mein sawal hai? WhatsApp ya call karein: +91 93068 10726.
              </p>
              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <Phone className="w-5 h-5 text-brand-navy" />
                  <a href="tel:+919306810726" className="hover:underline">+91 93068 10726</a>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <Mail className="w-5 h-5 text-brand-navy" />
                  <a href="mailto:appnabaazar@gmail.com" className="hover:underline">appnabaazar@gmail.com</a>
                </div>
                <div className="flex items-center space-x-3 text-xs sm:text-sm font-semibold text-slate-700">
                  <MapPin className="w-5 h-5 text-brand-navy" />
                  <span>Panipat, Haryana</span>
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-brand-navy"
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-brand-navy"
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
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-brand-navy"
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
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-brand-navy"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-navy hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
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
