"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import {
  listConversations,
  getConversation,
  type ConversationSummary,
  type ConversationWithMessages,
} from "@/lib/api/conversations";

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: () => [...conversationKeys.all, "list"] as const,
  list: (limit?: number) =>
    [...conversationKeys.lists(), limit] as const,
  details: () => [...conversationKeys.all, "detail"] as const,
  detail: (id: string) => [...conversationKeys.details(), id] as const,
};

export function useConversations(
  limit = 20,
  options?: Omit<
    UseQueryOptions<{ conversations: ConversationSummary[] }>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: conversationKeys.list(limit),
    queryFn: () => listConversations(limit),
    ...options,
  });
}

export function useConversation(
  id: string | null,
  options?: Omit<
    UseQueryOptions<ConversationWithMessages>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: conversationKeys.detail(id ?? ""),
    queryFn: () => getConversation(id!),
    enabled: !!id,
    ...options,
  });
}

export function useInvalidateConversations() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: conversationKeys.all });
}
