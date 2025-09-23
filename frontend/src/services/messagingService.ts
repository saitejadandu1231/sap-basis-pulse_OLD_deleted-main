import axios from 'axios';

// Types for the messaging system
export interface Conversation {
  id: string;
  orderId: string;
  customerId: string;
  consultantId: string;
  isActive: boolean;
  createdAt: string;
  lastMessageAt: string;
  unreadCount: number;
  customerName: string;
  consultantName: string;
  orderNumber: string;
  subject: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  content: string;
  messageType: 'text' | 'file' | 'system';
  isRead: boolean;
  isEdited: boolean;
  sentAt: string;
  readAt?: string;
  editedAt?: string;
  attachments: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  messageId?: string;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedByName: string;
  downloadUrl: string;
}

// DTOs to match backend
export interface CreateConversationDto {
  orderId: string;
  subject: string;
  initialMessage: string;
}

export interface CreateMessageDto {
  conversationId: string;
  content: string;
  messageType: 'text' | 'file' | 'system';
}

export interface UpdateMessageDto {
  content: string;
}

export interface MarkMessageReadDto {
  messageIds: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  pageCount: number;
  pageSize: number;
  totalCount: number;
}

export interface FileUploadInfo {
  allowedFileTypes: string[];
  maxFileSize: number;
  maxFileSizeMB: number;
}

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5274/api/';
const API_URL = `${API_BASE}Messaging`;

// Configure axios to include auth token
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const MessagingService = {
  // Conversation endpoints
  createConversation: async (data: CreateConversationDto): Promise<Conversation> => {
    const response = await axios.post<Conversation>(`${API_URL}/conversations`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getUserConversations: async (page: number = 1, pageSize: number = 20): Promise<Conversation[]> => {
    const response = await axios.get<Conversation[]>(
      `${API_URL}/conversations?page=${page}&pageSize=${pageSize}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getConversation: async (conversationId: string): Promise<Conversation> => {
    const response = await axios.get<Conversation>(`${API_URL}/conversations/${conversationId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getConversationByOrder: async (orderId: string): Promise<Conversation> => {
    const response = await axios.get<Conversation>(`${API_URL}/conversations/by-order/${orderId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  createOrGetConversationForOrder: async (orderId: string): Promise<Conversation> => {
    try {
      const response = await axios.post<Conversation>(`${API_URL}/conversations/for-order/${orderId}`, {}, {
        headers: getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error(`Error creating conversation for order ${orderId}:`, error.response?.data || error.message);
      throw error; // Re-throw for handling in the component
    }
  },

  updateConversationStatus: async (conversationId: string, isActive: boolean): Promise<boolean> => {
    const response = await axios.put<{ success: boolean }>(
      `${API_URL}/conversations/${conversationId}/status`, 
      isActive
    );
    return response.data.success;
  },

  // Message endpoints
  sendMessage: async (dto: CreateMessageDto): Promise<Message> => {
    const response = await axios.post<Message>(`${API_URL}/messages`, dto, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getConversationMessages: async (
    conversationId: string, 
    page: number = 1, 
    pageSize: number = 50
  ): Promise<Message[]> => {
    const response = await axios.get<Message[]>(
      `${API_URL}/conversations/${conversationId}/messages?page=${page}&pageSize=${pageSize}`,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getMessage: async (messageId: string): Promise<Message> => {
    const response = await axios.get<Message>(`${API_URL}/messages/${messageId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  updateMessage: async (messageId: string, content: string): Promise<Message> => {
    const response = await axios.put<Message>(
      `${API_URL}/messages/${messageId}`, 
      { content } as UpdateMessageDto,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  deleteMessage: async (messageId: string): Promise<boolean> => {
    const response = await axios.delete<{ success: boolean }>(`${API_URL}/messages/${messageId}`, {
      headers: getAuthHeaders()
    });
    return response.data.success;
  },

  markMessagesAsRead: async (messageIds: string[]): Promise<boolean> => {
    const response = await axios.post<{ success: boolean }>(
      `${API_URL}/messages/mark-read`, 
      { messageIds } as MarkMessageReadDto,
      { headers: getAuthHeaders() }
    );
    return response.data.success;
  },

  // Attachment endpoints
  uploadAttachment: async (messageId: string, file: File): Promise<MessageAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<MessageAttachment>(
      `${API_URL}/messages/${messageId}/attachments`, 
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    
    return response.data;
  },

  getAttachment: async (attachmentId: string): Promise<MessageAttachment> => {
    const response = await axios.get<MessageAttachment>(`${API_URL}/attachments/${attachmentId}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  getAttachmentDownloadUrl: (attachmentId: string): string => {
    return `${API_URL}/attachments/${attachmentId}/download`;
  },

  deleteAttachment: async (attachmentId: string): Promise<boolean> => {
    const response = await axios.delete<{ success: boolean }>(`${API_URL}/attachments/${attachmentId}`, {
      headers: getAuthHeaders()
    });
    return response.data.success;
  },

  // Utility endpoints
  getUnreadMessageCount: async (): Promise<number> => {
    try {
      const response = await axios.get<{ unreadCount: number }>(`${API_URL}/unread-count`, {
        headers: getAuthHeaders()
      });
      return response.data.unreadCount || 0;
    } catch (error) {
      console.warn('Failed to fetch unread message count:', error);
      return 0;
    }
  },

  getFileUploadInfo: async (): Promise<FileUploadInfo> => {
    const response = await axios.get<FileUploadInfo>(`${API_URL}/file-upload-info`, {
      headers: getAuthHeaders()
    });
    return response.data;
  },
};

export default MessagingService;