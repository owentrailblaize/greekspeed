const EMAIL_REGEX =
  /([A-Z0-9._%+-]+)@([A-Z0-9.-]+\.[A-Z]{2,})/gi;
const PHONE_REGEX =
  /\+?1?[-.\s(]*\d{3}[-.\s)]*\d{3}[-.\s]*\d{4}\b/g;

type LogLevel = "error" | "warn" | "info" | "debug";

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const MAX_DEPTH = 3;
const MAX_ARRAY_LENGTH = 20;

const DEFAULT_LEVEL: LogLevel =
  process.env.NODE_ENV === "production" ? "info" : "debug";

function resolveLogLevel(): LogLevel {
  const configured = process.env.NEXT_PUBLIC_LOG_LEVEL ?? process.env.LOG_LEVEL;
  if (!configured) return DEFAULT_LEVEL;
  const normalized = configured.toLowerCase() as LogLevel;
  return normalized in LEVEL_PRIORITY ? normalized : DEFAULT_LEVEL;
}

const activeLevel = resolveLogLevel();

function shouldLog(level: LogLevel) {
  return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[activeLevel];
}

function maskString(value: string) {
  return value
    .replace(EMAIL_REGEX, "[EMAIL REDACTED]")
    .replace(PHONE_REGEX, "[PHONE REDACTED]");
}

function sanitize<T>(payload: T, depth = 0, seen = new WeakSet<object>()): T {
    if (payload == null) return payload;
  
    if (typeof payload === "string") {
      return maskString(payload) as T;
    }
  
    if (typeof payload !== "object") {
      return payload;
    }
  
    if (seen.has(payload as object)) {
      return "[Circular]" as unknown as T;
    }
  
    if (depth >= MAX_DEPTH) {
      return "[Truncated]" as unknown as T;
    }
  
    seen.add(payload as object);
  
    if (Array.isArray(payload)) {
      const sanitized = payload.slice(0, MAX_ARRAY_LENGTH).map((item) =>
        sanitize(item, depth + 1, seen),
      );
  
      if (payload.length > MAX_ARRAY_LENGTH) {
        sanitized.push(`[...${payload.length - MAX_ARRAY_LENGTH} more items]`);
      }
  
      return sanitized as unknown as T;
    }
  
    if (payload instanceof Error) {
      return {
        name: payload.name,
        message: maskString(payload.message),
        stack: payload.stack,
      } as unknown as T;
    }
  
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(payload as Record<string, unknown>)) {
      result[key] = sanitize(value, depth + 1, seen);
    }
  
    return result as unknown as T;
}

type LogContext = Record<string, unknown>;

function emit(level: LogLevel, message: string, context?: LogContext) {
  if (!shouldLog(level)) return;

  const payload = sanitize({
    level,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    message,
    context,
  });

  const serialized = JSON.stringify(payload);

  switch (level) {
    case "error":
      logger.error(serialized);
      break;
    case "warn":
      logger.warn(serialized);
      break;
    case "info":
      logger.info(serialized);
      break;
    case "debug":
    default:
      if (process.env.NODE_ENV !== "production") {
        logger.debug(serialized);
      }
      break;
  }
}

export const logger = {
  error(message: string, context?: LogContext) {
    emit("error", message, context);
  },
  warn(message: string, context?: LogContext) {
    emit("warn", message, context);
  },
  info(message: string, context?: LogContext) {
    emit("info", message, context);
  },
  debug(message: string, context?: LogContext) {
    emit("debug", message, context);
  },
};