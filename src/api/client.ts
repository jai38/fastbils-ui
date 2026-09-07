import createFetchClient from 'openapi-fetch';
import type { paths } from './schema';

const baseUrl = import.meta.env.VITE_API_BASE_URL || '';

export const api = createFetchClient<paths>({
  baseUrl,
});

// Helper to set or clear bearer token
let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
}

export function getAccessToken(): string | null {
  return currentAccessToken;
}

// Global request interceptor to attach JWT token
api.use({
  async onRequest({ request }) {
    if (currentAccessToken) {
      request.headers.set('Authorization', `Bearer ${currentAccessToken}`);
    }
    return request;
  },
});
