"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import "./favorites.css";

export type FavoriteItem = {
  id: string;
  type: "state" | "city" | "history";
  label: string;
  subtitle: string;
  href: string;
};

type FavoritesContextValue = {
  items: FavoriteItem[];
  isFavorite: (id: string) => boolean;
  toggle: (item: FavoriteItem) => void;
  openDrawer: () => void;
};

const STORAGE_KEY = "travel-in-america:favorites:v1";
const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function readSavedFavorites(): FavoriteItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.label && item?.href) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setItems(readSavedFavorites());
      setHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  useEffect(() => {
    if (!drawerOpen) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [drawerOpen]);

  const isFavorite = useCallback((id: string) => items.some((item) => item.id === id), [items]);
  const toggle = useCallback((item: FavoriteItem) => {
    setItems((current) => current.some((favorite) => favorite.id === item.id)
      ? current.filter((favorite) => favorite.id !== item.id)
      : [...current, item]);
  }, []);
  const value = useMemo(() => ({ items, isFavorite, toggle, openDrawer: () => setDrawerOpen(true) }), [items, isFavorite, toggle]);

  return <FavoritesContext.Provider value={value}>
    {children}
    {drawerOpen && <div className="favorites-layer" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) setDrawerOpen(false);
    }}>
      <aside className="favorites-drawer" role="dialog" aria-modal="true" aria-labelledby="favorites-title">
        <button className="favorites-close" type="button" onClick={() => setDrawerOpen(false)} aria-label="Close favorites">×</button>
        <p className="favorites-eyebrow">YOUR AMERICAN SHORTLIST</p>
        <h2 id="favorites-title">Places worth remembering.</h2>
        <p className="favorites-note">Saved only on this device.</p>
        {items.length ? <div className="favorites-list">
          {items.map((item) => <article className="favorite-row" key={item.id}>
            <span className="favorite-kind">{item.type}</span>
            <div><strong>{item.label}</strong><small>{item.subtitle}</small></div>
            <a href={item.href} target="_blank" rel="noreferrer">Open ↗</a>
            <button type="button" onClick={() => toggle(item)} aria-label={`Remove ${item.label} from favorites`}>Remove</button>
          </article>)}
        </div> : <div className="favorites-empty"><span>♡</span><p>Favorite a state, city, or historic place and it will appear here.</p></div>}
      </aside>
    </div>}
  </FavoritesContext.Provider>;
}

function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("Favorites components must be used inside FavoritesProvider");
  return context;
}

export function FavoritesTrigger({ compact = false }: { compact?: boolean }) {
  const { items, openDrawer } = useFavorites();
  return <button className={`favorites-trigger${compact ? " compact" : ""}`} type="button" onClick={openDrawer}>
    <span aria-hidden="true">♥</span> Favorites <b>{items.length}</b>
  </button>;
}

export function FavoriteButton({ item, className = "", showLabel = true }: { item: FavoriteItem; className?: string; showLabel?: boolean }) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(item.id);
  return <button
    className={`favorite-button${active ? " active" : ""}${className ? ` ${className}` : ""}`}
    type="button"
    aria-pressed={active}
    aria-label={`${active ? "Remove" : "Add"} ${item.label} ${active ? "from" : "to"} favorites`}
    onClick={() => toggle(item)}
  >
    <span aria-hidden="true">{active ? "♥" : "♡"}</span>{showLabel && (active ? " Saved" : " Save")}
  </button>;
}
