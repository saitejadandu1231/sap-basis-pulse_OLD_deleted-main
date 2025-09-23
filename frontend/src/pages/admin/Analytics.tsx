import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Ticket, 
  Clock, 
  MessageSquare,
  Download,
  Calendar
} from 'lucide-react';

const AdminAnalytics = () => {
  // Mock data - replace with actual analytics API
  const metrics = {
    totalTickets: 145,
    ticketGrowth: 12.5,
    avgResolutionTime: 2.3,
    resolutionImprovement: -8.2,
    activeUsers: 34,
    userGrowth: 23.1,
    messagesSent: 892,
    messageGrowth: 15.7
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    suffix = '',
    prefix = ''
  }: {
    title: string;
    value: number;
    change: number;
    icon: React.ElementType;
    suffix?: string;
    prefix?: string;
  }) => {
    const isPositive = change > 0;
    const TrendIcon = isPositive ? TrendingUp : TrendingDown;
    
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {prefix}{value}{suffix}
          </div>
          <div className={`flex items-center text-xs ${
            isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <TrendIcon className="w-3 h-3 mr-1" />
            {Math.abs(change)}% from last month
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <PageLayout
      title="Analytics & Reports"
      description="View system metrics, performance data, and generate reports"
      actions={
        <div className="flex space-x-2">
          <Select>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Tickets"
            value={metrics.totalTickets}
            change={metrics.ticketGrowth}
            icon={Ticket}
          />
          <MetricCard
            title="Avg Resolution Time"
            value={metrics.avgResolutionTime}
            change={metrics.resolutionImprovement}
            icon={Clock}
            suffix=" days"
          />
          <MetricCard
            title="Active Users"
            value={metrics.activeUsers}
            change={metrics.userGrowth}
            icon={Users}
          />
          <MetricCard
            title="Messages Sent"
            value={metrics.messagesSent}
            change={metrics.messageGrowth}
            icon={MessageSquare}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ticket Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Trends</CardTitle>
              <CardDescription>
                Support request volume over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Chart placeholder</p>
                  <p className="text-sm text-muted-foreground">Integrate with charting library</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Activity */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Daily active users and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded">
                <div className="text-center">
                  <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Chart placeholder</p>
                  <p className="text-sm text-muted-foreground">Integrate with charting library</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Available Reports</CardTitle>
            <CardDescription>
              Generate detailed reports for various metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">Ticket Performance Report</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed analysis of ticket resolution times, satisfaction scores, and consultant performance
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">User Engagement Report</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  User activity, login patterns, and feature usage statistics
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">System Performance Report</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Platform performance metrics, uptime, and technical statistics
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">Financial Overview</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Revenue tracking, consultant utilization, and cost analysis
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">Customer Satisfaction</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Feedback scores, ratings, and customer sentiment analysis
                </p>
                <Button size="sm" variant="outline">Generate Report</Button>
              </div>
              
              <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <h4 className="font-medium mb-2">Custom Report Builder</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Create custom reports with specific metrics and date ranges
                </p>
                <Button size="sm" variant="outline">Build Report</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity Summary</CardTitle>
            <CardDescription>
              Key events and changes in the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">12 new tickets created</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">3 new users registered</p>
                  <p className="text-xs text-muted-foreground">4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-2 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">System maintenance completed</p>
                  <p className="text-xs text-muted-foreground">6 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default AdminAnalytics;