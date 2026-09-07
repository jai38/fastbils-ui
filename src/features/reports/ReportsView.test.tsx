import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReportsView } from './ReportsView';
import * as reportsApi from './api';
import * as customerApi from '@/features/customers/api';

vi.mock('./api', () => ({
  useInvoiceRegister: vi.fn(),
  useRevenueSummary: vi.fn(),
  useTaxSummary: vi.fn(),
  useReceivablesAgeing: vi.fn(),
  useReceiptsRegister: vi.fn(),
  downloadReportExport: vi.fn(),
}));

vi.mock('@/features/customers/api', () => ({
  useCustomers: vi.fn(),
}));

describe('ReportsView', () => {
  it('renders all 5 statutory and management report tabs and allows tab switching', () => {
    vi.mocked(customerApi.useCustomers).mockReturnValue({
      data: { content: [] },
    } as any);

    vi.mocked(reportsApi.useInvoiceRegister).mockReturnValue({
      data: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-2026-001',
          invoiceDate: '2026-09-01',
          dueDate: '2026-09-15',
          customerId: 'c1',
          customerLegalName: 'Acme Corp',
          customerGstin: '27AABCU9603R1ZM',
          placeOfSupply: '27 - Maharashtra',
          supplyType: 'INTRA_STATE',
          state: 'ISSUED',
          taxableValue: '1000.00',
          totalCgst: '90.00',
          totalSgst: '90.00',
          totalIgst: '0.00',
          totalCess: '0.00',
          totalTax: '180.00',
          roundOff: '0.00',
          grandTotal: '1180.00',
          receivedAmount: '1180.00',
          balanceAmount: '0.00',
          paymentStatus: 'PAID',
          ageingBucket: 'CURRENT',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(reportsApi.useRevenueSummary).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(reportsApi.useTaxSummary).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(reportsApi.useReceivablesAgeing).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(reportsApi.useReceiptsRegister).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <ReportsView />
      </BrowserRouter>
    );

    // Verify Tab headers
    expect(screen.getByText(/1\. Invoice Register/i)).toBeDefined();
    expect(screen.getByText(/2\. Revenue Summary/i)).toBeDefined();
    expect(screen.getByText(/3\. Tax Summary by Rate Slab/i)).toBeDefined();
    expect(screen.getByText(/4\. Receivables Ageing/i)).toBeDefined();
    expect(screen.getByText(/5\. Receipts Register/i)).toBeDefined();

    // Verify Invoice Register row
    expect(screen.getByText('INV-2026-001')).toBeDefined();
    expect(screen.getByText('Acme Corp')).toBeDefined();
    expect(screen.getByText('PAID')).toBeDefined();

    // Verify Export buttons
    expect(screen.getByText('Export CSV')).toBeDefined();
    expect(screen.getByText('Export Excel (.xlsx)')).toBeDefined();

    // Switch tab to Revenue Summary
    fireEvent.click(screen.getByText(/2\. Revenue Summary/i));
    expect(screen.getByText(/Group By:/i)).toBeDefined();
  });
});
