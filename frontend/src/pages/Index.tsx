
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboardPath } from "@/hooks/useDashboardPath";
import { useEffect } from "react";

const Index = () => {
  const navigate = useNavigate();
  const dashboardPath = useDashboardPath();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      navigate(dashboardPath);
    } else {
      navigate('/login');
    }
  }, [user, navigate, dashboardPath]);

  return null; // This will briefly show while redirecting
};

export default Index;
