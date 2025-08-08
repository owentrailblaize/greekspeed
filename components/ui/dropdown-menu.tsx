import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuProps {
  children: React.ReactNode;
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "start" | "center" | "end";
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
} | null>(null);

export const DropdownMenu = React.forwardRef<HTMLDivElement, DropdownMenuProps>(
  ({ children, ...props }, ref) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    return (
      <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
        <div ref={(node) => {
          // Handle both refs
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          dropdownRef.current = node;
        }} className="relative" {...props}>
          {children}
        </div>
      </DropdownMenuContext.Provider>
    );
  }
);

DropdownMenu.displayName = "DropdownMenu";

export const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ children, asChild = false, className, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) {
      throw new Error("DropdownMenuTrigger must be used within a DropdownMenu");
    }

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      context.setIsOpen(!context.isOpen);
    };

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        onClick: handleClick,
        ref,
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        className={cn("inline-flex items-center justify-center", className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

DropdownMenuTrigger.displayName = "DropdownMenuTrigger";

export const DropdownMenuContent = React.forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ children, className, align = "center", ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) {
      throw new Error("DropdownMenuContent must be used within a DropdownMenu");
    }

    const alignClasses = {
      start: "left-0",
      center: "left-1/2 -translate-x-1/2",
      end: "right-0",
    };

    if (!context.isOpen) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "absolute top-full mt-1 z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white shadow-lg",
          alignClasses[align],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<HTMLDivElement, DropdownMenuItemProps>(
  ({ children, className, onClick, disabled = false, ...props }, ref) => {
    const context = React.useContext(DropdownMenuContext);
    if (!context) {
      throw new Error("DropdownMenuItem must be used within a DropdownMenu");
    }

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
      if (!disabled) {
        onClick?.();
        context.setIsOpen(false);
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
          "hover:bg-gray-100 focus:bg-gray-100",
          disabled && "pointer-events-none opacity-50",
          className
        )}
        onClick={handleClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

DropdownMenuItem.displayName = "DropdownMenuItem"; 