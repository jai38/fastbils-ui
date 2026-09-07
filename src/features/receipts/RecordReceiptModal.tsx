import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import Big from 'big.js';
import type { Invoice } from '@/features/invoices/types';
import type { PaymentMethod } from './types';
import { useRecordReceipt } from './api';
import { formatIndianCurrency } from '@/utils/money';

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'NEFT', label: 'NEFT (Bank Transfer)' },
  { value: 'RTGS', label: 'RTGS (Bank Transfer)' },
  { value: 'IMPS', label: 'IMPS (Immediate Transfer)' },
  { value: 'UPI', label: 'UPI / QR Code' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CARD', label: 'Credit / Debit Card' },
];

const receiptSchema = z.object({
  amount: z.coerce.number().positive('Amount must be greater than zero'),
  paymentDate: z.string().min(1, 'Payment date is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'NEFT', 'RTGS', 'IMPS', 'CHEQUE', 'CARD']),
  referenceNumber: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof receiptSchema>;

interface RecordReceiptModalProps {
  invoice: Invoice;
  isOpen: boolean;
  onClose: () => void;
}

export const RecordReceiptModal: React.FC<RecordReceiptModalProps> = ({ invoice, isOpen, onClose }) => {
  const { mutate: recordReceipt, isPending, error } = useRecordReceipt();

  const balance = new Big(invoice.balanceAmount || invoice.grandTotal || '0');
  const today = new Date().toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(receiptSchema),
    defaultValues: {
      amount: balance.toNumber(),
      paymentDate: today,
      paymentMethod: 'NEFT',
      referenceNumber: '',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        amount: balance.toNumber(),
        paymentDate: today,
        paymentMethod: 'NEFT',
        referenceNumber: '',
        notes: '',
      });
    }
  }, [isOpen, invoice.balanceAmount, reset]);

  if (!isOpen) return null;

  const enteredAmount = watch('amount');
  const exceedsBalance = enteredAmount && new Big(enteredAmount || 0).gt(balance);

  const onSubmit = (data: FormValues) => {
    if (exceedsBalance) {
      return;
    }
    recordReceipt(
      {
        invoiceId: invoice.id,
        data: {
          amount: data.amount,
          paymentDate: data.paymentDate,
          paymentMethod: data.paymentMethod,
          referenceNumber: data.referenceNumber?.trim() || undefined,
          notes: data.notes?.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Record Payment Receipt</h2>
            <p className="text-xs text-gray-500">
              Invoice <span className="font-mono font-semibold">{invoice.invoiceNumber}</span> • {invoice.customerLegalName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 rounded p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Invoice Summary Balance Card */}
        <div className="mx-6 mt-4 p-3.5 bg-blue-50/70 border border-blue-100 rounded-md flex justify-between items-center text-sm">
          <div>
            <span className="text-xs text-gray-600 block">Total Invoice Amount</span>
            <span className="font-semibold text-gray-800">{formatIndianCurrency(invoice.grandTotal)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-600 block">Remaining Balance</span>
            <span className="font-bold text-blue-700 text-base">{formatIndianCurrency(invoice.balanceAmount)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{(error as any)?.response?.data?.message || 'Failed to record receipt. Please check details.'}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Amount (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount')}
                className={`w-full px-3 py-2 text-sm border rounded shadow-sm focus:ring-1 focus:ring-blue-500 font-mono ${
                  errors.amount || exceedsBalance ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              />
              {errors.amount && <p className="mt-1 text-xs text-red-600">{errors.amount.message}</p>}
              {exceedsBalance && !errors.amount && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  Amount cannot exceed remaining balance of {formatIndianCurrency(invoice.balanceAmount)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Payment Date *
              </label>
              <input
                type="date"
                {...register('paymentDate')}
                className={`w-full px-3 py-2 text-sm border rounded shadow-sm focus:ring-1 focus:ring-blue-500 ${
                  errors.paymentDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.paymentDate && <p className="mt-1 text-xs text-red-600">{errors.paymentDate.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Payment Method *
            </label>
            <select
              {...register('paymentMethod')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500 bg-white"
            >
              {paymentMethods.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Reference / Transaction ID
            </label>
            <input
              type="text"
              placeholder="e.g. UTR number, UPI Ref, Cheque No"
              {...register('referenceNumber')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Received via HDFC current account"
              {...register('notes')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded shadow-sm focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || Boolean(exceedsBalance)}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isPending ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
