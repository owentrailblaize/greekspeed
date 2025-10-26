import { useState } from 'react';
import { InfoPopup } from './InfoPopup';

interface ClickableFieldProps {
  value: string;
  entityType: 'company' | 'industry' | 'chapter';
  className?: string;
  preventPropagation?: boolean;
  textAlign?: 'left' | 'center' | 'right'; // Add text alignment prop
}

export function ClickableField({ 
  value, 
  entityType, 
  className = '', 
  preventPropagation = true,
  textAlign = 'left' // Default to left for backward compatibility
}: ClickableFieldProps) {
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (preventPropagation) {
      e.stopPropagation();
    }
    setIsPopupOpen(true);
  };

  // Determine text alignment class
  const getTextAlignClass = () => {
    switch (textAlign) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={`underline decoration-dotted underline-offset-2 hover:decoration-solid hover:text-blue-600 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 bg-transparent border-none p-0 m-0 ${getTextAlignClass()} ${className}`}
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
