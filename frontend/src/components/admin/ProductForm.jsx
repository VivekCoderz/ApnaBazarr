import { useState } from 'react';
import { ArrowLeft, CheckCircle, Loader2, Upload, X } from 'lucide-react';
import { Card, PanelHeader } from './AdminUi';
import { btn, input, label, hint } from './adminStyles';
import { uploadToCloudinary } from './adminApi';
import { CATEGORIES } from '../../config/store';

const SIZE_PRESETS = [
  { group: 'Clothing', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] },
  { group: 'Kurti / suits', sizes: ['36', '38', '40', '42', '44', '46'] },
  { group: 'Pants', sizes: ['28', '30', '32', '34', '36', '38', '40'] },
  { group: 'Shoes', sizes: ['6', '7', '8', '9', '10', '11', '12'] },
  { group: 'Bangles', sizes: ['2.2', '2.4', '2.6', '2.8'] }
];

const COLOR_PRESETS = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#ffffff' },
  { name: 'Red', code: '#ff0000' },
  { name: 'Blue', code: '#0000ff' },
  { name: 'Green', code: '#008000' },
  { name: 'Yellow', code: '#ffff00' },
  { name: 'Pink', code: '#ffc0cb' },
  { name: 'Orange', code: '#ffa500' },
  { name: 'Grey', code: '#808080' },
  { name: 'Purple', code: '#800080' },
  { name: 'Gold', code: '#ffd700' }
];

const BADGES = [
  { value: '', label: 'No badge' },
  { value: 'NEW ARRIVAL', label: 'New arrival' },
  { value: 'Coming soon', label: 'Coming soon (shown, cannot be ordered)' },
  { value: 'BESTSELLER', label: 'Bestseller' }
];

const GENDERS = ['Men', 'Women', 'Kids', 'Unisex', 'Home'];

const splitList = (s) => (s ? s.split(',').map(x => x.trim()).filter(Boolean) : []);
const toNumberOrNull = (v) => (v === '' || v === null || v === undefined ? null : parseFloat(v));

function emptyForm() {
  return {
    name: '',
    category: 'Mats & Table Runner',
    gender: 'Unisex',
    costPrice: '',
    price: '',
    originalPrice: '',
    stock: 50,
    badge: 'NEW ARRIVAL',
    image: '',
    images: [],
    colorImages: [],
    description: '',
    sizes: '',
    colors: '',
    isCustomizable: false,
    customizationType: 'text',
    customizationPrompt: ''
  };
}

function formFromProduct(p) {
  const images = (p.images || []).filter(img => img && img !== p.image);
  return {
    name: p.name || '',
    category: p.category || '',
    gender: p.gender || 'Unisex',
    costPrice: p.costPrice ?? '',
    price: p.price ?? '',
    originalPrice: p.originalPrice ?? '',
    stock: p.stock ?? 0,
    badge: p.badge || '',
    image: p.image || '',
    images,
    colorImages: (p.colorImages || []).map(v => ({ color: v.color, images: [...(v.images || [])] })),
    description: p.description || '',
    sizes: (p.sizes || []).join(', '),
    colors: (p.colors || []).join(', '),
    isCustomizable: Boolean(p.isCustomizable),
    customizationType: p.customizationType && p.customizationType !== 'none' ? p.customizationType : 'text',
    customizationPrompt: p.customizationPrompt || ''
  };
}

function Section({ title, children }) {
  return (
    <Card className="space-y-4 p-4">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {children}
    </Card>
  );
}

function Thumb({ src, onRemove }) {
  return (
    <div className="relative h-16 w-16 overflow-hidden rounded border border-line bg-slate-50">
      <img src={src} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove photo"
        className="absolute right-0 top-0 inline-flex h-7 w-7 items-center justify-center rounded-bl bg-black/60 text-white cursor-pointer"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function UploadButton({ id, multiple = false, busy, text, onFiles }) {
  return (
    <>
      <input
        type="file"
        accept="image/*"
        multiple={multiple}
        id={id}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          e.target.value = '';
          if (files.length) onFiles(files);
        }}
      />
      <label htmlFor={id} className={`${btn.outline} shrink-0 ${busy ? 'pointer-events-none opacity-60' : ''}`}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {busy ? 'Uploading...' : text}
      </label>
    </>
  );
}

