import React from 'react';
import { Tag } from 'lucide-react';
import { offerConfig } from '../offerConfig';

export const TopUrgencyBar: React.FC = () => {
  if (!offerConfig.urgency.active) {
    return null;
  }

  const urgencyText = offerConfig.urgency.date
    ? `OFERTA ESPECIAL VÁLIDA ATÉ ${offerConfig.urgency.date}`
    : offerConfig.urgency.text || 'CONDIÇÃO ESPECIAL DE LANÇAMENTO • ACESSO IMEDIATO';

  return (
    <div
      id="top-urgency-bar"
      className="w-full bg-[#B82B14] text-white flex items-center justify-center px-4 py-2 min-h-[36px] text-[11.5px] sm:text-[13px] font-bold tracking-wider text-center sticky top-0 z-40 shadow-xs uppercase"
    >
      <div className="flex items-center justify-center gap-2 max-w-5xl mx-auto">
        <Tag className="w-3.5 h-3.5 flex-shrink-0" />
        <span id="urgency-banner-text">{urgencyText}</span>
      </div>
    </div>
  );
};

