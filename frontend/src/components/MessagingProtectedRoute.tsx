import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface MessagingProtectedRouteProps {
  children: React.ReactNode;
}

const MessagingProtectedRoute: React.FC<MessagingProtectedRouteProps> = ({ children }) => {
  const { data: featureFlags, isLoading } = useFeatureFlags();

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  if (!featureFlags?.messagingEnabled) {
    // Redirect to dashboard if messaging is disabled
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default MessagingProtectedRoute;