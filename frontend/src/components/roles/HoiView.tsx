'use client';

import React, { useState, useMemo } from 'react';
import { AppraisalRecord, GradeType } from '@/types/appraisal';
import { MOCK_USERS } from '@/lib/initialData';
import { calculateCategory1, calculateCategory2, calculateCategory3, calculateGrade } from '@/lib/scoring';
import {
  CheckCircle2,
  Building2,
  ExternalLink,
  Users,
  ClipboardCheck,
  RotateCcw,
  Award,
  User,
  Printer,
  Search,
  Filter,
  Eye,
  ShieldCheck,
  TrendingUp,
  X,
  FileCheck,
  Clock,
  UserCheck,
  ChevronRight,
  School,
  Lock,
  Unlock,
} from 'lucide-react';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';

interface HoiViewProps {
  appraisals: AppraisalRecord[];
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
  onRefreshData?: () => Promise<boolean>;
}

export const HoiView: React.FC<HoiViewProps> = ({ appraisals, onUpdateAppraisal, onRefreshData }) => {
  // Master Filter & Search States
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedHodName, setSelectedHodName] = useState<string>('ALL');
  const [selectedFacultyEmpId, setSelectedFacultyEmpId] = useState<string>('ALL');
  const [gradeFilter, setGradeFilter] = useState<'ALL' | GradeType>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Modal / Drawer States
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [viewFullModalRecord, setViewFullModalRecord] = useState<AppraisalRecord | null>(null);
  const [isHoiReviewOpen, setIsHoiReviewOpen] = useState<boolean>(false);

  // Active selected record for HOI Review modal
  const selectedRecord = useMemo(
    () => appraisals.find((a) => a.id === selectedRecordId) || appraisals[0],
    [appraisals, selectedRecordId]
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
    if (rec.grade) return rec.grade as GradeType;
    const c1 = calculateCategory1(rec.cat1).hodTotal;
    const c2 = calculateCategory2(rec.cat2).hodTotal;
    const c3 = calculateCategory3(rec.cat3).hodTotal;
    return calculateGrade(rec.designation, c1 + c2 + c3);
  };

  /* ── 1. Unique Departments List ── */
  const availableDepartments = useMemo(() => {
    const set = new Set(appraisals.map((a) => a.department));
    return ['ALL', ...Array.from(set)];
  }, [appraisals]);

  /* ── 2. Unique HOD Names List from MOCK_USERS and Appraisals ── */
  const availableHods = useMemo(() => {
    const hodUsers = MOCK_USERS.filter((u) => u.role === 'HOD');
    const hodNamesFromAppraisals = appraisals.map((a) => a.generalDetails?.reportingHodName).filter(Boolean);
    const combined = Array.from(new Set([...hodUsers.map((h) => h.name), ...hodNamesFromAppraisals]));
    return ['ALL', ...combined];
  }, [appraisals]);

  /* ── 3. Dependent Faculty Names List ── */
  const availableFaculty = useMemo(() => {
    return appraisals.filter((a) => {
      const matchesDept = selectedDept === 'ALL' || a.department === selectedDept;
      const matchesHod = selectedHodName === 'ALL' || a.generalDetails?.reportingHodName === selectedHodName;
      return matchesDept && matchesHod;
    });
  }, [appraisals, selectedDept, selectedHodName]);

  /* ── 4. Master Filtered Appraisals List ── */
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((a) => {
      // Search Query
      const matchesSearch =
        searchQuery === '' ||
        a.facultyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.empId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.generalDetails?.reportingHodName || '').toLowerCase().includes(searchQuery.toLowerCase());

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
  }, [appraisals, searchQuery, selectedDept, selectedHodName, selectedFacultyEmpId, gradeFilter, statusFilter]);

  // KPI Metrics
  const totalCount = appraisals.length;
  const hoiApprovedCount = appraisals.filter((a) => a.status === 'HOI_APPROVED').length;
  const pendingHoiCount = appraisals.filter((a) => a.status === 'HOD_APPROVED').length;
  const gradeACount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade A').length;
  const gradeBCount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade B').length;
  const gradeCCount = appraisals.filter((a) => getCalculatedGrade(a) === 'Grade C').length;

  // HOI Approval Handler
  const handleApprove = () => {
    if (!recordData) return;
    const c1 = calculateCategory1(recordData.cat1).hodTotal;
    const c2 = calculateCategory2(recordData.cat2).hodTotal;
    const c3 = calculateCategory3(recordData.cat3).hodTotal;
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
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-5 z-[150] flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl text-xs font-bold border animate-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' ? 'bg-slate-900 text-emerald-300 border-emerald-500/40' : 'bg-rose-900 text-rose-100 border-rose-700'
        }`}>
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── STICKY TOP HEADER BAR ── */}
      <div className="shrink-0 bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">HOI / Dean Executive Console</h1>
            <p className="text-xs text-slate-400 font-medium">Institutional oversight across all departments — final HOI sign-off authority.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* REFRESH BUTTON */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all active:scale-95"
            title="Refresh latest institutional data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-300">
            <School className="w-4 h-4 text-purple-400" />
            <span>{totalCount} Total Faculty</span>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ROW ── */}
      <div className="shrink-0 grid grid-cols-2 sm:grid-cols-4 gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200">
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Users className="w-7 h-7 text-slate-300 shrink-0" />
          <div>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Total Faculty</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <CheckCircle2 className="w-7 h-7 text-purple-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-purple-700">{hoiApprovedCount}</p>
            <p className="text-xs text-slate-400 font-bold uppercase">HOI Approved</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Clock className="w-7 h-7 text-blue-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-blue-700">{pendingHoiCount}</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Pending HOI Review</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-2xs flex items-center gap-3">
          <Award className="w-7 h-7 text-emerald-200 shrink-0" />
          <div>
            <p className="text-xl font-black text-emerald-700">{gradeACount}</p>
            <p className="text-xs text-slate-400 font-bold uppercase">Grade A &bull; B:{gradeBCount} C:{gradeCCount}</p>
          </div>
        </div>
      </div>

      {/* ── COMPACT FILTER TOOLBAR ── */}
      <div className="shrink-0 px-5 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[180px] max-w-xs flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search faculty, ID, HOD..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Department */}
        <select
          value={selectedDept}
          onChange={(e) => { setSelectedDept(e.target.value); setSelectedFacultyEmpId('ALL'); }}
          className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value="ALL">All Departments</option>
          {availableDepartments.filter((d) => d !== 'ALL').map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* HOD */}
        <select
          value={selectedHodName}
          onChange={(e) => { setSelectedHodName(e.target.value); setSelectedFacultyEmpId('ALL'); }}
          className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value="ALL">All HOD Names</option>
          {availableHods.filter((h) => h !== 'ALL').map((hod) => (
            <option key={hod} value={hod}>{hod}</option>
          ))}
        </select>

        {/* Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none cursor-pointer"
        >
          <option value="ALL">All Statuses</option>
          <option value="HOD_APPROVED">HOD APPROVED</option>
          <option value="HOI_APPROVED">HOI APPROVED</option>
          <option value="SUBMITTED">SUBMITTED</option>
          <option value="DRAFT">DRAFT</option>
        </select>

        {/* Grade pills */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl p-1">
          {(['ALL', 'Grade A', 'Grade B', 'Grade C'] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGradeFilter(g)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                gradeFilter === g ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              {g === 'ALL' ? 'All' : g}
            </button>
          ))}
        </div>

        <span className="ml-auto text-[13px] font-bold text-slate-400">
          {filteredAppraisals.length} / {totalCount} shown
        </span>
      </div>

      {/* ── SCROLLABLE TABLE ── */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        <table className="w-full text-left text-xs min-w-[900px]">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-xs tracking-wider">
              <th className="px-5 py-3 min-w-[220px]">Faculty Member</th>
              <th className="px-4 py-3 min-w-[180px]">Department &amp; Designation</th>
              <th className="px-4 py-3 min-w-[160px]">Reporting HOD</th>
              <th className="px-4 py-3 text-center min-w-[150px]">Score Summary</th>
              <th className="px-4 py-3 text-center min-w-[120px]">Grade</th>
              <th className="px-4 py-3 text-center min-w-[130px]">Status</th>
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
                let calculatedGrade: string;
                try { calculatedGrade = getCalculatedGrade(rec); } catch { calculatedGrade = 'Grade C'; }
                const isSelected = selectedRecordId === rec.id;
                const selfScore = Math.min(rec.selfScoreTotal ?? 0, 350);
                const hodScore = Math.min(rec.hodScoreTotal ?? 0, 350);

                return (
                  <tr key={rec.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-purple-50/30' : ''}`}>
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center shrink-0 border border-purple-200">
                          {rec.facultyName?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-900 leading-tight">{rec.facultyName ?? 'N/A'}</p>
                          <p className="text-xs text-slate-400 font-mono mt-0.5">{rec.empId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <p className="font-bold text-slate-800 text-[13px] truncate max-w-[160px]">{rec.department}</p>
                      <p className="text-[13px] text-slate-500 font-medium mt-0.5 truncate max-w-[160px]">{rec.designation}</p>
                    </td>
                    <td className="px-4 py-3.5 align-middle">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80 inline-block text-[13px] truncate max-w-[140px]">
                        {rec.generalDetails?.reportingHodName || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-800 text-[13px] border border-slate-200/80">
                          Self: {selfScore}/350
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-[13px] border border-emerald-200/80">
                          HOD: {hodScore}/350
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-center align-middle">
                      <span className={`inline-flex items-center gap-1 text-[13px] font-extrabold px-2.5 py-1 rounded-full border ${
                        calculatedGrade === 'Grade A' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : calculatedGrade === 'Grade B' ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        <Award className="w-3 h-3" />
                        {calculatedGrade}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md border ${
                        rec.status === 'HOI_APPROVED' ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : rec.status === 'HOD_APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : rec.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {rec.status?.replace(/_/g, ' ') ?? 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewFullModalRecord(rec)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors"
                        >
                          <Eye className="w-3 h-3" /> View Details
                        </button>
                        <button
                          onClick={() => { setSelectedRecordId(rec.id); setIsHoiReviewOpen(true); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs transition-colors"
                        >
                          <FileCheck className="w-3 h-3" /> Sign-Off
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

      {/* ── HOI REVIEW & SIGN-OFF MODAL ── */}
      {isHoiReviewOpen && recordData && (
        <div className="fixed inset-0 z-[130] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-purple-600 text-white font-bold text-base flex items-center justify-center shrink-0">
                  {recordData.facultyName?.charAt(0) ?? '?'}
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white">HOI Institutional Approval — {recordData.facultyName}</h3>
                  <p className="text-xs text-slate-400">{recordData.empId} &bull; {recordData.designation} &bull; {recordData.department}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewFullModalRecord(recordData)}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" /> View Full Profile
                </button>
                <button onClick={() => setIsHoiReviewOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Drawer Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs text-slate-800">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-purple-50/60 p-4 rounded-xl border border-purple-200">
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold">Reporting HOD</span>
                  <span className="text-xs font-bold text-slate-900">{recordData.generalDetails?.reportingHodName || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold">Verified HOD Score</span>
                  <span className="text-sm font-black text-emerald-700">{Math.min(recordData.hodScoreTotal ?? 0, 350)} / 350</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold">Calculated Grade</span>
                  <span className="text-sm font-black text-purple-700">{recordData.grade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-xs uppercase font-bold">Current Status</span>
                  <span className="text-sm font-black text-blue-700">{recordData.status?.replace(/_/g, ' ')}</span>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900 text-xs border-b border-slate-200 pb-2">Category Score Breakdown (HOD Verified)</h4>
                <div className="grid grid-cols-3 gap-3 text-center pt-1">
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-xs font-bold uppercase">Cat I: Teaching</span>
                    <span className="text-sm font-black text-blue-700">{recordData.cat1?.totalHodScore ?? 0} / 110</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-xs font-bold uppercase">Cat II: Co-Curricular</span>
                    <span className="text-sm font-black text-purple-700">{recordData.cat2?.totalHodScore ?? 0} / 50</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="text-slate-400 block text-xs font-bold uppercase">Cat III: Research</span>
                    <span className="text-sm font-black text-amber-700">{recordData.cat3?.totalHodScore ?? 0} / 190</span>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
                <span className="text-xs font-bold uppercase text-slate-400">HOD Reviewer Remarks:</span>
                <p className="text-slate-800 italic font-medium">{recordData.hodRemarks || 'HOD verified criteria scores and approved submission.'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">HOI / Dean Institutional Remarks:</label>
                <textarea
                  value={hoiRemarks}
                  onChange={(e) => setHoiRemarks(e.target.value)}
                  placeholder="Enter HOI institutional notes, commendations, or revision notes..."
                  rows={3}
                  className="w-full text-xs border border-slate-200 rounded-xl p-3 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <button onClick={() => setIsHoiReviewOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <div className="flex items-center gap-3">
                <button onClick={handleRequestRevision} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 font-bold transition-colors">
                  <RotateCcw className="w-4 h-4" /> Request Revision
                </button>
                <button onClick={handleApprove} className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-purple-700 text-white font-bold hover:bg-purple-800 transition-colors shadow-md">
                  <CheckCircle2 className="w-4 h-4" /> Grant Institutional Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL APPRAISAL MODAL ── */}
      {viewFullModalRecord && (
        <FullAppraisalModal record={viewFullModalRecord} onClose={() => setViewFullModalRecord(null)} />
      )}
    </div>
  );
};


