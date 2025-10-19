import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  FileText,
  Image,
  Archive
} from 'lucide-react';
import { useUploadFile, useFileUploadSettings } from '@/hooks/useFileUpload';
import { toast } from 'sonner';

interface FileUploadProps {
  orderId: string;
  onFileUploaded?: (file: any) => void;
  className?: string;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const getFileIcon = (contentType: string) => {
  if (contentType.startsWith('image/')) return <Image className="w-4 h-4" />;
  if (contentType === 'application/pdf') return <FileText className="w-4 h-4" />;
  if (contentType.includes('zip') || contentType.includes('rar')) return <Archive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const FileUpload: React.FC<FileUploadProps> = ({
  orderId,
  onFileUploaded,
  className,
  disabled = false
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { data: settings, isLoading: settingsLoading } = useFileUploadSettings();
  const uploadFile = useUploadFile();

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    if (disabled || !settings?.isEnabled) return;
    
    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      );
      setError(errorMessages.join('; '));
      return;
    }

    // Check file count limit
    if (uploadingFiles.length + acceptedFiles.length > (settings?.maxFilesPerTicket || 5)) {
      setError(`Maximum ${settings?.maxFilesPerTicket || 5} files allowed per ticket`);
      return;
    }

    // Start uploading files
    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // Upload files one by one
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // Update progress
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { ...uf, progress: 50 } : uf
        ));

        const result = await uploadFile.mutateAsync({ orderId, file });

        // Mark as success
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { ...uf, progress: 100, status: 'success' } : uf
        ));

        onFileUploaded?.(result);
        toast.success(`${file.name} uploaded successfully`);

      } catch (error: any) {
        // Mark as error
        setUploadingFiles(prev => prev.map(uf => 
          uf.file === file ? { 
            ...uf, 
            status: 'error', 
            error: error.response?.data?.message || error.message || 'Upload failed' 
          } : uf
        ));

        toast.error(`Failed to upload ${file.name}: ${error.response?.data || error.message}`);
      }
    }

    // Clear completed uploads after 3 seconds
    setTimeout(() => {
      setUploadingFiles(prev => prev.filter(uf => uf.status === 'uploading'));
    }, 3000);

  }, [orderId, uploadFile, onFileUploaded, settings, disabled, uploadingFiles.length]);

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(uf => uf.file !== file));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: settings?.allowedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>) || {},
    maxSize: settings?.maxFileSizeBytes || 10 * 1024 * 1024,
    disabled: disabled || !settings?.isEnabled || settingsLoading,
    multiple: true
  });

  if (settingsLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading upload settings...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings?.isEnabled) {
    return null; // Don't show component if uploads are disabled
  }

  const maxSizeMB = Math.round((settings.maxFileSizeBytes || 10 * 1024 * 1024) / (1024 * 1024));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center text-sm">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </CardTitle>
        <CardDescription className="text-xs">
          Add supporting documents, screenshots, or logs to help resolve your issue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : 'border-gray-300 dark:border-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'}
          `}
        >
          <input {...getInputProps()} />
          <Upload className="h-6 w-6 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'
            }
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Max {maxSizeMB}MB per file, up to {settings.maxFilesPerTicket} files total
          </p>
        </div>

        {/* File Type Info */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded">
          <div className="font-medium mb-1">Supported formats:</div>
          <div>Images (JPG, PNG, GIF), Documents (PDF, DOC, XLS), Text files, Archives (ZIP)</div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Uploading Files */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Uploading Files</h4>
            {uploadingFiles.map((uploadingFile, index) => (
              <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {getFileIcon(uploadingFile.file.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">{uploadingFile.file.name}</p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {formatFileSize(uploadingFile.file.size)}
                      </span>
                      {uploadingFile.status === 'success' && (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      )}
                      {uploadingFile.status === 'error' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {uploadingFile.status === 'uploading' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeUploadingFile(uploadingFile.file)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {uploadingFile.status === 'uploading' && (
                    <Progress value={uploadingFile.progress} className="h-2" />
                  )}
                  
                  {uploadingFile.status === 'error' && uploadingFile.error && (
                    <p className="text-xs text-red-500 mt-1">{uploadingFile.error}</p>
                  )}
                  
                  {uploadingFile.status === 'success' && (
                    <p className="text-xs text-green-600 mt-1">Upload completed</p>
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

export default FileUpload;