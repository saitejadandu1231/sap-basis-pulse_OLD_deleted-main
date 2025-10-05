import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { serviceRequestIdentifierApi, ServiceRequestIdentifier, CreateServiceRequestIdentifier, UpdateServiceRequestIdentifier } from '@/lib/serviceRequestIdentifierApi';

// Query keys
export const srIdentifierKeys = {
  all: ['srIdentifiers'] as const,
  admin: ['srIdentifiers', 'admin'] as const,
  autocomplete: ['srIdentifiers', 'all'] as const,
  validation: (identifier: string) => ['validateSrIdentifier', identifier] as const,
};

// Fetch all SR identifiers for admin use
export const useAdminSrIdentifiers = () => {
  return useQuery({
    queryKey: srIdentifierKeys.admin,
    queryFn: serviceRequestIdentifierApi.getAll,
  });
};

// Create SR identifier
export const useCreateSrIdentifier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateServiceRequestIdentifier) => serviceRequestIdentifierApi.create(data),
    onSuccess: () => {
      // Invalidate all SR identifier queries
      queryClient.invalidateQueries({ queryKey: srIdentifierKeys.all });
    },
  });
};

// Update SR identifier
export const useUpdateSrIdentifier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServiceRequestIdentifier }) => 
      serviceRequestIdentifierApi.update(id, data),
    onSuccess: () => {
      // Invalidate all SR identifier queries
      queryClient.invalidateQueries({ queryKey: srIdentifierKeys.all });
    },
  });
};

// Delete SR identifier
export const useDeleteSrIdentifier = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => serviceRequestIdentifierApi.delete(id),
    onSuccess: () => {
      // Invalidate all SR identifier queries
      queryClient.invalidateQueries({ queryKey: srIdentifierKeys.all });
    },
  });
};

// Get single SR identifier
export const useSrIdentifier = (id: string) => {
  return useQuery({
    queryKey: ['srIdentifier', id],
    queryFn: () => serviceRequestIdentifierApi.getById(id),
    enabled: !!id,
  });
};