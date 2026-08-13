/**
 * cloudinaryService.js
 * Handles all direct Cloudinary uploads from the frontend
 * using UNSIGNED upload presets — API Secret is NEVER used here.
 *
 * Flow: file → FormData → Cloudinary Upload API → secure_url returned
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dnqvijzxj';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'apna_bazarr_uploads';

const BASE_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}`;

/**
 * Upload an image file to Cloudinary (unsigned)
 * @param {File} file - The image File object
 * @param {string} folder - Cloudinary folder path (e.g., 'apna-bazarr/products')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadImage(file, folder = 'apna-bazarr/products', onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/image/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          width: data.width,
          height: data.height,
          format: data.format,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Image upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during image upload'));
    xhr.send(formData);
  });
}

/**
 * Upload a video file to Cloudinary (unsigned)
 * @param {File} file - The video File object
 * @param {string} folder - Cloudinary folder path (e.g., 'apna-bazarr/product-videos')
 * @param {function} onProgress - Optional progress callback (0-100)
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadVideo(file, folder = 'apna-bazarr/product-videos', onProgress = null) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/video/upload`);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        resolve({
          url: data.secure_url,
          publicId: data.public_id,
          duration: data.duration,
          format: data.format,
        });
      } else {
        const err = JSON.parse(xhr.responseText);
        reject(new Error(err?.error?.message || 'Video upload failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during video upload'));
    xhr.send(formData);
  });
}
