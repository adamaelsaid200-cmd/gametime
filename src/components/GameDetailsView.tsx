import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  BookmarkCheck,
  Calendar,
  ExternalLink,
  History,
  RefreshCw,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import {
  fetchDealLookup,
  fetchGameDetails,
  formatDateDDMMYYYY,
  formatUSD,
  getG2AAffiliateUrl,
} from '../services/cheapshark';
import {
  DealItem,
  DealLookupResponse,
  GameDetailsResponse,
  Store,
  TrackedGame,
} from '../types/cheapshark';
import {
  isGameTracked,
  recordTrackedPriceVisit,
  toggleTrackGame,
} from '../utils/watchlist';
import { GameCoverImage } from './GameCoverImage';
import { PriceHistoryChart } from './PriceHistoryChart';
import { StoreComparisonTable } from './StoreComparisonTable';

interface GameDetailsViewProps {
  gameID: string;
  initialDeal?: DealItem;
  stores: Store[];
  onBack: () => void;
  onWatchlistChange: () => void;
}

export const GameDetailsView: React.FC<GameDetailsViewProps> = ({
  gameID,
  initialDeal,
  stores,
  onBack,
  onWatchlistChange,
}) => {
  const { lang, isRTL } = useLanguage();
  const t = getT(lang);

  const [details, setDetails] = useState<GameDetailsResponse | null>(null);
  const [dealLookup, setDealLookup] = useState<DealLookupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trackedEntry, setTrackedEntry] = useState<TrackedGame | null>(null);
  const [tracked, setTracked] = useState<boolean>(() => isGameTracked(gameID));
  const abortRef = useRef<AbortController | null>(null);

  const loadGameData = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const gameData = await fetchGameDetails(gameID, controller.signal);
      setDetails(gameData);

      // Fetch deal lookup (from initialDeal or cheapest deal in gameData) to retrieve releaseDate, publisher, and Steam ratings
      const sorted = [...(gameData.deals || [])].sort(
        (a, b) => parseFloat(a.price) - parseFloat(b.price)
      );
      const lookupDealId = initialDeal?.dealID || sorted[0]?.dealID;
      if (lookupDealId) {
        const lookup = await fetchDealLookup(lookupDealId, controller.signal);
        if (!controller.signal.aborted) {
          setDealLookup(lookup);
        }
      }

      // Compute lowest price & steam price for watchlist auto-recording
      const currentLowest =
        sorted.length > 0 ? parseFloat(sorted[0].price) : parseFloat(gameData.cheapestPriceEver?.price || '0');
      const steamDeal = gameData.deals?.find((d) => d.storeID === '1');
      const steamPriceVal = steamDeal ? parseFloat(steamDeal.price) : null;
      const cheapestEverVal = gameData.cheapestPriceEver?.price
        ? parseFloat(gameData.cheapestPriceEver.price)
        : null;

      if (isGameTracked(gameID) && Number.isFinite(currentLowest)) {
        const updated = recordTrackedPriceVisit(gameID, currentLowest, {
          title: gameData.info.title,
          thumb: gameData.info.thumb,
          steamAppID: gameData.info.steamAppID,
          steamPrice: steamPriceVal,
          cheapestEverPrice: cheapestEverVal,
        });
        setTrackedEntry(updated);
        setTracked(true);
        onWatchlistChange();
      } else {
        setTracked(false);
        setTrackedEntry(null);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(t.details.loadErrorFetch);
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [gameID, initialDeal, onWatchlistChange, t.details.loadErrorFetch]);

  useEffect(() => {
    if (details?.info?.title) {
      document.title = `${details.info.title} – ${t.seo.detailsTitleSuffix}`;
    }
  }, [details, t.seo.detailsTitleSuffix]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadGameData();
    return () => {
      abortRef.current?.abort();
    };
  }, [loadGameData]);

  const computed = useMemo(() => {
    if (!details) return null;

    const deals = details.deals || [];
    const sortedDeals = [...deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    const cheapestDeal = sortedDeals[0] || null;
    const currentLowestPrice = cheapestDeal ? parseFloat(cheapestDeal.price) : null;

    // Official Steam deal (storeID === "1" in CheapShark)
    const steamDeal = deals.find((d) => d.storeID === '1') || null;
    const steamCurrentPrice = steamDeal ? parseFloat(steamDeal.price) : null;
    const steamRetailPrice = steamDeal
      ? parseFloat(steamDeal.retailPrice)
      : cheapestDeal
      ? parseFloat(cheapestDeal.retailPrice)
      : null;

    const cheapestEverPrice = details.cheapestPriceEver?.price
      ? parseFloat(details.cheapestPriceEver.price)
      : null;
    const cheapestEverDate = formatDateDDMMYYYY(details.cheapestPriceEver?.date);

    const rawReleaseDate =
      dealLookup?.gameInfo?.releaseDate || initialDeal?.releaseDate || 0;
    const releaseDateFormatted = formatDateDDMMYYYY(rawReleaseDate);

    const publisher = dealLookup?.gameInfo?.publisher || null;
    const steamRatingPercent =
      dealLookup?.gameInfo?.steamRatingPercent || initialDeal?.steamRatingPercent || null;
    const metacriticScore =
      dealLookup?.gameInfo?.metacriticScore || initialDeal?.metacriticScore || null;

    const isAtHistoricalLow =
      currentLowestPrice !== null &&
      cheapestEverPrice !== null &&
      currentLowestPrice <= cheapestEverPrice + 0.01;

    return {
      sortedDeals,
      cheapestDeal,
      currentLowestPrice,
      steamDeal,
      steamCurrentPrice,
      steamRetailPrice,
      cheapestEverPrice,
      cheapestEverDate,
      releaseDateFormatted,
      publisher,
      steamRatingPercent,
      metacriticScore,
      isAtHistoricalLow,
    };
  }, [details, dealLookup, initialDeal]);

  const handleToggleTrack = () => {
    if (!details || !computed) return;
    const lowest = computed.currentLowestPrice ?? computed.cheapestEverPrice ?? 0;
    const res = toggleTrackGame({
      gameID,
      title: details.info.title,
      thumb: details.info.thumb,
      steamAppID: details.info.steamAppID,
      currentLowestPrice: lowest,
      steamPrice: computed.steamCurrentPrice ?? computed.steamRetailPrice,
      cheapestEverPrice: computed.cheapestEverPrice,
    });

    setTracked(res.tracked);
    if (res.tracked) {
      const entry = res.watchlist.find((g) => g.gameID === gameID) || null;
      setTrackedEntry(entry);
    } else {
      setTrackedEntry(null);
    }
    onWatchlistChange();
  };

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse space-y-6">
        <div className="h-9 w-36 bg-white/[0.07] rounded-lg" />
        <div className="rounded-2xl bg-[#131722] border border-white/[0.08] p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 aspect-[16/9] bg-white/[0.06] rounded-xl" />
          <div className="lg:col-span-7 space-y-4">
            <div className="h-8 bg-white/[0.08] rounded w-3/4" />
            <div className="h-4 bg-white/[0.05] rounded w-1/2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="h-24 bg-white/[0.06] rounded-xl" />
              <div className="h-24 bg-white/[0.06] rounded-xl" />
            </div>
            <div className="h-12 bg-amber-500/20 rounded-xl w-full sm:w-72" />
          </div>
        </div>
        <div className="h-72 bg-[#131722] rounded-xl border border-white/[0.08]" />
      </div>
    );
  }

  if (error || !details || !computed) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white mb-6 cursor-pointer"
        >
          <BackIcon className="w-4 h-4" aria-hidden="true" />
          {t.details.backToDeals}
        </button>

        <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/25 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto" aria-hidden="true" />
          <h2 className="text-lg font-bold text-white">{t.details.loadErrorTitle}</h2>
          <p className="text-sm text-red-200 max-w-md mx-auto">
            {error || t.details.loadErrorDefault}
          </p>
          <button
            type="button"
            onClick={loadGameData}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            {t.details.retry}
          </button>
        </div>
      </div>
    );
  }

  const g2aUrl = getG2AAffiliateUrl(details.info.title);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      {/* Top Breadcrumb / Back & Pinned Steam Price Benchmark */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#131722] hover:bg-[#1B2130] border border-white/[0.08] text-xs sm:text-sm font-bold text-slate-200 transition-colors cursor-pointer"
        >
          <BackIcon className="w-4 h-4" aria-hidden="true" />
          {t.details.backToDeals}
        </button>

        {/* Pinned Official Steam Price Benchmark Badge */}
        <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[#131722] border border-sky-500/30 shadow-sm">
          <Tag className="w-4 h-4 text-sky-400 shrink-0" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-bold text-slate-200">
            {t.details.steamOfficialPrice}
          </span>
          {computed.steamCurrentPrice !== null ? (
            <div className="flex items-baseline gap-2">
              <span
                className="text-sm sm:text-base font-extrabold font-mono tabular-nums text-sky-400"
                dir="ltr"
              >
                {formatUSD(computed.steamCurrentPrice)}
              </span>
              {computed.steamRetailPrice !== null &&
                computed.steamRetailPrice > computed.steamCurrentPrice && (
                  <span
                    className="text-xs font-mono tabular-nums text-slate-500 line-through"
                    dir="ltr"
                  >
                    {formatUSD(computed.steamRetailPrice)}
                  </span>
                )}
            </div>
          ) : computed.steamRetailPrice !== null ? (
            <span
              className="text-sm font-bold font-mono tabular-nums text-sky-400"
              dir="ltr"
            >
              {formatUSD(computed.steamRetailPrice)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">{t.details.notListed}</span>
          )}
        </div>
      </div>

      {/* Main Game Hero Card */}
      <section className="rounded-2xl bg-[#131722] border border-white/[0.08] p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
        {/* Official Cover Image */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0B0D12] h-full min-h-[200px]">
            <GameCoverImage
              title={details.info.title}
              steamAppID={details.info.steamAppID}
              thumb={details.info.thumb}
              className="h-full"
              aspectClassName="aspect-[16/9] lg:h-full"
            />
          </div>
        </div>

        {/* Title, Release Date, Benchmarks & Primary CTAs */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-5">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold text-white leading-tight [text-wrap:balance]"
              dir="auto"
            >
              {details.info.title}
            </h1>

            {/* Clean Unboxed Metadata */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-slate-400">
              {computed.releaseDateFormatted && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>{t.details.releaseDate}</span>
                  <span className="font-mono tabular-nums text-slate-200" dir="ltr">
                    {computed.releaseDateFormatted}
                  </span>
                </span>
              )}
              {computed.publisher && (
                <>
                  {computed.releaseDateFormatted && <span aria-hidden="true">·</span>}
                  <span>
                    {t.details.publisher} {computed.publisher}
                  </span>
                </>
              )}
              {computed.steamRatingPercent && parseInt(computed.steamRatingPercent, 10) > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-slate-300">
                    {t.details.steamRating} {computed.steamRatingPercent}%
                  </span>
                </>
              )}
              {computed.metacriticScore && parseInt(computed.metacriticScore, 10) > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-slate-300">
                    Metacritic: {computed.metacriticScore}/100
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Highlighted Price Cards: Current Best vs Historical Lowest */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Current Best Price */}
            <div className="rounded-xl bg-[#0B0D12] border border-emerald-500/25 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{t.details.currentBestPrice}</span>
                {computed.isAtHistoricalLow && (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <Award className="w-3.5 h-3.5" aria-hidden="true" />
                    {t.details.equalsHistoricalLow}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span
                  className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-emerald-400"
                  dir="ltr"
                >
                  {computed.currentLowestPrice !== null
                    ? formatUSD(computed.currentLowestPrice)
                    : t.details.unavailable}
                </span>
                {computed.cheapestDeal && parseFloat(computed.cheapestDeal.savings) > 0 && (
                  <span
                    className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-xs font-bold font-mono tabular-nums"
                    dir="ltr"
                  >
                    -{Math.round(parseFloat(computed.cheapestDeal.savings))}%
                  </span>
                )}
              </div>
            </div>

            {/* Highlighted Historical Lowest Price Card */}
            <div className="rounded-xl bg-[#0B0D12] border border-amber-500/30 p-4 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs text-amber-300/90 font-semibold">
                <span className="inline-flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" aria-hidden="true" />
                  {t.details.historicalLow}
                </span>
                {computed.cheapestEverDate && (
                  <span className="font-mono tabular-nums text-slate-400" dir="ltr">
                    {computed.cheapestEverDate}
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span
                  className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums text-amber-400"
                  dir="ltr"
                >
                  {computed.cheapestEverPrice !== null
                    ? formatUSD(computed.cheapestEverPrice)
                    : t.details.unrecorded}
                </span>
                <span className="text-xs text-slate-400">
                  {computed.cheapestEverDate ? t.details.recordedDate : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Glowing G2A Affiliate CTA + Price Tracker Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <a
              href={g2aUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="g2a-glow-cta flex-1 sm:flex-initial inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-[#0B0D12] text-sm sm:text-base font-extrabold whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
            >
              <ShoppingBag className="w-5 h-5" aria-hidden="true" />
              <span>{t.details.buyNowCta}</span>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
            </a>

            <button
              type="button"
              onClick={handleToggleTrack}
              className={`inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-bold border transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                tracked
                  ? 'bg-emerald-500/15 border-emerald-500/45 text-emerald-300 hover:bg-emerald-500/20'
                  : 'bg-[#191F2E] border-white/10 text-white hover:bg-[#21293C]'
              }`}
            >
              {tracked ? (
                <>
                  <BookmarkCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>{t.details.trackingActive}</span>
                </>
              ) : (
                <>
                  <Bookmark className="w-4 h-4 text-slate-300" aria-hidden="true" />
                  <span>{t.details.trackPrice}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Personal Price History Line Chart */}
      <PriceHistoryChart
        history={trackedEntry?.history || []}
        cheapestEverPrice={computed.cheapestEverPrice}
        isTracked={tracked}
      />

      {/* Live Store Price Comparison Table */}
      <StoreComparisonTable deals={computed.sortedDeals} stores={stores} />
    </div>
  );
};
