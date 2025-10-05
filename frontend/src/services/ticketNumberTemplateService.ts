import { apiFetch } from '../lib/api';
import type {
  TicketNumberTemplate,
  CreateTicketNumberTemplate,
  UpdateTicketNumberTemplate,
  TicketNumberTemplatePreview,
  TicketNumberPreviewResult
} from '../types/ticketNumberTemplate';

export const ticketNumberTemplateService = {
  // Get all templates
  getAll: async (): Promise<TicketNumberTemplate[]> => {
    const response = await apiFetch('ticketnumbertemplates');
    return response.json();
  },

  // Get template by ID
  getById: async (id: string): Promise<TicketNumberTemplate> => {
    const response = await apiFetch(`ticketnumbertemplates/${id}`);
    return response.json();
  },

  // Create new template
  create: async (data: CreateTicketNumberTemplate): Promise<TicketNumberTemplate> => {
    const response = await apiFetch('ticketnumbertemplates', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Update existing template
  update: async (id: string, data: UpdateTicketNumberTemplate): Promise<TicketNumberTemplate> => {
    const response = await apiFetch(`ticketnumbertemplates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Delete template
  delete: async (id: string): Promise<void> => {
    await apiFetch(`ticketnumbertemplates/${id}`, {
      method: 'DELETE'
    });
  },

  // Preview ticket number
  preview: async (data: TicketNumberTemplatePreview): Promise<TicketNumberPreviewResult> => {
    const response = await apiFetch('ticketnumbertemplates/preview', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return response.json();
  },

  // Reset sequence counter
  resetSequence: async (id: string): Promise<{ message: string }> => {
    const response = await apiFetch(`ticketnumbertemplates/${id}/reset-sequence`, {
      method: 'POST'
    });
    return response.json();
  }
};