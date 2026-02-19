"use client";

import { cn } from "@/lib/utils";

const STRENGTH_LEVELS = [
  { label: "Weak", color: "bg-destructive" },
  { label: "Fair", color: "bg-orange-500" },
  { label: "Good", color: "bg-yellow-500" },
  { label: "Strong", color: "bg-green-500" },
] as const;

function getPasswordStrength(password: string): {
  score: number;
  checks: { label: string; met: boolean }[];
} {
  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const score = Math.min(checks.filter((c) => c.met).length, 4);
  return { score, checks };
}

type PasswordStrengthIndicatorProps = {
  password: string;
  showHints?: boolean;
  className?: string;
};

export function PasswordStrengthIndicator({
  password,
  showHints = true,
  className,
}: PasswordStrengthIndicatorProps) {
  if (!password) {
    return null;
  }

  const { score, checks } = getPasswordStrength(password);

  return (
    <div className={cn("space-y-2", className)} role="status" aria-live="polite">
      <div className="flex gap-1">
        {STRENGTH_LEVELS.map((level, index) => (
          <div
            key={level.label}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              index < score ? level.color : "bg-muted"
            )}
            aria-hidden
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {score > 0 ? STRENGTH_LEVELS[score - 1].label : "Enter a password"}
      </p>
      {showHints && (
        <ul className="space-y-1 text-xs text-muted-foreground">
          {checks.map((check) => (
            <li
              key={check.label}
              className={cn(
                "flex items-center gap-2",
                check.met && "text-green-600 dark:text-green-500"
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  check.met ? "bg-green-500" : "bg-muted"
                )}
              />
              {check.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
