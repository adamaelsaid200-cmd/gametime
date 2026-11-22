import React, { useMemo } from 'react';
import { ExternalLink, Store as StoreIcon } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { formatUSD, getStoreRedirectUrl } from '../services/cheapshark';
import { GameStoreDeal, Store } from '../types/cheapshark';

interface StoreComparisonTableProps {
  deals: GameStoreDeal[];
  stores: Store[];
}

export const StoreComparisonTable: React.FC<StoreComparisonTableProps> = ({ deals, stores }) => {
  const { lang } = useLanguage();
  const t = getT(lang);

  const storeMap = useMemo(() => {
    const map = new Map<string, Store>();
    for (const s of stores) {
      map.set(s.storeID, s);
    }
    return map;
  }, [stores]);

  const sortedDeals = useMemo(() => {
    return [...deals].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  }, [deals]);

  const maxReferencePrice = useMemo(() => {
    if (sortedDeals.length === 0) return 1;
    const prices = sortedDeals.flatMap((d) => [parseFloat(d.price), parseFloat(d.retailPrice)]);
    const maxVal = Math.max(...prices.filter((n) => Number.isFinite(n)));
    return maxVal > 0 ? maxVal : 1;
  }, [sortedDeals]);

  if (sortedDeals.length === 0) {
    return (
      <div className="rounded-xl bg-[#131722] border border-white/[0.08] p-6 text-center">
        <p className="text-sm text-slate-300 font-medium">{t.table.empty}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[#131722] border border-white/[0.08] overflow-hidden">
      <div className="px-5 py-4 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">{t.table.title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.table.subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-400 tabular-nums">
          {t.table.availableStores(sortedDeals.length)}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start border-collapse">
          <thead>
            <tr className="border-b border-white/[0.07] text-xs font-semibold text-slate-400 bg-[#0F131D]">
              <th className="py-3 px-4 sm:px-5 text-start">{t.table.colStore}</th>
              <th className="py-3 px-4 text-start">{t.table.colPrice}</th>
              <th className="py-3 px-4 hidden md:table-cell text-start">{t.table.colDiscount}</th>
              <th className="py-3 px-4 w-48 lg:w-64 hidden sm:table-cell text-start">
                {t.table.colVisual}
              </th>
              <th className="py-3 px-4 sm:px-5 text-end">{t.table.colBuy}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {sortedDeals.map((deal, index) => {
              const store = storeMap.get(deal.storeID);
              const priceNum = parseFloat(deal.price) || 0;
              const retailNum = parseFloat(deal.retailPrice) || 0;
              const savingsPct = Math.round(parseFloat(deal.savings) || 0);
              const isCheapest = index === 0;
              const barPercent = Math.max(
                6,
                Math.min(100, (priceNum / maxReferencePrice) * 100)
              );

              return (
                <tr
                  key={deal.dealID}
                  className={`transition-colors hover:bg-white/[0.03] ${
                    isCheapest ? 'bg-emerald-500/[0.04]' : ''
                  }`}
                >
                  {/* Store Logo & Name */}
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-3 min-w-[140px]">
                      <div className="w-8 h-8 rounded-lg bg-[#0B0D12] border border-white/[0.08] flex items-center justify-center p-1 shrink-0">
                        {store?.images.logo || store?.images.icon ? (
                          <img
                            src={store.images.icon || store.images.logo}
                            alt={store.storeName}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 object-contain"
                          />
                        ) : (
                          <StoreIcon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white truncate">
                            {store?.storeName || t.table.storeFallback(deal.storeID)}
                          </span>
                          {isCheapest && (
                            <span className="text-[11px] font-bold text-emerald-400 whitespace-nowrap">
                              {t.table.cheapest}
                            </span>
                          )}
                        </div>
                        {savingsPct > 0 && (
                          <span className="text-xs text-emerald-400 font-mono tabular-nums md:hidden" dir="ltr">
                            -{savingsPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Current & Retail Price */}
                  <td className="py-3.5 px-4">
                    <div className="flex flex-col">
                      <span
                        className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                          isCheapest ? 'text-emerald-400' : 'text-white'
                        }`}
                        dir="ltr"
                      >
                        {formatUSD(priceNum)}
                      </span>
                      {retailNum > priceNum && (
                        <span
                          className="text-xs font-mono tabular-nums text-slate-500 line-through"
                          dir="ltr"
                        >
                          {formatUSD(retailNum)}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Discount % */}
                  <td className="py-3.5 px-4 hidden md:table-cell">
                    {savingsPct > 0 ? (
                      <span
                        className="inline-block px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 text-xs font-bold font-mono tabular-nums"
                        dir="ltr"
                      >
                        -{savingsPct}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500">{t.table.noDiscount}</span>
                    )}
                  </td>

                  {/* Visual Price Comparison Bar */}
                  <td className="py-3.5 px-4 hidden sm:table-cell">
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 rounded-full bg-[#0B0D12] overflow-hidden border border-white/[0.05]">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isCheapest ? 'bg-emerald-400' : 'bg-slate-400/70'
                          }`}
                          style={{ width: `${barPercent}%` }}
                        />
                      </div>
                      <span
                        className="text-[11px] font-mono tabular-nums text-slate-400 w-10 text-end shrink-0"
                        dir="ltr"
                      >
                        {Math.round(barPercent)}%
                      </span>
                    </div>
                  </td>

                  {/* Direct Store Button */}
                  <td className="py-3.5 px-4 sm:px-5 text-end">
                    <a
                      href={getStoreRedirectUrl(deal.dealID)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                        isCheapest
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-[#0B0D12]'
                          : 'bg-[#1A2030] hover:bg-[#232B40] text-slate-100 border border-white/[0.08]'
                      }`}
                    >
                      {t.table.goToStore}
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
