import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  ExternalLink,
  History,
  RefreshCw,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import {
  fetchGameDetails,
  formatIsoDateDDMMYYYY,
  formatUSD,
  getG2AAffiliateUrl,
} from '../services/cheapshark';
import { TrackedGame } from '../types/cheapshark';
import { recordTrackedPriceVisit, removeTrackedGame } from '../utils/watchlist';
import { GameCoverImage } from './GameCoverImage';

interface WatchlistViewProps {
  watchlist: TrackedGame[];
  onSelectGame: (gameID: string) => void;
  onWatchlistChange: () => void;
  onExploreDeals: () => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  onSelectGame,
  onWatchlistChange,
  onExploreDeals,
}) => {
  const { lang, isRTL } = useLanguage();
  const t = getT(lang);

  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const handleRemove = (gameID: string) => {
    removeTrackedGame(gameID);
    onWatchlistChange();
  };

  const handleRefreshAll = async () => {
    if (watchlist.length === 0 || refreshing) return;
    setRefreshing(true);
    setRefreshError(null);

    try {
      await Promise.allSettled(
        watchlist.map(async (item) => {
          const data = await fetchGameDetails(item.gameID);
          const sorted = [...(data.deals || [])].sort(
            (a, b) => parseFloat(a.price) - parseFloat(b.price)
          );
          if (sorted.length > 0) {
            const lowest = parseFloat(sorted[0].price);
            const steamDeal = data.deals?.find((d) => d.storeID === '1');
            const steamPriceVal = steamDeal ? parseFloat(steamDeal.price) : null;
            const cheapestEverVal = data.cheapestPriceEver?.price
              ? parseFloat(data.cheapestPriceEver.price)
              : null;
            if (Number.isFinite(lowest)) {
              recordTrackedPriceVisit(item.gameID, lowest, {
                title: data.info.title,
                thumb: data.info.thumb,
                steamAppID: data.info.steamAppID,
                steamPrice: steamPriceVal,
                cheapestEverPrice: cheapestEverVal,
              });
            }
          }
        })
      );
      onWatchlistChange();
    } catch {
      setRefreshError(t.watchlist.refreshError);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{t.watchlist.title}</h1>
          <p className="text-sm text-slate-400 mt-1">{t.watchlist.subtitle}</p>
        </div>

        {watchlist.length > 0 && (
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#131722] hover:bg-[#1B2130] border border-white/10 text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 text-emerald-400 ${refreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            {refreshing ? t.watchlist.refreshing : t.watchlist.refreshBtn}
          </button>
        )}
      </div>

      {refreshError && (
        <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-xs text-red-200">
          {refreshError}
        </div>
      )}

      {watchlist.length === 0 ? (
        <div className="my-12 p-10 rounded-2xl bg-[#131722] border border-white/[0.08] text-center max-w-xl mx-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 mx-auto mb-4">
            <Bookmark className="w-6 h-6" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-bold text-white">{t.watchlist.emptyTitle}</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            {t.watchlist.emptyHintPrefix}
            <span className="text-white font-semibold">{t.watchlist.emptyHintAction}</span>
            {t.watchlist.emptyHintSuffix}
          </p>
          <button
            type="button"
            onClick={onExploreDeals}
            className="mt-6 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#0B0D12] text-sm font-extrabold transition-colors cursor-pointer"
          >
            {t.watchlist.exploreBtn}
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {watchlist.map((item) => (
            <article
              key={item.gameID}
              className="group rounded-xl bg-[#131722] border border-white/[0.08] hover:border-emerald-500/35 overflow-hidden flex flex-col transition-all"
            >
              <button
                type="button"
                onClick={() => onSelectGame(item.gameID)}
                className="text-start w-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                <GameCoverImage
                  title={item.title}
                  steamAppID={item.steamAppID}
                  thumb={item.thumb}
                />
              </button>

              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <button
                    type="button"
                    onClick={() => onSelectGame(item.gameID)}
                    className="text-start w-full cursor-pointer"
                  >
                    <h2
                      className="text-base font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors"
                      dir="auto"
                    >
                      {item.title}
                    </h2>
                  </button>

                  <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      {t.watchlist.pricePoints(item.history.length)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {t.watchlist.lastUpdated}{' '}
                      <span className="font-mono tabular-nums" dir="ltr">
                        {formatIsoDateDDMMYYYY(item.lastUpdated)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Prices Summary */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-slate-400 block">
                      {t.watchlist.lowestRecorded}
                    </span>
                    <span
                      className="text-lg font-extrabold font-mono tabular-nums text-emerald-400"
                      dir="ltr"
                    >
                      {formatUSD(item.currentLowestPrice)}
                    </span>
                  </div>

                  {item.cheapestEverPrice !== null && (
                    <div className="text-end">
                      <span className="text-[11px] text-slate-400 block">
                        {t.watchlist.historicalLow}
                      </span>
                      <span
                        className="text-sm font-bold font-mono tabular-nums text-amber-400"
                        dir="ltr"
                      >
                        {formatUSD(item.cheapestEverPrice)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onSelectGame(item.gameID)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#1A2030] hover:bg-[#232C42] text-xs font-bold text-white border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <span>{t.watchlist.detailsBtn}</span>
                    {isRTL ? (
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                  </button>

                  <a
                    href={getG2AAffiliateUrl(item.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={t.watchlist.buyG2ATitle}
                    className="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-[#0B0D12] text-xs font-extrabold transition-colors whitespace-nowrap"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>G2A</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleRemove(item.gameID)}
                    aria-label={t.watchlist.removeAria(item.title)}
                    title={t.watchlist.removeTitle}
                    className="p-2 rounded-lg bg-[#1A2030] hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
