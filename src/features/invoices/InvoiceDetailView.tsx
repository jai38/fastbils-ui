import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useOrganisationProfile, useOrganisationLogo } from '@/features/organisation/api';
import {
  useInvoice,
  useIssueInvoice,
  useDeleteDraftInvoice,
  useCancelInvoice,
  downloadInvoicePdf,
} from './api';
import { useInvoiceReceipts } from '@/features/receipts/api';
import { RecordReceiptModal } from '@/features/receipts/RecordReceiptModal';
import { ReverseReceiptModal } from '@/features/receipts/ReverseReceiptModal';
import type { Receipt } from '@/features/receipts/types';
import Big from 'big.js';
import { useInvoiceCreditNotes, downloadCreditNotePdf, useCancelCreditNote } from '@/features/creditnotes/api';
import { CreateCreditNoteModal } from '@/features/creditnotes/CreateCreditNoteModal';
import type { CreditNote } from '@/features/creditnotes/types';
import { formatRupees } from '@/utils/money';
import { formatDate } from '@/utils/date';
import { getStateName } from '@/utils/indianStates';

export function InvoiceDetailView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { data: organisation } = useOrganisationProfile();
  const { data: logoBlobUrl } = useOrganisationLogo(organisation?.logoObjectKey);

  const { data: invoice, isLoading, error } = useInvoice(id);

  const issueMutation = useIssueInvoice();
  const deleteDraftMutation = useDeleteDraftInvoice();
  const cancelMutation = useCancelInvoice();
  const { data: receipts = [], isLoading: isLoadingReceipts } = useInvoiceReceipts(id);
  const { data: creditNotes = [], isLoading: isLoadingCreditNotes } = useInvoiceCreditNotes(id);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showRecordReceiptModal, setShowRecordReceiptModal] = useState(false);
  const [receiptToReverse, setReceiptToReverse] = useState<Receipt | null>(null);
  const [showCreditNoteModal, setShowCreditNoteModal] = useState(false);
  const [creditNoteToCancel, setCreditNoteToCancel] = useState<CreditNote | null>(null);
  const [cnCancelReason, setCnCancelReason] = useState('');
  const [cnCancelError, setCnCancelError] = useState<string | null>(null);
  const cancelCreditNoteMutation = useCancelCreditNote(id);

  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      setActionError(null);
      await downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
    } catch (err) {
      setActionError((err as Error).message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading invoice...</div>;
  }

  if (error || !invoice) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="text-sm font-semibold text-red-600">Invoice not found</div>
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="text-xs text-blue-600 underline"
        >
          ← Back to Invoices
        </button>
      </div>
    );
  }

  const isOwner = user?.role === 'OWNER';
  const isDraft = invoice.state === 'DRAFT';
  const isIssued = invoice.state === 'ISSUED';
  const isCancelled = invoice.state === 'CANCELLED';
  const isIntraState = invoice.supplyType === 'INTRA_STATE';

  const totalCredited = creditNotes
    .filter((cn) => cn.state === 'ISSUED')
    .reduce((sum, cn) => sum.plus(cn.grandTotal || 0), new Big(0));
  const uncreditedBalance = invoice ? new Big(invoice.grandTotal || '0').minus(totalCredited).toFixed(2) : '0';

  const handleConfirmCancelCreditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditNoteToCancel || !cnCancelReason.trim()) return;
    setCnCancelError(null);
    try {
      await cancelCreditNoteMutation.mutateAsync({
        creditNoteId: creditNoteToCancel.id,
        payload: { reason: cnCancelReason.trim() },
      });
      setCreditNoteToCancel(null);
      setCnCancelReason('');
    } catch (err: any) {
      setCnCancelError(err.message || 'Failed to cancel credit note');
    }
  };

  const handleIssue = async () => {
    setActionError(null);
    try {
      await issueMutation.mutateAsync(invoice.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to issue invoice');
    }
  };

  const handleDeleteDraft = async () => {
    if (!window.confirm('Are you sure you want to permanently delete this draft?')) {
      return;
    }
    setActionError(null);
    try {
      await deleteDraftMutation.mutateAsync(invoice.id);
      navigate('/invoices');
    } catch (err: any) {
      setActionError(err.message || 'Failed to delete draft invoice');
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim() || cancellationReason.trim().length < 5) {
      setActionError('Cancellation reason must be at least 5 characters');
      return;
    }
    setActionError(null);
    try {
      await cancelMutation.mutateAsync({
        id: invoice.id,
        payload: { reason: cancellationReason.trim() },
      });
      setShowCancelModal(false);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel invoice');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => navigate('/invoices')}
          className="text-xs font-medium text-gray-600 hover:text-gray-900 inline-flex items-center space-x-1"
        >
          <span>←</span> <span>Back to Invoices</span>
        </button>

        <div className="flex items-center space-x-2">
          {isDraft && (
            <>
              <button
                type="button"
                onClick={handleDeleteDraft}
                disabled={deleteDraftMutation.isPending}
                className="px-3 py-1.5 text-xs font-medium text-red-600 bg-white border border-red-200 rounded hover:bg-red-50"
              >
                Delete Draft
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-1.5 disabled:opacity-50"
              >
                <span>📄</span>
                <span>{downloadingPdf ? 'Generating...' : 'Preview PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/invoices/${invoice.id}/edit`)}
                className="px-3.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Edit Draft
              </button>
              <button
                type="button"
                onClick={handleIssue}
                disabled={issueMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
              >
                {issueMutation.isPending ? 'Issuing...' : 'Issue Invoice'}
              </button>
            </>
          )}

          {isIssued && (
            <>
              {Number(invoice.balanceAmount || invoice.grandTotal || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRecordReceiptModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <span>💳</span>
                  <span>Record Payment</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={downloadingPdf}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span>📄</span>
                <span>{downloadingPdf ? 'Downloading...' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
                title="Print in Browser"
              >
                🖨️
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="px-3 py-1.5 text-xs font-medium text-red-700 bg-white border border-red-300 rounded hover:bg-red-50"
                >
                  Cancel Invoice
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {actionError}
        </div>
      )}

      {/* Cancellation Banner */}
      {isCancelled && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-xs text-red-800 space-y-1">
          <div className="font-bold flex items-center space-x-1.5">
            <span>🚫</span>
            <span>THIS INVOICE IS CANCELLED</span>
          </div>
          <div>
            <strong>Cancellation Reason:</strong> {invoice.cancellationReason || 'No reason provided'}
          </div>
          {invoice.cancelledAt && (
            <div className="text-red-600 text-[11px]">
              Cancelled on: {new Date(invoice.cancelledAt).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* Printable Sheet Container */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-4">
          <div className="flex items-start space-x-3">
            {logoBlobUrl && (
              <img src={logoBlobUrl} alt="Org Logo" className="h-12 w-auto object-contain max-w-[140px]" />
            )}
            <div>
              <div className="text-2xl font-black tracking-tight text-gray-900 uppercase">
                {organisation?.gstin ? 'TAX INVOICE' : 'BILL OF SUPPLY'}
              </div>
              <div className="text-xs text-gray-500 font-medium">
                (Issued under Rule 46 of the CGST Rules, 2017)
              </div>
            </div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-sm font-bold font-mono text-gray-900">
              {invoice.invoiceNumber || (
                <span className="text-amber-700 font-sans italic">
                  {invoice.previewInvoiceNumber || 'Draft Preview'}
                </span>
              )}
            </div>
            <div className="flex items-center justify-end gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-800">
                {invoice.state}
              </span>
              {isIssued && (
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  invoice.paymentStatus === 'PAID'
                    ? 'bg-green-100 text-green-800 border border-green-200'
                    : invoice.paymentStatus === 'OVERDUE' || invoice.paymentStatus === 'PARTIALLY_PAID_OVERDUE'
                    ? 'bg-red-100 text-red-800 border border-red-200'
                    : invoice.paymentStatus === 'PARTIALLY_PAID'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }`}>
                  {invoice.paymentStatus?.replace(/_/g, ' ')}
                </span>
              )}
              {invoice.ageingBucket && invoice.ageingBucket !== 'CURRENT' && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  invoice.ageingBucket === 'DAYS_31_TO_45'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-red-100 text-red-900 border border-red-300'
                }`}>
                  {invoice.ageingBucket === 'DAYS_31_TO_45' ? '⚠️ 31-45 Days Overdue' : invoice.ageingBucket?.replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Dates & Reference Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-3 bg-gray-50 rounded border border-gray-100">
          <div>
            <div className="text-[11px] text-gray-500">Invoice Date:</div>
            <div className="font-semibold text-gray-900 font-mono">{formatDate(invoice.invoiceDate)}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Payment Due Date:</div>
            <div className="font-semibold text-gray-900 font-mono">{formatDate(invoice.dueDate)}</div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Place of Supply:</div>
            <div className="font-semibold text-gray-900">
              State {invoice.placeOfSupplyStateCode} {getStateName(invoice.placeOfSupplyStateCode) ? `(${getStateName(invoice.placeOfSupplyStateCode)})` : ''} ({invoice.supplyType})
            </div>
          </div>
          <div>
            <div className="text-[11px] text-gray-500">Reverse Charge:</div>
            <div className="font-semibold text-gray-900">
              {invoice.isReverseCharge ? 'Yes' : 'No'}
            </div>
          </div>
        </div>

        {/* Supplier & Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Supplier */}
          <div className="border border-gray-200 p-3.5 rounded space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Billed By (Supplier)
            </div>
            <div className="font-bold text-gray-900 text-sm">{organisation?.legalName}</div>
            {organisation?.tradeName && (
              <div className="text-gray-600">Trade Name: {organisation.tradeName}</div>
            )}
            <div className="text-gray-600">
              {organisation?.addressLine1}
              {organisation?.addressLine2 ? `, ${organisation.addressLine2}` : ''}
            </div>
            <div className="text-gray-600">
              {organisation?.city} - {organisation?.pincode}
            </div>
            <div className="pt-1 text-gray-900">
              <strong>GSTIN:</strong>{' '}
              <span className="font-mono">{organisation?.gstin || 'Unregistered'}</span>
            </div>
            <div className="text-gray-900">
              <strong>State:</strong> Code {organisation?.stateCode}
            </div>
          </div>

          {/* Customer */}
          <div className="border border-gray-200 p-3.5 rounded space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              Billed To (Recipient)
            </div>
            <div className="font-bold text-gray-900 text-sm">{invoice.customerLegalName}</div>
            <div className="pt-1 text-gray-900">
              <strong>GSTIN:</strong>{' '}
              <span className="font-mono">{invoice.customerGstin || 'Unregistered'}</span>
            </div>
            <div className="text-gray-900">
              <strong>Place of Supply:</strong> State Code {invoice.placeOfSupplyStateCode}
            </div>
            {invoice.poNumber && (
              <div className="text-gray-700 pt-1">
                <strong>PO Reference:</strong> {invoice.poNumber}{' '}
                {invoice.poDate && `(Dated: ${formatDate(invoice.poDate)})`}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-8">#</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700">Description</th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 w-20">HSN/SAC</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 w-16">Qty</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 w-24">Rate (₹)</th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 w-24">Taxable (₹)</th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 w-16">GST</th>
                {isIntraState ? (
                  <>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700 w-20">CGST (₹)</th>
                    <th className="px-3 py-2 text-right font-semibold text-gray-700 w-20">SGST (₹)</th>
                  </>
                ) : (
                  <th className="px-3 py-2 text-right font-semibold text-gray-700 w-24">IGST (₹)</th>
                )}
                <th className="px-3 py-2 text-right font-semibold text-gray-700 w-28">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {invoice.lines.map((l) => (
                <tr key={l.id}>
                  <td className="px-3 py-2 text-gray-500 font-mono">{l.lineNumber}</td>
                  <td className="px-3 py-2 font-medium text-gray-900">{l.itemDescription}</td>
                  <td className="px-3 py-2 font-mono text-gray-600">{l.hsnOrSacCode || '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {l.quantity} {l.unitOfMeasure}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {formatRupees(l.unitPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-gray-700">
                    {formatRupees(l.taxableValue)}
                  </td>
                  <td className="px-3 py-2 text-center font-mono text-gray-700">
                    {l.taxRatePercent}%
                  </td>
                  {isIntraState ? (
                    <>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">
                        {formatRupees(l.cgstAmount)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-gray-700">
                        {formatRupees(l.sgstAmount)}
                      </td>
                    </>
                  ) : (
                    <td className="px-3 py-2 text-right font-mono text-gray-700">
                      {formatRupees(l.igstAmount)}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-mono font-semibold text-gray-900">
                    {formatRupees(l.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals & Tax Slabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Rate Slab Summary */}
          <div className="border border-gray-200 rounded p-3 bg-gray-50 space-y-2">
            <div className="font-bold text-gray-800 text-[11px] uppercase tracking-wide">
              GST Rate Slab Breakdown
            </div>
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600">
                  <th className="py-1 text-left">Rate</th>
                  <th className="py-1 text-right">Taxable</th>
                  {isIntraState ? (
                    <>
                      <th className="py-1 text-right">CGST</th>
                      <th className="py-1 text-right">SGST</th>
                    </>
                  ) : (
                    <th className="py-1 text-right">IGST</th>
                  )}
                  <th className="py-1 text-right">Tax</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {invoice.slabSummaries.map((s) => (
                  <tr key={s.taxRatePercent}>
                    <td className="py-1 font-mono">{s.taxRatePercent}%</td>
                    <td className="py-1 text-right font-mono">{formatRupees(s.taxableValue)}</td>
                    {isIntraState ? (
                      <>
                        <td className="py-1 text-right font-mono">{formatRupees(s.cgstAmount)}</td>
                        <td className="py-1 text-right font-mono">{formatRupees(s.sgstAmount)}</td>
                      </>
                    ) : (
                      <td className="py-1 text-right font-mono">{formatRupees(s.igstAmount)}</td>
                    )}
                    <td className="py-1 text-right font-mono font-semibold">
                      {formatRupees(s.totalTax)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grand Totals */}
          <div className="border border-gray-200 rounded p-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono">{formatRupees(invoice.subtotalBeforeDiscount)}</span>
            </div>
            {parseFloat(invoice.totalDiscount) > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount:</span>
                <span className="font-mono">-{formatRupees(invoice.totalDiscount)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-800 border-t border-gray-100 pt-1">
              <span>Taxable Value:</span>
              <span className="font-mono">{formatRupees(invoice.taxableValue)}</span>
            </div>
            {isIntraState ? (
              <>
                <div className="flex justify-between text-gray-600">
                  <span>Total CGST:</span>
                  <span className="font-mono">{formatRupees(invoice.totalCgst)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Total SGST:</span>
                  <span className="font-mono">{formatRupees(invoice.totalSgst)}</span>
                </div>
              </>
            ) : (
              <div className="flex justify-between text-gray-600">
                <span>Total IGST:</span>
                <span className="font-mono">{formatRupees(invoice.totalIgst)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600">
              <span>Total Tax:</span>
              <span className="font-mono">{formatRupees(invoice.totalTax)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Rupee Round-Off:</span>
              <span className="font-mono">{invoice.roundOff}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-2">
              <span>Invoice Total:</span>
              <span className="font-mono text-blue-700">{formatRupees(invoice.grandTotal)}</span>
            </div>
            {invoice.amountInWords && (
              <div className="pt-2 text-[11px] text-gray-600 italic border-t border-gray-100">
                <strong>Amount in Words:</strong> {invoice.amountInWords}
              </div>
            )}
          </div>
        </div>

        {/* Banking & Collection Reference Box (DOMAIN.md Section 7) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-gray-200">
          <div className="bg-blue-50/60 border border-blue-200 rounded p-3.5 space-y-1">
            <div className="font-bold text-blue-900 text-xs uppercase tracking-wide">
              Bank Details for Electronic Transfer
            </div>
            <div className="text-gray-700">
              <strong>Account Name:</strong> {organisation?.bankAccountName || organisation?.legalName}
            </div>
            <div className="text-gray-700">
              <strong>Account Number:</strong>{' '}
              <span className="font-mono font-bold text-gray-900">
                {organisation?.bankAccountNumber || 'N/A'}
              </span>
            </div>
            <div className="text-gray-700">
              <strong>IFSC Code:</strong>{' '}
              <span className="font-mono font-bold text-gray-900">
                {organisation?.bankIfsc || 'N/A'}
              </span>
            </div>
            <div className="text-gray-700">
              <strong>Bank & Branch:</strong> {organisation?.bankName || 'N/A'}{' '}
              {organisation?.bankBranch ? `(${organisation.bankBranch})` : ''}
            </div>
            {organisation?.upiId && (
              <div className="text-gray-700 pt-1">
                <strong>UPI ID:</strong> <span className="font-mono font-bold text-blue-800">{organisation.upiId}</span>
              </div>
            )}
          </div>

          {/* Collection Reference Box */}
          <div className="bg-amber-50/60 border border-amber-200 rounded p-3.5 flex flex-col justify-center text-center space-y-1">
            <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wide">
              Payment Narration Reference
            </div>
            <div className="text-xl font-extrabold font-mono text-amber-950 tracking-wider">
              {invoice.collectionReference || 'ALLOCATED ON ISSUE'}
            </div>
            <div className="text-[11px] text-amber-700">
              Please quote this reference in your bank transfer narration or UPI remark.
            </div>
          </div>
        </div>

        {/* Notes & Terms */}
        {(invoice.notes || invoice.termsText) && (
          <div className="pt-2 border-t border-gray-100 text-xs text-gray-600 space-y-2">
            {invoice.notes && (
              <div>
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}
            {invoice.termsText && (
              <div>
                <strong>Terms & Conditions:</strong> {invoice.termsText}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receipts & Payments Ledger (Non-Print) */}
      {isIssued && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <span>💳</span>
                <span>Payment & Receipts Ledger</span>
                <span className="text-xs font-normal text-gray-500">
                  ({receipts.length} {receipts.length === 1 ? 'entry' : 'entries'})
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Manual collections recorded against this invoice. Reversals are append-only.
              </p>
            </div>
            {Number(invoice.balanceAmount || 0) > 0 && (
              <button
                type="button"
                onClick={() => setShowRecordReceiptModal(true)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 shadow-sm flex items-center gap-1 self-start sm:self-auto"
              >
                <span>+</span>
                <span>Record Payment</span>
              </button>
            )}
          </div>

          {/* Running Balance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-gray-50 rounded border border-gray-100">
              <span className="text-[11px] text-gray-500 block">Total Invoiced</span>
              <span className="text-sm font-bold text-gray-900 font-mono">
                {formatRupees(invoice.grandTotal)}
              </span>
            </div>
            <div className="p-3 bg-green-50/70 rounded border border-green-100">
              <span className="text-[11px] text-green-700 block">Total Received</span>
              <span className="text-sm font-bold text-green-800 font-mono">
                {formatRupees(invoice.totalReceived)}
              </span>
            </div>
            <div className={`p-3 rounded border ${
              Number(invoice.balanceAmount || 0) > 0
                ? 'bg-amber-50/70 border-amber-200'
                : 'bg-gray-50 border-gray-100'
            }`}>
              <span className="text-[11px] text-gray-600 block">Remaining Balance</span>
              <span className={`text-sm font-bold font-mono ${
                Number(invoice.balanceAmount || 0) > 0 ? 'text-amber-900' : 'text-gray-900'
              }`}>
                {formatRupees(invoice.balanceAmount)}
              </span>
            </div>
            <div className="p-3 bg-blue-50/60 rounded border border-blue-100">
              <span className="text-[11px] text-blue-700 block">Payment Status</span>
              <span className="text-xs font-bold text-blue-900">
                {invoice.paymentStatus?.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Receipts Table */}
          {isLoadingReceipts ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading receipts...</div>
          ) : receipts.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">No payment receipts recorded yet</p>
              <p className="text-gray-400">Click "Record Payment" above to log manual collections (UPI, NEFT, Cash, Cheque, Card).</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-semibold text-gray-600 text-left">
                  <tr>
                    <th className="px-3 py-2">Payment Date</th>
                    <th className="px-3 py-2">Method</th>
                    <th className="px-3 py-2">Reference / Note</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {receipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className={receipt.isReversed ? 'bg-red-50/20 text-gray-400' : 'hover:bg-gray-50/60'}
                    >
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{formatDate(receipt.paymentDate)}</td>
                      <td className="px-3 py-2 font-medium">{receipt.paymentMethod}</td>
                      <td className="px-3 py-2">
                        {receipt.referenceNumber && (
                          <div className="font-mono text-gray-700">{receipt.referenceNumber}</div>
                        )}
                        {receipt.notes && (
                          <div className="text-[11px] text-gray-500 italic">{receipt.notes}</div>
                        )}
                        {receipt.isReversed && receipt.reversalReason && (
                          <div className="text-[10px] text-red-600 mt-0.5">
                            Reversed: {receipt.reversalReason}
                          </div>
                        )}
                      </td>
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${
                        receipt.isReversed ? 'line-through text-gray-400' : 'text-gray-900'
                      }`}>
                        {formatRupees(receipt.amount)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {receipt.isReversed ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            REVERSED
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {!receipt.isReversed && (
                          <button
                            type="button"
                            onClick={() => setReceiptToReverse(receipt)}
                            className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                          >
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Credit Notes Section */}
      {!isDraft && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <span>Credit Notes (Section 34 / Rule 53)</span>
                {totalCredited.gt(0) && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-800">
                    {formatRupees(totalCredited.toFixed(2))} Credited
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500">
                Statutory adjustment documents issued against this tax invoice
              </p>
            </div>

            {isIssued && (
              <button
                type="button"
                onClick={() => setShowCreditNoteModal(true)}
                disabled={new Big(uncreditedBalance).lte(0)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1 self-start sm:self-auto"
              >
                <span>+</span>
                <span>Issue Credit Note</span>
              </button>
            )}
          </div>

          {/* Credit Notes Table */}
          {isLoadingCreditNotes ? (
            <div className="text-center py-4 text-xs text-gray-500">Loading credit notes...</div>
          ) : creditNotes.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-gray-200 rounded-lg text-xs text-gray-500 space-y-1">
              <p className="font-medium text-gray-700">No credit notes issued for this invoice</p>
              <p className="text-gray-400">
                Use credit notes to record sales returns, post-sale volume discounts, or invoice corrections.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-semibold text-gray-600 text-left">
                  <tr>
                    <th className="px-3 py-2">Credit Note #</th>
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2 text-right">Taxable</th>
                    <th className="px-3 py-2 text-right">Tax</th>
                    <th className="px-3 py-2 text-right">Total Credit</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {creditNotes.map((cn) => (
                    <tr
                      key={cn.id}
                      className={cn.state === 'CANCELLED' ? 'bg-red-50/20 text-gray-400' : 'hover:bg-gray-50/60'}
                    >
                      <td className="px-3 py-2 font-mono font-semibold text-gray-900">{cn.creditNoteNumber}</td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{formatDate(cn.creditNoteDate)}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-gray-700">{cn.reasonDescription}</span>
                        {cn.reasonNotes && (
                          <div className="text-[11px] text-gray-500 italic">{cn.reasonNotes}</div>
                        )}
                        {cn.state === 'CANCELLED' && cn.cancellationReason && (
                          <div className="text-[10px] text-red-600 mt-0.5">
                            Cancelled: {cn.cancellationReason}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{formatRupees(cn.taxableValue)}</td>
                      <td className="px-3 py-2 text-right font-mono">{formatRupees(cn.totalTax)}</td>
                      <td className={`px-3 py-2 text-right font-mono font-bold ${
                        cn.state === 'CANCELLED' ? 'line-through text-gray-400' : 'text-red-700'
                      }`}>
                        {formatRupees(cn.grandTotal)}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {cn.state === 'ISSUED' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ISSUED
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                            CANCELLED
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap space-x-2">
                        <button
                          type="button"
                          onClick={() => downloadCreditNotePdf(cn.id, cn.creditNoteNumber)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          PDF
                        </button>
                        {cn.state === 'ISSUED' && isIssued && (
                          <button
                            type="button"
                            onClick={() => {
                              setCreditNoteToCancel(cn);
                              setCnCancelReason('');
                              setCnCancelError(null);
                            }}
                            className="text-xs text-red-600 hover:text-red-800 font-medium hover:underline"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Credit Note Modal */}
      <CreateCreditNoteModal
        invoice={invoice}
        isOpen={showCreditNoteModal}
        onClose={() => setShowCreditNoteModal(false)}
        uncreditedBalance={uncreditedBalance}
      />

      {/* Cancel Credit Note Confirmation Modal */}
      {creditNoteToCancel && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-base">
              <span>⚠️</span>
              <span>Cancel Credit Note {creditNoteToCancel.creditNoteNumber}</span>
            </div>
            <p className="text-xs text-gray-600">
              Cancelling will reverse this credit note and restore ₹ {creditNoteToCancel.grandTotal} to the invoice balance.
            </p>

            {cnCancelError && (
              <div className="p-2 bg-red-50 text-red-700 text-xs rounded border border-red-200">
                {cnCancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancelCreditNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the reason for cancellation..."
                  value={cnCancelReason}
                  onChange={(e) => setCnCancelReason(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setCreditNoteToCancel(null)}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={cancelCreditNoteMutation.isPending || !cnCancelReason.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 shadow-sm"
                >
                  {cancelCreditNoteMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Receipt Modal */}
      <RecordReceiptModal
        invoice={invoice}
        isOpen={showRecordReceiptModal}
        onClose={() => setShowRecordReceiptModal(false)}
      />

      {/* Reverse Receipt Modal */}
      <ReverseReceiptModal
        receipt={receiptToReverse}
        isOpen={Boolean(receiptToReverse)}
        onClose={() => setReceiptToReverse(null)}
      />

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-2 text-red-600 font-bold text-base">
              <span>⚠️</span>
              <span>Cancel Invoice {invoice.invoiceNumber}</span>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                Under GST regulations, invoice numbers are consecutive and cannot be reused or
                deleted. Cancelling will mark this document permanently as CANCELLED and exclude it
                from revenue.
              </p>
              <div>
                <label className="block font-semibold text-gray-800 mb-1">
                  Cancellation Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="State the reason for cancellation..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-xs focus:ring-1 focus:ring-red-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 rounded hover:bg-red-700 shadow-sm"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
