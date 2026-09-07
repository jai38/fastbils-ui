import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken } from '@/api/client';
import type { Organisation, UpdateOrganisationProfileRequest } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const organisationKeys = {
  all: ['organisation'] as const,
  profile: () => [...organisationKeys.all, 'profile'] as const,
};

export function useOrganisationProfile() {
  return useQuery({
    queryKey: organisationKeys.profile(),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/organisation/profile');
      if (error || !data) {
        throw new Error('Failed to load organisation profile');
      }
      return data as Organisation;
    },
  });
}

export function useUpdateOrganisationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: UpdateOrganisationProfileRequest) => {
      const { data, error } = await api.PUT('/api/v1/organisation/profile', {
        body: payload,
      });
      if (error || !data) {
        const msg = (error as { message?: string })?.message || 'Failed to update organisation profile';
        throw new Error(msg);
      }
      return data as Organisation;
    },
    onSuccess: (updatedOrg) => {
      queryClient.setQueryData(organisationKeys.profile(), updatedOrg);
      queryClient.invalidateQueries({ queryKey: organisationKeys.profile() });
    },
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = getAccessToken();
      const response = await fetch(`${baseUrl}/api/v1/organisation/logo`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.message || 'Failed to upload logo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organisationKeys.profile() });
    },
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await api.DELETE('/api/v1/organisation/logo');
      if (error) {
        throw new Error('Failed to remove logo');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organisationKeys.profile() });
    },
  });
}
