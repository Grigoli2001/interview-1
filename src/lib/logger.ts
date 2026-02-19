/**
 * Shared logger for API (server) and client (browser).
 * Log level and enable/disable controlled via NEXT_PUBLIC_LOG_LEVEL env.
 *
 * Env: NEXT_PUBLIC_LOG_LEVEL = debug | info | warn | error | none
 * - none: logging disabled
 * - debug: all levels
 * - info: info, warn, error
 * - warn: warn, error
 * - error: error only
 */

const LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof LOG_LEVELS)[number];

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

function getEffectiveLevel(): LogLevel | "none" {
  const raw = process.env.NEXT_PUBLIC_LOG_LEVEL;
  const value = (raw ?? "info").toLowerCase().trim();
  if (value === "none" || value === "off" || value === "disabled") {
    return "none";
  }
  return LOG_LEVELS.includes(value as LogLevel) ? (value as LogLevel) : "info";
}

function formatTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace("T", " ").slice(0, 23);
}

function shouldLog(level: LogLevel): boolean {
  const effective = getEffectiveLevel();
  if (effective === "none") return false;
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[effective];
}

function formatMessage(level: LogLevel, message: string, data?: unknown): string {
  const ts = formatTimestamp();
  const prefix = `[${level.toUpperCase()}] ${ts}`;
  if (data === undefined) return `${prefix} - ${message}`;
  try {
    const dataStr =
      typeof data === "object" && data !== null
        ? JSON.stringify(data).slice(0, 500)
        : String(data);
    return `${prefix} - ${message} ${dataStr}`;
  } catch {
    return `${prefix} - ${message} [unserializable]`;
  }
}

function log(level: LogLevel, message: string, data?: unknown): void {
  if (!shouldLog(level)) return;
  const formatted = formatMessage(level, message, data);
  switch (level) {
    case "debug":
      console.debug(formatted);
      break;
    case "info":
      console.info(formatted);
      break;
    case "warn":
      console.warn(formatted);
      break;
    case "error":
      console.error(formatted);
      break;
  }
}

export const logger = {
  debug: (message: string, data?: unknown) => log("debug", message, data),
  info: (message: string, data?: unknown) => log("info", message, data),
  warn: (message: string, data?: unknown) => log("warn", message, data),
  error: (message: string, data?: unknown) => log("error", message, data),
};
