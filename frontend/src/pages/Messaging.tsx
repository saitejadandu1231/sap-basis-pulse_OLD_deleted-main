import React, { useState, useEffect } from 'react';
import { MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { MessageInput } from '@/components/messaging/MessageInput';
import { useUnreadMessageCount, useConversation } from '@/services/messagingHooks';
import { useMessagingEnabled } from '@/hooks/useFeatureFlags';
import { Conversation, Message } from '@/services/messagingService';
import { useSearchParams } from 'react-router-dom';

export const MessagingPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const { isEnabled: messagingEnabled, isLoading: messagingStatusLoading } = useMessagingEnabled();
  const conversationIdFromUrl = searchParams.get('conversation');
  const { data: unreadCount } = useUnreadMessageCount();
  
  // Query for specific conversation if URL has conversation param
  const { data: conversationFromUrl } = useConversation(conversationIdFromUrl || '');
  
  // Auto-select conversation from URL param
  useEffect(() => {
    if (conversationFromUrl && !selectedConversation) {
      setSelectedConversation(conversationFromUrl);
      setIsMobileView(true);
    }
  }, [conversationFromUrl, selectedConversation]);

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsMobileView(true);
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
    setIsMobileView(false);
    setEditingMessage(null);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Messages</h1>
          {unreadCount !== undefined && unreadCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {unreadCount} unread
            </Badge>
          )}
        </div>
      </div>

      {/* Show loading state while checking messaging status */}
      {messagingStatusLoading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading messaging status...</div>
        </div>
      )}

      {/* Show messaging disabled message */}
      {!messagingStatusLoading && !messagingEnabled && (
        <Card className="p-8 text-center">
          <CardContent className="space-y-4">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-semibold">Messaging Currently Unavailable</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              The messaging feature is currently disabled by your administrator. 
              Please contact your system administrator if you need access to messaging functionality.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Show normal messaging interface only when enabled */}
      {!messagingStatusLoading && messagingEnabled && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className={`lg:col-span-1 ${isMobileView ? 'hidden lg:block' : 'block'}`}>
          <CardHeader>
            <CardTitle className="text-lg">Conversations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[calc(100vh-300px)] overflow-y-auto">
              <ConversationList
                onSelectConversation={handleSelectConversation}
                selectedConversationId={selectedConversation?.id}
              />
            </div>
          </CardContent>
        </Card>

        {/* Message Thread */}
        <Card className={`lg:col-span-2 flex flex-col ${!isMobileView ? 'hidden lg:flex' : 'flex'}`}>
          {selectedConversation ? (
            <>
              <CardHeader className="flex-shrink-0">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden"
                    onClick={handleBackToList}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {selectedConversation.customerName === 'Unknown' 
                        ? selectedConversation.consultantName 
                        : selectedConversation.customerName}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Order: {selectedConversation.orderNumber || selectedConversation.subject}
                    </p>
                  </div>
                  {selectedConversation.unreadCount > 0 && (
                    <Badge variant="secondary">
                      {selectedConversation.unreadCount} unread
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <Separator />
              <div className="flex-1 flex flex-col min-h-0">
                <MessageThread
                  conversationId={selectedConversation.id}
                  onEditMessage={handleEditMessage}
                />
                <MessageInput
                  conversationId={selectedConversation.id}
                  disabled={!selectedConversation.isActive}
                />
              </div>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center text-center">
              <div className="space-y-4">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-muted-foreground">
                    Select a conversation from the list to start messaging
                  </p>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
      )}

      {/* Edit Message Modal/Dialog would go here if needed */}
      {editingMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Edit Message</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Editing functionality would be implemented here
              </p>
              <div className="flex gap-2 justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setEditingMessage(null)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setEditingMessage(null)}>
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};