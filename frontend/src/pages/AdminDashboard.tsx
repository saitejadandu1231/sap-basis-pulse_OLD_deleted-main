import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  BarChart3, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  UserCheck,
  AlertTriangle,
  Ticket,
  Clock,
  CheckCircle,
  MessageSquare,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useNavigate } from 'react-router-dom';
import { 
  useAdminUsers, 
  useAdminSupportRequests, 
  useUpdateUserRole, 
  useCreateUser, 
  useUpdateUser, 
  useDeleteUser 
} from '@/hooks/useAdmin';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { data: featureFlags, refetch: refetchFeatureFlags } = useFeatureFlags();
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

  // API hooks
  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: supportRequests, isLoading: requestsLoading } = useAdminSupportRequests();
  const updateUserRole = useUpdateUserRole();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

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

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await deleteUser.mutateAsync(userId);
      toast.success('User deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete user');
    }
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and monitor system activity</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="font-medium">{user.firstName} {user.lastName}</span>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* Quick Navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/users')}>
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

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/analytics')}>
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
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/admin/settings')}>
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
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-fit">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Support Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
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
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                        <DialogDescription>
                          Add a new user to the system with specified role and permissions.
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
                        <div className="flex gap-2">
                          <Button type="submit" disabled={createUser.isPending}>
                            {createUser.isPending ? 'Creating...' : 'Create User'}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setCreateUserOpen(false)}>
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
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
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
                                disabled={updateUserRole.isPending}
                              >
                                <SelectTrigger className="w-32">
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
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditUser(user)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteUser(user.id, `${user.firstName} ${user.lastName}`)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
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
          <TabsContent value="requests" className="space-y-6">
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
                                request.status === 'InProgress' ? 'default' :
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
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Messaging Feature Toggle */}
                <div className="space-y-4">
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
                </div>

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
                      <Badge 
                        variant={featureFlags?.consultantRegistrationEnabled ? "default" : "secondary"}
                        className="px-3 py-1"
                      >
                        {featureFlags?.consultantRegistrationEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">How to change this setting:</p>
                    <p className="text-sm text-muted-foreground">
                      Update the <code>ConsultantRegistrationEnabled</code> setting in the 
                      <code>appsettings.json</code> configuration file and restart the application.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Current value: <code>Auth:ConsultantRegistrationEnabled = {featureFlags?.consultantRegistrationEnabled ? 'true' : 'false'}</code>
                    </p>
                  </div>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editFirstName">First Name</Label>
                  <Input
                    id="editFirstName"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editLastName">Last Name</Label>
                  <Input
                    id="editLastName"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">Role</Label>
                <Select value={editForm.role} onValueChange={(value: any) => setEditForm(prev => ({ ...prev, role: value }))}>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? 'Updating...' : 'Update User'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditUserOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;