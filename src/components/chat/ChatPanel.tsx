import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings } from "@/contexts/AppSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useChatPanel } from "@/contexts/ChatPanelContext";

export function ChatPanel() {
  const { language } = useAppSettings();
  const {
    open, setOpen, messages, setMessages,
    hasUnread, conversationId, setConversationId, resetConversation,
  } = useChatPanel();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = (pt: string, en: string) => (language === "en" ? en : pt);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantId = crypto.randomUUID();
    setMessages((m) => [
      ...m,
      userMsg,
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dify-chat-proxy`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          query: text,
          conversation_id: conversationId || undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        setMessages((m) =>
          m.map((msg) =>
            msg.id === assistantId
              ? { ...msg, content: t("Erro: ", "Error: ") + (errText || res.statusText) }
              : msg,
          ),
        );
        setSending(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const l = line.trim();
          if (!l.startsWith("data:")) continue;
          const payload = l.slice(5).trim();
          if (!payload || payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            if (evt.conversation_id && evt.conversation_id !== conversationId) {
              setConversationId(evt.conversation_id);
            }
            if (evt.event === "message" || evt.event === "agent_message") {
              if (typeof evt.answer === "string") {
                acc += evt.answer;
                setMessages((m) =>
                  m.map((msg) =>
                    msg.id === assistantId ? { ...msg, content: acc } : msg,
                  ),
                );
              }
            } else if (evt.event === "error") {
              acc += `\n[${evt.message || "error"}]`;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === assistantId ? { ...msg, content: acc } : msg,
                ),
              );
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (e) {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: t("Erro de rede.", "Network error.") }
            : msg,
        ),
      );
    } finally {
      setSending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          aria-label={t("Abrir chat com IA", "Open AI chat")}
          className="fixed bottom-20 right-5 md:bottom-5 md:right-5 z-40 h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <MessageCircle className="w-6 h-6" strokeWidth={1.8} />
          {hasUnread && (
            <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-red-500 border-2 border-background" />
          )}
        </Button>
      )}

      <div
        className={cn(
          "fixed z-50 bg-card border border-border shadow-2xl transition-transform",
          "right-0 top-0 h-full w-full sm:w-[400px] flex flex-col",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        )}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" strokeWidth={1.8} />
            </div>
            <div>
              <div className="text-sm font-semibold text-tx1">
                {t("Assistente IA", "AI Assistant")}
              </div>
              <button
                onClick={resetConversation}
                className="text-[11px] text-tx3 hover:text-tx1"
              >
                {t("Nova conversa", "New conversation")}
              </button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setOpen(false)}
            aria-label={t("Fechar", "Close")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-tx3 text-sm mt-8">
              {t(
                "Pergunte sobre agenda, vendas, clientes ou relatórios.",
                "Ask about schedule, sales, clients or reports.",
              )}
            </div>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : m.role === "system"
                    ? "bg-amber-500/10 border border-amber-500/30 text-tx1"
                    : "bg-muted text-tx1",
                )}
              >
                {m.content || (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-border p-3 flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t("Digite sua mensagem…", "Type your message…")}
            rows={1}
            className="min-h-[40px] max-h-32 resize-none text-sm"
          />
          <Button
            onClick={send}
            disabled={sending || !input.trim()}
            size="icon"
            aria-label={t("Enviar", "Send")}
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </>
  );
}