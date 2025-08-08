"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string, label: string) => void;
  isSelected?: boolean;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, children, onSelect, isSelected, ...props }, ref) => {
    const handleClick = () => {
      // Convert children to string for the label
      const label = typeof children === 'string' ? children : React.Children.toArray(children).join('');
      onSelect?.(value, label);
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        className={cn(
          "flex cursor-pointer items-center justify-between px-3 py-2 text-sm",
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
    const selectRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      setSelectedValue(value || "");
    }, [value]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (value: string, label: string) => {
      setSelectedValue(value);
      setSelectedLabel(label);
      onValueChange?.(value);
      setIsOpen(false);
    };

    return (
      <div ref={selectRef} className={cn("relative", className)} {...props}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm",
            "focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500",
            "hover:border-gray-400 transition-colors"
          )}
        >
          <span className={selectedValue ? "text-gray-900" : "text-gray-500"}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child) && child.type && (child.type as any).displayName === "SelectItem") {
                const childProps = child.props as SelectItemProps;
                return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
                  onSelect: handleSelect,
                  isSelected: childProps.value === selectedValue,
                });
              }
              return child;
            })}
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = "Select";

// Legacy components for compatibility
export const SelectTrigger = Select;
export const SelectValue = () => null;
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;