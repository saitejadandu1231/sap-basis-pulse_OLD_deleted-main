import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { AlertCircle, Plus } from 'lucide-react';
import { TicketNumberPreview } from './TicketNumberPreview';
import { useSupportTypes, useSupportCategories, useSupportSubOptions } from '../hooks/useSupport';
import type { 
  TicketNumberTemplate, 
  CreateTicketNumberTemplate, 
  UpdateTicketNumberTemplate,
  TemplateFormData
} from '../types/ticketNumberTemplate';
import { 
  TEMPLATE_PLACEHOLDERS, 
  DATE_FORMAT_OPTIONS, 
  SEQUENCE_FORMAT_OPTIONS 
} from '../types/ticketNumberTemplate';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  template: z.string().min(1, 'Template is required').max(200, 'Template must be less than 200 characters'),
  supportTypeId: z.string().optional(),
  supportCategoryId: z.string().optional(),
  supportSubOptionId: z.string().optional(),
  priority: z.number().min(0).max(1000),
  isActive: z.boolean(),
  isDefault: z.boolean(),
  dateFormat: z.string().min(1, 'Date format is required'),
  sequenceFormat: z.string().min(1, 'Sequence format is required'),
});

interface TicketNumberTemplateFormProps {
  template?: TicketNumberTemplate;
  onSubmit: (data: CreateTicketNumberTemplate | UpdateTicketNumberTemplate) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TicketNumberTemplateForm({ 
  template, 
  onSubmit, 
  onCancel, 
  isLoading 
}: TicketNumberTemplateFormProps) {
  const [selectedSupportType, setSelectedSupportType] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const { data: supportTypes = [] } = useSupportTypes();
  const { data: categories = [] } = useSupportCategories(selectedSupportType || null);
  const { data: subOptions = [] } = useSupportSubOptions(selectedSupportType || null);

  const form = useForm<TemplateFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: template?.name || '',
      description: template?.description || '',
      template: template?.template || '',
      supportTypeId: template?.supportTypeId || '',
      supportCategoryId: template?.supportCategoryId || '',
      supportSubOptionId: template?.supportSubOptionId || '',
      priority: template?.priority || 0,
      isActive: template?.isActive ?? true,
      isDefault: template?.isDefault || false,
      dateFormat: template?.dateFormat || 'yyyy-MM-dd',
      sequenceFormat: template?.sequenceFormat || '0000',
    }
  });

  // Watch form values for preview
  const watchedValues = form.watch();

  // Update local state when form values change
  useEffect(() => {
    setSelectedSupportType(watchedValues.supportTypeId || '');
    setSelectedCategory(watchedValues.supportCategoryId || '');
  }, [watchedValues.supportTypeId, watchedValues.supportCategoryId]);

  // Get available categories for selected support type (from categories hook)
  const availableCategories = categories || [];

  // Filter sub-options for selected category  
  const availableSubOptions = selectedCategory
    ? (subOptions || []).filter(s => s.supportCategoryId === selectedCategory)
    : [];

  // Clear dependent fields when parent changes
  useEffect(() => {
    if (selectedSupportType !== watchedValues.supportTypeId) {
      form.setValue('supportCategoryId', '');
      form.setValue('supportSubOptionId', '');
      setSelectedCategory('');
    }
  }, [selectedSupportType, form]);

  useEffect(() => {
    if (selectedCategory !== watchedValues.supportCategoryId) {
      form.setValue('supportSubOptionId', '');
    }
  }, [selectedCategory, form]);

  const handleSubmit = (data: TemplateFormData) => {
    const submitData = {
      name: data.name,
      description: data.description || undefined,
      template: data.template,
      supportTypeId: (data.supportTypeId && data.supportTypeId !== 'all') ? data.supportTypeId : undefined,
      supportCategoryId: (data.supportCategoryId && data.supportCategoryId !== 'all') ? data.supportCategoryId : undefined,
      supportSubOptionId: (data.supportSubOptionId && data.supportSubOptionId !== 'all') ? data.supportSubOptionId : undefined,
      priority: data.priority,
      isActive: data.isActive,
      isDefault: data.isDefault,
      dateFormat: data.dateFormat,
      sequenceFormat: data.sequenceFormat,
    };
    onSubmit(submitData);
  };

  const addPlaceholder = (placeholder: string) => {
    const currentTemplate = form.getValues('template');
    form.setValue('template', currentTemplate + placeholder);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {template ? 'Edit Template' : 'Create Template'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...form.register('name')}
                      placeholder="e.g., Service Request Template"
                    />
                    {form.formState.errors.name && (
                      <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      {...form.register('description')}
                      placeholder="Optional description of when this template is used"
                      rows={2}
                    />
                    {form.formState.errors.description && (
                      <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Template Pattern */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="template">Template Pattern *</Label>
                    <Textarea
                      id="template"
                      {...form.register('template')}
                      placeholder="e.g., SR-{Category}-{SubType}-{Date}-{Sequence}"
                      rows={2}
                      className="font-mono"
                    />
                    {form.formState.errors.template && (
                      <p className="text-sm text-red-600">{form.formState.errors.template.message}</p>
                    )}
                    
                    {/* Placeholder buttons */}
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Available Placeholders:</div>
                      <div className="flex flex-wrap gap-1">
                        {TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                          <Button
                            key={placeholder.value}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => addPlaceholder(placeholder.value)}
                            title={placeholder.description}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            {placeholder.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Date Format *</Label>
                      <Select 
                        value={watchedValues.dateFormat} 
                        onValueChange={(value) => form.setValue('dateFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {DATE_FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono">{option.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="sequenceFormat">Sequence Format *</Label>
                      <Select 
                        value={watchedValues.sequenceFormat} 
                        onValueChange={(value) => form.setValue('sequenceFormat', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEQUENCE_FORMAT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center justify-between w-full">
                                <span className="font-mono">{option.label}</span>
                                <span className="text-xs text-muted-foreground ml-2">{option.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Scope & Matching */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Template Scope</Label>
                    <p className="text-xs text-muted-foreground">
                      Leave fields empty to make this template apply to all types/categories
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="supportTypeId">Support Type</Label>
                      <Select
                        value={watchedValues.supportTypeId || 'all'}
                        onValueChange={(value) => {
                          const actualValue = value === 'all' ? '' : value;
                          form.setValue('supportTypeId', actualValue);
                          setSelectedSupportType(actualValue);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any support type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any support type</SelectItem>
                          {(supportTypes || [])
                            .filter(type => type?.id && type.id.trim() !== '')
                            .map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supportCategoryId">Category</Label>
                      <Select
                        value={watchedValues.supportCategoryId || 'all'}
                        onValueChange={(value) => {
                          const actualValue = value === 'all' ? '' : value;
                          form.setValue('supportCategoryId', actualValue);
                          setSelectedCategory(actualValue);
                        }}
                        disabled={!selectedSupportType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any category</SelectItem>
                          {availableCategories
                            .filter(category => category?.id && category.id.trim() !== '')
                            .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="supportSubOptionId">Sub-Option</Label>
                      <Select
                        value={watchedValues.supportSubOptionId || 'all'}
                        onValueChange={(value) => {
                          const actualValue = value === 'all' ? '' : value;
                          form.setValue('supportSubOptionId', actualValue);
                        }}
                        disabled={!selectedCategory}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Any sub-option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any sub-option</SelectItem>
                          {availableSubOptions
                            .filter(subOption => subOption?.id && subOption.id.trim() !== '')
                            .map((subOption) => (
                            <SelectItem key={subOption.id} value={subOption.id}>
                              {subOption.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Input
                      id="priority"
                      type="number"
                      min="0"
                      max="1000"
                      {...form.register('priority', { valueAsNumber: true })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                      Higher numbers have priority when multiple templates match
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isActive">Active</Label>
                      <p className="text-xs text-muted-foreground">
                        Only active templates will be used
                      </p>
                    </div>
                    <Switch
                      id="isActive"
                      checked={watchedValues.isActive}
                      onCheckedChange={(checked) => form.setValue('isActive', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="isDefault">Default Template</Label>
                      <p className="text-xs text-muted-foreground">
                        Used as fallback when no specific template matches
                      </p>
                    </div>
                    <Switch
                      id="isDefault"
                      checked={watchedValues.isDefault}
                      onCheckedChange={(checked) => form.setValue('isDefault', checked)}
                    />
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {template ? 'Update Template' : 'Create Template'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <TicketNumberPreview
            template={watchedValues.template}
            dateFormat={watchedValues.dateFormat}
            sequenceFormat={watchedValues.sequenceFormat}
            supportTypeId={watchedValues.supportTypeId}
            supportCategoryId={watchedValues.supportCategoryId}
            supportSubOptionId={watchedValues.supportSubOptionId}
          />

          {/* Template Help */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Template Help</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Placeholder Examples:</h4>
                <div className="space-y-1 text-xs">
                  {TEMPLATE_PLACEHOLDERS.map((placeholder) => (
                    <div key={placeholder.value} className="flex justify-between">
                      <code className="bg-muted px-1 rounded">{placeholder.value}</code>
                      <span className="text-muted-foreground">{placeholder.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Example Templates:</h4>
                <div className="space-y-1 text-xs">
                  <div><code className="bg-muted px-1 rounded">{"SR-{Date}-{Sequence}"}</code></div>
                  <div><code className="bg-muted px-1 rounded">{"INC-{SupportType}-{Category}-{Date}-{Sequence}"}</code></div>
                  <div><code className="bg-muted px-1 rounded">{"{SupportType}-{SubType}-{Date}-{Sequence}"}</code></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}