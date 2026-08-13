import React from 'react';
import { Navigate } from 'react-router-dom';

export default function ProtectedAdminRoute({ children, isAdminAuthenticated, currentUser }) {
  const token = localStorage.getItem('apna_admin_token');

  // Strict guard: if logged in as a normal customer, redirect to homepage
  if (currentUser && currentUser.email !== 'admin@apnabazarr.com') {
    return <Navigate to="/" replace />;
  }

  if (!isAdminAuthenticated && !token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
