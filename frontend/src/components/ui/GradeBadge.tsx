'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { getGradeStyle } from '@/lib/design-tokens';

interface GradeBadgeProps {
  grade: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

export const GradeBadge: React.FC<GradeBadgeProps> = ({
  grade,
  onClick,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const { classes, label } = getGradeStyle(grade);

  const sizeClasses = size === 'sm'
    ? 'text-[11px] px-2 py-0.5 rounded-full font-bold'
    : 'text-xs px-3 py-1 rounded-full font-bold';

  const interactiveClasses = onClick
    ? 'cursor-pointer hover:opacity-90 active:scale-95 transition-all shadow-2xs'
    : 'select-none';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`inline-flex items-center gap-1.5 border ${classes} ${sizeClasses} ${interactiveClasses} ${className}`}
      title={onClick ? `View ${label} details & report` : label}
    >
      {showIcon && <Award className="w-3.5 h-3.5 shrink-0" />}
      <span>{label}</span>
    </button>
  );
};
