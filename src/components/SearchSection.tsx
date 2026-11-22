import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, Search, X } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { formatUSD, searchGames } from '../services/cheapshark';
import { GameSearchItem } from '../types/cheapshark';
import { GameCoverImage } from './GameCoverImage';

interface SearchSectionProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSelectGame: (gameID: string) => void;
}

const POPULAR_QUERIES = [
  'Cyberpunk 2077',
  'Elden Ring',
  'Red Dead Redemption 2',
  'The Witcher 3',
  'Hollow Knight',
];

export const SearchSection: React.FC<SearchSectionProps> = ({ inputRef, onSelectGame }) => {
  const { lang, isRTL } = useLanguage();
  const t = getT(lang);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GameSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      if (abortRef.current) abortRef.current.abort();
      setResults([]);
      setError(null);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);
      setHasSearched(true);

      try {
        const items = await searchGames(trimmed, controller.signal);
        setResults(items);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setError(t.search.error);
        setResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 340);

    return () => {
      clearTimeout(timer);
    };
  }, [query, t.search.error]);

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
    <section className="relative border-b border-white/[0.06] bg-gradient-to-b from-[#111520] to-[#0B0D12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Hero Headline */}
        <div className="max-w-3xl mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight [text-wrap:balance]">
            {t.search.heroTitle}
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl">
            {t.search.heroSubtitle}
          </p>
        </div>

        {/* Instant Search Bar */}
        <div className="relative max-w-4xl">
          <div className="relative flex items-center">
            <Search
              className="w-5 h-5 text-slate-400 absolute start-4 pointer-events-none"
              aria-hidden="true"
            />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search.placeholder}
              aria-label={t.search.ariaLabel}
              className="w-full h-14 ps-12 pe-12 rounded-xl bg-[#131722] border border-white/10 text-base text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 transition-all"
            />
            <div className="absolute end-3 flex items-center gap-2">
              {loading && (
                <Loader2
                  className="w-5 h-5 text-emerald-400 animate-spin"
                  aria-label={t.search.searching}
                />
              )}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={t.search.clearAria}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Search Suggestions */}
          {!hasSearched && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">{t.search.quickLabel}</span>
              {POPULAR_QUERIES.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => setQuery(term)}
                  className="px-2.5 py-1 rounded-md bg-[#161B28] hover:bg-[#1E2536] border border-white/[0.07] text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                  dir="ltr"
                >
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Instant Search Results Panel */}
        {hasSearched && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-200">
                {t.search.resultsTitle}
                {!loading && !error && (
                  <span className="ms-2 text-xs font-normal text-slate-400 tabular-nums">
                    {t.search.resultsCount(results.length)}
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                {t.search.closeResults}
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3 text-sm text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-xl bg-[#131722] border border-white/[0.07] overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[16/9] bg-white/[0.05]" />
                    <div className="p-3.5 space-y-2">
                      <div className="h-4 bg-white/[0.08] rounded w-3/4" />
                      <div className="h-4 bg-white/[0.05] rounded w-1/3" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && results.length === 0 && (
              <div className="p-6 rounded-xl bg-[#131722] border border-white/[0.07] text-center">
                <p className="text-sm text-slate-300 font-medium">
                  {t.search.emptyTitle(query)}
                </p>
                <p className="text-xs text-slate-500 mt-1">{t.search.emptyHint}</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {results.map((game) => (
                  <button
                    key={game.gameID}
                    type="button"
                    onClick={() => onSelectGame(game.gameID)}
                    className="group text-start rounded-xl bg-[#131722] hover:bg-[#181E2C] border border-white/[0.08] hover:border-emerald-500/40 overflow-hidden transition-all duration-150 flex flex-col cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  >
                    <GameCoverImage
                      title={game.external}
                      steamAppID={game.steamAppID}
                      thumb={game.thumb}
                    />
                    <div className="p-3.5 flex-1 flex flex-col justify-between gap-2 w-full">
                      <h3
                        className="text-sm font-bold text-white line-clamp-1 group-hover:text-emerald-300 transition-colors"
                        dir="auto"
                      >
                        {game.external}
                      </h3>
                      <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs text-slate-400">{t.search.lowestPrice}</span>
                          <span
                            className="text-sm font-bold font-mono tabular-nums text-emerald-400"
                            dir="ltr"
                          >
                            {formatUSD(game.cheapest)}
                          </span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 group-hover:text-white transition-colors">
                          {t.search.details}
                          {isRTL ? (
                            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                          ) : (
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          )}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
