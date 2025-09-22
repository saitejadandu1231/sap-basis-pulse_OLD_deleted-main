import { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useUnreadMessageCount } from '@/services/messagingHooks';
import { 
  LayoutDashboard, 
  Ticket, 
  MessageSquare, 
  Users, 
  Calendar,
  Settings,
  BarChart3,
  Plus,
  ChevronLeft,
  Bell,
  Search,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
  requiresFeature?: string;
  roles?: string[];
}

const AppLayout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, userRole, signOut } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const { data: unreadCount } = useUnreadMessageCount();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/dashboard'
    },
    {
      id: 'tickets',
      label: 'Support Tickets',
      icon: Ticket,
      href: '/tickets',
      roles: ['customer', 'consultant', 'admin']
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/messages',
      badge: unreadCount,
      requiresFeature: 'messagingEnabled'
    },
    {
      id: 'new-request',
      label: 'New Request',
      icon: Plus,
      href: '/support',
      roles: ['customer']
    },
    {
      id: 'availability',
      label: 'Availability',
      icon: Calendar,
      href: '/consultant/availability',
      roles: ['consultant']
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      href: '/admin/users',
      roles: ['admin']
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/admin/analytics',
      roles: ['admin']
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/admin/settings',
      roles: ['admin']
    }
  ];

  const filteredNavItems = navigationItems.filter(item => {
    // Role-based filtering
    if (item.roles && !item.roles.includes(userRole || '')) {
      return false;
    }
    
    // Feature flag filtering
    if (item.requiresFeature && !featureFlags?.[item.requiresFeature as keyof typeof featureFlags]) {
      return false;
    }
    
    return true;
  });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const userInitials = user?.firstName && user?.lastName 
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'absolute inset-y-0 left-0 z-50 w-64' : 'hidden'}
        lg:relative lg:flex
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yuktor-400 to-yuktor-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Y</span>
                </div>
                <div>
                  <h1 className="font-semibold text-gray-900">Yuktor</h1>
                  <p className="text-xs text-gray-500">SAP BASIS Support</p>
                </div>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex"
            >
              <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href || 
              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
            
            return (
              <button
                key={item.id}
                onClick={() => {
                  navigate(item.href);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive 
                    ? 'bg-yuktor-100 text-yuktor-700 border-yuktor-200' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <>
                    <span className="ml-3">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge > 99 ? '99+' : item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`
                w-full flex items-center p-2 rounded-lg hover:bg-gray-100 transition-colors
                ${sidebarCollapsed ? 'justify-center' : 'justify-start'}
              `}>
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-yuktor-100 text-yuktor-700 text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="ml-3 text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                  </div>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div className="flex items-center space-x-4 max-w-md flex-1">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input 
                    placeholder="Search tickets, messages..." 
                    className="pl-10 bg-gray-50 border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.email}
                </p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;