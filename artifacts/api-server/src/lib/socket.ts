import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { logger } from "./logger";

let io: SocketIOServer | null = null;

export function initSocket(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PATCH"],
    },
    path: "/socket.io",
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket client connected");
    socket.on("disconnect", (reason) => {
      logger.info({ socketId: socket.id, reason }, "Socket client disconnected");
    });
  });

  logger.info("Socket.IO initialized");
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.IO not initialized");
  return io;
}

export function emitOrderCreated(order: Record<string, unknown>): void {
  if (!io) return;
  io.emit("order:created", order);
}

export function emitOrderUpdated(order: Record<string, unknown>): void {
  if (!io) return;
  io.emit("order:updated", order);
}
