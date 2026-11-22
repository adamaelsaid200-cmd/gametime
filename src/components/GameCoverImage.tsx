import React, { useMemo, useState } from 'react';
import { Gamepad2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { getT } from '../i18n/translations';
import { getGameCoverCandidates } from '../services/cheapshark';

interface GameCoverImageProps {
  title: string;
  steamAppID?: string | null;
  thumb?: string | null;
  className?: string;
  aspectClassName?: string;
}

export const GameCoverImage: React.FC<GameCoverImageProps> = ({
  title,
  steamAppID,
  thumb,
  className = '',
  aspectClassName = 'aspect-[16/9]',
}) => {
  const { lang } = useLanguage();
  const t = getT(lang);

  const candidates = useMemo(
    () => getGameCoverCandidates(steamAppID, thumb),
    [steamAppID, thumb]
  );

  const [attemptIndex, setAttemptIndex] = useState(0);

  const currentSrc = candidates[attemptIndex];

  const handleError = () => {
    setAttemptIndex((prev) => prev + 1);
  };

  if (!currentSrc) {
    return (
      <div
        className={`relative w-full overflow-hidden bg-gradient-to-br from-[#161B28] via-[#111520] to-[#0B0D12] flex flex-col items-center justify-center p-4 text-center ${aspectClassName} ${className}`}
      >
        <Gamepad2 className="w-8 h-8 text-slate-500 mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-400 line-clamp-2 max-w-[85%]">
          {title}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative w-full overflow-hidden bg-[#131722] ${aspectClassName} ${className}`}>
      <img
        key={currentSrc}
        src={currentSrc}
        alt={t.cover.alt(title)}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={handleError}
        className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
      />
    </div>
  );
};
