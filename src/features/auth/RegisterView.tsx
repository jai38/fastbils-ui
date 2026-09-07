import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from './AuthContext';
import { AlertCircle } from 'lucide-react';

const registerSchema = z
  .object({
    legalName: z.string().min(1, 'Organisation legal name is required').max(255),
    tradeName: z.string().max(255).optional().or(z.literal('')),
    fullName: z.string().min(1, 'Owner full name is required').max(255),
    email: z.string().min(1, 'Email is required').email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    gstin: z
      .string()
      .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format (15 characters)')
      .optional()
      .or(z.literal('')),
    stateCode: z
      .string()
      .regex(/^[0-9]{2}$/, 'State code must be exactly 2 digits')
      .optional()
      .or(z.literal('')),
    pan: z
      .string()
      .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format (10 characters)')
      .optional()
      .or(z.literal('')),
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
      message: 'State code must match the first two digits of GSTIN',
      path: ['stateCode'],
    }
  );

type RegisterFormValues = z.infer<typeof registerSchema>;

export const RegisterView: React.FC = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      legalName: '',
      tradeName: '',
      fullName: '',
      email: '',
      password: '',
      gstin: '',
      stateCode: '',
      pan: '',
    },
  });

  const watchedGstin = watch('gstin');

  // Auto-populate state code and PAN from GSTIN when valid
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

  const onSubmit = async (data: RegisterFormValues) => {
    try {
      setServerError(null);
      await registerAuth({
        legalName: data.legalName,
        tradeName: data.tradeName || undefined,
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        gstin: data.gstin || undefined,
        stateCode: data.stateCode || undefined,
        pan: data.pan || undefined,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Registration failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center">
          <h1 className="text-xl font-bold tracking-tight text-brand-700">FastBills</h1>
          <p className="mt-1 text-xs text-gray-500">Register your business for GST Invoicing</p>
        </div>

        <div className="mt-6 bg-white py-6 px-6 shadow-sm border border-gray-200 rounded sm:px-8">
          <h2 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            Create Business Account
          </h2>

          {serverError && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Organisation Details */}
            <div>
              <label htmlFor="legalName" className="block text-xs font-medium text-gray-700 mb-1">
                Legal Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="legalName"
                type="text"
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                placeholder="e.g. Acme Fabrications Private Limited"
                {...register('legalName')}
              />
              {errors.legalName && (
                <p className="mt-1 text-[11px] text-red-600">{errors.legalName.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="tradeName" className="block text-xs font-medium text-gray-700 mb-1">
                  Trade Name <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="tradeName"
                  type="text"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                  placeholder="e.g. Acme Fab"
                  {...register('tradeName')}
                />
              </div>

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
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="stateCode" className="block text-xs font-medium text-gray-700 mb-1">
                  GST State Code
                </label>
                <input
                  id="stateCode"
                  type="text"
                  maxLength={2}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none font-mono"
                  placeholder="e.g. 27"
                  {...register('stateCode')}
                />
                {errors.stateCode && (
                  <p className="mt-1 text-[11px] text-red-600">{errors.stateCode.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="pan" className="block text-xs font-medium text-gray-700 mb-1">
                  PAN <span className="text-gray-400 font-normal">(optional)</span>
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

            {/* Owner Account Details */}
            <div className="pt-2 border-t border-gray-100">
              <h3 className="text-xs font-medium text-gray-900 mb-2">Owner Credentials</h3>
              <div className="space-y-3">
                <div>
                  <label htmlFor="fullName" className="block text-xs font-medium text-gray-700 mb-1">
                    Your Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                    placeholder="Ramesh Kumar"
                    {...register('fullName')}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                    Work Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                    placeholder="owner@company.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                    Password <span className="text-red-500">*</span> (min 8 characters)
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded focus:ring-1 focus:ring-brand-600 focus:border-brand-600 outline-none"
                    placeholder="••••••••"
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 flex justify-center py-2 px-4 border border-transparent rounded text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand-600 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Creating account...' : 'Register Business'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700 underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
