import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken } from '@/api/client';
import type {
  CreateDraftInvoiceRequest,
  Invoice,
  InvoiceFilters,
  UpdateDraftInvoiceRequest,
  CancelInvoiceRequest,
} from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const invoiceKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceKeys.all, 'list'] as const,
  list: (filters: InvoiceFilters) => [...invoiceKeys.lists(), filters] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoices(filters: InvoiceFilters = {}) {
  return useQuery({
    queryKey: invoiceKeys.list(filters),
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/invoices', {
        params: {
          query: {
            state: filters.state,
            customerId: filters.customerId,
            fromDate: filters.fromDate,
            toDate: filters.toDate,
            search: filters.search,
            page: filters.page ?? 0,
            size: filters.size ?? 25,
          },
        },
      });

      if (error || !data) {
        throw new Error('Failed to load invoices');
      }

      return data;
    },
  });
}

export function useInvoice(id?: string) {
  return useQuery({
    queryKey: invoiceKeys.detail(id || ''),
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await api.GET('/api/v1/invoices/{id}', {
        params: {
          path: { id: id! },
        },
      });

      if (error || !data) {
        throw new Error('Failed to fetch invoice details');
      }

      return data as Invoice;
    },
  });
}

export function useCreateDraftInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDraftInvoiceRequest) => {
      const { data, error } = await api.POST('/api/v1/invoices/drafts', {
        body: payload,
      });

      if (error || !data) {
        throw new Error('Failed to create draft invoice');
      }

      return data as Invoice;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useUpdateDraftInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateDraftInvoiceRequest }) => {
      const { data, error } = await api.PUT('/api/v1/invoices/drafts/{id}', {
        params: {
          path: { id },
        },
        body: payload,
      });

      if (error || !data) {
        throw new Error('Failed to update draft invoice');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useDeleteDraftInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.DELETE('/api/v1/invoices/drafts/{id}', {
        params: {
          path: { id },
        },
      });

      if (error) {
        throw new Error('Failed to delete draft invoice');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useIssueInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await api.POST('/api/v1/invoices/{id}/issue', {
        params: {
          path: { id },
        },
      });

      if (error || !data) {
        throw new Error('Failed to issue invoice');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useCancelInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CancelInvoiceRequest }) => {
      const { data, error } = await api.POST('/api/v1/invoices/{id}/cancel', {
        params: {
          path: { id },
        },
        body: payload,
      });

      if (error || !data) {
        throw new Error('Failed to cancel invoice');
      }

      return data as Invoice;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export async function downloadInvoicePdf(id: string, invoiceNumber?: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${baseUrl}/api/v1/invoices/${id}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const filename = invoiceNumber ? `${invoiceNumber.replace(/[\/\\]/g, '_')}.pdf` : `invoice_${id.slice(0, 8)}.pdf`;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function openInvoicePdf(id: string): Promise<void> {
  const token = getAccessToken();
  const response = await fetch(`${baseUrl}/api/v1/invoices/${id}/pdf`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to open invoice PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export function useLatestIssuedInvoiceDate(financialYear?: number) {
  return useQuery<{ latestIssuedDate: string | null }>({
    queryKey: ['invoices', 'latest-issued-date', financialYear],
    queryFn: async () => {
      const token = getAccessToken();
      const url = financialYear
        ? `${baseUrl}/api/v1/invoices/latest-issued-date?financialYear=${financialYear}`
        : `${baseUrl}/api/v1/invoices/latest-issued-date`;
      const response = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        return { latestIssuedDate: null };
      }
      return response.json();
    },
  });
}

