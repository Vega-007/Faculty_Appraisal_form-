'use client';

import React from 'react';
import { getStatusStyle } from '@/lib/design-tokens';

interface StatusPillProps {
  status: string;
  showDot?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  showDot = false,
  className = '',
  size = 'md',
}) => {
  const { classes, dotColor, label } = getStatusStyle(status);

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 h-5 font-semibold'
    : 'text-xs px-2.5 py-1 h-6 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs select-none whitespace-nowrap ${classes} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 animate-pulse`} />
      )}
      <span>{label}</span>
    </span>
  );
};
