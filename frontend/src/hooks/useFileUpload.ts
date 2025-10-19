import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// Types
export interface FileUploadSettings {
  isEnabled: boolean;
  maxFileSizeBytes: number;
  allowedFileTypes: string[];
  maxFilesPerTicket: number;
}

export interface TicketAttachment {
  id: string;
  orderId: string;
  uploadedById: string;
  uploadedByName: string;
  fileName: string;
  originalFileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  uploadProvider: string;
  createdAt: string;
  fileSizeFormatted: string;
}

export interface FileUploadResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  contentType: string;
  createdAt: string;
}

// API Functions
const getFileUploadSettings = async (): Promise<FileUploadSettings> => {
  const response = await apiFetch('FileUpload/settings');
  if (!response.ok) {
    throw new Error('Failed to fetch file upload settings');
  }
  return await response.json();
};

const uploadFile = async (orderId: string, file: File): Promise<FileUploadResponse> => {
  const formData = new FormData();
  formData.append('OrderId', orderId);
  formData.append('File', file);

  // Use direct fetch for file upload to properly handle FormData
  const token = localStorage.getItem('authToken');
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5274/api/';
  const url = `${API_BASE.replace(/\/+$/,'')}/FileUpload/upload`;
  
  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      // Intentionally omit Content-Type to let browser set it with boundary for FormData
    }
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload file');
  }
  return await response.json();
};

const getTicketAttachments = async (orderId: string): Promise<TicketAttachment[]> => {
  const response = await apiFetch(`FileUpload/ticket/${orderId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch ticket attachments');
  }
  return await response.json();
};

const deleteAttachment = async (attachmentId: string): Promise<void> => {
  const response = await apiFetch(`FileUpload/${attachmentId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete attachment');
  }
};

// Hooks
export const useFileUploadSettings = () => {
  return useQuery({
    queryKey: ['fileUploadSettings'],
    queryFn: getFileUploadSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: string; file: File }) => 
      uploadFile(orderId, file),
    onSuccess: (_, variables) => {
      // Invalidate ticket attachments query
      queryClient.invalidateQueries({ queryKey: ['ticketAttachments', variables.orderId] });
    },
  });
};

export const useTicketAttachments = (orderId: string) => {
  return useQuery({
    queryKey: ['ticketAttachments', orderId],
    queryFn: () => getTicketAttachments(orderId),
    enabled: !!orderId,
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: deleteAttachment,
    onSuccess: () => {
      // Invalidate all ticket attachments queries
      queryClient.invalidateQueries({ queryKey: ['ticketAttachments'] });
    },
  });
};