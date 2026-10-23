// Shipping rules shared by order processing and public product previews.
// Margin is derived from costPrice here so it never has to leave the server.

const FREE_SHIPPING_MARGIN = 120;

// Per-piece margin (price - costPrice), falls back to 30% when costPrice is missing
function productMargin(product) {
  const cost = product.costPrice || (product.price * 0.7);
  return Math.max(product.price - cost, 1);
}

// Free if total margin >= 120, else Math.min(80, Math.max(80 + 15 * totalQuantity - totalMargin, 0))
function orderShippingCharge(totalMargin, totalQuantity) {
  if (totalMargin >= FREE_SHIPPING_MARGIN) return 0;
  return Math.round(Math.min(80, Math.max(80 + (15 * totalQuantity) - totalMargin, 0)));
}

// Public delivery hint for a single product (no cost/margin values exposed)
function shippingPreview(product) {
  const margin = productMargin(product);
  return {
    deliveryChargeForOne: orderShippingCharge(margin, 1),
    itemsForFreeDelivery: Math.ceil(FREE_SHIPPING_MARGIN / margin)
  };
}

module.exports = { productMargin, orderShippingCharge, shippingPreview };
