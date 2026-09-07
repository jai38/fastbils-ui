import type { components } from '@/api/schema';

export type PaymentMethod = 'CASH' | 'UPI' | 'NEFT' | 'RTGS' | 'IMPS' | 'CHEQUE' | 'CARD';
export type Receipt = components['schemas']['ReceiptResponse'];
export type CreateReceiptRequest = components['schemas']['CreateReceiptRequest'];
export type ReverseReceiptRequest = components['schemas']['ReverseReceiptRequest'];

export interface ReceiptFilters {
  invoiceId?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
  paymentMethod?: PaymentMethod;
  isReversed?: boolean;
  page?: number;
  size?: number;
}
