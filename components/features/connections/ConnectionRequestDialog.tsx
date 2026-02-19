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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
            className="bg-white/80 hover:bg-white/60 text-gray-700 rounded-full"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending}
            className="bg-brand-primary hover:bg-brand-primary-hover text-white rounded-full"
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}