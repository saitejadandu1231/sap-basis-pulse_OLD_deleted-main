import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Plus, 
  MessageSquare, 
  Calendar, 
  Ticket,
  Users,
  Settings,
  BarChart3,
  Zap
} from 'lucide-react';

const QuickActions = () => {
  const { userRole } = useAuth();
  const { data: featureFlags } = useFeatureFlags();
  const navigate = useNavigate();

  const getQuickActions = () => {
    const baseActions = [];

    // Role-specific actions
    if (userRole === 'customer') {
      baseActions.push(
        {
          icon: Plus,
          label: 'New Support Request',
          description: 'Create a new SAP BASIS support ticket',
          path: '/support',
          variant: 'default' as const,
          shortcut: 'Ctrl+N'
        },
        {
          icon: Ticket,
          label: 'My Tickets',
          description: 'View your support requests',
          path: '/tickets',
          variant: 'outline' as const
        }
      );
    }

    if (userRole === 'consultant') {
      baseActions.push(
        {
          icon: Calendar,
          label: 'Manage Availability',
          description: 'Set your consultation slots',
          path: '/consultant/availability',
          variant: 'default' as const
        },
        {
          icon: Ticket,
          label: 'Assigned Tickets',
          description: 'View tickets assigned to you',
          path: '/tickets',
          variant: 'outline' as const
        }
      );
    }

    if (userRole === 'admin') {
      baseActions.push(
        {
          icon: Users,
          label: 'Manage Users',
          description: 'Add or modify user accounts',
          path: '/admin/users',
          variant: 'default' as const
        },
        {
          icon: BarChart3,
          label: 'View Analytics',
          description: 'System metrics and reports',
          path: '/admin/analytics',
          variant: 'outline' as const
        },
        {
          icon: Settings,
          label: 'System Settings',
          description: 'Configure feature flags and settings',
          path: '/admin/settings',
          variant: 'outline' as const
        }
      );
    }

    // Common actions
    if (featureFlags?.messagingEnabled) {
      baseActions.push({
        icon: MessageSquare,
        label: 'Open Messages',
        description: 'Start a conversation',
        path: '/messages',
        variant: 'secondary' as const,
        shortcut: 'Ctrl+M'
      });
    }

    return baseActions;
  };

  const actions = getQuickActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-background to-muted/20 border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-semibold">Quick Actions</span>
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Common tasks for your role
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const isPrimary = action.variant === 'default';
            
            return (
              <Card
                key={action.path}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer hover:border-purple-200"
                style={isPrimary ? {
                  background: 'linear-gradient(135deg, rgb(239 246 255) 0%, rgb(243 232 255) 100%) !important',
                  backgroundColor: 'rgb(239 246 255) !important'
                } : {
                  background: 'linear-gradient(135deg, rgb(249 250 251) 0%, rgb(241 245 249) 100%) !important',
                  backgroundColor: 'rgb(249 250 251) !important'
                }}
                onClick={() => navigate(action.path)}
                title={action.shortcut ? `${action.description} (${action.shortcut})` : action.description}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Header with Icon and Title */}
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 ${
                      isPrimary 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-blue-500/30' 
                        : 'bg-gradient-to-r from-slate-500 to-slate-700 text-white shadow-slate-500/30'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold text-base transition-colors ${
                        isPrimary 
                          ? 'text-blue-900 group-hover:text-blue-700' 
                          : 'text-blue-900 group-hover:text-blue-700'
                      }`}>
                        {action.label}
                      </h3>
                      {action.shortcut && (
                        <div className="flex items-center mt-1">
                          <kbd className="text-xs bg-black/10 text-gray-700 px-2 py-1 rounded-md shadow-sm backdrop-blur-sm">
                            {action.shortcut.replace('Ctrl+', '⌘')}
                          </kbd>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {action.description}
                  </p>
                  
                  {/* Action Indicator */}
                  <div className="flex items-center justify-end">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 ${
                      isPrimary 
                        ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200' 
                        : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                    }`}>
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M3.5 2L8.5 6L3.5 10L2.5 9L6.5 6L2.5 3L3.5 2Z" />
                      </svg>
                    </div>
                  </div>
                
                {/* Subtle gradient overlay for depth */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${
                  isPrimary 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                    : 'bg-gradient-to-r from-slate-500 to-slate-700'
                }`} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;