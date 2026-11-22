export interface StoreImages {
  banner: string;
  logo: string;
  icon: string;
}

export interface Store {
  storeID: string;
  storeName: string;
  isActive: number;
  images: StoreImages;
}

export interface DealItem {
  internalName: string;
  title: string;
  metacriticLink: string | null;
  dealID: string;
  storeID: string;
  gameID: string;
  salePrice: string;
  normalPrice: string;
  isOnSale: string;
  savings: string;
  metacriticScore: string;
  steamRatingText: string | null;
  steamRatingPercent: string;
  steamRatingCount: string;
  steamAppID: string | null;
  releaseDate: number;
  lastChange: number;
  dealRating: string;
  thumb: string;
}

export interface GameSearchItem {
  gameID: string;
  steamAppID: string | null;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}

export interface GameStoreDeal {
  storeID: string;
  dealID: string;
  price: string;
  retailPrice: string;
  savings: string;
}

export interface GameDetailsResponse {
  info: {
    title: string;
    steamAppID: string | null;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: GameStoreDeal[];
}

export interface DealLookupResponse {
  gameInfo?: {
    storeID: string;
    gameID: string;
    name: string;
    steamAppID: string | null;
    salePrice: string;
    retailPrice: string;
    steamRatingText: string | null;
    steamRatingPercent: string;
    steamRatingCount: string;
    metacriticScore: string;
    metacriticLink: string | null;
    releaseDate: number;
    publisher: string;
    steamworks: string;
    thumb: string;
  };
  cheapestPrice?: {
    price: string;
    date: number;
  };
}

export type SortOption = 'deal_rating' | 'lowest_price' | 'highest_discount' | 'alphabetical';

export type DiscountFilter = 0 | 50 | 75 | 90;

export interface PriceHistoryPoint {
  date: string; // YYYY-MM-DD
  price: number;
}

export interface TrackedGame {
  gameID: string;
  title: string;
  thumb: string;
  steamAppID: string | null;
  currentLowestPrice: number;
  steamPrice: number | null;
  cheapestEverPrice: number | null;
  addedAt: string;
  lastUpdated: string;
  history: PriceHistoryPoint[];
}
