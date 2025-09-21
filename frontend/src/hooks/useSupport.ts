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

interface TimeSlot {
  id: string;
  consultantId: string;
  slotStartTime: string;
  slotEndTime: string;
  bookedByCustomerChoiceId: string | null;
}

interface Consultant {
  id: string;
  firstName: string | null;
  lastName: string | null;
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
export const useRecentTickets = () => {
  const { user, token } = useAuth();
  
  return useQuery({
    queryKey: ['recentTickets', token], // Add token to query key for automatic refetching when token changes
    queryFn: async () => {
      if (!user || !token) return [];
      
      let endpoint = 'SupportRequests/recent/user';
      if (user.role === 'consultant') {
        endpoint = 'SupportRequests/recent/consultant';
      } else if (user.role === 'admin') {
        endpoint = 'SupportRequests';
      }
      
      console.log("Fetching tickets with token:", token ? "Present" : "Missing");
      const response = await apiFetch(endpoint);
      
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
      timeSlotId: string;
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
  
  return useMutation({
    mutationFn: async (data: {
      orderId: string;
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
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit rating');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
    },
  });
};

// Update ticket status
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: {
      customerChoiceId: string;
      status: 'New' | 'InProgress' | 'PendingCustomerAction' | 'TopicClosed' | 'Closed' | 'ReOpened';
    }) => {
      const response = await apiFetch(`SupportRequests/${data.customerChoiceId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: data.status }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update ticket status');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
    },
  });
};