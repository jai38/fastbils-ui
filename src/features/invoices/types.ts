import type { components } from '@/api/schema';

export type Invoice = components['schemas']['InvoiceResponse'];
export type InvoiceSummary = components['schemas']['InvoiceSummaryResponse'];
export type InvoiceLine = components['schemas']['InvoiceLineResponse'];
export type InvoiceLineInput = components['schemas']['InvoiceLineRequest'];
export type CreateDraftInvoiceRequest = components['schemas']['CreateDraftInvoiceRequest'];
export type UpdateDraftInvoiceRequest = components['schemas']['UpdateDraftInvoiceRequest'];
export type CancelInvoiceRequest = components['schemas']['CancelInvoiceRequest'];
export type TaxSlabSummary = components['schemas']['TaxSlabSummary'];
export type InvoiceState = 'DRAFT' | 'ISSUED' | 'CANCELLED';

export interface InvoiceFilters {
  state?: InvoiceState;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}
