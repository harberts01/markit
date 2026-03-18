"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ConnectionState = "connected" | "connecting" | "disconnected";

interface SocketContextType {
  /** The underlying Socket.io socket instance, or null before first connect. */
  socket: Socket | null;
  /** Current connection lifecycle state. */
  connectionState: ConnectionState;
  /**
   * Join a market-scoped socket room to receive live inventory and status
   * events for that market. Safe to call multiple times — deduped server-side.
   */
  joinMarketRoom: (marketId: string) => void;
  /**
   * Leave a market-scoped socket room. Call on unmount or when navigating
   * away from a market context.
   */
  leaveMarketRoom: (marketId: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SocketContext = createContext<SocketContextType | null>(null);

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") ||
  "http://localhost:3001";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SocketProvider({ children }: { children: ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");

  useEffect(() => {
    /**
     * We defer socket creation to an effect so that:
     * 1. It only runs on the client (no SSR socket attempt).
     * 2. The access token is available — auth state has been restored before
     *    the socket handshake fires.
     */
    const socket = io(SOCKET_URL, {
      // Pass the current JWT in the handshake so the server can authenticate
      // the socket connection without a separate auth event.
      auth: { token: getAccessToken() },
      // Use WebSocket transport first, fall back to polling. This matches
      // the expected behaviour on mobile networks.
      transports: ["websocket", "polling"],
      // Do not auto-connect on construction — we connect explicitly below.
      autoConnect: false,
    });

    socketRef.current = socket;

    // -----------------------------------------------------------------------
    // Lifecycle handlers
    // -----------------------------------------------------------------------

    const handleConnect = () => setConnectionState("connected");

    const handleDisconnect = () => setConnectionState("disconnected");

    const handleConnectError = () => {
      // Keep state as "disconnected" rather than a separate error state;
      // socket.io will attempt reconnection automatically.
      setConnectionState("disconnected");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    setConnectionState("connecting");
    socket.connect();

    // -----------------------------------------------------------------------
    // Visibility-based reconnection
    //
    // Mobile browsers may suspend WebSocket connections when the tab is
    // backgrounded. Re-connect when the page becomes visible again so
    // real-time inventory events resume immediately (UX Risk 4).
    // -----------------------------------------------------------------------

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !socket.connected) {
        setConnectionState("connecting");
        socket.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Room helpers
  // ---------------------------------------------------------------------------

  const joinMarketRoom = useCallback((marketId: string) => {
    socketRef.current?.emit("room:join", { marketId });
  }, []);

  const leaveMarketRoom = useCallback((marketId: string) => {
    socketRef.current?.emit("room:leave", { marketId });
  }, []);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        connectionState,
        joinMarketRoom,
        leaveMarketRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns the socket context. Must be used within a <SocketProvider>.
 *
 * @example
 * const { socket, connectionState, joinMarketRoom } = useSocket();
 *
 * useEffect(() => {
 *   joinMarketRoom(marketId);
 *   socket?.on("inventory:update", handler);
 *   return () => { leaveMarketRoom(marketId); socket?.off("inventory:update", handler); };
 * }, [socket, marketId]);
 */
export function useSocket(): SocketContextType {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
