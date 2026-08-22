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

  // Strict guard: if logged in as a normal customer, redirect to homepage
  if (currentUser && currentUser.email !== 'admin@apnabazarr.com') {
    return <Navigate to="/" replace />;
  }

  if (!isAdminAuthenticated && token !== 'apnabazarr_admin_token_2026') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
