import React, { useState } from 'react';
import { Button } from './button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TruncatedTextProps {
  text: string;
  maxLength?: number;
  maxLines?: number;
  className?: string;
  showMoreText?: string;
  showLessText?: string;
  expandButtonClassName?: string;
}

export function TruncatedText({
  text,
  maxLength = 300,
  maxLines,
  className,
  showMoreText = "Show More",
  showLessText = "Show Less",
  expandButtonClassName
}: TruncatedTextProps) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = maxLines ? text.split('\n').length > maxLines || text.length > maxLength : text.length > maxLength;

  if (!needsTruncation) {
    return <p className={cn(className)} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</p>;
  }

  return (
    <div className="relative">
      <div className={cn(className)}>
        <p style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {expanded ? text : text.substring(0, maxLength)}
          {!expanded && text.length > maxLength && '...'}
        </p>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        className={cn("text-xs mt-1", expandButtonClassName)}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <><ChevronUp className="w-3 h-3 mr-1" /> {showLessText}</>
        ) : (
          <><ChevronDown className="w-3 h-3 mr-1" /> {showMoreText}</>
        )}
      </Button>
    </div>
  );
}