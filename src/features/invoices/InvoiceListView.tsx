import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInvoices, downloadInvoicePdf } from './api';
import { formatRupees } from '@/utils/money';
import type { InvoiceState } from './types';

export function InvoiceListView() {
  const navigate = useNavigate();
  const [stateFilter, setStateFilter] = useState<InvoiceState | ''>('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const { data, isLoading, error } = useInvoices({
    state: stateFilter ? stateFilter : undefined,
    search: search ? search : undefined,
    fromDate: fromDate ? fromDate : undefined,
    toDate: toDate ? toDate : undefined,
  });

  const invoices = data?.content || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Invoices</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            GST-compliant invoices, draft management, and immutable legal records.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/invoices/new')}
          className="inline-flex items-center justify-center px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm transition-colors"
        >
          + Create Invoice
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded border border-gray-200 shadow-sm">
        {/* Status Tabs */}
        <div className="flex items-center space-x-1 border border-gray-200 rounded p-0.5 bg-gray-50 text-xs">
          <button
            type="button"
            onClick={() => setStateFilter('')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              stateFilter === ''
                ? 'bg-white text-gray-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStateFilter('DRAFT')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              stateFilter === 'DRAFT'
                ? 'bg-white text-amber-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Drafts
          </button>
          <button
            type="button"
            onClick={() => setStateFilter('ISSUED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              stateFilter === 'ISSUED'
                ? 'bg-white text-blue-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Issued
          </button>
          <button
            type="button"
            onClick={() => setStateFilter('CANCELLED')}
            className={`px-2.5 py-1 rounded font-medium transition-colors ${
              stateFilter === 'CANCELLED'
                ? 'bg-white text-red-900 shadow-sm border border-gray-200'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Cancelled
          </button>
        </div>

        {/* Search & Dates */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Search #, PO, Ref..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2.5 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-44"
          />
          <div className="flex items-center space-x-1 text-xs text-gray-500">
            <span>From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
            />
            <span>To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-300 rounded"
            />
          </div>
          {(search || fromDate || toDate || stateFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setFromDate('');
                setToDate('');
                setStateFilter('');
              }}
              className="text-xs text-gray-500 hover:text-gray-800 underline px-1"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500">Loading invoices...</div>
        ) : error ? (
          <div className="p-8 text-center text-xs text-red-500">Failed to load invoices.</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-3xl mb-2">📋</div>
            <div className="text-sm font-semibold text-gray-900">No invoices found</div>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              Create your first draft invoice, add lines with GST rates, and issue it with an atomic Rule 46 number.
            </p>
            <button
              type="button"
              onClick={() => navigate('/invoices/new')}
              className="mt-4 inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Create Draft Invoice
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Invoice #</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Due Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Customer</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Status</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Payment</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Total</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Balance</th>
                  <th className="px-3 py-2 text-left font-semibold text-gray-700">Ref</th>
                  <th className="px-3 py-2 text-right font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => navigate(`/invoices/${inv.id}`)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 py-2.5 font-medium font-mono text-gray-900">
                      {inv.invoiceNumber ? (
                        inv.invoiceNumber
                      ) : (
                        <span className="text-amber-700 italic font-sans">
                          {inv.previewInvoiceNumber || 'Draft'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inv.invoiceDate}</td>
                    <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">{inv.dueDate}</td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 max-w-[200px] truncate">
                      {inv.customerLegalName}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          inv.state === 'ISSUED'
                            ? 'bg-blue-100 text-blue-800'
                            : inv.state === 'DRAFT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.state}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            inv.paymentStatus === 'PAID'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.paymentStatus === 'OVERDUE' || inv.paymentStatus === 'PARTIALLY_PAID_OVERDUE'
                              ? 'bg-rose-100 text-rose-800'
                              : inv.paymentStatus === 'PARTIALLY_PAID'
                              ? 'bg-blue-100 text-blue-800'
                              : inv.paymentStatus === 'CANCELLED'
                              ? 'bg-gray-100 text-gray-600 line-through'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {inv.paymentStatus?.replace(/_/g, ' ')}
                        </span>
                        {inv.ageingBucket && inv.ageingBucket !== 'CURRENT' && inv.state === 'ISSUED' && (
                          <span
                            title={inv.ageingBucket}
                            className={`inline-flex items-center px-1 py-0.2 rounded text-[9px] font-bold ${
                              inv.ageingBucket === 'DAYS_31_TO_45'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-red-100 text-red-900 border border-red-300'
                            }`}
                          >
                            {inv.ageingBucket === 'DAYS_31_TO_45' ? '31-45d' : inv.ageingBucket.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-gray-900 whitespace-nowrap">
                      {formatRupees(inv.grandTotal)}
                    </td>
                    <td className={`px-3 py-2.5 text-right font-mono font-medium whitespace-nowrap ${
                      Number(inv.balanceAmount || 0) > 0 ? 'text-amber-800 font-semibold' : 'text-gray-500'
                    }`}>
                      {inv.state === 'ISSUED' ? formatRupees(inv.balanceAmount) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                      {inv.collectionReference || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      {inv.state === 'DRAFT' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/invoices/${inv.id}/edit`);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium mr-2"
                        >
                          Edit
                        </button>
                      ) : (
                        <span className="text-gray-400 mr-2">Locked</span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices/${inv.id}`);
                        }}
                        className="text-gray-600 hover:text-gray-900 font-medium mr-2"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          await downloadInvoicePdf(inv.id, inv.invoiceNumber);
                        }}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                        title="Download PDF"
                      >
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
