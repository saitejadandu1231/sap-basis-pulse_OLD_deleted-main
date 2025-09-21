
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Settings, LogOut, Users, BarChart3 } from "lucide-react";
import RecentTickets from "@/components/RecentTickets";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, userRole, firstName, lastName, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email;

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-muted/20 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yuktor-400 to-yuktor-600 bg-clip-text text-transparent">
              Yuktor Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">
              Welcome back, {displayName} ({userRole})
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {userRole === 'consultant' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/consultant/availability')}
                className="hover:bg-background/50"
              >
                Manage Availability
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-background/50">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Customer Actions */}
          {userRole === 'customer' && (
            <Card className="glass-card hover:scale-105 transition-transform cursor-pointer" 
                  onClick={() => navigate('/support')}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yuktor-500">
                  <Plus className="w-5 h-5" />
                  <span>New Support Request</span>
                </CardTitle>
                <CardDescription>
                  Create a new SAP BASIS support ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get expert help with SAP RISE, SAP Grow, migrations, and more
                </p>
              </CardContent>
            </Card>
          )}

          {/* Consultant Actions */}
          {userRole === 'consultant' && (
            <Card className="glass-card hover:scale-105 transition-transform">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yuktor-500">
                  <Users className="w-5 h-5" />
                  <span>My Assignments</span>
                </CardTitle>
                <CardDescription>
                  View and manage assigned support tickets
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Work on customer support requests assigned to you
                </p>
              </CardContent>
            </Card>
          )}

          {/* Admin Actions */}
          {userRole === 'admin' && (
            <>
              <Card className="glass-card hover:scale-105 transition-transform cursor-pointer" 
                    onClick={() => navigate('/admin')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yuktor-500">
                    <Settings className="w-5 h-5" />
                    <span>System Management</span>
                  </CardTitle>
                  <CardDescription>
                    Manage users, consultants, and system settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Configure support types, manage user roles, and system settings
                  </p>
                </CardContent>
              </Card>

              <Card className="glass-card hover:scale-105 transition-transform cursor-pointer" 
                    onClick={() => navigate('/admin')}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-yuktor-500">
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics & Reports</span>
                  </CardTitle>
                  <CardDescription>
                    View system analytics and generate reports
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track support metrics, user activity, and system performance
                  </p>
                </CardContent>
              </Card>
            </>
          )}

          {/* Profile Card - All Users */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-yuktor-500">Profile</CardTitle>
              <CardDescription>
                Your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm"><strong>Name:</strong> {displayName}</p>
                <p className="text-sm"><strong>Role:</strong> {userRole}</p>
                <p className="text-sm"><strong>Status:</strong> Active</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentTickets />
          
          {/* Quick Stats */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium capitalize">{userRole}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Account Status:</span>
                  <span className="font-medium text-green-500">Active</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Member Since:</span>
                  <span className="font-medium">
                    {user?.id ? 'Recent' : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
