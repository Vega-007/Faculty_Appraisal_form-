'use client';

import React, { useState, useMemo } from 'react';
import { AppraisalRecord, GradeType } from '@/types/appraisal';
import { calculateCategory1, calculateCategory2, calculateCategory3, calculateGrade } from '@/lib/scoring';
import {
  CheckCircle2,
  ExternalLink,
  Users,
  ClipboardCheck,
  RotateCcw,
  Search,
  Eye,
  Award,
  X,
  FileCheck,
  Clock,
  Lock,
  Unlock,
  ArrowLeft,
} from 'lucide-react';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { StatCard } from '@/components/ui/StatCard';
import { typography, tableTokens } from '@/lib/design-tokens';

interface HodViewProps {
  appraisals?: AppraisalRecord[];
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
  onRefreshData?: () => Promise<boolean>;
}

const ALL_CRITERIA_KEYS = [
  'cat1.teachingLoad',
  'cat1.eContent',
  'cat1.innovativePedagogy',
  'cat1.remedialTeaching',
  'cat1.examDuties',
  'cat1.moocDevelopment',
  'cat1.nptelCompletion',
  'cat1.certifications',
  'cat1.examResults',
  'cat1.copoAttainment',
  'cat1.industryConnect',
  'cat1.studentGuiding',
  'cat1.deptContribution',
  'cat2.communityService',
  'cat2.professionCommittees',
  'cat2.workshopsWebinars',
  'cat2.fdpAttended',
  'cat2.professionalMemberships',
  'cat2.intlEventsOrganized',
  'cat2.natlEventsOrganized',
  'cat2.stateEventsOrganized',
  'cat2.lecturesChaired',
  'cat2.brandBuilding',
  'cat2.conferencePapers',
  'cat3.journals',
  'cat3.consultancy',
  'cat3.patents',
  'cat3.fundedProjects',
  'cat3.industryUseCases',
];

