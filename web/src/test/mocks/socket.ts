/**
 * Synchronous mock Socket.io socket for use in unit and integration tests.
 *
 * Call `mockSocket.simulateEvent(eventName, payload)` to synchronously trigger
 * any registered `on()` handler, enabling deterministic testing of
 * socket-driven cache updates without a real WebSocket connection.
 */

type EventHandler = (...args: unknown[]) => void;

export function createMockSocket() {
  const handlers: Map<string, EventHandler[]> = new Map();
  let _connected = true;

  const socket = {
    get connected() {
      return _connected;
    },

    on(event: string, handler: EventHandler) {
      const list = handlers.get(event) ?? [];
      list.push(handler);
      handlers.set(event, list);
      return socket;
    },

    off(event: string, handler: EventHandler) {
      const list = handlers.get(event) ?? [];
      handlers.set(
        event,
        list.filter((h) => h !== handler)
      );
      return socket;
    },

    emit: vi.fn(),
    connect: vi.fn(() => { _connected = true; }),
    disconnect: vi.fn(() => { _connected = false; }),

    /** Test helper — fire all registered handlers for an event synchronously. */
    simulateEvent(event: string, payload: unknown) {
      const list = handlers.get(event) ?? [];
      list.forEach((h) => h(payload));
    },

    /** Test helper — reset all registered handlers. */
    reset() {
      handlers.clear();
    },
  };

  return socket;
}

export type MockSocket = ReturnType<typeof createMockSocket>;
