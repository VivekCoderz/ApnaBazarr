import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MapPin, Factory, Layers, Recycle, Leaf, Droplets, ShoppingBag, Star } from 'lucide-react';
import { Section } from '../components/ui/Container';
import Button from '../components/ui/Button';
import { formatPrice, displayName, cloudinaryImage, isOrderable } from '../utils/format';
import { startBuyNow } from '../utils/buyNow';
import { EXCHANGE_CREDIT, EXCHANGE_MIN_ORDER } from '../config/store';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const DEFAULT_TITLE = 'Dhagaro — Panipat se Seedha, Aapke Ghar Tak';

// "Where this mat comes from": the page the QR code on each mat opens (/trace/:id).
// Shows only what the admin filled in for the product (nothing is made up), plus care,
// reorder and the old-clothes exchange.
function Fact({ icon: Icon, label, children }) {
  return (
    <li className="flex gap-3 py-3">
      <Icon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-[15px] text-ink">{children}</p>
      </div>
    </li>
  );
}

export default function TracePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ loading: true, product: null });

  useEffect(() => {
    let alive = true;
    fetch(`${BASE_URL}/products/${encodeURIComponent(id)}`)
      .then(r => r.json().catch(() => ({})))
      .then(d => { if (alive) setState({ loading: false, product: d && d.success ? d.data : null }); })
      .catch(() => { if (alive) setState({ loading: false, product: null }); });
    return () => { alive = false; };
  }, [id]);

  const product = state.product;
  useEffect(() => {
    document.title = product ? `Where ${displayName(product.name)} comes from — Dhagaro` : 'Made in Panipat — Dhagaro';
    return () => { document.title = DEFAULT_TITLE; };
  }, [product]);

  if (state.loading) {
    return <Section tone="cream" containerClass="max-w-xl"><p className="py-16 text-center text-slate-500">Loading…</p></Section>;
  }
  if (!product) {
    return (
      <Section tone="cream" containerClass="max-w-xl">
        <div className="space-y-4 py-10 text-center">
          <h1 className="text-xl font-semibold text-ink">We couldn't find this product</h1>
          <p className="text-slate-600">It may no longer be on sale. Every Dhagaro mat is made in Panipat, India's textile city.</p>
          <Button to="/shop">See all mats</Button>
        </div>
      </Section>
    );
  }

  const t = product.trace || {};
  const orderable = isOrderable(product);
  const reorder = () => navigate(startBuyNow(product, 1));

  return (
    <Section tone="cream" containerClass="max-w-xl">
      <div className="space-y-5">
        <div className="overflow-hidden rounded-2xl border border-line bg-white">
          <img src={cloudinaryImage(product.image, 800)} alt={displayName(product.name)} className="aspect-[4/3] w-full object-cover" />
          <div className="space-y-1 p-4">
            <p className="text-sm font-medium text-emerald-700">Thank you for choosing Dhagaro 🙏</p>
            <h1 className="text-xl font-semibold leading-snug text-ink">{displayName(product.name)}</h1>
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <span className="font-semibold text-ink">{formatPrice(product.price)}</span>
              {product.rating && (
                <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />{product.rating} ({product.reviewsCount})</span>
              )}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-white px-4">
          <h2 className="pt-4 text-base font-semibold text-ink">Where this mat comes from</h2>
          <ul className="divide-y divide-line">
            <Fact icon={MapPin} label="Made in">{t.origin || 'Panipat, Haryana'}, India's textile city</Fact>
            {t.maker && <Fact icon={Factory} label="Made by">{t.maker}</Fact>}
            {t.material && <Fact icon={Layers} label="Material">{t.material}</Fact>}
            {t.recycledPercent > 0 && <Fact icon={Recycle} label="Recycled content">{t.recycledPercent}% recycled textile</Fact>}
            {t.savedKg > 0 && <Fact icon={Leaf} label="Impact">This piece kept about {t.savedKg} kg of textile out of landfill</Fact>}
            <Fact icon={ShoppingBag} label="How it reaches you">Straight from the maker to us to you. No middlemen, so the price stays honest.</Fact>
          </ul>
        </div>

        {t.care && (
          <div className="rounded-2xl border border-line bg-white p-4">
            <h2 className="flex items-center gap-2 text-base font-semibold text-ink"><Droplets className="h-5 w-5 text-brand-navy" aria-hidden="true" /> Care guide</h2>
            <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-slate-700">{t.care}</p>
          </div>
        )}

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-900"><Recycle className="h-5 w-5" aria-hidden="true" /> Got old clothes at home?</h2>
          <p className="mt-1 text-[15px] text-emerald-900/85">
            In Panipat, hand them over when we deliver your next order. We send them for recycling and you get {formatPrice(EXCHANGE_CREDIT)} off an order of {formatPrice(EXCHANGE_MIN_ORDER)}+.
          </p>
          <Link to="/recycle" className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline">How the exchange works</Link>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {orderable
            ? <Button onClick={reorder} size="lg">Order again · {formatPrice(product.price)}</Button>
            : <Button to={`/product/${product.id}`} size="lg">See this product</Button>}
          <Button to={`/product/${product.id}`} variant="secondary" size="lg">Reviews & details</Button>
        </div>
      </div>
    </Section>
  );
}
