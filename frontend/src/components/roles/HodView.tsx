'use client';

import React, { useState, useMemo } from 'react';
import { AppraisalRecord, GradeType } from '@/types/appraisal';
import { calculateCategory1, calculateCategory2, calculateCategory3, calculateGrade } from '@/lib/scoring';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Users,
  ClipboardCheck,
  RotateCcw,
  User,
  Printer,
  Search,
  Filter,
  Eye,
  Award,
  TrendingUp,
  X,
  ChevronRight,
  Sparkles,
  ShieldAlert,
  FileCheck,
  Clock,
  Lock,
  Unlock,
} from 'lucide-react';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';

interface HodViewProps {
  appraisals: AppraisalRecord[];
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
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

export const HodView: React.FC<HodViewProps> = ({ appraisals, onUpdateAppraisal }) => {
  // Filter & Search states
  const [gradeFilter, setGradeFilter] = useState<'ALL' | GradeType>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal / Drawer states
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewFullModalRecord, setViewFullModalRecord] = useState<AppraisalRecord | null>(null);
  const [isVerificationOpen, setIsVerificationOpen] = useState<boolean>(false);

  // Verification state for active selected record
  const selectedRecord = useMemo(
    () => appraisals.find((a) => a.id === selectedRecordId) || appraisals[0],
    [appraisals, selectedRecordId]
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

  // Toast trigger
  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Grade calculate helper
  const getCalculatedGrade = (rec: AppraisalRecord): GradeType => {
    if (rec.grade) return rec.grade as GradeType;
    const c1 = calculateCategory1(rec.cat1).hodTotal;
    const c2 = calculateCategory2(rec.cat2).hodTotal;
    const c3 = calculateCategory3(rec.cat3).hodTotal;
    return calculateGrade(rec.designation, c1 + c2 + c3);
  };

  // Filtered appraisals list
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((a) => {
      // Search
      const matchesSearch =
        searchQuery === '' ||
        a.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase());

      // Grade Filter
      const calculatedGrade = getCalculatedGrade(a);
      const matchesGrade = gradeFilter === 'ALL' || calculatedGrade === gradeFilter;

      // Status Filter
      const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;

      return matchesSearch && matchesGrade && matchesStatus;
    });
  }, [appraisals, searchQuery, gradeFilter, statusFilter]);

  // KPI Calculations
  const totalCount = appraisals.length;
  const approvedCount = appraisals.filter((a) => a.status === 'HOD_APPROVED' || a.status === 'HOI_APPROVED').length;
  const pendingReviewCount = appraisals.filter((a) => a.status === 'SUBMITTED').length;
  const gradeACount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade A').length;
  const gradeBCount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade B').length;
  const gradeCCount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade C').length;

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
      `Appraisal form access for ${rec.facultyName} has been ${nextAccess ? 'ENABLED ✅' : 'DISABLED 🔒'}.`,
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
    triggerToast(`Revision requested for ${updated.facultyName}. Sent back to Faculty login.`, 'error');
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-16 right-5 z-[150] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── STICKY TOP HEADER BAR ── */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white tracking-tight">HOD Verification Console</h1>
            <p className="text-[11px] text-slate-400">Verify scores, manage access, and audit department faculty appraisals.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{totalCount} Faculty Members</span>
        </div>
      </div>

      {/* ── KPI CARDS ROW (fixed height) ── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Users className="w-7 h-7 text-slate-300 shrink-0" />
          <div>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Total Faculty</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <FileCheck className="w-7 h-7 text-emerald-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-emerald-700">{approvedCount}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">HOD Approved</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Clock className="w-7 h-7 text-blue-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-blue-700">{pendingReviewCount}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Review</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Award className="w-7 h-7 text-purple-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-purple-700">{gradeACount}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Grade A &bull; B:{gradeBCount} C:{gradeCCount}</p>
          </div>
        </div>
      </div>

      {/* ── TABLE TOOLBAR (fixed height) ── */}
      <div className="shrink-0 px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty name, ID..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Grade Segmented Pills */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
          {(['ALL', 'Grade A', 'Grade B', 'Grade C'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                gradeFilter === g ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
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
          className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="HOD_APPROVED">HOD APPROVED</option>
          <option value="DRAFT">DRAFT</option>
        </select>

        {/* Count badge */}
        <span className="ml-auto text-[11px] font-bold text-slate-400">
          Showing {filteredAppraisals.length} of {totalCount}
        </span>
      </div>

      {/* ── SCROLLABLE FACULTY TABLE ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
              <th className="px-5 py-3 min-w-[220px]">Faculty Member</th>
              <th className="px-4 py-3 min-w-[180px]">Designation &amp; Dept</th>
              <th className="px-4 py-3 text-center min-w-[160px]">Score Summary</th>
              <th className="px-4 py-3 text-center min-w-[120px]">Performance Grade</th>
              <th className="px-4 py-3 text-center min-w-[130px]">Form Status</th>
              <th className="px-4 py-3 text-center min-w-[140px]">Appraisal Access</th>
              <th className="px-5 py-3 text-right min-w-[220px]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredAppraisals.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-16 text-center text-slate-400 font-medium text-xs">
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
                    className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                  >
                    {/* Faculty Info */}
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200">
                          {rec.facultyName?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">{rec.facultyName ?? 'N/A'}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                    </td>

                    {/* Designation */}
                    <td className="px-4 py-3.5 align-middle">
                      <p className="font-bold text-slate-800 leading-snug text-[11px] truncate max-w-[160px]">{rec.designation}</p>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate max-w-[160px]">{rec.department}</p>
                    </td>

                    {/* Score Summary */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-800 text-[11px] border border-slate-200/80">
                          Self: {selfScore} / 350
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200/80">
                          HOD: {hodScore} / 350
                        </span>
                      </div>
                    </td>

                    {/* Grade Badge */}
                    <td className="px-4 py-3.5 text-center align-middle">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border shadow-2xs ${
                        calculatedGrade === 'Grade A'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : calculatedGrade === 'Grade B'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <Award className="w-3 h-3" />
                        {calculatedGrade}
                      </span>
                    </td>

                    {/* Form Status */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                        rec.status === 'SUBMITTED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : rec.status === 'HOD_APPROVED'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.status === 'HOI_APPROVED'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {rec.status?.replace(/_/g, ' ') ?? 'DRAFT'}
                      </span>
                    </td>

                    {/* Access Switch */}
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => handleToggleAccess(rec)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold transition-all ${
                          isEnabled
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isEnabled ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        <span>{isEnabled ? 'Enabled' : 'Locked'}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewFullModalRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View Details
                        </button>
                        <button
                          onClick={() => { setSelectedRecordId(rec.id); setIsVerificationOpen(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors"
                        >
                          <FileCheck className="w-3 h-3" /> Verify
                        </button>
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
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {recordData.facultyName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">
                    Score Verification &amp; Review — {recordData.facultyName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {recordData.empId} &bull; {recordData.designation} &bull; {recordData.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewFullModalRecord(recordData)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Full Profile
                </button>
                <button
                  onClick={() => setIsVerificationOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
              
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Self Total</span>
                  <span className="text-sm font-black text-slate-900">{recordData.selfScoreTotal} / 350</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">HOD Verified</span>
                  <span className="text-sm font-black text-emerald-600">{recordData.hodScoreTotal} / 350</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Current Grade</span>
                  <span className="text-sm font-black text-blue-600">{recordData.grade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="text-sm font-black text-purple-600">{recordData.status}</span>
                </div>
              </div>

              {/* Score Matrix Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="px-4 py-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-xs">Score Verification Matrix</h4>
                  <span className="text-[11px] text-slate-500 font-medium">Enter corrected HOD marks in the green inputs</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-2.5 font-semibold text-slate-500 text-[10px] uppercase tracking-wide w-[45%]">Criteria Item</th>
                        <th className="px-3 py-2.5 font-semibold text-slate-500 text-[10px] uppercase tracking-wide text-center">Self Score</th>
                        <th className="px-3 py-2.5 font-semibold text-emerald-600 text-[10px] uppercase tracking-wide text-center">HOD Score ✎</th>
                        <th className="px-3 py-2.5 font-semibold text-rose-600 text-[10px] uppercase tracking-wide text-center">
                          <label className="inline-flex items-center gap-1 cursor-pointer bg-rose-100/80 px-2 py-0.5 rounded border border-rose-300">
                            <input
                              type="checkbox"
                              checked={allKeysFlagged}
                              onChange={handleToggleSelectAll}
                              className="w-3 h-3 accent-rose-600 rounded cursor-pointer"
                            />
                            <span className="text-rose-800 font-bold text-[10px]">Flag All 🚩</span>
                          </label>
                        </th>
                        <th className="px-4 py-2.5 font-semibold text-slate-500 text-[10px] uppercase tracking-wide">Proof Link</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Cat I Header */}
                      <tr className="bg-blue-50/80">
                        <td colSpan={5} className="px-4 py-2 font-bold text-blue-800 text-[11px]">
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
                                className="w-14 text-center text-xs font-bold text-emerald-700 border border-emerald-300 rounded px-1 py-1 bg-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                <a href={field.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Cat II Header */}
                      <tr className="bg-purple-50/80">
                        <td colSpan={5} className="px-4 py-2 font-bold text-purple-800 text-[11px]">
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
                                className="w-14 text-center text-xs font-bold text-emerald-700 border border-emerald-300 rounded px-1 py-1 bg-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                                <a href={field.proofUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                                  View <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : <span className="text-slate-300">—</span>}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Cat III Header */}
                      <tr className="bg-emerald-50/80">
                        <td colSpan={5} className="px-4 py-2 font-bold text-emerald-800 text-[11px]">
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
                                className="w-14 text-center text-xs font-bold text-emerald-700 border border-emerald-300 rounded px-1 py-1 bg-emerald-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
                              <span className="text-emerald-700 font-bold text-[11px]">{count} Item(s) Verified</span>
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
                <label className="block text-xs font-bold text-slate-700">
                  HOD Review Comments &amp; Verification Remarks:
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter evaluation notes, adjustment rationale, or revision details..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

            </div>

            {/* Drawer Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button
                onClick={() => setIsVerificationOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleRequestRevision}
                  disabled={recordData.status !== 'SUBMITTED'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="w-4 h-4" /> Request Revision
                </button>
                <button
                  onClick={handleApprove}
                  disabled={recordData.status !== 'SUBMITTED'}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve &amp; Verify Marks
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── END-TO-END A-Z FULL APPRAISAL MODAL ── */}
      {viewFullModalRecord && (
        <FullAppraisalModal
          record={viewFullModalRecord}
          onClose={() => setViewFullModalRecord(null)}
        />
      )}
    </div>
  );
};
