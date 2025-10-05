import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Plus, Search, Filter, MoreHorizontal, Edit, Trash2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAdminUsers, useCreateUser } from '@/hooks/useAdmin';
import { toast } from 'sonner';

const AdminUsers = () => {
  const { data: users, isLoading, error } = useAdminUsers();
  const { mutate: createUser, isPending: isCreating } = useCreateUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'Customer' as 'Customer' | 'Consultant' | 'Admin'
  });

  // Filter users based on search term, role, and status
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter(user => {
      // Search filter (name or email)
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      const searchMatch = searchTerm === "" || 
        fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Role filter
      const roleMatch = roleFilter === "all" || 
        user.role?.toLowerCase() === roleFilter.toLowerCase();

      // Status filter
      const statusMatch = statusFilter === "all" || 
        user.status?.toLowerCase() === statusFilter.toLowerCase();

      return searchMatch && roleMatch && statusMatch;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const handleCreateUser = () => {
    // Basic validation
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
      toast.error('Please fill in all required fields');
      return;
    }

    createUser(newUser, {
      onSuccess: () => {
        toast.success('User created successfully');
        setCreateUserOpen(false);
        setNewUser({
          email: '',
          password: '',
          firstName: '',
          lastName: '',
          role: 'Customer'
        });
      },
      onError: (error: any) => {
        toast.error(error.message || 'Failed to create user');
      }
    });
  };
  const getRoleBadgeVariant = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'destructive' as const;
      case 'consultant':
        return 'secondary' as const;
      case 'customer':
        return 'outline' as const;
      default:
        return 'outline' as const;
    }
  };

  if (isLoading) {
    return (
      <PageLayout
        title="User Management"
        description="Manage system users, roles, and permissions"
      >
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="User Management"
        description="Manage system users, roles, and permissions"
      >
        <Card>
          <CardContent className="p-6">
            <p className="text-red-500">Error loading users: {error.message}</p>
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const totalUsers = users?.length || 0;
  const filteredTotalUsers = filteredUsers?.length || 0;
  const customerCount = users?.filter(u => u.role.toLowerCase() === 'customer').length || 0;
  const consultantCount = users?.filter(u => u.role.toLowerCase() === 'consultant').length || 0;
  const adminCount = users?.filter(u => u.role.toLowerCase() === 'admin').length || 0;

  return (
    <PageLayout
      title="User Management"
      description="Manage system users, roles, and permissions"
      actions={
        <Dialog open={createUserOpen} onOpenChange={setCreateUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system. They will receive login credentials via email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    placeholder="Enter first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    placeholder="Enter last name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="Enter password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select 
                  value={newUser.role} 
                  onValueChange={(value: 'Customer' | 'Consultant' | 'Admin') => 
                    setNewUser({ ...newUser, role: value })
                  }
                >
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
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setCreateUserOpen(false)}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCreateUser}
                disabled={isCreating}
                className="w-full sm:w-auto"
              >
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-4 sm:space-y-6">
        {/* Filters and Search */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search users by name or email..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Filter className="w-4 h-4" />
                  <span className="ml-2 sm:hidden">Filter</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Users ({filteredTotalUsers}{filteredTotalUsers !== totalUsers ? ` of ${totalUsers}` : ''})
              </div>
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {filteredUsers && filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 transition-colors space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-medium text-sm">
                        {(user.firstName || 'U').charAt(0)}{(user.lastName || 'U').charAt(0)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {user.firstName || 'Unknown'} {user.lastName || 'User'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-4 flex-shrink-0">
                    <div className="flex items-center space-x-2">
                      <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs">
                        {user.role}
                      </Badge>
                      <Badge variant={user.status.toLowerCase() === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {user.status}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-muted-foreground">
                  {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all') 
                    ? 'No users match the current filters' 
                    : 'No users found'
                  }
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold">{customerCount}</div>
              <p className="text-xs text-muted-foreground">Customers</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold">{consultantCount}</div>
              <p className="text-xs text-muted-foreground">Consultants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="text-xl sm:text-2xl font-bold">{adminCount}</div>
              <p className="text-xs text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
};

export default AdminUsers;