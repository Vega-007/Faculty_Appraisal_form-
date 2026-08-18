'use client';

import React, { useState, useMemo } from 'react';
import { AppraisalRecord, GradeType } from '@/types/appraisal';
import { MOCK_USERS } from '@/lib/initialData';
import { calculateCategory1, calculateCategory2, calculateCategory3, calculateGrade } from '@/lib/scoring';
import {
  CheckCircle2,
  Building2,
  Users,
  RotateCcw,
  Award,
  Search,
  Eye,
  X,
  FileCheck,
  Clock,
  School,
  ArrowLeft,
} from 'lucide-react';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { StatCard } from '@/components/ui/StatCard';
import { typography, tableTokens } from '@/lib/design-tokens';

interface HoiViewProps {
  appraisals?: AppraisalRecord[];
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
  onRefreshData?: () => Promise<boolean>;
}

export const HoiView: React.FC<HoiViewProps> = ({ appraisals = [], onUpdateAppraisal, onRefreshData }) => {
  // Master Filter & Search States
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedHodName, setSelectedHodName] = useState<string>('ALL');
  const [selectedFacultyEmpId, setSelectedFacultyEmpId] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | GradeType>('ALL');
  const [selectedGradeModal, setSelectedGradeModal] = useState<GradeType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const safeAppraisals = useMemo(() => Array.isArray(appraisals) ? appraisals : [], [appraisals]);

  // Modal / Drawer States
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewFullModalRecord, setViewFullModalRecord] = useState<AppraisalRecord | null>(null);
  const [isHoiReviewOpen, setIsHoiReviewOpen] = useState<boolean>(false);

  // Active selected record for HOI Review modal
  const selectedRecord = useMemo(
    () => safeAppraisals.find((a) => a.id === selectedRecordId) || safeAppraisals[0],
    [safeAppraisals, selectedRecordId]
  );

  const [recordData, setRecordData] = useState<AppraisalRecord | undefined>(selectedRecord);
  const [hoiRemarks, setHoiRemarks] = useState<string>('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (selectedRecord) {
      setRecordData(selectedRecord);
      setHoiRemarks(selectedRecord.hoiRemarks || selectedRecord.hodRemarks || '');
    }
  }, [selectedRecordId, selectedRecord]);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Refresh handler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        const ok = await onRefreshData();
        if (ok) triggerToast('Refreshed HOI institutional dashboard data.');
        else triggerToast('Failed to refresh data.', 'error');
      } else {
        triggerToast('Refreshed HOI dashboard.');
      }
    } catch (err) {
      triggerToast('Refresh failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Grade calculate helper
  const getCalculatedGrade = (rec: AppraisalRecord): GradeType => {
    if (!rec) return 'Grade C';
    if (rec.grade) return rec.grade as GradeType;
    const c1 = calculateCategory1(rec.cat1 || ({} as any)).hodTotal;
    const c2 = calculateCategory2(rec.cat2 || ({} as any)).hodTotal;
    const c3 = calculateCategory3(rec.cat3 || ({} as any)).hodTotal;
    return calculateGrade(rec.designation, c1 + c2 + c3);
  };

  /* ── 1. Unique Departments List ── */
  const availableDepartments = useMemo(() => {
    const set = new Set(safeAppraisals.map((a) => a.department).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [safeAppraisals]);

  /* ── 2. Unique HOD Names List from MOCK_USERS and Appraisals ── */
  const availableHods = useMemo(() => {
    const hodUsers = MOCK_USERS.filter((u) => u.role === 'HOD');
    const hodNamesFromAppraisals = safeAppraisals.map((a) => a.generalDetails?.reportingHodName).filter(Boolean);
    const combined = Array.from(new Set([...hodUsers.map((h) => h.name), ...hodNamesFromAppraisals]));
    return ['ALL', ...combined];
  }, [safeAppraisals]);

  /* ── 3. Master Filtered Appraisals List ── */
  const filteredAppraisals = useMemo(() => {
    return safeAppraisals.filter((a) => {
      if (!a) return false;
      // Search Query
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        searchQuery === '' ||
        (a.facultyName && a.facultyName.toLowerCase().includes(q)) ||
        (a.empId && a.empId.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q)) ||
        (a.generalDetails?.reportingHodName && a.generalDetails.reportingHodName.toLowerCase().includes(q));

      // Department Filter
      const matchesDept = selectedDept === 'ALL' || a.department === selectedDept;

      // HOD Name Filter
      const matchesHod =
        selectedHodName === 'ALL' ||
        a.generalDetails?.reportingHodName === selectedHodName;

      // Faculty Specific Selection
      const matchesFaculty =
        selectedFacultyEmpId === 'ALL' || a.empId === selectedFacultyEmpId;

      // Grade Filter
      const calculatedGrade = getCalculatedGrade(a);
      const matchesGrade = gradeFilter === 'ALL' || calculatedGrade === gradeFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesDept && matchesHod && matchesFaculty && matchesGrade && matchesStatus;
    });
  }, [safeAppraisals, searchQuery, selectedDept, selectedHodName, selectedFacultyEmpId, gradeFilter, statusFilter]);

  // KPI Metrics
  const totalCount = safeAppraisals.length;
  const hoiApprovedCount = safeAppraisals.filter((a) => a && a.status === 'HOI_APPROVED').length;
  const pendingHoiCount = safeAppraisals.filter((a) => a && a.status === 'HOD_APPROVED').length;
  const gradeACount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade A').length;
  const gradeBCount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade B').length;
  const gradeCCount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade C').length;

  // HOI Approval Handler
  const handleApprove = () => {
    if (!recordData) return;
    const c1 = calculateCategory1(recordData.cat1 || ({} as any)).hodTotal;
    const c2 = calculateCategory2(recordData.cat2 || ({} as any)).hodTotal;
    const c3 = calculateCategory3(recordData.cat3 || ({} as any)).hodTotal;
    const totalHoi = Number((c1 + c2 + c3).toFixed(1));
    const grade = calculateGrade(recordData.designation, totalHoi);

    const updated: AppraisalRecord = {
      ...recordData,
      hoiScoreTotal: totalHoi,
      grade,
      status: 'HOI_APPROVED',
      hoiRemarks: hoiRemarks,
      updatedAt: new Date().toISOString(),
    };
    setRecordData(updated);
    onUpdateAppraisal(updated);
    setIsHoiReviewOpen(false);
    triggerToast(`Final Institutional Approval granted for ${updated.facultyName}.`);
  };

  // HOI Revision Handler
  const handleRequestRevision = () => {
    if (!recordData) return;
    const updated: AppraisalRecord = {
      ...recordData,
      status: 'DRAFT',
      hoiRemarks: hoiRemarks,
      revisionRemarks: hoiRemarks || 'HOI requested revisions on your appraisal.',
      revisionFlags: [{ key: 'hoi.general', flaggedBy: 'HOI', reason: hoiRemarks || 'Please review overall appraisal.' }],
      updatedAt: new Date().toISOString(),
    };
    setRecordData(updated);
    onUpdateAppraisal(updated);
    setIsHoiReviewOpen(false);
    triggerToast(`Revision requested for ${updated.facultyName}. Returned to Faculty login.`, 'error');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden text-xs min-h-0">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-5 z-[160] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── STICKY TOP HEADER BAR ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className={typography.h1}>HOI / Dean Executive Console</h1>
            <p className={typography.caption}>Institutional oversight across all departments — final sign-off authority.</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            icon={<RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>

          <span className="hidden sm:inline-flex items-center gap-1.5 bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700">
            <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{totalCount} Total Faculty</span>
          </span>
        </div>
      </div>

      {/* ── GRADE FILTER BANNER (SHOWN DIRECTLY ABOVE THE 4 KPI/GRADE BOXES) ── */}
      {gradeFilter !== 'ALL' && (
        <div className="shrink-0 bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <Award className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-semibold text-slate-800 truncate">
              Filtered Grade View: <strong className="text-blue-900 font-bold">{gradeFilter}</strong> ({filteredAppraisals.length} faculty matched)
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedGradeModal(gradeFilter as GradeType)}
              icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
            >
              <span>View {gradeFilter} Report</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setGradeFilter('ALL')}
              icon={<ArrowLeft className="w-3.5 h-3.5" />}
            >
              <span>Back to All Grades</span>
            </Button>
          </div>
        </div>
      )}

      {/* ── KPI CARDS ROW ── */}
      <div className="shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200">
        <StatCard
          icon={<Users className="w-5 h-5 text-blue-600" />}
          label="Total Faculty"
          value={totalCount}
          iconBg="bg-blue-50 text-blue-600 border border-blue-100"
          onClick={() => setGradeFilter('ALL')}
          className={gradeFilter === 'ALL' ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30' : ''}
        />
        <StatCard
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          label="HOI Approved"
          value={hoiApprovedCount}
          iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          label="Pending Review"
          value={pendingHoiCount}
          iconBg="bg-blue-50 text-blue-600 border border-blue-100"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-emerald-600" />}
          label="Grade A Faculty"
          value={gradeACount}
          subtext={`Grade B: ${gradeBCount} · Grade C: ${gradeCCount}`}
          iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
          onClick={() => setGradeFilter(gradeFilter === 'Grade A' ? 'ALL' : 'Grade A')}
          className={gradeFilter === 'Grade A' ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/50' : 'hover:border-emerald-300'}
        />
      </div>

      {/* ── FILTER TOOLBAR ── */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty, ID, HOD..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Department */}
        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setSelectedFacultyEmpId('ALL'); }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer max-w-[170px] truncate shadow-2xs"
          title={`Department: ${selectedDept}`}
        >
          <option value="ALL">All Departments</option>
          {availableDepartments.filter((d) => d !== 'ALL').map((dept) => (
            <option key={dept} value={dept} title={dept}>{dept}</option>
          ))}
        </select>

        {/* HOD */}
        <select
          value={selectedHodName}
          onChange={(e) => { setSelectedHodName(e.target.value); setSelectedFacultyEmpId('ALL'); }}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer max-w-[170px] truncate shadow-2xs"
          title={`HOD: ${selectedHodName}`}
        >
          <option value="ALL">All HOD Names</option>
          {availableHods.filter((h) => h !== 'ALL').map((hod) => (
            <option key={hod} value={hod} title={hod}>{hod}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="HOD_APPROVED">HOD APPROVED</option>
          <option value="HOI_APPROVED">HOI APPROVED</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="DRAFT">DRAFT</option>
        </select>

        {/* Grade pills */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-2xs">
          {(['ALL', 'Grade A', 'Grade B', 'Grade C'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                gradeFilter === g ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {g === 'ALL' ? 'All' : g}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-slate-400 font-medium">
          {filteredAppraisals.length} / {totalCount} shown
        </span>
      </div>

      {/* ── SCROLLABLE TABLE ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left min-w-[920px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={tableTokens.th}>Faculty Member</th>
              <th className={tableTokens.th}>Department &amp; Designation</th>
              <th className={tableTokens.th}>Reporting HOD</th>
              <th className={tableTokens.thCenter}>Score Summary</th>
              <th className={tableTokens.thCenter}>Grade</th>
              <th className={tableTokens.thCenter}>Status</th>
              <th className={tableTokens.thRight}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAppraisals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-medium text-sm">
                  No faculty members found matching your filter criteria.
                </td>
              </tr>
            ) : (
              filteredAppraisals.map((rec) => {
                let calculatedGrade: string;
                try { calculatedGrade = getCalculatedGrade(rec); } catch { calculatedGrade = 'Grade C'; }
                const isSelected = selectedRecordId === rec.id;
                const selfScore = Math.min(rec.selfScoreTotal ?? 0, 350);
                const hodScore = Math.min(rec.hodScoreTotal ?? 0, 350);

                return (
                  <tr key={rec.id} className={`${tableTokens.tr} ${isSelected ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3 min-w-0" title={`${rec.facultyName} (${rec.empId})`}>
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                          {rec.facultyName?.charAt(0) ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 leading-tight truncate">{rec.facultyName ?? 'N/A'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{rec.empId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-slate-800 truncate" title={rec.department}>{rec.department}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate" title={rec.designation}>{rec.designation}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="font-medium text-slate-800 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-xs truncate max-w-[150px]" title={rec.generalDetails?.reportingHodName || '—'}>
                        {rec.generalDetails?.reportingHodName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-800 text-xs border border-slate-200">
                          Self: {selfScore}/350
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                          HOD: {hodScore}/350
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <GradeBadge
                        grade={calculatedGrade}
                        onClick={() => setSelectedGradeModal(calculatedGrade as GradeType)}
                      />
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <StatusPill status={rec.status} />
                    </td>
                    <td className="px-4 py-3.5 text-right align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setViewFullModalRecord(rec)}
                          icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => { setSelectedRecordId(rec.id); setIsHoiReviewOpen(true); }}
                          icon={<FileCheck className="w-3.5 h-3.5" />}
                        >
                          Sign-Off
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── HOI REVIEW & SIGN-OFF MODAL ── */}
      {isHoiReviewOpen && recordData && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-0 sm:my-auto">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                  {recordData.facultyName?.charAt(0) ?? '?'}
                </div>
                <div className="min-w-0">
                  <h3 className={`${typography.h1} truncate`}>HOI Institutional Approval — {recordData.facultyName}</h3>
                  <p className={typography.caption}>{recordData.empId} &bull; {recordData.designation} &bull; {recordData.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 no-print">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setViewFullModalRecord(recordData)}
                  icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Full Profile
                </Button>
                <button onClick={() => setIsHoiReviewOpen(false)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 text-xs text-slate-800 bg-slate-50/50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className={typography.labelMicro}>Reporting HOD</span>
                  <span className="text-xs font-semibold text-slate-900 mt-0.5 block">{recordData.generalDetails?.reportingHodName || '—'}</span>
                </div>
                <div>
                  <span className={typography.labelMicro}>Verified Score</span>
                  <span className="text-sm font-bold text-emerald-700 mt-0.5 block">{Math.min(recordData.hodScoreTotal ?? 0, 350)} / 350</span>
                </div>
                <div>
                  <span className={typography.labelMicro}>Calculated Grade</span>
                  <span className="mt-1 block">
                    <GradeBadge grade={recordData.grade} size="sm" />
                  </span>
                </div>
                <div>
                  <span className={typography.labelMicro}>Current Status</span>
                  <span className="mt-1 block">
                    <StatusPill status={recordData.status} size="sm" />
                  </span>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-2xs">
                <h4 className={typography.h3}>Category Score Breakdown (HOD Verified)</h4>
                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className={typography.labelMicro}>Cat I: Teaching</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block">{recordData.cat1?.totalHodScore ?? 0} / 110</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className={typography.labelMicro}>Cat II: Co-Curricular</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block">{recordData.cat2?.totalHodScore ?? 0} / 50</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className={typography.labelMicro}>Cat III: Research</span>
                    <span className="text-sm font-bold text-slate-900 mt-1 block">{recordData.cat3?.totalHodScore ?? 0} / 190</span>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1 shadow-2xs">
                <span className={typography.labelMicro}>HOD Reviewer Remarks</span>
                <p className="text-slate-700 italic font-medium">{recordData.hodRemarks || 'HOD verified criteria scores and approved submission.'}</p>
              </div>
              <div className="space-y-1.5">
                <label className={typography.labelMicro}>HOI / Dean Institutional Remarks</label>
                <textarea
                  value={hoiRemarks}
                  onChange={(e) => setHoiRemarks(e.target.value)}
                  placeholder="Enter HOI institutional notes, commendations, or revision notes..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs font-medium"
                />
              </div>
            </div>
            <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 no-print">
              <Button variant="secondary" size="sm" onClick={() => setIsHoiReviewOpen(false)}>
                Cancel
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="danger" size="sm" onClick={handleRequestRevision}>
                  Request Revision
                </Button>
                <Button variant="success" size="sm" onClick={handleApprove} icon={<CheckCircle2 className="w-4 h-4" />}>
                  Grant Institutional Approval
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADE DETAIL MODAL ── */}
      {selectedGradeModal && (
        <GradeDetailModal
          grade={selectedGradeModal}
          appraisals={appraisals}
          onClose={() => setSelectedGradeModal(null)}
          onSelectRecord={(rec) => setViewFullModalRecord(rec)}
        />
      )}

      {/* ── FULL APPRAISAL MODAL ── */}
      {viewFullModalRecord && (
        <FullAppraisalModal record={viewFullModalRecord} onClose={() => setViewFullModalRecord(null)} />
      )}
    </div>
  );
};
