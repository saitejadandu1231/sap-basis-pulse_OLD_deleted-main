import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';

const DashboardRouter = () => {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect admins to admin dashboard
    if (userRole === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [userRole, navigate]);

  // If not admin, show regular dashboard
  if (userRole === 'admin') {
    return null; // Will redirect in useEffect
  }

  return <Dashboard />;
};

export default DashboardRouter;