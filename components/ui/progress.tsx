import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className={cn("h-2 w-full rounded bg-gray-200", className)}
        {...props}
      >
        <div
          className="h-full rounded bg-navy-600"
          style={{ width: `${value}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress"; 