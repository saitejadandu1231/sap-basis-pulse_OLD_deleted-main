import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Define interfaces for API responses
interface SupportType {
  id: string;
  name: string;
  description: string | null;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string | null;
}

interface SupportSubOption {
  id: string;
  name: string;
  description: string | null;
  supportTypeId: string | null;
  requiresSrIdentifier?: boolean;
}

interface ConsultantSkill {
  id: string;
  consultantId: string;
  supportTypeId: string;
  supportTypeName: string;
  supportCategoryId: string | null;
  supportCategoryName: string | null;
  supportSubOptionId: string | null;
  supportSubOptionName: string | null;
  createdAt: string;
}

interface ConsultantSkills {
  consultantId: string;
  consultantName: string;
  skills: ConsultantSkill[];
}

interface TimeSlot {
  id: string;
  consultantId: string;
  slotStartTime: string;
  slotEndTime: string;
  bookedByCustomerChoiceId: string | null;
}

interface Consultant {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  status: string;
  averageRating?: number | null;
  totalRatings: number;
  hourlyRate?: number | null;
}

interface Order {
  id: string;
  orderNumber: string;
  customerChoiceId: string;
  userId: string;
  consultantId: string | null;
  supportTypeName: string | null;
  createdAt: string;
}

interface SupportRequest {
  id: string;
  orderId?: string;
  orderNumber?: string;
  supportTypeId: string;
  supportTypeName: string;
  supportCategoryId: string;
  supportCategoryName: string;
  supportSubOptionId: string | null;
  supportSubOptionName: string | null;
  description: string;
  srIdentifier: string | null;
  priority: string;
  consultantId: string;
  consultantName: string;
  timeSlotId: string;
  slotStartTime: string;
  slotEndTime: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  status: string;
  conversationId?: string | null;
  hasConversation: boolean;
  unreadMessageCount: number;
}
// Fetch Support Taxonomy
export const useSupportTypes = () => {
  return useQuery({
    queryKey: ['supportTypes'],
    queryFn: async () => {
      const response = await apiFetch('SupportTaxonomy');
      if (!response.ok) {
        throw new Error('Failed to fetch support types');
      }
      return await response.json();
    },
  });
};

