// Admin API helpers: base URL, admin token (cookie) and the Cloudinary upload route.
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return '';
};

export const getToken = () => getCookie('apna_admin_token');

// Headers with the admin token (and JSON content type when `json` is true)
export function adminHeaders(json = false) {
  const headers = {};
  if (json) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// Product uploads are admin/seller-only on the server: send the admin token
export async function uploadToCloudinary(file, endpoint = 'product-image') {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${BASE_URL}/api/upload/${endpoint}`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: adminHeaders(),
  });
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Upload failed');
    return data.url;
  }
  const text = await res.text();
  throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 150)}`);
}
