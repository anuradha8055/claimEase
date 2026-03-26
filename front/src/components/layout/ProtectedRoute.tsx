import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { UserRole } from '../../types';

interface ProtectedRouteProps {
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their own dashboard if they try to access unauthorized role page
    const dashboardMap: Record<UserRole, string> = {
      EMPLOYEE: '/employee/dashboard',
      SCRUTINY_OFFICER: '/scrutiny/queue',
      MEDICAL_OFFICER: '/medical/queue',
      FINANCE_OFFICER: '/finance/queue',
      DDO: '/ddo/queue',
    };
    return <Navigate to={dashboardMap[user.role]} replace />;
  }

  return (
    <div className="flex min-h-screen bg-primary-bg">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
