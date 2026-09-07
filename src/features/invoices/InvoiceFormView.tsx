import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Big from 'big.js';
import { useAuth } from '@/features/auth/AuthContext';
import { useCustomers } from '@/features/customers/api';
import {
  useCreateDraftInvoice,
  useUpdateDraftInvoice,
  useInvoice,
  useIssueInvoice,
} from './api';
import { formatRupees } from '@/utils/money';
import type { InvoiceLineInput, CreateDraftInvoiceRequest } from './types';

const GST_RATES = ['0', '5', '12', '18', '28'];

interface LocalLineItem {
  id: string;
  itemDescription: string;
  hsnOrSacCode: string;
  isService: boolean;
  quantity: string;
  unitOfMeasure: string;
  unitPrice: string;
  discountPercent: string;
  taxRatePercent: string;
  taxCategory: 'TAXABLE' | 'NIL_RATED' | 'EXEMPT' | 'ZERO_RATED' | 'NON_GST';
}

export function InvoiceFormView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { organisation } = useAuth();
  const { data: customerData } = useCustomers({ isArchived: false, size: 100 });
  const customers = customerData?.content || [];

  const { data: existingInvoice, isLoading: isLoadingExisting } = useInvoice(id);

  const createDraftMutation = useCreateDraftInvoice();
  const updateDraftMutation = useUpdateDraftInvoice();
  const issueMutation = useIssueInvoice();

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryOrAcceptanceDate, setDeliveryOrAcceptanceDate] = useState('');
  const [agreedCreditDays, setAgreedCreditDays] = useState('30');
  const [placeOfSupplyStateCode, setPlaceOfSupplyStateCode] = useState('');
  const [isReverseCharge, setIsReverseCharge] = useState(false);
  const [poNumber, setPoNumber] = useState('');
  const [poDate, setPoDate] = useState('');
  const [notes, setNotes] = useState('');
  const [termsText, setTermsText] = useState('');

  const [lines, setLines] = useState<LocalLineItem[]>([
    {
      id: '1',
      itemDescription: '',
      hsnOrSacCode: '',
      isService: false,
      quantity: '1',
      unitOfMeasure: 'NOS',
      unitPrice: '0.00',
      discountPercent: '0.00',
      taxRatePercent: '18',
      taxCategory: 'TAXABLE',
    },
  ]);

  const [showIssueModal, setShowIssueModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate form if editing existing draft
  useEffect(() => {
    if (existingInvoice) {
      if (existingInvoice.state !== 'DRAFT') {
        navigate(`/invoices/${existingInvoice.id}`);
        return;
      }
      setCustomerId(existingInvoice.customerId);
      setInvoiceDate(existingInvoice.invoiceDate);
      setDeliveryOrAcceptanceDate(existingInvoice.deliveryOrAcceptanceDate || '');
      setAgreedCreditDays(String(existingInvoice.agreedCreditDays));
      setPlaceOfSupplyStateCode(existingInvoice.placeOfSupplyStateCode);
      setIsReverseCharge(Boolean(existingInvoice.isReverseCharge));
      setPoNumber(existingInvoice.poNumber || '');
      setPoDate(existingInvoice.poDate || '');
      setNotes(existingInvoice.notes || '');
      setTermsText(existingInvoice.termsText || '');

      if (existingInvoice.lines && existingInvoice.lines.length > 0) {
        setLines(
          existingInvoice.lines.map((l, index) => ({
            id: String(index + 1),
            itemDescription: l.itemDescription,
            hsnOrSacCode: l.hsnOrSacCode || '',
            isService: l.isService,
            quantity: l.quantity,
            unitOfMeasure: l.unitOfMeasure,
            unitPrice: l.unitPrice,
            discountPercent: l.discountPercent,
            taxRatePercent: l.taxRatePercent,
            taxCategory: l.taxCategory,
          }))
        );
      }
    }
  }, [existingInvoice, navigate]);

  // When customer changes, auto-fill credit days and place of supply
  const handleCustomerChange = (selectedId: string) => {
    setCustomerId(selectedId);
    const selected = customers.find((c) => c.id === selectedId);
    if (selected) {
      if (selected.creditDays) {
        setAgreedCreditDays(String(selected.creditDays));
      }
      const pos = selected.defaultPlaceOfSupplyStateCode || selected.billingStateCode;
      if (pos) {
        setPlaceOfSupplyStateCode(pos);
      }
    }
  };

  // Due Date calculation
  const calculatedDueDate = (() => {
    try {
      const baseDateStr = deliveryOrAcceptanceDate || invoiceDate;
      const base = new Date(baseDateStr);
      if (!isNaN(base.getTime())) {
        const days = parseInt(agreedCreditDays, 10) || 0;
        base.setDate(base.getDate() + days);
        return base.toISOString().split('T')[0];
      }
    } catch {
      // ignore
    }
    return '';
  })();

  // Supply Type determination
  const supplierState = organisation?.stateCode || '27';
  const isIntraState = placeOfSupplyStateCode ? placeOfSupplyStateCode === supplierState : true;

  // Real-time calculations with big.js
  const calculatedLines = lines.map((l) => {
    try {
      const qty = new Big(l.quantity || '0');
      const rate = new Big(l.unitPrice || '0');
      const gross = qty.mul(rate).round(2, Big.roundHalfUp);

      const discPct = new Big(l.discountPercent || '0');
      const discAmt = discPct.gt(0)
        ? gross.mul(discPct).div(100).round(2, Big.roundHalfUp)
        : new Big(0);

      const taxable = gross.minus(discAmt).round(2, Big.roundHalfUp);

      const taxPct = new Big(l.taxRatePercent || '0');
      let totalTax = new Big(0);
      let cgst = new Big(0);
      let sgst = new Big(0);
      let igst = new Big(0);

      if (l.taxCategory === 'TAXABLE' && taxPct.gt(0)) {
        if (isIntraState) {
          const halfRate = taxPct.div(2);
          cgst = taxable.mul(halfRate).div(100).round(2, Big.roundHalfUp);
          sgst = taxable.mul(halfRate).div(100).round(2, Big.roundHalfUp);
          totalTax = cgst.plus(sgst);
        } else {
          igst = taxable.mul(taxPct).div(100).round(2, Big.roundHalfUp);
          totalTax = igst;
        }
      }

      const total = taxable.plus(totalTax).round(2, Big.roundHalfUp);

      return {
        gross,
        discountAmount: discAmt,
        taxable,
        cgst,
        sgst,
        igst,
        totalTax,
        total,
      };
    } catch {
      return {
        gross: new Big(0),
        discountAmount: new Big(0),
        taxable: new Big(0),
        cgst: new Big(0),
        sgst: new Big(0),
        igst: new Big(0),
        totalTax: new Big(0),
        total: new Big(0),
      };
    }
  });

  // Invoice totals
  const subtotalBeforeDiscount = calculatedLines.reduce((acc, c) => acc.plus(c.gross), new Big(0));
  const totalDiscount = calculatedLines.reduce((acc, c) => acc.plus(c.discountAmount), new Big(0));
  const taxableValue = calculatedLines.reduce((acc, c) => acc.plus(c.taxable), new Big(0));
  const totalCgst = calculatedLines.reduce((acc, c) => acc.plus(c.cgst), new Big(0));
  const totalSgst = calculatedLines.reduce((acc, c) => acc.plus(c.sgst), new Big(0));
  const totalIgst = calculatedLines.reduce((acc, c) => acc.plus(c.igst), new Big(0));
  const totalTax = totalCgst.plus(totalSgst).plus(totalIgst);
  const rawTotal = taxableValue.plus(totalTax).round(2, Big.roundHalfUp);
  const grandTotal = rawTotal.round(0, Big.roundHalfUp);
  const roundOff = grandTotal.minus(rawTotal).round(2, Big.roundHalfUp);

  // Line manipulation
  const handleAddLine = () => {
    setLines((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        itemDescription: '',
        hsnOrSacCode: '',
        isService: false,
        quantity: '1',
        unitOfMeasure: 'NOS',
        unitPrice: '0.00',
        discountPercent: '0.00',
        taxRatePercent: '18',
        taxCategory: 'TAXABLE',
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 1) return;
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: keyof LocalLineItem, value: any) => {
    setLines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const buildPayload = (): CreateDraftInvoiceRequest => {
    const linePayloads: InvoiceLineInput[] = lines.map((l, index) => ({
      lineNumber: index + 1,
      itemDescription: l.itemDescription.trim() || 'Item',
      hsnOrSacCode: l.hsnOrSacCode.trim() || undefined,
      isService: l.isService,
      quantity: l.quantity || '1',
      unitOfMeasure: l.unitOfMeasure.trim() || 'NOS',
      unitPrice: l.unitPrice || '0',
      discountPercent: l.discountPercent || '0',
      taxRatePercent: l.taxRatePercent || '0',
      taxCategory: l.taxCategory,
    }));

    return {
      customerId,
      invoiceDate,
      deliveryOrAcceptanceDate: deliveryOrAcceptanceDate || undefined,
      agreedCreditDays: parseInt(agreedCreditDays, 10) || 30,
      placeOfSupplyStateCode: placeOfSupplyStateCode || undefined,
      isReverseCharge,
      poNumber: poNumber.trim() || undefined,
      poDate: poDate || undefined,
      notes: notes.trim() || undefined,
      termsText: termsText.trim() || undefined,
      lines: linePayloads,
    };
  };

  const handleSaveDraft = async () => {
    setErrorMessage(null);
    if (!customerId) {
      setErrorMessage('Please select a customer');
      return;
    }

    try {
      const payload = buildPayload();
      if (isEditing) {
        await updateDraftMutation.mutateAsync({ id, payload });
        navigate(`/invoices/${id}`);
      } else {
        const created = await createDraftMutation.mutateAsync(payload);
        navigate(`/invoices/${created.id}`);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save draft invoice');
    }
  };

  const handleConfirmIssue = async () => {
    setErrorMessage(null);
    setShowIssueModal(false);
    try {
      let targetId = id;
      const payload = buildPayload();
      if (!targetId) {
        const created = await createDraftMutation.mutateAsync(payload);
        targetId = created.id;
      } else {
        await updateDraftMutation.mutateAsync({ id: targetId, payload });
      }

      await issueMutation.mutateAsync(targetId);
      navigate(`/invoices/${targetId}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to issue invoice');
    }
  };

  if (isLoadingExisting) {
    return <div className="p-8 text-center text-xs text-gray-500">Loading invoice editor...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Title */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isEditing ? 'Edit Draft Invoice' : 'New Invoice'}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Draft invoices do not consume a number series until issued.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={createDraftMutation.isPending || updateDraftMutation.isPending}
            className="px-3.5 py-1.5 text-xs font-medium text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50 shadow-sm"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => {
              if (!customerId) {
                setErrorMessage('Please select a customer before issuing');
                return;
              }
              setShowIssueModal(true);
            }}
            disabled={issueMutation.isPending}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
          >
            Issue Invoice →
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {/* Header Fields Grid */}
      <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.legalName} {c.gstin ? `(${c.gstin})` : '(Unregistered)'}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
            />
          </div>

          {/* Place of Supply with Tax Indicator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Place of Supply (State Code)
              </label>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isIntraState ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800'
                }`}
              >
                {isIntraState ? 'Intra-State (CGST + SGST)' : 'Inter-State (IGST)'}
              </span>
            </div>
            <input
              type="text"
              maxLength={2}
              placeholder="e.g. 27"
              value={placeOfSupplyStateCode}
              onChange={(e) => setPlaceOfSupplyStateCode(e.target.value.replace(/\D/g, ''))}
              className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100 text-xs">
          {/* Credit Days & Due Date */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">Credit Days</label>
            <input
              type="number"
              min="0"
              value={agreedCreditDays}
              onChange={(e) => setAgreedCreditDays(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">Derived Due Date</label>
            <input
              type="date"
              disabled
              value={calculatedDueDate}
              className="w-full border border-gray-200 bg-gray-50 rounded px-2.5 py-1.5 text-gray-600 font-mono"
            />
          </div>
          {/* PO Number & Date */}
          <div>
            <label className="block font-medium text-gray-700 mb-1">PO / Reference #</label>
            <input
              type="text"
              placeholder="e.g. PO-2024-88"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5"
            />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">PO Date</label>
            <input
              type="date"
              value={poDate}
              onChange={(e) => setPoDate(e.target.value)}
              className="w-full border border-gray-300 rounded px-2.5 py-1.5"
            />
          </div>
        </div>

        {/* Reverse Charge checkbox */}
        <div className="pt-2 flex items-center space-x-2 text-xs">
          <input
            type="checkbox"
            id="reverseCharge"
            checked={isReverseCharge}
            onChange={(e) => setIsReverseCharge(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="reverseCharge" className="text-gray-700 font-medium">
            Reverse Charge applies (tax payable by recipient under section 9(3) / 9(4))
          </label>
        </div>
      </div>

      {/* Keyboard-First Line Items Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Line Items</h2>
          <button
            type="button"
            onClick={handleAddLine}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800"
          >
            + Add Line
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-8">#</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 min-w-[200px]">
                  Description <span className="text-red-500">*</span>
                </th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-24">HSN/SAC</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-20">Qty</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-16">Unit</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-28">Rate (₹)</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-20">Disc %</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-24">Taxable</th>
                <th className="px-2 py-2 text-left font-semibold text-gray-600 w-20">GST %</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-24">Tax</th>
                <th className="px-2 py-2 text-right font-semibold text-gray-600 w-28">Total</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-600 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {lines.map((line, idx) => {
                const calc = calculatedLines[idx];
                return (
                  <tr key={line.id} className="hover:bg-gray-50/75">
                    <td className="px-2 py-1.5 text-gray-500 text-center font-mono">{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="Item or service description"
                        value={line.itemDescription}
                        onChange={(e) => handleLineChange(idx, 'itemDescription', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        placeholder="HSN"
                        value={line.hsnOrSacCode}
                        onChange={(e) => handleLineChange(idx, 'hsnOrSacCode', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs font-mono"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="text"
                        value={line.unitOfMeasure}
                        onChange={(e) => handleLineChange(idx, 'unitOfMeasure', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-center font-mono"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.unitPrice}
                        onChange={(e) => handleLineChange(idx, 'unitPrice', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono"
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={line.discountPercent}
                        onChange={(e) => handleLineChange(idx, 'discountPercent', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right font-mono"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                      {calc.taxable.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        value={line.taxRatePercent}
                        onChange={(e) => handleLineChange(idx, 'taxRatePercent', e.target.value)}
                        className="w-full px-1.5 py-1 border border-gray-300 rounded text-xs bg-white font-mono"
                      >
                        {GST_RATES.map((r) => (
                          <option key={r} value={r}>
                            {r}%
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono text-gray-700">
                      {calc.totalTax.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-right font-mono font-semibold text-gray-900">
                      {calc.total.toFixed(2)}
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={lines.length <= 1}
                        className="text-gray-400 hover:text-red-600 disabled:opacity-30 text-sm font-bold"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals & Notes Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notes & Terms */}
        <div className="space-y-4">
          <div className="bg-white p-3.5 rounded border border-gray-200 shadow-sm space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Customer Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visible on invoice..."
                className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                rows={2}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Payment terms..."
                className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5"
              />
            </div>
          </div>
        </div>

        {/* Live Calculation Summary */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm space-y-2 text-xs">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal (Gross):</span>
            <span className="font-mono">{formatRupees(subtotalBeforeDiscount.toFixed(2))}</span>
          </div>
          {totalDiscount.gt(0) && (
            <div className="flex justify-between text-emerald-700">
              <span>Total Discount:</span>
              <span className="font-mono">-{formatRupees(totalDiscount.toFixed(2))}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold text-gray-800 pt-1 border-t border-gray-100">
            <span>Taxable Value:</span>
            <span className="font-mono">{formatRupees(taxableValue.toFixed(2))}</span>
          </div>

          {isIntraState ? (
            <>
              <div className="flex justify-between text-gray-600">
                <span>Central GST (CGST):</span>
                <span className="font-mono">{formatRupees(totalCgst.toFixed(2))}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>State GST (SGST):</span>
                <span className="font-mono">{formatRupees(totalSgst.toFixed(2))}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-gray-600">
              <span>Integrated GST (IGST):</span>
              <span className="font-mono">{formatRupees(totalIgst.toFixed(2))}</span>
            </div>
          )}

          <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-100">
            <span>Total Tax:</span>
            <span className="font-mono">{formatRupees(totalTax.toFixed(2))}</span>
          </div>
          <div className="flex justify-between text-gray-500">
            <span>Rupee Round-Off:</span>
            <span className="font-mono">{roundOff.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Grand Total:</span>
            <span className="font-mono text-blue-700">{formatRupees(grandTotal.toFixed(2))}</span>
          </div>
        </div>
      </div>

      {/* 2-Step Issue Confirmation Modal */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-bold text-gray-900">Confirm Invoice Issuance</h3>
            </div>
            <div className="text-xs text-gray-600 space-y-2">
              <p>
                Issuing this invoice will consume the next consecutive number in the series and lock
                all line items and monetary totals.
              </p>
              <div className="bg-amber-50 p-3 rounded border border-amber-200 text-amber-900 font-medium">
                Under GST Rule 46, once an invoice is issued, it cannot be modified or deleted. Only
                cancellation or credit notes are permitted.
              </div>
              <div className="pt-2 text-gray-700">
                <div>
                  <strong>Customer:</strong> {customers.find((c) => c.id === customerId)?.legalName}
                </div>
                <div>
                  <strong>Invoice Date:</strong> {invoiceDate}
                </div>
                <div>
                  <strong>Grand Total:</strong> {formatRupees(grandTotal.toFixed(2))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmIssue}
                disabled={issueMutation.isPending}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700 shadow-sm"
              >
                {issueMutation.isPending ? 'Issuing...' : 'Yes, Issue Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
