import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, File } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  useSendMessage,
  useUploadAttachment,
  useFileUploadInfo,
} from '@/services/messagingHooks';

interface MessageInputProps {
  conversationId: string;
  disabled?: boolean;
}

interface PendingFile {
  file: File;
  id: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  conversationId,
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const sendMessageMutation = useSendMessage();
  const uploadAttachmentMutation = useUploadAttachment();
  const { data: uploadInfo } = useFileUploadInfo();
  
  const isLoading = sendMessageMutation.isPending || uploadAttachmentMutation.isPending;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isValidFile = (file: File): { valid: boolean; error?: string } => {
    if (!uploadInfo) return { valid: true }; // Allow if info not loaded yet
    
    if (!uploadInfo.allowedFileTypes.includes(file.type)) {
      return { 
        valid: false, 
        error: `File type ${file.type} is not allowed` 
      };
    }
    
    if (file.size > uploadInfo.maxFileSize) {
      return { 
        valid: false, 
        error: `File size exceeds limit of ${uploadInfo.maxFileSizeMB}MB` 
      };
    }
    
    return { valid: true };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newPendingFiles: PendingFile[] = [];
    
    Array.from(files).forEach(file => {
      const validation = isValidFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        return;
      }
      
      newPendingFiles.push({
        file,
        id: Math.random().toString(36).substring(7)
      });
    });
    
    setPendingFiles(prev => [...prev, ...newPendingFiles]);
    
    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (fileId: string) => {
    setPendingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleSendMessage = async () => {
    if ((!message.trim() && pendingFiles.length === 0) || disabled) return;

    try {
      // Send the message first
      const messageResponse = await sendMessageMutation.mutateAsync({
        conversationId,
        content: message.trim() || (pendingFiles.length > 0 ? `Shared ${pendingFiles.length} file(s)` : ''),
        messageType: pendingFiles.length > 0 ? 'file' : 'text'
      });

      // Upload attachments if any
      if (pendingFiles.length > 0) {
        const uploadPromises = pendingFiles.map(pendingFile => 
          uploadAttachmentMutation.mutateAsync({
            messageId: messageResponse.id,
            file: pendingFile.file,
            conversationId
          })
        );
        
        await Promise.all(uploadPromises);
        toast.success(`Message sent with ${pendingFiles.length} attachment(s)`);
      } else {
        toast.success('Message sent');
      }

      // Clear the form
      setMessage('');
      setPendingFiles([]);
      
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📈';
    return '📎';
  };

  return (
    <Card className="m-4 mt-0">
      <CardContent className="p-4">
        {/* Pending files preview */}
        {pendingFiles.length > 0 && (
          <div className="mb-4 space-y-2">
            <p className="text-sm font-medium">Files to upload:</p>
            <div className="space-y-1">
              {pendingFiles.map(pendingFile => (
                <div
                  key={pendingFile.id}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <span className="text-lg">{getFileIcon(pendingFile.file)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pendingFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(pendingFile.file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemoveFile(pendingFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message input */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[40px] resize-none"
              disabled={disabled || isLoading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={disabled || isLoading || (!message.trim() && pendingFiles.length === 0)}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={uploadInfo?.allowedFileTypes.join(',') || '*'}
        />

        {/* Upload info display */}
        {uploadInfo && (
          <div className="mt-2 text-xs text-muted-foreground">
            Max file size: {uploadInfo.maxFileSizeMB}MB • 
            Allowed types: {uploadInfo.allowedFileTypes.length} types supported
          </div>
        )}
      </CardContent>
    </Card>
  );
};