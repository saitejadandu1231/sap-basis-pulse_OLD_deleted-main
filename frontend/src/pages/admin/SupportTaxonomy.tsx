import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  FileText,
  Layers,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  useAdminSupportTypes,
  useCreateSupportType,
  useUpdateSupportType,
  useDeleteSupportType,
  useAdminSupportCategories,
  useCreateSupportCategory,
  useUpdateSupportCategory,
  useDeleteSupportCategory,
  useAdminSupportSubOptions,
  useCreateSupportSubOption,
  useUpdateSupportSubOption,
  useDeleteSupportSubOption
} from '@/hooks/useSupport';

// API response interfaces
interface SupportType {
  id: string;
  name: string;
  description: string | null;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string | null;
  supportTypeId: string;
}

interface SupportSubOption {
  id: string;
  name: string;
  description: string | null;
  supportTypeId: string;
  requiresSrIdentifier: boolean;
}

const SupportTaxonomyAdmin = () => {
  // API hooks
  const { data: supportTypes = [], isLoading: typesLoading } = useAdminSupportTypes();
  const { data: supportCategories = [], isLoading: categoriesLoading } = useAdminSupportCategories();
  const { data: supportSubOptions = [], isLoading: subOptionsLoading } = useAdminSupportSubOptions();

  // Mutations
  const createTypeMutation = useCreateSupportType();
  const updateTypeMutation = useUpdateSupportType();
  const deleteTypeMutation = useDeleteSupportType();

  const createCategoryMutation = useCreateSupportCategory();
  const updateCategoryMutation = useUpdateSupportCategory();
  const deleteCategoryMutation = useDeleteSupportCategory();

  const createSubOptionMutation = useCreateSupportSubOption();
  const updateSubOptionMutation = useUpdateSupportSubOption();
  const deleteSubOptionMutation = useDeleteSupportSubOption();

  // Dialog states
  const [createTypeOpen, setCreateTypeOpen] = useState(false);
  const [createCategoryOpen, setCreateCategoryOpen] = useState(false);
  const [createSubOptionOpen, setCreateSubOptionOpen] = useState(false);
  const [editTypeOpen, setEditTypeOpen] = useState(false);
  const [editCategoryOpen, setEditCategoryOpen] = useState(false);
  const [editSubOptionOpen, setEditSubOptionOpen] = useState(false);

  // Form states
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    supportTypeId: '',
    requiresSrIdentifier: false
  });

  const [editingItem, setEditingItem] = useState<any>(null);

  const resetForm = () => {
    setFormData({ name: '', description: '', supportTypeId: '', requiresSrIdentifier: false });
    setEditingItem(null);
  };

  const handleCreateType = async () => {
    if (!formData.name.trim()) return;

    try {
      await createTypeMutation.mutateAsync({
        name: formData.name,
        description: formData.description
      });
      setCreateTypeOpen(false);
      resetForm();
      toast.success('Support type created successfully');
    } catch (error) {
      toast.error('Failed to create support type');
    }
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim() || !formData.supportTypeId) return;

    try {
      await createCategoryMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        supportTypeId: formData.supportTypeId
      });
      setCreateCategoryOpen(false);
      resetForm();
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleCreateSubOption = async () => {
    if (!formData.name.trim() || !formData.supportTypeId) return;

    try {
      await createSubOptionMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        supportTypeId: formData.supportTypeId,
        requiresSrIdentifier: formData.requiresSrIdentifier
      });
      setCreateSubOptionOpen(false);
      resetForm();
      toast.success('Sub-option created successfully');
    } catch (error) {
      toast.error('Failed to create sub-option');
    }
  };

  const handleEditType = async () => {
    if (!editingItem || !formData.name.trim()) return;

    try {
      await updateTypeMutation.mutateAsync({
        id: editingItem.id,
        name: formData.name,
        description: formData.description
      });
      setEditTypeOpen(false);
      resetForm();
      toast.success('Support type updated successfully');
    } catch (error) {
      toast.error('Failed to update support type');
    }
  };

  const handleEditCategory = async () => {
    if (!editingItem || !formData.name.trim() || !formData.supportTypeId) return;

    try {
      await updateCategoryMutation.mutateAsync({
        id: editingItem.id,
        name: formData.name,
        description: formData.description,
        supportTypeId: formData.supportTypeId
      });
      setEditCategoryOpen(false);
      resetForm();
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleEditSubOption = async () => {
    if (!editingItem || !formData.name.trim() || !formData.supportTypeId) return;

    try {
      await updateSubOptionMutation.mutateAsync({
        id: editingItem.id,
        name: formData.name,
        description: formData.description,
        supportTypeId: formData.supportTypeId,
        requiresSrIdentifier: formData.requiresSrIdentifier
      });
      setEditSubOptionOpen(false);
      resetForm();
      toast.success('Sub-option updated successfully');
    } catch (error) {
      toast.error('Failed to update sub-option');
    }
  };

  const handleDeleteType = async (typeId: string) => {
    try {
      await deleteTypeMutation.mutateAsync(typeId);
      toast.success('Support type deleted successfully');
    } catch (error) {
      toast.error('Failed to delete support type');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleDeleteSubOption = async (subOptionId: string) => {
    try {
      await deleteSubOptionMutation.mutateAsync(subOptionId);
      toast.success('Sub-option deleted successfully');
    } catch (error) {
      toast.error('Failed to delete sub-option');
    }
  };

  const openEditTypeDialog = (type: SupportType) => {
    setEditingItem(type);
    setFormData({
      name: type.name,
      description: type.description || '',
      supportTypeId: '',
      requiresSrIdentifier: false
    });
    setEditTypeOpen(true);
  };

  const openEditCategoryDialog = (category: SupportCategory) => {
    setEditingItem(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      supportTypeId: category.supportTypeId,
      requiresSrIdentifier: false
    });
    setEditCategoryOpen(true);
  };

  const openEditSubOptionDialog = (subOption: SupportSubOption) => {
    setEditingItem(subOption);
    setFormData({
      name: subOption.name,
      description: subOption.description || '',
      supportTypeId: subOption.supportTypeId,
      requiresSrIdentifier: subOption.requiresSrIdentifier
    });
    setEditSubOptionOpen(true);
  };

  const getCategoriesForType = (typeId: string) => {
    return supportCategories.filter(cat => cat.supportTypeId === typeId);
  };

  const getSubOptionsForType = (typeId: string) => {
    return supportSubOptions.filter(sub => sub.supportTypeId === typeId);
  };

  return (
    <PageLayout
      title="Support Taxonomy Management"
      description="Manage support types, categories, and sub-options for the support request system"
      actions={
        <div className="flex space-x-2">
          <Dialog open={createTypeOpen} onOpenChange={setCreateTypeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Support Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Type</DialogTitle>
                <DialogDescription>
                  Add a new support type that users can select when creating support requests.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="typeName">Support Type Name</Label>
                  <Input
                    id="typeName"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Technical Support"
                  />
                </div>
                <div>
                  <Label htmlFor="typeDescription">Description (Optional)</Label>
                  <Input
                    id="typeDescription"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the support type"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setCreateTypeOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateType}
                    disabled={createTypeMutation.isPending}
                  >
                    {createTypeMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <Tabs defaultValue="types" className="space-y-6">
        <TabsList>
          <TabsTrigger value="types">Support Types</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="suboptions">Sub-options</TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Support Types ({supportTypes.length})
              </CardTitle>
              <CardDescription>
                Main categories of support that users can request
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {supportTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{type.name}</h4>
                        {type.description && (
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {getCategoriesForType(type.id).length} categories, {getSubOptionsForType(type.id).length} sub-options
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditTypeDialog(type)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDeleteType(type.id)}
                            disabled={deleteTypeMutation.isPending}
                          >
                            {deleteTypeMutation.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4 mr-2" />
                            )}
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                  {supportTypes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No support types found. Create your first support type to get started.
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Categories</h3>
              <p className="text-sm text-muted-foreground">
                Sub-categories within each support type
              </p>
            </div>
            <Dialog open={createCategoryOpen} onOpenChange={setCreateCategoryOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Category</DialogTitle>
                  <DialogDescription>
                    Add a new category under a specific support type.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="categoryName">Category Name</Label>
                    <Input
                      id="categoryName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., System Issues"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryDescription">Description (Optional)</Label>
                    <Input
                      id="categoryDescription"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the category"
                    />
                  </div>
                  <div>
                    <Label htmlFor="categoryType">Support Type</Label>
                    <Select
                      value={formData.supportTypeId}
                      onValueChange={(value) => setFormData({ ...formData, supportTypeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select support type" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateCategoryOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCategory}
                      disabled={createCategoryMutation.isPending}
                    >
                      {createCategoryMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            supportTypes.map((type) => {
              const typeCategories = getCategoriesForType(type.id);
              return (
                <Card key={type.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      {type.name} Categories ({typeCategories.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {typeCategories.map((category) => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{category.name}</span>
                            {category.description && (
                              <p className="text-sm text-muted-foreground">{category.description}</p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditCategoryDialog(category)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteCategory(category.id)}
                                disabled={deleteCategoryMutation.isPending}
                              >
                                {deleteCategoryMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      {typeCategories.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No categories defined for this support type
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="suboptions" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Sub-options</h3>
              <p className="text-sm text-muted-foreground">
                Specific options within each support type
              </p>
            </div>
            <Dialog open={createSubOptionOpen} onOpenChange={setCreateSubOptionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sub-option
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Sub-option</DialogTitle>
                  <DialogDescription>
                    Add a new sub-option under a specific support type.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="subOptionName">Sub-option Name</Label>
                    <Input
                      id="subOptionName"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., SAP BASIS"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subOptionDescription">Description (Optional)</Label>
                    <Input
                      id="subOptionDescription"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description of the sub-option"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subOptionType">Support Type</Label>
                    <Select
                      value={formData.supportTypeId}
                      onValueChange={(value) => setFormData({ ...formData, supportTypeId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select support type" />
                      </SelectTrigger>
                      <SelectContent>
                        {supportTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresSr"
                      checked={formData.requiresSrIdentifier}
                      onCheckedChange={(checked) => setFormData({ ...formData, requiresSrIdentifier: checked })}
                    />
                    <Label htmlFor="requiresSr">Requires Service Request Identifier</Label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setCreateSubOptionOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateSubOption}
                      disabled={createSubOptionMutation.isPending}
                    >
                      {createSubOptionMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4 mr-2" />
                      )}
                      Create
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {subOptionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            supportTypes.map((type) => {
              const typeSubOptions = getSubOptionsForType(type.id);
              return (
                <Card key={type.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Layers className="w-5 h-5 mr-2" />
                      {type.name} Sub-options ({typeSubOptions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {typeSubOptions.map((subOption) => (
                        <div key={subOption.id} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <div className="flex items-center space-x-3">
                              <span className="font-medium">{subOption.name}</span>
                              {subOption.requiresSrIdentifier && (
                                <Badge variant="secondary">Requires SR ID</Badge>
                              )}
                            </div>
                            {subOption.description && (
                              <p className="text-sm text-muted-foreground">{subOption.description}</p>
                            )}
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditSubOptionDialog(subOption)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeleteSubOption(subOption.id)}
                                disabled={deleteSubOptionMutation.isPending}
                              >
                                {deleteSubOptionMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      ))}
                      {typeSubOptions.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No sub-options defined for this support type
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Dialogs */}
      <Dialog open={editTypeOpen} onOpenChange={setEditTypeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Support Type</DialogTitle>
            <DialogDescription>
              Update the support type details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTypeName">Support Type Name</Label>
              <Input
                id="editTypeName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editTypeDescription">Description (Optional)</Label>
              <Input
                id="editTypeDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the support type"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditTypeOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditType}
                disabled={updateTypeMutation.isPending}
              >
                {updateTypeMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editCategoryOpen} onOpenChange={setEditCategoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editCategoryName">Category Name</Label>
              <Input
                id="editCategoryName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editCategoryDescription">Description (Optional)</Label>
              <Input
                id="editCategoryDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the category"
              />
            </div>
            <div>
              <Label htmlFor="editCategoryType">Support Type</Label>
              <Select
                value={formData.supportTypeId}
                onValueChange={(value) => setFormData({ ...formData, supportTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditCategoryOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={updateCategoryMutation.isPending}
              >
                {updateCategoryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editSubOptionOpen} onOpenChange={setEditSubOptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sub-option</DialogTitle>
            <DialogDescription>
              Update the sub-option details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editSubOptionName">Sub-option Name</Label>
              <Input
                id="editSubOptionName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="editSubOptionDescription">Description (Optional)</Label>
              <Input
                id="editSubOptionDescription"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the sub-option"
              />
            </div>
            <div>
              <Label htmlFor="editSubOptionType">Support Type</Label>
              <Select
                value={formData.supportTypeId}
                onValueChange={(value) => setFormData({ ...formData, supportTypeId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {supportTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="editRequiresSr"
                checked={formData.requiresSrIdentifier}
                onCheckedChange={(checked) => setFormData({ ...formData, requiresSrIdentifier: checked })}
              />
              <Label htmlFor="editRequiresSr">Requires Service Request Identifier</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditSubOptionOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditSubOption}
                disabled={updateSubOptionMutation.isPending}
              >
                {updateSubOptionMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Edit className="w-4 h-4 mr-2" />
                )}
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default SupportTaxonomyAdmin;