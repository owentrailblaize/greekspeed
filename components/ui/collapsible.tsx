import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  open?: boolean;
  children: React.ReactNode;
  className?: string;
}

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
}

const CollapsibleContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const Collapsible = React.forwardRef<HTMLDivElement, CollapsibleProps>(
  ({ open = false, children, className, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(open);

    React.useEffect(() => {
      setIsOpen(open);
    }, [open]);

    return (
      <CollapsibleContext.Provider value={{ isOpen, setIsOpen }}>
        <div ref={ref} className={cn("w-full", className)} {...props}>
          {children}
        </div>
      </CollapsibleContext.Provider>
    );
  }
);

Collapsible.displayName = "Collapsible";

export const CollapsibleTrigger = React.forwardRef<HTMLButtonElement, CollapsibleTriggerProps>(
  ({ children, className, onClick, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) {
      throw new Error("CollapsibleTrigger must be used within a Collapsible");
    }

    const handleClick = () => {
      context.setIsOpen(!context.isOpen);
      onClick?.();
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn("w-full", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

CollapsibleTrigger.displayName = "CollapsibleTrigger";

export const CollapsibleContent = React.forwardRef<HTMLDivElement, CollapsibleContentProps>(
  ({ children, className, ...props }, ref) => {
    const context = React.useContext(CollapsibleContext);
    if (!context) {
      throw new Error("CollapsibleContent must be used within a Collapsible");
    }

    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden transition-all duration-200 ease-in-out",
          context.isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CollapsibleContent.displayName = "CollapsibleContent"; 