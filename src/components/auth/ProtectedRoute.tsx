import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika allowedRoles didefinisikan, cek apakah role user ada di dalamnya
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redireksi cerdas: User kiosk yang tersesat dikembalikan ke /kiosk
    if (user.role === 'kiosk') {
      return <Navigate to="/kiosk" replace />;
    }
    // Admin/Superadmin yang tersesat (misal rute superadmin-only) dikembalikan ke dashboard
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
};
