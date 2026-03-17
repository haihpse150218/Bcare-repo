"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { apiWithMeta } from "@/lib/api";
import { connectChat, onChatEvent, sendChatMessage, sendTyping } from "@/lib/chat-socket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversation: any;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<any>(null);

  useEffect(() => {
    loadMessages();
    if (token) connectChat(token);

    const unsub1 = onChatEvent("message", (data: any) => {
      if (data.data?.conversationId === conversation.id) {
        setMessages((prev) => [...prev, data.data]);
      }
    });

    const unsub2 = onChatEvent("typing", (data: any) => {
      if (data.conversationId === conversation.id && data.senderId !== user?.id) {
        setIsTyping(true);
        clearTimeout(typingTimeout.current);
        typingTimeout.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    return () => { unsub1(); unsub2(); };
  }, [conversation.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadMessages() {
    setLoading(true);
    try {
      const result = await apiWithMeta<any[]>(`/api/conversations/${conversation.id}/messages?limit=100`, { token: token! });
      setMessages(result.data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  function handleSend() {
    if (!input.trim()) return;
    sendChatMessage(conversation.id, input.trim());
    setInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else {
      sendTyping(conversation.id);
    }
  }

  const otherName = user?.role === "PATIENT"
    ? conversation.doctor?.user?.fullName || "Bác sĩ"
    : conversation.patient?.fullName || "Bệnh nhân";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <p className="font-semibold">{otherName}</p>
        {user?.role === "PATIENT" && conversation.doctor?.specialty && (
          <p className="text-xs text-muted-foreground">{conversation.doctor.specialty.name}</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">Bắt đầu cuộc trò chuyện</p>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                  isMine ? "bg-primary text-white" : "bg-gray-100 text-gray-900"
                )}>
                  {msg.type === "IMAGE" && msg.fileUrl && (
                    <img src={msg.fileUrl} alt="" className="rounded-lg max-w-full mb-1" />
                  )}
                  {msg.type === "FILE" && msg.fileUrl && (
                    <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                      {msg.fileName || "File"}
                    </a>
                  )}
                  {msg.content && <p>{msg.content}</p>}
                  <p className={cn("text-[10px] mt-1", isMine ? "text-white/70" : "text-muted-foreground")}>
                    {new Date(msg.createdAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2 text-sm text-muted-foreground">
              đang nhập...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập tin nhắn..."
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={!input.trim()}>Gửi</Button>
        </div>
      </div>
    </div>
  );
}
