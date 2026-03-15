import { Navigate } from 'react-router';
import { useAuth } from '../lib/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: 'farmer' | 'buyer';
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[var(--primary-800)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check user type if specified
  if (requiredUserType && user.user_type !== requiredUserType) {
    // Redirect to their correct dashboard
    const correctPath = user.user_type === 'farmer' ? '/farmer/dashboard' : '/buyer/dashboard';
    return <Navigate to={correctPath} replace />;
  }

  // User is authenticated and has correct type
  return <>{children}</>;
}
