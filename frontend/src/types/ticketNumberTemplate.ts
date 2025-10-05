// API types for ticket number templates
export interface TicketNumberTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  supportTypeId?: string;
  supportTypeName?: string;
  supportCategoryId?: string;
  supportCategoryName?: string;
  supportSubOptionId?: string;
  supportSubOptionName?: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  currentSequence: number;
  dateFormat: string;
  sequenceFormat: string;
  createdAt: string;
  updatedAt?: string;
  createdByUserName: string;
  updatedByUserName?: string;
}

export interface CreateTicketNumberTemplate {
  name: string;
  description?: string;
  template: string;
  supportTypeId?: string;
  supportCategoryId?: string;
  supportSubOptionId?: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  dateFormat: string;
  sequenceFormat: string;
}

export interface UpdateTicketNumberTemplate {
  name: string;
  description?: string;
  template: string;
  supportTypeId?: string;
  supportCategoryId?: string;
  supportSubOptionId?: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  dateFormat: string;
  sequenceFormat: string;
}

export interface TicketNumberTemplatePreview {
  template: string;
  dateFormat: string;
  sequenceFormat: string;
  supportTypeId?: string;
  supportCategoryId?: string;
  supportSubOptionId?: string;
}

export interface TicketNumberPreviewResult {
  previewNumber: string;
  isValid: boolean;
  errorMessage?: string;
}

export interface TemplateFormData {
  name: string;
  description: string;
  template: string;
  supportTypeId: string;
  supportCategoryId: string;
  supportSubOptionId: string;
  priority: number;
  isActive: boolean;
  isDefault: boolean;
  dateFormat: string;
  sequenceFormat: string;
}

// Available template placeholders
export const TEMPLATE_PLACEHOLDERS = [
  { value: '{SupportType}', label: 'Support Type', description: 'Short name of the support type (e.g., SAPRISE, SAPGROW)' },
  { value: '{Category}', label: 'Category', description: 'Short name of the category (e.g., BASIS, DB, OS)' },
  { value: '{SubType}', label: 'Sub Type', description: 'Short name of the sub-option (e.g., SR, INC)' },
  { value: '{Date}', label: 'Date', description: 'Current date in specified format (e.g., 2025-10-05)' },
  { value: '{Sequence}', label: 'Sequence', description: 'Auto-incrementing number in specified format (e.g., 0001)' }
] as const;

// Common date format options
export const DATE_FORMAT_OPTIONS = [
  { value: 'yyyy-MM-dd', label: '2025-10-05', description: 'Full date with dashes' },
  { value: 'yyyyMMdd', label: '20251005', description: 'Full date without separators' },
  { value: 'yyyy-MM', label: '2025-10', description: 'Year and month only' },
  { value: 'yyyy', label: '2025', description: 'Year only' },
  { value: 'MMdd', label: '1005', description: 'Month and day only' }
] as const;

// Common sequence format options
export const SEQUENCE_FORMAT_OPTIONS = [
  { value: '0', label: '1', description: 'Simple number (1, 2, 3...)' },
  { value: '00', label: '01', description: '2-digit padded (01, 02, 03...)' },
  { value: '000', label: '001', description: '3-digit padded (001, 002, 003...)' },
  { value: '0000', label: '0001', description: '4-digit padded (0001, 0002, 0003...)' },
  { value: '00000', label: '00001', description: '5-digit padded (00001, 00002, 00003...)' }
] as const;