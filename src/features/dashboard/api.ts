import { useQuery } from '@tanstack/react-query';
import { getAccessToken } from '@/api/client';
import type { DashboardMetricsResponse } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  metrics: () => [...dashboardKeys.all, 'metrics'] as const,
};

export function useDashboardMetrics() {
  return useQuery<DashboardMetricsResponse>({
    queryKey: dashboardKeys.metrics(),
    queryFn: async () => {
      const token = getAccessToken();
      const response = await fetch(`${baseUrl}/api/v1/dashboard/metrics`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load dashboard metrics');
      }

      return response.json();
    },
    refetchInterval: 1000 * 60, // Auto-refresh metrics every minute
  });
}
