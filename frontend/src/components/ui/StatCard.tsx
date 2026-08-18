'use client';

import React from 'react';
import { typography, cardTokens } from '@/lib/design-tokens';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  iconBg?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  label,
  value,
  subtext,
  iconBg = 'bg-blue-50 text-blue-600 border border-blue-100',
  onClick,
  className = '',
}) => {
  const CardWrapper = onClick ? 'button' : 'div';

  return (
    <CardWrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`${cardTokens.kpi} ${onClick ? 'cursor-pointer hover:border-slate-300 transition-all text-left w-full' : ''} ${className}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className={typography.displayStat}>{value}</p>
        <p className={`${typography.labelMicro} mt-1 truncate`}>{label}</p>
        {subtext && (
          <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">{subtext}</p>
        )}
      </div>
    </CardWrapper>
  );
};
