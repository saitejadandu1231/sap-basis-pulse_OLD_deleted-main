import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// Define interfaces for admin API responses
interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: 'Customer' | 'Consultant' | 'Admin';
  status: 'Active' | 'Blocked' | 'Inactive';
}

interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'Customer' | 'Consultant' | 'Admin';
}

interface UpdateUserRequest {
  firstName: string;
  lastName: string;
  role: 'Customer' | 'Consultant' | 'Admin';
}

interface AdminSupportRequest {
  id: string;
  orderNumber: string;
  supportTypeName: string;
  description: string;
  status: string;
  createdAt: string;
  createdByName: string;
  consultantName: string | null;
  conversationId?: string | null;
  hasConversation: boolean;
  unreadMessageCount: number;
}

interface AdminPayment {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  consultantName: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  consultantEarning: number;
}

// Get all users
export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const response = await apiFetch('Admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json() as AdminUser[];
    },
  });
};

// Update user role
export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { userId: string; role: string }) => {
      const response = await apiFetch(`Admin/users/${data.userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.role),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user role');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Get all support requests
export const useAdminSupportRequests = () => {
  return useQuery({
    queryKey: ['admin', 'supportRequests'],
    queryFn: async () => {
      const response = await apiFetch('Admin/support-requests');
      if (!response.ok) {
        throw new Error('Failed to fetch support requests');
      }
      return await response.json() as AdminSupportRequest[];
    },
  });
};

// Create user (if this endpoint exists)
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CreateUserRequest) => {
      const response = await apiFetch('Users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Update user (if this endpoint exists)
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { userId: string } & UpdateUserRequest) => {
      const response = await apiFetch(`Users/${data.userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Delete user (if this endpoint exists)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiFetch(`Users/${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

// Get payments ready for admin payout
export const useAdminPaymentsReadyForPayout = () => {
  return useQuery({
    queryKey: ['admin', 'payments', 'ready-for-payout'],
    queryFn: async () => {
      const response = await apiFetch('Admin/payments/ready-for-payout');
      if (!response.ok) {
        throw new Error('Failed to fetch payments ready for payout');
      }
      return await response.json() as AdminPayment[];
    },
  });
};

// Update payment status
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { paymentId: string; status: string }) => {
      const response = await apiFetch(`Admin/payments/${data.paymentId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data.status),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'ready-for-payout'] });
    },
  });
};

// Bulk update payment status
export const useBulkUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { paymentIds: string[]; status: string }) => {
      const response = await apiFetch('Admin/payments/bulk-status-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          PaymentIds: data.paymentIds,
          Status: data.status
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to bulk update payment status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'payments', 'ready-for-payout'] });
    },
  });
};