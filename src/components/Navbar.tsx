import React from 'react';
import { Bookmark, Flame, Gamepad2, Languages, Search } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

export type ActiveRoute = 'explore' | 'top-discounts' | 'watchlist' | 'details';

interface NavbarProps {
  activeRoute: ActiveRoute;
  watchlistCount: number;
  onNavigate: (route: 'explore' | 'top-discounts' | 'watchlist') => void;
  onFocusSearch: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeRoute,
  watchlistCount,
  onNavigate,
  onFocusSearch,
}) => {
  const { lang, toggleLanguage } = useLanguage();
  const t = getT(lang);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#0B0D12]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('explore')}
          className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg px-1 py-1 cursor-pointer"
          aria-label={t.nav.homeAria}
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Gamepad2 className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight" dir="ltr">
            GameTime
          </span>
        </button>

        {/* Zone 2: Concise Navigation Links */}
        <nav className="flex items-center gap-3.5 sm:gap-7 text-xs sm:text-sm font-semibold overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onNavigate('explore')}
            className={`relative py-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded ${
              activeRoute === 'explore'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.nav.explore}
            {activeRoute === 'explore' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('top-discounts')}
            className={`relative py-2 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded ${
              activeRoute === 'top-discounts'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-4 h-4 text-amber-400 hidden sm:inline" aria-hidden="true" />
            {t.nav.topDiscounts}
            {activeRoute === 'top-discounts' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onNavigate('watchlist')}
            className={`relative py-2 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded ${
              activeRoute === 'watchlist'
                ? 'text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bookmark className="w-4 h-4 text-emerald-400 hidden sm:inline" aria-hidden="true" />
            <span>{t.nav.watchlist}</span>
            {watchlistCount > 0 && (
              <span className="text-xs font-mono tabular-nums text-emerald-400">
                ({watchlistCount})
              </span>
            )}
            {activeRoute === 'watchlist' && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </nav>

        {/* Zone 3: Language Toggle, Install & Search Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleLanguage}
            aria-label={t.nav.switchLangAria}
            title={t.nav.switchLangAria}
            className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs font-bold text-slate-200 bg-[#131722] hover:bg-[#1C2233] border border-white/[0.1] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
            <span>{t.nav.switchLangLabel}</span>
          </button>

          <PWAInstallButton variant="navbar" />

          <button
            type="button"
            onClick={onFocusSearch}
            className="hidden md:flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B0D12] bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
            {t.nav.searchBtn}
          </button>
        </div>
      </div>
    </header>
  );
};
