import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  File, 
  Download, 
  Trash2, 
  Eye, 
  FileText, 
  Image, 
  Archive,
  AlertCircle,
  Loader2,
  Upload
} from 'lucide-react';
import { useTicketAttachments, useDeleteAttachment, type TicketAttachment } from '@/hooks/useFileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface FileViewerProps {
  orderId: string;
  className?: string;
  showUploadArea?: boolean;
  onUploadClick?: () => void;
}

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (contentType === 'application/pdf') return <FileText className="w-4 h-4" />;
  if (contentType.includes('zip') || contentType.includes('rar')) return <Archive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const getFileTypeLabel = (contentType: string): string => {
  if (contentType.startsWith('image/')) return 'Image';
  if (contentType === 'application/pdf') return 'PDF';
  if (contentType.includes('word')) return 'Word';
  if (contentType.includes('excel') || contentType.includes('spreadsheet')) return 'Excel';
  if (contentType.includes('zip')) return 'ZIP';
  if (contentType.includes('text')) return 'Text';
  return 'File';
};

export const FileViewer: React.FC<FileViewerProps> = ({
  orderId,
  className,
  showUploadArea = false,
  onUploadClick
}) => {
  const { user, userRole } = useAuth();
  const { data: attachments, isLoading, error } = useTicketAttachments(orderId);
  const deleteAttachment = useDeleteAttachment();

  const handleDelete = async (attachmentId: string, fileName: string) => {
    if (!confirm(`Are you sure you want to delete "${fileName}"?`)) return;

    try {
      await deleteAttachment.mutateAsync(attachmentId);
      toast.success('File deleted successfully');
    } catch (error: any) {
      toast.error(`Failed to delete file: ${error.response?.data || error.message}`);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    // Open in new tab for download
    window.open(fileUrl, '_blank');
  };

  const handleView = (fileUrl: string, contentType: string) => {
    // For images and PDFs, open in new tab for viewing
    if (contentType.startsWith('image/') || contentType === 'application/pdf') {
      window.open(fileUrl, '_blank');
    } else {
      // For other files, trigger download
      window.open(fileUrl, '_blank');
    }
  };

  const canDeleteFile = (attachment: TicketAttachment): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'consultant') return true; // Consultants can delete any file
    if (userRole === 'customer' && attachment.uploadedById === user?.id) return true;
    return false;
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load attachments. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center text-sm">
              <File className="w-4 h-4 mr-2" />
              Attached Files ({attachments?.length || 0})
            </CardTitle>
            <CardDescription className="text-xs">
              Supporting documents and files for this ticket
            </CardDescription>
          </div>
          {showUploadArea && onUploadClick && (
            <Button variant="outline" size="sm" onClick={onUploadClick}>
              <Upload className="w-4 h-4 mr-1" />
              Add Files
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!attachments || attachments.length === 0 ? (
          <div className="text-center py-6">
            <File className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No files attached</p>
            {showUploadArea && onUploadClick && (
              <Button variant="outline" size="sm" onClick={onUploadClick}>
                <Upload className="w-4 h-4 mr-1" />
                Upload first file
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border"
              >
                {getFileIcon(attachment.contentType)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {attachment.originalFileName}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {getFileTypeLabel(attachment.contentType)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-3 text-xs text-gray-500">
                    <span>{attachment.fileSizeFormatted}</span>
                    <span>•</span>
                    <span>Uploaded by {attachment.uploadedByName}</span>
                    <span>•</span>
                    <span>{new Date(attachment.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(attachment.fileUrl, attachment.contentType)}
                    className="h-8 w-8 p-0"
                    title="View file"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment.fileUrl, attachment.originalFileName)}
                    className="h-8 w-8 p-0"
                    title="Download file"
                  >
                    <Download className="w-4 h-4" />
                  </Button>

                  {canDeleteFile(attachment) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id, attachment.originalFileName)}
                      disabled={deleteAttachment.isPending}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete file"
                    >
                      {deleteAttachment.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileViewer;