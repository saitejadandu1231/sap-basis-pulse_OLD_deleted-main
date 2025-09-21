import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MessagingService, { 
  Conversation, 
  Message, 
  CreateMessageDto, 
  CreateConversationDto,
  MessageAttachment 
} from './messagingService';

// Query keys
export const messagingKeys = {
  all: ['messages'] as const,
  conversations: () => [...messagingKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...messagingKeys.conversations(), id] as const,
  messages: (conversationId: string) => ['messages', conversationId] as const,
  unreadCount: () => [...messagingKeys.all, 'unread-count'] as const,
};

// Conversation hooks
export function useConversations(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [...messagingKeys.conversations(), page, pageSize],
    queryFn: () => MessagingService.getUserConversations(page, pageSize),
  });
}

export function useConversation(conversationId: string) {
  return useQuery({
    queryKey: messagingKeys.conversation(conversationId),
    queryFn: () => MessagingService.getConversation(conversationId),
    enabled: !!conversationId,
  });
}

export function useConversationByOrder(orderId: string) {
  return useQuery({
    queryKey: ['conversation', 'order', orderId],
    queryFn: () => MessagingService.getConversationByOrder(orderId),
    enabled: !!orderId,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateConversationDto) => MessagingService.createConversation(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      queryClient.setQueryData(messagingKeys.conversation(data.id), data);
    },
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ conversationId, isActive }: { conversationId: string; isActive: boolean }) => 
      MessagingService.updateConversationStatus(conversationId, isActive),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(variables.conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
    },
  });
}

// Message hooks
export function useConversationMessages(conversationId: string, page = 1, pageSize = 50) {
  return useQuery({
    queryKey: [...messagingKeys.messages(conversationId), page, pageSize],
    queryFn: () => MessagingService.getConversationMessages(conversationId, page, pageSize),
    enabled: !!conversationId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (dto: CreateMessageDto) => MessagingService.sendMessage(dto),
    onSuccess: (data) => {
      // Invalidate all message queries for this conversation (regardless of page/pageSize)
      queryClient.invalidateQueries({ 
        queryKey: messagingKeys.messages(data.conversationId),
        exact: false 
      });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(data.conversationId) });
      queryClient.invalidateQueries({ queryKey: messagingKeys.conversations() });
      queryClient.invalidateQueries({ queryKey: messagingKeys.unreadCount() });
    },
  });
}

export function useUpdateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, content }: { messageId: string; content: string }) => 
      MessagingService.updateMessage(messageId, content),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(data.conversationId) });
    },
  });
}

export function useDeleteMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, conversationId }: { messageId: string; conversationId: string }) => 
      MessagingService.deleteMessage(messageId).then(success => ({ success, conversationId })),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: messagingKeys.messages(data.conversationId) });
      }
    },
  });
}

export function useMarkMessagesAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageIds, conversationId }: { messageIds: string[]; conversationId: string }) => 
      MessagingService.markMessagesAsRead(messageIds).then(success => ({ success, conversationId })),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: messagingKeys.messages(data.conversationId) });
        queryClient.invalidateQueries({ queryKey: messagingKeys.conversation(data.conversationId) });
        queryClient.invalidateQueries({ queryKey: messagingKeys.unreadCount() });
      }
    },
  });
}

// Attachment hooks
export function useUploadAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ messageId, file, conversationId }: 
      { messageId: string; file: File; conversationId: string }) => 
      MessagingService.uploadAttachment(messageId, file)
        .then(data => ({ ...data, conversationId })),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: messagingKeys.messages(data.conversationId) });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      attachmentId, 
      messageId, 
      conversationId 
    }: { 
      attachmentId: string; 
      messageId: string; 
      conversationId: string 
    }) => 
      MessagingService.deleteAttachment(attachmentId)
        .then(success => ({ success, messageId, conversationId })),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: messagingKeys.messages(data.conversationId) });
      }
    },
  });
}

// Utility hooks
export function useUnreadMessageCount() {
  return useQuery({
    queryKey: messagingKeys.unreadCount(),
    queryFn: () => MessagingService.getUnreadMessageCount(),
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useFileUploadInfo() {
  return useQuery({
    queryKey: ['file-upload-info'],
    queryFn: () => MessagingService.getFileUploadInfo(),
  });
}