import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { DashboardView } from './DashboardView';
import * as dashboardApi from './api';
import * as authContext from '@/features/auth/AuthContext';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('./api', () => ({
  useDashboardMetrics: vi.fn(),
}));

describe('DashboardView', () => {
  const mockUser = {
    userId: 'u1',
    email: 'admin@fastbills.in',
    fullName: 'Rohan Sharma',
    role: 'OWNER',
    organisationId: 'org1',
  };

  const mockOrg = {
    id: 'org1',
    legalName: 'Acme Traders Pvt Ltd',
    tradeName: 'Acme',
    gstin: '27AABCU9603R1ZM',
    stateCode: '27',
  };

  it('renders loading state initially', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      organisation: mockOrg,
    } as any);

    vi.mocked(dashboardApi.useDashboardMetrics).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    expect(screen.getByText(/Calculating financial metrics/i)).toBeDefined();
  });

  it('renders 5 KPI cards and ageing breakdown when metrics are loaded', () => {
    vi.mocked(authContext.useAuth).mockReturnValue({
      user: mockUser,
      organisation: mockOrg,
    } as any);

    vi.mocked(dashboardApi.useDashboardMetrics).mockReturnValue({
      data: {
        totalOutstanding: '150000.00',
        totalOverdue: '50000.00',
        crossed45Days: '25000.00',
        receivedThisMonth: '80000.00',
        invoicesRaisedThisMonthCount: 12,
        invoicesRaisedThisMonthTotal: '210000.00',
        ageingSummary: {
          current: '100000.00',
          days1To30: '25000.00',
          days31To45: '0.00',
          days46To60: '15000.00',
          days61To90: '10000.00',
          over90: '0.00',
        },
        topUnpaidInvoices: [
          {
            id: 'inv-1',
            invoiceNumber: 'INV-2026-001',
            customerId: 'c1',
            customerLegalName: 'Zenith Logistics',
            invoiceDate: '2026-08-01',
            dueDate: '2026-08-15',
            daysOverdue: 23,
            grandTotal: '50000.00',
            balanceAmount: '25000.00',
            paymentStatus: 'PARTIALLY_PAID',
            ageingBucket: 'DAYS_1_TO_30',
          },
        ],
      },
      isLoading: false,
      error: null,
    } as any);

    render(
      <BrowserRouter>
        <DashboardView />
      </BrowserRouter>
    );

    // KPI cards
    expect(screen.getByText(/Total Outstanding/i)).toBeDefined();
    expect(screen.getByText(/Total Overdue/i)).toBeDefined();
    expect(screen.getByText(/MSME Alert/i)).toBeDefined();
    expect(screen.getByText(/Collected \(This Month\)/i)).toBeDefined();
    expect(screen.getByText(/Invoiced \(This Month\)/i)).toBeDefined();

    // Ageing Visualizer
    expect(screen.getByText(/Receivables Ageing Distribution/i)).toBeDefined();

    // Top Unpaid Invoices
    expect(screen.getByText('INV-2026-001')).toBeDefined();
    expect(screen.getByText('Zenith Logistics')).toBeDefined();
  });
});
