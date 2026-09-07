import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreditNoteListView } from './CreditNoteListView';
import * as creditNoteApi from './api';

vi.mock('./api', () => ({
  useCreditNotes: vi.fn(),
  useCancelCreditNote: vi.fn(),
  downloadCreditNotePdf: vi.fn(),
}));

describe('CreditNoteListView', () => {
  it('renders credit notes table, metrics cards, and filters', () => {
    vi.mocked(creditNoteApi.useCancelCreditNote).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(creditNoteApi.useCreditNotes).mockReturnValue({
      data: [
        {
          id: 'cn-1',
          creditNoteNumber: 'CN/2026/0001',
          creditNoteDate: '2026-09-07',
          originalInvoiceId: 'inv-1',
          originalInvoiceNumber: 'INV/2026/0001',
          originalInvoiceDate: '2026-09-01',
          customerId: 'cust-1',
          customerLegalName: 'Bharat Electronics Ltd',
          reason: 'DEFICIENCY_IN_SERVICE',
          reasonDescription: 'Deficiency in Service',
          state: 'ISSUED',
          taxableValue: '1000.00',
          totalTax: '180.00',
          grandTotal: '1180.00',
        },
      ],
      isLoading: false,
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <CreditNoteListView />
      </BrowserRouter>
    );

    // Verify Title & Rule 53 statutory reference
    expect(screen.getByText('Credit Notes')).toBeDefined();
    expect(screen.getByText(/Section 34 of the CGST Act & Rule 53/i)).toBeDefined();

    // Verify Metric KPI Cards
    expect(screen.getByText('Total Issued')).toBeDefined();
    expect(screen.getByText('Active Credit Value')).toBeDefined();
    expect(screen.getByText('Cancelled Notes')).toBeDefined();

    // Verify Table Row Data
    expect(screen.getByText('CN/2026/0001')).toBeDefined();
    expect(screen.getByText('Bharat Electronics Ltd')).toBeDefined();
    expect(screen.getByText('INV/2026/0001')).toBeDefined();
    expect(screen.getByText('Deficiency in Service')).toBeDefined();
    expect(screen.getAllByText('ISSUED').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('₹ 1,180.00').length).toBeGreaterThanOrEqual(1);

    // Verify Action Buttons
    expect(screen.getByTitle('Download Rule 53 PDF')).toBeDefined();
    expect(screen.getByTitle('Cancel Credit Note')).toBeDefined();
  });
});
