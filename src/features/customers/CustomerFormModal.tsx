import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, AlertCircle } from 'lucide-react';
import type { Customer } from './types';
import { useCreateCustomer, useUpdateCustomer } from './api';

const customerSchema = z
  .object({
    legalName: z.string().min(1, 'Customer legal name is required').max(255),
    tradeName: z.string().max(255).optional().or(z.literal('')),
    isRegistered: z.boolean(),
    gstin: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (15 characters)')
      .optional()
      .or(z.literal('')),
    pan: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (10 characters)')
      .optional()
      .or(z.literal('')),
    billingAddressLine1: z.string().optional().or(z.literal('')),
    billingAddressLine2: z.string().optional().or(z.literal('')),
    billingCity: z.string().optional().or(z.literal('')),
    billingStateCode: z.string().regex(/^[0-9]{2}$/, 'Billing state code must be exactly 2 digits'),
    billingPincode: z
      .string()
      .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
      .optional()
      .or(z.literal('')),
    shippingAddressLine1: z.string().optional().or(z.literal('')),
    shippingAddressLine2: z.string().optional().or(z.literal('')),
    shippingCity: z.string().optional().or(z.literal('')),
    shippingStateCode: z
      .string()
      .regex(/^[0-9]{2}$/, 'Shipping state code must be 2 digits')
      .optional()
      .or(z.literal('')),
    shippingPincode: z
      .string()
      .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
      .optional()
      .or(z.literal('')),
    contactPerson: z.string().optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    defaultPlaceOfSupplyStateCode: z
      .string()
      .regex(/^[0-9]{2}$/, 'State code must be 2 digits')
      .optional()
      .or(z.literal('')),
    creditDays: z.coerce.number().min(0, 'Credit days cannot be negative'),
    notes: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.isRegistered && (!data.gstin || data.gstin.trim() === '')) {
        return false;
      }
      return true;
    },
    {
      message: 'GSTIN is mandatory when registered under GST',
      path: ['gstin'],
    }
  )
  .refine(
    (data) => {
      if (data.gstin && data.gstin.length >= 2) {
        const gstinState = data.gstin.substring(0, 2);
        if (data.billingStateCode !== gstinState) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'Billing state code must match the first 2 digits of GSTIN',
      path: ['billingStateCode'],
    }
  );

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerToEdit: Customer | null;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  customerToEdit,
}) => {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      legalName: '',
      tradeName: '',
      isRegistered: false,
      gstin: '',
      pan: '',
      billingAddressLine1: '',
      billingAddressLine2: '',
      billingCity: '',
      billingStateCode: '27',
      billingPincode: '',
      shippingAddressLine1: '',
      shippingAddressLine2: '',
      shippingCity: '',
      shippingStateCode: '',
      shippingPincode: '',
      contactPerson: '',
      phone: '',
      email: '',
      defaultPlaceOfSupplyStateCode: '27',
      creditDays: 30,
      notes: '',
    },
  });

  const watchedGstin = watch('gstin');
  const watchedIsRegistered = watch('isRegistered');

  useEffect(() => {
    if (customerToEdit) {
      reset({
        legalName: customerToEdit.legalName,
        tradeName: customerToEdit.tradeName || '',
        isRegistered: customerToEdit.isRegistered,
        gstin: customerToEdit.gstin || '',
        pan: customerToEdit.pan || '',
        billingAddressLine1: customerToEdit.billingAddressLine1 || '',
        billingAddressLine2: customerToEdit.billingAddressLine2 || '',
        billingCity: customerToEdit.billingCity || '',
        billingStateCode: customerToEdit.billingStateCode,
        billingPincode: customerToEdit.billingPincode || '',
        shippingAddressLine1: customerToEdit.shippingAddressLine1 || '',
        shippingAddressLine2: customerToEdit.shippingAddressLine2 || '',
        shippingCity: customerToEdit.shippingCity || '',
        shippingStateCode: customerToEdit.shippingStateCode || '',
        shippingPincode: customerToEdit.shippingPincode || '',
        contactPerson: customerToEdit.contactPerson || '',
        phone: customerToEdit.phone || '',
        email: customerToEdit.email || '',
        defaultPlaceOfSupplyStateCode:
          customerToEdit.defaultPlaceOfSupplyStateCode || customerToEdit.billingStateCode,
        creditDays: customerToEdit.creditDays ?? 30,
        notes: customerToEdit.notes || '',
      });
    } else {
      reset({
        legalName: '',
        tradeName: '',
        isRegistered: false,
        gstin: '',
        pan: '',
        billingAddressLine1: '',
        billingAddressLine2: '',
        billingCity: '',
        billingStateCode: '27',
        billingPincode: '',
        shippingAddressLine1: '',
        shippingAddressLine2: '',
        shippingCity: '',
        shippingStateCode: '',
        shippingPincode: '',
        contactPerson: '',
        phone: '',
        email: '',
        defaultPlaceOfSupplyStateCode: '27',
        creditDays: 30,
        notes: '',
      });
    }
    setServerError(null);
  }, [customerToEdit, reset, isOpen]);

  // Auto-populate state code and PAN when GSTIN is typed
  useEffect(() => {
    if (watchedGstin && watchedGstin.length >= 2) {
      const derivedState = watchedGstin.substring(0, 2);
      setValue('billingStateCode', derivedState, { shouldValidate: true });
      setValue('defaultPlaceOfSupplyStateCode', derivedState, { shouldValidate: true });
    }
    if (watchedGstin && watchedGstin.length >= 12) {
      const derivedPan = watchedGstin.substring(2, 12);
      setValue('pan', derivedPan, { shouldValidate: true });
    }
  }, [watchedGstin, setValue]);

  const copyBillingToShipping = () => {
    setValue('shippingAddressLine1', watch('billingAddressLine1'));
    setValue('shippingAddressLine2', watch('billingAddressLine2'));
    setValue('shippingCity', watch('billingCity'));
    setValue('shippingStateCode', watch('billingStateCode'));
    setValue('shippingPincode', watch('billingPincode'));
  };

  const onSubmit = async (values: CustomerFormValues) => {
    try {
      setServerError(null);
      if (customerToEdit) {
        await updateMutation.mutateAsync({
          id: customerToEdit.id,
          data: {
            ...values,
            tradeName: values.tradeName || undefined,
            gstin: values.gstin || undefined,
            pan: values.pan || undefined,
            billingAddressLine1: values.billingAddressLine1 || undefined,
            billingAddressLine2: values.billingAddressLine2 || undefined,
            billingCity: values.billingCity || undefined,
            billingPincode: values.billingPincode || undefined,
            shippingAddressLine1: values.shippingAddressLine1 || undefined,
            shippingAddressLine2: values.shippingAddressLine2 || undefined,
            shippingCity: values.shippingCity || undefined,
            shippingStateCode: values.shippingStateCode || undefined,
            shippingPincode: values.shippingPincode || undefined,
            contactPerson: values.contactPerson || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            defaultPlaceOfSupplyStateCode: values.defaultPlaceOfSupplyStateCode || undefined,
            notes: values.notes || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          ...values,
          tradeName: values.tradeName || undefined,
          gstin: values.gstin || undefined,
          pan: values.pan || undefined,
          billingAddressLine1: values.billingAddressLine1 || undefined,
          billingAddressLine2: values.billingAddressLine2 || undefined,
          billingCity: values.billingCity || undefined,
          billingPincode: values.billingPincode || undefined,
          shippingAddressLine1: values.shippingAddressLine1 || undefined,
          shippingAddressLine2: values.shippingAddressLine2 || undefined,
          shippingCity: values.shippingCity || undefined,
          shippingStateCode: values.shippingStateCode || undefined,
          shippingPincode: values.shippingPincode || undefined,
          contactPerson: values.contactPerson || undefined,
          phone: values.phone || undefined,
          email: values.email || undefined,
          defaultPlaceOfSupplyStateCode: values.defaultPlaceOfSupplyStateCode || undefined,
          notes: values.notes || undefined,
        });
      }
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred while saving customer');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-40 flex items-center justify-center p-4">
      <div className="bg-white rounded border border-gray-200 shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">
              {customerToEdit ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <p className="text-xs text-gray-500">Enter customer billing and GST tax details</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {serverError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Identification */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modalLegalName" className="block font-medium text-gray-700 mb-1">
                Customer Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                id="modalLegalName"
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                placeholder="e.g. Tata Motors Limited"
                {...register('legalName')}
              />
              {errors.legalName && (
                <p className="mt-1 text-[11px] text-red-600">{errors.legalName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="modalTradeName" className="block font-medium text-gray-700 mb-1">
                Trade Name <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="modalTradeName"
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                placeholder="e.g. Tata Motors"
                {...register('tradeName')}
              />
            </div>
          </div>

          {/* GST & Registration */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-3">
            <div className="flex items-center space-x-2">
              <input
                id="isRegistered"
                type="checkbox"
                className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                {...register('isRegistered')}
              />
              <label htmlFor="isRegistered" className="font-medium text-gray-900 cursor-pointer">
                Registered under GST (B2B Customer)
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="modalGstin" className="block font-medium text-gray-700 mb-1">
                  GSTIN {watchedIsRegistered && <span className="text-red-500">*</span>}
                </label>
                <input
                  id="modalGstin"
                  type="text"
                  maxLength={15}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded uppercase font-mono outline-none"
                  placeholder="27ABCDE1234F1Z5"
                  {...register('gstin')}
                />
                {errors.gstin && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.gstin.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="modalBillingState" className="block font-medium text-gray-700 mb-1">
                  Billing State Code <span className="text-red-500">*</span>
                </label>
                <input
                  id="modalBillingState"
                  type="text"
                  maxLength={2}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded font-mono outline-none"
                  placeholder="27"
                  {...register('billingStateCode')}
                />
                {errors.billingStateCode && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.billingStateCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="modalPan" className="block font-medium text-gray-700 mb-1">
                  PAN (optional)
                </label>
                <input
                  id="modalPan"
                  type="text"
                  maxLength={10}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded uppercase font-mono outline-none"
                  placeholder="ABCDE1234F"
                  {...register('pan')}
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Billing Address</h3>
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="Address Line 1"
                  {...register('billingAddressLine1')}
                />
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="Address Line 2 (optional)"
                  {...register('billingAddressLine2')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="City"
                  {...register('billingCity')}
                />
                <input
                  type="text"
                  maxLength={6}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded font-mono outline-none"
                  placeholder="Pincode (6 digits)"
                  {...register('billingPincode')}
                />
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Shipping Address</h3>
              <button
                type="button"
                onClick={copyBillingToShipping}
                className="text-[11px] text-brand-600 hover:text-brand-700 underline"
              >
                Copy from billing
              </button>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="Shipping Address Line 1"
                  {...register('shippingAddressLine1')}
                />
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="Shipping Address Line 2"
                  {...register('shippingAddressLine2')}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                  placeholder="Shipping City"
                  {...register('shippingCity')}
                />
                <input
                  type="text"
                  maxLength={2}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded font-mono outline-none"
                  placeholder="State Code (2 digits)"
                  {...register('shippingStateCode')}
                />
                <input
                  type="text"
                  maxLength={6}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded font-mono outline-none"
                  placeholder="Pincode (6 digits)"
                  {...register('shippingPincode')}
                />
              </div>
            </div>
          </div>

          {/* Contact Details & Payment Terms */}
          <div className="pt-2 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="modalContact" className="block font-medium text-gray-700 mb-1">
                Contact Person
              </label>
              <input
                id="modalContact"
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                placeholder="Ramesh Kumar"
                {...register('contactPerson')}
              />
            </div>
            <div>
              <label htmlFor="modalPhone" className="block font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                id="modalPhone"
                type="text"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                placeholder="9876543210"
                {...register('phone')}
              />
            </div>
            <div>
              <label htmlFor="modalEmail" className="block font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="modalEmail"
                type="email"
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                placeholder="client@company.com"
                {...register('email')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="modalCreditDays" className="block font-medium text-gray-700 mb-1">
                Agreed Credit Days
              </label>
              <input
                id="modalCreditDays"
                type="number"
                min={0}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
                {...register('creditDays')}
              />
            </div>

            <div>
              <label htmlFor="modalPos" className="block font-medium text-gray-700 mb-1">
                Default Place of Supply (State Code)
              </label>
              <input
                id="modalPos"
                type="text"
                maxLength={2}
                className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded font-mono outline-none"
                placeholder="27"
                {...register('defaultPlaceOfSupplyStateCode')}
              />
            </div>
          </div>

          <div>
            <label htmlFor="modalNotes" className="block font-medium text-gray-700 mb-1">
              Internal Notes (optional)
            </label>
            <textarea
              id="modalNotes"
              rows={2}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-300 rounded outline-none"
              placeholder="e.g. Requires PO copy with every invoice submission."
              {...register('notes')}
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="px-4 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded font-medium disabled:opacity-50 transition-colors shadow-sm"
            >
              {isSubmitting || createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : customerToEdit
                ? 'Update Customer'
                : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
