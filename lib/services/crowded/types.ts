/**
 * TypeScript types for Crowded API responses
 * Based on Crowded API documentation
 */

export interface CrowdedAccount {
  id: string;
  name: string;
  type: 'hq' | 'chapter' | 'sub_account';
  balance?: number;
  currency?: string;
  status: 'active' | 'pending' | 'suspended';
  parent_account_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CrowdedCollectionLink {
  id: string;
  account_id: string;
  name: string;
  description?: string;
  amount?: number; // null for open-amount links
  currency: string;
  payment_methods: string[];
  status: 'active' | 'inactive' | 'expired';
  url: string;
  qr_code_url?: string;
  created_at: string;
  expires_at?: string;
}

export interface CrowdedTransaction {
  id: string;
  account_id: string;
  collection_link_id?: string;
  type: 'payment' | 'transfer' | 'expense' | 'refund';
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionLinkRequest {
  account_id: string;
  name: string;
  description?: string;
  amount?: number;
  currency?: string;
  payment_methods?: string[];
  expires_at?: string;
}

export interface CreateAccountRequest {
  name: string;
  type: 'chapter';
  parent_account_id?: string;
}

export interface CrowdedApiErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
  details?: unknown;
}
