import * as React from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

export type DivSelectProps = React.HTMLAttributes<HTMLDivElement> & {
  value?: string;
  onValueChange?: (v: string) => void;
};

export const Select = React.forwardRef<HTMLDivElement, DivSelectProps>(
  ({ className, children, value: _value, onValueChange: _onValueChange, ...rest }, ref) => (
    <div
      ref={ref}
      className={cn(
        "h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
);
Select.displayName = "Select";

// Trigger and Value are no-ops to retain API compatibility without rendering nested selects
export const SelectTrigger = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectValue: React.FC<{ placeholder?: string }> = () => null;

export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  )
);
SelectContent.displayName = "SelectContent";

export const SelectItem: React.FC<{ value: string; children: React.ReactNode }> = ({ value, children }) => (
  <option value={value}>{children}</option>
); 