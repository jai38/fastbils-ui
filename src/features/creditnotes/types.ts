import type { components } from '@/api/schema';

export type CreditNoteReason = components['schemas']['CreditNoteReason'];
export type CreditNoteState = components['schemas']['CreditNoteState'];

export type CreditNote = components['schemas']['CreditNoteResponse'];
export type CreditNoteSummary = components['schemas']['CreditNoteSummaryResponse'];
export type CreditNoteLine = components['schemas']['CreditNoteLineResponse'];

export type CreateCreditNoteRequest = components['schemas']['CreateCreditNoteRequest'];
export type CancelCreditNoteRequest = components['schemas']['CancelCreditNoteRequest'];

export interface CreditNoteFilters {
  state?: CreditNoteState;
  originalInvoiceId?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  page?: number;
  size?: number;
}

export const CREDIT_NOTE_REASONS: { value: CreditNoteReason; label: string }[] = [
  { value: 'SALES_RETURN', label: 'Sales Return' },
  { value: 'POST_SALE_DISCOUNT', label: 'Post-sale Discount' },
  { value: 'DEFICIENCY_IN_SERVICE', label: 'Deficiency in Service' },
  { value: 'CORRECTION_IN_INVOICE', label: 'Correction in Invoice' },
  { value: 'CHANGE_IN_POS_OR_RATE', label: 'Change in Place of Supply / Tax Rate' },
  { value: 'OTHER', label: 'Other' },
];
