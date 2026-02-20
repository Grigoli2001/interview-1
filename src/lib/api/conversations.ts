import { api } from "@/lib/api";

export type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type Message = {
  id: string;
  role: string;
  content: string;
  createdAt: string;
};

export type ConversationWithMessages = {
  conversation: {
    id: string;
    title: string | null;
    createdAt: string;
    updatedAt: string;
  };
  messages: Message[];
};

export type ListConversationsResponse = {
  conversations: ConversationSummary[];
};

export async function listConversations(
  limit = 20,
): Promise<ListConversationsResponse> {
  const { data } = await api.get<ListConversationsResponse>(
    "/api/chat/conversations",
    { params: { limit } },
  );
  return data;
}

export async function getConversation(
  id: string,
): Promise<ConversationWithMessages> {
  const { data } = await api.get<ConversationWithMessages>(
    `/api/chat/conversations/${id}`,
  );
  return data;
}
