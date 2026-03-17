import { FastifyInstance } from "fastify";
import { WebSocket } from "ws";
import { chatService } from "./chat.service";

// In-memory connection map: userId -> Set<WebSocket>
const connections = new Map<string, Set<WebSocket>>();

function addConnection(userId: string, ws: WebSocket) {
  if (!connections.has(userId)) connections.set(userId, new Set());
  connections.get(userId)!.add(ws);
}

function removeConnection(userId: string, ws: WebSocket) {
  const userConns = connections.get(userId);
  if (userConns) {
    userConns.delete(ws);
    if (userConns.size === 0) connections.delete(userId);
  }
}

function sendToUser(userId: string, data: any) {
  const userConns = connections.get(userId);
  if (!userConns) return;
  const msg = JSON.stringify(data);
  for (const ws of userConns) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

export function isUserOnline(userId: string): boolean {
  return connections.has(userId);
}

export function broadcastToConversation(patientId: string, doctorUserId: string, data: any, excludeUserId?: string) {
  if (patientId !== excludeUserId) sendToUser(patientId, data);
  if (doctorUserId !== excludeUserId) sendToUser(doctorUserId, data);
}

export async function registerChatWebSocket(app: FastifyInstance) {
  app.get("/ws/chat", { websocket: true }, (socket, request) => {
    const token = (request.query as any).token;
    if (!token) {
      socket.close(4001, "Missing token");
      return;
    }

    let userId: string;
    let userRole: string;

    try {
      const decoded = app.jwt.verify<{ id: string; role: string }>(token);
      userId = decoded.id;
      userRole = decoded.role;
    } catch {
      socket.close(4002, "Invalid token");
      return;
    }

    addConnection(userId, socket);

    // Notify online status
    // (In production, broadcast to relevant conversations only)

    socket.on("message", async (raw: Buffer) => {
      try {
        const data = JSON.parse(raw.toString());

        if (data.type === "message") {
          const { conversationId, content, messageType = "TEXT", fileUrl, fileName, fileSize } = data;

          const result = await chatService.sendMessage(userId, userRole, conversationId, {
            content,
            type: messageType,
            fileUrl,
            fileName,
            fileSize,
          });

          const messageData = {
            type: "message",
            data: result.message,
          };

          // Determine other participant's userId
          const conv = result.conversation;
          const otherUserId = conv.patientId === userId
            ? await getDoctorUserId(conv.doctorId)
            : conv.patientId;

          // Send to both participants
          sendToUser(userId, messageData);
          if (otherUserId) sendToUser(otherUserId, messageData);
        }

        if (data.type === "typing") {
          const { conversationId } = data;
          // Find other participant and forward
          const conv = await getChatConversation(conversationId);
          if (!conv) return;

          const otherUserId = conv.patientId === userId
            ? await getDoctorUserId(conv.doctorId)
            : conv.patientId;

          if (otherUserId) {
            sendToUser(otherUserId, {
              type: "typing",
              conversationId,
              senderId: userId,
            });
          }
        }

        if (data.type === "video_call") {
          const { conversationId, action } = data;
          const conv = await getChatConversation(conversationId);
          if (!conv) return;

          const otherUserId = conv.patientId === userId
            ? await getDoctorUserId(conv.doctorId)
            : conv.patientId;

          if (otherUserId) {
            sendToUser(otherUserId, {
              type: "video_call",
              action,
              conversationId,
              callerId: userId,
            });
          }
        }
      } catch {
        // Silently ignore malformed messages
      }
    });

    socket.on("close", () => {
      removeConnection(userId, socket);
    });
  });
}

// Helpers
import { prisma } from "../../lib/prisma";

async function getDoctorUserId(doctorId: string): Promise<string | null> {
  const doctor = await prisma.doctor.findUnique({ where: { id: doctorId }, select: { userId: true } });
  return doctor?.userId || null;
}

async function getChatConversation(conversationId: string) {
  return prisma.conversation.findUnique({ where: { id: conversationId } });
}
