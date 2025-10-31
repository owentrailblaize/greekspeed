import { useState, useEffect, useCallback } from 'react';
import { VendorContact, CreateVendorRequest, UpdateVendorRequest } from '@/types/vendors';
import { logger } from "@/lib/utils/logger";

interface UseVendorsOptions {
  chapterId: string;
}

export function useVendors({ chapterId }: UseVendorsOptions) {
  const [vendors, setVendors] = useState<VendorContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    if (!chapterId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vendors?chapter_id=${chapterId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      setVendors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  const createVendor = useCallback(async (vendorData: CreateVendorRequest): Promise<VendorContact | null> => {
    try {
      setError(null);
      
      // Sending vendor data
      
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...vendorData,
          chapter_id: chapterId,
        }),
      });

      // Response status

      if (!response.ok) {
        const errorData = await response.json();
        logger.error('API error response:', { context: [errorData] });
        throw new Error(errorData.error || 'Failed to create vendor');
      }

      const result = await response.json();
      // API success response
      await fetchVendors(); // Refresh the vendors list
      return result.vendor;
    } catch (err) {
      logger.error('Error in createVendor:', { context: [err] });
      setError(err instanceof Error ? err.message : 'Failed to create vendor');
      return null;
    }
  }, [chapterId, fetchVendors]);

  const updateVendor = useCallback(async (vendorId: string, updateData: UpdateVendorRequest): Promise<VendorContact | null> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update vendor');
      }

      const result = await response.json();
      await fetchVendors(); // Refresh the vendors list
      return result.vendor;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update vendor');
      return null;
    }
  }, [fetchVendors]);

  const deleteVendor = useCallback(async (vendorId: string): Promise<boolean> => {
    try {
      setError(null);
      
      const response = await fetch(`/api/vendors/${vendorId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete vendor');
      }

      await fetchVendors(); // Refresh the vendors list
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vendor');
      return false;
    }
  }, [fetchVendors]);

  // Fetch vendors on mount and when dependencies change
  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  };
}
