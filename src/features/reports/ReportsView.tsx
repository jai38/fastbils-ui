import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useInvoiceRegister,
  useRevenueSummary,
  useTaxSummary,
  useReceivablesAgeing,
  useReceiptsRegister,
  downloadReportExport,
} from './api';
import { useCustomers } from '@/features/customers/api';
import { formatRupees } from '@/utils/money';
import Big from 'big.js';
import type { PaymentMethod } from '@/features/receipts/types';

type ReportTab = 'invoice-register' | 'revenue-summary' | 'tax-summary' | 'receivables-ageing' | 'receipts-register';

export function ReportsView() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ReportTab>('invoice-register');

  // Filters
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [groupBy, setGroupBy] = useState<'month' | 'customer'>('month');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('');
  const [isReversed, setIsReversed] = useState<string>(''); // '', 'false', 'true'
  const [isExporting, setIsExporting] = useState(false);

  // Customer dropdown
  const { data: customerData } = useCustomers({ size: 100 });
  const customers = customerData?.content || [];

  const filters = {
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    customerId: customerId || undefined,
    groupBy: activeTab === 'revenue-summary' ? groupBy : undefined,
    paymentMethod: paymentMethod || undefined,
    isReversed: isReversed === 'true' ? true : isReversed === 'false' ? false : undefined,
  };

  // Queries for active tab
  const invoiceRegQuery = useInvoiceRegister(activeTab === 'invoice-register' ? filters : {});
  const revSummaryQuery = useRevenueSummary(activeTab === 'revenue-summary' ? filters : {});
  const taxSummaryQuery = useTaxSummary(activeTab === 'tax-summary' ? filters : {});
  const receivablesQuery = useReceivablesAgeing(activeTab === 'receivables-ageing' ? filters : {});
  const receiptsQuery = useReceiptsRegister(activeTab === 'receipts-register' ? filters : {});

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      setIsExporting(true);
      await downloadReportExport(activeTab, format, filters);
    } catch (err: any) {
      alert(err.message || 'Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setFromDate('');
    setToDate('');
    setCustomerId('');
    setGroupBy('month');
    setPaymentMethod('');
    setIsReversed('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Reports &amp; Statutory Registers</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Statutory GST, Revenue, GSTR-1 Tax Slabs, Ageing, and Receipts reporting.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleExport('csv')}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleExport('xlsx')}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded shadow-sm hover:bg-emerald-100 transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Export Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6 overflow-x-auto text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('invoice-register')}
            className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'invoice-register'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            1. Invoice Register
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('revenue-summary')}
            className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'revenue-summary'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            2. Revenue Summary
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tax-summary')}
            className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'tax-summary'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            3. Tax Summary by Rate Slab
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receivables-ageing')}
            className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'receivables-ageing'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            4. Receivables Ageing (MSME 45-Day)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('receipts-register')}
            className={`py-2 px-1 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'receipts-register'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            5. Receipts Register
          </button>
        </nav>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm text-xs">
        {/* Date Filters */}
        {activeTab !== 'receivables-ageing' && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-gray-500">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Customer Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-gray-500">Customer:</span>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[200px]"
          >
            <option value="">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.legalName}
              </option>
            ))}
          </select>
        </div>

        {/* Revenue Summary Grouping */}
        {activeTab === 'revenue-summary' && (
          <div className="flex items-center space-x-2 border-l pl-3 border-gray-200">
            <span className="text-gray-500">Group By:</span>
            <div className="inline-flex rounded border border-gray-200 p-0.5 bg-gray-50">
              <button
                type="button"
                onClick={() => setGroupBy('month')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  groupBy === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setGroupBy('customer')}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  groupBy === 'customer' ? 'bg-white text-blue-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Customer
              </button>
            </div>
          </div>
        )}

        {/* Receipts Filters */}
        {activeTab === 'receipts-register' && (
          <>
            <div className="flex items-center space-x-2 border-l pl-3 border-gray-200">
              <span className="text-gray-500">Method:</span>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod | '')}
                className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Methods</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="NEFT">NEFT</option>
                <option value="RTGS">RTGS</option>
                <option value="IMPS">IMPS</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Status:</span>
              <select
                value={isReversed}
                onChange={(e) => setIsReversed(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Receipts</option>
                <option value="false">Active Only</option>
                <option value="true">Reversed Only</option>
              </select>
            </div>
          </>
        )}

        {(fromDate || toDate || customerId || paymentMethod || isReversed) && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="ml-auto text-xs text-blue-600 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Tab Content 1: Invoice Register */}
      {activeTab === 'invoice-register' && (
        <InvoiceRegisterTable
          query={invoiceRegQuery}
          onInvoiceClick={(id) => navigate(`/invoices/${id}`)}
        />
      )}

      {/* Tab Content 2: Revenue Summary */}
      {activeTab === 'revenue-summary' && (
        <RevenueSummaryTable query={revSummaryQuery} />
      )}

      {/* Tab Content 3: Tax Summary by Rate Slab */}
      {activeTab === 'tax-summary' && (
        <TaxSummaryTable query={taxSummaryQuery} />
      )}

      {/* Tab Content 4: Receivables Ageing */}
      {activeTab === 'receivables-ageing' && (
        <ReceivablesAgeingTable query={receivablesQuery} />
      )}

      {/* Tab Content 5: Receipts Register */}
      {activeTab === 'receipts-register' && (
        <ReceiptsRegisterTable
          query={receiptsQuery}
          onInvoiceClick={(id) => navigate(`/invoices/${id}`)}
        />
      )}
    </div>
  );
}

/* =========================================================================
   SUBCOMPONENTS FOR EACH REPORT
========================================================================= */

function InvoiceRegisterTable({
  query,
  onInvoiceClick,
}: {
  query: ReturnType<typeof useInvoiceRegister>;
  onInvoiceClick: (id: string) => void;
}) {
  const { data, isLoading, error } = query;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load Invoice Register" />;
  if (!data || data.length === 0) return <EmptyState text="No invoices found for the selected period." />;

  let totTaxable = new Big(0);
  let totCgst = new Big(0);
  let totSgst = new Big(0);
  let totIgst = new Big(0);
  let totGrand = new Big(0);
  let totRec = new Big(0);
  let totBal = new Big(0);

  data.forEach((item) => {
    totTaxable = totTaxable.plus(item.taxableValue || '0');
    totCgst = totCgst.plus(item.totalCgst || '0');
    totSgst = totSgst.plus(item.totalSgst || '0');
    totIgst = totIgst.plus(item.totalIgst || '0');
    totGrand = totGrand.plus(item.grandTotal || '0');
    totRec = totRec.plus(item.receivedAmount || '0');
    totBal = totBal.plus(item.balanceAmount || '0');
  });

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Invoice #</th>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 px-3 text-right">Taxable</th>
              <th className="py-2.5 px-3 text-right">CGST</th>
              <th className="py-2.5 px-3 text-right">SGST</th>
              <th className="py-2.5 px-3 text-right">IGST</th>
              <th className="py-2.5 px-3 text-right">Grand Total</th>
              <th className="py-2.5 px-3 text-right">Received</th>
              <th className="py-2.5 px-3 text-right">Balance</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {data.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50/75 transition-colors">
                <td
                  className="py-2 px-3 font-semibold text-blue-600 hover:underline cursor-pointer"
                  onClick={() => onInvoiceClick(item.id)}
                >
                  {item.invoiceNumber}
                </td>
                <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{item.invoiceDate}</td>
                <td className="py-2 px-3 font-sans text-gray-900 font-medium max-w-[160px] truncate" title={item.customerLegalName}>
                  {item.customerLegalName}
                </td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{item.customerGstin}</td>
                <td className="py-2 px-3 font-sans text-gray-600">{item.state}</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatRupees(item.taxableValue)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalCgst)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalSgst)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalIgst)}</td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{formatRupees(item.grandTotal)}</td>
                <td className="py-2 px-3 text-right text-emerald-600">{formatRupees(item.receivedAmount)}</td>
                <td className="py-2 px-3 text-right text-red-600 font-bold">{formatRupees(item.balanceAmount)}</td>
                <td className="py-2 px-3 text-center font-sans">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                      item.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : item.paymentStatus === 'PARTIALLY_PAID'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {item.paymentStatus.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/75 border-t-2 border-gray-300 font-mono font-bold text-gray-900">
              <td colSpan={5} className="py-2.5 px-3 font-sans">
                Total ({data.length} invoices)
              </td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totTaxable.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totCgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totSgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totIgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totGrand.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-emerald-700">{formatRupees(totRec.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-red-700">{formatRupees(totBal.toFixed(2))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function RevenueSummaryTable({ query }: { query: ReturnType<typeof useRevenueSummary> }) {
  const { data, isLoading, error } = query;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load Revenue Summary" />;
  if (!data || data.length === 0) return <EmptyState text="No revenue data available." />;

  let totCount = 0;
  let totTaxable = new Big(0);
  let totTax = new Big(0);
  let totGrand = new Big(0);
  let totRec = new Big(0);
  let totBal = new Big(0);

  data.forEach((item) => {
    totCount += item.invoiceCount;
    totTaxable = totTaxable.plus(item.taxableValue || '0');
    totTax = totTax.plus(item.totalTax || '0');
    totGrand = totGrand.plus(item.grandTotal || '0');
    totRec = totRec.plus(item.receivedAmount || '0');
    totBal = totBal.plus(item.balanceAmount || '0');
  });

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Period / Customer</th>
              <th className="py-2.5 px-3 text-center">Invoices</th>
              <th className="py-2.5 px-3 text-right">Taxable Value</th>
              <th className="py-2.5 px-3 text-right">CGST</th>
              <th className="py-2.5 px-3 text-right">SGST</th>
              <th className="py-2.5 px-3 text-right">IGST</th>
              <th className="py-2.5 px-3 text-right">Total Tax</th>
              <th className="py-2.5 px-3 text-right">Grand Total</th>
              <th className="py-2.5 px-3 text-right">Received</th>
              <th className="py-2.5 px-3 text-right">Outstanding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {data.map((item) => (
              <tr key={item.groupKey} className="hover:bg-gray-50/75 transition-colors">
                <td className="py-2 px-3 font-sans font-semibold text-gray-900">{item.groupLabel}</td>
                <td className="py-2 px-3 text-center text-gray-700">{item.invoiceCount}</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatRupees(item.taxableValue)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalCgst)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalSgst)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.totalIgst)}</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatRupees(item.totalTax)}</td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{formatRupees(item.grandTotal)}</td>
                <td className="py-2 px-3 text-right text-emerald-600">{formatRupees(item.receivedAmount)}</td>
                <td className="py-2 px-3 text-right text-red-600 font-bold">{formatRupees(item.balanceAmount)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/75 border-t-2 border-gray-300 font-mono font-bold text-gray-900">
              <td className="py-2.5 px-3 font-sans">Total</td>
              <td className="py-2.5 px-3 text-center">{totCount}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totTaxable.toFixed(2))}</td>
              <td colSpan={3}></td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totTax.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totGrand.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-emerald-700">{formatRupees(totRec.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-red-700">{formatRupees(totBal.toFixed(2))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function TaxSummaryTable({ query }: { query: ReturnType<typeof useTaxSummary> }) {
  const { data, isLoading, error } = query;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load Tax Summary" />;
  if (!data || data.length === 0) return <EmptyState text="No tax line data found." />;

  let totLines = 0;
  let totTaxable = new Big(0);
  let totCgst = new Big(0);
  let totSgst = new Big(0);
  let totIgst = new Big(0);
  let totCess = new Big(0);
  let totTax = new Big(0);

  data.forEach((item) => {
    totLines += item.lineCount;
    totTaxable = totTaxable.plus(item.taxableValue || '0');
    totCgst = totCgst.plus(item.cgstAmount || '0');
    totSgst = totSgst.plus(item.sgstAmount || '0');
    totIgst = totIgst.plus(item.igstAmount || '0');
    totCess = totCess.plus(item.cessAmount || '0');
    totTax = totTax.plus(item.totalTax || '0');
  });

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Tax Slab / Category</th>
              <th className="py-2.5 px-3 text-center">Invoice Lines</th>
              <th className="py-2.5 px-3 text-right">Taxable Value</th>
              <th className="py-2.5 px-3 text-right">CGST</th>
              <th className="py-2.5 px-3 text-right">SGST</th>
              <th className="py-2.5 px-3 text-right">IGST</th>
              <th className="py-2.5 px-3 text-right">Cess</th>
              <th className="py-2.5 px-3 text-right">Total Tax Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {data.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50/75 transition-colors">
                <td className="py-2 px-3 font-sans font-semibold text-gray-900">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-800">
                    {item.label}
                  </span>
                </td>
                <td className="py-2 px-3 text-center text-gray-700">{item.lineCount}</td>
                <td className="py-2 px-3 text-right text-gray-700">{formatRupees(item.taxableValue)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.cgstAmount)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.sgstAmount)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.igstAmount)}</td>
                <td className="py-2 px-3 text-right text-gray-600">{formatRupees(item.cessAmount)}</td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{formatRupees(item.totalTax)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/75 border-t-2 border-gray-300 font-mono font-bold text-gray-900">
              <td className="py-2.5 px-3 font-sans">Total</td>
              <td className="py-2.5 px-3 text-center">{totLines}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totTaxable.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totCgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totSgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totIgst.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totCess.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totTax.toFixed(2))}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ReceivablesAgeingTable({ query }: { query: ReturnType<typeof useReceivablesAgeing> }) {
  const { data, isLoading, error } = query;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load Receivables Ageing" />;
  if (!data || data.length === 0) return <EmptyState text="No outstanding receivables! All customer accounts are clear." />;

  let totOut = new Big(0);
  let totCur = new Big(0);
  let tot130 = new Big(0);
  let tot3145 = new Big(0);
  let tot4660 = new Big(0);
  let tot6190 = new Big(0);
  let totO90 = new Big(0);

  data.forEach((item) => {
    totOut = totOut.plus(item.totalOutstanding || '0');
    totCur = totCur.plus(item.current || '0');
    tot130 = tot130.plus(item.days1To30 || '0');
    tot3145 = tot3145.plus(item.days31To45 || '0');
    tot4660 = tot4660.plus(item.days46To60 || '0');
    tot6190 = tot6190.plus(item.days61To90 || '0');
    totO90 = totO90.plus(item.over90 || '0');
  });

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Customer Name</th>
              <th className="py-2.5 px-3">GSTIN</th>
              <th className="py-2.5 px-3 text-right">Total Outstanding</th>
              <th className="py-2.5 px-3 text-right">Current</th>
              <th className="py-2.5 px-3 text-right">1-30 Days</th>
              <th className="py-2.5 px-3 text-right text-amber-700 bg-amber-50/50">31-45 Days</th>
              <th className="py-2.5 px-3 text-right text-orange-700 bg-orange-50/50">46-60 Days</th>
              <th className="py-2.5 px-3 text-right text-red-700 bg-red-50/50">61-90 Days</th>
              <th className="py-2.5 px-3 text-right text-rose-800 bg-rose-50/50">90+ Days</th>
              <th className="py-2.5 px-3 text-center">Oldest Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {data.map((item) => (
              <tr key={item.customerId} className="hover:bg-gray-50/75 transition-colors">
                <td className="py-2 px-3 font-sans font-semibold text-gray-900">{item.customerLegalName}</td>
                <td className="py-2 px-3 text-gray-500 whitespace-nowrap">{item.customerGstin}</td>
                <td className="py-2 px-3 text-right font-bold text-gray-900">{formatRupees(item.totalOutstanding)}</td>
                <td className="py-2 px-3 text-right text-emerald-600">{formatRupees(item.current)}</td>
                <td className="py-2 px-3 text-right text-sky-600">{formatRupees(item.days1To30)}</td>
                <td className="py-2 px-3 text-right font-semibold text-amber-800 bg-amber-50/30">
                  {formatRupees(item.days31To45)}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-orange-800 bg-orange-50/30">
                  {formatRupees(item.days46To60)}
                </td>
                <td className="py-2 px-3 text-right font-semibold text-red-800 bg-red-50/30">
                  {formatRupees(item.days61To90)}
                </td>
                <td className="py-2 px-3 text-right font-bold text-rose-900 bg-rose-50/30">
                  {formatRupees(item.over90)}
                </td>
                <td className="py-2 px-3 text-center text-gray-600 whitespace-nowrap">
                  {item.oldestDueDate || '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/75 border-t-2 border-gray-300 font-mono font-bold text-gray-900">
              <td colSpan={2} className="py-2.5 px-3 font-sans">
                Total Outstanding
              </td>
              <td className="py-2.5 px-3 text-right">{formatRupees(totOut.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-emerald-700">{formatRupees(totCur.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-sky-700">{formatRupees(tot130.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-amber-800 bg-amber-100/50">{formatRupees(tot3145.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-orange-800 bg-orange-100/50">{formatRupees(tot4660.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-red-800 bg-red-100/50">{formatRupees(tot6190.toFixed(2))}</td>
              <td className="py-2.5 px-3 text-right text-rose-900 bg-rose-100/50">{formatRupees(totO90.toFixed(2))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function ReceiptsRegisterTable({
  query,
  onInvoiceClick,
}: {
  query: ReturnType<typeof useReceiptsRegister>;
  onInvoiceClick: (id: string) => void;
}) {
  const { data, isLoading, error } = query;

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message="Failed to load Receipts Register" />;
  if (!data || data.length === 0) return <EmptyState text="No receipts recorded for the selected period." />;

  let totAmount = new Big(0);
  data.forEach((r) => {
    if (!r.isReversed) {
      totAmount = totAmount.plus(r.amount || '0');
    }
  });

  return (
    <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Invoice #</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Method</th>
              <th className="py-2.5 px-3">Reference #</th>
              <th className="py-2.5 px-3 text-right">Amount</th>
              <th className="py-2.5 px-3 text-center">Status</th>
              <th className="py-2.5 px-3">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono">
            {data.map((item) => (
              <tr key={item.id} className={`hover:bg-gray-50/75 transition-colors ${item.isReversed ? 'opacity-60 line-through bg-gray-50' : ''}`}>
                <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{item.paymentDate}</td>
                <td
                  className="py-2 px-3 font-semibold text-blue-600 hover:underline cursor-pointer"
                  onClick={() => onInvoiceClick(item.invoiceId)}
                >
                  {item.invoiceNumber}
                </td>
                <td className="py-2 px-3 font-sans text-gray-900 font-medium max-w-[160px] truncate" title={item.customerLegalName}>
                  {item.customerLegalName}
                </td>
                <td className="py-2 px-3 font-sans text-gray-700">{item.paymentMethod}</td>
                <td className="py-2 px-3 text-gray-600">{item.referenceNumber || '-'}</td>
                <td className="py-2 px-3 text-right font-bold text-emerald-700">{formatRupees(item.amount)}</td>
                <td className="py-2 px-3 text-center font-sans">
                  {item.isReversed ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-800" title={item.reversalReason || ''}>
                      REVERSED
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                      ACTIVE
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 font-sans text-gray-500 max-w-[200px] truncate" title={item.notes || ''}>
                  {item.notes || '-'}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100/75 border-t-2 border-gray-300 font-mono font-bold text-gray-900">
              <td colSpan={5} className="py-2.5 px-3 font-sans">
                Total Active Receipts
              </td>
              <td className="py-2.5 px-3 text-right text-emerald-800">{formatRupees(totAmount.toFixed(2))}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-12 text-sm text-gray-500">
      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading report data...
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 text-xs">
      {message}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="bg-white p-8 rounded border border-gray-200 text-center text-gray-500 text-xs shadow-sm">
      {text}
    </div>
  );
}
