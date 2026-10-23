// Indian rupee price without paise: 1449 -> "₹1,449"
export function formatPrice(amount) {
  const value = Math.round(Number(amount) || 0);
  return `₹${value.toLocaleString('en-IN')}`;
}
