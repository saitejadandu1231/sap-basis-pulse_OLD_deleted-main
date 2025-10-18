import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, UserX, UserCheck } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'default' | 'destructive' | 'activate' | 'deactivate';
  userName?: string;
  action?: 'activate' | 'deactivate';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  userName,
  action
}: ConfirmDialogProps) {
  const getIcon = () => {
    switch (variant) {
      case 'activate':
        return <UserCheck className="w-6 h-6 text-green-600" />;
      case 'deactivate':
        return <UserX className="w-6 h-6 text-orange-600" />;
      case 'destructive':
        return <AlertTriangle className="w-6 h-6 text-red-600" />;
      default:
        return <CheckCircle className="w-6 h-6 text-blue-600" />;
    }
  };

  const getConfirmButtonVariant = () => {
    switch (variant) {
      case 'destructive':
      case 'deactivate':
        return 'destructive';
      case 'activate':
        return 'default';
      default:
        return 'default';
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {getIcon()}
            {title}
          </DialogTitle>
          <DialogDescription className="text-left pt-2">
            {message}
            {userName && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="font-medium">User:</span>
                  <span className="text-foreground">{userName}</span>
                </div>
                {action && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium">Action:</span>
                    <span className={`text-foreground capitalize ${
                      action === 'activate' ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {action}
                    </span>
                  </div>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={getConfirmButtonVariant()}
            onClick={handleConfirm}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}