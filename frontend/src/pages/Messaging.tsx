import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ConversationList } from '@/components/messaging/ConversationList';
import { MessageThread } from '@/components/messaging/MessageThread';
import { MessageInput } from '@/components/messaging/MessageInput';
import { useUnreadMessageCount, useConversation, useConversationByOrder, useCreateOrGetConversationForOrder } from '@/services/messagingHooks';
import { useMessagingEnabled } from '@/hooks/useFeatureFlags';
import { Conversation, Message } from '@/services/messagingService';
import { useSearchParams } from 'react-router-dom';
import PageLayout from '@/components/layout/PageLayout';

export const MessagingPage: React.FC = () => {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [processedParams, setProcessedParams] = useState<{conversationId?: string, orderId?: string}>({});
  
  const { isEnabled: messagingEnabled, isLoading: messagingStatusLoading } = useMessagingEnabled();
  const conversationIdFromUrl = searchParams.get('conversation');
  const orderIdFromUrl = searchParams.get('orderId');
  const { data: unreadCount } = useUnreadMessageCount();
  
  // Query for specific conversation if URL has conversation param
  const { data: conversationFromUrl } = useConversation(conversationIdFromUrl || '');
  
  // Query for conversation by order ID if URL has orderId param
  const { data: conversationFromOrder, isLoading: isLoadingOrderConversation, error: orderConversationError } = useConversationByOrder(orderIdFromUrl || '');
  
  // Mutation to create conversation for order if it doesn't exist
  const createOrGetOrderConversation = useCreateOrGetConversationForOrder();
  
  // Track if we're currently in the middle of processing URL params to avoid loops
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-select conversation from URL params - optimized to prevent infinite loops
  useEffect(() => {
    
    // Skip if we're already processing URL params to avoid recursive calls
    if (isProcessing) {
      
      console.log('Skipping effect due to active processing');
      
      return;
    
    }
    
    
    const currentConversationId = conversationIdFromUrl || '';
    
    const currentOrderId = orderIdFromUrl || '';
    
    
    console.log('MessagingPage useEffect:', {
      
      currentConversationId,
      
      currentOrderId,
      
      processedParams,
      
      inProgress: isProcessing,
      
      conversationFromUrl: !!conversationFromUrl,
      
      conversationFromOrder: !!conversationFromOrder
    
    });

    
    
    // Skip if we've already processed these exact parameters
    if (processedParams.conversationId === currentConversationId && processedParams.orderId === currentOrderId) {
      
      console.log('Already processed these params, skipping');
      
      return;
    
    }

    
    
    // CASE 1: Direct conversation link
    if (currentConversationId && conversationFromUrl && !selectedConversation) {
      
      console.log('Setting conversation from URL ID:', currentConversationId);
      
      setIsProcessing(true);
      
      setSelectedConversation(conversationFromUrl);
      
      setIsMobileView(true);
      
      setProcessedParams({ conversationId: currentConversationId, orderId: '' });
      
      setTimeout(() => setIsProcessing(false), 100); // Prevent immediate re-rendering loop
      
      return;
    
    }
    
    
    // CASE 2: Order ID link with existing conversation
    if (currentOrderId && conversationFromOrder && !selectedConversation) {
      
      console.log('Setting conversation from order ID:', currentOrderId);
      
      setIsProcessing(true);
      
      setSelectedConversation(conversationFromOrder);
      
      setIsMobileView(true);
      
      setProcessedParams({ conversationId: conversationFromOrder.id, orderId: currentOrderId });
      
      setTimeout(() => setIsProcessing(false), 100);
      
      return;
    
    }
    
    
    // CASE 3: Order ID link with no conversation yet
    if (currentOrderId && orderConversationError && !isLoadingOrderConversation && !createOrGetOrderConversation.isPending) {
      
      if (processedParams.orderId !== currentOrderId) {
        
        console.log('Creating conversation for order:', currentOrderId);
        
        setIsProcessing(true);
        
        setProcessedParams({ conversationId: '', orderId: currentOrderId });
        
        createOrGetOrderConversation.mutate(currentOrderId);
        
        setTimeout(() => setIsProcessing(false), 100);
      
      }
    
    }
  
  }, [conversationIdFromUrl, orderIdFromUrl, conversationFromUrl, conversationFromOrder, selectedConversation, orderConversationError, isLoadingOrderConversation, createOrGetOrderConversation.isPending]);

  // Completely separate URL update effect with dedicated state to ensure it runs exactly once
  const [hasUpdatedUrl, setHasUpdatedUrl] = useState(false);
  
  useEffect(() => {
    // Only update URL once per conversation selection and only when we have an order ID to replace
    if (selectedConversation && orderIdFromUrl && !hasUpdatedUrl) {
      console.log('Updating URL from order to conversation ID:', selectedConversation.id);
      
      // Mark as updated first to prevent further calls
      setHasUpdatedUrl(true);
      
      // Timeout to ensure state updates don't conflict
      setTimeout(() => {
        setSearchParams(prev => {
          // Extra safety check to avoid unnecessary URL updates
          if (prev.get('conversation') === selectedConversation.id) {
            return prev;
          }
          const newParams = new URLSearchParams();
          newParams.set('conversation', selectedConversation.id);
          return newParams;
        });
      }, 100);
    }
  }, [selectedConversation?.id, orderIdFromUrl]);

  // Track the last successful conversation creation to avoid duplicate processing
  const lastSuccessfulConversationRef = useRef<string | null>(null);
  
  // Handle successful conversation creation separately
  useEffect(() => {
    if (createOrGetOrderConversation.isSuccess && createOrGetOrderConversation.data && !selectedConversation) {
      const newConversationId = createOrGetOrderConversation.data.id;
      
      // Prevent processing the same successful result multiple times
      if (lastSuccessfulConversationRef.current === newConversationId) {
        return;
      }
      
      console.log('Conversation created successfully:', newConversationId);
      lastSuccessfulConversationRef.current = newConversationId;
      
      // Batch updates to prevent cascading re-renders
      setHasUpdatedUrl(true); // Prevent URL update effect from running again
      setSelectedConversation(createOrGetOrderConversation.data);
      setIsMobileView(true);
      setProcessedParams({ conversationId: newConversationId, orderId: '' });
      
      // Update URL only after a small delay to avoid race conditions
      setTimeout(() => {
        setSearchParams({ conversation: newConversationId });
      }, 200);
    }
  }, [createOrGetOrderConversation.isSuccess, createOrGetOrderConversation.data]);

  // Handle conversation creation errors separately
  useEffect(() => {
    if (createOrGetOrderConversation.isError) {
      console.error('Failed to create conversation:', createOrGetOrderConversation.error);
      // Reset processed params on error so user can retry
      setProcessedParams({});
    }
  }, [createOrGetOrderConversation.isError]);

  // Remove the reset effect entirely as it's causing more problems than it solves
  // When we need to process a new order ID, we'll handle it in the main effect

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
    <PageLayout
      title="Messages"
      description="Communicate with consultants and customers"
      showSidebar={true}
    >
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </div>
        </div>

        {/* Show loading state while checking messaging status or creating conversation */}
        {(messagingStatusLoading || (orderIdFromUrl && (isLoadingOrderConversation || createOrGetOrderConversation.isPending))) && (
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">
              {messagingStatusLoading ? 'Loading messaging status...' : 'Setting up conversation...'}
            </div>
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

        {/* Show error message if conversation creation fails */}
        {createOrGetOrderConversation.isError && (
          <Card className="p-8 text-center border-red-200 bg-red-50">
            <CardContent className="space-y-4">
              <AlertCircle className="h-16 w-16 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-red-900">Failed to Create Conversation</h2>
              <p className="text-red-700 max-w-md mx-auto">
                {createOrGetOrderConversation.error?.response?.data?.error || 
                 "We couldn't create a conversation for this ticket. The order ID may be invalid or you don't have permission to access it."}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button 
                  onClick={() => {
                    setProcessedParams({});
                    setHasUpdatedUrl(false);
                    createOrGetOrderConversation.mutate(orderIdFromUrl!);
                  }}
                >
                  Try Again
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    // Clear URL params and go back to main conversation list
                    setSearchParams({});
                    setProcessedParams({});
                    setHasUpdatedUrl(false);
                  }}
                >
                  Back to Messages
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show normal messaging interface only when enabled and not loading */}
        {!messagingStatusLoading && messagingEnabled && !(orderIdFromUrl && (isLoadingOrderConversation || createOrGetOrderConversation.isPending)) && (
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
    </PageLayout>
  );
};