import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';
import type { Receipt } from './types';
import { useReverseReceipt } from './api';
import { formatIndianCurrency } from '@/utils/money';
import { formatDate } from '@/utils/date';

const reverseSchema = z.object({
  reason: z.string().min(5, 'Reversal reason must be at least 5 characters').max(500),
});

type FormValues = z.infer<typeof reverseSchema>;

interface ReverseReceiptModalProps {
  receipt: Receipt | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReverseReceiptModal: React.FC<ReverseReceiptModalProps> = ({ receipt, isOpen, onClose }) => {
  const { mutate: reverseReceipt, isPending, error } = useReverseReceipt();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(reverseSchema),
    defaultValues: {
      reason: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({ reason: '' });
    }
  }, [isOpen, reset]);

  if (!isOpen || !receipt) return null;

  const onSubmit = (data: FormValues) => {
    reverseReceipt(
      {
        receiptId: receipt.id,
        data: { reason: data.reason.trim() },
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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in duration-150">
        <div className="px-6 py-4 bg-amber-50/70 border-b border-amber-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            <h2 className="text-base font-bold text-gray-900">Reverse Payment Receipt</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 rounded p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-500">Amount:</span>
              <span className="font-semibold text-gray-900 font-mono">{formatIndianCurrency(receipt.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Method:</span>
              <span className="font-medium text-gray-800">{receipt.paymentMethod}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Date:</span>
              <span className="text-gray-800 font-mono">{formatDate(receipt.paymentDate)}</span>
            </div>
            {receipt.referenceNumber && (
              <div className="flex justify-between">
                <span className="text-gray-500">Reference:</span>
                <span className="font-mono text-gray-800">{receipt.referenceNumber}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-amber-800 bg-amber-50/60 p-2.5 rounded border border-amber-100">
            Reversing this receipt will restore the invoice balance and log an immutable reversing entry. This action cannot be undone.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                {(error as any)?.response?.data?.message || 'Failed to reverse receipt.'}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Reason for Reversal *
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Cheque returned by bank / Transferred in error / Chargeback"
                {...register('reason')}
                className={`w-full px-3 py-2 text-sm border rounded shadow-sm focus:ring-1 focus:ring-blue-500 ${
                  errors.reason ? 'border-red-400 bg-red-50/30' : 'border-gray-300'
                }`}
              />
              {errors.reason && <p className="mt-1 text-xs text-red-600">{errors.reason.message}</p>}
            </div>

            <div className="pt-2 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 rounded hover:bg-amber-700 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {isPending ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
