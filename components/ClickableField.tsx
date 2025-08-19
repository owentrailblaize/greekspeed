import { useState } from 'react';
import { InfoPopup } from './InfoPopup';

interface ClickableFieldProps {
  value: string;
  entityType: 'company' | 'industry' | 'chapter';
  className?: string;
  preventPropagation?: boolean;
}

export function ClickableField({ 
  value, 
  entityType, 
  className = '', 
  preventPropagation = true 
}: ClickableFieldProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (preventPropagation) {
      e.stopPropagation();
    }
    setIsPopupOpen(true);
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`underline decoration-dotted underline-offset-2 hover:decoration-solid hover:text-blue-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 text-left bg-transparent border-none p-0 m-0 ${className}`}
        style={{ textAlign: 'left' }}
      >
        {value}
      </button>
      
      <InfoPopup
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        entityType={entityType}
        entityId={value}
        entityName={value}
      />
    </>
  );
}
