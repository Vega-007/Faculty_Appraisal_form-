'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { UserRole, MockUser } from '@/types/appraisal';
import { MOCK_USERS } from '@/lib/initialData';
import {
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  ShieldCheck,
  Building2,
  Sparkles,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Award,
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: MockUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('TEACHER');
  const [selectedUserEmpId, setSelectedUserEmpId] = useState<string>('T1037');

  const [empIdInput, setEmpIdInput] = useState<string>('T1037');
  const [password, setPassword] = useState<string>('teacher123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /* ── 1. Dependent Faculty Users (Role = TEACHER) ── */
  const availableFaculty = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role === 'TEACHER');
  }, []);

  /* ── 2. Dependent HOD Users (Role = HOD) ── */
  const availableHods = useMemo(() => {
    return MOCK_USERS.filter((u) => u.role === 'HOD');
  }, []);

  /* ── 3. Selected User Metadata Object ── */
  const currentUser = useMemo(() => {
    return MOCK_USERS.find((u) => u.empId.toUpperCase() === selectedUserEmpId.toUpperCase()) || MOCK_USERS[0];
  }, [selectedUserEmpId]);

  /* ── Role Switcher Reset ── */
  useEffect(() => {
    if (selectedRole === 'TEACHER') {
      const first = availableFaculty[0] || MOCK_USERS.find((u) => u.role === 'TEACHER');
      if (first) {
        setSelectedUserEmpId(first.empId);
        setEmpIdInput(first.empId);
        setPassword('teacher123');
      }
    } else if (selectedRole === 'HOD') {
      const first = availableHods[0] || MOCK_USERS.find((u) => u.role === 'HOD');
      if (first) {
        setSelectedUserEmpId(first.empId);
        setEmpIdInput(first.empId);
        setPassword('hod123');
      }
    } else if (selectedRole === 'HOI') {
      const hoi = MOCK_USERS.find((u) => u.role === 'HOI') || MOCK_USERS[0];
      setSelectedUserEmpId(hoi.empId);
      setEmpIdInput(hoi.empId);
      setPassword('hoi123');
    } else if (selectedRole === 'ADMIN_CHAIRMAN') {
      const admin = MOCK_USERS.find((u) => u.role === 'ADMIN_CHAIRMAN') || MOCK_USERS[0];
      setSelectedUserEmpId(admin.empId);
      setEmpIdInput(admin.empId);
      setPassword('admin123');
    }
  }, [selectedRole, availableFaculty, availableHods]);

  /* ── Handle Selecting a Faculty or HOD Name from Dropdown ── */
  const handleUserSelect = (empId: string) => {
    setSelectedUserEmpId(empId);
    setEmpIdInput(empId);
    const u = MOCK_USERS.find((x) => x.empId === empId);
    if (u) {
      setPassword(u.password || (u.role === 'HOD' ? 'hod123' : 'teacher123'));
    }
  };

  /* ── Form Submit Handler ── */
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const match = MOCK_USERS.find(
        (u) => u.empId.toUpperCase() === empIdInput.toUpperCase()
      );

      if (match) {
        onLogin(match);
      } else if (currentUser) {
        onLogin(currentUser);
      } else {
        setError('Invalid Employee ID or password. Please check your credentials.');
        setIsLoading(false);
      }
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* ── TOP MINIMALIST INSTITUTIONAL HEADER BAR ── */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 sm:px-12 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-5 shrink-0">
          <div className="h-14 sm:h-16 flex items-center shrink-0">
            <img
              src="/srm_ramapuram-removebg-preview.svg"
              alt="SRM Institute of Science and Technology"
              className="h-12 sm:h-14 w-auto object-contain max-h-14 shrink-0"
            />
          </div>
          <div className="h-10 w-[1.5px] bg-slate-200 hidden sm:block"></div>
          <div className="hidden sm:block leading-tight">
            <span className="text-sm sm:text-base font-black text-slate-900 tracking-tight block">
              SRM INSTITUTE OF SCIENCE AND TECHNOLOGY
            </span>
            <p className="text-xs text-slate-500 font-extrabold mt-0.5 tracking-wide">
              Faculty Performance &amp; Analytics Portal
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-200">
            Institutional Portal 2025
          </span>
        </div>
      </header>


      {/* ── CENTERED MINIMALIST LOGIN PORTAL ── */}
      <main className="flex-1 flex items-center justify-center p-6 my-6">
        <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-7 sm:p-9 shadow-xl shadow-slate-200/50 space-y-6">
          
          {/* Card Header & Branding */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto shadow-md">
              <GraduationCap className="w-6 h-6 text-blue-400" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sign In to Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Role-Based Authentication &amp; Institutional Governance
            </p>
          </div>

          {/* 1. ROLE SWITCHER TABS */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
              Select Login Role
            </label>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80">
              {(
                [
                  { role: 'TEACHER', label: 'Faculty', icon: UserCheck },
                  { role: 'HOD', label: 'HOD', icon: Briefcase },
                  { role: 'HOI', label: 'HOI / Dean', icon: GraduationCap },
                  { role: 'ADMIN_CHAIRMAN', label: 'Chairman', icon: ShieldCheck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const isActive = selectedRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => setSelectedRole(item.role)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-black transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. DEMO PROFILE SELECTOR DROPDOWN */}
          {(selectedRole === 'TEACHER' || selectedRole === 'HOD') && (
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Select Faculty Profile</span>
                <span className="text-xs text-blue-700 font-bold">
                  {selectedRole === 'TEACHER' ? `${availableFaculty.length} Members` : `${availableHods.length} HODs`}
                </span>
              </label>

              <div className="relative">
                <select
                  value={selectedUserEmpId}
                  onChange={(e) => handleUserSelect(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-3 appearance-none outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  {selectedRole === 'TEACHER'
                    ? availableFaculty.map((f) => (
                        <option key={f.empId} value={f.empId}>
                          {f.name} ({f.empId}) — {f.department}
                        </option>
                      ))
                    : availableHods.map((h) => (
                        <option key={h.empId} value={h.empId}>
                          {h.name} ({h.empId}) — {h.department}
                        </option>
                      ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

          {/* ACTIVE USER METADATA CARD */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
              <span className="text-slate-400 font-bold text-xs uppercase">Active User Profile:</span>
              <span className="font-extrabold text-slate-900">{currentUser.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[13px]">
              <div>
                <span className="text-slate-400 block text-xs">Employee ID:</span>
                <span className="font-mono font-bold text-slate-800">{currentUser.empId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-xs">Department:</span>
                <span className="font-semibold text-slate-800 truncate block">{currentUser.department}</span>
              </div>
            </div>
            {currentUser.reportingHodName && (
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs mt-1">
                <span className="text-blue-800 font-bold text-xs">Reporting HOD:</span>
                <span className="font-extrabold text-blue-900">{currentUser.reportingHodName}</span>
              </div>
            )}
          </div>

          {/* 3. LOGIN FORM INPUTS */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold p-3 rounded-2xl">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                Employee ID Code
              </label>
              <input
                type="text"
                required
                value={empIdInput}
                onChange={(e) => setEmpIdInput(e.target.value)}
                className="w-full text-xs font-mono font-bold text-slate-900 border border-slate-200 rounded-2xl px-4 py-3 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                placeholder="Enter Employee ID"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs font-medium text-slate-900 border border-slate-200 rounded-2xl px-4 py-3 pr-11 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="Enter Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold py-3.5 rounded-2xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Authenticating...</span>
              ) : (
                <span>Sign In as {currentUser.name}</span>
              )}
            </button>

          </form>

        </div>
      </main>

      {/* ── MINIMALIST INSTITUTIONAL FOOTER ── */}
      <footer className="border-t border-slate-200 py-4 text-center text-xs font-medium text-slate-400 bg-white/80 backdrop-blur-md">
        SRM Institute of Science and Technology &bull; Faculty Performance Portal System &bull; All Rights Reserved
      </footer>

    </div>
  );
};
