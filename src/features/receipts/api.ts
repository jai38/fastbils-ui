import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import type { Receipt, CreateReceiptRequest, ReverseReceiptRequest, ReceiptFilters } from './types';
import { invoiceKeys } from '@/features/invoices/api';

export const receiptKeys = {
  all: ['receipts'] as const,
  byInvoice: (invoiceId: string) => [...receiptKeys.all, 'invoice', invoiceId] as const,
  list: (filters?: ReceiptFilters) => [...receiptKeys.all, 'list', filters] as const,
};

export async function getInvoiceReceipts(invoiceId: string): Promise<Receipt[]> {
  const { data, error } = await api.GET('/api/v1/invoices/{invoiceId}/receipts', {
    params: {
      path: { invoiceId },
    },
  });
  if (error) throw error;
  return data || [];
}

export async function recordReceipt(invoiceId: string, payload: CreateReceiptRequest): Promise<Receipt> {
  const { data, error } = await api.POST('/api/v1/invoices/{invoiceId}/receipts', {
    params: {
      path: { invoiceId },
    },
    body: payload,
  });
  if (error) throw error;
  return data!;
}

export async function reverseReceipt(receiptId: string, payload: ReverseReceiptRequest): Promise<Receipt> {
  const { data, error } = await api.POST('/api/v1/receipts/{receiptId}/reverse', {
    params: {
      path: { receiptId },
    },
    body: payload,
  });
  if (error) throw error;
  return data!;
}

export async function listReceipts(filters?: ReceiptFilters) {
  const { data, error } = await api.GET('/api/v1/receipts', {
    params: {
      query: filters,
    },
  });
  if (error) throw error;
  return data!;
}

// React Query Hooks

export function useInvoiceReceipts(invoiceId: string | undefined) {
  return useQuery({
    queryKey: receiptKeys.byInvoice(invoiceId || ''),
    queryFn: () => getInvoiceReceipts(invoiceId!),
    enabled: Boolean(invoiceId),
  });
}

export function useRecordReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, data }: { invoiceId: string; data: CreateReceiptRequest }) =>
      recordReceipt(invoiceId, data),
    onSuccess: (_, { invoiceId }) => {
      queryClient.invalidateQueries({ queryKey: receiptKeys.byInvoice(invoiceId) });
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}

export function useReverseReceipt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ receiptId, data }: { receiptId: string; data: ReverseReceiptRequest }) =>
      reverseReceipt(receiptId, data),
    onSuccess: (receipt) => {
      if (receipt.invoiceId) {
        queryClient.invalidateQueries({ queryKey: receiptKeys.byInvoice(receipt.invoiceId) });
        queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(receipt.invoiceId) });
      }
      queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
      queryClient.invalidateQueries({ queryKey: receiptKeys.all });
    },
  });
}
