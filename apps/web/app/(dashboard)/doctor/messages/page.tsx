"use client";

import { useState } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { ChatWindow } from "@/components/chat/chat-window";

export default function DoctorMessagesPage() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Tin nhắn</h1>
      <div className="flex border rounded-lg overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
        <div className="w-80 border-r overflow-y-auto bg-white">
          <ConversationList selectedId={selected?.id} onSelect={setSelected} />
        </div>
        <div className="flex-1 bg-white">
          {selected ? (
            <ChatWindow conversation={selected} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              Chọn cuộc trò chuyện
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
