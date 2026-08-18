'use client';

import React, { useState, useEffect } from 'react';
import { AppraisalRecord, MonthlyWindow, AuditLog, MockUser } from '@/types/appraisal';
import { initialWindows, initialAuditLogs, initialAppraisals, createEmptyAppraisal, MOCK_USERS } from '@/lib/initialData';
import {
  fetchWindows,
  toggleWindowApi,
  fetchAppraisalsApi,
  saveAppraisalApi,
  fetchAuditLogsApi,
  logAuditEventApi,
} from '@/lib/api';
import { LoginPage } from '@/components/LoginPage';
import { AppHeader } from '@/components/RoleSwitcher';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TeacherView } from '@/components/roles/TeacherView';
import { HodView } from '@/components/roles/HodView';
import { HoiView } from '@/components/roles/HoiView';
import { AdminChairmanView } from '@/components/roles/AdminChairmanView';

export default function Home() {
  const [loggedInUser, setLoggedInUser] = useState<MockUser | null>(null);
  const [activeMonth, setActiveMonth] = useState<string>('January 2026');
  const [windows, setWindows] = useState<MonthlyWindow[]>(initialWindows);
  const [appraisals, setAppraisals] = useState<AppraisalRecord[]>(initialAppraisals);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);

  /* ── Load initial data from API ── */
  useEffect(() => {
    async function loadData() {
      try {
        const wins = await fetchWindows();
        setWindows(wins);
        const logs = await fetchAuditLogsApi();
        setAuditLogs(logs);
        const dbAppraisals = await fetchAppraisalsApi();
        const validEmpIds = new Set(MOCK_USERS.map((u) => u.empId));
        const cleanAppraisals = dbAppraisals.filter((a) => validEmpIds.has(a.empId));
        if (cleanAppraisals.length > 0) {
          setAppraisals(cleanAppraisals);
        } else {
          setAppraisals(initialAppraisals);
        }
      } catch (err) {
        console.warn('[page] API load failed — using local seed data.', err);
        setAppraisals(initialAppraisals);
      }
    }
    loadData();
  }, []);

  /* ── Login / Logout ── */
  const handleLogin = (user: MockUser) => {
    setLoggedInUser(user);

    // If teacher, ensure populated appraisal exists for them and map reporting HOD
    if (user.role === 'TEACHER') {
      setAppraisals((prev) => {
        const existing = prev.find(
          (a) => a.empId === user.empId && a.monthYear === activeMonth
        );
        if (existing) {
          if (!existing.generalDetails.reportingHodName && user.reportingHodName) {
            const updatedRec = {
              ...existing,
              generalDetails: {
                ...existing.generalDetails,
                reportingHodName: user.reportingHodName,
              },
            };
            saveAppraisalApi(updatedRec);
            return prev.map((a) => (a.id === existing.id ? updatedRec : a));
          }
          return prev;
        }
        const seedMatch = initialAppraisals.find((s) => s.empId === user.empId);
        if (seedMatch) {
          const formatted = {
            ...seedMatch,
            monthYear: activeMonth,
            generalDetails: {
              ...seedMatch.generalDetails,
              reportingHodName: user.reportingHodName || seedMatch.generalDetails.reportingHodName || '',
            },
          };
          saveAppraisalApi(formatted);
          return [...prev, formatted];
        }
        const blank = createEmptyAppraisal(
          user.empId,
          user.name,
          user.department,
          user.designation as any,
          activeMonth,
          user.institution || 'SRM IST',
          user.campus || 'SRM Ramapuram Campus',
          user.reportingHodName
        );
        saveAppraisalApi(blank);
        return [...prev, blank];
      });
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
  };

  /* ── Appraisal Update ── */
  const handleUpdateAppraisal = (updated: AppraisalRecord) => {
    setAppraisals((prev) => {
      const exists = prev.find((a) => a.id === updated.id);
      if (exists) return prev.map((a) => (a.id === updated.id ? updated : a));
      return [...prev, updated];
    });

    // Save to BaaS database
    saveAppraisalApi(updated);

    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      performedBy: loggedInUser?.name ?? 'Unknown',
      role: loggedInUser?.role ?? 'TEACHER',
      action:
        updated.status === 'SUBMITTED'
          ? 'APPRAISAL_SUBMITTED'
          : updated.status === 'HOD_APPROVED'
          ? 'APPRAISAL_APPROVED'
          : 'DRAFT_SAVED',
      details: `Appraisal for ${updated.facultyName} (${updated.empId}) — Status: ${updated.status}. Total Score: ${updated.selfScoreTotal}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    logAuditEventApi(newLog);
  };

  /* ── Window Toggle ── */
  const handleToggleWindow = async (monthYear: string) => {
    const targetWin = windows.find((w) => w.monthYear === monthYear);
    const updatedWins = await toggleWindowApi(monthYear, targetWin?.isOpen ?? true);
    setWindows(updatedWins);

    const action = targetWin?.isOpen ? 'WINDOW_CLOSED' : 'WINDOW_OPENED';
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      performedBy: loggedInUser?.name ?? 'Admin',
      role: 'ADMIN_CHAIRMAN',
      action,
      details: `${action}: Appraisal submission window for ${monthYear} was updated.`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    logAuditEventApi(newLog);
  };

  /* ── Data Refresh Callback ── */
  const handleRefreshData = async (): Promise<boolean> => {
    try {
      const wins = await fetchWindows();
      setWindows(wins);
      const dbAppraisals = await fetchAppraisalsApi();
      if (dbAppraisals && dbAppraisals.length > 0) {
        setAppraisals(dbAppraisals);
      }
      const logs = await fetchAuditLogsApi();
      setAuditLogs(logs);
      return true;
    } catch (err) {
      console.warn('[page] Refresh failed:', err);
      return false;
    }
  };

  /* ── Derived values ── */
  const activeWin = windows.find((w) => w.monthYear === activeMonth);
  const isWindowOpen = activeWin ? activeWin.isOpen : true;

  // Teacher's own appraisal record
  const teacherAppraisal = loggedInUser
    ? appraisals.find(
        (a) => a.empId === loggedInUser.empId && a.monthYear === activeMonth
      )
    : undefined;

  // HOD sees faculty members under their department / reporting HOD for active month
  const hodAppraisals = appraisals.filter((a) => {
    if (a.monthYear !== activeMonth) return false;
    if (loggedInUser?.role === 'HOD') {
      return (
        a.empId !== loggedInUser.empId &&
        a.designation !== 'Head of Department(HOD)' &&
        (a.department === loggedInUser.department ||
          a.generalDetails?.reportingHodName === loggedInUser.name)
      );
    }
    return true;
  });

  // HOI sees faculty members across their institution for active month
  const hoiAppraisals = appraisals.filter((a) => {
    if (a.monthYear !== activeMonth) return false;
    if (loggedInUser?.role === 'HOI') {
      if (loggedInUser.institution && loggedInUser.institution !== 'SRM IST') {
        return a.institution === loggedInUser.institution;
      }
      if (loggedInUser.campus && loggedInUser.campus !== 'ALL') {
        return a.campus === loggedInUser.campus;
      }
      return true;
    }
    return true;
  });

  /* ── Render ── */
  if (!loggedInUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <AppHeader
        user={loggedInUser}
        activeMonth={activeMonth}
        onMonthChange={(month) => {
          setActiveMonth(month);
          // If teacher switches month, ensure their appraisal exists for that month
          if (loggedInUser.role === 'TEACHER') {
            setAppraisals((prev) => {
              const exists = prev.find(
                (a) => a.empId === loggedInUser.empId && a.monthYear === month
              );
              if (exists) return prev;
              const blank = createEmptyAppraisal(
                loggedInUser.empId,
                loggedInUser.name,
                loggedInUser.department,
                loggedInUser.designation,
                month,
                loggedInUser.institution || 'SRM IST',
                loggedInUser.campus || 'SRM Ramapuram Campus'
              );
              saveAppraisalApi(blank);
              return [...prev, blank];
            });
          }
        }}
        windows={windows}
        onLogout={handleLogout}
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* TEACHER VIEW */}
        {loggedInUser.role === 'TEACHER' && teacherAppraisal && (
          <ErrorBoundary portalName="Faculty Portal">
            <TeacherView
              appraisal={teacherAppraisal}
              onUpdateAppraisal={handleUpdateAppraisal}
              isWindowOpen={isWindowOpen}
            />
          </ErrorBoundary>
        )}

        {/* HOD VIEW */}
        {loggedInUser.role === 'HOD' && (
          <ErrorBoundary portalName="HOD Verification Portal">
            <HodView
              appraisals={hodAppraisals}
              onUpdateAppraisal={handleUpdateAppraisal}
              onRefreshData={handleRefreshData}
            />
          </ErrorBoundary>
        )}

        {/* HOI (HEAD OF INSTITUTION) VIEW */}
        {loggedInUser.role === 'HOI' && (
          <ErrorBoundary portalName="HOI Institutional Portal">
            <HoiView
              appraisals={hoiAppraisals}
              onUpdateAppraisal={handleUpdateAppraisal}
              onRefreshData={handleRefreshData}
            />
          </ErrorBoundary>
        )}

        {/* ADMIN / CHAIRMAN VIEW */}
        {loggedInUser.role === 'ADMIN_CHAIRMAN' && (
          <ErrorBoundary portalName="Chairman Analytics Console">
            <AdminChairmanView
              monthlyWindows={windows}
              onToggleWindow={handleToggleWindow}
              appraisals={appraisals}
              auditLogs={auditLogs}
              onUpdateAppraisal={handleUpdateAppraisal}
              onRefreshData={handleRefreshData}
            />
          </ErrorBoundary>
        )}
      </main>

      <footer className="mt-auto shrink-0 border-t border-slate-200 py-3 text-center text-xs text-slate-400 bg-white">
        SRM Institute of Science and Technology — Faculty Performance &amp; Analytics System 2025
      </footer>
    </div>
  );
}
