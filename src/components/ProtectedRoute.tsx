import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import LoadingPage from './BookPulseLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    // Ensure we sync authentication status
    setIsAuthChecked(isAuthenticated || !!localStorage.getItem('username'));
  }, [isAuthenticated]);

  if (!isAuthChecked) return <LoadingPage/>; // Prevent flicker

  return isAuthChecked ? <>{children}</> : <Navigate to="/auth" replace />;
};
