import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import ThemeToggle from '@/components/ThemeToggle';
import { 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu,
  X,
  Bell,
  Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUnreadMessageCount } from '@/services/messagingHooks';
import RoleBasedNav from '../navigation/RoleBasedNav';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface PageLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  showSidebar?: boolean;
  className?: string;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  description,
  actions,
  showSidebar = true,
  className
}) => {
  const { user, userRole, firstName, lastName, signOut } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const { data: unreadCount } = useUnreadMessageCount();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email;

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4">
          {/* Mobile Menu Button */}
          {showSidebar && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden mr-2"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          )}

          {/* Logo */}
          <div className="flex items-center space-x-2 mr-4">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">SP</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold">SAP BASIS Pulse</h1>
              <p className="text-xs text-muted-foreground">{userRole} Portal</p>
            </div>
          </div>

          {/* Search Bar - Desktop only */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <input
                type="text"
                placeholder="Search tickets, messages..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount && unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </div>
              )}
            </Button>

            {/* Messages */}
            {featureFlags?.messagingEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/messages')}
                className="relative"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline-block ml-1">Messages</span>
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2 h-5 px-2">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline-block ml-1">Settings</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            <Separator orientation="vertical" className="h-6" />

            {/* User Menu */}
            <div className="flex items-center space-x-2">
              <div className="hidden sm:block text-right">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
              </div>
              
              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative flex">
        {/* Sidebar */}
        {showSidebar && (
          <>
            {/* Mobile Overlay */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar Content */}
            <aside className={cn(
              "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform border-r bg-background/95 backdrop-blur transition-transform md:translate-x-0",
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
              <div className="p-4 h-full overflow-y-auto">
                <RoleBasedNav />
              </div>
            </aside>
          </>
        )}

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-[calc(100vh-4rem)]",
          showSidebar ? "md:ml-64" : ""
        )}>
          {/* Page Header */}
          {(title || description || actions) && (
            <div className="border-b bg-background/50 backdrop-blur">
              <div className="flex items-center justify-between p-6">
                <div>
                  {title && (
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                  )}
                  {description && (
                    <p className="text-muted-foreground mt-1">{description}</p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center space-x-2">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className={cn("p-6", className)}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;