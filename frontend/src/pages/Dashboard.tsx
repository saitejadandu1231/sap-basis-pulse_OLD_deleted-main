import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PageLayout from "@/components/layout/PageLayout";

const Dashboard = () => {
  const { firstName, lastName, user } = useAuth();
  const navigate = useNavigate();

  // Redirect admin users to admin dashboard
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  // Don't render anything while redirecting
  if (user?.role === 'admin') {
    return null;
  }
  
  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email;
  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <PageLayout
      title={`${greeting()}, ${firstName || 'User'}!`}
      description="Here's what's happening with your SAP BASIS support today."
    >
      <DashboardOverview />
    </PageLayout>
  );
};

export default Dashboard;