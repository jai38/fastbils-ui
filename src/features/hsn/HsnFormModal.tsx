import React, { useState } from 'react';
import { X, Search, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useCreateHsnItem, lookupHsnCode } from './api';
import type { HsnItem } from './types';

interface HsnFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (item: HsnItem) => void;
}

const GST_SLABS = [0, 0.1, 0.25, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

export const HsnFormModal: React.FC<HsnFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(18);
  const [isService, setIsService] = useState(false);
  const [isDefault, setIsDefault] = useState(false);

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupMessage, setLookupMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useCreateHsnItem();

  if (!isOpen) return null;

  const handleLookup = async () => {
    if (!code.trim() || code.trim().length < 2) {
      setLookupMessage({ type: 'error', text: 'Enter at least 2 digits to look up HSN/SAC code' });
      return;
    }

    setIsLookingUp(true);
    setLookupMessage(null);

    try {
      const result = await lookupHsnCode(code.trim());
      if (result.found) {
        if (!name.trim()) {
          setName(result.heading || result.description);
        }
        if (!description.trim()) {
          setDescription(result.description);
        }
        setTaxRatePercent(result.taxRatePercent);
        setIsService(result.isService);
        setLookupMessage({
          type: 'success',
          text: `Verified from CBIC Catalog: ${result.heading || result.description} (GST Slab: ${result.taxRatePercent}%)`,
        });
      } else {
        setLookupMessage({
          type: 'info',
          text: 'Code not found in master CBIC directory. You can fill details manually.',
        });
      }
    } catch {
      setLookupMessage({
        type: 'info',
        text: 'Could not query CBIC catalog. You can fill details manually.',
      });
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError('HSN/SAC Code is required');
      return;
    }
    if (!name.trim()) {
      setFormError('Item Name is required');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        code: code.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        taxRatePercent,
        isService,
        isDefault,
      });

      onSuccess?.(created);
      onClose();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create HSN item');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-900 bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Add HSN / SAC Code</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Configure standard HSN/SAC code and its GST slab rate
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 rounded-lg p-1 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Code with lookup button */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              HSN / SAC Code <span className="text-red-500">*</span>
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                placeholder="e.g. 998311 or 8471"
                maxLength={10}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleLookup}
                disabled={isLookingUp || !code.trim()}
                className="inline-flex items-center px-3 py-2 border border-indigo-200 text-xs font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {isLookingUp ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Search className="w-4 h-4 mr-1.5" />
                )}
                Verify
              </button>
            </div>
            {lookupMessage && (
              <div
                className={`mt-1.5 p-2 rounded text-xs flex items-start space-x-1.5 ${
                  lookupMessage.type === 'success'
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : lookupMessage.type === 'error'
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}
              >
                {lookupMessage.type === 'success' && (
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                )}
                <span>{lookupMessage.text}</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Item / Service Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IT Software Consulting Services"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description for invoices"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Tax Slab & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                GST Slab Rate <span className="text-red-500">*</span>
              </label>
              <select
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm bg-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              >
                {GST_SLABS.map((slab) => (
                  <option key={slab} value={slab}>
                    {slab}% GST
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
                Classification
              </label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="classification"
                    checked={!isService}
                    onChange={() => setIsService(false)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-1.5 font-medium">Goods (HSN)</span>
                </label>
                <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="classification"
                    checked={isService}
                    onChange={() => setIsService(true)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                  />
                  <span className="ml-1.5 font-medium">Service (SAC)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Default check */}
          <div className="pt-2">
            <label className="inline-flex items-center text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 font-medium text-gray-800">
                Set as default HSN for new invoice line items
              </span>
            </label>
          </div>

          <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 shadow-sm transition-colors"
            >
              {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save HSN Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
