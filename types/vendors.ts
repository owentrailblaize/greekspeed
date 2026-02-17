export interface VendorContact {
  id: string;
  chapter_id: string;
  name: string;
  type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  rating?: number;
  notes?: string;
  website?: string;
  address?: string;
  is_active: boolean;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateVendorRequest {
  name: string;
  type: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  rating?: number;
  notes?: string;
  website?: string;
  address?: string;
}

export interface UpdateVendorRequest extends Partial<CreateVendorRequest> {
  is_active?: boolean;
}

export interface BulkVendorImportRow {
  name: string;
  type?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  notes?: string;
  website?: string;
  address?: string;
}

export interface VendorImportColumnMapping {
  name: string | null;
  type: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  website: string | null;
  address: string | null;
}

export interface BulkVendorImportError {
  row: number;
  name: string;
  error: string;
}

export interface BulkVendorImportDuplicate {
  row: number;
  name: string;
  existingId: string;
  reason: string;
}

export interface BulkVendorImportResult {
  total: number;
  successful: number;
  failed: number;
  duplicates: number;
  errors: BulkVendorImportError[];
  createdVendors: Array<{ id: string; name: string }>;
  skippedDuplicates: BulkVendorImportDuplicate[];
}

export const VENDOR_COLUMN_NAME_MAPPINGS: Record<keyof VendorImportColumnMapping, string[]> = {
  name: ['vendor', 'vendor_name', 'company', 'company_name', 'business', 'name'],
  type: ['type', 'category', 'service_type', 'vendor_type', 'service'],
  contact_person: ['contact', 'contact_person', 'contact_name', 'rep', 'representative', 'person'],
  email: ['email', 'email_address', 'e-mail', 'contact_email'],
  phone: ['phone', 'phone_number', 'mobile', 'cell', 'telephone', 'contact_phone'],
  notes: ['notes', 'comments', 'description', 'details', 'memo'],
  website: ['website', 'url', 'site', 'web'],
  address: ['address', 'location', 'street_address', 'vendor_address'],
};

export const VENDOR_TYPES = [
  'Catering',
  'Equipment',
  'Audio/Visual',
  'Security',
  'Transportation',
  'Entertainment',
  'Photography',
  'Venue',
  'Decoration',
  'Other'
] as const;

export type VendorType = typeof VENDOR_TYPES[number];
