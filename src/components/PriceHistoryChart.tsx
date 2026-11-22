import React, { useMemo, useState } from 'react';
import { TrendingDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { formatIsoDateDDMMYYYY, formatUSD } from '../services/cheapshark';
import { PriceHistoryPoint } from '../types/cheapshark';

interface PriceHistoryChartProps {
  history: PriceHistoryPoint[];
  cheapestEverPrice: number | null;
  isTracked: boolean;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  history,
  cheapestEverPrice,
  isTracked,
}) => {
  const { lang } = useLanguage();
  const t = getT(lang);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    const width = 760;
    const height = 240;
    const padLeft = 56;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 38;
    const innerW = width - padLeft - padRight;
    const innerH = height - padTop - padBottom;

    const prices = history.map((p) => p.price);
    if (cheapestEverPrice !== null && Number.isFinite(cheapestEverPrice)) {
      prices.push(cheapestEverPrice);
    }

    const rawMin = Math.min(...prices);
    const rawMax = Math.max(...prices);
    const spread = Math.max(rawMax - rawMin, rawMax * 0.2, 2);
    const yMin = Math.max(0, rawMin - spread * 0.15);
    const yMax = rawMax + spread * 0.15;
    const yRange = yMax - yMin || 1;

    const getX = (idx: number) => {
      if (history.length === 1) return padLeft + innerW / 2;
      return padLeft + (idx / (history.length - 1)) * innerW;
    };

    const getY = (val: number) => {
      return padTop + innerH - ((val - yMin) / yRange) * innerH;
    };

    const points = history.map((pt, idx) => ({
      ...pt,
      x: getX(idx),
      y: getY(pt.price),
      formattedDate: formatIsoDateDDMMYYYY(pt.date),
    }));

    const linePath = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(' ');

    const areaPath =
      points.length > 1
        ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
        : '';

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
      const value = yMin + ratio * yRange;
      return {
        value,
        y: getY(value),
      };
    });

    const cheapestLineY =
      cheapestEverPrice !== null && Number.isFinite(cheapestEverPrice)
        ? getY(cheapestEverPrice)
        : null;

    return {
      width,
      height,
      padLeft,
      padRight,
      padTop,
      padBottom,
      innerW,
      innerH,
      points,
      linePath,
      areaPath,
      yTicks,
      cheapestLineY,
    };
  }, [history, cheapestEverPrice]);

  if (!isTracked || !chartData) {
    return (
      <div className="rounded-xl bg-[#131722] border border-white/[0.08] p-6">
        <div className="flex items-center gap-2.5 mb-2">
          <TrendingDown className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h3 className="text-base font-bold text-white">{t.chart.emptyTitle}</h3>
        </div>
        <p className="text-sm text-slate-400 leading-relaxed">
          {t.chart.emptyHintPrefix}
          <span className="text-white font-semibold">{t.chart.emptyHintAction}</span>
          {t.chart.emptyHintSuffix}
        </p>
      </div>
    );
  }

  const activePoint =
    hoveredIndex !== null ? chartData.points[hoveredIndex] : chartData.points[chartData.points.length - 1];

  return (
    <div className="rounded-xl bg-[#131722] border border-white/[0.08] p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            <h3 className="text-base font-bold text-white">{t.chart.title}</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">{t.chart.subtitle(history.length)}</p>
        </div>

        {activePoint && (
          <div className="flex items-center gap-4 px-3.5 py-2 rounded-lg bg-[#0B0D12] border border-white/[0.07] text-xs">
            <div>
              <span className="text-slate-400 me-1.5">{t.chart.dateLabel}</span>
              <span className="font-mono tabular-nums text-slate-200" dir="ltr">
                {activePoint.formattedDate}
              </span>
            </div>
            <span className="text-slate-700">|</span>
            <div>
              <span className="text-slate-400 me-1.5">{t.chart.priceLabel}</span>
              <span className="font-mono font-bold tabular-nums text-emerald-400" dir="ltr">
                {formatUSD(activePoint.price)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="w-full overflow-x-auto" dir="ltr">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label={t.chart.ariaLabel}
        >
          <defs>
            <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-Axis Labels */}
          {chartData.yTicks.map((tick, idx) => (
            <g key={idx}>
              <line
                x1={chartData.padLeft}
                y1={tick.y}
                x2={chartData.width - chartData.padRight}
                y2={tick.y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="1"
              />
              <text
                x={chartData.padLeft - 10}
                y={tick.y + 4}
                textAnchor="end"
                fill="#94A3B8"
                fontSize="11"
                fontFamily="IBM Plex Mono, monospace"
              >
                ${tick.value.toFixed(2)}
              </text>
            </g>
          ))}

          {/* Historical Lowest Reference Line */}
          {chartData.cheapestLineY !== null && cheapestEverPrice !== null && (
            <g>
              <line
                x1={chartData.padLeft}
                y1={chartData.cheapestLineY}
                x2={chartData.width - chartData.padRight}
                y2={chartData.cheapestLineY}
                stroke="#F59E0B"
                strokeWidth="1.25"
                strokeDasharray="5 5"
                opacity="0.75"
              />
              <text
                x={chartData.width - chartData.padRight}
                y={chartData.cheapestLineY - 6}
                textAnchor="end"
                fill="#FBBF24"
                fontSize="10.5"
                fontFamily="Cairo, sans-serif"
              >
                {t.chart.historicalLowAnnotation(formatUSD(cheapestEverPrice))}
              </text>
            </g>
          )}

          {/* Area Fill */}
          {chartData.areaPath && (
            <path d={chartData.areaPath} fill="url(#priceAreaGradient)" />
          )}

          {/* Line Path */}
          {chartData.points.length > 1 && (
            <path
              d={chartData.linePath}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Data Points & Interactive Hover Zones */}
          {chartData.points.map((pt, idx) => {
            const isHovered = hoveredIndex === idx;
            return (
              <g key={pt.date}>
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={chartData.padTop}
                    x2={pt.x}
                    y2={chartData.padTop + chartData.innerH}
                    stroke="rgba(16, 185, 129, 0.35)"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4.5}
                  fill="#10B981"
                  stroke="#0B0D12"
                  strokeWidth="2"
                />
                {/* X-axis label for first, middle, last or single */}
                {(chartData.points.length <= 5 ||
                  idx === 0 ||
                  idx === chartData.points.length - 1 ||
                  idx === Math.floor(chartData.points.length / 2)) && (
                  <text
                    x={pt.x}
                    y={chartData.height - 10}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="10.5"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {pt.formattedDate}
                  </text>
                )}
                {/* Invisible wider hit target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="18"
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(idx)}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
