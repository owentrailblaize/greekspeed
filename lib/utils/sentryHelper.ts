import * as Sentry from '@sentry/nextjs';
import { NextRequest } from 'next/server';

interface ErrorContext {
  endpoint: string;
  method: string;
  userId?: string;
  chapterId?: string;
  additionalData?: Record<string, any>;
}

export function captureApiError(
  error: Error | unknown,
  request: NextRequest,
  context: ErrorContext
) {
  Sentry.captureException(error, {
    tags: {
      endpoint: context.endpoint,
      method: context.method,
      environment: process.env.NEXT_PUBLIC_ENV || 'production',
    },
    contexts: {
      request: {
        url: request.url,
        method: request.method,
      },
      user: context.userId ? {
        id: context.userId,
      } : undefined,
      custom: {
        chapterId: context.chapterId,
        ...context.additionalData,
      },
    },
    level: 'error',
  });
}