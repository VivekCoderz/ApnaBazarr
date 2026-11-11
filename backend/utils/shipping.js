// Shipping rule shared by order processing and public product previews.
// Flat and based on the order value only, so it never reveals cost or margin.

const FREE_SHIPPING_ABOVE = 499;
const FLAT_SHIPPING_CHARGE = 49;

// Products tagged "free-delivery" (e.g. the 2-pack combo at ₹479) ship free on their own
const FREE_DELIVERY_TAG = 'free-delivery';
const hasFreeDeliveryTag = (product) =>
  Array.isArray(product?.tags) && product.tags.some(t => String(t).toLowerCase() === FREE_DELIVERY_TAG);

// Free delivery on orders of ₹499 or more (or with a free-delivery product), otherwise a flat ₹49
function orderShippingCharge(subtotal, forceFree = false) {
  if (subtotal <= 0 || forceFree || subtotal >= FREE_SHIPPING_ABOVE) return 0;
  return FLAT_SHIPPING_CHARGE;
}

// Public delivery hint for a single product
function shippingPreview(product) {
  return {
    deliveryChargeForOne: orderShippingCharge(product.price, hasFreeDeliveryTag(product)),
    itemsForFreeDelivery: hasFreeDeliveryTag(product) ? 1 : Math.max(1, Math.ceil(FREE_SHIPPING_ABOVE / product.price))
  };
}

module.exports = { FREE_SHIPPING_ABOVE, FLAT_SHIPPING_CHARGE, orderShippingCharge, shippingPreview, hasFreeDeliveryTag };
