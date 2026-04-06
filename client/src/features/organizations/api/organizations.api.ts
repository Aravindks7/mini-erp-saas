import { apiFetch } from '@/lib/api';
import type { CreateOrganizationInput } from '@shared/contracts/organizations.contract';

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export const organizationsApi = {
  fetchMyOrganizations: () => apiFetch<OrganizationResponse[]>('/organizations'),
  createOrganization: (data: CreateOrganizationInput) =>
    apiFetch<OrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
