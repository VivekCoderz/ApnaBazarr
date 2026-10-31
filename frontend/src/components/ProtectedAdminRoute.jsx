import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedAdminRoute({ children, isAdminAuthenticated, currentUser }) {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return '';
  };
  const token = getCookie('apna_admin_token');

  // Admin token decides access (the backend verifies it on every admin API call).
  // Being logged in to a customer account at the same time must not lock the admin out.
  if (!isAdminAuthenticated && !token) {
    return <Navigate to={currentUser ? '/' : '/admin/login'} replace />;
  }

  return children;
}
