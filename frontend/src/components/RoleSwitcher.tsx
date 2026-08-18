'use client';

import React from 'react';
import { UserRole, MonthlyWindow, MockUser } from '@/types/appraisal';
import { ChevronDown, LogOut } from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';
import { typography } from '@/lib/design-tokens';

interface AppHeaderProps {
  user: MockUser;
  activeMonth: string;
  onMonthChange: (month: string) => void;
  windows: MonthlyWindow[];
  onLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  user,
  activeMonth,
  onMonthChange,
  windows,
  onLogout,
}) => {
  const activeWin = windows.find((w) => w.monthYear === activeMonth);
  const isOpen = activeWin ? activeWin.isOpen : false;

  const roleLabel = (role: UserRole) => {
    if (role === 'TEACHER') return 'Faculty Member';
    if (role === 'HOD') return 'HOD Reviewer';
    if (role === 'HOI') return 'Head of Institution';
    return 'Admin / Chairman';
  };

  const roleBadgeClass = (role: UserRole) => {
    if (role === 'TEACHER') return 'bg-blue-50 text-blue-800 border-blue-200';
    if (role === 'HOD') return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    if (role === 'HOI') return 'bg-purple-50 text-purple-800 border-purple-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-2xs py-1.5 sm:py-2 shrink-0">
      <div className="max-w-screen-2xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6 min-w-0">

        {/* Official SRM Campus Logo & Name Branding */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0 min-w-0">
          <div className="flex items-center shrink-0">
            <img
              src="/srm_ramapuram_website_ready-cropped.svg"
              alt="SRM Institute of Science and Technology Logo"
              className="h-8 sm:h-12 w-auto object-contain max-h-12 shrink-0"
            />
          </div>
          <div className="h-7 w-[1.5px] bg-slate-200 hidden md:block shrink-0" />
          <div className="leading-tight hidden md:block min-w-0">
            <span className="text-xs sm:text-sm sm:text-base font-bold text-slate-900 tracking-tight block truncate">
              Faculty Performance &amp; Analytics Portal
            </span>
          </div>
        </div>

        {/* Center: Month Selection + Submission Window Status */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center shrink-0">
            <select
              value={activeMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-semibold rounded-xl pl-2.5 pr-7 sm:pl-3 sm:pr-8 py-1.5 sm:py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
            >
              {windows.map((w) => (
                <option key={w.monthYear} value={w.monthYear}>
                  {w.monthYear}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 sm:right-2.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          </div>

          <StatusPill
            status={isOpen ? 'WINDOW_OPEN' : 'WINDOW_LOCKED'}
            showDot={true}
            size="sm"
          />
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-100 text-blue-900 font-bold text-xs sm:text-sm flex items-center justify-center border border-blue-200 shadow-2xs select-none shrink-0"
              title={`${user.name} (${user.empId})`}
            >
              {user.name.charAt(0)}
            </div>
            <div className="hidden lg:block text-right leading-tight min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate max-w-[140px]">{user.name}</p>
              <p className="text-[11px] text-slate-500 font-mono font-medium mt-0.5">{user.empId}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-lg border hidden md:inline-block ${roleBadgeClass(user.role)}`}>
            {roleLabel(user.role)}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={onLogout}
            icon={<LogOut className="w-3.5 h-3.5" />}
            className="hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 px-2 sm:px-3"
            title="Sign Out of Portal"
          >
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>

      </div>
    </header>
  );
};
