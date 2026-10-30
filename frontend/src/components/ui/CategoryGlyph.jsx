import { Layers, BedDouble, Sofa, RectangleHorizontal, Shirt, ShoppingBag } from 'lucide-react';

// Simple monochrome line icon per category (used where there is no product photo yet)
const ICONS = {
  'Kambal & Dohar': Layers,
  Bedsheet: BedDouble,
  'Cushion & Sofa Cover': Sofa,
  'Mats & Table Runner': RectangleHorizontal,
  'Suit Sets': Shirt,
  'Co-ord Sets': Shirt,
  "Women's Wear": Shirt
};

export default function CategoryGlyph({ name, className = 'h-7 w-7' }) {
  const Icon = ICONS[name] || ShoppingBag;
  return <Icon className={className} strokeWidth={1.5} aria-hidden="true" />;
}
