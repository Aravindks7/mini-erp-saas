import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../api/organizations.api';
import type { CreateOrganizationInput } from '@shared/contracts/organizations.contract';

export const organizationKeys = {
  all: ['organizations'] as const,
  mine: () => [...organizationKeys.all, 'mine'] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.mine(),
    queryFn: organizationsApi.fetchMyOrganizations,
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationInput) => organizationsApi.createOrganization(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.mine() });
    },
  });
}
