"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ value, onValueChange, placeholder, children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [selectedValue, setSelectedValue] = React.useState(value || "");
    const [selectedLabel, setSelectedLabel] = React.useState<string>("");
    const [mounted, setMounted] = React.useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      setMounted(true);
    }, []);
    
    React.useEffect(() => {
      setSelectedValue(value || "");
      // Find the label for the current value
      if (value) {
        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            if ((child as React.ReactElement<SelectItemProps>).props.value === value) {
              setSelectedLabel((child as React.ReactElement<SelectItemProps>).props.children as string);
            }
          }
        });
      } else {
        setSelectedLabel("");
      }
    }, [value, children]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsOpen(false);
          }
        }
      };

      if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
      }
    }, [isOpen]);

    // Update dropdown position when open
    React.useEffect(() => {
      if (isOpen && selectRef.current && dropdownRef.current) {
        const updatePosition = () => {
          if (selectRef.current && dropdownRef.current) {
            const rect = selectRef.current.getBoundingClientRect();
            
            dropdownRef.current.style.top = `${rect.bottom + 4}px`;
            dropdownRef.current.style.left = `${rect.left}px`;
            dropdownRef.current.style.width = `${rect.width}px`;
            dropdownRef.current.style.minWidth = `${rect.width}px`;
          }
        };
        
        // Initial position
        updatePosition();
        
        // Update on scroll/resize
        window.addEventListener('scroll', updatePosition, true);
        window.addEventListener('resize', updatePosition);
        
        return () => {
          window.removeEventListener('scroll', updatePosition, true);
          window.removeEventListener('resize', updatePosition);
        };
      }
    }, [isOpen]);

    const handleSelect = (value: string, label: string) => {
      setSelectedValue(value);
      setSelectedLabel(label);
      onValueChange?.(value);
      setIsOpen(false);
    };

    return (
      <>
        <div ref={selectRef} className={cn("relative", className)} {...props}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-base",
              "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
              "hover:border-gray-400 transition-colors"
            )}
          >
            <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
              {selectedLabel || placeholder}
            </span>
            <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
          </button>
        </div>

        {mounted && isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-xl"
            style={{
              position: 'fixed',
            }}
          >
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type === SelectItem) {
                return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
                  onSelect: handleSelect,
                  isSelected: (child as React.ReactElement<SelectItemProps>).props.value === selectedValue,
                });
              }
              return child;
            })}
          </div>,
          document.body
        )}
      </>
    );
  }
);
Select.displayName = "Select";

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string, label: string) => void;
  isSelected?: boolean;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, onSelect, isSelected, ...props }, ref) => {
    const handleClick = () => {
      onSelect?.(value, children as string);
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer items-center justify-between px-3 py-2 text-base",
          "hover:bg-gray-50 transition-colors",
          isSelected && "bg-navy-50 text-navy-900"
        )}
        {...props}
      >
        <span>{children}</span>
        {isSelected && <Check className="h-4 w-4 text-navy-600" />}
      </div>
    );
  }
);
SelectItem.displayName = "SelectItem";

// Legacy components for compatibility
export const SelectTrigger = Select;
export const SelectValue = () => null;
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>; 