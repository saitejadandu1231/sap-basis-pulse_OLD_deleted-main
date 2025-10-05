import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, RotateCcw, Eye, Settings } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import PageLayout from '../components/layout/PageLayout';
import { TicketNumberTemplateForm } from '../components/TicketNumberTemplateForm';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { 
  useTicketNumberTemplates,
  useCreateTicketNumberTemplate,
  useUpdateTicketNumberTemplate,
  useDeleteTicketNumberTemplate,
  useResetSequence
} from '../hooks/useTicketNumberTemplate';
import type { 
  TicketNumberTemplate, 
  CreateTicketNumberTemplate, 
  UpdateTicketNumberTemplate 
} from '../types/ticketNumberTemplate';

export function TicketNumberTemplatesAdmin() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<TicketNumberTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Queries and mutations
  const { data: templates = [], isLoading } = useTicketNumberTemplates();
  const createMutation = useCreateTicketNumberTemplate();
  const updateMutation = useUpdateTicketNumberTemplate(selectedTemplate?.id || '');
  const deleteMutation = useDeleteTicketNumberTemplate();
  const resetSequenceMutation = useResetSequence();

  // Filter templates based on search
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.supportTypeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.supportCategoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.supportSubOptionName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async (data: CreateTicketNumberTemplate) => {
    await createMutation.mutateAsync(data);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = async (data: UpdateTicketNumberTemplate) => {
    if (selectedTemplate) {
      await updateMutation.mutateAsync(data);
      setIsEditDialogOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleResetSequence = async (id: string) => {
    await resetSequenceMutation.mutateAsync(id);
  };

  const handleEdit = (template: TicketNumberTemplate) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const getTemplateScope = (template: TicketNumberTemplate) => {
    const scopes = [];
    if (template.supportTypeName) scopes.push(template.supportTypeName);
    if (template.supportCategoryName) scopes.push(template.supportCategoryName);
    if (template.supportSubOptionName) scopes.push(template.supportSubOptionName);
    return scopes.length > 0 ? scopes.join(' → ') : 'All types';
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading templates...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket Number Templates</h1>
            <p className="text-muted-foreground">
              Configure custom ticket numbering patterns for different support types
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Ticket Number Template</DialogTitle>
                <DialogDescription>
                  Create a new template for generating ticket numbers based on support type, category, and sub-type.
                </DialogDescription>
              </DialogHeader>
              <TicketNumberTemplateForm
                onSubmit={handleCreate}
                onCancel={() => setIsCreateDialogOpen(false)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <Settings className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Templates</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => t.isActive).length}
                  </p>
                </div>
                <Eye className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Default Template</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => t.isDefault).length}
                  </p>
                </div>
                <Badge variant="secondary" className="h-8 w-8 rounded-full p-0 flex items-center justify-center">
                  D
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tickets Generated</p>
                  <p className="text-2xl font-bold">
                    {templates.reduce((sum, t) => sum + t.currentSequence, 0)}
                  </p>
                </div>
                <RotateCcw className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates by name, pattern, or scope..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Templates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Templates ({filteredTemplates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'No templates match your search criteria.' : 'Create your first ticket number template to get started.'}
                </p>
                {!searchQuery && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Template Pattern</TableHead>
                      <TableHead>Scope</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((template) => (
                      <TableRow key={template.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{template.name}</div>
                            {template.description && (
                              <div className="text-sm text-muted-foreground">{template.description}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {template.template}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{getTemplateScope(template)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{template.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant={template.isActive ? 'default' : 'secondary'}>
                              {template.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            {template.isDefault && (
                              <Badge variant="secondary">Default</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono">{template.currentSequence}</span>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={resetSequenceMutation.isPending}
                                >
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Sequence Counter</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will reset the sequence counter for "{template.name}" back to 0. 
                                    Future tickets will start numbering from 1 again. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleResetSequence(template.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    Reset Counter
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(template)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={template.isDefault || deleteMutation.isPending}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Template</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{template.name}"? This action cannot be undone.
                                    {template.isDefault && (
                                      <span className="block mt-2 text-red-600 font-medium">
                                        Default templates cannot be deleted.
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(template.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                    disabled={template.isDefault}
                                  >
                                    Delete Template
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Ticket Number Template</DialogTitle>
              <DialogDescription>
                Update the template configuration and preview the changes.
              </DialogDescription>
            </DialogHeader>
            {selectedTemplate && (
              <TicketNumberTemplateForm
                template={selectedTemplate}
                onSubmit={handleUpdate}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedTemplate(null);
                }}
                isLoading={updateMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}