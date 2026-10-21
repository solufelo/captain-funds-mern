import { Server } from "socket.io";
import { env } from "../config/env.js";
import { userFromToken } from "../middleware/auth.js";

let io;

/**
 * Socket.IO is server-push only. Clients can join public campaign rooms;
 * personal and admin rooms are joined automatically from a verified token
 * (handshake `auth.token`), never on the client's say-so. Clients cannot
 * broadcast events to other users.
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: { origin: env.clientUrls, methods: ["GET", "POST"] },
  });

  io.use(async (socket, next) => {
    try {
      socket.data.user = await userFromToken(socket.handshake.auth?.token);
    } catch {
      socket.data.user = null;
    }
    next();
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    if (user) {
      socket.join(`user-${user._id}`);
      if (user.isAdmin) socket.join("admin-room");
    }

    socket.on("join-campaign", (campaignId) => {
      if (typeof campaignId === "string" && /^[a-f0-9]{24}$/i.test(campaignId)) {
        socket.join(`campaign-${campaignId}`);
      }
    });

    socket.on("leave-campaign", (campaignId) => {
      if (typeof campaignId === "string") socket.leave(`campaign-${campaignId}`);
    });
  });

  return io;
};

export const emitToUser = (userId, event, data) => {
  if (io) io.to(`user-${userId}`).emit(event, data);
};

export const emitToCampaign = (campaignId, event, data) => {
  if (io) io.to(`campaign-${campaignId}`).emit(event, data);
};

export const emitToAdmins = (event, data) => {
  if (io) io.to("admin-room").emit(event, data);
};

export const broadcastToAll = (event, data) => {
  if (io) io.emit(event, data);
};

export const getIO = () => io;
