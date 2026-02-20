"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * Renders children only on the client to avoid hydration mismatches
 * from components that generate non-deterministic IDs (e.g. Radix UI).
 */
export function ClientOnly({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isClient = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  if (!isClient) return <>{fallback}</>;
  return <>{children}</>;
}
