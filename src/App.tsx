import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DealsCatalog } from './components/DealsCatalog';
import { GameDetailsView } from './components/GameDetailsView';
import { ActiveRoute, Navbar } from './components/Navbar';
import { OfflineIndicator } from './components/OfflineIndicator';
import { SearchSection } from './components/SearchSection';
import { WatchlistView } from './components/WatchlistView';
import { useLanguage } from './i18n/LanguageContext';
import { getT } from './i18n/translations';
import { fetchStores } from './services/cheapshark';
import { DealItem, Store, TrackedGame } from './types/cheapshark';
import { getWatchlist } from './utils/watchlist';

export default function App() {
  const { lang } = useLanguage();
  const t = getT(lang);

  const [stores, setStores] = useState<Store[]>([]);
  const [route, setRoute] = useState<ActiveRoute>('explore');
  const [selectedGameID, setSelectedGameID] = useState<string | null>(null);
  const [selectedInitialDeal, setSelectedInitialDeal] = useState<DealItem | undefined>(undefined);
  const [watchlist, setWatchlist] = useState<TrackedGame[]>(() => getWatchlist());

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Read initial route from URL query/hash
  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const gameParam = params.get('game');
      if (gameParam) {
        setSelectedGameID(gameParam);
        setRoute('details');
        return;
      }
      const hash = window.location.hash;
      if (hash === '#watchlist') {
        setSelectedGameID(null);
        setRoute('watchlist');
      } else if (hash === '#top-discounts') {
        setSelectedGameID(null);
        setRoute('top-discounts');
      } else {
        setSelectedGameID(null);
        setRoute('explore');
      }
    };

    syncFromUrl();
    window.addEventListener('popstate', syncFromUrl);
    return () => window.removeEventListener('popstate', syncFromUrl);
  }, []);

  // Load CheapShark official stores directory safely
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await fetchStores();
        if (mounted) {
          setStores(list);
        }
      } catch {
        // Handled gracefully: store names fall back cleanly if /stores fails
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Keep SEO document title accurate when not on details view
  useEffect(() => {
    if (route === 'watchlist') {
      document.title = t.seo.watchlistTitle;
    } else if (route === 'top-discounts') {
      document.title = t.seo.topDiscountsTitle;
    } else if (route === 'explore') {
      document.title = t.seo.exploreTitle;
    }
  }, [route, t]);

  const refreshWatchlistState = useCallback(() => {
    setWatchlist(getWatchlist());
  }, []);

  const trackedGameIds = useMemo(
    () => new Set(watchlist.map((item) => item.gameID)),
    [watchlist]
  );

  const handleNavigate = (target: 'explore' | 'top-discounts' | 'watchlist') => {
    setSelectedGameID(null);
    setSelectedInitialDeal(undefined);
    setRoute(target);

    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.hash = target === 'explore' ? '' : `#${target}`;
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGame = (gameID: string, initialDeal?: DealItem) => {
    setSelectedGameID(gameID);
    setSelectedInitialDeal(initialDeal);
    setRoute('details');

    const url = new URL(window.location.href);
    url.searchParams.set('game', gameID);
    url.hash = '';
    window.history.pushState({}, '', url.toString());
  };

  const handleBackFromDetails = () => {
    setSelectedGameID(null);
    setSelectedInitialDeal(undefined);
    setRoute('explore');

    const url = new URL(window.location.href);
    url.searchParams.delete('game');
    url.hash = '';
    window.history.pushState({}, '', url.toString());
  };

  const handleFocusSearch = () => {
    if (route !== 'explore' && route !== 'top-discounts') {
      handleNavigate('explore');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      searchInputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0B0D12] text-[#F3F5F9]">
      <Navbar
        activeRoute={route}
        watchlistCount={watchlist.length}
        onNavigate={handleNavigate}
        onFocusSearch={handleFocusSearch}
      />

      <main className="flex-1">
        {route === 'details' && selectedGameID ? (
          <GameDetailsView
            gameID={selectedGameID}
            initialDeal={selectedInitialDeal}
            stores={stores}
            onBack={handleBackFromDetails}
            onWatchlistChange={refreshWatchlistState}
          />
        ) : route === 'watchlist' ? (
          <WatchlistView
            watchlist={watchlist}
            onSelectGame={(id) => handleSelectGame(id)}
            onWatchlistChange={refreshWatchlistState}
            onExploreDeals={() => handleNavigate('explore')}
          />
        ) : (
          <>
            <SearchSection
              inputRef={searchInputRef}
              onSelectGame={(id) => handleSelectGame(id)}
            />
            <DealsCatalog
              stores={stores}
              trackedGameIds={trackedGameIds}
              popularFirstPage={route === 'explore'}
              defaultMinDiscount={route === 'top-discounts' ? 75 : 0}
              defaultSort={route === 'top-discounts' ? 'highest_discount' : 'deal_rating'}
              sectionTitle={
                route === 'top-discounts'
                  ? t.catalog.topDiscountsTitle
                  : t.catalog.exploreTitle
              }
              sectionSubtitle={
                route === 'top-discounts'
                  ? t.catalog.topDiscountsSubtitle
                  : t.catalog.exploreSubtitle
              }
              onSelectGame={handleSelectGame}
            />
          </>
        )}
      </main>

      <footer className="border-t border-white/[0.07] bg-[#090B0F] mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2 text-center sm:text-start">
            <span className="font-bold text-slate-300" dir="ltr">
              GameTime
            </span>
            <span aria-hidden="true">·</span>
            <span>{t.footer.tagline}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('explore')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              {t.footer.explore}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('top-discounts')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              {t.footer.topDiscounts}
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('watchlist')}
              className="hover:text-slate-300 transition-colors cursor-pointer"
            >
              {t.footer.watchlist}
            </button>
          </div>
        </div>
      </footer>

      <OfflineIndicator />
    </div>
  );
}
