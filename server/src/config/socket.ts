import type { Server } from "socket.io";

let io: Server | null = null;

export function initIO(server: Server): void {
  io = server;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
