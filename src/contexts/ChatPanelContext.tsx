import { createContext, useCallback, useContext, useMemo, useRef, useState, ReactNode, useEffect } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatPanelContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  pushSystemMessage: (content: string) => void;
  hasUnread: boolean;
  markRead: () => void;
  conversationId: string;
  setConversationId: (v: string) => void;
  resetConversation: () => void;
}

const CONV_KEY = "aura_dify_conversation_id";

const ChatPanelContext = createContext<ChatPanelContextValue | null>(null);

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [conversationId, setConversationIdState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(CONV_KEY) || "";
  });

  const setConversationId = useCallback((v: string) => {
    setConversationIdState(v);
    if (typeof window !== "undefined") {
      if (v) localStorage.setItem(CONV_KEY, v);
      else localStorage.removeItem(CONV_KEY);
    }
  }, []);

  const setOpen = useCallback((v: boolean) => {
    setOpenState(v);
    if (v) setHasUnread(false);
  }, []);

  const markRead = useCallback(() => setHasUnread(false), []);

  const pushSystemMessage = useCallback((content: string) => {
    setMessages((m) => [
      ...m,
      { id: crypto.randomUUID(), role: "system", content },
    ]);
    setHasUnread((prev) => (open ? false : true));
  }, [open]);

  const resetConversation = useCallback(() => {
    setConversationId("");
    setMessages([]);
  }, [setConversationId]);

  const value = useMemo<ChatPanelContextValue>(() => ({
    open, setOpen, messages, setMessages, pushSystemMessage,
    hasUnread, markRead, conversationId, setConversationId, resetConversation,
  }), [open, setOpen, messages, pushSystemMessage, hasUnread, markRead, conversationId, setConversationId, resetConversation]);

  return (
    <ChatPanelContext.Provider value={value}>{children}</ChatPanelContext.Provider>
  );
}

export function useChatPanel() {
  const ctx = useContext(ChatPanelContext);
  if (!ctx) throw new Error("useChatPanel must be used inside ChatPanelProvider");
  return ctx;
}