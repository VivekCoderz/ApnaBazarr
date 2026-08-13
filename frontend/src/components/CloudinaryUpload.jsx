import React, { useState, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Video, Loader } from 'lucide-react';
import { uploadImage, uploadVideo } from '../services/cloudinaryService';

/**
 * CloudinaryUpload — Reusable drag-and-drop uploader component
 * Supports image and video uploads to Cloudinary via unsigned preset.
 *
 * Props:
 *   type          - 'image' | 'video' (default: 'image')
 *   folder        - Cloudinary folder path
 *   onUploadDone  - callback(url, publicId) after successful upload
 *   onRemove      - callback() when user removes the uploaded file
 *   label         - Label text shown above the dropzone
 *   accept        - Optional override for accept mime types string
 */
export default function CloudinaryUpload({
  type = 'image',
  folder = 'apna-bazarr/products',
  onUploadDone,
  onRemove,
  label = 'Upload File',
  accept,
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [cloudUrl, setCloudUrl] = useState(null);
  const [publicId, setPublicId] = useState(null);
  const [error, setError] = useState('');
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const acceptTypes = accept || (type === 'video'
    ? 'video/mp4,video/webm,video/mov,video/avi'
    : 'image/jpeg,image/jpg,image/png,image/webp,image/gif');

  const handleFile = async (file) => {
    if (!file) return;

    // Local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setError('');
    setUploading(true);
    setProgress(0);

    try {
      let result;
      if (type === 'video') {
        result = await uploadVideo(file, folder, setProgress);
      } else {
        result = await uploadImage(file, folder, setProgress);
      }

      setCloudUrl(result.url);
      setPublicId(result.publicId);
      setUploading(false);
      setProgress(100);
      onUploadDone && onUploadDone(result.url, result.publicId);
    } catch (err) {
      setError(err.message || 'Upload failed. Check your Cloudinary upload preset.');
      setUploading(false);
      setProgress(0);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    setCloudUrl(null);
    setPublicId(null);
    setProgress(0);
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onRemove && onRemove();
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold text-slate-700">{label}</label>
      )}

      {/* Uploaded preview */}
      {previewUrl && (
        <div className="relative w-full rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-50 group">
          {type === 'video' ? (
            <video
              src={previewUrl}
              controls
              className="w-full max-h-56 object-contain"
            />
          ) : (
            <img
              src={cloudUrl || previewUrl}
              alt="Uploaded"
              className="w-full max-h-56 object-cover"
            />
          )}

          {/* Progress overlay */}
          {uploading && (
            <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center space-y-2">
              <Loader className="w-8 h-8 text-white animate-spin" />
              <div className="w-48 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 bg-[#0066cc] rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-white text-xs font-bold">{progress}% uploading to Cloudinary...</span>
            </div>
          )}

          {/* Success badge + remove button */}
          {!uploading && cloudUrl && (
            <div className="absolute top-2 left-2 flex items-center space-x-1.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow">
              <CheckCircle className="w-3 h-3" />
              <span>Saved to Cloudinary</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-md transition-colors"
            title="Remove"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropzone (shown when no file yet) */}
      {!previewUrl && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            dragging
              ? 'border-[#0066cc] bg-blue-50 scale-[1.01]'
              : 'border-slate-300 hover:border-[#0066cc] hover:bg-blue-50/40 bg-slate-50'
          }`}
        >
          <div className="space-y-2 flex flex-col items-center">
            {type === 'video' ? (
              <Video className={`w-10 h-10 ${dragging ? 'text-[#0066cc]' : 'text-slate-400'}`} />
            ) : (
              <ImageIcon className={`w-10 h-10 ${dragging ? 'text-[#0066cc]' : 'text-slate-400'}`} />
            )}

            <div className="text-xs text-slate-600 font-semibold">
              <span className="font-extrabold text-[#0066cc]">Click to browse</span> or drag & drop
            </div>
            <div className="text-[11px] text-slate-400">
              {type === 'video'
                ? 'MP4, WebM, MOV — Max 100MB'
                : 'JPG, PNG, WebP — Max 10MB'
              }
            </div>
            <div className="text-[11px] text-emerald-600 font-bold flex items-center space-x-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Saves directly to Cloudinary cloud storage</span>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={acceptTypes}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
          <div>
            <p>{error}</p>
            <p className="text-[11px] text-red-400 mt-1">
              Make sure your Cloudinary Upload Preset <strong>apna_bazarr_uploads</strong> exists and is set to <strong>Unsigned</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Cloudinary URL display (read-only) */}
      {cloudUrl && !uploading && (
        <div className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[11px] text-slate-500 font-mono break-all">
          ☁️ {cloudUrl}
        </div>
      )}
    </div>
  );
}