// Add or edit a product. `product` = the product being edited, or null to add a new one.
export default function ProductForm({ product, onSubmit, onCancel }) {
  const isEdit = Boolean(product);
  const [form, setForm] = useState(() => (product ? formFromProduct(product) : emptyForm()));
  const [isCustomCategory, setIsCustomCategory] = useState(() => Boolean(product && product.category && !CATEGORIES.some(c => c.name === product.category)));
  const [uploading, setUploading] = useState('');
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  const set = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const cost = parseFloat(form.costPrice) || 0;
  const sell = parseFloat(form.price) || 0;
  const mrp = parseFloat(form.originalPrice) || 0;
  const profitPerItem = sell - cost;
  const itemMarginPercent = sell > 0 ? ((profitPerItem / sell) * 100).toFixed(1) : 0;
  const discountPercent = mrp > sell && sell > 0 ? Math.round(((mrp - sell) / mrp) * 100) : 0;

  const sizeList = splitList(form.sizes);
  const colorList = splitList(form.colors);

  const toggleIn = (field, value) => {
    const list = splitList(form[field]);
    const has = list.some(x => x.toLowerCase() === value.toLowerCase());
    set({ [field]: (has ? list.filter(x => x.toLowerCase() !== value.toLowerCase()) : [...list, value]).join(', ') });
  };

  const upload = async (key, files, apply) => {
    setUploading(key);
    try {
      const urls = [];
      for (const file of files) urls.push(await uploadToCloudinary(file, 'product-image'));
      apply(urls);
    } catch (err) {
      alert('Image upload failed: ' + err.message);
    } finally {
      setUploading('');
    }
  };

  const colorPhotos = (color) => form.colorImages.find(v => v.color.toLowerCase() === color.toLowerCase())?.images || [];
  const setColorPhotos = (color, updater) => {
    setForm(prev => {
      const others = prev.colorImages.filter(v => v.color.toLowerCase() !== color.toLowerCase());
      const current = prev.colorImages.find(v => v.color.toLowerCase() === color.toLowerCase())?.images || [];
      const next = updater(current);
      return { ...prev, colorImages: next.length ? [...others, { color, images: next }] : others };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.image || (!isEdit && !form.costPrice)) {
      alert(isEdit
        ? 'Please fill in Name, Selling price and Main photo.'
        : 'Please fill in Name, Cost price, Selling price and Main photo.');
      return;
    }

    const sizes = splitList(form.sizes);
    const colors = splitList(form.colors);
    const colorImages = form.colorImages
      .filter(v => v.images.length && colors.some(c => c.toLowerCase() === v.color.toLowerCase()));
    const images = [form.image, ...form.images.filter(img => img !== form.image)].filter(Boolean);
    const customization = {
      isCustomizable: form.isCustomizable,
      customizationType: form.isCustomizable ? form.customizationType : 'none',
      customizationPrompt: form.isCustomizable ? form.customizationPrompt : ''
    };

    if (isEdit) {
      const fields = {
        name: form.name,
        category: form.category,
        gender: form.gender,
        price: parseFloat(form.price),
        originalPrice: toNumberOrNull(form.originalPrice),
        discount: discountPercent > 0 ? `${discountPercent}% OFF` : null,
        badge: form.badge,
        stock: parseInt(form.stock, 10) || 0,
        image: form.image,
        images,
        description: form.description,
        sizes,
        colors,
        colorImages,
        ...customization
      };
      if (form.costPrice !== '') fields.costPrice = parseFloat(form.costPrice);
      setSaving(true);
      const ok = await onSubmit(fields);
      setSaving(false);
      if (ok !== false) onCancel();
      return;
    }

    // Same shape as before the redesign (POST /products)
    const createdItem = {
      id: Date.now(),
      name: form.name,
      category: form.category,
      gender: form.gender,
      costPrice: parseFloat(form.costPrice),
      price: parseFloat(form.price),
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null,
      discount: discountPercent > 0 ? `${discountPercent}% OFF` : null,
      badge: form.badge,
      rating: 5,
      reviewsCount: 1,
      image: form.image,
      description: form.description || 'High quality product from Dhagaro.',
      tags: ['New Arrival', 'Best Selling'],
      sizes,
      colors,
      colorImages,
      images,
      inStock: true,
      stock: parseInt(form.stock, 10) || 50,
      ...customization
    };
    onSubmit(createdItem);
    setSuccessToast(`"${createdItem.name}" added.`);
    setForm(emptyForm());
    setTimeout(() => {
      setSuccessToast('');
      onCancel();
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-4 pb-4">
      <button type="button" onClick={onCancel} className={`${btn.ghost} -ml-2`}>
        <ArrowLeft className="h-4 w-4" /> Products
      </button>
      <PanelHeader title={isEdit ? 'Edit product' : 'Add product'} note={isEdit ? product.name : 'Fill the details and publish to the store.'} />

      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">
          <CheckCircle className="h-4 w-4" /> {successToast}
        </div>
      )}

      <Section title="Basics">
        <div>
          <label className={label} htmlFor="pf-name">Product name *</label>
          <input id="pf-name" type="text" required value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Pebble bath mat, 40 x 60 cm" className={input} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className={`${label} !mb-0`} htmlFor="pf-category">Category *</label>
              <button type="button" onClick={() => setIsCustomCategory(v => !v)} className="text-xs font-medium text-brand-navy hover:underline cursor-pointer">
                {isCustomCategory ? 'Pick from list' : 'Type custom'}
              </button>
            </div>
            {isCustomCategory ? (
              <input id="pf-category" type="text" required value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="Category name" className={input} />
            ) : (
              <select id="pf-category" value={form.category} onChange={(e) => set({ category: e.target.value })} className={input}>
                {!CATEGORIES.some(c => c.name === form.category) && form.category && <option value={form.category}>{form.category}</option>}
                {CATEGORIES.map(c => <option key={c.name} value={c.name}>{c.label}</option>)}
              </select>
            )}
          </div>
          <div>
            <label className={label} htmlFor="pf-gender">For</label>
            <select id="pf-gender" value={form.gender} onChange={(e) => set({ gender: e.target.value })} className={input}>
              {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pf-badge">Badge</label>
            <select id="pf-badge" value={form.badge} onChange={(e) => set({ badge: e.target.value })} className={input}>
              {!BADGES.some(b => b.value === form.badge) && <option value={form.badge}>{form.badge}</option>}
              {BADGES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label} htmlFor="pf-stock">Stock quantity</label>
            <input id="pf-stock" type="number" min={0} inputMode="numeric" value={form.stock} onChange={(e) => set({ stock: e.target.value })} className={input} />
          </div>
        </div>
      </Section>

      <Section title="Price">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={label} htmlFor="pf-cost">Cost price (₹){isEdit ? '' : ' *'}</label>
            <input id="pf-cost" type="number" required={!isEdit} min={0} step="any" inputMode="decimal" value={form.costPrice} onChange={(e) => set({ costPrice: e.target.value })} placeholder="e.g. 180" className={input} />
            <p className={hint}>Private, only you see this</p>
          </div>
          <div>
            <label className={label} htmlFor="pf-price">Selling price (₹) *</label>
            <input id="pf-price" type="number" required min={0} step="any" inputMode="decimal" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="e.g. 399" className={input} />
            <p className={hint}>What the customer pays</p>
          </div>
          <div>
            <label className={label} htmlFor="pf-mrp">MRP (₹)</label>
            <input id="pf-mrp" type="number" min={0} step="any" inputMode="decimal" value={form.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} placeholder="e.g. 799" className={input} />
            <p className={hint}>Shown crossed out</p>
          </div>
        </div>
        {sell > 0 && cost > 0 && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-sm">
            <span className="text-slate-600">Profit per item <strong className="font-semibold text-ink">₹{profitPerItem.toFixed(2)}</strong></span>
            <span className="text-slate-600">Margin <strong className="font-semibold text-ink">{itemMarginPercent}%</strong></span>
            {discountPercent > 0 && <span className="text-slate-600">Tag <strong className="font-semibold text-ink">{discountPercent}% OFF</strong></span>}
          </div>
        )}
      </Section>

      <Section title="Photos">
        <div>
          <span className={label}>Main photo *</span>
          <div className="flex flex-col gap-2 sm:flex-row">
            <UploadButton id="pf-main-upload" busy={uploading === 'main'} text="Upload photo" onFiles={(files) => upload('main', files.slice(0, 1), ([url]) => set({ image: url }))} />
            <input type="url" value={form.image} onChange={(e) => set({ image: e.target.value })} placeholder="or paste an image URL" className={input} />
          </div>
          {form.image && <img src={form.image} alt="Main" className="mt-2 h-20 w-20 rounded border border-line object-cover" />}
        </div>
        <div>
          <span className={label}>More photos (gallery)</span>
          <UploadButton id="pf-gallery-upload" multiple busy={uploading === 'gallery'} text="Add photos" onFiles={(files) => upload('gallery', files, (urls) => setForm(prev => ({ ...prev, images: [...prev.images, ...urls] })))} />
          {form.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.images.map((img, i) => (
                <Thumb key={`${img}-${i}`} src={img} onRemove={() => setForm(prev => ({ ...prev, images: prev.images.filter((_, j) => j !== i) }))} />
              ))}
            </div>
          )}
        </div>
      </Section>

      <Section title="Colours and sizes">
        <div>
          <span className={label}>Colours (tap to add, or type below)</span>
          <div className="mb-2 flex flex-wrap gap-2">
            {COLOR_PRESETS.map(col => {
              const active = colorList.some(c => c.toLowerCase() === col.name.toLowerCase());
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => toggleIn('colors', col.name)}
                  title={col.name}
                  aria-label={col.name}
                  aria-pressed={active}
                  className={`h-8 w-8 rounded-full border border-slate-300 cursor-pointer ${active ? 'ring-2 ring-brand-navy ring-offset-2' : ''}`}
                  style={{ backgroundColor: col.code }}
                />
              );
            })}
          </div>
          <input type="text" value={form.colors} onChange={(e) => set({ colors: e.target.value })} placeholder="e.g. Brown, Grey, Navy" className={input} />
        </div>

        {colorList.length > 0 && (
          <div className="space-y-2">
            <span className={label}>Photos per colour (optional: the product page switches photos when a colour is picked)</span>
            <ul className="divide-y divide-line rounded-lg border border-line">
              {colorList.map((color, idx) => {
                const photos = colorPhotos(color);
                return (
                  <li key={color} className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-ink">{color}</span>
                      <UploadButton
                        id={`pf-color-upload-${idx}`}
                        multiple
                        busy={uploading === `color-${color}`}
                        text="Add"
                        onFiles={(files) => upload(`color-${color}`, files, (urls) => setColorPhotos(color, cur => [...cur, ...urls]))}
                      />
                    </div>
                    {photos.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {photos.map((img, i) => (
                          <Thumb key={`${img}-${i}`} src={img} onRemove={() => setColorPhotos(color, cur => cur.filter((_, j) => j !== i))} />
                        ))}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div>
          <span className={label}>Sizes (tap to add, or type below)</span>
          <div className="mb-2 space-y-2">
            {SIZE_PRESETS.map(g => (
              <div key={g.group} className="flex flex-wrap items-center gap-1.5">
                <span className="w-full shrink-0 text-xs text-slate-500 sm:w-24">{g.group}</span>
                {g.sizes.map(sz => {
                  const active = sizeList.some(s => s.toLowerCase() === sz.toLowerCase());
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => toggleIn('sizes', sz)}
                      aria-pressed={active}
                      className={`min-h-8 min-w-9 rounded border px-2 text-xs font-medium cursor-pointer ${active ? 'border-brand-navy bg-brand-navy text-white' : 'border-line bg-white text-slate-700 hover:border-slate-400'}`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <input type="text" value={form.sizes} onChange={(e) => set({ sizes: e.target.value })} placeholder="e.g. 40 x 60 cm, 50 x 80 cm" className={input} />
        </div>
      </Section>

      <Section title="Description">
        <textarea rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Material, size, care, what is in the box" className={`${input} py-2`} />
        <label className="flex min-h-10 items-center gap-2.5 text-sm text-ink cursor-pointer">
          <input type="checkbox" checked={form.isCustomizable} onChange={(e) => set({ isCustomizable: e.target.checked })} className="h-4 w-4 rounded border-slate-300 accent-brand-navy" />
          Customer adds text or a photo (custom product)
        </label>
        {form.isCustomizable && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={label} htmlFor="pf-ctype">Customer gives</label>
              <select id="pf-ctype" value={form.customizationType} onChange={(e) => set({ customizationType: e.target.value })} className={input}>
                <option value="text">Text only</option>
                <option value="image">Photo only</option>
                <option value="both">Text and photo</option>
              </select>
            </div>
            <div>
              <label className={label} htmlFor="pf-cprompt">Instruction for the customer</label>
              <input id="pf-cprompt" type="text" required={form.isCustomizable} value={form.customizationPrompt} onChange={(e) => set({ customizationPrompt: e.target.value })} placeholder="e.g. Name to print" className={input} />
            </div>
          </div>
        )}
      </Section>

      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 flex gap-2 rounded-lg border border-line bg-white/95 p-2 shadow-lift md:bottom-2">
        <button type="button" onClick={onCancel} className={`${btn.outline} flex-1 sm:flex-none`}>Cancel</button>
        <button type="submit" disabled={saving || Boolean(uploading)} className={`${btn.cta} flex-1`}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Publish product'}
        </button>
      </div>
    </form>
  );
}
