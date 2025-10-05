import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ticketNumberTemplateService } from '../services/ticketNumberTemplateService';
import type {
  TicketNumberTemplate,
  CreateTicketNumberTemplate,
  UpdateTicketNumberTemplate,
  TicketNumberTemplatePreview
} from '../types/ticketNumberTemplate';
import { toast } from 'sonner';

// Query keys
export const ticketNumberTemplateKeys = {
  all: ['ticketNumberTemplates'] as const,
  list: () => [...ticketNumberTemplateKeys.all, 'list'] as const,
  detail: (id: string) => [...ticketNumberTemplateKeys.all, 'detail', id] as const,
};

// Get all templates
export function useTicketNumberTemplates() {
  return useQuery({
    queryKey: ticketNumberTemplateKeys.list(),
    queryFn: ticketNumberTemplateService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get template by ID
export function useTicketNumberTemplate(id: string) {
  return useQuery({
    queryKey: ticketNumberTemplateKeys.detail(id),
    queryFn: () => ticketNumberTemplateService.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create template mutation
export function useCreateTicketNumberTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketNumberTemplateService.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketNumberTemplateKeys.all });
      toast.success('Template created successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to create template';
      toast.error(message);
    },
  });
}

// Update template mutation
export function useUpdateTicketNumberTemplate(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateTicketNumberTemplate) => 
      ticketNumberTemplateService.update(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ticketNumberTemplateKeys.all });
      queryClient.setQueryData(ticketNumberTemplateKeys.detail(id), data);
      toast.success('Template updated successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to update template';
      toast.error(message);
    },
  });
}

// Delete template mutation
export function useDeleteTicketNumberTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketNumberTemplateService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ticketNumberTemplateKeys.all });
      toast.success('Template deleted successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to delete template';
      toast.error(message);
    },
  });
}

// Preview ticket number mutation
export function usePreviewTicketNumber() {
  return useMutation({
    mutationFn: ticketNumberTemplateService.preview,
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to generate preview';
      toast.error(message);
    },
  });
}

// Reset sequence mutation
export function useResetSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ticketNumberTemplateService.resetSequence,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ticketNumberTemplateKeys.all });
      queryClient.invalidateQueries({ queryKey: ticketNumberTemplateKeys.detail(id) });
      toast.success(data.message || 'Sequence counter reset successfully');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Failed to reset sequence counter';
      toast.error(message);
    },
  });
}