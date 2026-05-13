import { io, Socket } from "socket.io-client";
import type { Order } from "@workspace/api-client-react";

const BASE = import.meta.env.BASE_URL ?? "/";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      path: "/socket.io",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
    });
  }
  return socket;
}

export type SocketOrder = Order;

export type SocketEvents = {
  "order:created": (order: SocketOrder) => void;
  "order:updated": (order: SocketOrder) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (err: Error) => void;
};

export { type Socket };
