import type { PaymentMethod } from '@/features/receipts/types';

export interface InvoiceRegisterItem {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  customerLegalName: string;
  customerGstin: string;
  placeOfSupply: string;
  supplyType: string;
  state: string;
  taxableValue: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalCess: string;
  totalTax: string;
  roundOff: string;
  grandTotal: string;
  receivedAmount: string;
  balanceAmount: string;
  paymentStatus: string;
  ageingBucket: string;
}

export interface RevenueSummaryItem {
  groupKey: string;
  groupLabel: string;
  invoiceCount: number;
  taxableValue: string;
  totalCgst: string;
  totalSgst: string;
  totalIgst: string;
  totalCess: string;
  totalTax: string;
  grandTotal: string;
  receivedAmount: string;
  balanceAmount: string;
}

export interface TaxSummaryItem {
  taxRatePercent: string;
  taxCategory: string;
  label: string;
  lineCount: number;
  taxableValue: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  cessAmount: string;
  totalTax: string;
}

export interface ReceivablesAgeingItem {
  customerId: string;
  customerLegalName: string;
  customerGstin: string;
  totalOutstanding: string;
  current: string;
  days1To30: string;
  days31To45: string;
  days46To60: string;
  days61To90: string;
  over90: string;
  oldestDueDate: string | null;
}

export interface ReceiptsRegisterItem {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerLegalName: string;
  amount: string;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  notes: string;
  isReversed: boolean;
  reversalReason: string | null;
}

export interface ReportFilters {
  fromDate?: string;
  toDate?: string;
  customerId?: string;
  groupBy?: 'month' | 'customer';
  paymentMethod?: PaymentMethod | '';
  isReversed?: boolean;
}
