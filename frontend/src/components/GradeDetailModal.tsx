'use client';

import React, { useState, useMemo } from 'react';
import { AppraisalRecord, GradeType } from '@/types/appraisal';
import {
  X,
  Printer,
  Award,
  Users,
  Search,
  ChevronRight,
  Building2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { typography, tableTokens, colors } from '@/lib/design-tokens';

interface GradeDetailModalProps {
  grade: GradeType;
  appraisals: AppraisalRecord[];
  onClose: () => void;
  onSelectRecord?: (record: AppraisalRecord) => void;
}

export const GradeDetailModal: React.FC<GradeDetailModalProps> = ({
  grade,
  appraisals,
  onClose,
  onSelectRecord,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');

  // Filter appraisals by selected grade
  const gradeAppraisals = useMemo(() => {
    return (appraisals || []).filter((a) => a && a.grade === grade);
  }, [appraisals, grade]);

  // Total count in dataset
  const totalInstitutionFaculty = appraisals.length || 1;
  const gradeCount = gradeAppraisals.length;
  const gradePercentage = Number(((gradeCount / totalInstitutionFaculty) * 100).toFixed(1));

  // Available departments represented in this grade
  const availableModalDepts = useMemo(() => {
    const depts = Array.from(new Set(gradeAppraisals.map((a) => a.department).filter(Boolean))).sort();
    return ['ALL', ...depts];
  }, [gradeAppraisals]);

  // Filtered faculty roster for local search and department filter inside modal
  const filteredRoster = useMemo(() => {
    let list = gradeAppraisals;
    if (selectedDeptFilter !== 'ALL') {
      list = list.filter((a) => a.department === selectedDeptFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.facultyName.toLowerCase().includes(q) ||
          a.empId.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.designation.toLowerCase().includes(q)
      );
    }
    return list;
  }, [gradeAppraisals, selectedDeptFilter, searchQuery]);



  // Grade color theme parameters using strict semantic tokens
  const theme = useMemo(() => {
    if (grade === 'Grade A') {
      return {
        title: 'Grade A — Exemplary Performance',
        badgeColor: colors.semantic.success.badge,
        iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        cardBg: 'bg-emerald-50/50 border-emerald-200',
        rangeText: 'Score Threshold: ≥ 310 Pts (Executive) / ≥ 245 Pts (Standard)',
      };
    } else if (grade === 'Grade B') {
      return {
        title: 'Grade B — Commendable Performance',
        badgeColor: colors.semantic.warning.badge,
        iconBg: 'bg-amber-50 text-amber-600 border border-amber-200',
        cardBg: 'bg-amber-50/50 border-amber-200',
        rangeText: 'Score Threshold: 265 – 309 Pts (Executive) / 175 – 244 Pts (Standard)',
      };
    } else {
      return {
        title: 'Grade C — Development Required',
        badgeColor: colors.semantic.danger.badge,
        iconBg: 'bg-rose-50 text-rose-600 border border-rose-200',
        cardBg: 'bg-rose-50/50 border-rose-200',
        rangeText: 'Score Threshold: < 265 Pts (Executive) / < 175 Pts (Standard)',
      };
    }
  }, [grade]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="grade-modal-print-content"
        className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-0 sm:my-auto"
      >
        {/* ── MODAL HEADER ── */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${theme.iconBg}`}>
              <Award className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={typography.h1}>{theme.title}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${theme.badgeColor}`}>
                  {gradeCount} Faculty
                </span>
              </div>
              <p className={typography.caption}>{theme.rangeText}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 no-print">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4 text-blue-600" />}
              title="Print clean grade summary report (A4 ready)"
            >
              <span>Print / PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close modal (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── OFFICIAL PRINT-ONLY INSTITUTION HEADER ── */}
        <div className="hidden print:block p-6 border-b border-slate-300 bg-white">
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Faculty Performance &amp; Analytics Portal</h1>
              <p className="text-xs text-slate-600 font-semibold tracking-wide">FACULTY PERFORMANCE & ANALYTICS GOVERNANCE 2025</p>
              <p className="text-xs text-slate-500 mt-1">Official Department-Wise Grade Breakdown Report — <strong>{grade}</strong></p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-sm rounded">
                {grade}
              </span>
              <p className="text-[10px] text-slate-500 mt-1 font-mono">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })}</p>
            </div>
          </div>
        </div>

        {/* ── MODAL BODY ── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-slate-50/50 space-y-4 sm:space-y-5">
          
          {/* Executive Stats Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className={typography.labelMicro}>Total {grade} Faculty</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={typography.displayStat}>{gradeCount}</span>
                <span className="text-xs text-slate-500 font-medium">faculty members</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
              <p className={typography.labelMicro}>Institutional Share</p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className={typography.displayStat}>{gradePercentage}%</span>
                <span className="text-xs text-slate-500 font-medium">of total roster</span>
              </div>
            </div>
          </div>

          {/* Department-Grouped Faculty Roster Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            {/* Toolbar: Department Selector & Search (no-print) */}
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500 shrink-0" />
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                  Faculty Roster — {grade} ({filteredRoster.length} listed)
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Department Selector */}
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 outline-none cursor-pointer shadow-2xs max-w-[200px] truncate"
                  title="Filter by Department"
                >
                  <option value="ALL">All Departments ({availableModalDepts.length - 1})</option>
                  {availableModalDepts.filter((d) => d !== 'ALL').map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>

                {/* Search Input */}
                <div className="relative shrink-0 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search faculty name, emp ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Faculty List Content */}
            <div className="p-4 sm:p-5 space-y-6">
              {filteredRoster.length === 0 ? (
                <div className="py-12 text-center text-slate-400 font-medium italic text-xs sm:text-sm">
                  No faculty found matching your filter criteria for {grade}.
                </div>
              ) : (
                <div className="overflow-x-auto print:overflow-visible border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[650px]">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <th className={`${tableTokens.thCenter} w-10`}>#</th>
                        <th className={tableTokens.th}>Faculty Name &amp; ID</th>
                        <th className={tableTokens.th}>Department</th>
                        <th className={tableTokens.th}>Designation</th>
                        <th className={tableTokens.thCenter}>Total Score</th>
                        <th className={tableTokens.thCenter}>Status</th>
                        <th className={`${tableTokens.thRight} no-print w-24`}>Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRoster.map((rec, idx) => (
                        <tr key={rec.id} className={tableTokens.tr}>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-400 text-xs">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="font-semibold text-xs sm:text-sm text-slate-900">{rec.facultyName}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{rec.empId}</div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs font-medium">
                            {rec.department || 'Unassigned'}
                          </td>
                          <td className="px-3 py-2.5 text-slate-600 text-xs">
                            {rec.designation}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono font-bold text-slate-900 text-xs">
                            {rec.hodScoreTotal || rec.selfScoreTotal || 0} / 350
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <StatusPill status={rec.status} size="sm" />
                          </td>
                          <td className="px-3 py-2.5 text-right no-print">
                            {onSelectRecord && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onSelectRecord(rec)}
                                icon={<ChevronRight className="w-3.5 h-3.5" />}
                                title="View full faculty appraisal details"
                              >
                                <span>View</span>
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MODAL FOOTER ── */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 font-semibold">{filteredRoster.length}</strong> of {gradeCount} faculty in <span className="font-semibold text-slate-900">{grade}</span>
            {selectedDeptFilter !== 'ALL' && <span className="ml-2 text-blue-600 font-medium">· {selectedDeptFilter}</span>}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5 text-slate-600" />}
            >
              <span>Print Report</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