export const HodView: React.FC<HodViewProps> = ({ appraisals = [], onUpdateAppraisal, onRefreshData }) => {
  // Filter & Search states
  const [gradeFilter, setGradeFilter] = useState<'ALL' | GradeType>('ALL');
  const [selectedGradeModal, setSelectedGradeModal] = useState<GradeType | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const safeAppraisals = useMemo(() => Array.isArray(appraisals) ? appraisals : [], [appraisals]);

  // Modal / Drawer states
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewFullModalRecord, setViewFullModalRecord] = useState<AppraisalRecord | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

  // Verification state for active selected record
  const selectedRecord = useMemo(
    () => safeAppraisals.find((a) => a.id === selectedRecordId) || safeAppraisals[0],
    [safeAppraisals, selectedRecordId]
  );

  const [recordData, setRecordData] = useState<AppraisalRecord | undefined>(selectedRecord);
  const [remarks, setRemarks] = useState<string>('');
  const [flaggedKeys, setFlaggedKeys] = useState<string[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  React.useEffect(() => {
    if (selectedRecord) {
      setRecordData(selectedRecord);
      setRemarks(selectedRecord.hodRemarks || selectedRecord.revisionRemarks || '');
      setFlaggedKeys(selectedRecord.revisionFlags?.map((f) => f.key) || []);
    }
  }, [selectedRecordId, selectedRecord]);

  // Refresh handler
  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        const ok = await onRefreshData();
        if (ok) triggerToast('Refreshed HOD dashboard records from database.');
        else triggerToast('Failed to refresh data.', 'error');
      } else {
        triggerToast('Refreshed HOD dashboard.');
      }
    } catch (err) {
      triggerToast('Refresh failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toast trigger
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
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

  // Filtered appraisals list
  const filteredAppraisals = useMemo(() => {
    return safeAppraisals.filter((a) => {
      if (!a) return false;
      // Search
      const matchesSearch =
        searchQuery === '' ||
        (a.facultyName && a.facultyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.empId && a.empId.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.department && a.department.toLowerCase().includes(searchQuery.toLowerCase()));

      // Grade Filter
      const calculatedGrade = getCalculatedGrade(a);
      const matchesGrade = gradeFilter === 'ALL' || calculatedGrade === gradeFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [safeAppraisals, searchQuery, gradeFilter, statusFilter]);

  // KPI Calculations
  const totalCount = safeAppraisals.length;
  const approvedCount = safeAppraisals.filter((a) => a && (a.status === 'HOD_APPROVED' || a.status === 'HOI_APPROVED')).length;
  const pendingReviewCount = safeAppraisals.filter((a) => a && a.status === 'SUBMITTED').length;
  const gradeACount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade A').length;
  const gradeBCount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade B').length;
  const gradeCCount = safeAppraisals.filter((a) => a && getCalculatedGrade(a) === 'Grade C').length;

  // Toggle access logic
  const handleToggleAccess = (rec: AppraisalRecord) => {
    const currentEnabled = rec.appraisalAccessEnabled !== false;
    const nextAccess = !currentEnabled;
    const updated: AppraisalRecord = {
      ...rec,
      appraisalAccessEnabled: nextAccess,
      updatedAt: new Date().toISOString(),
    };
    if (recordData && recordData.id === rec.id) {
      setRecordData(updated);
    }
    onUpdateAppraisal(updated);
    triggerToast(
      `Appraisal form access for ${rec.facultyName} has been ${nextAccess ? 'ENABLED' : 'LOCKED'}.`,
      nextAccess ? 'success' : 'error'
    );
  };

  // Score verification helpers
  const allKeysFlagged = ALL_CRITERIA_KEYS.every((k) => flaggedKeys.includes(k));

  const handleToggleSelectAll = () => {
    if (allKeysFlagged) {
      setFlaggedKeys([]);
      triggerToast('Cleared all flagged revision items.');
    } else {
      setFlaggedKeys(ALL_CRITERIA_KEYS);
      triggerToast('Flagged all criteria items for revision.');
    }
  };

  const toggleFlagKey = (key: string) => {
    setFlaggedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const updateHodScore = (category: 'cat1' | 'cat2', field: string, val: number) => {
    if (!recordData) return;
    setRecordData({
      ...recordData,
      [category]: {
        ...recordData[category],
        [field]: { ...(recordData[category] as any)[field], hodScore: val },
      },
    });
  };

  const handleApprove = () => {
    if (!recordData) return;
    const c1 = calculateCategory1(recordData.cat1).hodTotal;
    const c2 = calculateCategory2(recordData.cat2).hodTotal;
    const c3 = calculateCategory3(recordData.cat3).hodTotal;
    const totalHod = Number((c1 + c2 + c3).toFixed(1));
    const grade = calculateGrade(recordData.designation, totalHod);

    const updated: AppraisalRecord = {
      ...recordData,
      hodScoreTotal: totalHod,
      grade,
      status: 'HOD_APPROVED',
      hodRemarks: remarks,
      revisionFlags: [],
      revisionRemarks: '',
      updatedAt: new Date().toISOString(),
    };
    setRecordData(updated);
    onUpdateAppraisal(updated);
    setIsVerificationOpen(false);
    triggerToast(`Appraisal for ${updated.facultyName} verified & approved by HOD.`);
  };

  const handleRequestRevision = () => {
    if (!recordData) return;
    const revisionItems = flaggedKeys.map((k) => ({
      key: k,
      flaggedBy: 'HOD' as const,
      reason: remarks || 'Correction or missing document proof required.',
    }));

    const updated: AppraisalRecord = {
      ...recordData,
      status: 'DRAFT',
      hodRemarks: remarks,
      revisionRemarks: remarks,
      revisionFlags: revisionItems,
      updatedAt: new Date().toISOString(),
    };
    setRecordData(updated);
    onUpdateAppraisal(updated);
    setIsVerificationOpen(false);
    triggerToast(`Revision requested for ${updated.facultyName}. Returned to Faculty login.`, 'error');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden text-xs min-h-0">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-5 z-[160] flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold border animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── STICKY TOP HEADER BAR ── */}
      <div className="shrink-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className={typography.h1}>HOD Verification Console</h1>
            <p className={typography.caption}>Verify scores, manage access, and audit department faculty appraisals.</p>
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
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span>{totalCount} Faculty Members</span>
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
          icon={<FileCheck className="w-5 h-5 text-emerald-600" />}
          label="HOD Approved"
          value={approvedCount}
          iconBg="bg-emerald-50 text-emerald-600 border border-emerald-100"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          label="Pending Review"
          value={pendingReviewCount}
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

      {/* ── TABLE TOOLBAR ── */}
      <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty name, ID..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs font-medium"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Grade Segmented Pills */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1 shadow-2xs">
          {(['ALL', 'Grade A', 'Grade B', 'Grade C'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                gradeFilter === g ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {g === 'ALL' ? 'All Grades' : g}
            </button>
          ))}
        </div>

        {/* Status Dropdown */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer shadow-2xs"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="HOD_APPROVED">HOD APPROVED</option>
          <option value="DRAFT">DRAFT</option>
        </select>

        {/* Count badge */}
        <span className="ml-auto text-xs text-slate-400 font-medium">
          Showing {filteredAppraisals.length} of {totalCount}
        </span>
      </div>

      {/* ── SCROLLABLE FACULTY TABLE ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left min-w-[920px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={tableTokens.th}>Faculty Member</th>
              <th className={tableTokens.th}>Designation &amp; Dept</th>
              <th className={tableTokens.thCenter}>Score Summary</th>
              <th className={tableTokens.thCenter}>Grade</th>
              <th className={tableTokens.thCenter}>Form Status</th>
              <th className={tableTokens.thCenter}>Appraisal Access</th>
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
                const isEnabled = rec.appraisalAccessEnabled !== false;
                let calculatedGrade: string;
                try { calculatedGrade = getCalculatedGrade(rec); } catch { calculatedGrade = 'Grade C'; }
                const isSelected = selectedRecordId === rec.id;
                const selfScore = Math.min(rec.selfScoreTotal ?? 0, 350);
                const hodScore = Math.min(rec.hodScoreTotal ?? 0, 350);

                return (
                  <tr
                    key={rec.id}
                    className={`${tableTokens.tr} ${isSelected ? 'bg-blue-50/30' : ''}`}
                  >
                    {/* Faculty Info */}
                    <td className="px-4 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                          {rec.facultyName?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-900 leading-tight">{rec.facultyName ?? 'N/A'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3.5 align-middle">
                      <p className="font-medium text-slate-800 leading-snug text-sm truncate max-w-[180px]">{rec.designation}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{rec.department}</p>
                    </td>

                    {/* Score Summary */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-800 text-xs border border-slate-200">
                          Self: {selfScore} / 350
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold text-xs border border-emerald-200">
                          HOD: {hodScore} / 350
                        </span>
                      </div>
                    </td>

                    {/* Grade Badge */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <GradeBadge
                        grade={calculatedGrade}
                        onClick={() => setSelectedGradeModal(calculatedGrade as GradeType)}
                      />
                    </td>

                    {/* Form Status */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <StatusPill status={rec.status} />
                    </td>

                    {/* Access Switch */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <button
                        onClick={() => handleToggleAccess(rec)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                          isEnabled
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200'
                        }`}
                      >
                        {isEnabled ? <Unlock className="w-3.5 h-3.5 text-emerald-600" /> : <Lock className="w-3.5 h-3.5 text-rose-600" />}
                        <span>{isEnabled ? 'Enabled' : 'Locked'}</span>
                      </button>
                    </td>

                    {/* Actions */}
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
                          onClick={() => { setSelectedRecordId(rec.id); setIsVerificationOpen(true); }}
                          icon={<FileCheck className="w-3.5 h-3.5" />}
                        >
                          Verify
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

      {/* ── SCORE VERIFICATION & REVIEW MODAL/DRAWER ── */}
      {isVerificationOpen && recordData && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-0 sm:my-auto">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                  {recordData.facultyName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className={`${typography.h1} truncate`}>
                    Score Verification &amp; Review — {recordData.facultyName}
                  </h3>
                  <p className={typography.caption}>
                    {recordData.empId} &bull; {recordData.designation} &bull; {recordData.department}
                  </p>
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
                <button
                  onClick={() => setIsVerificationOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-5 text-xs text-slate-800 bg-slate-50/50">
              
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div>
                  <span className={typography.labelMicro}>Self Total</span>
                  <span className="text-sm font-bold text-slate-900 mt-0.5 block">{recordData.selfScoreTotal} / 350</span>
                </div>
                <div>
                  <span className={typography.labelMicro}>HOD Verified</span>
                  <span className="text-sm font-bold text-emerald-700 mt-0.5 block">{recordData.hodScoreTotal} / 350</span>
                </div>
                <div>
                  <span className={typography.labelMicro}>Current Grade</span>
                  <span className="mt-1 block">
                    <GradeBadge grade={recordData.grade} size="sm" />
                  </span>
                </div>
                <div>
                  <span className={typography.labelMicro}>Status</span>
                  <span className="mt-1 block">
                    <StatusPill status={recordData.status} size="sm" />
                  </span>
                </div>
              </div>

              {/* Score Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <h4 className={typography.h3}>Score Verification Matrix</h4>
                  <span className="text-xs text-slate-500 font-medium">Enter corrected HOD marks in the score inputs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[650px]">
                    <thead>
                      <tr>
                        <th className={`${tableTokens.th} w-[45%]`}>Criteria Item</th>
                        <th className={tableTokens.thCenter}>Self Score</th>
                        <th className={tableTokens.thCenter}>HOD Score ✎</th>
                        <th className={tableTokens.thCenter}>
                          <label className="inline-flex items-center gap-1 cursor-pointer bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-lg">
                            <input
                              type="checkbox"
                              checked={allKeysFlagged}
                              onChange={handleToggleSelectAll}
                              className="w-3.5 h-3.5 accent-rose-600 rounded cursor-pointer"
                            />
                            <span className="font-semibold text-xs">Flag All 🚩</span>
                          </label>
                        </th>
                        <th className={tableTokens.th}>Proof Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Cat I Header */}
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td colSpan={5} className="px-4 py-2 text-xs border-y border-slate-200">
                          Category I: Teaching, Learning &amp; Evaluation (Max 110) &bull; Verified Total: {recordData.cat1.totalHodScore}
                        </td>
                      </tr>
                      {([
                        { key: 'cat1.teachingLoad', label: '1.1 Teaching Load Compliance', max: 10 },
                        { key: 'cat1.eContent', label: '1.2 E-Content / Textbooks', max: 10 },
                        { key: 'cat1.innovativePedagogy', label: '1.3 Innovative Pedagogies', max: 15 },
                        { key: 'cat1.remedialTeaching', label: '1.4 Remedial Teaching', max: 5 },
                        { key: 'cat1.examDuties', label: '1.5 End-Sem Exam Duties', max: 5 },
                        { key: 'cat1.moocDevelopment', label: '1.6 MOOC Development', max: 10 },
                        { key: 'cat1.nptelCompletion', label: '1.7 NPTEL Course Completion', max: 10 },
                        { key: 'cat1.certifications', label: '1.8 Industry Certifications', max: 5 },
                        { key: 'cat1.examResults', label: '1.9 Avg Exam Pass Percentage', max: 5 },
                        { key: 'cat1.copoAttainment', label: '1.10 CO-PO Attainment', max: 5 },
                        { key: 'cat1.industryConnect', label: '1.11 Industry Connect', max: 10 },
                        { key: 'cat1.studentGuiding', label: '1.12 Guiding Competitions', max: 10 },
                        { key: 'cat1.deptContribution', label: '1.13 Dept Contribution', max: 10 },
                      ] as { key: string; label: string; max: number }[]).map(({ key, label, max }) => {
                        const rawKey = key.replace('cat1.', '');
                        const field = (recordData.cat1 as any)[rawKey] as { selfScore: number; hodScore: number; proofUrl: string };
                        const isFlagged = flaggedKeys.includes(key);
                        return (
                          <tr key={key} className={`hover:bg-slate-50 transition-colors ${isFlagged ? 'bg-rose-50/50' : ''}`}>
                            <td className="px-4 py-2 font-medium text-slate-800">{label} <span className="text-slate-400 font-normal">({max} pts)</span></td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-600">{field.selfScore}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                value={field.hodScore === 0 ? '' : field.hodScore}
                                min={0}
                                max={max}
                                placeholder="0"
                                onChange={(e) => updateHodScore('cat1', rawKey, Math.min(max, Number(e.target.value)))}
                                className="w-14 text-center text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-1 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isFlagged}
                                onChange={() => toggleFlagKey(key)}
                                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-2">
                              {field.proofUrl && field.proofUrl !== 'NA' ? (
                                <a href={field.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium">
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Cat II Header */}
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td colSpan={5} className="px-4 py-2 text-xs border-y border-slate-200">
                          Category II: Co-Curricular &amp; Professional Activities (Max 50) &bull; Verified Total: {recordData.cat2.totalHodScore}
                        </td>
                      </tr>
                      {([
                        { key: 'cat2.communityService', label: '2.1 Community Service', max: 5 },
                        { key: 'cat2.professionCommittees', label: '2.2 Professional Committees', max: 5 },
                        { key: 'cat2.workshopsWebinars', label: '2.3 Workshops / Webinars', max: 5 },
                        { key: 'cat2.fdpAttended', label: '2.4 FDP / Training Programs', max: 5 },
                        { key: 'cat2.professionalMemberships', label: '2.5 Professional Memberships', max: 5 },
                        { key: 'cat2.intlEventsOrganized', label: '2.6 International Events', max: 5 },
                        { key: 'cat2.natlEventsOrganized', label: '2.7 National Events', max: 3 },
                        { key: 'cat2.stateEventsOrganized', label: '2.8 State / College Events', max: 2 },
                        { key: 'cat2.lecturesChaired', label: '2.9 Keynote Lectures / Chair', max: 5 },
                        { key: 'cat2.brandBuilding', label: '2.10 Brand Building & Outreach', max: 5 },
                        { key: 'cat2.conferencePapers', label: '2.11 Conference Papers', max: 5 },
                      ] as { key: string; label: string; max: number }[]).map(({ key, label, max }) => {
                        const rawKey = key.replace('cat2.', '');
                        const field = (recordData.cat2 as any)[rawKey] as { selfScore: number; hodScore: number; proofUrl: string };
                        const isFlagged = flaggedKeys.includes(key);
                        return (
                          <tr key={key} className={`hover:bg-slate-50 transition-colors ${isFlagged ? 'bg-rose-50/50' : ''}`}>
                            <td className="px-4 py-2 font-medium text-slate-800">{label} <span className="text-slate-400 font-normal">({max} pts)</span></td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-600">{field.selfScore}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                value={field.hodScore === 0 ? '' : field.hodScore}
                                min={0}
                                max={max}
                                placeholder="0"
                                onChange={(e) => updateHodScore('cat2', rawKey, Math.min(max, Number(e.target.value)))}
                                className="w-14 text-center text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-1 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isFlagged}
                                onChange={() => toggleFlagKey(key)}
                                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-2">
                              {field.proofUrl && field.proofUrl !== 'NA' ? (
                                <a href={field.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1 font-medium">
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Cat III Header */}
                      <tr className="bg-slate-50 font-bold text-slate-800">
                        <td colSpan={5} className="px-4 py-2 text-xs border-y border-slate-200">
                          Category III: Research, Publications &amp; Academic Contributions (Max 190) &bull; Verified Total: {recordData.cat3.totalHodScore}
                        </td>
                      </tr>
                      {([
                        { key: 'cat3.journals', label: '3.1 SCI / Scopus Journal Publications', max: 60, count: recordData.cat3.journals.length, score: recordData.cat3.journals.reduce((sum, j) => sum + (j.calculatedScore || 20), 0) },
                        { key: 'cat3.citationsScopus', label: '3.2 Scopus / Web of Science Citations', max: 20, count: recordData.cat3.citationsScopus.length, score: recordData.cat3.citationsScopus.length * 10 },
                        { key: 'cat3.citationsQ1', label: '3.3 Q1 Journal Citations', max: 20, count: recordData.cat3.citationsQ1.length, score: recordData.cat3.citationsQ1.length * 10 },
                        { key: 'cat3.consultancy', label: '3.4 Consultancy Projects', max: 20, count: recordData.cat3.consultancy.length, score: recordData.cat3.consultancy.length * 10 },
                        { key: 'cat3.patents', label: '3.5 Patents (Published / Granted)', max: 25, count: recordData.cat3.patents.length, score: recordData.cat3.patents.length * 20 },
                        { key: 'cat3.phdSupervisionTable', label: '3.6 Ph.D. Guidance & Supervision', max: 15, count: recordData.cat3.phdSupervisionTable.length, score: recordData.cat3.phdSupervisionTable.length * 10 },
                        { key: 'cat3.fundedProjects', label: '3.7 Sponsored Research Grants', max: 30, count: recordData.cat3.fundedProjects.length, score: recordData.cat3.fundedProjects.length * 25 },
                      ] as { key: string; label: string; max: number; count: number; score: number }[]).map(({ key, label, max, count, score }) => {
                        const isFlagged = flaggedKeys.includes(key);
                        return (
                          <tr key={key} className={`hover:bg-slate-50 transition-colors ${isFlagged ? 'bg-rose-50/50' : ''}`}>
                            <td className="px-4 py-2 font-medium text-slate-800">
                              {label} <span className="text-slate-400 font-normal">({max} pts max &bull; {count} items)</span>
                            </td>
                            <td className="px-3 py-2 text-center font-semibold text-slate-600">{Math.min(score, max)}</td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="number"
                                value={recordData.cat3.totalHodScore === 0 ? '' : recordData.cat3.totalHodScore}
                                min={0}
                                max={190}
                                placeholder="0"
                                onChange={(e) => {
                                  const newCat3Hod = Math.min(190, Number(e.target.value));
                                  setRecordData((prev) => {
                                    if (!prev) return prev;
                                    const updatedCat3 = { ...prev.cat3, totalHodScore: newCat3Hod };
                                    const newHodTotal = Math.min(prev.cat1.totalHodScore + prev.cat2.totalHodScore + newCat3Hod, 350);
                                    return {
                                      ...prev,
                                      cat3: updatedCat3,
                                      hodScoreTotal: newHodTotal,
                                      grade: newHodTotal >= 310 ? 'Grade A' : newHodTotal >= 265 ? 'Grade B' : 'Grade C',
                                    };
                                  });
                                }}
                                className="w-14 text-center text-xs font-semibold text-slate-900 border border-slate-300 rounded-lg px-1 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                              />
                            </td>
                            <td className="px-3 py-2 text-center">
                              <input
                                type="checkbox"
                                checked={isFlagged}
                                onChange={() => toggleFlagKey(key)}
                                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-emerald-700 font-semibold">{count} Item(s) Verified</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* HOD Remarks Textarea */}
              <div className="space-y-1.5">
                <label className={typography.labelMicro}>
                  HOD Review Comments &amp; Verification Remarks:
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter evaluation notes, adjustment rationale, or revision details..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none shadow-2xs"
                />
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 no-print">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsVerificationOpen(false)}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  onClick={handleRequestRevision}
                  disabled={recordData.status !== 'SUBMITTED'}
                >
                  Request Revision
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  onClick={handleApprove}
                  disabled={recordData.status !== 'SUBMITTED'}
                  icon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Approve &amp; Verify Marks
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

      {/* ── END-TO-END FULL APPRAISAL MODAL ── */}
      {viewFullModalRecord && (
        <FullAppraisalModal
          record={viewFullModalRecord}
          onClose={() => setViewFullModalRecord(null)}
        />
      )}
    </div>
  );
};
