import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Checkbox({ className, checked, onCheckedChange, ...props }: CheckboxProps) {
  return (
    <div className="relative">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="sr-only"
        {...props}
      />
      <div
        className={cn(
          "h-4 w-4 rounded border border-gray-300 transition-colors",
          checked
            ? "bg-navy-600 border-navy-600"
            : "bg-white hover:border-navy-400",
          className
        )}
      >
        {checked && (
          <Check className="h-3 w-3 text-white absolute top-0.5 left-0.5" />
        )}
      </div>
    </div>
  );
} 