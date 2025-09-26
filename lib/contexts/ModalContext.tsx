'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ModalContextType {
  isEditProfileModalOpen: boolean;
  openEditProfileModal: () => void;
  closeEditProfileModal: () => void;
  toggleEditProfileModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  // Load modal state from sessionStorage on mount
  useEffect(() => {
    const savedModalState = sessionStorage.getItem('greekspeed-edit-profile-modal-open');
    if (savedModalState === 'true') {
      setIsEditProfileModalOpen(true);
    }
  }, []);

  // Save modal state to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('greekspeed-edit-profile-modal-open', isEditProfileModalOpen.toString());
  }, [isEditProfileModalOpen]);

  const openEditProfileModal = () => {
    setIsEditProfileModalOpen(true);
  };

  const closeEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
    // Clear the saved state when explicitly closed
    sessionStorage.removeItem('greekspeed-edit-profile-modal-open');
  };

  const toggleEditProfileModal = () => {
    setIsEditProfileModalOpen(prev => {
      const newState = !prev;
      if (!newState) {
        // Clear the saved state when explicitly closed
        sessionStorage.removeItem('greekspeed-edit-profile-modal-open');
      }
      return newState;
    });
  };

  return (
    <ModalContext.Provider 
      value={{ 
        isEditProfileModalOpen, 
        openEditProfileModal, 
        closeEditProfileModal,
        toggleEditProfileModal 
      }}
    >
      {children}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
}
