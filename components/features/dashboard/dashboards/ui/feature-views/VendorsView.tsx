'use client';

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProfile } from "@/lib/contexts/ProfileContext";
import { useVendors } from "@/lib/hooks/useVendors";
import { VendorForm } from "@/components/ui/VendorForm";
import { VendorContact, CreateVendorRequest, UpdateVendorRequest } from "@/types/vendors";

export function VendorsView() {
  const [showVendorForm, setShowVendorForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState<VendorContact | null>(null);
  const [isSubmittingVendor, setIsSubmittingVendor] = useState(false);

  // Get user profile and chapter ID
  const { profile } = useProfile();
  const chapterId = profile?.chapter_id;

  // Add vendors hook
  const { 
    vendors, 
    loading: vendorsLoading, 
    error: vendorsError, 
    createVendor, 
    updateVendor, 
    deleteVendor,
    fetchVendors 
  } = useVendors({ 
    chapterId: chapterId || '' 
  });

  // Vendor management functions
  const handleCreateVendor = async (vendorData: CreateVendorRequest) => {
    if (!chapterId) return;
    
    setIsSubmittingVendor(true);
    try {
      // Add the missing user ID fields
      const vendorWithUser = {
        ...vendorData,
        created_by: profile?.id || '',
        updated_by: profile?.id || ''
      };
      
      const newVendor = await createVendor(vendorWithUser);
      
      if (newVendor) {
        setShowVendorForm(false);
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleUpdateVendor = async (vendorData: UpdateVendorRequest) => {
    if (!editingVendor) return;
    
    setIsSubmittingVendor(true);
    try {
      const updatedVendor = await updateVendor(editingVendor.id, vendorData);
      
      if (updatedVendor) {
        setShowVendorForm(false);
        setEditingVendor(null);
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
    } finally {
      setIsSubmittingVendor(false);
    }
  };

  const handleEditVendor = (vendor: VendorContact) => {
    setEditingVendor(vendor);
    setShowVendorForm(true);
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      const success = await deleteVendor(vendorId);
      if (success) {
        // Vendor deleted successfully
      }
    }
  };

  const handleCancelVendorForm = () => {
    setShowVendorForm(false);
    setEditingVendor(null);
  };

  const handleSubmitVendor = async (data: CreateVendorRequest | UpdateVendorRequest) => {
    if (editingVendor) {
      await handleUpdateVendor(data as UpdateVendorRequest);
    } else {
      await handleCreateVendor(data as CreateVendorRequest);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-2 md:pb-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg md:text-xl">Vendor Contacts</CardTitle>
            <Button 
              className="bg-orange-600 hover:bg-orange-700 text-xs md:text-sm h-8 md:h-10 px-2 md:px-4"
              onClick={() => setShowVendorForm(true)}
            >
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Add Vendor</span>
              <span className="sm:hidden">Vendor</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2 md:pt-6">
          {vendorsLoading ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-sm md:text-base">Loading vendors...</p>
            </div>
          ) : vendorsError ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-red-500 text-sm md:text-base">Error loading vendors: {vendorsError}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchVendors()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-6 md:py-8">
              <p className="text-gray-500 text-base md:text-lg font-medium mb-2">No vendor contacts found</p>
              <p className="text-xs md:text-sm text-gray-400 mb-4">No vendors have been added to your chapter yet.</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowVendorForm(true)}
                className="mt-2"
              >
                Add First Vendor
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor) => (
                      <TableRow key={vendor.id}>
                        <TableCell className="font-medium">{vendor.name}</TableCell>
                        <TableCell>{vendor.type}</TableCell>
                        <TableCell>{vendor.contact_person || '-'}</TableCell>
                        <TableCell>{vendor.phone || '-'}</TableCell>
                        <TableCell>{vendor.email || '-'}</TableCell>
                        <TableCell>
                          {vendor.rating ? (
                            <div className="flex items-center">
                              <span className="text-yellow-500">★</span>
                              <span className="ml-1">{vendor.rating}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditVendor(vendor)}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteVendor(vendor.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Table with Horizontal Scroll */}
              <div className="md:hidden">
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Vendor Name</TableHead>
                          <TableHead className="text-xs">Type</TableHead>
                          <TableHead className="text-xs">Contact Person</TableHead>
                          <TableHead className="text-xs">Phone</TableHead>
                          <TableHead className="text-xs">Email</TableHead>
                          <TableHead className="text-xs">Rating</TableHead>
                          <TableHead className="text-xs">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendors.map((vendor) => (
                          <TableRow key={vendor.id}>
                            <TableCell className="font-medium text-xs">{vendor.name}</TableCell>
                            <TableCell className="text-xs">{vendor.type}</TableCell>
                            <TableCell className="text-xs">{vendor.contact_person || '-'}</TableCell>
                            <TableCell className="text-xs">{vendor.phone || '-'}</TableCell>
                            <TableCell className="text-xs">{vendor.email || '-'}</TableCell>
                            <TableCell className="text-xs">
                              {vendor.rating ? (
                                <div className="flex items-center">
                                  <span className="text-yellow-500">★</span>
                                  <span className="ml-1">{vendor.rating}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex space-x-1">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleEditVendor(vendor)}
                                  className="h-6 px-2"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => handleDeleteVendor(vendor.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 px-2"
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Vendor Form Modal */}
      {showVendorForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VendorForm
            vendor={editingVendor}
            onSubmit={handleSubmitVendor}
            onCancel={handleCancelVendorForm}
            loading={isSubmittingVendor}
          />
        </div>
      )}
    </>
  );
}