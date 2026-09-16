import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Building2,
  FileText,
  CreditCard,
  Upload,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
} from 'lucide-react';
import {
  useOrganisationProfile,
  useUpdateOrganisationProfile,
  useUploadLogo,
  useDeleteLogo,
  useOrganisationLogo,
} from './api';
import { getStateName } from '@/utils/indianStates';
import { HsnManagementView } from '@/features/hsn/HsnManagementView';

const profileSchema = z
  .object({
    legalName: z.string().min(1, 'Legal name is required').max(255),
    tradeName: z.string().max(255).optional().or(z.literal('')),
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
    stateCode: z
      .string()
      .regex(/^[0-9]{2}$/, 'State code must be 2 digits')
      .optional()
      .or(z.literal('')),
    addressLine1: z.string().min(1, 'Registered business address is required').max(255),
    addressLine2: z.string().optional().or(z.literal('')),
    city: z.string().optional().or(z.literal('')),
    pincode: z
      .string()
      .regex(/^[0-9]{6}$/, 'Pincode must be 6 digits')
      .optional()
      .or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    email: z.string().email('Invalid email address').optional().or(z.literal('')),
    invoicePrefix: z
      .string()
      .min(1, 'Invoice prefix is required')
      .max(6, 'Invoice prefix cannot exceed 6 characters')
      .regex(/^[A-Za-z0-9/-]+$/, 'Only letters, numbers, hyphens, and slashes are allowed'),
    defaultCreditDays: z.coerce.number().min(0, 'Credit days cannot be negative'),
    defaultTermsText: z.string().optional().or(z.literal('')),
    bankName: z.string().optional().or(z.literal('')),
    bankAccountName: z.string().optional().or(z.literal('')),
    bankAccountNumber: z.string().optional().or(z.literal('')),
    bankIfsc: z
      .string()
      .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format (e.g. HDFC0001234)')
      .optional()
      .or(z.literal('')),
    bankBranch: z.string().optional().or(z.literal('')),
    upiId: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.gstin && data.gstin.length >= 2) {
        const gstinState = data.gstin.substring(0, 2);
        if (data.stateCode && data.stateCode !== gstinState) {
          return false;
        }
      }
      return true;
    },
    {
      message: 'State code must match the first 2 digits of GSTIN',
      path: ['stateCode'],
    }
  );

type ProfileFormValues = z.infer<typeof profileSchema>;

