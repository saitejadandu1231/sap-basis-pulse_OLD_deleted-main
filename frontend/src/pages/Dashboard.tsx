import { useAuth } from "@/contexts/AuthContext";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import PageLayout from "@/components/layout/PageLayout";

const Dashboard = () => {
  const { firstName, lastName, user } = useAuth();
  
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
      description="Here's what's happening with your Yuktor today."
    >
      <DashboardOverview />
    </PageLayout>
  );
};

export default Dashboard;