import {
  DealItem,
  DealLookupResponse,
  GameDetailsResponse,
  GameSearchItem,
  SortOption,
  Store,
} from '../types/cheapshark';

const API_BASE = 'https://www.cheapshark.com/api/1.0';
const CHEAPSHARK_ORIGIN = 'https://www.cheapshark.com';

let storesCache: Store[] | null = null;
let storesPromise: Promise<Store[]> | null = null;

async function safeFetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  const onExternalAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) {
      clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = (await response.json()) as T;
    return data;
  } finally {
    clearTimeout(timeoutId);
    if (signal) {
      signal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export async function fetchStores(): Promise<Store[]> {
  if (storesCache) {
    return storesCache;
  }
  if (storesPromise) {
    return storesPromise;
  }

  storesPromise = (async () => {
    try {
      const raw = await safeFetchJson<Store[]>(`${API_BASE}/stores`);
      const active = (Array.isArray(raw) ? raw : [])
        .filter((s) => s && s.isActive === 1)
        .map((s) => ({
          ...s,
          images: {
            banner: s.images?.banner ? `${CHEAPSHARK_ORIGIN}${s.images.banner}` : '',
            logo: s.images?.logo ? `${CHEAPSHARK_ORIGIN}${s.images.logo}` : '',
            icon: s.images?.icon ? `${CHEAPSHARK_ORIGIN}${s.images.icon}` : '',
          },
        }));
      storesCache = active;
      return active;
    } catch (error) {
      storesPromise = null;
      throw error;
    }
  })();

  return storesPromise;
}

export interface FetchDealsParams {
  storeID?: string;
  sortBy?: SortOption;
  pageNumber?: number;
  pageSize?: number;
  minDiscount?: number;
  onSale?: boolean;
  signal?: AbortSignal;
}

const POPULAR_STEAM_APP_IDS = [
  '3240220', // Grand Theft Auto V Enhanced
  '1174180', // Red Dead Redemption 2
  '1091500', // Cyberpunk 2077
  '1245620', // ELDEN RING
  '2358720', // Black Myth: Wukong
  '1086940', // Baldur's Gate 3
  '292030',  // The Witcher 3: Wild Hunt
  '990080',  // Hogwarts Legacy
  '1593500', // God of War
  '1817070', // Marvel's Spider-Man Remastered
  '2651280', // Marvel's Spider-Man 2
  '2215430', // Ghost of Tsushima DIRECTOR'S CUT
  '814380',  // Sekiro: Shadows Die Twice
  '553850',  // HELLDIVERS 2
  '2050650', // Resident Evil 4
  '1888930', // The Last of Us Part I
  '1817190', // Marvel's Spider-Man: Miles Morales
  '1551360', // Forza Horizon 5
  '1623730', // Palworld
  '1716740', // Starfield
  '1222140', // Detroit: Become Human
  '1151640', // Horizon Zero Dawn Complete Edition
  '489830',  // The Elder Scrolls V: Skyrim Special Edition
  '377160',  // Fallout 4
  '782330',  // DOOM Eternal
  '582010',  // MONSTER HUNTER: WORLD
  '1172620', // Sea of Thieves
  '275850',  // No Man's Sky
  '1426210', // It Takes Two
  '1326470', // Sons Of The Forest
  '892970',  // Valheim
  '252490',  // Rust
  '367520',  // Hollow Knight
  '1145360', // Hades
  '413150',  // Stardew Valley
  '105600',  // Terraria
];

export async function fetchPopularGames(params: {
  storeID?: string;
  sortBy?: SortOption;
  signal?: AbortSignal;
} = {}): Promise<DealItem[]> {
  const { storeID = '', sortBy = 'deal_rating', signal } = params;

  const batches: string[][] = [];
  for (let i = 0; i < POPULAR_STEAM_APP_IDS.length; i += 6) {
    batches.push(POPULAR_STEAM_APP_IDS.slice(i, i + 6));
  }

  const batchResults = await Promise.all(
    batches.map((ids) => {
      const query = new URLSearchParams({
        steamAppID: ids.join(','),
        pageSize: '60',
      });
      if (storeID) {
        query.set('storeID', storeID);
      }
      return safeFetchJson<DealItem[]>(`${API_BASE}/deals?${query.toString()}`, signal);
    })
  );

  // Deduplicate by gameID keeping the lowest current price listing
  const bestByGame = new Map<string, DealItem>();
  for (const list of batchResults) {
    if (!Array.isArray(list)) continue;
    for (const deal of list) {
      if (!deal || !deal.gameID) continue;
      const existing = bestByGame.get(deal.gameID);
      if (!existing || parseFloat(deal.salePrice) < parseFloat(existing.salePrice)) {
        bestByGame.set(deal.gameID, deal);
      }
    }
  }

  const orderMap = new Map<string, number>();
  POPULAR_STEAM_APP_IDS.forEach((id, idx) => orderMap.set(id, idx));

  const items = Array.from(bestByGame.values());

  switch (sortBy) {
    case 'lowest_price':
      items.sort((a, b) => parseFloat(a.salePrice) - parseFloat(b.salePrice));
      break;
    case 'highest_discount':
      items.sort((a, b) => parseFloat(b.savings) - parseFloat(a.savings));
      break;
    case 'alphabetical':
      items.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'deal_rating':
    default:
      items.sort((a, b) => {
        const orderA = a.steamAppID ? (orderMap.get(a.steamAppID) ?? 999) : 999;
        const orderB = b.steamAppID ? (orderMap.get(b.steamAppID) ?? 999) : 999;
        return orderA - orderB;
      });
      break;
  }

  return items;
}

export async function fetchDeals(params: FetchDealsParams = {}): Promise<DealItem[]> {
  const {
    storeID = '',
    sortBy = 'deal_rating',
    pageNumber = 0,
    pageSize = 36,
    onSale = true,
    signal,
  } = params;

  const query = new URLSearchParams();
  query.set('pageNumber', String(pageNumber));
  query.set('pageSize', String(pageSize));

  if (onSale) {
    query.set('onSale', '1');
  }

  if (storeID) {
    query.set('storeID', storeID);
  }

  switch (sortBy) {
    case 'lowest_price':
      query.set('sortBy', 'Price');
      query.set('desc', '0');
      query.set('lowerPrice', '0.01');
      break;
    case 'highest_discount':
      query.set('sortBy', 'Savings');
      query.set('desc', '1');
      break;
    case 'alphabetical':
      query.set('sortBy', 'Title');
      query.set('desc', '0');
      break;
    case 'deal_rating':
    default:
      query.set('sortBy', 'Deal Rating');
      query.set('desc', '1');
      break;
  }

  const data = await safeFetchJson<DealItem[]>(`${API_BASE}/deals?${query.toString()}`, signal);
  return Array.isArray(data) ? data : [];
}

export async function searchGames(title: string, signal?: AbortSignal): Promise<GameSearchItem[]> {
  const trimmed = title.trim();
  if (!trimmed) {
    return [];
  }

  const query = new URLSearchParams({
    title: trimmed,
    limit: '24',
  });

  const data = await safeFetchJson<GameSearchItem[]>(`${API_BASE}/games?${query.toString()}`, signal);
  return Array.isArray(data) ? data : [];
}

export async function fetchGameDetails(gameID: string, signal?: AbortSignal): Promise<GameDetailsResponse> {
  const query = new URLSearchParams({ id: gameID });
  return safeFetchJson<GameDetailsResponse>(`${API_BASE}/games?${query.toString()}`, signal);
}

export async function fetchDealLookup(dealID: string, signal?: AbortSignal): Promise<DealLookupResponse | null> {
  if (!dealID) return null;
  try {
    const query = new URLSearchParams({ id: dealID });
    return await safeFetchJson<DealLookupResponse>(`${API_BASE}/deals?${query.toString()}`, signal);
  } catch {
    return null;
  }
}

export function formatDateDDMMYYYY(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds || !Number.isFinite(unixSeconds) || unixSeconds <= 0) {
    return null;
  }
  const date = new Date(unixSeconds * 1000);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

export function formatIsoDateDDMMYYYY(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function formatUSD(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '$0.00';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (!Number.isFinite(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
}

export function getGameCoverCandidates(steamAppID: string | null | undefined, thumb?: string | null): string[] {
  const candidates: string[] = [];
  if (steamAppID && /^\d+$/.test(steamAppID.trim())) {
    candidates.push(
      `https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/${steamAppID.trim()}/header.jpg`
    );
  }
  if (thumb && thumb.trim()) {
    candidates.push(thumb.trim());
  }
  return candidates;
}

export function getG2AAffiliateUrl(gameTitle: string): string {
  return `https://www.g2a.com/search?query=${encodeURIComponent(gameTitle)}&reflink=bcbd8d34bd`;
}

export function getStoreRedirectUrl(dealID: string): string {
  return `${CHEAPSHARK_ORIGIN}/redirect?dealID=${encodeURIComponent(dealID)}`;
}
