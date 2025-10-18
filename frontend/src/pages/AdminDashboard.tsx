import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  UserCheck,
  UserX,
  PlayCircle,
  PauseCircle,
  AlertTriangle,
  Ticket,
  Clock,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  ExternalLink,
  FileText,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useSystemSetting, useUpdateSystemSetting } from '@/hooks/useSystemSettings';
import { useNavigate } from 'react-router-dom';
import { 
  useAdminUsers, 
  useAdminSupportRequests, 
  useUpdateUserRole, 
  useCreateUser, 
  useUpdateUser, 
  useUpdateUserStatus
} from '@/hooks/useAdmin';
import { toast } from 'sonner';
import PageLayout from '@/components/layout/PageLayout';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: featureFlags, refetch: refetchFeatureFlags } = useFeatureFlags();
  const { data: consultantRegistrationSetting } = useSystemSetting('ConsultantRegistrationEnabled');
  const updateSystemSetting = useUpdateSystemSetting();
  const navigate = useNavigate();
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form states
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Customer' as 'Customer' | 'Consultant' | 'Admin'
  });
  
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    role: 'Customer' as 'Customer' | 'Consultant' | 'Admin'
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    userName: '',
    action: '' as 'activate' | 'deactivate',
    onConfirm: () => {}
  });

  // API hooks
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: supportRequests, isLoading: requestsLoading } = useAdminSupportRequests();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const updateUserStatus = useUpdateUserStatus();

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Statistics calculations
  const totalUsers = users?.length || 0;
  const totalConsultants = users?.filter(u => u.role === 'Consultant').length || 0;
  const totalCustomers = users?.filter(u => u.role === 'Customer').length || 0;
  const totalRequests = supportRequests?.length || 0;
  const openRequests = supportRequests?.filter(r => r.status !== 'Closed' && r.status !== 'TopicClosed').length || 0;
  const closedRequests = supportRequests?.filter(r => r.status === 'Closed' || r.status === 'TopicClosed').length || 0;

  // Platform earnings calculations
  const completedRequestsWithEarnings = supportRequests?.filter(r => 
    (r.status === 'Closed' || r.status === 'TopicClosed') && r.calculatedAmount
  ) || [];
  const totalPlatformEarnings = completedRequestsWithEarnings.reduce((sum, request) => 
    sum + (request.calculatedAmount || 0), 0
  );
  const totalWorkHours = completedRequestsWithEarnings.reduce((sum, request) => 
    sum + (request.hoursWorked || 0), 0
  );

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    try {
      await updateUserRole.mutateAsync({ userId, role: newRole });
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser.mutateAsync(createForm);
      toast.success('User created successfully');
      setCreateUserOpen(false);
      setCreateForm({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'Customer'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    try {
      await updateUser.mutateAsync({
        userId: editingUser.id,
        ...editForm
      });
      toast.success('User updated successfully');
      setEditUserOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = async (userId: string, userName: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const action = newStatus === 'Active' ? 'activate' : 'deactivate';
    
    setConfirmDialog({
      isOpen: true,
      title: `${action === 'activate' ? 'Activate' : 'Deactivate'} User`,
      message: `Are you sure you want to ${action} this user? This will ${action === 'activate' ? 'restore their access to the system' : 'remove their access to the system'}.`,
      userName: userName,
      action: action,
      onConfirm: async () => {
        try {
          await updateUserStatus.mutateAsync({ userId, status: newStatus });
          toast.success(`User ${action}d successfully`);
        } catch (error: any) {
          toast.error(error.message || `Failed to ${action} user`);
        }
      }
    });
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role
    });
    setEditUserOpen(true);
  };

  return (
    <PageLayout
      title="Admin Dashboard"
      description="Manage users and monitor system activity"
    >
      <div className="space-y-4 sm:space-y-6 w-full max-w-full overflow-x-hidden">

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 w-full max-w-full">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Consultants</p>
                  <p className="text-3xl font-bold">{totalConsultants}</p>
                </div>
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Support Requests</p>
                  <p className="text-3xl font-bold">{totalRequests}</p>
                </div>
                <Ticket className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Open Requests</p>
                  <p className="text-3xl font-bold">{openRequests}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Earnings Summary */}
        {/* {totalPlatformEarnings > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span>Platform Earnings Overview</span>
              </CardTitle>
              <CardDescription>
                Revenue and work statistics from completed consultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200">Total Revenue</span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">₹{totalPlatformEarnings.toFixed(2)}</p>
                  <p className="text-xs text-green-600 mt-1">
                    From {completedRequestsWithEarnings.length} completed consultations
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-800 dark:text-blue-200">Total Hours</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{totalWorkHours.toFixed(1)}</p>
                  <p className="text-xs text-blue-600 mt-1">Hours of consultation delivered</p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <span className="font-medium text-purple-800 dark:text-purple-200">Avg per Hour</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">
                    ₹{totalWorkHours > 0 ? (totalPlatformEarnings / totalWorkHours).toFixed(2) : '0.00'}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Average hourly rate</p>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-yellow-800 dark:text-yellow-200">Completion Rate</span>
                  </div>
                  <p className="text-2xl font-bold text-yellow-600">
                    {totalRequests > 0 ? Math.round((completedRequestsWithEarnings.length / totalRequests) * 100) : 0}%
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">Tickets with work completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 max-w-full">
          <Card className="hover:shadow-md transition-shadow cursor-pointer max-w-full" onClick={() => navigate('/admin/users')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  User Management
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive user management with advanced filtering and bulk operations
              </p>
            </CardContent>
          </Card>

          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/analytics')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Analytics & Reports
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Detailed analytics dashboard with metrics, charts, and exportable reports
              </p>
            </CardContent>
          </Card> */}

          {/* <Card className="hover:shadow-md transition-shadow cursor-pointer max-w-full" onClick={() => navigate('/admin/settings')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  System Settings
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure feature flags, security settings, and system-wide preferences
              </p>
            </CardContent>
          </Card> */}

          <Card className="hover:shadow-md transition-shadow cursor-pointer max-w-full" onClick={() => navigate('/admin/taxonomy')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Support Taxonomy
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage support types, categories, and sub-options used in support requests
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer max-w-full" onClick={() => navigate('/admin/sr-identifiers')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  SR Identifiers
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Manage service request identifiers that customers can select during ticket creation
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer max-w-full" onClick={() => navigate('/admin/ticket-number-templates')}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  Ticket Number Templates
                </div>
                <ExternalLink className="w-4 h-4" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure custom ticket numbering patterns for different support types and categories
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:w-fit md:grid-cols-3">
            <TabsTrigger value="users" className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]">
              <Users className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Users</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]">
              <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-3 text-xs sm:text-sm min-h-[40px] sm:min-h-[44px]">
              <Settings className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">Settings</span>
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>User Management</CardTitle>
                  <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Create User
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-[95vw] sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system with specified role and permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              value={createForm.firstName}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              value={createForm.lastName}
                              onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={createForm.email}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input
                            id="password"
                            type="password"
                            value={createForm.password}
                            onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select value={createForm.role} onValueChange={(value: any) => setCreateForm(prev => ({ ...prev, role: value }))}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Customer">Customer</SelectItem>
                              <SelectItem value="Consultant">Consultant</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button type="submit" disabled={createUser.isPending} className="w-full sm:w-auto">
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)} className="w-full sm:w-auto">
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[120px]">Name</TableHead>
                          <TableHead className="min-w-[200px]">Email</TableHead>
                          <TableHead className="min-w-[100px]">Role</TableHead>
                          <TableHead className="min-w-[80px]">Status</TableHead>
                          <TableHead className="min-w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">
                              {user.firstName} {user.lastName}
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Select
                                value={user.role}
                                onValueChange={(value) => handleRoleUpdate(user.id, value)}
                                disabled={true}
                              >
                                <SelectTrigger className="w-28 sm:w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Customer">Customer</SelectItem>
                                  <SelectItem value="Consultant">Consultant</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                                {user.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditUser(user)}
                                  className="p-2"
                                >
                                  <Edit className="w-4 h-4" />
                                  <span className="sr-only">Edit user</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleUserStatus(user.id, `${user.firstName} ${user.lastName}`, user.status)}
                                  className={user.status === 'Active' ? 'text-orange-600 hover:text-orange-700 p-2' : 'text-green-600 hover:text-green-700 p-2'}
                                  disabled={updateUserStatus.isPending}
                                >
                                  {user.status === 'Active' ? (
                                    <>
                                      <PauseCircle className="w-4 h-4" />
                                      <span className="sr-only">Deactivate user</span>
                                    </>
                                  ) : (
                                    <>
                                      <PlayCircle className="w-4 h-4" />
                                      <span className="sr-only">Activate user</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Requests Tab */}
          {/* <TabsContent value="requests" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Support Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div className="text-center py-8">Loading support requests...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Consultant</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {supportRequests?.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium">
                              {request.orderNumber}
                            </TableCell>
                            <TableCell>{request.supportTypeName}</TableCell>
                            <TableCell>{request.createdByName}</TableCell>
                            <TableCell>{request.consultantName || 'Unassigned'}</TableCell>
                            <TableCell>
                              <Badge variant={
                                request.status === 'Closed' || request.status === 'TopicClosed' ? 'outline' :
                                request.status === 'In Progress' ? 'default' :
                                request.status === 'New' ? 'secondary' : 'secondary'
                              }>
                                {request.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(request.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">User Distribution</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Customers</span>
                        <span className="font-medium">{totalCustomers}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Consultants</span>
                        <span className="font-medium">{totalConsultants}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Admins</span>
                        <span className="font-medium">{users?.filter(u => u.role === 'Admin').length || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">Request Status</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Open</span>
                        <span className="font-medium">{openRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Closed</span>
                        <span className="font-medium">{closedRequests}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="font-medium">{totalRequests}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold">System Health</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">All Systems Operational</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Messaging Feature Toggle */}
                {/* <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Messaging System</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Enable or disable the messaging functionality for all users
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={featureFlags?.messagingEnabled ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {featureFlags?.messagingEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {featureFlags?.messagingEnabled ? (
                      <>
                        <p>✓ Users can start conversations from support tickets</p>
                        <p>✓ Messaging page is accessible</p>
                        <p>✓ Message notifications are active</p>
                      </>
                    ) : (
                      <>
                        <p>✗ Conversation buttons are hidden</p>
                        <p>✗ Messaging page shows disabled message</p>
                        <p>✗ API endpoints return disabled error</p>
                      </>
                    )}
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">How to change this setting:</p>
                    <p className="text-sm text-muted-foreground">
                      Currently, messaging can be enabled/disabled by updating the <code>MessagingEnabled</code> 
                      setting in the <code>appsettings.json</code> configuration file and restarting the application.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Current value: <code>Auth:MessagingEnabled = {featureFlags?.messagingEnabled ? 'true' : 'false'}</code>
                    </p>
                  </div>
                </div> */}

                {/* Consultant Registration Feature Toggle */}
                <div className="space-y-4 pt-6 border-t">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">Consultant Registration</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Allow new consultant registrations through the public registration form
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={consultantRegistrationSetting?.value === 'true'}
                        onCheckedChange={async (checked) => {
                          try {
                            await updateSystemSetting.mutateAsync({
                              key: 'ConsultantRegistrationEnabled',
                              value: checked.toString()
                            });
                            toast.success(`Consultant registration ${checked ? 'enabled' : 'disabled'}`);
                          } catch (error) {
                            toast.error('Failed to update setting');
                          }
                        }}
                        disabled={updateSystemSetting.isPending}
                      />
                      <Badge 
                        variant={consultantRegistrationSetting?.value === 'true' ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {consultantRegistrationSetting?.value === 'true' ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {consultantRegistrationSetting?.value === 'true' ? (
                      <>
                        <p>✓ New consultants can register through the public form</p>
                        <p>✓ Registration endpoints are active</p>
                        <p>✓ Account creation for consultant role is allowed</p>
                      </>
                    ) : (
                      <>
                        <p>✗ Consultant registration is blocked</p>
                        <p>✗ Registration attempts will be rejected</p>
                        <p>✗ Only admin can create consultant accounts</p>
                      </>
                    )}
                  </div>
                  {consultantRegistrationSetting && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Setting details:</p>
                      <p className="text-sm text-muted-foreground">
                        Key: <code>{consultantRegistrationSetting.key}</code>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current value: <code>{consultantRegistrationSetting.value}</code>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Last updated: {new Date(consultantRegistrationSetting.updatedAt).toLocaleString()}
                      </p>
                      {consultantRegistrationSetting.updatedBy && (
                        <p className="text-sm text-muted-foreground">
                          Updated by: {consultantRegistrationSetting.updatedBy}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Refresh Feature Flags */}
                <div className="pt-6 border-t">
                  <Button 
                    onClick={() => {
                      refetchFeatureFlags();
                      toast.success('Feature flags refreshed');
                    }}
                    variant="outline"
                  >
                    Refresh Settings
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Click to reload the current feature flag values from the server
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit User Dialog */}
        <Dialog open={editUserOpen} onOpenChange={setEditUserOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    disabled
                  />
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Name changes are currently disabled. Contact support if you need to update user names.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select value={editForm.role} onValueChange={(value: any) => setEditForm(prev => ({ ...prev, role: value }))} disabled={true}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Consultant">Consultant</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-950/30 dark:border-blue-800 mb-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> Role changes are currently disabled for security reasons. Contact support if you need to update user roles.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button type="submit" disabled={updateUser.isPending} className="w-full sm:w-auto">
                  {updateUser.isPending ? 'Updating...' : 'Update User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          userName={confirmDialog.userName}
          action={confirmDialog.action}
          variant={confirmDialog.action}
          confirmLabel={confirmDialog.action === 'activate' ? 'Activate User' : 'Deactivate User'}
          cancelLabel="Cancel"
        />
      </div>
    </PageLayout>
  );
};

export default AdminDashboard;