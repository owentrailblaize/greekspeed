'use client';

import { EmojiPicker as FrimousseEmojiPicker } from "frimousse";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { useState, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  disabled?: boolean;
  buttonClassName?: string;
  iconClassName?: string;
  label?: ReactNode;
  labelClassName?: string;
}

export function EmojiPicker({
  onEmojiSelect,
  disabled = false,
  buttonClassName,
  iconClassName,
  label,
  labelClassName,
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className={cn(
            "inline-flex items-center justify-center gap-0 text-gray-400 hover:text-navy-600 hover:bg-navy-50 p-2 h-10 w-10",
            label ? "w-auto px-4" : "",
            buttonClassName,
          )}
        >
          <Smile className={cn("h-5 w-5", iconClassName)} />
          {label ? (
            <span className={cn("ml-2 text-sm font-medium text-gray-500", labelClassName)}>
              {label}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-fit p-0 border border-gray-200 shadow-lg"
        align="start"
        side="top"
      >
        <FrimousseEmojiPicker.Root 
          className="isolate flex h-[368px] w-fit flex-col bg-white"
          onEmojiSelect={({ emoji }) => handleEmojiSelect(emoji)}
        >
          <FrimousseEmojiPicker.Search className="z-10 mx-2 mt-2 appearance-none rounded-md bg-gray-100 px-2.5 py-2 text-sm border border-gray-200 focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-transparent" />
          <FrimousseEmojiPicker.Viewport className="relative flex-1 outline-hidden">
            <FrimousseEmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              Loading…
            </FrimousseEmojiPicker.Loading>
            <FrimousseEmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
              No emoji found.
            </FrimousseEmojiPicker.Empty>
            <FrimousseEmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-white px-3 pt-3 pb-1.5 font-medium text-gray-600 text-xs border-b border-gray-100"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-1.5 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg hover:bg-navy-50 data-[active]:bg-navy-100 transition-colors"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </FrimousseEmojiPicker.Viewport>
        </FrimousseEmojiPicker.Root>
      </PopoverContent>
    </Popover>
  );
}
