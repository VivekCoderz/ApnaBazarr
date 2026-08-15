import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, ShieldCheck, Truck, RotateCcw, Upload, CheckCircle, Sparkles, ArrowLeft, Video, Loader2, ThumbsUp, ThumbsDown, CornerDownRight, MessageSquare } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function uploadToCloudinary(file, endpoint) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload/${endpoint}`, { method: 'POST', body: formData });
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
    return data.url;
  } else {
    const text = await res.text();
    throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 150)}`);
  }
}

export default function ProductDetailPage({
  products = [],
  onAddToCart,
  onToggleWishlist,
  wishlistItems = [],
  cartItems = [],
  onQuickView,
  onProductViewed,
  currentUser
}) {
  const { id } = useParams();
  const navigate = useNavigate();

  const product = products.find(p => p.id === parseInt(id) || p.id === id) || products[0];
  const isOutOfStock = product?.inStock === false || product?.stock <= 0;

  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Default');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reviews State — load from DB
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Expanded replies list and input text states
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  // New Review Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhotoUrl, setReviewPhotoUrl] = useState('');
  const [reviewVideoUrl, setReviewVideoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Product Customization States
  const [customTextVal, setCustomTextVal] = useState('');
  const [customImageVal, setCustomImageVal] = useState('');
  const [uploadingCustomImage, setUploadingCustomImage] = useState(false);
  const [customizationError, setCustomizationError] = useState('');

  const handleAddToCartWithCustomization = () => {
    if (product.isCustomizable) {
      if ((product.customizationType === 'text' || product.customizationType === 'both') && !customTextVal.trim()) {
        alert(product.customizationPrompt || "Please enter the required customization text.");
        return;
      }
      if ((product.customizationType === 'image' || product.customizationType === 'both') && !customImageVal) {
        alert(product.customizationPrompt || "Please upload the required customization photo.");
        return;
      }
    }
    onAddToCart(product, quantity, {
      customText: customTextVal,
      customImage: customImageVal
    });
  };

  const handleLikeReview = async (reviewId) => {
    if (!currentUser) {
      alert("🔒 Please log in to like this review!");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/like`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r._id === reviewId ? data.review : r));
      }
    } catch (err) {
      console.error("Like review error:", err);
    }
  };

  const handleDislikeReview = async (reviewId) => {
    if (!currentUser) {
      alert("🔒 Please log in to dislike this review!");
      return;
    }
    try {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/dislike`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: currentUser.email })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r._id === reviewId ? data.review : r));
      }
    } catch (err) {
      console.error("Dislike review error:", err);
    }
  };

  const handleCommentReview = async (reviewId) => {
    if (!currentUser) {
      alert("🔒 Please log in to comment on this review!");
      return;
    }
    const text = replyTexts[reviewId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`${BASE_URL}/reviews/${reviewId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser.name,
          userEmail: currentUser.email,
          text: text.trim()
        })
      });
      const data = await res.json();
      if (data.success) {
        setReviews(prev => prev.map(r => r._id === reviewId ? data.review : r));
        setReplyTexts(prev => ({ ...prev, [reviewId]: '' }));
      }
    } catch (err) {
      console.error("Comment review error:", err);
    }
  };

  if (!product) {
    return (
      <div className="py-20 text-center text-slate-500">
        <p className="text-sm font-bold">Product not found.</p>
        <button onClick={() => navigate('/shop')} className="mt-4 px-4 py-2 bg-[#0066cc] text-white text-xs font-bold rounded-xl">
          Back to Shop
        </button>
      </div>
    );
  }

  const isWishlisted = wishlistItems.some(i => i.id === product.id);

  // Related products engine (same category or gender)
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, 4);

  // Track product view on mount
  useEffect(() => {
    if (product && onProductViewed) onProductViewed(product);
  }, [product, onProductViewed]);

  // Load reviews from DB
  useEffect(() => {
    if (!product) return;
    const productId = String(product.id);
    setReviewsLoading(true);
    fetch(`${BASE_URL}/reviews?productId=${productId}`)
      .then(r => r.json())
      .then(data => { if (data.success) setReviews(data.reviews); })
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [product?.id]);

  // Upload photo to Cloudinary via backend
  const handleReviewPhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setReviewError('');
    try {
      const url = await uploadToCloudinary(file, 'review-photo');
      setReviewPhotoUrl(url);
    } catch { setReviewError('Photo upload failed.'); }
    finally { setUploadingPhoto(false); }
  };

  // Upload video to Cloudinary via backend
  const handleReviewVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    setReviewError('');
    try {
      const url = await uploadToCloudinary(file, 'review-video');
      setReviewVideoUrl(url);
    } catch { setReviewError('Video upload failed.'); }
    finally { setUploadingVideo(false); }
  };

  // Submit review to DB
  const handleAddReview = async (e) => {
    e.preventDefault();
    if (!reviewerName || !reviewComment) {
      setReviewError('Please provide your name and review comment.');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`${BASE_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: String(product.id),
          productName: product.name,
          userName: reviewerName,
          userEmail: currentUser?.email || '',
          rating: reviewRating,
          comment: reviewComment,
          photoUrl: reviewPhotoUrl,
          videoUrl: reviewVideoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit failed');

      // Prepend new review to list
      setReviews(prev => [data.review, ...prev]);
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewerName('');
        setReviewRating(5);
        setReviewComment('');
        setReviewPhotoUrl('');
        setReviewVideoUrl('');
        setReviewSubmitted(false);
      }, 3000);
    } catch (err) {
      setReviewError(err.message || 'Something went wrong.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const imagesList = [product.image, product.image, product.image];

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Back Link */}
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <Link to="/">Back to Home</Link>
        </div>

        {/* TOP SECTION: Full-Page Product View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* Left Gallery (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 shadow-sm relative">
              <img
                src={imagesList[activeImageIndex]}
                alt={product.name}
                className="w-full h-[300px] sm:h-[450px] md:h-[500px] object-cover object-center"
              />
              {product.discount && (
                <span className="absolute top-4 left-4 bg-rose-700 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow-md">
                  {product.discount}
                </span>
              )}
            </div>

            {/* Thumbnail Row */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    activeImageIndex === idx ? 'border-[#0066cc] scale-105 shadow-xs' : 'border-slate-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Right Product Details (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#0066cc]">
                <span>{product.category}</span>
                <span>•</span>
                <span>{product.gender || 'Unisex'}</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center space-x-2 pt-1">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>
                <span className="text-xs font-bold text-slate-700">4.9 / 5.0</span>
                <span className="text-xs text-slate-400">({reviews.length} Verified Customer Reviews)</span>
              </div>
            </div>

            {/* Price Box in ₹ INR */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-baseline space-x-3">
              <span className="text-3xl font-black text-[#0066cc]">₹{product.price.toFixed(2)}</span>
              {product.originalPrice && (
                <span className="text-sm font-bold text-slate-400 line-through">₹{product.originalPrice.toFixed(2)}</span>
              )}
              {product.discount && (
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Save {product.discount}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 font-semibold leading-relaxed">
              {product.description || "Premium quality product crafted with express India delivery, soft breathable fabric, and long-lasting durability for festive occasions."}
            </p>

            {/* Quantity Selector */}
            <div className="space-y-2 pt-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">Quantity</label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 font-bold text-xs text-slate-900">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-slate-700 hover:bg-slate-200 font-bold"
                  >
                    +
                  </button>
                </div>
                <span className={`text-xs font-semibold ${isOutOfStock ? 'text-red-600' : 'text-emerald-600'}`}>
                  {isOutOfStock ? '✗ Out of Stock (Currently Unavailable)' : '✓ In Stock (Express Shipping Available)'}
                </span>
              </div>
            </div>

            {/* Product Customization Fields */}
            {product.isCustomizable && (
              <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-200 space-y-4">
                <div className="flex items-center space-x-1.5 text-amber-900 font-extrabold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                  <span>Customization Details Required</span>
                </div>
                <p className="text-xs text-amber-800 font-semibold">
                  Prompt: {product.customizationPrompt || "This product supports custom options. Please provide details below:"}
                </p>

                {(product.customizationType === 'text' || product.customizationType === 'both') && (
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Custom Text Name / Note *</label>
                    <input
                      type="text"
                      value={customTextVal}
                      onChange={(e) => setCustomTextVal(e.target.value)}
                      placeholder="e.g. Enter name to be printed"
                      className="w-full px-3 py-2 text-xs border border-slate-355 rounded-xl focus:outline-none focus:border-[#0066cc] bg-white text-slate-800 font-semibold"
                    />
                  </div>
                )}

                {(product.customizationType === 'image' || product.customizationType === 'both') && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase">Upload Custom Photo / Design *</label>
                    <div className="flex items-center space-x-3">
                      <input
                        type="file"
                        accept="image/*"
                        id="user-custom-image-upload"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (!file) return;
                          setUploadingCustomImage(true);
                          setCustomizationError('');
                          try {
                            const url = await uploadToCloudinary(file, 'custom-image');
                            setCustomImageVal(url);
                          } catch (err) {
                            setCustomizationError(err.message || 'Failed to upload photo.');
                          } finally {
                            setUploadingCustomImage(false);
                          }
                        }}
                      />
                      <label
                        htmlFor="user-custom-image-upload"
                        className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-350 transition-colors flex items-center space-x-1.5 shrink-0"
                      >
                        {uploadingCustomImage ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" /><span>Uploading...</span></>
                        ) : (
                          <><Upload className="w-4 h-4 text-slate-600" /><span>Choose Photo</span></>
                        )}
                      </label>
                      <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {customImageVal ? "Photo uploaded" : "No file selected"}
                      </span>
                    </div>
                    {customImageVal && (
                      <div className="mt-2 flex items-center space-x-2">
                        <img src={customImageVal} alt="User Design" className="w-12 h-12 object-cover rounded-lg border bg-white" />
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Custom photo loaded successfully!</span>
                      </div>
                    )}
                    {customizationError && (
                      <p className="text-[11px] text-red-600 font-bold">{customizationError}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-4 pt-4">
              <button
                disabled={isOutOfStock}
                onClick={() => !isOutOfStock && handleAddToCartWithCustomization()}
                className={`flex-1 py-4 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl shadow-lg transition-colors flex items-center justify-center space-x-2 ${
                  isOutOfStock ? 'bg-slate-400 cursor-not-allowed shadow-none' : 'bg-[#0066cc] hover:bg-blue-700'
                }`}
              >
                <ShoppingBag className="w-5 h-5" />
                <span>{isOutOfStock ? 'OUT OF STOCK' : `ADD TO SHOPPING CART (₹${(product.price * quantity).toFixed(2)})`}</span>
              </button>

              <button
                onClick={() => onToggleWishlist(product)}
                className={`p-4 border-2 rounded-2xl transition-colors ${
                  isWishlisted ? 'border-red-500 bg-red-50 text-red-500' : 'border-slate-300 hover:border-slate-800 text-slate-700'
                }`}
                title="Save to Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-red-500' : ''}`} />
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-3 pt-4 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <Truck className="w-5 h-5 text-[#0066cc] mx-auto" />
                <span className="text-[10px] font-bold text-slate-700 block">Fast India Delivery</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <RotateCcw className="w-5 h-5 text-[#0066cc] mx-auto" />
                <span className="text-[10px] font-bold text-slate-700 block">7 Days Return</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <ShieldCheck className="w-5 h-5 text-[#0066cc] mx-auto" />
                <span className="text-[10px] font-bold text-slate-700 block">100% Genuine</span>
              </div>
            </div>

          </div>

        </div>

        {/* BOTTOM SECTION: Customer Reviews & Cloudinary Photo Upload */}
        <div className="pt-12 border-t border-slate-200 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Customer Reviews & Photos ({reviews.length})</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Reviews List (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {reviewsLoading ? (
                <div className="text-xs text-slate-400 text-center py-6">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="text-xs text-slate-400 text-center py-6">No reviews yet. Be the first to review!</div>
              ) : reviews.map((rev) => (
                <div key={rev._id || rev.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-xs text-slate-900">{rev.userName || rev.name}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Verified Buyer</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rev.createdAt || rev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>

                  <p className="text-xs text-slate-700 font-semibold leading-relaxed">"{rev.comment}"</p>

                  <div className="flex space-x-3">
                    {rev.photoUrl && (
                      <img src={rev.photoUrl} alt="Customer Photo" className="w-24 h-24 object-cover rounded-xl border border-slate-200 shadow-xs" />
                    )}
                    {rev.videoUrl && (
                      <video src={rev.videoUrl} controls className="w-32 h-24 object-cover rounded-xl border border-slate-200 shadow-xs" />
                    )}
                  </div>

                  {/* Likes, Dislikes and Comment toggle row */}
                  <div className="flex items-center space-x-4 pt-2 border-t border-slate-200/60 mt-3 text-xs">
                    <button 
                      onClick={() => handleLikeReview(rev._id)}
                      className={`flex items-center space-x-1.5 font-bold hover:text-blue-600 transition-colors ${
                        currentUser && rev.likes?.includes(currentUser.email) ? 'text-blue-600' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{rev.likes?.length || 0}</span>
                    </button>

                    <button 
                      onClick={() => handleDislikeReview(rev._id)}
                      className={`flex items-center space-x-1.5 font-bold hover:text-red-600 transition-colors ${
                        currentUser && rev.dislikes?.includes(currentUser.email) ? 'text-red-600' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>{rev.dislikes?.length || 0}</span>
                    </button>

                    <button 
                      onClick={() => {
                        setExpandedReplies(prev => ({ ...prev, [rev._id]: !prev[rev._id] }));
                      }}
                      className="flex items-center space-x-1.5 font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{rev.comments?.length || 0} Comments</span>
                    </button>
                  </div>

                  {/* Expanded Comments/Replies section */}
                  {expandedReplies[rev._id] && (
                    <div className="space-y-3 pl-4 border-l-2 border-slate-200 mt-3 transition-all duration-300">
                      {rev.comments && rev.comments.length > 0 && (
                        <div className="space-y-2">
                          {rev.comments.map((comment, cIdx) => (
                            <div key={comment._id || cIdx} className="bg-white p-3 rounded-xl border border-slate-100 space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-slate-800">{comment.userName}</span>
                                <span className="text-slate-400">
                                  {new Date(comment.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 font-semibold">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Write comment box */}
                      {currentUser ? (
                        <div className="flex space-x-2 pt-1">
                          <input 
                            type="text"
                            value={replyTexts[rev._id] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [rev._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCommentReview(rev._id); }}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#0066cc] bg-white text-slate-800"
                          />
                          <button 
                            onClick={() => handleCommentReview(rev._id)}
                            className="px-3 py-1.5 bg-[#0066cc] hover:bg-blue-700 text-white font-extrabold text-xs uppercase rounded-lg transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
                          >
                            <CornerDownRight className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold bg-slate-100/50 p-2 rounded-lg">
                          🔒 Please log in to comment or reply to this review.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Write a Review Form + Cloudinary Photo Uploader (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 space-y-4">
              <h4 className="font-black text-base text-white border-b border-slate-800 pb-3">Write a Customer Review</h4>

              {reviewSubmitted ? (
                <div className="py-6 text-center space-y-2 animate-fade-in">
                  <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h5 className="font-bold text-white text-sm">Review Submitted!</h5>
                  <p className="text-xs text-slate-400">Thank you for posting your photo and review.</p>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Rating</label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 focus:outline-none"
                        >
                          <Star className={`w-5 h-5 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Your Review Comment *</label>
                    <textarea
                      rows={3}
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Describe fit, fabric quality, and experience..."
                      className="w-full px-3 py-2 text-xs border border-slate-700 rounded-xl bg-slate-800 text-white focus:outline-none focus:border-[#0066cc]"
                    />
                  </div>

                  {/* Photo + Video Upload → Cloudinary */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-300">Attach Photo (Cloudinary)</label>
                    <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-colors">
                      {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" /> : <Upload className="w-4 h-4 text-[#0066cc]" />}
                      <span>{uploadingPhoto ? 'Uploading...' : 'Attach Photo'}</span>
                      <input type="file" accept="image/*" onChange={handleReviewPhotoUpload} className="hidden" disabled={uploadingPhoto} />
                    </label>
                    {reviewPhotoUrl && (
                      <div className="pt-1 flex items-center space-x-2">
                        <img src={reviewPhotoUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-700" />
                        <span className="text-[11px] text-emerald-400 font-bold">✓ Uploaded</span>
                      </div>
                    )}

                    <label className="block text-xs font-bold text-slate-300 mt-2">Attach Video (Cloudinary)</label>
                    <label className="w-full py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-colors">
                      {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" /> : <Video className="w-4 h-4 text-[#0066cc]" />}
                      <span>{uploadingVideo ? 'Uploading...' : 'Attach Video'}</span>
                      <input type="file" accept="video/*" onChange={handleReviewVideoUpload} className="hidden" disabled={uploadingVideo} />
                    </label>
                    {reviewVideoUrl && (
                      <div className="pt-1 flex items-center space-x-2">
                        <video src={reviewVideoUrl} className="w-16 h-10 object-cover rounded-lg border border-slate-700" />
                        <span className="text-[11px] text-emerald-400 font-bold">✓ Video Uploaded</span>
                      </div>
                    )}
                  </div>

                  {reviewError && <p className="text-xs text-red-400 font-semibold">{reviewError}</p>}

                  <button
                    type="submit"
                    disabled={reviewSubmitting || uploadingPhoto || uploadingVideo}
                    className="w-full py-3 bg-[#0066cc] hover:bg-blue-600 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
                  >
                    {reviewSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{reviewSubmitting ? 'SUBMITTING...' : 'POST CUSTOMER REVIEW'}</span>
                  </button>
                </form>
              )}
            </div>

          </div>
        </div>

        {/* RELATED & RECOMMENDED PRODUCTS ENGINE */}
        {relatedProducts.length > 0 && (
          <div className="pt-12 border-t border-slate-200 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Recommended Related Products</h3>
              <Link to="/shop" className="text-xs font-extrabold text-[#0066cc] hover:underline">View All Catalog →</Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
              {relatedProducts.map((relProd) => (
                <ProductCard
                  key={relProd.id}
                  product={relProd}
                  onAddToCart={onAddToCart}
                  onQuickView={onQuickView}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistItems.some(i => i.id === relProd.id)}
                  isCartAdded={cartItems.some(i => i.id === relProd.id)}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
