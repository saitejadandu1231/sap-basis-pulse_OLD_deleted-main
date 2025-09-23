import React, { useState } from 'react';
import { format, formatDistance } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  useConversations, 
  useUpdateConversationStatus 
} from '@/services/messagingHooks';
import { Conversation } from '@/services/messagingService';
import { useAuth } from '@/contexts/AuthContext';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
}

export const ConversationList: React.FC<ConversationListProps> = ({ 
  onSelectConversation,
  selectedConversationId
}) => {
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const pageSize = 10;
  
  const { 
    data, 
    isLoading, 
    isError,
    error
  } = useConversations(page, pageSize);
  
  const updateStatus = useUpdateConversationStatus();
  
  const handleStatusChange = (conversationId: string, isActive: boolean) => {
    updateStatus.mutate({ conversationId, isActive });
  };

  const formatDate = (dateString: string): string => {
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
      
      return format(date, 'MMM d, h:mm a');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };
  
  const getOtherPartyName = (conversation: Conversation, currentUser: any) => {
    if (!currentUser) return '';
    return currentUser.id === conversation.customerId 
      ? conversation.consultantName 
      : conversation.customerName;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="cursor-pointer bg-muted/30">
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-3 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500 mb-4">Failed to load conversations</p>
        <p className="text-sm text-muted-foreground">{(error as Error)?.message || 'Unknown error'}</p>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="mb-2">No conversations found</p>
        <p className="text-sm text-muted-foreground">
          When you create a support request, a conversation will be started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((conversation) => (
        <Card 
          key={conversation.id} 
          className={`cursor-pointer hover:bg-accent/10 transition-colors ${
            selectedConversationId === conversation.id ? 'border-primary bg-accent/20' : ''
          }`}
          onClick={() => onSelectConversation(conversation)}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-base">
                {getOtherPartyName(conversation, user)}
              </CardTitle>
              {conversation.unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {conversation.unreadCount} new
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs">
              Order: {conversation.orderNumber}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2 pt-0">
            <p className="text-sm line-clamp-2">
              {/* This would be the last message preview */}
              {/* Placeholder for now */}
              Latest message content...
            </p>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {formatDate(conversation.lastMessageAt)}
            </span>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleStatusChange(conversation.id, !conversation.isActive);
              }}
            >
              {conversation.isActive ? 'Archive' : 'Restore'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};