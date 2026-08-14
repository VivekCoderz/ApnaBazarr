import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import ProductCard from '../components/ProductCard';

export default function WishlistPage({ wishlistItems, onAddToCart, onToggleWishlist, cartItems }) {
  const navigate = useNavigate();

  return (
    <div className="py-12 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Wishlist</h1>
            <span className="bg-red-100 text-red-600 font-extrabold text-xs px-2.5 py-0.5 rounded-full">
              {wishlistItems.length} Items
            </span>
          </div>
          
          <button
            onClick={() => navigate('/shop')}
            className="text-xs font-bold text-[#0066cc] hover:underline flex items-center space-x-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </button>
        </div>

        {wishlistItems.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-12 text-center max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Your Wishlist is Empty</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Explore our luxury collections, traditional designer outfits, and premium footwear. Add items you love to save them for later!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="px-6 py-3 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <span>Explore Collections</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {wishlistItems.map((product) => (
              <div key={product.id} className="relative group">
                <ProductCard
                  product={product}
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={true}
                  isCartAdded={cartItems.some(item => item.id === product.id)}
                />
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
