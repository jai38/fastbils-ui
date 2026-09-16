import React, { useState } from 'react';
import {
  FileText,
  Search,
  Download,
  Ban,
  Filter,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCreditNotes, useCancelCreditNote, downloadCreditNotePdf } from './api';
import type { CreditNoteSummary, CreditNoteState } from './types';
import { formatIndianCurrency } from '@/utils/money';
import { formatDate } from '@/utils/date';
import Big from 'big.js';

export const CreditNoteListView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CreditNoteState | ''>('');
  const [cancellingNote, setCancellingNote] = useState<CreditNoteSummary | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const { data, isLoading, error } = useCreditNotes({
    search: searchTerm.trim() || undefined,
    state: (statusFilter as CreditNoteState) || undefined,
  });

  const { mutate: cancelCreditNote, isPending: isCancelling } = useCancelCreditNote();

  const creditNotes: CreditNoteSummary[] = Array.isArray(data)
    ? data
    : (data as any)?.content || [];

  // Summary Metrics calculations using Big.js
  const totalIssuedCount = creditNotes.filter((cn) => cn.state === 'ISSUED').length;
  const totalCancelledCount = creditNotes.filter((cn) => cn.state === 'CANCELLED').length;
  const activeCreditValue = creditNotes
    .filter((cn) => cn.state === 'ISSUED')
    .reduce((acc, cn) => acc.plus(new Big(cn.grandTotal || 0)), new Big(0))
    .toFixed(2);

  const handleDownloadPdf = async (cn: CreditNoteSummary) => {
    try {
      await downloadCreditNotePdf(cn.id, cn.creditNoteNumber);
    } catch (err: any) {
      alert('Failed to download credit note PDF: ' + (err?.message || 'Network error'));
    }
  };

  const handleConfirmCancel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingNote) return;
    if (!cancelReason.trim()) {
      setCancelError('Please provide a reason for cancelling this credit note');
      return;
    }

    setCancelError(null);
    cancelCreditNote(
      {
        creditNoteId: cancellingNote.id,
        payload: { reason: cancelReason.trim() },
      },
      {
        onSuccess: () => {
          setCancellingNote(null);
          setCancelReason('');
        },
        onError: (err: any) => {
          setCancelError(err?.message || 'Failed to cancel credit note');
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <FileText className="w-7 h-7 text-red-600" />
            <span>Credit Notes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Statutory credit notes under Section 34 of the CGST Act &amp; Rule 53
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Issued</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalIssuedCount}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Credit Value</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {formatIndianCurrency(activeCreditValue)}
            </p>
          </div>
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cancelled Notes</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{totalCancelledCount}</p>
          </div>
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <XCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by CN # or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CreditNoteState | '')}
            className="px-3 py-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ISSUED">ISSUED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Credit Notes Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading credit notes...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5" />
            <span>Failed to load credit notes</span>
          </div>
        ) : creditNotes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No credit notes found</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Credit notes are created against issued tax invoices from the invoice details screen.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Credit Note #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Original Invoice</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Taxable</th>
                  <th className="py-3 px-4 text-right">Tax</th>
                  <th className="py-3 px-4 text-right">Grand Total</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {creditNotes.map((cn) => (
                  <tr key={cn.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      {cn.creditNoteNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono">
                      {formatDate(cn.creditNoteDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/invoices/${cn.originalInvoiceId}`}
                        className="font-mono text-red-600 hover:text-red-800 hover:underline flex items-center space-x-1"
                      >
                        <span>{cn.originalInvoiceNumber}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium max-w-xs truncate">
                      {cn.customerLegalName}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {cn.reasonDescription}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700 font-medium">
                      {formatIndianCurrency(cn.taxableValue)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-700">
                      {formatIndianCurrency(cn.totalTax)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatIndianCurrency(cn.grandTotal)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cn.state === 'ISSUED' ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ISSUED</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          <XCircle className="w-3 h-3" />
                          <span>CANCELLED</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleDownloadPdf(cn)}
                          title="Download Rule 53 PDF"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {cn.state === 'ISSUED' && (
                          <button
                            onClick={() => {
                              setCancellingNote(cn);
                              setCancelReason('');
                              setCancelError(null);
                            }}
                            title="Cancel Credit Note"
                            className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancel Confirmation Modal */}
      {cancellingNote && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-red-100 text-red-700 rounded-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Cancel Credit Note</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Are you sure you want to cancel credit note{' '}
                    <strong className="font-mono text-slate-800">{cancellingNote.creditNoteNumber}</strong>?
                    This action will reverse the credit on original invoice #{cancellingNote.originalInvoiceNumber}.
                  </p>
                </div>
              </div>

              {cancelError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                  {cancelError}
                </div>
              )}

              <form onSubmit={handleConfirmCancel} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Reason for Cancellation *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Issued with wrong quantity, replaced by CN/2026-27/0002"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCancellingNote(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
                  >
                    Go Back
                  </button>
                  <button
                    type="submit"
                    disabled={isCancelling || !cancelReason.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                  >
                    {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
