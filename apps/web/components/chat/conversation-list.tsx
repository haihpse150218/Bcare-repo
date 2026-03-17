"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ConversationListProps {
  selectedId?: string;
  onSelect: (conv: any) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { token, user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadConversations(); }, []);

  async function loadConversations() {
    try {
      const data = await api<any[]>("/api/conversations", { token: token! });
      setConversations(data);
    } catch { /* empty */ } finally { setLoading(false); }
  }

  function getOtherName(conv: any) {
    if (user?.role === "PATIENT") return conv.doctor?.user?.fullName || "Bác sĩ";
    return conv.patient?.fullName || "Bệnh nhân";
  }

  function getLastMessage(conv: any) {
    if (!conv.messages?.length) return "Chưa có tin nhắn";
    const msg = conv.messages[0];
    if (msg.type === "IMAGE") return "Đã gửi hình ảnh";
    if (msg.type === "FILE") return "Đã gửi file";
    return msg.content?.slice(0, 50) || "";
  }

  if (loading) return <div className="space-y-2 p-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}</div>;

  if (conversations.length === 0) return <p className="p-4 text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào</p>;

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv)}
          className={cn(
            "w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors",
            selectedId === conv.id && "bg-primary-50"
          )}
        >
          <Avatar>
            <AvatarFallback>{getOtherName(conv).charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{getOtherName(conv)}</p>
            <p className="text-xs text-muted-foreground truncate">{getLastMessage(conv)}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
