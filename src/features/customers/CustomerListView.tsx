import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Archive,
  RotateCcw,
  AlertCircle,
  Phone,
  Mail,
} from 'lucide-react';
import type { Customer } from './types';
import { useCustomers, useArchiveCustomer, useUnarchiveCustomer } from './api';
import { CustomerFormModal } from './CustomerFormModal';
import { getStateName } from '@/utils/indianStates';

export const CustomerListView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const { data, isLoading, error } = useCustomers({
    query: searchTerm || undefined,
    isArchived: showArchived,
    page: 0,
    size: 50,
  });

  const archiveMutation = useArchiveCustomer();
  const unarchiveMutation = useUnarchiveCustomer();

  const handleCreateNew = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleArchive = async (customer: Customer) => {
    const message =
      `Deactivate "${customer.legalName}"?\n\n` +
      `Rule: Inactive customers cannot be selected on new invoices, but their past invoices remain intact.`;
    if (confirm(message)) {
      try {
        await archiveMutation.mutateAsync(customer.id);
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to deactivate customer');
      }
    }
  };

  const handleRestore = async (customer: Customer) => {
    try {
      await unarchiveMutation.mutateAsync(customer.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to activate customer');
    }
  };

  const customers = data?.content || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Customer Directory</h1>
          <p className="text-xs text-gray-500">
            Manage client records, billing/shipping addresses, and GST tax registration profiles.
          </p>
        </div>

        <button
          onClick={handleCreateNew}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-medium transition-colors shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by legal name, trade name, GSTIN, phone..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowArchived(false)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              !showArchived
                ? 'bg-brand-50 text-brand-700 border border-brand-200'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setShowArchived(true)}
            className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
              showArchived
                ? 'bg-amber-50 text-amber-800 border border-amber-300'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>Failed to load customer list. Please try again.</span>
        </div>
      )}

      {/* Customer Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-xs text-gray-500 animate-pulse">
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
              <Users className="w-5 h-5" />
            </div>
            <div className="text-xs font-medium text-gray-700">
              {searchTerm
                ? 'No matching customers found'
                : showArchived
                ? 'No inactive customers'
                : 'No customers recorded yet'}
            </div>
            {!showArchived && !searchTerm && (
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-medium shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Customer</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                  <th className="py-2.5 px-3">Customer Entity</th>
                  <th className="py-2.5 px-3">GSTIN & State</th>
                  <th className="py-2.5 px-3">Contact</th>
                  <th className="py-2.5 px-3">Credit Term</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    {/* Legal & Trade Name */}
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-gray-900">{customer.legalName}</div>
                      {customer.tradeName && (
                        <div className="text-[11px] text-gray-500">{customer.tradeName}</div>
                      )}
                    </td>

                    {/* GSTIN & State */}
                    <td className="py-2.5 px-3">
                      {customer.gstin ? (
                        <div>
                          <span className="font-mono text-xs font-medium text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                            {customer.gstin}
                          </span>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            State: <span className="font-medium text-gray-800">{getStateName(customer.billingStateCode) || customer.billingStateCode}</span> <span className="font-mono text-gray-400">({customer.billingStateCode})</span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-gray-500 italic text-[11px]">Unregistered</span>
                          <div className="text-[11px] text-gray-500 mt-0.5">
                            State: <span className="font-medium text-gray-800">{getStateName(customer.billingStateCode) || customer.billingStateCode}</span> <span className="font-mono text-gray-400">({customer.billingStateCode})</span>
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Contact */}
                    <td className="py-2.5 px-3 text-gray-600">
                      {customer.contactPerson && (
                        <div className="font-medium text-gray-800">{customer.contactPerson}</div>
                      )}
                      <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                        {customer.phone && (
                          <span className="flex items-center space-x-1">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{customer.phone}</span>
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center space-x-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span>{customer.email}</span>
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Credit Days */}
                    <td className="py-2.5 px-3 text-gray-700">
                      <span className="font-mono font-medium">{customer.creditDays}</span> days
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      {customer.isArchived ? (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                          Inactive
                        </span>
                      ) : (
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Active
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          title="Edit Customer"
                          className="text-gray-500 hover:text-brand-600 p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {customer.isArchived ? (
                          <button
                            onClick={() => handleRestore(customer)}
                            title="Activate Customer"
                            className="text-amber-600 hover:text-amber-700 p-1 rounded hover:bg-amber-50 transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchive(customer)}
                            title="Deactivate Customer"
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-gray-100 transition-colors"
                          >
                            <Archive className="w-3.5 h-3.5" />
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

      {/* Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        customerToEdit={customerToEdit}
      />
    </div>
  );
};
