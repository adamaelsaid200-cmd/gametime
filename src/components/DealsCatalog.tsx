import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpDown,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Store as StoreIcon,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { fetchDeals, fetchPopularGames, formatUSD } from '../services/cheapshark';
import { DealItem, DiscountFilter, SortOption, Store } from '../types/cheapshark';
import { GameCoverImage } from './GameCoverImage';

interface DealsCatalogProps {
  stores: Store[];
  trackedGameIds: Set<string>;
  popularFirstPage?: boolean;
  defaultMinDiscount?: DiscountFilter;
  defaultSort?: SortOption;
  sectionTitle: string;
  sectionSubtitle: string;
  onSelectGame: (gameID: string, initialDeal?: DealItem) => void;
}

export const DealsCatalog: React.FC<DealsCatalogProps> = ({
  stores,
  trackedGameIds,
  popularFirstPage = false,
  defaultMinDiscount = 0,
  defaultSort = 'deal_rating',
  sectionTitle,
  sectionSubtitle,
  onSelectGame,
}) => {
  const { lang, isRTL } = useLanguage();
  const t = getT(lang);

  const [selectedStore, setSelectedStore] = useState<string>('');
  const [minDiscount, setMinDiscount] = useState<DiscountFilter>(defaultMinDiscount);
  const [sortBy, setSortBy] = useState<SortOption>(defaultSort);
  const [page, setPage] = useState<number>(0);

  const [deals, setDeals] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const discountOptions: { value: DiscountFilter; label: string }[] = useMemo(
    () => [
      { value: 0, label: t.catalog.discountAll },
      { value: 50, label: t.catalog.discount50 },
      { value: 75, label: t.catalog.discount75 },
      { value: 90, label: t.catalog.discount90 },
    ],
    [t]
  );

  const sortOptions: { value: SortOption; label: string }[] = useMemo(
    () => [
      { value: 'deal_rating', label: t.catalog.sortPopular },
      { value: 'lowest_price', label: t.catalog.sortLowestPrice },
      { value: 'highest_discount', label: t.catalog.sortHighestDiscount },
      { value: 'alphabetical', label: t.catalog.sortAlphabetical },
    ],
    [t]
  );

  // Sync defaults when switching between "Explore" and "Top Discounts" tabs
  useEffect(() => {
    setMinDiscount(defaultMinDiscount);
    setSortBy(defaultSort);
    setPage(0);
  }, [defaultMinDiscount, defaultSort, popularFirstPage]);

  const storeMap = useMemo(() => {
    const map = new Map<string, Store>();
    for (const s of stores) {
      map.set(s.storeID, s);
    }
    return map;
  }, [stores]);

  const isPopularPageOne = popularFirstPage && page === 0 && minDiscount === 0;

  const loadDeals = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      let data: DealItem[];
      if (isPopularPageOne) {
        data = await fetchPopularGames({
          storeID: selectedStore,
          sortBy,
          signal: controller.signal,
        });
      } else {
        const apiPageNumber = popularFirstPage && minDiscount === 0 ? Math.max(0, page - 1) : page;
        data = await fetchDeals({
          storeID: selectedStore,
          sortBy,
          pageNumber: apiPageNumber,
          pageSize: 60,
          onSale: minDiscount > 0 || !popularFirstPage,
          signal: controller.signal,
        });
      }
      setDeals(data);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(t.catalog.loadError);
      setDeals([]);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [isPopularPageOne, popularFirstPage, minDiscount, selectedStore, sortBy, page, t.catalog.loadError]);

  useEffect(() => {
    loadDeals();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadDeals]);

  const filteredDeals = useMemo(() => {
    if (minDiscount === 0) return deals;
    return deals.filter((deal) => parseFloat(deal.savings) >= minDiscount);
  }, [deals, minDiscount]);

  const handleStoreChange = (value: string) => {
    setSelectedStore(value);
    setPage(0);
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setPage(0);
  };

  const handleDiscountChange = (value: DiscountFilter) => {
    setMinDiscount(value);
    setPage(0);
  };

  const hasNextPage = isPopularPageOne ? true : deals.length >= 60;

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Section Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-white/[0.08]">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">{sectionTitle}</h2>
          <p className="text-sm text-slate-400 mt-1">{sectionSubtitle}</p>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Store Filter */}
          <div className="flex items-center gap-2 bg-[#131722] border border-white/[0.08] rounded-lg px-3 h-10">
            <StoreIcon className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <label htmlFor="store-filter" className="sr-only">
              {t.catalog.storeFilterAria}
            </label>
            <select
              id="store-filter"
              value={selectedStore}
              onChange={(e) => handleStoreChange(e.target.value)}
              className="bg-transparent text-xs sm:text-sm text-slate-200 font-medium focus:outline-none cursor-pointer pe-1"
            >
              <option value="" className="bg-[#131722] text-white">
                {t.catalog.allStores(stores.length)}
              </option>
              {stores.map((store) => (
                <option
                  key={store.storeID}
                  value={store.storeID}
                  className="bg-[#131722] text-white"
                >
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex items-center gap-2 bg-[#131722] border border-white/[0.08] rounded-lg px-3 h-10">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <label htmlFor="sort-filter" className="sr-only">
              {t.catalog.sortFilterAria}
            </label>
            <select
              id="sort-filter"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value as SortOption)}
              className="bg-transparent text-xs sm:text-sm text-slate-200 font-medium focus:outline-none cursor-pointer pe-1"
            >
              {sortOptions.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-[#131722] text-white"
                >
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Discount Segmented Control */}
          <div
            className="flex items-center gap-1 p-1 bg-[#131722] border border-white/[0.08] rounded-lg"
            role="group"
            aria-label={t.catalog.discountFilterAria}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500 mx-1.5 hidden sm:inline" aria-hidden="true" />
            {discountOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleDiscountChange(opt.value)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  minDiscount === opt.value
                    ? 'bg-emerald-500 text-[#0B0D12]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="my-8 p-6 rounded-xl bg-red-500/10 border border-red-500/25 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-red-200">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" aria-hidden="true" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button
            type="button"
            onClick={loadDeals}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t.catalog.retry}
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-xl bg-[#131722] border border-white/[0.07] overflow-hidden animate-pulse"
            >
              <div className="aspect-[16/9] bg-white/[0.05]" />
              <div className="p-4 space-y-3">
                <div className="h-5 bg-white/[0.08] rounded w-4/5" />
                <div className="h-3.5 bg-white/[0.05] rounded w-1/2" />
                <div className="pt-3 border-t border-white/[0.06] flex justify-between items-center">
                  <div className="h-6 bg-white/[0.08] rounded w-24" />
                  <div className="h-6 bg-emerald-500/20 rounded w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredDeals.length === 0 && (
        <div className="my-10 p-10 rounded-xl bg-[#131722] border border-white/[0.07] text-center">
          <p className="text-base font-bold text-white">{t.catalog.emptyTitle}</p>
          <p className="text-sm text-slate-400 mt-1.5">{t.catalog.emptyHint}</p>
          <button
            type="button"
            onClick={() => {
              setSelectedStore('');
              setMinDiscount(0);
              setPage(0);
            }}
            className="mt-4 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0B0D12] text-xs font-bold transition-colors cursor-pointer"
          >
            {t.catalog.resetFilters}
          </button>
        </div>
      )}

      {/* Deals Grid */}
      {!loading && !error && filteredDeals.length > 0 && (
        <>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => {
              const savingsPct = Math.round(parseFloat(deal.savings) || 0);
              const store = storeMap.get(deal.storeID);
              const isTracked = trackedGameIds.has(deal.gameID);
              const hasDiscount =
                savingsPct > 0 && parseFloat(deal.normalPrice) > parseFloat(deal.salePrice);

              return (
                <article
                  key={deal.dealID}
                  className="group rounded-xl bg-[#131722] hover:bg-[#171C2A] border border-white/[0.08] hover:border-emerald-500/35 overflow-hidden transition-all duration-150 flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => onSelectGame(deal.gameID, deal)}
                    className="text-start flex-1 flex flex-col w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    {/* Cover Image */}
                    <div className="relative w-full">
                      <GameCoverImage
                        title={deal.title}
                        steamAppID={deal.steamAppID}
                        thumb={deal.thumb}
                      />
                      {savingsPct > 0 && (
                        <span
                          className="absolute top-3 start-3 px-2.5 py-1 rounded-md bg-emerald-500 text-[#0B0D12] text-xs font-extrabold font-mono tabular-nums shadow-md"
                          dir="ltr"
                        >
                          -{savingsPct}%
                        </span>
                      )}
                      {isTracked && (
                        <span
                          className="absolute top-3 end-3 p-1.5 rounded-md bg-[#0B0D12]/80 backdrop-blur-sm border border-emerald-400/40 text-emerald-400"
                          title={t.catalog.inWatchlist}
                        >
                          <BookmarkCheck className="w-4 h-4" aria-hidden="true" />
                        </span>
                      )}
                    </div>

                    {/* Card Content */}
                    <div className="p-4 flex-1 flex flex-col justify-between gap-3 w-full">
                      <div>
                        <h3
                          className="text-base font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors"
                          dir="auto"
                        >
                          {deal.title}
                        </h3>

                        {/* Clean Unboxed Metadata */}
                        <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400">
                          {store?.images.icon && (
                            <img
                              src={store.images.icon}
                              alt=""
                              referrerPolicy="no-referrer"
                              className="w-3.5 h-3.5 rounded-sm object-contain shrink-0"
                            />
                          )}
                          <span className="truncate">
                            {store?.storeName || t.catalog.storeFallback(deal.storeID)}
                          </span>
                          {deal.metacriticScore && parseInt(deal.metacriticScore, 10) > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">
                                Metacritic {deal.metacriticScore}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Price Row */}
                      <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                        <div className="flex items-baseline gap-2.5">
                          <span
                            className={`text-lg font-extrabold font-mono tabular-nums ${
                              hasDiscount ? 'text-emerald-400' : 'text-white'
                            }`}
                            dir="ltr"
                          >
                            {formatUSD(deal.salePrice)}
                          </span>
                          {hasDiscount && (
                            <span
                              className="text-xs font-mono tabular-nums text-slate-500 line-through"
                              dir="ltr"
                            >
                              {formatUSD(deal.normalPrice)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-slate-400 group-hover:text-white transition-colors whitespace-nowrap">
                          {t.catalog.compareStores}
                        </span>
                      </div>
                    </div>
                  </button>
                </article>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="mt-8 pt-6 border-t border-white/[0.07] flex items-center justify-between">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => {
                setPage((p) => Math.max(0, p - 1));
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#131722] border border-white/[0.08] text-xs font-bold text-slate-200 hover:bg-[#191F2E] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              {isRTL ? (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              )}
              {t.catalog.prevPage}
            </button>

            <span className="text-xs text-slate-400 font-medium tabular-nums">
              {t.catalog.pageSummary(page + 1, filteredDeals.length)}
            </span>

            <button
              type="button"
              disabled={!hasNextPage}
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 320, behavior: 'smooth' });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#131722] border border-white/[0.08] text-xs font-bold text-slate-200 hover:bg-[#191F2E] disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              {t.catalog.nextPage}
              {isRTL ? (
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              ) : (
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </>
      )}
    </section>
  );
};
