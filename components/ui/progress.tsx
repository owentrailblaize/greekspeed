import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    // Cap value at 100% to prevent overflow
    const clampedValue = Math.min(Math.max(value, 0), 100);
    
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2 w-full rounded bg-gray-200 overflow-hidden", className)}
        {...props}
      >
        <div
          className="h-full rounded bg-navy-600 transition-all duration-300"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress"; 