import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useDashboardPath } from '@/hooks/useDashboardPath';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useNavigate, useLocation } from 'react-router-dom';
import { useUnreadMessageCount } from '@/services/messagingHooks';
import RoleBasedNav from '../navigation/RoleBasedNav';
import { cn } from '@/lib/utils';

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
  const dashboardPath = useDashboardPath();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : user?.email;

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      navigate(`/tickets?search=${encodeURIComponent(debouncedSearchQuery.trim())}`);
    } else if (location.pathname === '/tickets' && debouncedSearchQuery === '') {
      // Only clear search params if we're on tickets page and query is empty
      navigate('/tickets');
    }
  }, [debouncedSearchQuery, navigate, location.pathname]);

  // Clear search query when navigating away from tickets page
  useEffect(() => {
    if (location.pathname !== '/tickets') {
      setSearchQuery('');
      setDebouncedSearchQuery('');
    }
  }, [location.pathname]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/tickets?search=${encodeURIComponent(query.trim())}`);
    } else {
      navigate('/tickets');
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch(searchQuery);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 relative">
      <div className="w-full max-w-[100vw] overflow-x-hidden">
      {/* Header */}
      <header 
        className="fixed top-0 z-[60] w-full border-b bg-background/95 backdrop-blur-sm border-border/40"
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60 }}
      >
        <div className="flex h-16 items-center justify-between px-3 md:px-6">
          {/* Left Section: Menu + Logo */}
          <div className="flex items-center space-x-3">
            {/* Mobile Menu Button */}
            {showSidebar && (
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden p-1.5 flex-shrink-0"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            )}

            {/* Logo - Always Visible */}
            <button
              onClick={() => navigate(dashboardPath)}
              className="hover:opacity-80 transition-opacity flex items-center space-x-2"
            >
              <div className="text-left">
                <h1 className="text-xl md:text-2xl font-bold text-primary tracking-tight">
                  Yuktor
                </h1>
                <p className="text-xs text-muted-foreground hidden sm:block capitalize">
                  {userRole} Portal
                </p>
              </div>
            </button>
          </div>

          {/* Center Section: Search Bar - Desktop only */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search tickets..."
                className="pl-10 pr-10 bg-muted/50 border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center space-x-1">
            {/* Messages */}
            {featureFlags?.messagingEnabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/messages')}
                className="relative p-2"
                title="Messages"
              >
                <MessageSquare className="h-5 w-5" />
                {unreadCount && unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Messages</span>
              </Button>
            )}

            {/* Settings */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/settings')}
              className="p-2"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Avatar with Dropdown */}
            <div className="flex items-center space-x-2 ml-2 pl-2 border-l border-border">
              {/* User Info - Hidden on small screens */}
              <div className="hidden md:block text-right text-sm">
                <p className="font-medium leading-none">{displayName}</p>
                <p className="text-muted-foreground text-xs capitalize mt-1">{userRole}</p>
              </div>

              {/* Avatar */}
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {firstName?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>

              {/* Logout */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="p-2 text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

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
        "min-h-[calc(100vh-4rem)] max-w-full overflow-x-hidden pt-16",
        showSidebar ? "md:ml-64" : ""
      )}>
          {/* Page Header */}
          {(title || description || actions) && (
            <div className="border-b bg-background/50 backdrop-blur">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-2 sm:p-4 md:p-6 max-w-full">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight break-words">{title}</h1>
                  )}
                  {description && (
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base break-words">{description}</p>
                  )}
                </div>
                {actions && (
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Page Content */}
          <div className={cn("p-2 sm:p-4 md:p-6 max-w-full", className)}>
            <div className="w-full mx-auto overflow-x-hidden">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PageLayout;