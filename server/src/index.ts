import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.routes.js";
import marketRoutes from "./routes/market.routes.js";
import userRoutes from "./routes/user.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import vendorRoutes from "./routes/vendor.routes.js";
import postRoutes from "./routes/post.routes.js";
import sponsorRoutes from "./routes/sponsor.routes.js";
import shoppingListRoutes from "./routes/shopping-list.routes.js";
import marketManagerRoutes from "./routes/market-manager.routes.js";
import qrRoutes from "./routes/qr.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authConfig } from "./config/auth.js";
import { initIO } from "./config/socket.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

// Static uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Apply rate limiters before routes
app.use("/api/v1/auth", authLimiter);
app.use("/api/v1", apiLimiter);

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/markets", marketRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/vendors", vendorRoutes);
app.use("/api/v1/posts", postRoutes);
app.use("/api/v1/sponsors", sponsorRoutes);
app.use("/api/v1/shopping-lists", shoppingListRoutes);
app.use("/api/v1/manager", marketManagerRoutes);
app.use("/api/v1/qr", qrRoutes);
app.use("/api/v1/reservations", reservationRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler (must be last)
app.use(errorHandler);

// HTTP server + Socket.io
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: process.env.CORS_ORIGIN || "http://localhost:3000", credentials: true },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(); // allow unauthenticated connections
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret);
    (socket as any).user = payload;
    next();
  } catch {
    next(); // invalid token — allow as unauthenticated
  }
});

const SOCKET_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

io.on("connection", (socket) => {
  socket.on("join:market", (marketId: unknown) => {
    if (typeof marketId !== "string" || !SOCKET_UUID_RE.test(marketId)) return;
    socket.join(`market:${marketId}`);
  });
  socket.on("leave:market", (marketId: unknown) => {
    if (typeof marketId !== "string" || !SOCKET_UUID_RE.test(marketId)) return;
    socket.leave(`market:${marketId}`);
  });
});

initIO(io);

httpServer.listen(PORT, () => {
  console.log(`MarkIt API running on http://localhost:${PORT}`);
});

export default app;
