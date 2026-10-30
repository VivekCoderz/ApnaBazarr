import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Truck, RotateCcw, Upload, CheckCircle, Sparkles, Video, Loader2, ThumbsUp, ThumbsDown, CornerDownRight, MessageSquare, Banknote, Package, MessageCircle, ChevronRight, ChevronDown, Share2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { whatsappShareUrl } from '../utils/referral';
import { useShippingQuote } from '../utils/shipping';
import { formatPrice, displayName } from '../utils/format';
import { FREE_DELIVERY_ABOVE, DELIVERY_CHARGE, COD_MAX_AMOUNT, RETURN_POLICY_LINE, whatsappUrl, categoryLabel } from '../config/store';
import Button from '../components/ui/Button';
import { buttonClass } from '../components/ui/buttonClass';
import Badge from '../components/ui/Badge';
import SectionHeader from '../components/ui/SectionHeader';
import CategoryGlyph from '../components/ui/CategoryGlyph';

// Default text the admin form fills in; not worth showing as a description
const GENERIC_DESCRIPTION = /^high quality product from Dhagaro\.?$/i;

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
  loading = false,
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

  // Only live products are in `products`; a hidden or deleted id shows the 'not available' view
  const product = products.find(p => String(p.id) === String(id));
  const isOutOfStock = product?.inStock === false || product?.stock <= 0;

  const [selectedSize, setSelectedSize] = useState(product?.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
  const [selectedColor, setSelectedColor] = useState(product?.colors && product.colors.length > 0 ? product.colors[0] : 'Default');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Reset selected size and color when product changes
  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes && product.sizes.length > 0 ? product.sizes[0] : '');
      setSelectedColor(product.colors && product.colors.length > 0 ? product.colors[0] : 'Default');
    }
  }, [product]);

  // Reviews State — load from DB
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Expanded replies list and input text states
  const [expandedReplies, setExpandedReplies] = useState({});
  const [replyTexts, setReplyTexts] = useState({});

  // New Review Form State
  const [reviewerName, setReviewerName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [sellerRating, setSellerRating] = useState(5);
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
        return false;
      }
      if ((product.customizationType === 'image' || product.customizationType === 'both') && !customImageVal) {
        alert(product.customizationPrompt || "Please upload the required customization photo.");
        return false;
      }
    }
    onAddToCart(product, quantity, {
      customText: customTextVal,
      customImage: customImageVal,
      selectedSize: selectedSize,
      selectedColor: selectedColor
    });
    return true;
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

  // Delivery fee for the selected quantity is quoted by the server so cost/margin stays private
  const { shipping: deliveryCharge, loading: deliveryLoading } = useShippingQuote(product ? [{ id: product.id, quantity }] : []);

  // Leave room for the mobile sticky buy bar at the bottom of the page
  const hasProduct = Boolean(product);
  useEffect(() => {
    if (!hasProduct) return undefined;
    document.body.classList.add('has-buy-bar');
    return () => document.body.classList.remove('has-buy-bar');
  }, [hasProduct]);

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
          sellerRating: sellerRating,
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
        setSellerRating(5);
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

  // Products still loading (server waking up): placeholder instead of "not available"
  if (!product && loading) {
    return (
      <div className="min-h-screen bg-white py-8" role="status" aria-label="Loading product">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-14 lg:px-8 animate-pulse">
          <div className="aspect-[4/5] rounded-lg bg-slate-200 sm:aspect-square lg:col-span-6" />
          <div className="space-y-4 lg:col-span-6">
            <div className="h-4 w-24 rounded bg-slate-200" />
            <div className="h-9 w-11/12 rounded bg-slate-200" />
            <div className="h-9 w-1/3 rounded bg-slate-200" />
            <div className="flex gap-2">{[0, 1, 2, 3].map(i => <div key={i} className="h-11 w-14 rounded-md bg-slate-200" />)}</div>
            <div className="h-12 rounded-md bg-slate-200" />
            <div className="grid grid-cols-2 gap-3">{[0, 1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-slate-200" />)}</div>
          </div>
        </div>
        <span className="sr-only">Loading product…</span>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-lg rounded-lg border border-line bg-white p-8 text-center shadow-card">
          <span className="mx-auto flex h-28 w-36 items-center justify-center rounded-lg border border-line bg-brand-cream">
            <CategoryGlyph name="" className="h-10 w-10 text-slate-400" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold text-brand-navy">This product is not available right now</h1>
          <p className="mt-2 text-slate-600">It may be out of stock or out of season.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/shop">See other products</Button>
            <Button href={whatsappUrl('Hello Dhagaro, I am looking for a product that is not available on the website.')} variant="secondary">
              <MessageCircle className="h-4 w-4" aria-hidden="true" /> Ask on WhatsApp
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlistItems.some(i => i.id === product.id);

  // Related products engine (same category or gender)
  const relatedProducts = products
    .filter(p => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
    .slice(0, 4);

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image];
  // Rating only from real reviews; nothing is shown when there are none
  const reviewCount = reviewsLoading ? (product.reviewsCount || 0) : reviews.length;
  const averageRating = !reviewsLoading && reviews.length > 0
    ? Number((reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / reviews.length).toFixed(1))
    : product.rating;
  const showRating = reviewCount > 0 && averageRating != null;

  const lineTotal = product.price * quantity;
  const neededForFree = Math.max(0, FREE_DELIVERY_ABOVE - lineTotal);
  const off = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  const name = displayName(product.name);

  // Only show the description when it says something real (not the admin default line)
  const description = (product.description || '').trim();
  const hasDescription = description.length > 0 && !GENERIC_DESCRIPTION.test(description);

  const detailRows = [
    ['Category', categoryLabel(product.category)],
    product.sizes?.length ? ['Sizes available', product.sizes.join(', ')] : null,
    product.colors?.length ? ['Colours', product.colors.join(', ')] : null,
    product.isCustomizable ? ['Personalisation', 'Available (add your details above)'] : null,
    ['Ships from', 'Panipat, Haryana'],
    ['Checked & packed', 'By the Dhagaro team']
  ].filter(Boolean);

  // "Buy Now": add to cart and go straight to checkout
  const handleBuyNow = () => {
    if (handleAddToCartWithCustomization()) navigate('/checkout');
  };

  const deliveryText = deliveryLoading
    ? 'Checking delivery charge…'
    : deliveryCharge === 0 || (deliveryCharge === null && neededForFree === 0)
      ? 'Free delivery on this order'
      : `Delivery ₹${deliveryCharge ?? 49} · add ${formatPrice(neededForFree)} more for free delivery`;
  const deliveryFree = !deliveryLoading && (deliveryCharge === 0 || (deliveryCharge === null && neededForFree === 0));

  const chip = (active) =>
    `min-h-11 min-w-12 rounded-md border px-4 text-sm font-semibold transition-colors ${
      active ? 'border-brand-navy bg-brand-navy text-white' : 'border-slate-300 bg-white text-ink hover:border-brand-navy'
    }`;

  const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-slate-400 focus:border-brand-navy focus:outline-none';

  const accordions = [
    hasDescription && { title: 'Description', body: <p className="whitespace-pre-line">{description}</p> },
    {
      title: 'Product details',
      body: (
        <dl className="divide-y divide-slate-100">
          {detailRows.map(([k, v]) => (
            <div key={k} className="grid grid-cols-[140px_1fr] gap-3 py-2">
              <dt className="text-slate-500">{k}</dt>
              <dd className="font-semibold text-ink">{v}</dd>
            </div>
          ))}
        </dl>
      )
    },
    {
      title: 'Delivery',
      body: (
        <ul className="list-disc space-y-1 pl-5">
          <li>Free delivery on orders of ₹{FREE_DELIVERY_ABOVE} or more, otherwise ₹{DELIVERY_CHARGE}.</li>
          <li>Dispatched from Panipat within 2 days, Monday to Saturday.</li>
          <li>Delivery takes 2–4 days in Haryana and Delhi, 4–8 days to the rest of India.</li>
        </ul>
      )
    },
    {
      title: 'Returns & exchange',
      body: <p>{RETURN_POLICY_LINE} <Link to="/refunds" className="font-semibold text-brand-navy underline underline-offset-2">Read the full policy</Link></p>
    },
    {
      title: 'Cash on Delivery',
      body: <p>Pay in cash when your parcel arrives, on orders up to {formatPrice(COD_MAX_AMOUNT)}. We confirm every order with you on WhatsApp before dispatch.</p>
    }
  ].filter(Boolean);

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-sm text-slate-600">
          <Link to="/" className="shrink-0 hover:text-brand-navy">Home</Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="shrink-0 hover:text-brand-navy">{categoryLabel(product.category)}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span className="truncate font-semibold text-ink">{name}</span>
        </nav>

        {/* TOP SECTION */}
        <div className="mt-4 grid grid-cols-1 items-start gap-8 sm:mt-6 lg:grid-cols-12 lg:gap-14">

          {/* Gallery */}
          <div className="space-y-3 lg:sticky lg:top-36 lg:col-span-6">
            <div className="relative overflow-hidden rounded-lg bg-brand-cream">
              <img
                src={imagesList[activeImageIndex]}
                alt={name}
                className="aspect-[4/5] w-full object-cover sm:aspect-square"
              />
              {off > 0 && <Badge tone="sale" className="absolute left-4 top-4">{off}% off</Badge>}
              <button
                onClick={() => onToggleWishlist(product)}
                className={`absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full shadow-card transition-colors ${
                  isWishlisted ? 'bg-[#B91C1C] text-white' : 'bg-white/95 text-slate-700 hover:text-[#B91C1C]'
                }`}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                aria-pressed={isWishlisted}
              >
                <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {imagesList.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    aria-label={`Show photo ${idx + 1}`}
                    aria-current={activeImageIndex === idx ? 'true' : undefined}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      activeImageIndex === idx ? 'border-brand-navy' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6 lg:col-span-6">
            <div className="space-y-2">
              <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="inline-block text-xs font-semibold text-brand-cta hover:underline">
                {categoryLabel(product.category)}
              </Link>
              <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-brand-navy sm:text-4xl">{name}</h1>

              {showRating && (
                <a href="#reviews" className="flex items-center gap-1.5 pt-1">
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden="true" />
                  <span className="text-sm font-semibold text-ink">{averageRating.toFixed(1)}</span>
                  <span className="text-sm text-slate-600 underline underline-offset-2">({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})</span>
                </a>
              )}

              {product.seller && (
                <p className="flex items-center gap-2 pt-1 text-sm text-slate-600">
                  <span>Sold by</span>
                  <Link to={`/shop?sellerId=${product.seller.id}`} className="font-semibold text-brand-navy underline underline-offset-2">
                    {product.seller.shopName}
                  </Link>
                </p>
              )}
            </div>

            {/* Price */}
            <div className="border-y border-line py-4">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-4xl font-semibold text-brand-cta">{formatPrice(product.price)}</span>
                {product.originalPrice > product.price && (
                  <>
                    <s className="text-lg text-slate-500">{formatPrice(product.originalPrice)}</s>
                    <Badge tone="cod">You save {formatPrice(product.originalPrice - product.price)}</Badge>
                  </>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600">Inclusive of all taxes · Cash on Delivery available</p>
            </div>

            {/* Sizes */}
            {product.sizes && product.sizes.length > 0 && (
              <fieldset className="space-y-2.5">
                <legend className="text-sm font-semibold text-ink">
                  Size: <span className="font-normal text-slate-600">{selectedSize}</span>
                </legend>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button key={size} type="button" onClick={() => setSelectedSize(size)} aria-pressed={selectedSize === size} className={chip(selectedSize === size)}>
                      {size}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {/* Colours */}
            {product.colors && product.colors.length > 0 && (
              <fieldset className="space-y-2.5">
                <legend className="text-sm font-semibold text-ink">
                  Colour: <span className="font-normal text-slate-600">{selectedColor}</span>
                </legend>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color) => {
                    const isHex = color.startsWith('#');
                    const normalizedColor = isHex ? color : color.toLowerCase();
                    const isSelected = selectedColor.toLowerCase() === color.toLowerCase();
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        title={color}
                        aria-label={color}
                        aria-pressed={isSelected}
                        className={`relative h-10 w-10 rounded-full border border-slate-300 transition-all ${isSelected ? 'ring-2 ring-brand-navy ring-offset-2' : 'hover:scale-105'}`}
                        style={{ backgroundColor: normalizedColor }}
                      >
                        {isSelected && (
                          <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${
                            color.toLowerCase() === 'white' || color === '#ffffff' ? 'text-slate-800' : 'text-white'
                          }`}>
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </fieldset>
            )}

            {/* Quantity + stock */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-md border border-slate-300" role="group" aria-label="Quantity">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-11 w-11 items-center justify-center rounded-md text-lg font-semibold text-ink hover:bg-brand-cream" aria-label="Decrease quantity">−</button>
                <span className="w-8 text-center text-sm font-semibold text-ink" aria-live="polite">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="flex h-11 w-11 items-center justify-center rounded-md text-lg font-semibold text-ink hover:bg-brand-cream" aria-label="Increase quantity">+</button>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-sm font-semibold ${isOutOfStock ? 'text-[#B91C1C]' : 'text-emerald-700'}`}>
                <span className={`h-2 w-2 rounded-full ${isOutOfStock ? 'bg-[#B91C1C]' : 'bg-emerald-600'}`} aria-hidden="true" />
                {isOutOfStock ? 'Out of stock' : 'In stock, ships in 2 days'}
              </span>
            </div>

            <p className={`flex items-center gap-2 text-sm font-semibold ${deliveryFree ? 'text-emerald-700' : 'text-ink'}`}>
              <Truck className="h-5 w-5 shrink-0" aria-hidden="true" /> {deliveryText}
            </p>

            {/* Customization */}
            {product.isCustomizable && (
              <div className="space-y-4 rounded-lg border border-line bg-brand-cream p-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span>Personalise this product</span>
                </div>
                <p className="text-sm text-amber-900">
                  {product.customizationPrompt || 'This product supports custom options. Please add your details below.'}
                </p>

                {(product.customizationType === 'text' || product.customizationType === 'both') && (
                  <div className="space-y-1.5">
                    <label htmlFor="custom-text" className="block text-sm font-semibold text-ink">Your text *</label>
                    <input
                      id="custom-text"
                      type="text"
                      value={customTextVal}
                      onChange={(e) => setCustomTextVal(e.target.value)}
                      placeholder="e.g. Name to be printed"
                      className={inputCls}
                    />
                  </div>
                )}

                {(product.customizationType === 'image' || product.customizationType === 'both') && (
                  <div className="space-y-2">
                    <span className="block text-sm font-semibold text-ink">Your photo or design *</span>
                    <div className="flex items-center gap-3">
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
                      <label htmlFor="user-custom-image-upload" className={buttonClass('secondary', 'sm', 'cursor-pointer shrink-0')}>
                        {uploadingCustomImage ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /><span>Uploading…</span></>
                        ) : (
                          <><Upload className="h-4 w-4" /><span>Choose photo</span></>
                        )}
                      </label>
                      <span className="truncate text-sm text-slate-600">{customImageVal ? 'Photo uploaded' : 'No file selected'}</span>
                    </div>
                    {customImageVal && (
                      <div className="mt-2 flex items-center gap-2">
                        <img src={customImageVal} alt="Your design" className="h-12 w-12 rounded-lg border bg-white object-cover" />
                        <span className="text-sm font-semibold text-emerald-700">Photo added</span>
                      </div>
                    )}
                    {customizationError && <p className="text-sm font-semibold text-[#B91C1C]">{customizationError}</p>}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" disabled={isOutOfStock} onClick={() => !isOutOfStock && handleBuyNow()} className="flex-1">
                {isOutOfStock ? 'Out of stock' : 'Buy Now · Cash on Delivery'}
              </Button>
              {!isOutOfStock && (
                <Button size="lg" variant="secondary" onClick={() => handleAddToCartWithCustomization()} className="flex-1">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" /> Add to Cart
                </Button>
              )}
            </div>

            {/* Trust */}
            <ul className="grid grid-cols-2 gap-3">
              {[
                { icon: Banknote, title: 'Cash on Delivery', sub: 'Pay when it arrives' },
                { icon: Truck, title: 'Free delivery', sub: 'Above ₹499, otherwise ₹49' },
                { icon: Package, title: 'Ships in 2 days', sub: 'From Panipat, Mon–Sat' },
                { icon: RotateCcw, title: '7-day returns', sub: 'Damaged, wrong or wrong size' }
              ].map(({ icon: Icon, title, sub }) => (
                <li key={title} className="flex items-start gap-3 rounded-lg bg-brand-cream p-3 sm:p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-cta" strokeWidth={1.75} aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-semibold leading-tight text-brand-navy">{title}</span>
                    <span className="mt-0.5 block text-xs text-slate-600">{sub}</span>
                  </span>
                </li>
              ))}
            </ul>

            {/* WhatsApp */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button
                href={whatsappUrl(`Hello, I have a question about this product: ${product.name} - ${window.location.origin}/product/${product.id}`)}
                variant="tertiary"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Have a question? Ask on WhatsApp
              </Button>
              <Button href={whatsappShareUrl(product, currentUser?.resellerProfile?.code)} variant="whatsapp" size="sm">
                <Share2 className="h-4 w-4" aria-hidden="true" />
                {currentUser?.resellerProfile?.code ? 'Share and earn' : 'Share on WhatsApp'}
              </Button>
            </div>

            {/* Product details accordions */}
            <div className="divide-y divide-line border-y border-line">
              {accordions.map((item, i) => (
                <details key={item.title} open={i === 0} className="group">
                  <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 py-3 text-lg font-semibold text-brand-navy">
                    {item.title}
                    <ChevronDown className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <div className="pb-5 text-sm leading-relaxed text-slate-700 sm:text-base">{item.body}</div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* REVIEWS */}
        <section id="reviews" className="mt-14 scroll-mt-40 border-t border-line pt-12 sm:mt-20" aria-labelledby="reviews-title">
          <SectionHeader
            id="reviews-title"
            eyebrow="Reviews"
            title={`Customer reviews${reviews.length > 0 ? ` (${reviews.length})` : ''}`}
          />

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-4 lg:col-span-7">
              {reviewsLoading ? (
                <div className="space-y-3" role="status" aria-label="Loading reviews">
                  {[0, 1].map(i => <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />)}
                </div>
              ) : reviews.length === 0 ? (
                <div className="flex flex-col items-center rounded-lg border-2 border-dashed border-line bg-brand-cream/60 px-6 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-slate-400 ring-1 ring-inset ring-line">
                    <Star className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <p className="mt-4 text-xl font-semibold text-brand-navy">Be the first to review</p>
                  <p className="mt-1 max-w-sm text-slate-600">Bought this product? Share a photo and a few words to help other shoppers.</p>
                  <Button href="#write-review" variant="secondary" size="sm" className="mt-5">Write a review</Button>
                </div>
              ) : reviews.map((rev) => (
                <article key={rev._id || rev.id} className="space-y-3 rounded-lg border border-line bg-white p-5 shadow-card">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">
                        {(rev.userName || rev.name || '?').charAt(0).toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold text-ink">{rev.userName || rev.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(rev.createdAt || rev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      Product
                      <span className="flex" aria-label={`${rev.rating} out of 5`}>
                        {[...Array(rev.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden="true" />)}
                      </span>
                    </span>
                    {rev.sellerRating && (
                      <span className="flex items-center gap-1">
                        Delivery &amp; service
                        <span className="flex" aria-label={`${rev.sellerRating} out of 5`}>
                          {[...Array(rev.sellerRating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-brand-navy text-brand-navy" aria-hidden="true" />)}
                        </span>
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-relaxed text-slate-700 sm:text-base">{rev.comment}</p>

                  {(rev.photoUrl || rev.videoUrl) && (
                    <div className="flex gap-3">
                      {rev.photoUrl && <img src={rev.photoUrl} alt="Customer photo" loading="lazy" className="h-24 w-24 rounded-lg border border-line object-cover" />}
                      {rev.videoUrl && <video src={rev.videoUrl} controls className="h-24 w-32 rounded-lg border border-line object-cover" />}
                    </div>
                  )}

                  <div className="flex items-center gap-1 border-t border-slate-100 pt-2 text-sm">
                    <button
                      onClick={() => handleLikeReview(rev._id)}
                      aria-label="Helpful"
                      className={`flex min-h-10 items-center gap-1.5 rounded-md px-3 font-semibold transition-colors hover:bg-brand-cream ${
                        currentUser && rev.likes?.includes(currentUser.email) ? 'text-brand-navy' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{rev.likes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => handleDislikeReview(rev._id)}
                      aria-label="Not helpful"
                      className={`flex min-h-10 items-center gap-1.5 rounded-md px-3 font-semibold transition-colors hover:bg-brand-cream ${
                        currentUser && rev.dislikes?.includes(currentUser.email) ? 'text-[#B91C1C]' : 'text-slate-500'
                      }`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span>{rev.dislikes?.length || 0}</span>
                    </button>
                    <button
                      onClick={() => setExpandedReplies(prev => ({ ...prev, [rev._id]: !prev[rev._id] }))}
                      className="flex min-h-10 items-center gap-1.5 rounded-md px-3 font-semibold text-slate-500 transition-colors hover:bg-brand-cream hover:text-ink"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>{rev.comments?.length || 0} replies</span>
                    </button>
                  </div>

                  {expandedReplies[rev._id] && (
                    <div className="mt-2 space-y-3 border-l-2 border-line pl-4">
                      {rev.comments && rev.comments.length > 0 && (
                        <div className="space-y-2">
                          {rev.comments.map((comment, cIdx) => (
                            <div key={comment._id || cIdx} className="space-y-1 rounded-lg bg-brand-cream p-3">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-ink">{comment.userName}</span>
                                <span className="text-slate-500">
                                  {new Date(comment.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-sm text-slate-700">{comment.text}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      {currentUser ? (
                        <div className="flex gap-2 pt-1">
                          <input
                            type="text"
                            value={replyTexts[rev._id] || ''}
                            onChange={(e) => setReplyTexts(prev => ({ ...prev, [rev._id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleCommentReview(rev._id); }}
                            placeholder="Write a reply…"
                            aria-label="Write a reply"
                            className={inputCls}
                          />
                          <Button size="sm" variant="secondary" onClick={() => handleCommentReview(rev._id)} className="shrink-0">
                            <CornerDownRight className="h-4 w-4" /> Reply
                          </Button>
                        </div>
                      ) : (
                        <p className="rounded-lg bg-brand-cream p-2.5 text-xs text-slate-600">Please log in to reply to this review.</p>
                      )}
                    </div>
                  )}
                </article>
              ))}
            </div>

            {/* Write a review */}
            <div id="write-review" className="scroll-mt-40 rounded-lg border border-line bg-white p-5 shadow-card sm:p-6 lg:col-span-5">
              <h3 className="text-xl font-semibold text-brand-navy">Write a review</h3>
              <p className="mt-1 text-sm text-slate-600">Tell others about the fabric, size and delivery.</p>

              {reviewSubmitted ? (
                <div className="space-y-2 py-8 text-center animate-fade-in">
                  <CheckCircle className="mx-auto h-10 w-10 text-emerald-600" />
                  <p className="text-lg font-semibold text-brand-navy">Thank you for your review!</p>
                  <p className="text-sm text-slate-600">It helps other shoppers decide.</p>
                </div>
              ) : (
                <form onSubmit={handleAddReview} className="mt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="review-name" className="block text-sm font-semibold text-ink">Your name *</label>
                    <input id="review-name" type="text" required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} placeholder="Enter your name" className={inputCls} />
                  </div>

                  {[
                    { label: 'Product quality', value: reviewRating, set: setReviewRating },
                    { label: 'Delivery & service', value: sellerRating, set: setSellerRating }
                  ].map(({ label, value, set }) => (
                    <fieldset key={label}>
                      <legend className="text-sm font-semibold text-ink">{label}</legend>
                      <div className="mt-1 flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => set(star)}
                            aria-label={`${star} star${star > 1 ? 's' : ''}`}
                            aria-pressed={star <= value}
                            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-amber-50"
                          >
                            <Star className={`h-6 w-6 ${star <= value ? 'fill-amber-500 text-amber-500' : 'text-slate-300'}`} />
                          </button>
                        ))}
                      </div>
                    </fieldset>
                  ))}

                  <div className="space-y-1.5">
                    <label htmlFor="review-comment" className="block text-sm font-semibold text-ink">Your review *</label>
                    <textarea id="review-comment" rows={3} required value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="How is the fabric, fit and finish?" className={inputCls} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className={buttonClass('secondary', 'sm', 'cursor-pointer w-full')}>
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      <span>{uploadingPhoto ? 'Uploading…' : reviewPhotoUrl ? 'Photo added' : 'Add photo'}</span>
                      <input type="file" accept="image/*" onChange={handleReviewPhotoUpload} className="hidden" disabled={uploadingPhoto} />
                    </label>
                    <label className={buttonClass('secondary', 'sm', 'cursor-pointer w-full')}>
                      {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                      <span>{uploadingVideo ? 'Uploading…' : reviewVideoUrl ? 'Video added' : 'Add video'}</span>
                      <input type="file" accept="video/*" onChange={handleReviewVideoUpload} className="hidden" disabled={uploadingVideo} />
                    </label>
                  </div>
                  {(reviewPhotoUrl || reviewVideoUrl) && (
                    <div className="flex items-center gap-2">
                      {reviewPhotoUrl && <img src={reviewPhotoUrl} alt="Your photo" className="h-12 w-12 rounded-lg border border-line object-cover" />}
                      {reviewVideoUrl && <video src={reviewVideoUrl} className="h-12 w-16 rounded-lg border border-line object-cover" />}
                    </div>
                  )}

                  {reviewError && <p className="text-sm font-semibold text-[#B91C1C]">{reviewError}</p>}

                  <Button type="submit" size="lg" disabled={reviewSubmitting || uploadingPhoto || uploadingVideo} className="w-full">
                    {reviewSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {reviewSubmitting ? 'Posting…' : 'Post review'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* RELATED */}
        {relatedProducts.length > 0 && (
          <section className="mt-14 border-t border-line pt-12 sm:mt-20" aria-labelledby="related-title">
            <SectionHeader id="related-title" eyebrow="More from Panipat" title="You may also like" action={{ label: 'View all', to: '/shop' }} />
            <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-4">
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
          </section>
        )}
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(11,42,85,0.25)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-semibold leading-none text-brand-cta">{formatPrice(product.price)}</p>
            <p className="mt-1 truncate text-xs text-slate-600">
              {product.sizes?.length ? `Size ${selectedSize} · ` : ''}Cash on Delivery
            </p>
          </div>
          {!isOutOfStock && (
            <button
              type="button"
              onClick={() => handleAddToCartWithCustomization()}
              aria-label="Add to cart"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-brand-navy text-brand-navy"
            >
              <ShoppingBag className="h-5 w-5" />
            </button>
          )}
          <Button size="lg" disabled={isOutOfStock} onClick={() => !isOutOfStock && handleBuyNow()} className="shrink-0">
            {isOutOfStock ? 'Out of stock' : 'Buy Now'}
          </Button>
        </div>
      </div>
    </div>
  );
}
