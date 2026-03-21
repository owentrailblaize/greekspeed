'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface CheckInScannerProps {
  eventId: string;
  chapterId: string;
  onSuccess: (qrPayload: string) => void;
  onCancel: () => void;
  onError?: (message: string) => void;
}

function parseChapterCheckInPayload(raw: string): { c: string } | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (typeof o !== 'object' || o === null) return null;
    const rec = o as Record<string, unknown>;
    const c = rec.c;
    if (typeof c !== 'string' || !c) return null;
    return { c };
  } catch {
    return null;
  }
}

export function CheckInScanner({
  eventId,
  chapterId,
  onSuccess,
  onCancel,
  onError,
}: CheckInScannerProps) {
  const containerId = useRef(`check-in-scanner-${eventId}`).current;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  const [status, setStatus] = useState<'starting' | 'scanning' | 'error'>('starting');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    // Delay start so container has layout (fixes iOS Safari black screen)
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          const parsed = parseChapterCheckInPayload(decodedText);
          if (!parsed) {
            onErrorRef.current?.('Invalid QR code. Please scan the chapter check-in code.');
            return;
          }
          if (parsed.c !== chapterId) {
            onErrorRef.current?.('This code is for a different chapter. Please scan the code displayed at this event.');
            return;
          }
          scanner
            .stop()
            .then(() => {
              scannerRef.current = null;
              onSuccessRef.current(decodedText);
            })
            .catch(() => {
              scannerRef.current = null;
              onSuccessRef.current(decodedText);
            });
        },
        () => {}
      )
      .then(() => {
        setStatus('scanning');
      })
      .catch((err: Error) => {
        setStatus('error');
        const msg =
          err.name === 'NotAllowedError'
            ? 'Camera access was denied. Use the link below to check in on the web.'
            : err.message || 'Failed to start camera.';
        setErrorMessage(msg);
        onErrorRef.current?.(msg);
      });
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
      scannerRef.current = null;
    };
  }, [containerId, chapterId]);

  return (
    <div className="fixed inset-0 z-[10001] flex flex-col bg-black">
      <div className="flex-shrink-0 flex items-center justify-between p-4 bg-black/80 text-white">
        <h2 className="text-lg font-semibold">Scan to check in</h2>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 text-white hover:bg-white/20"
          onClick={() => {
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().catch(() => {});
            }
            scannerRef.current = null;
            onCancel();
          }}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-0">
        {status === 'starting' && (
          <p className="text-white/80 mb-4 flex-shrink-0">Starting camera...</p>
        )}
        {status === 'error' && (
          <div className="text-center max-w-sm">
            <p className="text-red-400 mb-4">{errorMessage}</p>
            <a
              href={`/check-in?event=${encodeURIComponent(eventId)}`}
              className="text-brand-primary underline"
            >
              Check in on web
            </a>
          </div>
        )}
        {(status === 'starting' || status === 'scanning') && (
          <div
            id={containerId}
            className="w-full max-w-sm min-h-[300px] max-h-[400px] flex-1 min-w-0 check-in-scanner-container"
          />
        )}
      </div>
    </div>
  );
}
