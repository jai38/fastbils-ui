import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/api/client';
import type {
  InvoiceRegisterItem,
  RevenueSummaryItem,
  TaxSummaryItem,
  ReceivablesAgeingItem,
  ReceiptsRegisterItem,
  ReportFilters,
} from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const reportKeys = {
  all: ['reports'] as const,
  invoiceRegister: (filters: ReportFilters) => [...reportKeys.all, 'invoice-register', filters] as const,
  revenueSummary: (filters: ReportFilters) => [...reportKeys.all, 'revenue-summary', filters] as const,
  taxSummary: (filters: ReportFilters) => [...reportKeys.all, 'tax-summary', filters] as const,
  receivablesAgeing: (filters: ReportFilters) => [...reportKeys.all, 'receivables-ageing', filters] as const,
  receiptsRegister: (filters: ReportFilters) => [...reportKeys.all, 'receipts-register', filters] as const,
};

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

export function useInvoiceRegister(filters: ReportFilters = {}) {
  return useQuery<InvoiceRegisterItem[]>({
    queryKey: reportKeys.invoiceRegister(filters),
    queryFn: async () => {
      const token = getAccessToken();
      const qs = buildQueryString({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customerId,
      });

      const response = await fetch(`${baseUrl}/api/v1/reports/invoice-register${qs}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Invoice Register');
      }

      return response.json();
    },
  });
}

export function useRevenueSummary(filters: ReportFilters = {}) {
  return useQuery<RevenueSummaryItem[]>({
    queryKey: reportKeys.revenueSummary(filters),
    queryFn: async () => {
      const token = getAccessToken();
      const qs = buildQueryString({
        groupBy: filters.groupBy || 'month',
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customerId,
      });

      const response = await fetch(`${baseUrl}/api/v1/reports/revenue-summary${qs}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Revenue Summary');
      }

      return response.json();
    },
  });
}

export function useTaxSummary(filters: ReportFilters = {}) {
  return useQuery<TaxSummaryItem[]>({
    queryKey: reportKeys.taxSummary(filters),
    queryFn: async () => {
      const token = getAccessToken();
      const qs = buildQueryString({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customerId,
      });

      const response = await fetch(`${baseUrl}/api/v1/reports/tax-summary${qs}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Tax Summary');
      }

      return response.json();
    },
  });
}

export function useReceivablesAgeing(filters: ReportFilters = {}) {
  return useQuery<ReceivablesAgeingItem[]>({
    queryKey: reportKeys.receivablesAgeing(filters),
    queryFn: async () => {
      const token = getAccessToken();
      const qs = buildQueryString({
        customerId: filters.customerId,
      });

      const response = await fetch(`${baseUrl}/api/v1/reports/receivables-ageing${qs}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Receivables Ageing');
      }

      return response.json();
    },
  });
}

export function useReceiptsRegister(filters: ReportFilters = {}) {
  return useQuery<ReceiptsRegisterItem[]>({
    queryKey: reportKeys.receiptsRegister(filters),
    queryFn: async () => {
      const token = getAccessToken();
      const qs = buildQueryString({
        fromDate: filters.fromDate,
        toDate: filters.toDate,
        customerId: filters.customerId,
        paymentMethod: filters.paymentMethod,
        isReversed: filters.isReversed,
      });

      const response = await fetch(`${baseUrl}/api/v1/reports/receipts-register${qs}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load Receipts Register');
      }

      return response.json();
    },
  });
}

export async function downloadReportExport(
  reportEndpoint: 'invoice-register' | 'revenue-summary' | 'tax-summary' | 'receivables-ageing' | 'receipts-register',
  format: 'csv' | 'xlsx',
  filters: ReportFilters = {}
): Promise<void> {
  const token = getAccessToken();
  const qs = buildQueryString({
    ...filters,
    export: format,
  });

  const response = await fetch(`${baseUrl}/api/v1/reports/${reportEndpoint}${qs}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export ${reportEndpoint} in ${format.toUpperCase()} format`);
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportEndpoint}_${new Date().toISOString().slice(0, 10)}.${format}`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
