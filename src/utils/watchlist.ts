import { PriceHistoryPoint, TrackedGame } from '../types/cheapshark';

const STORAGE_KEY = 'gametime_watchlist_v1';

export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWatchlist(): TrackedGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is TrackedGame =>
        Boolean(item) &&
        typeof item.gameID === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.history)
    );
  } catch {
    return [];
  }
}

function saveWatchlist(list: TrackedGame[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors safely
  }
}

export function isGameTracked(gameID: string): boolean {
  return getWatchlist().some((item) => item.gameID === gameID);
}

export interface TrackGamePayload {
  gameID: string;
  title: string;
  thumb: string;
  steamAppID: string | null;
  currentLowestPrice: number;
  steamPrice: number | null;
  cheapestEverPrice: number | null;
}

export function toggleTrackGame(payload: TrackGamePayload): {
  tracked: boolean;
  watchlist: TrackedGame[];
} {
  const list = getWatchlist();
  const existingIndex = list.findIndex((item) => item.gameID === payload.gameID);

  if (existingIndex >= 0) {
    const updated = list.filter((item) => item.gameID !== payload.gameID);
    saveWatchlist(updated);
    return { tracked: false, watchlist: updated };
  }

  const today = getTodayIsoDate();
  const newEntry: TrackedGame = {
    gameID: payload.gameID,
    title: payload.title,
    thumb: payload.thumb,
    steamAppID: payload.steamAppID,
    currentLowestPrice: payload.currentLowestPrice,
    steamPrice: payload.steamPrice,
    cheapestEverPrice: payload.cheapestEverPrice,
    addedAt: today,
    lastUpdated: today,
    history: [
      {
        date: today,
        price: Number(payload.currentLowestPrice.toFixed(2)),
      },
    ],
  };

  const updated = [newEntry, ...list];
  saveWatchlist(updated);
  return { tracked: true, watchlist: updated };
}

export function recordTrackedPriceVisit(
  gameID: string,
  currentLowestPrice: number,
  meta?: Partial<Omit<TrackGamePayload, 'gameID' | 'currentLowestPrice'>>
): TrackedGame | null {
  const list = getWatchlist();
  const idx = list.findIndex((item) => item.gameID === gameID);
  if (idx === -1) return null;

  const today = getTodayIsoDate();
  const existing = list[idx];
  const roundedPrice = Number(currentLowestPrice.toFixed(2));

  const nextHistory: PriceHistoryPoint[] = [...existing.history];
  const todayIdx = nextHistory.findIndex((p) => p.date === today);

  if (todayIdx >= 0) {
    nextHistory[todayIdx] = { date: today, price: roundedPrice };
  } else {
    nextHistory.push({ date: today, price: roundedPrice });
  }

  nextHistory.sort((a, b) => a.date.localeCompare(b.date));

  const updatedItem: TrackedGame = {
    ...existing,
    title: meta?.title ?? existing.title,
    thumb: meta?.thumb ?? existing.thumb,
    steamAppID: meta?.steamAppID !== undefined ? meta.steamAppID : existing.steamAppID,
    steamPrice: meta?.steamPrice !== undefined ? meta.steamPrice : existing.steamPrice,
    cheapestEverPrice:
      meta?.cheapestEverPrice !== undefined ? meta.cheapestEverPrice : existing.cheapestEverPrice,
    currentLowestPrice: roundedPrice,
    lastUpdated: today,
    history: nextHistory,
  };

  const nextList = [...list];
  nextList[idx] = updatedItem;
  saveWatchlist(nextList);
  return updatedItem;
}

export function removeTrackedGame(gameID: string): TrackedGame[] {
  const updated = getWatchlist().filter((item) => item.gameID !== gameID);
  saveWatchlist(updated);
  return updated;
}
