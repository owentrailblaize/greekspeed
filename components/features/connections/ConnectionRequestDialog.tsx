'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Drawer } from 'vaul';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useIsMobile } from '@/lib/hooks/useIsMobile';
import { X } from 'lucide-react';

interface ConnectionRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (message?: string) => Promise<void>;
  recipientName?: string;
  isLoading?: boolean;
}

export function ConnectionRequestDialog({
  isOpen,
  onClose,
  onSend,
  recipientName,
  isLoading = false,
}: ConnectionRequestDialogProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const isMobile = useIsMobile();

  const handleSend = async () => {
    setIsSending(true);
    try {
      const trimmedMessage = message.trim() || undefined;
      await onSend(trimmedMessage);
      setMessage('');
      onClose();
    } catch (error) {
      console.error('Failed to send connection request:', error);
      // Keep dialog open on error so user can retry
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage('');
      onClose();
    }
  };

  // Shared message input content
  const messageInput = (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label htmlFor="message" className="text-sm font-medium">
          Message
        </Label>
        <Textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Hi! I'd love to connect and learn more about your experience..."
          className="min-h-[100px] resize-y"
          maxLength={200}
          disabled={isSending}
        />
        <p className="text-xs text-gray-500">
          {message.length}/200 characters
        </p>
      </div>
    </div>
  );

  // Shared buttons
  const buttons = (
    <div className={`flex gap-3 ${isMobile ? 'flex-row' : 'flex-row justify-end'}`}>
      <Button
        variant="outline"
        onClick={handleClose}
        disabled={isSending}
        className={`${isMobile ? 'flex-1' : ''} bg-white/80 hover:bg-white/60 text-gray-700 rounded-full`}
      >
        Cancel
      </Button>
      <Button
        onClick={handleSend}
        disabled={isSending}
        className={`${isMobile ? 'flex-1' : ''} bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full`}
      >
        {isSending ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b border-white mr-2" />
            Sending...
          </>
        ) : (
          'Send Request'
        )}
      </Button>
    </div>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <Drawer.Root
        open={isOpen}
        onOpenChange={(open) => !open && handleClose()}
        direction="bottom"
        modal={true}
        dismissible={true}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[10002] bg-black/40 transition-opacity" />
          <Drawer.Content
            className="
              bg-white flex flex-col rounded-t-[10px] z-[10003]
              fixed bottom-0 left-0 right-0
              max-h-[70vh] min-h-[40vh]
              shadow-2xl border border-gray-200
              outline-none p-0
            "
          >
            {/* Mobile drag handle */}
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 mt-3 mb-4" />

            {/* Header */}
            <div className="flex-shrink-0 border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Send Connection Request
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {recipientName
                      ? `Add a message to introduce yourself to ${recipientName} (optional)`
                      : 'Add a message to introduce yourself (optional)'}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="ml-4 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  disabled={isSending}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {messageInput}
              {buttons}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Send Connection Request</DialogTitle>
          <DialogDescription>
            {recipientName
              ? `Add a message to introduce yourself to ${recipientName} (optional)`
              : 'Add a message to introduce yourself (optional)'}
          </DialogDescription>
        </DialogHeader>
        {messageInput}
        <DialogFooter>
          {buttons}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}