const WS_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001").replace("http", "ws");

type MessageHandler = (data: any) => void;

let socket: WebSocket | null = null;
let handlers: Map<string, Set<MessageHandler>> = new Map();

export function connectChat(token: string): WebSocket {
  if (socket && socket.readyState === WebSocket.OPEN) return socket;

  socket = new WebSocket(`${WS_URL}/ws/chat?token=${token}`);

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      const typeHandlers = handlers.get(data.type);
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(data));
      }
    } catch { /* ignore */ }
  };

  socket.onclose = () => {
    socket = null;
    // Auto-reconnect after 3 seconds
    setTimeout(() => {
      if (token) connectChat(token);
    }, 3000);
  };

  return socket;
}

export function disconnectChat() {
  if (socket) {
    socket.close();
    socket = null;
  }
}

export function onChatEvent(type: string, handler: MessageHandler) {
  if (!handlers.has(type)) handlers.set(type, new Set());
  handlers.get(type)!.add(handler);
  return () => { handlers.get(type)?.delete(handler); };
}

export function sendChatMessage(conversationId: string, content: string, messageType = "TEXT", fileUrl?: string, fileName?: string, fileSize?: number) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "message", conversationId, content, messageType, fileUrl, fileName, fileSize }));
  }
}

export function sendTyping(conversationId: string) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "typing", conversationId }));
  }
}

export function sendVideoCallSignal(conversationId: string, action: "incoming" | "accepted" | "rejected" | "ended") {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "video_call", conversationId, action }));
  }
}
