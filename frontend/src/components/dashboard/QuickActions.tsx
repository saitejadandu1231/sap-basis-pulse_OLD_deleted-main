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
  Layers,
  Zap,
  Sparkles,
  ArrowRight,
  Command,
  Award
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
          variant: 'primary' as const,
          shortcut: '',
          gradient: 'from-emerald-500 to-teal-600',
          hoverGradient: 'from-emerald-600 to-teal-700',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
          textColor: 'text-emerald-900 dark:text-emerald-100'
        },
        {
          icon: Ticket,
          label: 'My Tickets',
          description: 'View your support requests',
          path: '/tickets',
          variant: 'secondary' as const,
          gradient: 'from-blue-500 to-indigo-600',
          hoverGradient: 'from-blue-600 to-indigo-700',
          bgColor: 'bg-blue-50 dark:bg-blue-950/20',
          textColor: 'text-blue-900 dark:text-blue-100'
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
          variant: 'primary' as const,
          gradient: 'from-purple-500 to-violet-600',
          hoverGradient: 'from-purple-600 to-violet-700',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          textColor: 'text-purple-900 dark:text-purple-100'
        },
        {
          icon: Award,
          label: 'Manage Skills',
          description: 'Update your expertise areas',
          path: '/consultant/skills',
          variant: 'secondary' as const,
          gradient: 'from-green-500 to-emerald-600',
          hoverGradient: 'from-green-600 to-emerald-700',
          bgColor: 'bg-green-50 dark:bg-green-950/20',
          textColor: 'text-green-900 dark:text-green-100'
        },
        {
          icon: Ticket,
          label: 'Assigned Tickets',
          description: 'View tickets assigned to you',
          path: '/tickets',
          variant: 'secondary' as const,
          gradient: 'from-orange-500 to-red-600',
          hoverGradient: 'from-orange-600 to-red-700',
          bgColor: 'bg-orange-50 dark:bg-orange-950/20',
          textColor: 'text-orange-900 dark:text-orange-100'
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
          variant: 'primary' as const,
          gradient: 'from-cyan-500 to-blue-600',
          hoverGradient: 'from-cyan-600 to-blue-700',
          bgColor: 'bg-cyan-50 dark:bg-cyan-950/20',
          textColor: 'text-cyan-900 dark:text-cyan-100'
        },
        {
          icon: BarChart3,
          label: 'View Analytics',
          description: 'System metrics and reports',
          path: '/admin/analytics',
          variant: 'secondary' as const,
          gradient: 'from-pink-500 to-rose-600',
          hoverGradient: 'from-pink-600 to-rose-700',
          bgColor: 'bg-pink-50 dark:bg-pink-950/20',
          textColor: 'text-pink-900 dark:text-pink-100'
        },
        {
          icon: Layers,
          label: 'Manage Taxonomy',
          description: 'Configure support types, categories, and sub-options',
          path: '/admin/taxonomy',
          variant: 'tertiary' as const,
          gradient: 'from-purple-500 to-violet-600',
          hoverGradient: 'from-purple-600 to-violet-700',
          bgColor: 'bg-purple-50 dark:bg-purple-950/20',
          textColor: 'text-purple-900 dark:text-purple-100'
        },
        {
          icon: Settings,
          label: 'System Settings',
          description: 'Configure feature flags and settings',
          path: '/admin/settings',
          variant: 'tertiary' as const,
          gradient: 'from-slate-500 to-gray-600',
          hoverGradient: 'from-slate-600 to-gray-700',
          bgColor: 'bg-slate-50 dark:bg-slate-950/20',
          textColor: 'text-slate-900 dark:text-slate-100'
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
        variant: 'tertiary' as const,
        shortcut: '',
        gradient: 'from-amber-500 to-yellow-600',
        hoverGradient: 'from-amber-600 to-yellow-700',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
        textColor: 'text-amber-900 dark:text-amber-100'
      });
    }

    return baseActions;
  };

  const actions = getQuickActions();

  if (actions.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50/30 via-blue-50/20 to-cyan-50/30 dark:from-violet-950/10 dark:via-blue-950/5 dark:to-cyan-950/10 rounded-2xl -m-2" />

      <Card className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-0 shadow-2xl shadow-purple-500/10 rounded-2xl overflow-hidden">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <CardHeader className="relative pb-6 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center shadow-lg shadow-purple-500/30 animate-pulse">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-bounce" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400 mt-1">
                  Common tasks for your role
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative px-8 pb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {actions.map((action, index) => {
              const Icon = action.icon;
              const isPrimary = action.variant === 'primary';

              return (
                <div
                  key={action.path}
                  className="group relative"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Card with glassmorphism effect */}
                  <div
                    className={`relative overflow-hidden rounded-2xl transition-all duration-500 ease-out hover:scale-[1.02] hover:shadow-2xl cursor-pointer border border-white/20 dark:border-gray-700/30 min-h-[200px] flex flex-col ${action.bgColor}`}
                    onClick={() => navigate(action.path)}
                    title={action.shortcut ? `${action.description} (${action.shortcut})` : action.description}
                  >
                    {/* Gradient background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

                    {/* Animated border */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px]`}>
                      <div className="w-full h-full rounded-2xl bg-white dark:bg-gray-900" />
                    </div>

                    <div className="relative p-6 flex flex-col flex-1 space-y-4">
                      {/* Header with Icon and Title */}
                      <div className="flex items-start justify-between">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>

                        {action.shortcut && (
                          <div className="flex items-center space-x-1 opacity-60 group-hover:opacity-100 transition-opacity">
                            <Command className="w-3 h-3" />
                            <span className="text-xs font-medium">{action.shortcut.split('⌘')[1]}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-2 flex-1">
                        <h3 className={`font-bold text-lg ${action.textColor} group-hover:scale-105 transition-transform duration-300`}>
                          {action.label}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                          {action.description}
                        </p>
                      </div>

                      {/* Action indicator */}
                      <div className="flex items-center justify-between pt-2 flex-shrink-0">
                        <div className={`flex items-center space-x-2 text-sm font-medium ${action.textColor} opacity-70 group-hover:opacity-100 transition-opacity`}>
                          <span>Go to action</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>

                        {/* Subtle sparkle effect */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="w-2 h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping" />
                        </div>
                      </div>
                    </div>

                    {/* Hover glow effect */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.hoverGradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 rounded-2xl`} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom decoration */}
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
              <span>Choose an action to get started</span>
              <div className="w-1 h-1 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuickActions;