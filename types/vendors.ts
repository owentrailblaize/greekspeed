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
