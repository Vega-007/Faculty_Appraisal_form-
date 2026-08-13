'use client';

import React from 'react';
import { UserRole, MonthlyWindow, MockUser } from '@/types/appraisal';
import { ChevronDown, Circle, LogOut, GraduationCap, ShieldCheck } from 'lucide-react';

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
    if (role === 'TEACHER') return 'Faculty';
    if (role === 'HOD') return 'HOD Reviewer';
    if (role === 'HOI') return 'Head of Institution';
    return 'Admin / Chairman';
  };

  const roleBadgeClass = (role: UserRole) => {
    if (role === 'TEACHER') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (role === 'HOD') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (role === 'HOI') return 'bg-purple-50 text-purple-700 border-purple-200';
    return 'bg-amber-50 text-amber-800 border-amber-200';
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm py-2">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-8 h-20 sm:h-22 flex items-center justify-between gap-4 sm:gap-8">

        {/* Official SRM Campus Logo & Name Branding */}
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          <div className="h-14 sm:h-16 flex items-center shrink-0">
            <img
              src="/srm_ramapuram-removebg-preview.svg"
              alt="SRM Institute of Science and Technology Logo"
              className="h-12 sm:h-14 w-auto object-contain max-h-14 shrink-0"
            />
          </div>
          <div className="h-10 w-[1.5px] bg-slate-200 hidden md:block"></div>
          <div className="leading-tight hidden md:block">
            <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight block">
              SRM INSTITUTE OF SCIENCE AND TECHNOLOGY
            </span>
            <p className="text-xs text-slate-500 font-extrabold mt-0.5 tracking-wide">
              Faculty Performance &amp; Analytics Portal
            </p>
          </div>
        </div>


        {/* Center: Month Selection + Submission Window Status */}
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="relative flex items-center">
            <select
              value={activeMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-slate-900 text-xs sm:text-sm font-black rounded-xl pl-4 pr-9 py-2.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
            >
              {windows.map((w) => (
                <option key={w.monthYear} value={w.monthYear}>
                  {w.monthYear}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>

          {isOpen ? (
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-full shadow-2xs">
              <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 animate-pulse" />
              <span>Window Open</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-black bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2.5 rounded-full shadow-2xs">
              <Circle className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
              <span>Window Locked</span>
            </span>
          )}
        </div>

        {/* Right: User Profile & Logout */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-900 font-black text-base flex items-center justify-center border-2 border-blue-200 shadow-2xs select-none shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="hidden xl:block text-right">
              <p className="text-xs sm:text-sm font-black text-slate-900 leading-none">{user.name}</p>
              <p className="text-[13px] text-slate-500 font-mono font-extrabold mt-1">{user.empId}</p>
            </div>
          </div>
          <span className={`text-xs font-black px-3.5 py-2 rounded-xl border hidden sm:inline-block ${roleBadgeClass(user.role)}`}>
            {roleLabel(user.role)}
          </span>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-xs sm:text-sm font-black text-slate-700 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 px-4 py-2.5 rounded-xl border border-slate-200 hover:border-rose-200 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

      </div>
    </header>

  );
};
