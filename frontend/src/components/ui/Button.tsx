'use client';

import React from 'react';
import { buttonVariants } from '@/lib/design-tokens';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px] rounded-lg',
    md: 'text-sm px-4 py-2 min-h-[38px] sm:min-h-[36px] rounded-xl',
    lg: 'text-base px-5 py-2.5 min-h-[44px] rounded-xl',
  }[size];

  return (
    <button
      type={props.type || 'button'}
      className={`${buttonVariants[variant]} ${sizeClasses} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
};
