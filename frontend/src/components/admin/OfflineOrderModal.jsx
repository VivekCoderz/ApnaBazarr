import { useState } from 'react';
import { ChevronDown, Loader2, Plus, Trash2 } from 'lucide-react';
import { Sheet } from './AdminUi';
import { btn, input, label } from './adminStyles';
import { BASE_URL, adminHeaders } from './adminApi';

const emptyItem = () => ({ productId: '', price: '', quantity: 1 });

// Record an order that came in by phone / in person (POST /orders/offline)
export default function OfflineOrderModal({ products, onClose, onSaved }) {
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Offline Cash');
  const [flat, setFlat] = useState('');
  const [area, setArea] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [packagingCost, setPackagingCost] = useState('0');
  const [shippingCost, setShippingCost] = useState('0');
  const [packagingCharge, setPackagingCharge] = useState('0');
  const [shippingCharge, setShippingCharge] = useState('0');
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});

  const filteredProducts = (index) => {
    const query = (searchQueries[index] || '').toLowerCase();
    if (!query) return products;
    return products.filter(p => p.name.toLowerCase().includes(query));
  };

  const updateItem = (index, field, value) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it;
      const next = { ...it, [field]: value };
      if (field === 'productId') {
        const prod = products.find(p => String(p.id) === String(value));
        if (prod) next.price = prod.price;
      }
      return next;
    }));
  };

  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  const grandTotal = subtotal + (Number(packagingCharge) || 0) + (Number(shippingCharge) || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.some(it => !it.productId)) {
      alert('Please select a product for all item rows.');
      return;
    }
    setLoading(true);
    try {
      const orderPayload = {
        userEmail: custEmail || 'offline@apnabazarr.com',
        paymentMethod,
        packagingCost: Number(packagingCost) || 0,
        shippingCost: Number(shippingCost) || 0,
        packagingCharge: Number(packagingCharge) || 0,
        shippingCharge: Number(shippingCharge) || 0,
        shippingAddress: {
          fullName: custName,
          phone: custPhone,
          flatNo: flat,
          area,
          city,
          state: stateName,
          pincode,
          addressType: 'Home'
        },
        items: items.map(it => ({
          productId: it.productId,
          price: Number(it.price) || 0,
          quantity: Number(it.quantity) || 1
        }))
      };
      const res = await fetch(`${BASE_URL}/orders/offline`, {
        method: 'POST',
        headers: adminHeaders(true),
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });
      const result = await res.json();
      if (result.success) {
        alert('Offline order recorded successfully!');
        onClose();
        if (onSaved) onSaved();
      } else {
        alert(result.message || 'Failed to create offline order.');
      }
    } catch (error) {
      console.error(error);
      alert('Error submitting offline order.');
    } finally {
      setLoading(false);
    }
  };

  const field = (id, text, value, setter, props = {}) => (
    <div>
      <label className={label} htmlFor={id}>{text}</label>
      <input id={id} value={value} onChange={(e) => setter(e.target.value)} className={input} {...props} />
    </div>
  );

  return (
    <Sheet title="Add offline order" onClose={onClose} wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <fieldset className="space-y-3">
          <p className="mb-2 text-sm font-semibold text-ink">Customer</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('oo-name', 'Name *', custName, setCustName, { type: 'text', required: true, placeholder: 'e.g. Ramesh Kumar' })}
            {field('oo-phone', 'Phone *', custPhone, setCustPhone, { type: 'tel', required: true, inputMode: 'tel', placeholder: 'e.g. 9876543210' })}
            {field('oo-email', 'Email', custEmail, setCustEmail, { type: 'email', placeholder: 'optional' })}
            <div>
              <label className={label} htmlFor="oo-pay">Payment</label>
              <select id="oo-pay" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={input}>
                <option value="Offline Cash">Offline Cash</option>
                <option value="UPI / QR Code">UPI / QR Code</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card Payment">Card Payment</option>
              </select>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <p className="mb-2 text-sm font-semibold text-ink">Address</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('oo-flat', 'House / flat no. *', flat, setFlat, { type: 'text', required: true, placeholder: 'e.g. House No. 12' })}
            {field('oo-area', 'Area / street *', area, setArea, { type: 'text', required: true, placeholder: 'e.g. Sector 14' })}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {field('oo-city', 'City *', city, setCity, { type: 'text', required: true, placeholder: 'e.g. Panipat' })}
            {field('oo-state', 'State *', stateName, setStateName, { type: 'text', required: true, placeholder: 'e.g. Haryana' })}
            {field('oo-pin', 'Pincode *', pincode, setPincode, { type: 'text', required: true, inputMode: 'numeric', placeholder: 'e.g. 132103' })}
          </div>
        </fieldset>

        <fieldset className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Items</p>
            <button type="button" onClick={() => setItems(prev => [...prev, emptyItem()])} className={btn.outline}>
              <Plus className="h-4 w-4" /> Add item
            </button>
          </div>
          {items.map((item, idx) => {
            const selectedProd = products.find(p => String(p._id) === String(item.productId) || String(p.id) === String(item.productId));
            return (
              <div key={idx} className="space-y-2 rounded-lg border border-line p-3">
                <div className="relative">
                  <span className={label}>Product *</span>
                  <button
                    type="button"
                    onClick={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                    className={`${input} flex items-center justify-between gap-2 text-left cursor-pointer`}
                  >
                    {selectedProd ? (
                      <span className="flex min-w-0 items-center gap-2">
                        <img src={selectedProd.image} alt="" className="h-6 w-6 shrink-0 rounded border object-cover" />
                        <span className="truncate">{selectedProd.name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400">Select a product</span>
                    )}
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
                  </button>
                  {openDropdownIdx === idx && (
                    <div className="absolute left-0 right-0 z-30 mt-1 space-y-2 rounded-lg border border-line bg-white p-2 shadow-lift">
                      <input
                        type="text"
                        placeholder="Search product"
                        value={searchQueries[idx] || ''}
                        onChange={(e) => setSearchQueries(prev => ({ ...prev, [idx]: e.target.value }))}
                        className={input}
                        autoFocus
                      />
                      <div className="max-h-56 divide-y divide-line overflow-y-auto">
                        {filteredProducts(idx).map(p => (
                          <button
                            key={p._id || p.id}
                            type="button"
                            onClick={() => {
                              updateItem(idx, 'productId', p._id || p.id);
                              setOpenDropdownIdx(null);
                              setSearchQueries(prev => ({ ...prev, [idx]: '' }));
                            }}
                            className="flex min-h-11 w-full items-center gap-2.5 p-2 text-left text-sm hover:bg-slate-50 cursor-pointer"
                          >
                            <img src={p.image} alt="" className="h-8 w-8 shrink-0 rounded border bg-slate-50 object-cover" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-ink">{p.name}</span>
                              <span className="text-xs text-slate-500">₹{p.price}</span>
                            </span>
                          </button>
                        ))}
                        {filteredProducts(idx).length === 0 && <p className="py-3 text-center text-xs text-slate-500">No products found</p>}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className={label} htmlFor={`oo-price-${idx}`}>Price (₹)</label>
                    <input id={`oo-price-${idx}`} type="number" required min="1" inputMode="decimal" value={item.price} onChange={(e) => updateItem(idx, 'price', e.target.value)} className={input} placeholder={selectedProd ? String(selectedProd.price) : ''} />
                  </div>
                  <div className="w-24">
                    <label className={label} htmlFor={`oo-qty-${idx}`}>Qty *</label>
                    <input id={`oo-qty-${idx}`} type="number" required min="1" inputMode="numeric" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className={input} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setItems(prev => prev.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                    aria-label="Remove item"
                    className={`${btn.danger} !px-3`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </fieldset>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Charged to customer</p>
            <div className="grid grid-cols-2 gap-2">
              {field('oo-pack-charge', 'Packaging (₹)', packagingCharge, setPackagingCharge, { type: 'number', min: '0', inputMode: 'decimal', placeholder: '0' })}
              {field('oo-ship-charge', 'Shipping (₹)', shippingCharge, setShippingCharge, { type: 'number', min: '0', inputMode: 'decimal', placeholder: '0' })}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-ink">Your cost</p>
            <div className="grid grid-cols-2 gap-2">
              {field('oo-pack-cost', 'Packaging (₹)', packagingCost, setPackagingCost, { type: 'number', min: '0', inputMode: 'decimal', placeholder: '0' })}
              {field('oo-ship-cost', 'Shipping (₹)', shippingCost, setShippingCost, { type: 'number', min: '0', inputMode: 'decimal', placeholder: '0' })}
            </div>
          </div>
        </fieldset>

        <div className="space-y-1 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600"><span>Items</span><span className="tabular-nums">₹{subtotal}</span></div>
          <div className="flex justify-between text-slate-600"><span>Packaging</span><span className="tabular-nums">+₹{Number(packagingCharge) || 0}</span></div>
          <div className="flex justify-between text-slate-600"><span>Shipping</span><span className="tabular-nums">+₹{Number(shippingCharge) || 0}</span></div>
          <div className="flex justify-between border-t border-line pt-1 font-semibold text-ink"><span>Customer pays</span><span className="tabular-nums">₹{grandTotal}</span></div>
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={`${btn.outline} flex-1 sm:flex-none`}>Cancel</button>
          <button type="submit" disabled={loading} className={`${btn.primary} flex-1`}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save offline order
          </button>
        </div>
      </form>
    </Sheet>
  );
}
