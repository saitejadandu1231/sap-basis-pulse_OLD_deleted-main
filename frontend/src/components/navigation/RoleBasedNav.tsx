import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { 
  Home, 
  MessageSquare, 
  Ticket, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  Plus,
  HelpCircle,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  roles?: string[];
  requiresFeature?: string;
  description?: string;
  badge?: number;
}

interface RoleBasedNavProps {
  className?: string;
  variant?: 'sidebar' | 'breadcrumb' | 'tabs';
  showLabels?: boolean;
  compact?: boolean;
}

const RoleBasedNav: React.FC<RoleBasedNavProps> = ({ 
  className, 
  variant = 'sidebar', 
  showLabels = true,
  compact = false 
}) => {
  const { userRole } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();
  const location = useLocation();

  const allNavItems: NavItem[] = [
    {
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard',
      description: 'Overview and quick actions'
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: '/messages',
      requiresFeature: 'messagingEnabled',
      description: 'Chat with team members'
    },
    {
      icon: Plus,
      label: 'New Request',
      path: '/support',
      roles: ['customer'],
      description: 'Submit a support ticket'
    },
    {
      icon: Ticket,
      label: 'My Tickets',
      path: '/tickets',
      roles: ['customer', 'consultant'],
      description: 'View your support tickets'
    },
    {
      icon: Calendar,
      label: 'Availability',
      path: '/consultant/availability',
      roles: ['consultant'],
      description: 'Manage your schedule'
    },
    {
      icon: Award,
      label: 'My Skills',
      path: '/consultant/skills',
      roles: ['consultant'],
      description: 'Manage your expertise areas'
    },
    {
      icon: Settings,
      label: 'Settings',
      path: '/settings',
      description: 'Account settings and preferences'
    },
    {
      icon: Users,
      label: 'Users',
      path: '/admin/users',
      roles: ['admin'],
      description: 'Manage system users'
    },
    {
      icon: Ticket,
      label: 'All Tickets',
      path: '/tickets',
      roles: ['admin'],
      description: 'View all support requests'
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      path: '/admin/analytics',
      roles: ['admin'],
      description: 'System metrics and reports'
    },
    {
      icon: Settings,
      label: 'Admin Settings',
      path: '/admin/settings',
      roles: ['admin'],
      description: 'System configuration'
    },
    {
      icon: HelpCircle,
      label: 'Help',
      path: '/help',
      description: 'Documentation and support'
    }
  ];

  const filteredNavItems = allNavItems.filter(item => {
    // Check role permissions
    if (item.roles && !item.roles.includes(userRole || '')) {
      return false;
    }

    // Check feature flag requirements
    if (item.requiresFeature && !featureFlags?.[item.requiresFeature]) {
      return false;
    }

    return true;
  });

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (variant === 'breadcrumb') {
    const currentItem = filteredNavItems.find(item => isActive(item.path));
    
    return (
      <nav className={cn("flex items-center space-x-2 text-sm", className)}>
        <Button
          variant="ghost" 
          size="sm"
          onClick={() => navigate('/dashboard')}
          className="text-muted-foreground hover:text-foreground"
        >
          <Home className="w-4 h-4" />
          {showLabels && <span className="ml-1">Home</span>}
        </Button>
        {currentItem && currentItem.path !== '/dashboard' && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium">{currentItem.label}</span>
          </>
        )}
      </nav>
    );
  }

  if (variant === 'tabs') {
    return (
      <nav className={cn("flex space-x-1 border-b", className)}>
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Button
              key={item.path}
              variant="ghost"
              size="sm"
              onClick={() => handleNavigation(item.path)}
              className={cn(
                "border-b-2 border-transparent rounded-none px-4 py-2",
                active && "border-primary text-primary bg-primary/5"
              )}
            >
              <Icon className="w-4 h-4" />
              {showLabels && <span className="ml-2">{item.label}</span>}
            </Button>
          );
        })}
      </nav>
    );
  }

  // Default sidebar variant
  return (
    <nav className={cn("space-y-1", className)}>
      {filteredNavItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.path);

        return (
          <Button
            key={item.path}
            variant={active ? "secondary" : "ghost"}
            size={compact ? "sm" : "default"}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "w-full justify-start",
              active && "bg-secondary text-secondary-foreground",
              compact && "px-2"
            )}
            title={item.description}
          >
            <Icon className={cn("w-4 h-4", showLabels && !compact && "mr-2")} />
            {showLabels && !compact && <span>{item.label}</span>}
            {item.badge && item.badge > 0 && (
              <div className="ml-auto bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                {item.badge > 99 ? '99+' : item.badge}
              </div>
            )}
          </Button>
        );
      })}
    </nav>
  );
};

export default RoleBasedNav;