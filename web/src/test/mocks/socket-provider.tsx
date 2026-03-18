/**
 * Module-level mock for @/lib/providers/socket-provider.
 *
 * Import this in tests that use hooks which call useSocket().
 * Use vi.mock('@/lib/providers/socket-provider', ...) together with
 * the makeSocketProviderMock factory below.
 *
 * @example
 * import { makeSocketProviderMock } from '@/test/mocks/socket-provider';
 * import { createMockSocket } from '@/test/mocks/socket';
 *
 * const mockSocket = createMockSocket();
 * vi.mock('@/lib/providers/socket-provider', () =>
 *   makeSocketProviderMock(mockSocket)
 * );
 */

import React from "react";
import type { MockSocket } from "./socket";

export function makeSocketProviderMock(mockSocket?: MockSocket) {
  const socket = mockSocket ?? null;

  return {
    useSocket: vi.fn(() => ({
      socket,
      connectionState: "connected" as const,
      joinMarketRoom: vi.fn(),
      leaveMarketRoom: vi.fn(),
    })),
    SocketProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
  };
}
