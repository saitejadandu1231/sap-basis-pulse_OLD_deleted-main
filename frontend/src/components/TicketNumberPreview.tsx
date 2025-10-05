import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Eye, RefreshCw } from 'lucide-react';
import { usePreviewTicketNumber } from '../hooks/useTicketNumberTemplate';
import type { TicketNumberTemplatePreview } from '../types/ticketNumberTemplate';

interface TicketNumberPreviewProps {
  template: string;
  dateFormat: string;
  sequenceFormat: string;
  supportTypeId?: string;
  supportCategoryId?: string;
  supportSubOptionId?: string;
  className?: string;
}

export function TicketNumberPreview({
  template,
  dateFormat,
  sequenceFormat,
  supportTypeId,
  supportCategoryId,
  supportSubOptionId,
  className
}: TicketNumberPreviewProps) {
  const [previewData, setPreviewData] = useState<TicketNumberTemplatePreview | null>(null);
  const previewMutation = usePreviewTicketNumber();

  // Auto-generate preview when inputs change
  useEffect(() => {
    if (template && dateFormat && sequenceFormat) {
      const data: TicketNumberTemplatePreview = {
        template,
        dateFormat,
        sequenceFormat,
        supportTypeId: supportTypeId || undefined,
        supportCategoryId: supportCategoryId || undefined,
        supportSubOptionId: supportSubOptionId || undefined
      };
      setPreviewData(data);
      previewMutation.mutate(data);
    }
  }, [template, dateFormat, sequenceFormat, supportTypeId, supportCategoryId, supportSubOptionId]);

  const handleRefreshPreview = () => {
    if (previewData) {
      previewMutation.mutate(previewData);
    }
  };

  const result = previewMutation.data;

  if (!template) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Enter a template pattern to see preview
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Preview
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefreshPreview}
            disabled={previewMutation.isPending}
            className="ml-auto h-6 w-6 p-0"
          >
            <RefreshCw className={`h-3 w-3 ${previewMutation.isPending ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {previewMutation.isPending ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            Generating preview...
          </div>
        ) : result ? (
          <div className="space-y-3">
            {result.isValid ? (
              <div className="space-y-2">
                <Badge variant="secondary" className="text-sm font-mono bg-green-50 text-green-700 border-green-200">
                  {result.previewNumber}
                </Badge>
                <div className="text-xs text-muted-foreground">
                  Sample ticket number based on current template and settings
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Badge variant="destructive" className="text-sm">
                  Invalid Template
                </Badge>
                <div className="text-xs text-red-600">
                  {result.errorMessage || 'Unknown validation error'}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">
            Click refresh to generate preview
          </div>
        )}
        
        {/* Template breakdown */}
        {template && (
          <div className="mt-4 pt-3 border-t">
            <div className="text-xs font-medium text-muted-foreground mb-2">Template Pattern:</div>
            <div className="text-xs font-mono bg-muted p-2 rounded text-muted-foreground break-all">
              {template}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Date format: <code>{dateFormat}</code> • Sequence format: <code>{sequenceFormat}</code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}