export const useSupportCategories = (typeId: string | null) => {
  return useQuery({
    queryKey: ['supportCategories', typeId],
    queryFn: async () => {
      if (!typeId) return [];
      const response = await apiFetch(`SupportTaxonomy/categories?typeId=${typeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch support categories');
      }
      return await response.json();
    },
    enabled: !!typeId,
  });
};

export const useSupportSubOptions = (typeId: string | null) => {
  return useQuery({
    queryKey: ['supportSubOptions', typeId],
    queryFn: async () => {
      if (!typeId) return [];
      const response = await apiFetch(`SupportTaxonomy/suboptions?typeId=${typeId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch support sub-options');
      }
      const data = await response.json();
      console.log('Support Sub Options API Response:', data);
      return data;
    },
    enabled: !!typeId,
  });
};

// Consultant availability slots
export const useConsultantAvailabilitySlots = (consultantId: string | null, startDate: string, endDate: string) => {
  return useQuery({
    queryKey: ['consultantSlots', consultantId, startDate, endDate],
    queryFn: async () => {
      if (!consultantId) return [];
      const response = await apiFetch(`ConsultantAvailability?consultantId=${consultantId}&startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultant availability');
      }
      return await response.json();
    },
    enabled: !!consultantId && !!startDate && !!endDate,
  });
};

// Alias for useConsultantAvailabilitySlots for backward compatibility
export const useAvailableTimeSlots = useConsultantAvailabilitySlots;

// Available consultants
export const useAvailableConsultants = () => {
  return useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const response = await apiFetch('Users/consultants');
      if (!response.ok) {
        throw new Error('Failed to fetch consultants');
      }
      return await response.json();
    },
  });
};

  // Recent tickets
export const useRecentTickets = (searchQuery?: string) => {
  const { user, token } = useAuth();
  
  return useQuery({
    queryKey: ['recentTickets', token, searchQuery?.trim() || null], // Add searchQuery to query key for automatic refetching
    queryFn: async () => {
      if (!user || !token) return [];
      
      let endpoint = 'SupportRequests/recent/user';
      if (user.role === 'consultant') {
        endpoint = 'SupportRequests/recent/consultant';
      } else if (user.role === 'admin') {
        endpoint = 'SupportRequests';
      }
      
      // Add search parameter if provided
      const params = new URLSearchParams();
      if (searchQuery && searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      const queryString = params.toString();
      const fullEndpoint = queryString ? `${endpoint}?${queryString}` : endpoint;
      
      console.log("Fetching tickets with token:", token ? "Present" : "Missing", "search:", searchQuery || 'none');
      const response = await apiFetch(fullEndpoint);
      
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        throw new Error('Unauthorized - Please log in again');
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch recent tickets');
      }
      return await response.json();
    },
    enabled: !!user && !!token, // Only enable query when user and token are available
  });
};

// Create support request
export const useCreateSupportRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      supportTypeId: string;
      supportCategoryId: string;
      supportSubOptionId?: string;
      description: string;
      srIdentifier?: string;
      priority: string;
      consultantId: string;
      timeSlotIds: string[];
    }) => {
      const response = await apiFetch('SupportRequests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support request');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
    },
  });
};

// Submit ticket rating
export const useSubmitTicketRating = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (data: {
      orderId: string;
      ratedUserId: string;
      ratingForRole: 'customer' | 'consultant';
      resolutionQuality: number;
      responseTime: number;
      communicationProfessionalism: number;
      comments?: string;
    }) => {
      const response = await apiFetch('TicketRatings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: data.orderId,
          ratedByUserId: user?.id || '',
          ratedUserId: data.ratedUserId,
          ratingForRole: data.ratingForRole,
          communicationProfessionalism: data.communicationProfessionalism,
          resolutionQuality: data.resolutionQuality,
          responseTime: data.responseTime,
          comments: data.comments
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
      queryClient.invalidateQueries({ queryKey: ['ticketRatings'] });
    },
  });
};

// Get ratings for an order
export const useTicketRatings = (orderId: string) => {
  return useQuery({
    queryKey: ['ticketRatings', orderId],
    queryFn: async () => {
      const response = await apiFetch(`TicketRatings/order/${orderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch ticket ratings');
      }
      return await response.json();
    },
    enabled: !!orderId,
  });
};

// Update ticket status
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      orderId: string;
      status: 'New' | 'InProgress' | 'PendingCustomerAction' | 'TopicClosed' | 'Closed' | 'ReOpened';
      comment?: string;
    }) => {
      const response = await apiFetch(`SupportRequests/${data.orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: data.status,
          comment: data.comment 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ticket status');
      }
      
      return await response.json();
    },
    onSuccess: (_, variables) => {
      // Invalidate both tickets list and status history for this specific order
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
      queryClient.invalidateQueries({ queryKey: ['status-history', variables.orderId] });
    },
  });
};

// Consultant reviews
export const useConsultantReviews = (consultantId: string) => {
  return useQuery({
    queryKey: ['consultantReviews', consultantId],
    queryFn: async () => {
      const response = await apiFetch(`TicketRatings/consultant/${consultantId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultant reviews');
      }
      return await response.json();
    },
    enabled: !!consultantId,
  });
};

// Admin Support Taxonomy Management Hooks
export const useAdminSupportTypes = () => {
  return useQuery({
    queryKey: ['adminSupportTypes'],
    queryFn: async () => {
      const response = await apiFetch('SupportTaxonomy/admin/types');
      if (!response.ok) {
        throw new Error('Failed to fetch support types');
      }
      return await response.json();
    },
  });
};

export const useCreateSupportType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiFetch('SupportTaxonomy/admin/types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support type');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTypes'] });
      queryClient.invalidateQueries({ queryKey: ['supportTypes'] });
    },
  });
};

export const useUpdateSupportType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description: string }) => {
      const response = await apiFetch(`SupportTaxonomy/admin/types/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name, description: data.description }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update support type');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTypes'] });
      queryClient.invalidateQueries({ queryKey: ['supportTypes'] });
    },
  });
};

export const useDeleteSupportType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`SupportTaxonomy/admin/types/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete support type');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportTypes'] });
      queryClient.invalidateQueries({ queryKey: ['supportTypes'] });
    },
  });
};

