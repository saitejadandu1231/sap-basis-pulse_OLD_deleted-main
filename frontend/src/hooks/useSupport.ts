
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SupportType {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
}

interface SupportCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
}

interface SupportSubOption {
  id: string;
  name: string;
  description: string | null;
  support_type_id: string | null;
  requires_sr_identifier: boolean | null;
  sort_order: number | null;
}

interface TimeSlot {
  id: string;
  consultant_user_id: string;
  slot_start_time: string;
  slot_end_time: string;
  booked_by_customer_choice_id: string | null;
}

interface Consultant {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
}

interface Order {
  id: string;
  order_number: string;
  customer_choice_id: string;
  user_id: string;
  consultant_id: string | null;
  support_type_name: string | null;
  created_at: string;
  updated_at: string;
}

interface CustomerChoice {
  id: string;
  user_id: string;
  support_type_id: string | null;
  support_category_id: string | null;
  support_sub_option_id: string | null;
  description: string;
  sr_identifier: string | null;
  scheduled_time: string | null;
  status: string;
  priority: string | null;
  consultant_id: string | null;
  status_updated_by_user_id: string | null;
  status_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketRating {
  id: string;
  order_id: string;
  rated_by_user_id: string;
  rated_user_id: string;
  rating_for_role: 'customer' | 'consultant';
  resolution_quality: number | null;
  response_time: number | null;
  communication_professionalism: number | null;
  comments: string | null;
  created_at: string;
}

export const useSupportTypes = () => {
  return useQuery({
    queryKey: ['supportTypes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as SupportType[];
    },
  });
};

export const useSupportCategories = () => {
  return useQuery({
    queryKey: ['supportCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('support_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      
      if (error) throw error;
      return data as SupportCategory[];
    },
  });
};

export const useSupportSubOptions = (supportTypeId?: string) => {
  return useQuery({
    queryKey: ['supportSubOptions', supportTypeId],
    queryFn: async () => {
      let query = supabase
        .from('support_sub_options')
        .select('*')
        .eq('is_active', true);
      
      if (supportTypeId) {
        query = query.eq('support_type_id', supportTypeId);
      }
      
      const { data, error } = await query.order('sort_order');
      
      if (error) throw error;
      return data as SupportSubOption[];
    },
    enabled: !!supportTypeId,
  });
};

export const useConsultants = () => {
  return useQuery({
    queryKey: ['consultants'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_master')
        .select('user_id, first_name, last_name')
        .eq('role', 'consultant')
        .eq('status', 'active');
      
      if (error) throw error;
      return data as Consultant[];
    },
  });
};

export const useAvailableTimeSlots = (consultantId?: string) => {
  return useQuery({
    queryKey: ['availableTimeSlots', consultantId],
    queryFn: async () => {
      if (!consultantId) return [];
      
      const { data, error } = await supabase
        .from('consultant_availability_slots')
        .select('*')
        .eq('consultant_user_id', consultantId)
        .is('booked_by_customer_choice_id', null)
        .gte('slot_start_time', new Date().toISOString())
        .order('slot_start_time');
      
      if (error) throw error;
      return data as TimeSlot[];
    },
    enabled: !!consultantId,
  });
};

export const useRecentTickets = () => {
  return useQuery({
    queryKey: ['recentTickets'],
    queryFn: async () => {
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('customer_choice')
        .select(`
          *,
          orders (
            order_number,
            support_type_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (ticketsError) throw ticketsError;
      return ticketsData;
    },
  });
};

export const useTicketRatings = (orderId?: string) => {
  return useQuery({
    queryKey: ['ticketRatings', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('ticket_ratings')
        .select('*')
        .eq('order_id', orderId);
      
      if (error) throw error;
      return data as TicketRating[];
    },
    enabled: !!orderId,
  });
};

export const useCreateSupportRequest = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (requestData: {
      supportTypeId: string;
      supportCategoryId: string;
      supportSubOptionId?: string;
      description: string;
      srIdentifier?: string;
      consultantId: string;
      timeSlotId: string;
      priority?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      // Validate SR identifier if required
      if (requestData.srIdentifier) {
        const { data: validSR, error: srError } = await supabase
          .from('sap_rise_rnr')
          .select('id')
          .eq('identifier', requestData.srIdentifier)
          .eq('is_active', true)
          .single();
        
        if (srError || !validSR) {
          throw new Error('Invalid SR identifier');
        }
      }

      // Get support type name for order generation
      const { data: supportType, error: supportTypeError } = await supabase
        .from('support_types')
        .select('name')
        .eq('id', requestData.supportTypeId)
        .single();
      
      if (supportTypeError) throw supportTypeError;

      // Get support category name for enhanced order numbering
      const { data: supportCategory, error: supportCategoryError } = await supabase
        .from('support_categories')
        .select('name')
        .eq('id', requestData.supportCategoryId)
        .single();
      
      if (supportCategoryError) throw supportCategoryError;

      // Get support sub option name if provided
      let supportSubOptionName = '';
      if (requestData.supportSubOptionId) {
        const { data: supportSubOption, error: supportSubOptionError } = await supabase
          .from('support_sub_options')
          .select('name')
          .eq('id', requestData.supportSubOptionId)
          .single();
        
        if (!supportSubOptionError && supportSubOption) {
          supportSubOptionName = supportSubOption.name;
        }
      }

      // Get time slot details
      const { data: timeSlot, error: slotError } = await supabase
        .from('consultant_availability_slots')
        .select('*')
        .eq('id', requestData.timeSlotId)
        .single();
      
      if (slotError) throw slotError;

      // Create customer choice record with new status
      const { data: customerChoice, error: choiceError } = await supabase
        .from('customer_choice')
        .insert({
          user_id: user.user.id,
          support_type_id: requestData.supportTypeId,
          support_category_id: requestData.supportCategoryId,
          support_sub_option_id: requestData.supportSubOptionId || null,
          description: requestData.description,
          sr_identifier: requestData.srIdentifier || null,
          scheduled_time: timeSlot.slot_start_time,
          consultant_id: requestData.consultantId,
          status: 'New',
          priority: requestData.priority || 'Medium'
        })
        .select()
        .single();

      if (choiceError) throw choiceError;

      // Generate enhanced order number with category and sub-option info
      const { data: orderNumber, error: orderNumberError } = await supabase
        .rpc('generate_order_number', { 
          support_type_name: supportType.name,
          support_category_name: supportCategory.name,
          support_sub_option_name: supportSubOptionName,
          priority_level: requestData.priority || 'Medium'
        });
      
      if (orderNumberError) throw orderNumberError;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_choice_id: customerChoice.id,
          user_id: user.user.id,
          consultant_id: requestData.consultantId,
          support_type_name: supportType.name
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Book the time slot
      const { error: slotBookingError } = await supabase
        .from('consultant_availability_slots')
        .update({ booked_by_customer_choice_id: customerChoice.id })
        .eq('id', requestData.timeSlotId);

      if (slotBookingError) throw slotBookingError;

      return { customerChoice, order };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
      queryClient.invalidateQueries({ queryKey: ['availableTimeSlots'] });
    },
  });
};

export const useCreateTicketRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (ratingData: {
      orderId: string;
      ratedUserId: string;
      ratingForRole: 'customer' | 'consultant';
      resolutionQuality: number;
      responseTime: number;
      communicationProfessionalism: number;
      comments?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ticket_ratings')
        .insert({
          order_id: ratingData.orderId,
          rated_by_user_id: user.user.id,
          rated_user_id: ratingData.ratedUserId,
          rating_for_role: ratingData.ratingForRole,
          resolution_quality: ratingData.resolutionQuality,
          response_time: ratingData.responseTime,
          communication_professionalism: ratingData.communicationProfessionalism,
          comments: ratingData.comments || null
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticketRatings', variables.orderId] });
    },
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updateData: {
      customerChoiceId: string;
      status: 'New' | 'InProgress' | 'PendingCustomerAction' | 'TopicClosed' | 'Closed' | 'ReOpened';
    }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('customer_choice')
        .update({
          status: updateData.status,
          status_updated_by_user_id: user.user.id,
          status_updated_at: new Date().toISOString()
        })
        .eq('id', updateData.customerChoiceId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recentTickets'] });
    },
  });
};

// Denied-domain validation removed — signup will call backend register API directly.
