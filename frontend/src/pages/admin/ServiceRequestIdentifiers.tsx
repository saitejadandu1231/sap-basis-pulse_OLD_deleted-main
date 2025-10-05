import React, { useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';
import { ServiceRequestIdentifier } from '@/lib/serviceRequestIdentifierApi';
import { useAdminSrIdentifiers, useCreateSrIdentifier, useUpdateSrIdentifier, useDeleteSrIdentifier } from '@/hooks/useSrIdentifierAdmin';
import PageLayout from '@/components/layout/PageLayout';

const ServiceRequestIdentifiersAdmin = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedIdentifier, setSelectedIdentifier] = useState<ServiceRequestIdentifier | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    identifier: '',
    task: '',
    isActive: true
  });

  // Fetch all SR identifiers
  const { data: srIdentifiers, isLoading, error } = useAdminSrIdentifiers();

  // Mutations
  const createMutation = useCreateSrIdentifier();
  const updateMutation = useUpdateSrIdentifier();
  const deleteMutation = useDeleteSrIdentifier();

  // Handle successful operations
  React.useEffect(() => {
    if (createMutation.isSuccess) {
      toast.success('SR Identifier created successfully');
      setCreateDialogOpen(false);
      resetForm();
      createMutation.reset();
    }
    if (createMutation.isError) {
      toast.error('Failed to create SR Identifier');
    }
  }, [createMutation.isSuccess, createMutation.isError]);

  React.useEffect(() => {
    if (updateMutation.isSuccess) {
      toast.success('SR Identifier updated successfully');
      setEditDialogOpen(false);
      resetForm();
      updateMutation.reset();
    }
    if (updateMutation.isError) {
      toast.error('Failed to update SR Identifier');
    }
  }, [updateMutation.isSuccess, updateMutation.isError]);

  React.useEffect(() => {
    if (deleteMutation.isSuccess) {
      toast.success('SR Identifier deleted successfully');
      setDeleteDialogOpen(false);
      setSelectedIdentifier(null);
      deleteMutation.reset();
    }
    if (deleteMutation.isError) {
      toast.error('Failed to delete SR Identifier');
    }
  }, [deleteMutation.isSuccess, deleteMutation.isError]);

  // Filter identifiers based on search term
  const filteredIdentifiers = srIdentifiers?.filter(identifier =>
    identifier.identifier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    identifier.task.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const resetForm = () => {
    setFormData({
      identifier: '',
      task: '',
      isActive: true
    });
    setSelectedIdentifier(null);
  };

  const handleCreate = () => {
    if (!formData.identifier.trim() || !formData.task.trim()) {
      toast.error('Identifier and Task are required');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (identifier: ServiceRequestIdentifier) => {
    setSelectedIdentifier(identifier);
    setFormData({
      identifier: identifier.identifier,
      task: identifier.task,
      isActive: identifier.isActive
    });
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedIdentifier) return;
    if (!formData.identifier.trim() || !formData.task.trim()) {
      toast.error('Identifier and Task are required');
      return;
    }
    updateMutation.mutate({
      id: selectedIdentifier.id,
      data: formData
    });
  };

  const handleDelete = (identifier: ServiceRequestIdentifier) => {
    setSelectedIdentifier(identifier);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedIdentifier) return;
    deleteMutation.mutate(selectedIdentifier.id);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-red-600">Error loading SR Identifiers</h2>
            <p className="text-muted-foreground mt-2">Please try refreshing the page</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Service Request Identifiers</h1>
            <p className="text-muted-foreground">Manage SR identifiers that customers can select for service requests</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="h-4 w-4 mr-2" />
                Add SR Identifier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New SR Identifier</DialogTitle>
                <DialogDescription>
                  Add a new service request identifier that customers can select.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="identifier">SR Identifier *</Label>
                  <Input
                    id="identifier"
                    placeholder="e.g., SR123456789"
                    value={formData.identifier}
                    onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="task">Task Description *</Label>
                  <Textarea
                    id="task"
                    placeholder="Describe what this SR identifier is for..."
                    value={formData.task}
                    onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive">Active (visible to customers)</Label>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setCreateDialogOpen(false)}
                  disabled={createMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create SR Identifier'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Stats */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>SR Identifiers ({filteredIdentifiers.length})</CardTitle>
                <CardDescription>
                  Total: {srIdentifiers?.length || 0} | 
                  Active: {srIdentifiers?.filter(sr => sr.isActive).length || 0} | 
                  Inactive: {srIdentifiers?.filter(sr => !sr.isActive).length || 0}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search identifiers or tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>Task Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIdentifiers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          {searchTerm ? 'No SR identifiers found matching your search.' : 'No SR identifiers found.'}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIdentifiers.map((identifier) => (
                      <TableRow key={identifier.id}>
                        <TableCell className="font-mono font-medium">
                          {identifier.identifier}
                        </TableCell>
                        <TableCell className="max-w-md">
                          <div className="truncate" title={identifier.task}>
                            {identifier.task}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={identifier.isActive ? "default" : "secondary"}>
                            {identifier.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(identifier.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(identifier.updatedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(identifier)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline" 
                              size="sm"
                              onClick={() => handleDelete(identifier)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Edit SR Identifier</DialogTitle>
              <DialogDescription>
                Update the service request identifier details.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-identifier">SR Identifier *</Label>
                <Input
                  id="edit-identifier"
                  placeholder="e.g., SR123456789"
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-task">Task Description *</Label>
                <Textarea
                  id="edit-task"
                  placeholder="Describe what this SR identifier is for..."
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="edit-isActive">Active (visible to customers)</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditDialogOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update SR Identifier'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete SR Identifier</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this SR identifier? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedIdentifier && (
              <div className="bg-muted p-4 rounded-md">
                <div className="font-mono font-medium">{selectedIdentifier.identifier}</div>
                <div className="text-sm text-muted-foreground mt-1">{selectedIdentifier.task}</div>
              </div>
            )}
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default ServiceRequestIdentifiersAdmin;