export const useAdminSupportCategories = () => {
  return useQuery({
    queryKey: ['adminSupportCategories'],
    queryFn: async () => {
      const response = await apiFetch('SupportTaxonomy/admin/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch support categories');
      }
      return await response.json();
    },
  });
};

export const useCreateSupportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string; supportTypeId: string }) => {
      const response = await apiFetch('SupportTaxonomy/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support category');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportCategories'] });
      queryClient.invalidateQueries({ queryKey: ['supportCategories'] });
    },
  });
};

export const useUpdateSupportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; supportTypeId: string }) => {
      const response = await apiFetch(`SupportTaxonomy/admin/categories/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name, description: data.description, supportTypeId: data.supportTypeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update support category');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportCategories'] });
      queryClient.invalidateQueries({ queryKey: ['supportCategories'] });
    },
  });
};

export const useDeleteSupportCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`SupportTaxonomy/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete support category');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportCategories'] });
      queryClient.invalidateQueries({ queryKey: ['supportCategories'] });
    },
  });
};

export const useAdminSupportSubOptions = () => {
  return useQuery({
    queryKey: ['adminSupportSubOptions'],
    queryFn: async () => {
      const response = await apiFetch('SupportTaxonomy/admin/suboptions');
      if (!response.ok) {
        throw new Error('Failed to fetch support sub-options');
      }
      return await response.json();
    },
  });
};

export const useCreateSupportSubOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; description: string; supportTypeId: string; requiresSrIdentifier?: boolean }) => {
      const response = await apiFetch('SupportTaxonomy/admin/suboptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create support sub-option');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportSubOptions'] });
      queryClient.invalidateQueries({ queryKey: ['supportSubOptions'] });
    },
  });
};

export const useUpdateSupportSubOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name: string; description: string; supportTypeId: string; requiresSrIdentifier?: boolean }) => {
      const response = await apiFetch(`SupportTaxonomy/admin/suboptions/${data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: data.name, description: data.description, supportTypeId: data.supportTypeId, requiresSrIdentifier: data.requiresSrIdentifier }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update support sub-option');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportSubOptions'] });
      queryClient.invalidateQueries({ queryKey: ['supportSubOptions'] });
    },
  });
};

export const useDeleteSupportSubOption = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`SupportTaxonomy/admin/suboptions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete support sub-option');
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminSupportSubOptions'] });
      queryClient.invalidateQueries({ queryKey: ['supportSubOptions'] });
    },
  });
};

// Consultant Skills Hooks
export const useConsultantSkills = (consultantId: string) => {
  return useQuery({
    queryKey: ['consultantSkills', consultantId],
    queryFn: async () => {
      const response = await apiFetch(`SupportTaxonomy/consultant/${consultantId}/skills`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultant skills');
      }
      return await response.json();
    },
    enabled: !!consultantId,
  });
};

export const useAddConsultantSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { consultantId: string; supportTypeId: string; supportCategoryId?: string; supportSubOptionId?: string }) => {
      const response = await apiFetch(`SupportTaxonomy/consultant/${data.consultantId}/skills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supportTypeId: data.supportTypeId,
          supportCategoryId: data.supportCategoryId || null,
          supportSubOptionId: data.supportSubOptionId || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add consultant skill');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultantSkills', data.consultantId] });
    },
  });
};

export const useRemoveConsultantSkill = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { consultantId: string; skillId: string }) => {
      const response = await apiFetch(`SupportTaxonomy/consultant/${data.consultantId}/skills/${data.skillId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove consultant skill');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['consultantSkills', data.consultantId] });
    },
  });
};

export const useConsultantsBySkills = (supportTypeId: string, supportCategoryId?: string) => {
  return useQuery({
    queryKey: ['consultantsBySkills', supportTypeId, supportCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams({ supportTypeId });
      if (supportCategoryId) params.append('supportCategoryId', supportCategoryId);

      const response = await apiFetch(`SupportTaxonomy/consultants-by-skills?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch consultants by skills');
      }
      return await response.json();
    },
    enabled: !!supportTypeId,
  });
};