import { useAuth } from '@/contexts/AuthContext';

export const useDashboardPath = () => {
  const { userRole } = useAuth();
  
  return userRole === 'admin' ? '/admin' : '/dashboard';
};

export const getDashboardPath = (userRole?: string) => {
  return userRole === 'admin' ? '/admin' : '/dashboard';
};