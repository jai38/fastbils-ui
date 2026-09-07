import type { components } from '@/api/schema';

export type UserRole = 'OWNER' | 'STAFF';

export type User = components['schemas']['AuthResponse']['user'];
export type Organisation = components['schemas']['AuthResponse']['organisation'];
export type RegisterRequest = components['schemas']['RegisterRequest'];
export type LoginRequest = components['schemas']['LoginRequest'];
export type AuthResponse = components['schemas']['AuthResponse'];

export interface AuthState {
  user: User | null;
  organisation: Organisation | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
