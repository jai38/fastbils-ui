import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import { useDashboardMetrics } from './api';
import { formatRupees } from '@/utils/money';
import Big from 'big.js';

export function DashboardView() {
  const navigate = useNavigate();
  const { user, organisation } = useAuth();
  const { data: metrics, isLoading, error } = useDashboardMetrics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-sm text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Calculating financial metrics and receivables ageing...
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
        Failed to load dashboard metrics. Please check your backend connection.
      </div>
    );
  }

  const totalOutstanding = new Big(metrics.totalOutstanding || '0');
  const ageing = metrics.ageingSummary;

  // Calculate percentages for the stacked horizontal bar
  const curVal = new Big(ageing.current || '0');
  const d1Val = new Big(ageing.days1To30 || '0');
  const d31Val = new Big(ageing.days31To45 || '0');
  const d46Val = new Big(ageing.days46To60 || '0');
  const d61Val = new Big(ageing.days61To90 || '0');
  const o90Val = new Big(ageing.over90 || '0');

  const getPercent = (val: Big) => {
    if (totalOutstanding.lte(0)) return 0;
    return val.div(totalOutstanding).times(100).toNumber();
  };

  const crossed45Big = new Big(metrics.crossed45Days || '0');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
              {organisation?.legalName}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Welcome back, {user?.fullName}. GSTIN: <span className="font-mono">{organisation?.gstin || 'Unregistered'}</span> &bull; State: {organisation?.stateCode}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 transition-colors"
          >
            Statutory Reports
          </button>
          <button
            type="button"
            onClick={() => navigate('/invoices/new')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition-colors"
          >
            + Create Invoice
          </button>
        </div>
      </div>

      {/* 5 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Outstanding */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Outstanding</div>
            <div className="text-lg font-bold font-mono text-gray-900 mt-1">
              {formatRupees(metrics.totalOutstanding)}
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">All active unpaid balances</div>
        </div>

        {/* Card 2: Total Overdue */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Overdue</span>
              {new Big(metrics.totalOverdue || '0').gt(0) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                  Past Due
                </span>
              )}
            </div>
            <div className={`text-lg font-bold font-mono mt-1 ${new Big(metrics.totalOverdue || '0').gt(0) ? 'text-red-600' : 'text-gray-900'}`}>
              {formatRupees(metrics.totalOverdue)}
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Invoices past payment terms</div>
        </div>

        {/* Card 3: MSME > 45 Days Warning */}
        <div className={`p-4 rounded border shadow-sm flex flex-col justify-between ${crossed45Big.gt(0) ? 'bg-amber-50/50 border-amber-300' : 'bg-white border-gray-200'}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-800 uppercase tracking-wider">&gt; 45 Days Overdue</span>
              {crossed45Big.gt(0) && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200 text-amber-900 animate-pulse">
                  MSME Alert
                </span>
              )}
            </div>
            <div className={`text-lg font-bold font-mono mt-1 ${crossed45Big.gt(0) ? 'text-amber-700' : 'text-gray-900'}`}>
              {formatRupees(metrics.crossed45Days)}
            </div>
          </div>
          <div className="text-[11px] text-amber-700/80 mt-2">
            Section 43B(h) IT Act risk
          </div>
        </div>

        {/* Card 4: Collections This Month */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Collected (This Month)</div>
            <div className="text-lg font-bold font-mono text-emerald-600 mt-1">
              {formatRupees(metrics.receivedThisMonth)}
            </div>
          </div>
          <div className="text-[11px] text-gray-400 mt-2">Active payment receipts</div>
        </div>

        {/* Card 5: Invoiced This Month */}
        <div className="bg-white p-4 rounded border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Invoiced (This Month)</div>
            <div className="text-lg font-bold font-mono text-blue-600 mt-1">
              {formatRupees(metrics.invoicesRaisedThisMonthTotal)}
            </div>
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            {metrics.invoicesRaisedThisMonthCount} {metrics.invoicesRaisedThisMonthCount === 1 ? 'invoice' : 'invoices'} issued
          </div>
        </div>
      </div>

      {/* Horizontal Receivables Ageing Visualizer */}
      <div className="bg-white p-5 rounded border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Receivables Ageing Distribution</h2>
            <p className="text-xs text-gray-500">Breakdown of outstanding invoices categorized by payment due date.</p>
          </div>
          <div className="text-xs font-mono font-medium text-gray-600">
            Total Base: <span className="font-semibold text-gray-900">{formatRupees(metrics.totalOutstanding)}</span>
          </div>
        </div>

        {/* The Stacked Progress Bar */}
        <div className="h-6 w-full rounded bg-gray-100 overflow-hidden flex shadow-inner">
          {curVal.gt(0) && (
            <div
              style={{ width: `${getPercent(curVal)}%` }}
              title={`Current (Not Due): ${formatRupees(curVal)} (${getPercent(curVal).toFixed(1)}%)`}
              className="bg-emerald-500 hover:opacity-90 transition-opacity"
            />
          )}
          {d1Val.gt(0) && (
            <div
              style={{ width: `${getPercent(d1Val)}%` }}
              title={`1-30 Days Overdue: ${formatRupees(d1Val)} (${getPercent(d1Val).toFixed(1)}%)`}
              className="bg-sky-500 hover:opacity-90 transition-opacity"
            />
          )}
          {d31Val.gt(0) && (
            <div
              style={{ width: `${getPercent(d31Val)}%` }}
              title={`31-45 Days Overdue: ${formatRupees(d31Val)} (${getPercent(d31Val).toFixed(1)}%)`}
              className="bg-yellow-400 hover:opacity-90 transition-opacity"
            />
          )}
          {d46Val.gt(0) && (
            <div
              style={{ width: `${getPercent(d46Val)}%` }}
              title={`46-60 Days Overdue (MSME Alert): ${formatRupees(d46Val)} (${getPercent(d46Val).toFixed(1)}%)`}
              className="bg-orange-500 hover:opacity-90 transition-opacity"
            />
          )}
          {d61Val.gt(0) && (
            <div
              style={{ width: `${getPercent(d61Val)}%` }}
              title={`61-90 Days Overdue: ${formatRupees(d61Val)} (${getPercent(d61Val).toFixed(1)}%)`}
              className="bg-red-500 hover:opacity-90 transition-opacity"
            />
          )}
          {o90Val.gt(0) && (
            <div
              style={{ width: `${getPercent(o90Val)}%` }}
              title={`90+ Days Overdue: ${formatRupees(o90Val)} (${getPercent(o90Val).toFixed(1)}%)`}
              className="bg-rose-800 hover:opacity-90 transition-opacity"
            />
          )}
          {totalOutstanding.lte(0) && (
            <div className="w-full flex items-center justify-center text-xs text-gray-400">
              No outstanding receivables
            </div>
          )}
        </div>

        {/* Legend & Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Current */}
          <div className="p-2.5 rounded border border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-[11px] font-medium text-gray-600">Current (Not Due)</span>
            </div>
            <div className="text-xs font-bold font-mono text-gray-900 mt-1">
              {formatRupees(ageing.current)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{getPercent(curVal).toFixed(1)}%</div>
          </div>

          {/* 1-30 Days */}
          <div className="p-2.5 rounded border border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
              <span className="text-[11px] font-medium text-gray-600">1 - 30 Days</span>
            </div>
            <div className="text-xs font-bold font-mono text-gray-900 mt-1">
              {formatRupees(ageing.days1To30)}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">{getPercent(d1Val).toFixed(1)}%</div>
          </div>

          {/* 31-45 Days */}
          <div className="p-2.5 rounded border border-gray-100 bg-gray-50/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 shrink-0" />
              <span className="text-[11px] font-medium text-gray-600">31 - 45 Days</span>
            </div>
            <div className="text-xs font-bold font-mono text-gray-900 mt-1">
              {formatRupees(ageing.days31To45)}
            </div>
            <div className="text-[10px] text-amber-700 font-semibold mt-0.5">MSME Threshold</div>
          </div>

          {/* 46-60 Days */}
          <div className="p-2.5 rounded border border-amber-200 bg-amber-50/40">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
              <span className="text-[11px] font-medium text-amber-900">46 - 60 Days</span>
            </div>
            <div className="text-xs font-bold font-mono text-amber-950 mt-1">
              {formatRupees(ageing.days46To60)}
            </div>
            <div className="text-[10px] text-amber-700 mt-0.5">{getPercent(d46Val).toFixed(1)}%</div>
          </div>

          {/* 61-90 Days */}
          <div className="p-2.5 rounded border border-red-200 bg-red-50/40">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-[11px] font-medium text-red-900">61 - 90 Days</span>
            </div>
            <div className="text-xs font-bold font-mono text-red-950 mt-1">
              {formatRupees(ageing.days61To90)}
            </div>
            <div className="text-[10px] text-red-700 mt-0.5">{getPercent(d61Val).toFixed(1)}%</div>
          </div>

          {/* Over 90 Days */}
          <div className="p-2.5 rounded border border-rose-300 bg-rose-50/50">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-800 shrink-0" />
              <span className="text-[11px] font-medium text-rose-900">90+ Days</span>
            </div>
            <div className="text-xs font-bold font-mono text-rose-950 mt-1">
              {formatRupees(ageing.over90)}
            </div>
            <div className="text-[10px] text-rose-700 mt-0.5">{getPercent(o90Val).toFixed(1)}%</div>
          </div>
        </div>
      </div>

      {/* Top 10 Oldest Unpaid Invoices */}
      <div className="bg-white rounded border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Oldest Unpaid Invoices</h2>
            <p className="text-xs text-gray-500">Invoices prioritized by urgency of collection.</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/invoices')}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View All Invoices &rarr;
          </button>
        </div>

        {metrics.topUnpaidInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            All invoices are settled! There are no outstanding unpaid invoices.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Invoice Number</th>
                  <th className="py-2.5 px-3">Customer Name</th>
                  <th className="py-2.5 px-3">Invoice Date</th>
                  <th className="py-2.5 px-3">Due Date</th>
                  <th className="py-2.5 px-3">Ageing / Status</th>
                  <th className="py-2.5 px-3 text-right">Grand Total</th>
                  <th className="py-2.5 px-3 text-right">Balance Due</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-mono">
                {metrics.topUnpaidInvoices.map((inv) => {
                  const isCritical = inv.daysOverdue > 45;
                  const isPastDue = inv.daysOverdue > 0;

                  return (
                    <tr key={inv.id} className="hover:bg-gray-50/75 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-blue-600 hover:underline cursor-pointer" onClick={() => navigate(`/invoices/${inv.id}`)}>
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-gray-900 font-medium max-w-[200px] truncate" title={inv.customerLegalName}>
                        {inv.customerLegalName}
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{inv.invoiceDate}</td>
                      <td className="py-2.5 px-3 text-gray-600">{inv.dueDate}</td>
                      <td className="py-2.5 px-3 font-sans">
                        {isCritical ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                            {inv.daysOverdue} days (MSME Alert)
                          </span>
                        ) : isPastDue ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                            {inv.daysOverdue} days overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                            Current (Not Due)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right text-gray-700">
                        {formatRupees(inv.grandTotal)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">
                        {formatRupees(inv.balanceAmount)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-sans">
                        <button
                          type="button"
                          onClick={() => navigate(`/invoices/${inv.id}`)}
                          className="px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                        >
                          View & Pay
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
