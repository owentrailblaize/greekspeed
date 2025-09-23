"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RoleOption {
  value: string;
  label: string;
  disabled?: boolean;
  description?: string;
}

export interface RoleSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: RoleOption[];
  className?: string;
  disabled?: boolean;
}

export const RoleSelect = React.forwardRef<HTMLDivElement, RoleSelectProps>(
  ({ value, onValueChange, placeholder, options, className, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || "");
    const [selectedLabel, setSelectedLabel] = React.useState<string>("");
    const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
    const selectRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    const selectedOption = options.find(option => option.value === value);
    
    React.useEffect(() => {
      setSelectedValue(value || "");
      if (selectedOption) {
        setSelectedLabel(selectedOption.label);
      } else {
        setSelectedLabel("");
      }
    }, [value, selectedOption]);

    // Update dropdown position when scrolling or resizing
    const updateDropdownPosition = React.useCallback(() => {
      if (isOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
    }, [isOpen]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as Node;
        const isClickInSelect = selectRef.current?.contains(target);
        const isClickInDropdown = dropdownRef.current?.contains(target);
        
        if (!isClickInSelect && !isClickInDropdown) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Add scroll and resize listeners to update dropdown position
    React.useEffect(() => {
      if (isOpen) {
        // Update position immediately
        updateDropdownPosition();
        
        // Add listeners for scroll and resize
        window.addEventListener('scroll', updateDropdownPosition, true);
        window.addEventListener('resize', updateDropdownPosition);
        
        return () => {
          window.removeEventListener('scroll', updateDropdownPosition, true);
          window.removeEventListener('resize', updateDropdownPosition);
        };
      }
    }, [isOpen, updateDropdownPosition]);

    const handleSelect = (option: RoleOption) => {
      if (option.disabled) return;
      
      setSelectedValue(option.value);
      setSelectedLabel(option.label);
      onValueChange?.(option.value);
      setIsOpen(false);
    };

    const handleToggle = () => {
      if (disabled) return;
      
      if (!isOpen && selectRef.current) {
        const rect = selectRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        });
      }
      
      setIsOpen(!isOpen);
    };

    return (
      <>
        <div ref={selectRef} className={cn("relative", className)} {...props}>
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled}
            className={cn(
              "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
              "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
              "hover:border-gray-400 transition-colors",
              disabled && "opacity-50 cursor-not-allowed hover:border-gray-300"
            )}
          >
            <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
              {selectedLabel || placeholder}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
          </button>
        </div>

        {isOpen && typeof window !== 'undefined' && createPortal(
          <div 
            ref={dropdownRef}
            className="absolute z-[99999] max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
            style={{
              top: dropdownPosition.top + 8,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              minWidth: '200px'
            }}
          >
            {options.map((option) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={cn(
                  "flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
                  "hover:bg-gray-50 transition-colors",
                  option.value === selectedValue && "bg-navy-50 text-navy-900",
                  option.disabled && "opacity-50 cursor-not-allowed hover:bg-white"
                )}
              >
                <div className="flex items-center space-x-2">
                  {option.disabled && <Lock className="h-3 w-3 text-gray-400" />}
                  <span className={cn(option.disabled && "text-gray-400")}>
                    {option.label}
                  </span>
                </div>
                {option.value === selectedValue && !option.disabled && (
                  <Check className="h-4 w-4 text-navy-600" />
                )}
              </div>
            ))}
          </div>,
          document.body
        )}
      </>
    );
  }
);
RoleSelect.displayName = "RoleSelect";
