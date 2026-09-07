import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { CreateCustomerRequest, Customer, UpdateCustomerRequest } from './types';

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  list: (params: { query?: string; isArchived?: boolean; page?: number; size?: number }) =>
    [...customerKeys.lists(), params] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

export function useCustomers(params: {
  query?: string;
  isArchived?: boolean;
  page?: number;
  size?: number;
}) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/customers', {
        params: {
          query: {
            query: params.query || undefined,
            isArchived: params.isArchived,
            page: params.page ?? 0,
            size: params.size ?? 20,
          },
        },
      });

      if (error || !data) {
        throw new Error('Failed to load customers');
      }

      return data;
    },
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: customerKeys.detail(id || ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/customers/{id}', {
        params: {
          path: { id: id! },
        },
      });

      if (error || !data) {
        throw new Error('Failed to fetch customer details');
      }

      return data as Customer;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCustomerRequest) => {
      const { data, error } = await api.POST('/api/v1/customers', {
        body: payload,
      });

      if (error || !data) {
        const msg = (error as { message?: string })?.message || 'Failed to create customer';
        throw new Error(msg);
      }

      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data: payload }: { id: string; data: UpdateCustomerRequest }) => {
      const { data, error } = await api.PUT('/api/v1/customers/{id}', {
        params: {
          path: { id },
        },
        body: payload,
      });

      if (error || !data) {
        const msg = (error as { message?: string })?.message || 'Failed to update customer';
        throw new Error(msg);
      }

      return data as Customer;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(customerKeys.detail(updated.id), updated);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useArchiveCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/customers/{id}/archive', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw new Error('Failed to archive customer');
      }

      return data as Customer;
    },
    onSuccess: (archived) => {
      queryClient.setQueryData(customerKeys.detail(archived.id), archived);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}

export function useUnarchiveCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/customers/{id}/unarchive', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw new Error('Failed to restore customer');
      }

      return data as Customer;
    },
    onSuccess: (restored) => {
      queryClient.setQueryData(customerKeys.detail(restored.id), restored);
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() });
    },
  });
}
