import React, { useState } from 'react';
import { Plus, Star, Trash2, Tag, AlertCircle, Loader2 } from 'lucide-react';
import {
  useHsnItems,
  useSetDefaultHsnItem,
  useDeleteHsnItem,
} from './api';
import { HsnFormModal } from './HsnFormModal';
import type { HsnItem } from './types';

export const HsnManagementView: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: items = [], isLoading, error } = useHsnItems(false);
  const setDefaultMutation = useSetDefaultHsnItem();
  const deleteMutation = useDeleteHsnItem();

  const filteredItems = items.filter((item) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.code.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      (item.description && item.description.toLowerCase().includes(term))
    );
  });

  const handleSetDefault = async (item: HsnItem) => {
    setActionError(null);
    try {
      await setDefaultMutation.mutateAsync(item.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to set default HSN');
    }
  };

  const handleDelete = async (item: HsnItem) => {
    if (!window.confirm(`Are you sure you want to deactivate HSN ${item.code} (${item.name})?`)) {
      return;
    }
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(item.id);
    } catch (err: any) {
      setActionError(err.message || 'Failed to deactivate HSN');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-600" />
            HSN / SAC Directory
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage your standard HSN and SAC codes with predefined GST slabs. These codes are locked to fixed tax rates on invoices.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add HSN / SAC
        </button>
      </div>

      {actionError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Filter / search */}
      <div className="flex items-center justify-between">
        <input
          type="text"
          placeholder="Search by code, item or service name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
        <div className="text-xs text-gray-500 font-medium">
          Total: {filteredItems.length} code{filteredItems.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
            <p className="text-sm">Loading HSN directory...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">
            Failed to load HSN items. Please refresh or try again.
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900">No HSN / SAC codes found</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? 'No items match your search. Try a different keyword.'
                : 'Get started by adding your first HSN or SAC code with its verified GST tax slab.'}
            </p>
            {!searchTerm && (
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-4 inline-flex items-center px-3 py-1.5 border border-indigo-600 text-xs font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Code
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code & Classification
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item / Service Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    GST Slab Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Default
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr key={item.id} className={!item.isActive ? 'bg-gray-50 opacity-60' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-semibold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            item.isService
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.isService ? 'Service (SAC)' : 'Goods (HSN)'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      {item.description && (
                        <div className="text-xs text-gray-500 truncate max-w-xs">{item.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                        {item.taxRatePercent}% GST
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.isDefault ? (
                        <span className="inline-flex items-center text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                          Default
                        </span>
                      ) : item.isActive ? (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(item)}
                          disabled={setDefaultMutation.isPending}
                          className="text-xs text-gray-400 hover:text-amber-600 font-medium transition-colors"
                          title="Click to set as default HSN for new invoice lines"
                        >
                          Set Default
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          item.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {item.isActive && (
                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          disabled={deleteMutation.isPending}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Deactivate code"
                        >
                          <Trash2 className="w-4 h-4 inline" />
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

      <HsnFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};
