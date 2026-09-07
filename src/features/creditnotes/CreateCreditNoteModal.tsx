import React, { useState, useEffect } from 'react';
import { X, AlertCircle, Plus, Trash2, FileText } from 'lucide-react';
import Big from 'big.js';
import type { Invoice } from '@/features/invoices/types';
import { CREDIT_NOTE_REASONS, type CreditNoteReason, type CreateCreditNoteRequest } from './types';
import { useCreateCreditNote } from './api';
import { formatIndianCurrency } from '@/utils/money';

interface CreateCreditNoteModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
  uncreditedBalance?: string;
}

interface EditableLine {
  originalInvoiceLineId?: string;
  itemDescription: string;
  hsnSacCode: string;
  quantity: string;
  maxQuantity: number;
  unitPrice: string;
  taxCategory: 'TAXABLE' | 'NIL_RATED' | 'EXEMPT' | 'NON_GST';
  taxRatePercent: string;
  cessRatePercent: string;
}

export const CreateCreditNoteModal: React.FC<CreateCreditNoteModalProps> = ({
  invoice,
  isOpen,
  onClose,
  uncreditedBalance,
}) => {
  const { mutate: createCreditNote, isPending, error } = useCreateCreditNote(invoice.id);

  const today = new Date().toISOString().split('T')[0];
  const [creditNoteDate, setCreditNoteDate] = useState(today);
  const [reason, setReason] = useState<CreditNoteReason>('SALES_RETURN');
  const [reasonNotes, setReasonNotes] = useState('');
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const maxCreditAllowed = new Big(uncreditedBalance || invoice.grandTotal || '0');

  // Initialize lines from invoice
  useEffect(() => {
    if (isOpen && invoice.lines) {
      setCreditNoteDate(today >= invoice.invoiceDate ? today : invoice.invoiceDate);
      setReason('SALES_RETURN');
      setReasonNotes('');
      setValidationError(null);

      const initialLines: EditableLine[] = invoice.lines.map((l) => ({
        originalInvoiceLineId: l.id,
        itemDescription: l.itemDescription,
        hsnSacCode: l.hsnOrSacCode || '',
        quantity: l.quantity || '1',
        maxQuantity: parseFloat(l.quantity || '1'),
        unitPrice: l.unitPrice || '0',
        taxCategory: (l.taxCategory as any) || 'TAXABLE',
        taxRatePercent: l.taxRatePercent || '18',
        cessRatePercent: l.cessRatePercent || '0',
      }));
      setLines(initialLines);
    }
  }, [isOpen, invoice]);

  if (!isOpen) return null;

  // Calculate live totals using Big.js
  let calculatedTaxable = new Big(0);
  let calculatedTax = new Big(0);

  lines.forEach((l) => {
    const qty = parseFloat(l.quantity) || 0;
    const rate = parseFloat(l.unitPrice) || 0;
    const taxRate = parseFloat(l.taxRatePercent) || 0;

    if (qty > 0 && rate > 0) {
      const lineTaxable = new Big(qty).times(rate);
      const lineTax = lineTaxable.times(taxRate).div(100);
      calculatedTaxable = calculatedTaxable.plus(lineTaxable);
      calculatedTax = calculatedTax.plus(lineTax);
    }
  });

  const calculatedGrandTotal = calculatedTaxable.plus(calculatedTax);
  const exceedsAllowed = calculatedGrandTotal.gt(maxCreditAllowed);

  const handleQuantityChange = (index: number, val: string) => {
    const updated = [...lines];
    updated[index].quantity = val;
    setLines(updated);
  };

  const handleUnitPriceChange = (index: number, val: string) => {
    const updated = [...lines];
    updated[index].unitPrice = val;
    setLines(updated);
  };

  const handleDescriptionChange = (index: number, val: string) => {
    const updated = [...lines];
    updated[index].itemDescription = val;
    setLines(updated);
  };

  const handleRemoveLine = (index: number) => {
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleAddCustomLine = () => {
    setLines([
      ...lines,
      {
        itemDescription: 'Price Adjustment / Discount',
        hsnSacCode: '998313',
        quantity: '1',
        maxQuantity: 999999,
        unitPrice: '0',
        taxCategory: 'TAXABLE',
        taxRatePercent: '18',
        cessRatePercent: '0',
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (creditNoteDate < invoice.invoiceDate) {
      setValidationError(`Credit note date cannot be earlier than invoice date (${invoice.invoiceDate})`);
      return;
    }

    const validLines = lines.filter((l) => parseFloat(l.quantity) > 0 && parseFloat(l.unitPrice) > 0);
    if (validLines.length === 0) {
      setValidationError('At least one item line with quantity and unit price greater than 0 is required');
      return;
    }

    if (calculatedGrandTotal.lte(0)) {
      setValidationError('Total credit note amount must be greater than zero');
      return;
    }

    if (exceedsAllowed) {
      setValidationError(
        `Credit note total (₹ ${calculatedGrandTotal.toFixed(2)}) exceeds remaining credit allowed (₹ ${maxCreditAllowed.toFixed(2)})`
      );
      return;
    }

    const payload: CreateCreditNoteRequest = {
      creditNoteDate,
      reason,
      reasonNotes: reasonNotes.trim() || undefined,
      lines: validLines.map((l) => ({
        originalInvoiceLineId: l.originalInvoiceLineId,
        itemDescription: l.itemDescription,
        hsnSacCode: l.hsnSacCode || undefined,
        quantity: parseFloat(l.quantity),
        unitPrice: parseFloat(l.unitPrice),
        taxCategory: l.taxCategory,
        taxRatePercent: parseFloat(l.taxRatePercent),
        cessRatePercent: parseFloat(l.cessRatePercent) || undefined,
      })),
    };

    createCreditNote(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 text-red-700 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Issue Statutory Credit Note</h2>
              <p className="text-xs text-slate-500">
                Rule 53 / Section 34 CGST Act • Invoice #{invoice.invoiceNumber}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {(validationError || error) && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-semibold">Unable to issue credit note</p>
                <p>{validationError || (error as any)?.message || 'An unexpected error occurred'}</p>
              </div>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Credit Note Date *
              </label>
              <input
                type="date"
                min={invoice.invoiceDate}
                value={creditNoteDate}
                onChange={(e) => setCreditNoteDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                required
              />
              <span className="text-[11px] text-slate-500">Invoice date: {invoice.invoiceDate}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Statutory Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as CreditNoteReason)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              >
                {CREDIT_NOTE_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Max Credit Available
              </label>
              <div className="px-3 py-2 text-sm font-semibold bg-slate-100 text-slate-800 rounded-lg border border-slate-200">
                {formatIndianCurrency(maxCreditAllowed.toFixed(2))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Reason Notes / Remarks (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 5 boxes returned due to transit damage, damaged packaging acknowledged"
              value={reasonNotes}
              onChange={(e) => setReasonNotes(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Credited Items &amp; Quantities
              </label>
              <button
                type="button"
                onClick={handleAddCustomLine}
                className="inline-flex items-center space-x-1 text-xs font-medium text-red-600 hover:text-red-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Adjustment Line</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 w-20">HSN/SAC</th>
                    <th className="p-2.5 w-24 text-right">Credited Qty</th>
                    <th className="p-2.5 w-28 text-right">Unit Rate (₹)</th>
                    <th className="p-2.5 w-20 text-center">Tax %</th>
                    <th className="p-2.5 w-28 text-right">Line Total (₹)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, idx) => {
                    const qty = parseFloat(line.quantity) || 0;
                    const rate = parseFloat(line.unitPrice) || 0;
                    const taxRate = parseFloat(line.taxRatePercent) || 0;
                    const lineVal = new Big(qty).times(rate);
                    const lineTot = lineVal.plus(lineVal.times(taxRate).div(100));

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2">
                          <input
                            type="text"
                            value={line.itemDescription}
                            onChange={(e) => handleDescriptionChange(idx, e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-slate-200 rounded focus:ring-1 focus:ring-red-500"
                            required
                          />
                        </td>
                        <td className="p-2">
                          <span className="text-slate-500 font-mono text-[11px]">{line.hsnSacCode || '-'}</span>
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.quantity}
                            onChange={(e) => handleQuantityChange(idx, e.target.value)}
                            className="w-20 px-2 py-1 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-red-500"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={line.unitPrice}
                            onChange={(e) => handleUnitPriceChange(idx, e.target.value)}
                            className="w-24 px-2 py-1 text-xs text-right border border-slate-200 rounded focus:ring-1 focus:ring-red-500"
                          />
                        </td>
                        <td className="p-2 text-center text-slate-600 font-medium">
                          {line.taxRatePercent}%
                        </td>
                        <td className="p-2 text-right font-medium text-slate-800">
                          {formatIndianCurrency(lineTot.toFixed(2))}
                        </td>
                        <td className="p-2 text-center">
                          {lines.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="text-slate-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary Box */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Credited Taxable Value:</span>
              <span className="font-semibold text-slate-800">{formatIndianCurrency(calculatedTaxable.toFixed(2))}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>GST Tax Reversal (CGST+SGST / IGST):</span>
              <span className="font-semibold text-slate-800">{formatIndianCurrency(calculatedTax.toFixed(2))}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-bold">
              <span className="text-slate-900">Total Credit Note Amount:</span>
              <span className={exceedsAllowed ? 'text-red-600' : 'text-red-700'}>
                {formatIndianCurrency(calculatedGrandTotal.toFixed(2))}
              </span>
            </div>
            {exceedsAllowed && (
              <p className="text-xs text-red-600 font-medium pt-1">
                ⚠️ Warning: Total credit exceeds maximum available credit of {formatIndianCurrency(maxCreditAllowed.toFixed(2))}.
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || exceedsAllowed || calculatedGrandTotal.lte(0)}
              className="px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors flex items-center space-x-2"
            >
              {isPending ? (
                <span>Issuing Credit Note...</span>
              ) : (
                <span>Issue Credit Note</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
