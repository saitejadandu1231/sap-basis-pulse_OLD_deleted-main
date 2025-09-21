import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Download, File, Trash2, Edit2, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useConversationMessages,
  useDeleteMessage,
  useDeleteAttachment,
  useMarkMessagesAsRead,
} from '@/services/messagingHooks';
import MessagingService, { Message, MessageAttachment } from '@/services/messagingService';
import { useAuth } from '@/contexts/AuthContext';

interface MessageThreadProps {
  conversationId: string;
  onEditMessage?: (message: Message) => void;
}

const MessageBubble: React.FC<{
  message: Message;
  isOwn: boolean;
  onEdit?: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onDeleteAttachment: (attachmentId: string, messageId: string) => void;
}> = ({ 
  message, 
  isOwn, 
  onEdit, 
  onDelete,
  onDeleteAttachment
}) => {
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return '🖼️';
    if (contentType.includes('pdf')) return '📄';
    if (contentType.includes('word') || contentType.includes('document')) return '📝';
    if (contentType.includes('excel') || contentType.includes('spreadsheet')) return '📊';
    if (contentType.includes('powerpoint') || contentType.includes('presentation')) return '📈';
    return '📎';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownload = (attachment: MessageAttachment) => {
    const url = MessagingService.getAttachmentDownloadUrl(attachment.id);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.originalFileName;
    link.click();
  };

  const formatMessageTime = (dateString: string): string => {
    if (!dateString) {
      console.warn('Date string is empty or null:', dateString);
      return 'No date';
    }

    try {
      // Try to parse the date string directly
      let date = new Date(dateString);
      
      // If direct parsing fails, try parsing as ISO string
      if (isNaN(date.getTime())) {
        // Try adding 'Z' if it's missing (for UTC)
        if (!dateString.endsWith('Z') && !dateString.includes('+')) {
          date = new Date(dateString + 'Z');
        }
      }
      
      // If still invalid, try parsing without timezone
      if (isNaN(date.getTime())) {
        const cleanDate = dateString.replace('T', ' ').replace('Z', '');
        date = new Date(cleanDate);
      }
      
      if (isNaN(date.getTime())) {
        console.error('Unable to parse date:', dateString);
        return 'Invalid date';
      }
      
      return format(date, 'h:mm a');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
        <Avatar className="w-8 h-8">
          <AvatarFallback>
            {message.senderName?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
          </AvatarFallback>
        </Avatar>
        
        <div className={`relative ${isOwn ? 'mr-2' : 'ml-2'}`}>
          <Card className={`${
            isOwn 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-secondary text-secondary-foreground'
          }`}>
            <CardHeader className="pb-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">{message.senderName}</span>
                <div className="flex items-center gap-1">
                  {message.isEdited && (
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      edited
                    </Badge>
                  )}
                  <span className="text-[10px] opacity-75">
                    {formatMessageTime(message.sentAt)}
                  </span>
                  {isOwn && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-4 w-4">
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {message.messageType === 'text' && onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(message)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => e.preventDefault()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Message</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this message? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDelete(message.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {message.messageType === 'text' ? (
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              ) : message.messageType === 'system' ? (
                <p className="text-sm italic opacity-80">{message.content}</p>
              ) : (
                <p className="text-sm">File message</p>
              )}
              
              {/* Attachments */}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((attachment) => (
                    <div 
                      key={attachment.id} 
                      className="flex items-center gap-2 p-2 rounded bg-muted/20"
                    >
                      <span className="text-lg">{getFileIcon(attachment.contentType)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">
                          {attachment.originalFileName}
                        </p>
                        <p className="text-[10px] opacity-75">
                          {formatFileSize(attachment.fileSize)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDownload(attachment)}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      {isOwn && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{attachment.originalFileName}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDeleteAttachment(attachment.id, message.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export const MessageThread: React.FC<MessageThreadProps> = ({
  conversationId,
  onEditMessage
}) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    isLoading,
    isError,
    error
  } = useConversationMessages(conversationId);
  
  const deleteMessageMutation = useDeleteMessage();
  const deleteAttachmentMutation = useDeleteAttachment();
  const markReadMutation = useMarkMessagesAsRead();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data]);

  // Mark unread messages as read
  useEffect(() => {
    if (data && user?.id) {
      const unreadMessages = data
        .filter(msg => !msg.isRead && msg.senderId !== user.id)
        .map(msg => msg.id);
      
      if (unreadMessages.length > 0) {
        markReadMutation.mutate({
          messageIds: unreadMessages,
          conversationId
        });
      }
    }
  }, [data, user?.id, conversationId]); // Removed markReadMutation from deps to prevent infinite loop

  const handleDeleteMessage = (messageId: string) => {
    deleteMessageMutation.mutate({ messageId, conversationId });
  };

  const handleDeleteAttachment = (attachmentId: string, messageId: string) => {
    deleteAttachmentMutation.mutate({ 
      attachmentId, 
      messageId, 
      conversationId 
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className="flex gap-2 max-w-[70%]">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-16 w-48" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-2">Failed to load messages</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Unknown error'}</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p>No messages yet</p>
        <p className="text-sm">Start the conversation by sending a message below.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-1">
        {data.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === user?.id}
            onEdit={onEditMessage}
            onDelete={handleDeleteMessage}
            onDeleteAttachment={handleDeleteAttachment}
          />
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  );
};