export const ProfileView: React.FC = () => {
  const { data: org, isLoading, error } = useOrganisationProfile();
  const updateMutation = useUpdateOrganisationProfile();
  const uploadLogoMutation = useUploadLogo();
  const deleteLogoMutation = useDeleteLogo();

  const [activeTab, setActiveTab] = useState<'profile' | 'invoice' | 'bank' | 'hsn'>('profile');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { data: logoBlobUrl } = useOrganisationLogo(org?.logoObjectKey);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      legalName: '',
      tradeName: '',
      gstin: '',
      pan: '',
      stateCode: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      pincode: '',
      phone: '',
      email: '',
      invoicePrefix: 'INV',
      defaultCreditDays: 30,
      defaultTermsText: '',
      bankName: '',
      bankAccountName: '',
      bankAccountNumber: '',
      bankIfsc: '',
      bankBranch: '',
      upiId: '',
    },
  });

  const watchedGstin = watch('gstin');
  const watchedStateCode = watch('stateCode');
  const watchedPrefix = watch('invoicePrefix') || 'INV';

  // Populate form with existing organisation data
  useEffect(() => {
    if (org) {
      reset({
        legalName: org.legalName || '',
        tradeName: org.tradeName || '',
        gstin: org.gstin || '',
        pan: org.pan || '',
        stateCode: org.stateCode || '',
        addressLine1: org.addressLine1 || '',
        addressLine2: org.addressLine2 || '',
        city: org.city || '',
        pincode: org.pincode || '',
        phone: org.phone || '',
        email: org.email || '',
        invoicePrefix: org.invoicePrefix || 'INV',
        defaultCreditDays: org.defaultCreditDays ?? 30,
        defaultTermsText: org.defaultTermsText || '',
        bankName: org.bankName || '',
        bankAccountName: org.bankAccountName || '',
        bankAccountNumber: org.bankAccountNumber || '',
        bankIfsc: org.bankIfsc || '',
        bankBranch: org.bankBranch || '',
        upiId: org.upiId || '',
      });
    }
  }, [org, reset]);

  // Auto derive state code and PAN from GSTIN
  useEffect(() => {
    if (watchedGstin && watchedGstin.length >= 2) {
      const derivedState = watchedGstin.substring(0, 2);
      setValue('stateCode', derivedState, { shouldValidate: true });
    }
    if (watchedGstin && watchedGstin.length >= 12) {
      const derivedPan = watchedGstin.substring(2, 12);
      setValue('pan', derivedPan, { shouldValidate: true });
    }
  }, [watchedGstin, setValue]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSaveSuccess(false);
    await updateMutation.mutateAsync({
      legalName: values.legalName,
      tradeName: values.tradeName || undefined,
      gstin: values.gstin || undefined,
      pan: values.pan || undefined,
      stateCode: values.stateCode || undefined,
      addressLine1: values.addressLine1 || undefined,
      addressLine2: values.addressLine2 || undefined,
      city: values.city || undefined,
      pincode: values.pincode || undefined,
      phone: values.phone || undefined,
      email: values.email || undefined,
      invoicePrefix: values.invoicePrefix,
      defaultCreditDays: values.defaultCreditDays,
      defaultTermsText: values.defaultTermsText || undefined,
      bankName: values.bankName || undefined,
      bankAccountName: values.bankAccountName || undefined,
      bankAccountNumber: values.bankAccountNumber || undefined,
      bankIfsc: values.bankIfsc || undefined,
      bankBranch: values.bankBranch || undefined,
      upiId: values.upiId || undefined,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1 * 1024 * 1024) {
      alert('Logo file size exceeds maximum limit of 1MB');
      e.target.value = '';
      return;
    }

    try {
      await uploadLogoMutation.mutateAsync(file);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Logo upload failed');
    }
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to remove your organisation logo?')) return;
    try {
      await deleteLogoMutation.mutateAsync();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove logo');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-xs text-gray-500 animate-pulse">
        Loading organisation settings...
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center space-x-2">
        <AlertCircle className="w-4 h-4 text-red-500" />
        <span>Failed to load organisation profile. Please retry.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-200 gap-3">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Organisation Settings</h1>
          <p className="text-xs text-gray-500">
            Manage your legal entity profile, tax registration, bank details, and invoice preferences.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'profile'
              ? 'border-brand-600 text-brand-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Business Profile & Logo</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('invoice')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'invoice'
              ? 'border-brand-600 text-brand-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Invoice & Series</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('bank')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'bank'
              ? 'border-brand-600 text-brand-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Bank & UPI Details</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hsn')}
          className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'hsn'
              ? 'border-brand-600 text-brand-700 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>HSN / SAC Directory</span>
        </button>
      </div>

      {updateMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <span>{updateMutation.error.message}</span>
        </div>
      )}

      {activeTab === 'hsn' ? (
        <div className="bg-white p-6 border border-gray-200 rounded shadow-sm">
          <HsnManagementView />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab 1: Business Profile & Logo */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Logo Upload Card */}
            <div className="bg-white p-4 border border-gray-200 rounded shadow-sm">
              <h2 className="text-xs font-semibold text-gray-900 mb-2 flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5 text-gray-500" />
                <span>Organisation Logo</span>
              </h2>
              <p className="text-[11px] text-gray-500 mb-3">
                Displayed in the header of issued PDF invoices. Formats: PNG, JPEG, WebP. Max 1MB.
              </p>

              <div className="flex items-center space-x-4">
                <div className="w-24 h-16 bg-gray-50 border border-gray-200 rounded flex items-center justify-center overflow-hidden">
                  {logoBlobUrl ? (
                    <img src={logoBlobUrl} alt="Org Logo" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">No Logo</span>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                    <span>{uploadLogoMutation.isPending ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoFileChange}
                      disabled={uploadLogoMutation.isPending}
                      className="hidden"
                    />
                  </label>

                  {(logoBlobUrl || org?.logoObjectKey) && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      disabled={deleteLogoMutation.isPending}
                      className="inline-flex items-center space-x-1 text-xs text-red-600 hover:text-red-700 ml-3"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Entity Identification */}
            <div className="bg-white p-5 border border-gray-200 rounded shadow-sm space-y-4">
              <h2 className="text-xs font-semibold text-gray-900 border-b border-gray-100 pb-2">
                Entity Legal Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="legalName" className="block text-xs font-medium text-gray-700 mb-1">
                    Legal Business Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="legalName"
                    type="text"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                    {...register('legalName')}
                  />
                  {errors.legalName && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.legalName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="tradeName" className="block text-xs font-medium text-gray-700 mb-1">
                    Trade Name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="tradeName"
                    type="text"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                    {...register('tradeName')}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="gstin" className="block text-xs font-medium text-gray-700 mb-1">
                    GSTIN <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    id="gstin"
                    type="text"
                    maxLength={15}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none uppercase font-mono"
                    placeholder="27ABCDE1234F1Z5"
                    {...register('gstin')}
                  />
                  {errors.gstin && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.gstin.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="stateCode" className="block text-xs font-medium text-gray-700">
                      GST State Code
                    </label>
                    {getStateName(watchedStateCode) && (
                      <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {getStateName(watchedStateCode)}
                      </span>
                    )}
                  </div>
                  <input
                    id="stateCode"
                    type="text"
                    maxLength={2}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none font-mono"
                    placeholder="27"
                    {...register('stateCode')}
                  />
                  {errors.stateCode && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.stateCode.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="pan" className="block text-xs font-medium text-gray-700 mb-1">
                    Permanent Account Number (PAN)
                  </label>
                  <input
                    id="pan"
                    type="text"
                    maxLength={10}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none uppercase font-mono"
                    placeholder="ABCDE1234F"
                    {...register('pan')}
                  />
                  {errors.pan && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.pan.message}</p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <h3 className="text-xs font-medium text-gray-900 mb-3">Registered Business Address</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="addressLine1" className="block text-xs font-medium text-gray-700 mb-1">
                        Address Line 1 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="addressLine1"
                        type="text"
                        className={`w-full px-2.5 py-1.5 text-xs bg-white border rounded outline-none ${
                          errors.addressLine1 ? 'border-red-500 focus:ring-1 focus:ring-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Street / Building Address"
                        {...register('addressLine1')}
                      />
                      {errors.addressLine1 && (
                        <p className="mt-1 text-[11px] text-red-600">{errors.addressLine1.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="addressLine2" className="block text-xs font-medium text-gray-700 mb-1">
                        Address Line 2 <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <input
                        id="addressLine2"
                        type="text"
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                        placeholder="Suite / Unit / Floor"
                        {...register('addressLine2')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                      placeholder="City"
                      {...register('city')}
                    />
                    <input
                      type="text"
                      maxLength={6}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none font-mono"
                      placeholder="Pincode (6 digits)"
                      {...register('pincode')}
                    />
                    <input
                      type="text"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                      placeholder="Phone"
                      {...register('phone')}
                    />
                    <input
                      type="email"
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                      placeholder="Work Email"
                      {...register('email')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Invoice & Series Preferences */}
        {activeTab === 'invoice' && (
          <div className="bg-white p-5 border border-gray-200 rounded shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              <span>Invoice Format & Rule 46 Series</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="invoicePrefix" className="block text-xs font-medium text-gray-700 mb-1">
                  Invoice Number Prefix <span className="text-red-500">*</span> (1-6 chars)
                </label>
                <input
                  id="invoicePrefix"
                  type="text"
                  maxLength={6}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none uppercase font-mono"
                  placeholder="INV"
                  {...register('invoicePrefix')}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Letters, digits, hyphens or slashes. e.g. <span className="font-mono text-gray-600">INV</span> or <span className="font-mono text-gray-600">FB</span>.
                </p>
                {errors.invoicePrefix && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.invoicePrefix.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="defaultCreditDays" className="block text-xs font-medium text-gray-700 mb-1">
                  Default Payment Credit Period (Days)
                </label>
                <input
                  id="defaultCreditDays"
                  type="number"
                  min={0}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                  {...register('defaultCreditDays')}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Pre-fills customer and invoice payment terms.
                </p>
              </div>
            </div>

            {/* Live Rule 46 Preview Box */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="text-xs font-medium text-gray-700 mb-1">Rule 46 Numbering Preview:</div>
              <div className="text-sm font-mono font-semibold text-brand-700">
                {watchedPrefix.toUpperCase()}/26-27/0001
              </div>
              <div className="text-[11px] text-gray-500 mt-1">
                Length: {(watchedPrefix.length + 13)} / 16 chars max. Fully compliant with GST Rule 46 (unique per financial year).
              </div>
            </div>

            <div>
              <label htmlFor="defaultTermsText" className="block text-xs font-medium text-gray-700 mb-1">
                Default Terms and Conditions
              </label>
              <textarea
                id="defaultTermsText"
                rows={4}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                placeholder="e.g. 1. Goods once sold will not be taken back.&#10;2. Interest @ 18% p.a. will be charged after due date."
                {...register('defaultTermsText')}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Bank & UPI Details */}
        {activeTab === 'bank' && (
          <div className="bg-white p-5 border border-gray-200 rounded shadow-sm space-y-4">
            <h2 className="text-xs font-semibold text-gray-900 border-b border-gray-100 pb-2 flex items-center space-x-1.5">
              <CreditCard className="w-3.5 h-3.5 text-gray-500" />
              <span>Receiving Bank Account & UPI</span>
            </h2>
            <p className="text-[11px] text-gray-500">
              Printed on every tax invoice so customers know where to deposit payment.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankName" className="block text-xs font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  id="bankName"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                  placeholder="e.g. HDFC Bank"
                  {...register('bankName')}
                />
              </div>

              <div>
                <label htmlFor="bankBranch" className="block text-xs font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  id="bankBranch"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                  placeholder="e.g. Fort Branch, Mumbai"
                  {...register('bankBranch')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankAccountName" className="block text-xs font-medium text-gray-700 mb-1">
                  Beneficiary / Account Name
                </label>
                <input
                  id="bankAccountName"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none"
                  placeholder="e.g. Acme Fabrications Private Limited"
                  {...register('bankAccountName')}
                />
              </div>

              <div>
                <label htmlFor="bankAccountNumber" className="block text-xs font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  id="bankAccountNumber"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none font-mono"
                  placeholder="50200012345678"
                  {...register('bankAccountNumber')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bankIfsc" className="block text-xs font-medium text-gray-700 mb-1">
                  IFSC Code (11 characters)
                </label>
                <input
                  id="bankIfsc"
                  type="text"
                  maxLength={11}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none uppercase font-mono"
                  placeholder="HDFC0001234"
                  {...register('bankIfsc')}
                />
                {errors.bankIfsc && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.bankIfsc.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="upiId" className="block text-xs font-medium text-gray-700 mb-1">
                  UPI VPA ID (optional)
                </label>
                <input
                  id="upiId"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded outline-none font-mono"
                  placeholder="business@okhdfcbank"
                  {...register('upiId')}
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded text-xs font-medium disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting || updateMutation.isPending ? 'Saving settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
};
