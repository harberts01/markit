import "@testing-library/jest-dom";
import { server } from "./server";
import { beforeAll, afterAll, afterEach, vi } from "vitest";

// ---------------------------------------------------------------------------
// MSW lifecycle
// ---------------------------------------------------------------------------

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ---------------------------------------------------------------------------
// Next.js navigation mocks (applied globally so every test file gets them)
// ---------------------------------------------------------------------------

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
  useParams: () => ({ slug: "test-market" }),
  usePathname: () => "/market/test-market",
  useSearchParams: () => new URLSearchParams(),
}));

// ---------------------------------------------------------------------------
// html5-qrcode mock — prevents jsdom from choking on camera APIs
// ---------------------------------------------------------------------------

vi.mock("html5-qrcode", () => ({
  Html5Qrcode: vi.fn().mockImplementation(() => ({
    start: vi.fn().mockResolvedValue(undefined),
    stop: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
  })),
}));

// ---------------------------------------------------------------------------
// react-leaflet mock — Leaflet requires a real DOM with canvas support
// ---------------------------------------------------------------------------

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => (
    // @ts-expect-error JSX in setup file
    <div data-testid="map-container">{children}</div>
  ),
  ImageOverlay: () => <div data-testid="image-overlay" />,
  Marker: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="marker">{children}</div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="popup">{children}</div>
  ),
  useMap: () => ({
    setView: vi.fn(),
    fitBounds: vi.fn(),
    getZoom: vi.fn().mockReturnValue(0),
  }),
  useMapEvents: vi.fn(),
}));

// ---------------------------------------------------------------------------
// leaflet mock — avoids L.divIcon / L.icon browser-only constructors
// ---------------------------------------------------------------------------

vi.mock("leaflet", () => ({
  default: {
    divIcon: vi.fn(() => ({ options: {} })),
    icon: vi.fn(() => ({ options: {} })),
    CRS: { Simple: "Simple" },
  },
  divIcon: vi.fn(() => ({ options: {} })),
  icon: vi.fn(() => ({ options: {} })),
  CRS: { Simple: "Simple" },
}));

// ---------------------------------------------------------------------------
// socket.io-client mock — tests use the mock socket from test/mocks/socket.ts
// ---------------------------------------------------------------------------

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: true,
  })),
}));
