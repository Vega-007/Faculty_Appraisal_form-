/**
 * SRM Faculty Performance & Analytics Portal — Design System Tokens
 * Single Source of Truth for Colors, Typography, Spacing, Buttons, and Statuses.
 */

export const colors = {
  // 1 Primary Brand Color (SRM Royal Blue)
  brand: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb', // Core interactive & primary action
    700: '#1d4ed8', // Hover / active
    800: '#1e40af', // Deep brand accent
    900: '#1e3a8a', // Dark header / brand text
    950: '#0f172a',
  },

  // 1 Neutral Scale (Slate Gray ~90% of UI canvas, text, borders)
  neutral: {
    0: '#ffffff',
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },

  // Semantic Status & Performance Colors (Strictly 4 sets)
  semantic: {
    // 1. Success / Grade A / Approved / Window Open / Enabled
    success: {
      base: '#059669', // emerald-600
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-800',
      badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      hover: 'hover:bg-emerald-100',
      fill: '#059669',
    },

    // 2. Warning / Grade B / Draft / Pending Review
    warning: {
      base: '#d97706', // amber-600
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      hover: 'hover:bg-amber-100',
      fill: '#d97706',
    },

    // 3. Danger / Grade C / Revision Requested / Locked / Rejected
    danger: {
      base: '#dc2626', // rose-600 / red-600
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-800',
      badge: 'bg-rose-50 text-rose-800 border-rose-200',
      hover: 'hover:bg-rose-100',
      fill: '#dc2626',
    },

    // 4. Info / Submitted / In Review
    info: {
      base: '#2563eb', // blue-600
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-50 text-blue-800 border-blue-200',
      hover: 'hover:bg-blue-100',
      fill: '#2563eb',
    },
  },
} as const;

/**
 * Standardized Typography Roles
 */
export const typography = {
  // Big Stat Numbers (KPI cards, modal summary counts)
  displayStat: 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 leading-none',
  displayStatSm: 'text-xl sm:text-2xl font-bold tracking-tight text-slate-900 leading-none',

  // Heading 1: Main page headers & primary modal titles
  h1: 'text-lg sm:text-xl font-bold text-slate-900 tracking-tight',

  // Heading 2: Section headers & card titles
  h2: 'text-base font-semibold text-slate-900 tracking-tight',

  // Heading 3: Subsections, matrix category headers
  h3: 'text-sm font-semibold text-slate-800',

  // Body: Standard paragraphs and table cells
  body: 'text-sm font-normal text-slate-700 leading-normal',
  bodyMedium: 'text-sm font-medium text-slate-800 leading-normal',

  // Caption / Secondary Body: Metadata, timestamps, helper text
  caption: 'text-xs font-medium text-slate-500',

  // Micro Labels: Stat card titles, table column headers (uppercase)
  labelMicro: 'text-[11px] font-bold uppercase tracking-wider text-slate-500',
} as const;

/**
 * Button Styles (3 core variants + semantic danger/success)
 */
export const buttonVariants = {
  primary: 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] sm:min-h-[36px]',
  secondary: 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-sm font-medium rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] sm:min-h-[36px]',
  ghost: 'inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-sm font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
  danger: 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] sm:min-h-[36px]',
  success: 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed min-h-[38px] sm:min-h-[36px]',
} as const;

/**
 * Standard Card & Panel Layouts
 */
export const cardTokens = {
  base: 'bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs',
  kpi: 'bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center gap-3.5',
  interactive: 'bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 transition-all shadow-xs hover:shadow-sm cursor-pointer',
} as const;

/**
 * Standard Table Utilities
 */
export const tableTokens = {
  th: 'bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-left border-b border-slate-200 select-none',
  thCenter: 'bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-center border-b border-slate-200 select-none',
  thRight: 'bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider px-4 py-3 text-right border-b border-slate-200 select-none',
  td: 'px-4 py-3.5 text-sm text-slate-700 align-middle border-b border-slate-100',
  tdCenter: 'px-4 py-3.5 text-sm text-slate-700 text-center align-middle border-b border-slate-100',
  tdRight: 'px-4 py-3.5 text-sm text-slate-700 text-right align-middle border-b border-slate-100',
  tr: 'hover:bg-slate-50/80 transition-colors',
  trSelected: 'bg-blue-50/40 hover:bg-blue-50/60 transition-colors',
} as const;

/**
 * Status Mapping Helper
 */
export type NormalizedStatus = 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'HOI_APPROVED' | 'LOCKED' | 'WINDOW_OPEN' | 'WINDOW_LOCKED' | 'ENABLED';

export function getStatusStyle(status: string) {
  const norm = status?.toUpperCase().replace(/\s+/g, '_') || 'DRAFT';
  switch (norm) {
    case 'HOD_APPROVED':
    case 'HOI_APPROVED':
    case 'APPROVED':
    case 'WINDOW_OPEN':
    case 'ENABLED':
      return {
        classes: `${colors.semantic.success.badge} whitespace-nowrap`,
        dotColor: 'bg-emerald-500',
        label: norm.replace(/_/g, ' '),
      };
    case 'SUBMITTED':
    case 'IN_REVIEW':
      return {
        classes: `${colors.semantic.info.badge} whitespace-nowrap`,
        dotColor: 'bg-blue-500',
        label: 'SUBMITTED',
      };
    case 'DRAFT':
    case 'PENDING':
    case 'PENDING_REVIEW':
      return {
        classes: `${colors.semantic.warning.badge} whitespace-nowrap`,
        dotColor: 'bg-amber-500',
        label: 'DRAFT',
      };
    case 'LOCKED':
    case 'WINDOW_LOCKED':
    case 'REVISION_REQUESTED':
    case 'REJECTED':
      return {
        classes: `${colors.semantic.danger.badge} whitespace-nowrap`,
        dotColor: 'bg-rose-500',
        label: norm.replace(/_/g, ' '),
      };
    default:
      return {
        classes: 'bg-slate-100 text-slate-700 border-slate-200 whitespace-nowrap',
        dotColor: 'bg-slate-400',
        label: norm.replace(/_/g, ' '),
      };
  }
}

/**
 * Grade Mapping Helper
 */
export function getGradeStyle(grade: string) {
  const norm = grade?.toUpperCase().trim() || 'GRADE C';
  if (norm.includes('GRADE A') || norm === 'A') {
    return {
      classes: `${colors.semantic.success.badge} whitespace-nowrap`,
      textClass: 'text-emerald-800',
      label: 'Grade A',
      border: 'border-emerald-200',
      bg: 'bg-emerald-50',
    };
  } else if (norm.includes('GRADE B') || norm === 'B') {
    return {
      classes: `${colors.semantic.warning.badge} whitespace-nowrap`,
      textClass: 'text-amber-800',
      label: 'Grade B',
      border: 'border-amber-200',
      bg: 'bg-amber-50',
    };
  } else {
    return {
      classes: `${colors.semantic.danger.badge} whitespace-nowrap`,
      textClass: 'text-rose-800',
      label: 'Grade C',
      border: 'border-rose-200',
      bg: 'bg-rose-50',
    };
  }
}
