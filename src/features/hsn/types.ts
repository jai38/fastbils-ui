export interface HsnItem {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  taxRatePercent: number;
  isService: boolean;
  isDefault: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHsnItemRequest {
  code: string;
  name: string;
  description?: string;
  taxRatePercent: number;
  isService?: boolean;
  isDefault?: boolean;
}

export interface UpdateHsnItemRequest {
  code?: string;
  name?: string;
  description?: string;
  taxRatePercent?: number;
  isService?: boolean;
  isDefault?: boolean;
  isActive?: boolean;
}

export interface HsnLookupResult {
  code: string;
  description: string;
  taxRatePercent: number;
  isService: boolean;
  heading: string;
  found: boolean;
}
