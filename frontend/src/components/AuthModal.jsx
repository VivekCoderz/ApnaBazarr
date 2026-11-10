import { useEffect, useRef, useState } from "react";
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Package,
  Heart,
  Zap,
  AlertCircle,
  Loader2,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PERKS = [
  { icon: Package, text: "Track every order in one place" },
  { icon: Zap, text: "Check out faster next time" },
  { icon: Heart, text: "Save your wishlist on any device" },
];

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-base text-ink placeholder:text-slate-400 " +
  "transition-colors focus:border-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-navy/15 sm:text-sm";

// Hooks live in the inner component so the early return never changes the hook order
export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;
  return <AuthModalContent onClose={onClose} onAuthSuccess={onAuthSuccess} />;
}

function Field({ id, label, icon: Icon, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        {children}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function AuthModalContent({ onClose, onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const firstFieldRef = useRef(null);

  // Escape closes, page behind does not scroll, first field gets focus
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => { firstFieldRef.current?.focus(); }, [isLogin]);

  const switchMode = (login) => {
    setIsLogin(login);
    setErrorMessage("");
    setShowPassword(false);
  };

  const set = (key) => (e) => setFormData({ ...formData, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const url = isLogin ? `${BASE_URL}/auth/login` : `${BASE_URL}/auth/signup`;
      const email = formData.email.trim();
      const body = isLogin
        ? { email, password: formData.password }
        : { name: formData.name.trim(), email, phone: formData.phone, password: formData.password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const result = await res.json().catch(() => {
        throw new Error("Our server is starting up. Please try again in 10-15 seconds.");
      });
      if (!res.ok || !result.success) throw new Error(result.message || `Request failed: ${res.status}`);

      onAuthSuccess(result.user);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-950/60 transition-opacity" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 flex max-h-[94dvh] w-full max-w-3xl animate-fade-in overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl">
        {/* Brand panel (tablet/desktop) */}
        <aside className="relative hidden w-[42%] shrink-0 flex-col justify-between overflow-hidden bg-brand-navy p-8 text-white md:flex">
          <div aria-hidden="true" className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/5" />
          <div aria-hidden="true" className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full bg-brand-orange/10" />
          <div className="relative">
            <img src="/dhagaro-logo-white.svg" alt="Dhagaro" className="h-8 w-auto" />
            <p className="mt-6 text-2xl font-semibold leading-snug">
              {isLogin ? "Welcome back" : "Join Dhagaro"}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/70">
              Bath mats straight from Panipat, at factory prices. Bedsheets and towels coming soon.
            </p>
            <ul className="mt-8 space-y-4">
              {PERKS.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/90">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <Icon className="h-4 w-4 text-brand-orange" aria-hidden="true" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>
          <p className="relative mt-8 text-xs text-white/60">
            No account needed to order. Guest checkout and Cash on Delivery are always available.
          </p>
        </aside>

        {/* Form */}
        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="flex items-center justify-between px-5 pt-5 sm:px-8 sm:pt-7">
            <img src="/dhagaro-logo.svg" alt="Dhagaro" className="h-7 w-auto md:invisible" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 pb-6 pt-2 sm:px-8 sm:pb-8">
            <h2 id="auth-title" className="text-2xl font-semibold tracking-tight text-ink">
              {isLogin ? "Log in to your account" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isLogin ? "Good to see you again." : "It takes less than a minute."}
            </p>

            {/* Login / Sign up switch */}
            <div className="mt-5 grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm font-semibold" role="tablist">
              {[["Log in", true], ["Sign up", false]].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={isLogin === value}
                  onClick={() => switchMode(value)}
                  className={`rounded-md py-2 transition-all ${
                    isLogin === value ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-ink"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {!isLogin && (
                <Field id="auth-name" label="Full name" icon={User}>
                  <input
                    ref={firstFieldRef}
                    id="auth-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={formData.name}
                    onChange={set("name")}
                    placeholder="Your name"
                    className={inputCls}
                  />
                </Field>
              )}

              <Field id="auth-email" label="Email address" icon={Mail}>
                <input
                  ref={isLogin ? firstFieldRef : undefined}
                  id="auth-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={formData.email}
                  onChange={set("email")}
                  placeholder="name@example.com"
                  className={inputCls}
                />
              </Field>

              {!isLogin && (
                <Field id="auth-phone" label="Mobile number" icon={Phone} hint="We send order updates on WhatsApp.">
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    required
                    pattern="[6-9][0-9]{9}"
                    title="10-digit mobile number"
                    autoComplete="tel-national"
                    maxLength={10}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '') })}
                    placeholder="10-digit number"
                    className={inputCls}
                  />
                </Field>
              )}

              <Field id="auth-password" label="Password" icon={Lock} hint={isLogin ? null : "At least 6 characters."}>
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={isLogin ? undefined : 6}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={set("password")}
                  placeholder={isLogin ? "Your password" : "Create a password"}
                  className={`${inputCls} pr-11`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-ink"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </Field>

              {errorMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cta py-3.5 text-base font-semibold text-white shadow-sm transition-[background-color,transform] hover:brightness-110 active:scale-[0.99] disabled:cursor-wait disabled:opacity-80"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Please wait…</>
                ) : (
                  <>{isLogin ? "Log in" : "Create account"} <ArrowRight className="h-4 w-4" aria-hidden="true" /></>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-slate-500">
              {isLogin ? "New to Dhagaro? " : "Already have an account? "}
              <button type="button" onClick={() => switchMode(!isLogin)} className="font-semibold text-brand-navy hover:underline">
                {isLogin ? "Create an account" : "Log in"}
              </button>
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 block w-full text-center text-sm text-slate-500 hover:text-ink md:hidden"
            >
              Continue as guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
