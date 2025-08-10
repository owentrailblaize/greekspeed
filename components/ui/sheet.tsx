import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface SheetContentProps {
  children: React.ReactNode;
  className?: string;
  side?: "left" | "right" | "top" | "bottom";
}

interface SheetHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SheetTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SheetContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const Sheet = React.forwardRef<HTMLDivElement, SheetProps>(
  ({ open = false, onOpenChange, children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    const handleOpenChange = (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    };

    return (
      <SheetContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </SheetContext.Provider>
    );
  }
);

Sheet.displayName = "Sheet";

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ children, className, side = "right", ...props }, ref) => {
    const context = React.useContext(SheetContext);
    if (!context) {
      throw new Error("SheetContent must be used within a Sheet");
    }

    const sideClasses = {
      left: "left-0 top-0 h-full border-r",
      right: "right-0 top-0 h-full border-l",
      top: "top-0 left-0 w-full border-b",
      bottom: "bottom-0 left-0 w-full border-t",
    };

    if (!context.isOpen) return null;

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 z-[9998]"
          onClick={() => context.setIsOpen(false)}
        />
        
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            "fixed z-[9999] bg-white shadow-lg",
            sideClasses[side],
            className
          )}
          {...props}
        >
          {children}
        </div>
      </>
    );
  }
);

SheetContent.displayName = "SheetContent";

export const SheetHeader = React.forwardRef<HTMLDivElement, SheetHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex flex-col space-y-2 text-center sm:text-left", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SheetHeader.displayName = "SheetHeader";

export const SheetTitle = React.forwardRef<HTMLHeadingElement, SheetTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h2
        ref={ref}
        className={cn("text-lg font-semibold text-gray-900", className)}
        {...props}
      >
        {children}
      </h2>
    );
  }
);

SheetTitle.displayName = "SheetTitle"; 