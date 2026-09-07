export interface AgeingSummary {
  current: string;
  days1To30: string;
  days31To45: string;
  days46To60: string;
  days61To90: string;
  over90: string;
}

export interface TopUnpaidInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerLegalName: string;
  invoiceDate: string;
  dueDate: string;
  daysOverdue: number;
  grandTotal: string;
  balanceAmount: string;
  paymentStatus: string;
  ageingBucket: string;
}

export interface DashboardMetricsResponse {
  totalOutstanding: string;
  totalOverdue: string;
  crossed45Days: string;
  receivedThisMonth: string;
  invoicesRaisedThisMonthCount: number;
  invoicesRaisedThisMonthTotal: string;
  ageingSummary: AgeingSummary;
  topUnpaidInvoices: TopUnpaidInvoiceItem[];
}
