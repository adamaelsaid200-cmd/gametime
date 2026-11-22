import React from 'react';
import { WifiOff } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const { lang } = useLanguage();
  const t = getT(lang);
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 start-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500/95 backdrop-blur-sm px-3.5 py-2 text-xs font-bold text-[#0B0D12] shadow-xl border border-amber-300/40"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{t.pwa.offlineText}</span>
    </div>
  );
};
