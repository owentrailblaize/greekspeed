'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface ModalContextType {
  isEditProfileModalOpen: boolean;
  openEditProfileModal: () => void;
  closeEditProfileModal: () => void;
  toggleEditProfileModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);

  const openEditProfileModal = () => {
    setIsEditProfileModalOpen(true);
  };

  const closeEditProfileModal = () => {
    setIsEditProfileModalOpen(false);
  };

  const toggleEditProfileModal = () => {
    setIsEditProfileModalOpen(prev => !prev);
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
