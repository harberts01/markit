/**
 * renderWithProviders — wraps a component tree with all the providers
 * required by Phase 4 components: QueryClient, SocketContext, and
 * MarketContext.
 *
 * Usage:
 *   renderWithProviders(<MyComponent />, { socketOverride: mockSocket })
 */

import React, { type ReactNode } from "react";
import { render, renderHook, type RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMockSocket, type MockSocket } from "./mocks/socket";

// ---------------------------------------------------------------------------
// Re-export for convenience
// ---------------------------------------------------------------------------

export { createMockSocket };
export type { MockSocket };

// ---------------------------------------------------------------------------
// Socket context mock
// ---------------------------------------------------------------------------

// We re-export a mock of the socket context so tests can inject a controlled
// MockSocket without spinning up a real Socket.io connection.
const MockSocketContext = React.createContext<{
  socket: MockSocket | null;
  connectionState: "connected" | "connecting" | "disconnected";
  joinMarketRoom: (id: string) => void;
  leaveMarketRoom: (id: string) => void;
} | null>(null);

export function MockSocketProvider({
  children,
  socket,
}: {
  children: ReactNode;
  socket?: MockSocket;
}) {
  const mockSocket = socket ?? createMockSocket();

  return (
    <MockSocketContext.Provider
      value={{
        socket: mockSocket,
        connectionState: "connected",
        joinMarketRoom: vi.fn(),
        leaveMarketRoom: vi.fn(),
      }}
    >
      {children}
    </MockSocketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Market context mock
// ---------------------------------------------------------------------------

const MockMarketContext = React.createContext<{
  currentMarket: null;
  setCurrentMarket: ReturnType<typeof vi.fn>;
  clearMarket: ReturnType<typeof vi.fn>;
} | null>(null);

export function MockMarketProvider({ children }: { children: ReactNode }) {
  return (
    <MockMarketContext.Provider
      value={{
        currentMarket: null,
        setCurrentMarket: vi.fn(),
        clearMarket: vi.fn(),
      }}
    >
      {children}
    </MockMarketContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Query client factory
// ---------------------------------------------------------------------------

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Disable retries so tests fail fast on API errors instead of retrying
        retry: false,
        // Disable stale-time so data is always considered stale — prevents
        // flaky tests caused by cached data from previous test cases.
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Wrapper interfaces
// ---------------------------------------------------------------------------

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  queryClient?: QueryClient;
  socket?: MockSocket;
}

// ---------------------------------------------------------------------------
// renderWithProviders
// ---------------------------------------------------------------------------

/**
 * Renders a component wrapped with all providers needed for Phase 4 features.
 *
 * Providers included:
 *  - QueryClientProvider (fresh client per test unless overridden)
 *  - MockSocketProvider (controlled mock socket)
 *  - MockMarketProvider (stub market context)
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    queryClient = createTestQueryClient(),
    socket,
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MockSocketProvider socket={socket}>
          <MockMarketProvider>{children}</MockMarketProvider>
        </MockSocketProvider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...renderOptions }), queryClient };
}

// ---------------------------------------------------------------------------
// createWrapper — for renderHook
// ---------------------------------------------------------------------------

/**
 * Returns a wrapper component factory for use with `renderHook`.
 *
 * @example
 * const { result } = renderHook(() => usePosts(), { wrapper: createWrapper() });
 */
export function createWrapper(options: { socket?: MockSocket; queryClient?: QueryClient } = {}) {
  const queryClient = options.queryClient ?? createTestQueryClient();
  const socket = options.socket;

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MockSocketProvider socket={socket}>
          <MockMarketProvider>{children}</MockMarketProvider>
        </MockSocketProvider>
      </QueryClientProvider>
    );
  };
}

// ---------------------------------------------------------------------------
// renderHookWithProviders
// ---------------------------------------------------------------------------

export function renderHookWithProviders<T>(
  hook: () => T,
  options: { socket?: MockSocket; queryClient?: QueryClient } = {}
) {
  return renderHook(hook, { wrapper: createWrapper(options) });
}
