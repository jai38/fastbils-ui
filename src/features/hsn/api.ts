import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAccessToken } from '@/api/client';
import type {
  HsnItem,
  CreateHsnItemRequest,
  UpdateHsnItemRequest,
  HsnLookupResult,
} from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const hsnKeys = {
  all: ['hsn'] as const,
  lists: () => [...hsnKeys.all, 'list'] as const,
  list: (activeOnly: boolean) => [...hsnKeys.lists(), { activeOnly }] as const,
  defaultItem: () => [...hsnKeys.all, 'default'] as const,
  lookup: (code: string) => [...hsnKeys.all, 'lookup', code] as const,
};

async function authFetch(url: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.message || errorJson.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function useHsnItems(activeOnly: boolean = true) {
  return useQuery<HsnItem[]>({
    queryKey: hsnKeys.list(activeOnly),
    queryFn: () => authFetch(`/api/v1/hsn?activeOnly=${activeOnly}`),
  });
}

export function useDefaultHsnItem() {
  return useQuery<HsnItem | null>({
    queryKey: hsnKeys.defaultItem(),
    queryFn: async () => {
      try {
        return await authFetch('/api/v1/hsn/default');
      } catch {
        return null;
      }
    },
  });
}

export async function lookupHsnCode(code: string): Promise<HsnLookupResult> {
  return authFetch(`/api/v1/hsn/lookup?code=${encodeURIComponent(code)}`);
}

export function useCreateHsnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateHsnItemRequest): Promise<HsnItem> =>
      authFetch('/api/v1/hsn', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hsnKeys.all });
    },
  });
}

export function useUpdateHsnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHsnItemRequest }): Promise<HsnItem> =>
      authFetch(`/api/v1/hsn/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hsnKeys.all });
    },
  });
}

export function useSetDefaultHsnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<HsnItem> =>
      authFetch(`/api/v1/hsn/${id}/default`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hsnKeys.all });
    },
  });
}

export function useDeleteHsnItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string): Promise<void> =>
      authFetch(`/api/v1/hsn/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: hsnKeys.all });
    },
  });
}
