import React, { useState } from 'react';
import { Star, Upload, CheckCircle, MessageSquare, Lock, Video, Loader2 } from 'lucide-react';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Upload file to Cloudinary via backend
async function uploadToCloudinary(file, endpoint) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload/${endpoint}`, {
    method: 'POST',
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

export default function FeedbackForm({ onSubmitFeedback, currentUser }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [category, setCategory] = useState('Product Quality');
  const [message, setMessage] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Upload photo to Cloudinary via backend
  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file, 'feedback-photo');
      setPhotoUrl(url);
    } catch (err) {
      setError('Photo upload failed. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Upload video to Cloudinary via backend
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingVideo(true);
    setError('');
    try {
      const url = await uploadToCloudinary(file, 'feedback-video');
      setVideoUrl(url);
    } catch (err) {
      setError('Video upload failed. Please try again.');
    } finally {
      setUploadingVideo(false);
    }
  };

  // Submit feedback to DB
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !message) {
      setError('Please fill in your name and feedback message.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${BASE_URL}/feedbacks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: currentUser?.email || 'anonymous@apnabazarr.com',
          rating,
          category,
          message,
          photoUrl,
          videoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submit failed');

      // Also update local admin state if callback provided
      if (onSubmitFeedback) {
        onSubmitFeedback({ ...data.feedback, id: data.feedback._id, createdAt: data.feedback.createdAt });
      }

      setSubmitted(true);
      setTimeout(() => {
        setName('');
        setRating(5);
        setMessage('');
        setPhotoUrl('');
        setVideoUrl('');
        setSubmitted(false);
      }, 3000);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Login nahi hai to login prompt
  if (!currentUser) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-center space-y-4">
        <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-lg font-extrabold text-slate-900">Login Required</h3>
        <p className="text-xs text-slate-500">Please log in to your Apna Bazarr account to submit feedback.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-4">
      <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
        <MessageSquare className="w-6 h-6 text-[#0066cc]" />
        <div>
          <h3 className="text-lg font-extrabold text-slate-900">Customer Feedback & Review</h3>
          <p className="text-xs text-slate-500">We value your shopping experience at Apna Bazarr!</p>
        </div>
      </div>

      {submitted ? (
        <div className="py-8 text-center space-y-2 animate-fade-in">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="font-extrabold text-slate-900 text-base">Thank you for your feedback!</h4>
          <p className="text-xs text-slate-500">Your feedback has been saved and sent to the store admin team.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                value={currentUser?.email || ''}
                readOnly
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Auto-filled from your account</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Rating</label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button type="button" key={star} onClick={() => setRating(star)} className="p-1 focus:outline-none">
                    <Star className={`w-6 h-6 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-700 ml-2">{rating} / 5 Stars</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Topic</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
              >
                <option value="Product Quality">Product Quality & Fabric</option>
                <option value="Shopping Experience">Shopping Experience</option>
                <option value="Delivery Speed">Delivery & Packaging</option>
                <option value="Customer Support">Customer Support</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Detailed Feedback *</label>
            <textarea
              rows={3}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us what you loved or how we can improve Apna Bazarr..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-[#0066cc]"
            />
          </div>

          {/* Media Upload — Photo + Video → Cloudinary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Photo Upload */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Attach Photo (Optional)</label>
              <label className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-colors border border-slate-300">
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" /> : <Upload className="w-4 h-4 text-[#0066cc]" />}
                <span>{uploadingPhoto ? 'Uploading to Cloudinary...' : 'Upload Photo'}</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploadingPhoto} />
              </label>
              {photoUrl && (
                <div className="flex items-center space-x-2">
                  <img src={photoUrl} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Uploaded to Cloudinary</span>
                </div>
              )}
            </div>

            {/* Video Upload */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Attach Video (Optional)</label>
              <label className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center space-x-1.5 transition-colors border border-slate-300">
                {uploadingVideo ? <Loader2 className="w-4 h-4 animate-spin text-[#0066cc]" /> : <Video className="w-4 h-4 text-[#0066cc]" />}
                <span>{uploadingVideo ? 'Uploading to Cloudinary...' : 'Upload Video'}</span>
                <input type="file" accept="video/*" onChange={handleVideoUpload} className="hidden" disabled={uploadingVideo} />
              </label>
              {videoUrl && (
                <div className="flex items-center space-x-2">
                  <video src={videoUrl} className="w-16 h-10 object-cover rounded-lg border border-slate-200" />
                  <span className="text-[11px] text-emerald-600 font-bold">✓ Video Uploaded</span>
                </div>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-600 font-semibold">{error}</p>}

          <button
            type="submit"
            disabled={submitting || uploadingPhoto || uploadingVideo}
            className="w-full py-3.5 bg-[#0066cc] hover:bg-blue-700 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors flex items-center justify-center space-x-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            <span>{submitting ? 'SUBMITTING...' : 'SUBMIT CUSTOMER FEEDBACK'}</span>
          </button>
        </form>
      )}
    </div>
  );
}
