"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

interface Market {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  address: string | null;
}

interface MarketContextType {
  currentMarket: Market | null;
  setCurrentMarket: (market: Market) => void;
  clearMarket: () => void;
}

const MarketContext = createContext<MarketContextType | null>(null);

const STORAGE_KEY = "markit_selected_market";

export function MarketProvider({ children }: { children: ReactNode }) {
  const [currentMarket, setCurrentMarketState] = useState<Market | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setCurrentMarketState(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setCurrentMarket = useCallback((market: Market) => {
    setCurrentMarketState(market);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(market));
  }, []);

  const clearMarket = useCallback(() => {
    setCurrentMarketState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <MarketContext.Provider
      value={{ currentMarket, setCurrentMarket, clearMarket }}
    >
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const context = useContext(MarketContext);
  if (!context) {
    throw new Error("useMarket must be used within a MarketProvider");
  }
  return context;
}
