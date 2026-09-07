import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, getAccessToken } from '@/api/client';
import type {
  CreditNote,
  CreateCreditNoteRequest,
  CancelCreditNoteRequest,
  CreditNoteFilters,
} from './types';
import { invoiceKeys } from '@/features/invoices/api';

export const creditNoteKeys = {
  all: ['creditNotes'] as const,
  byInvoice: (invoiceId: string) => [...creditNoteKeys.all, 'invoice', invoiceId] as const,
  detail: (id: string) => [...creditNoteKeys.all, 'detail', id] as const,
  list: (filters?: CreditNoteFilters) => [...creditNoteKeys.all, 'list', filters] as const,
};

export async function getInvoiceCreditNotes(invoiceId: string): Promise<CreditNote[]> {
  const { data, error } = await api.GET('/api/v1/invoices/{invoiceId}/credit-notes', {
    params: {
      path: { invoiceId },
    },
  });
  if (error) throw error;
  return data || [];
}

export async function createCreditNote(
  invoiceId: string,
  payload: CreateCreditNoteRequest
): Promise<CreditNote> {
  const { data, error } = await api.POST('/api/v1/invoices/{invoiceId}/credit-notes', {
    params: {
      path: { invoiceId },
    },
    body: payload,
  });
  if (error) throw error;
  return data!;
}

export async function cancelCreditNote(
  creditNoteId: string,
  payload: CancelCreditNoteRequest
): Promise<CreditNote> {
  const { data, error } = await api.POST('/api/v1/credit-notes/{id}/cancel', {
    params: {
      path: { id: creditNoteId },
    },
    body: payload,
  });
  if (error) throw error;
  return data!;
}

export async function getCreditNote(id: string): Promise<CreditNote> {
  const { data, error } = await api.GET('/api/v1/credit-notes/{id}', {
    params: {
      path: { id },
    },
  });
  if (error) throw error;
  return data!;
}

export async function listCreditNotes(filters?: CreditNoteFilters) {
  const { data, error } = await api.GET('/api/v1/credit-notes', {
    params: {
      query: filters,
    },
  });
  if (error) throw error;
  return data!;
}

export async function downloadCreditNotePdf(creditNoteId: string, filename: string): Promise<void> {
  const token = getAccessToken();
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '';
  const url = `${baseUrl}/api/v1/credit-notes/${creditNoteId}/pdf`;

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new Error('Failed to download credit note PDF');
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// React Query Hooks

export function useInvoiceCreditNotes(invoiceId: string | undefined) {
  return useQuery({
    queryKey: creditNoteKeys.byInvoice(invoiceId || ''),
    queryFn: () => getInvoiceCreditNotes(invoiceId!),
    enabled: Boolean(invoiceId),
  });
}

export function useCreditNote(id: string | undefined) {
  return useQuery({
    queryKey: creditNoteKeys.detail(id || ''),
    queryFn: () => getCreditNote(id!),
    enabled: Boolean(id),
  });
}

export function useCreditNotes(filters?: CreditNoteFilters) {
  return useQuery({
    queryKey: creditNoteKeys.list(filters),
    queryFn: () => listCreditNotes(filters),
  });
}

export function useCreateCreditNote(invoiceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCreditNoteRequest) => createCreditNote(invoiceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}

export function useCancelCreditNote(invoiceId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ creditNoteId, payload }: { creditNoteId: string; payload: CancelCreditNoteRequest }) =>
      cancelCreditNote(creditNoteId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: creditNoteKeys.all });
      if (invoiceId) {
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
      }
      queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
    },
  });
}
