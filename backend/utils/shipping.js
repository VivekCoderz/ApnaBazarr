// Shipping rule shared by order processing and public product previews.
// Flat and based on the order value only, so it never reveals cost or margin.

const FREE_SHIPPING_ABOVE = 499;
const FLAT_SHIPPING_CHARGE = 49;

// Free delivery on orders of ₹499 or more, otherwise a flat ₹49
function orderShippingCharge(subtotal) {
  if (subtotal <= 0 || subtotal >= FREE_SHIPPING_ABOVE) return 0;
  return FLAT_SHIPPING_CHARGE;
}

// Public delivery hint for a single product
function shippingPreview(product) {
  return {
    deliveryChargeForOne: orderShippingCharge(product.price),
    itemsForFreeDelivery: Math.max(1, Math.ceil(FREE_SHIPPING_ABOVE / product.price))
  };
}

module.exports = { FREE_SHIPPING_ABOVE, FLAT_SHIPPING_CHARGE, orderShippingCharge, shippingPreview };
