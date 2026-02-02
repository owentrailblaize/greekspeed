import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  indeterminate?: boolean;
}

export function Checkbox({ className, checked, onCheckedChange, indeterminate, ...props }: CheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate || false;
    }
  }, [indeterminate]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 rounded border border-gray-300 transition-colors cursor-pointer select-none",
          checked || indeterminate
            ? "bg-navy-600 border-navy-600"
            : "bg-white hover:border-navy-400",
          className
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCheckedChange?.(!checked);
        }}
        onMouseDown={(e) => e.preventDefault()}
      >
        {checked && (
          <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
        )}
        {indeterminate && !checked && (
          <div className="h-0.5 w-2 bg-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
        )}
      </div>
    </div>
  );
} 