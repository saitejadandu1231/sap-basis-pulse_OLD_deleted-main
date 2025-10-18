import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Globe, Shield, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

// Types for domain restrictions
interface DomainRestriction {
  id: string;
  domain: string;
  reason?: string;
  isActive: boolean;
  createdAt: string;
  createdByUserName: string;
  updatedAt?: string;
  updatedByUserName?: string;
}

interface CreateDomainRestrictionDto {
  domain: string;
  reason?: string;
}

interface UpdateDomainRestrictionDto {
  domain: string;
  reason?: string;
  isActive: boolean;
}

const DomainRestrictions: React.FC = () => {
  const [restrictions, setRestrictions] = useState<DomainRestriction[]>([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<DomainRestriction | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [restrictionToDelete, setRestrictionToDelete] = useState<DomainRestriction | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    domain: '',
    reason: ''
  });

  // Fetch domain restrictions
  const fetchRestrictions = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/domainrestrictions');
      if (!response.ok) {
        throw new Error('Failed to fetch domain restrictions');
      }
      const data = await response.json();
      setRestrictions(data);
    } catch (error) {
      console.error('Error fetching domain restrictions:', error);
      toast.error('Failed to load domain restrictions');
    } finally {
      setLoading(false);
    }
  };

  // Create domain restriction
  const createRestriction = async () => {
    try {
      if (!formData.domain.trim()) {
        toast.error('Domain is required');
        return;
      }

      const response = await apiFetch('/domainrestrictions', {
        method: 'POST',
        body: JSON.stringify({
          domain: formData.domain.trim(),
          reason: formData.reason.trim() || undefined
        } as CreateDomainRestrictionDto)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create domain restriction');
      }

      await fetchRestrictions();
      setCreateDialogOpen(false);
      setFormData({ domain: '', reason: '' });
      toast.success('Domain restriction created successfully');
    } catch (error) {
      console.error('Error creating domain restriction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create domain restriction');
    }
  };

  // Update domain restriction
  const updateRestriction = async () => {
    if (!selectedRestriction) return;

    try {
      if (!formData.domain.trim()) {
        toast.error('Domain is required');
        return;
      }

      const response = await apiFetch(`/domainrestrictions/${selectedRestriction.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          domain: formData.domain.trim(),
          reason: formData.reason.trim() || undefined,
          isActive: selectedRestriction.isActive
        } as UpdateDomainRestrictionDto)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update domain restriction');
      }

      await fetchRestrictions();
      setEditDialogOpen(false);
      setSelectedRestriction(null);
      setFormData({ domain: '', reason: '' });
      toast.success('Domain restriction updated successfully');
    } catch (error) {
      console.error('Error updating domain restriction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update domain restriction');
    }
  };

  // Toggle domain restriction status
  const toggleRestrictionStatus = async (restriction: DomainRestriction) => {
    try {
      const response = await apiFetch(`/domainrestrictions/${restriction.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          domain: restriction.domain,
          reason: restriction.reason,
          isActive: !restriction.isActive
        } as UpdateDomainRestrictionDto)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update domain restriction');
      }

      await fetchRestrictions();
      toast.success(`Domain restriction ${!restriction.isActive ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error toggling domain restriction:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update domain restriction');
    }
  };

  // Delete domain restriction
  const deleteRestriction = async (restriction: DomainRestriction) => {
    try {
      const response = await apiFetch(`/domainrestrictions/${restriction.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete domain restriction');
      }

      await fetchRestrictions();
      setConfirmDeleteOpen(false);
      setRestrictionToDelete(null);
      toast.success('Domain restriction deleted successfully');
    } catch (error) {
      console.error('Error deleting domain restriction:', error);
      toast.error('Failed to delete domain restriction');
    }
  };

  // Open edit dialog
  const openEditDialog = (restriction: DomainRestriction) => {
    setSelectedRestriction(restriction);
    setFormData({
      domain: restriction.domain,
      reason: restriction.reason || ''
    });
    setEditDialogOpen(true);
  };

  // Open delete confirmation
  const openDeleteConfirmation = (restriction: DomainRestriction) => {
    setRestrictionToDelete(restriction);
    setConfirmDeleteOpen(true);
  };

  // Load restrictions on component mount
  React.useEffect(() => {
    fetchRestrictions();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Domain Restrictions
              </CardTitle>
              <CardDescription>
                Manage email domains that are restricted from registering new accounts
              </CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Restriction
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Domain Restriction</DialogTitle>
                  <DialogDescription>
                    Block new user registrations from a specific email domain
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="domain">Domain *</Label>
                    <Input
                      id="domain"
                      placeholder="example.com"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (optional)</Label>
                    <Textarea
                      id="reason"
                      placeholder="Reason for restricting this domain..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={createRestriction} className="flex-1">
                      Create Restriction
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setCreateDialogOpen(false);
                        setFormData({ domain: '', reason: '' });
                      }}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading domain restrictions...</div>
          ) : restrictions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No domain restrictions configured</p>
              <p className="text-sm">All email domains are currently allowed to register</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {restrictions.map((restriction) => (
                  <TableRow key={restriction.id}>
                    <TableCell className="font-medium">
                      {restriction.domain}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={restriction.isActive ? "destructive" : "secondary"}
                        className="flex items-center gap-1 w-fit"
                      >
                        {restriction.isActive ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            Blocked
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {restriction.reason || 'No reason provided'}
                    </TableCell>
                    <TableCell>{restriction.createdByUserName}</TableCell>
                    <TableCell>
                      {new Date(restriction.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRestrictionStatus(restriction)}
                          title={restriction.isActive ? 'Deactivate restriction' : 'Activate restriction'}
                        >
                          {restriction.isActive ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(restriction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteConfirmation(restriction)}
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Domain Restriction</DialogTitle>
            <DialogDescription>
              Update the domain restriction settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-domain">Domain *</Label>
              <Input
                id="edit-domain"
                placeholder="example.com"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-reason">Reason (optional)</Label>
              <Textarea
                id="edit-reason"
                placeholder="Reason for restricting this domain..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={updateRestriction} className="flex-1">
                Update Restriction
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setSelectedRestriction(null);
                  setFormData({ domain: '', reason: '' });
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => restrictionToDelete && deleteRestriction(restrictionToDelete)}
        title="Delete Domain Restriction"
        message={
          restrictionToDelete 
            ? `Are you sure you want to delete the restriction for "${restrictionToDelete.domain}"? This will allow new registrations from this domain.`
            : ''
        }
        variant="destructive"
      />
    </div>
  );
};

export default DomainRestrictions;