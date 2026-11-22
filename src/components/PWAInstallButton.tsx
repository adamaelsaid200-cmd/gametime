import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Monitor,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';

interface PWAInstallButtonProps {
  variant?: 'navbar' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'navbar',
}) => {
  const { lang } = useLanguage();
  const t = getT(lang);

  const { isInstallable, isInstalled, isIOS, isInIframe, install } =
    usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [copied, setCopied] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome !== 'accepted') {
        return;
      }
      return;
    }
    setShowGuide(true);
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback ignored if clipboard permissions are restricted
    }
  };

  return (
    <>
      {variant === 'navbar' ? (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          aria-label={t.pwa.ariaInstall}
        >
          <Download className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{t.pwa.installFull}</span>
          <span className="sm:hidden">{t.pwa.installShort}</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-[#0B0D12] bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{t.pwa.installBanner}</span>
        </button>
      )}

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          onClick={() => setShowGuide(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-[#131824] border border-white/[0.1] p-6 shadow-2xl text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Download className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3
                    id="pwa-install-title"
                    className="text-base font-bold text-white"
                  >
                    {t.pwa.modalTitle}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {t.pwa.modalSubtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                aria-label={t.pwa.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              {isInIframe && (
                <div className="rounded-xl bg-amber-500/10 border border-amber-500/25 p-3.5 text-xs text-amber-200 leading-relaxed">
                  {t.pwa.iframeWarning}
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-100 font-semibold transition-colors cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          {t.pwa.copied}
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          {t.pwa.copyUrl}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {isIOS ? (
                <div className="rounded-xl bg-[#0B0D12] border border-white/[0.08] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" aria-hidden="true" />
                    <span>{t.pwa.iosTitle}</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-300 leading-relaxed">
                    <li>
                      {t.pwa.iosStep1Prefix}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/[0.08] text-white font-semibold">
                        <Share className="w-3 h-3" aria-hidden="true" />
                        Share
                      </span>
                      {t.pwa.iosStep1Suffix}
                    </li>
                    <li>
                      {t.pwa.iosStep2Prefix}
                      <strong className="text-white">{t.pwa.iosStep2Bold}</strong>.
                    </li>
                    <li>
                      {t.pwa.iosStep3Prefix}
                      <strong className="text-white">{t.pwa.iosStep3Bold}</strong>
                      {t.pwa.iosStep3Suffix}
                    </li>
                  </ol>
                </div>
              ) : (
                <>
                  <div className="rounded-xl bg-[#0B0D12] border border-white/[0.08] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Smartphone className="w-4 h-4" aria-hidden="true" />
                      <span>{t.pwa.androidTitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.pwa.androidDesc1}
                      <strong className="text-white">{t.pwa.androidBold1}</strong>
                      {t.pwa.androidOr}
                      <strong className="text-white">{t.pwa.androidBold2}</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#0B0D12] border border-white/[0.08] p-4 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Monitor className="w-4 h-4" aria-hidden="true" />
                      <span>{t.pwa.desktopTitle}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {t.pwa.desktopDesc1}
                      <strong className="text-white">{t.pwa.desktopBold1}</strong>
                      {t.pwa.desktopDesc2}
                      <strong className="text-white">{t.pwa.desktopBold2}</strong>.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-white/[0.08] hover:bg-white/[0.12] py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              {t.pwa.gotIt}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
