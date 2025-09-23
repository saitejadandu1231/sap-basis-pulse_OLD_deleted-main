import { apiFetch } from './api';

export interface ServiceRequestIdentifier {
  id: string;
  identifier: string;
  task: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestIdentifier {
  identifier: string;
  task: string;
  isActive: boolean;
}

export interface UpdateServiceRequestIdentifier {
  identifier: string;
  task: string;
  isActive: boolean;
}

const BASE_PATH = 'api/ServiceRequestIdentifiers';

export const serviceRequestIdentifierApi = {
  getAll: async (): Promise<ServiceRequestIdentifier[]> => {
    const response = await apiFetch(BASE_PATH);
    if (!response.ok) {
      throw new Error(`Failed to fetch service request identifiers: ${response.statusText}`);
    }
    return response.json();
  },

  getById: async (id: string): Promise<ServiceRequestIdentifier> => {
    const response = await apiFetch(`${BASE_PATH}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch service request identifier: ${response.statusText}`);
    }
    return response.json();
  },

  create: async (data: CreateServiceRequestIdentifier): Promise<ServiceRequestIdentifier> => {
    const response = await apiFetch(BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`Failed to create service request identifier: ${response.statusText}`);
    }
    return response.json();
  },

  update: async (id: string, data: UpdateServiceRequestIdentifier): Promise<void> => {
    const response = await apiFetch(`${BASE_PATH}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`Failed to update service request identifier: ${response.statusText}`);
    }
  },

  delete: async (id: string): Promise<void> => {
    const response = await apiFetch(`${BASE_PATH}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error(`Failed to delete service request identifier: ${response.statusText}`);
    }
  }
};