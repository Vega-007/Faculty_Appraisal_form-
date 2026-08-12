'use client';

import React, { useState, useMemo } from 'react';
import {
  AppraisalRecord,
  MonthlyWindow,
  AuditLog,
  CAMPUS_HIERARCHY,
  SchemaCriterion,
} from '@/types/appraisal';
import { DEFAULT_SCHEMA_CRITERIA } from '@/lib/initialData';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';
import {
  ShieldCheck,
  Lock,
  Unlock,
  BarChart2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  X,
  Award,
  BookOpen,
  UserCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Settings,
  FileSpreadsheet,
  Grid,
  DollarSign,
  Sliders,
  Trash2,
  RotateCcw,
  Plus,
  Printer,
  PieChart as PieIcon,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  FileText,
  Building,
  School,
  CheckSquare,
  Square,
  Sparkles,
  Users,
  Download,
  Check,
  Briefcase,
  FileBadge,
  GraduationCap,
  Layers,
  LayoutDashboard,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import * as XLSX from 'xlsx';

interface AdminChairmanViewProps {
  appraisals: AppraisalRecord[];
  monthlyWindows: MonthlyWindow[];
  auditLogs: AuditLog[];
  onToggleWindow: (monthYear: string) => void;
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
}

export const AdminChairmanView: React.FC<AdminChairmanViewProps> = ({
  appraisals,
  monthlyWindows,
  auditLogs,
  onToggleWindow,
  onUpdateAppraisal,
}) => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  /* ── 1. Active View Mode: DASHBOARD, TABLE, SCHEMA_MANAGER ── */
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'TABLE' | 'SCHEMA_MANAGER'>('DASHBOARD');

  /* ── 2. Filter Sidebar Toggle State ── */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  /* ── 3. EXHAUSTIVE FIELD-BY-FIELD FILTER STATES ── */
  const [selectedFacultyEmpId, setSelectedFacultyEmpId] = useState<string>('ALL');
  const [selectedHodName, setSelectedHodName] = useState<string>('ALL');
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedWindow, setSelectedWindow] = useState('ALL');

  // Numeric Threshold Sliders
  const [minTotalScore, setMinTotalScore] = useState<number>(0);
  const [minCat1Score, setMinCat1Score] = useState<number>(0);
  const [minCat2Score, setMinCat2Score] = useState<number>(0);
  const [minCat3Score, setMinCat3Score] = useState<number>(0);

  // Small Field Checkbox Filters
  const [minSciPapers, setMinSciPapers] = useState<number>(0);
  const [filterQ1Only, setFilterQ1Only] = useState<boolean>(false);
  const [filterPatentsOnly, setFilterPatentsOnly] = useState<boolean>(false);
  const [filterGrantsOnly, setFilterGrantsOnly] = useState<boolean>(false);
  const [filterCitationsOnly, setFilterCitationsOnly] = useState<boolean>(false);
  const [filterPhdSupervision, setFilterPhdSupervision] = useState<boolean>(false);
  const [filterNptelMooc, setFilterNptelMooc] = useState<boolean>(false);

  /* ── 4. Table Selection Checkboxes for Excel Download ── */
  const [selectedAppraisalIds, setSelectedAppraisalIds] = useState<Set<string>>(new Set());

  /* ── 5. Table Pagination & Sorting ── */
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<'name' | 'score' | 'grade' | 'dept'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  /* ── 6. Modal States ── */
  const [viewRecord, setViewRecord] = useState<AppraisalRecord | null>(null);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState<boolean>(false);

  /* ── 7. Schema Manager State ── */
  const [schemaCriteria, setSchemaCriteria] = useState<SchemaCriterion[]>(DEFAULT_SCHEMA_CRITERIA);
  const [newCriteriaLabel, setNewCriteriaLabel] = useState('');
  const [newCriteriaCategory, setNewCriteriaCategory] = useState<'cat1' | 'cat2' | 'cat3'>('cat1');
  const [newCriteriaMaxScore, setNewCriteriaMaxScore] = useState<number>(10);
  const [newCriteriaDesc, setNewCriteriaDesc] = useState('');
  const [newCriteriaMandatory, setNewCriteriaMandatory] = useState<boolean>(false);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Faculty Options List ── */
  const allFacultyOptions = useMemo(() => {
    const list = appraisals.map((a) => ({
      empId: a.empId,
      name: a.facultyName,
      dept: a.department,
    }));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [appraisals]);

  /* ── HOD Options List ── */
  const allHodOptions = useMemo(() => {
    const set = new Set<string>();
    appraisals.forEach((a) => {
      if (a.generalDetails?.reportingHodName) {
        set.add(a.generalDetails.reportingHodName);
      }
    });
    return Array.from(set).sort();
  }, [appraisals]);

  /* ── Cascading Institution Options ── */
  const availableInstitutions = useMemo(() => {
    if (selectedCampus === 'ALL') {
      const allInsts: string[] = [];
      CAMPUS_HIERARCHY.forEach((c) => c.institutions.forEach((inst) => allInsts.push(inst.name)));
      return ['ALL', ...Array.from(new Set(allInsts))];
    }
    const node = CAMPUS_HIERARCHY.find((c) => c.campus === selectedCampus);
    if (!node) return ['ALL'];
    return ['ALL', ...node.institutions.map((i) => i.name)];
  }, [selectedCampus]);

  /* ── Cascading Department Options ── */
  const availableDepartments = useMemo(() => {
    if (selectedInstitution !== 'ALL') {
      let depts: string[] = [];
      CAMPUS_HIERARCHY.forEach((c) => {
        const inst = c.institutions.find((i) => i.name === selectedInstitution);
        if (inst) depts.push(...inst.departments);
      });
      if (depts.length > 0) return ['ALL', ...Array.from(new Set(depts))];
    }
    if (selectedCampus !== 'ALL') {
      const node = CAMPUS_HIERARCHY.find((c) => c.campus === selectedCampus);
      if (node) {
        let depts: string[] = [];
        node.institutions.forEach((inst) => depts.push(...inst.departments));
        return ['ALL', ...Array.from(new Set(depts))];
      }
    }
    const set = new Set(appraisals.map((a) => a.department));
    return ['ALL', ...Array.from(set)];
  }, [selectedCampus, selectedInstitution, appraisals]);

  /* ── MASTER EXHAUSTIVE REAL-TIME FILTER ENGINE ── */
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((a) => {
      // 1. Direct Individual Faculty Selector
      if (selectedFacultyEmpId !== 'ALL' && a.empId !== selectedFacultyEmpId) {
        return false;
      }

      // 2. Direct Reporting HOD Selector
      if (selectedHodName !== 'ALL' && a.generalDetails?.reportingHodName !== selectedHodName) {
        return false;
      }

      // 3. Campus & Institution & Department & Designation
      const matchesCampus =
        selectedCampus === 'ALL' ||
        !a.campus ||
        a.campus === selectedCampus ||
        (selectedCampus === 'SRM Ramapuram Campus' && (!a.campus || a.campus.includes('Ramapuram'))) ||
        (selectedCampus === 'SRM Trichy Campus' && a.campus.includes('Trichy'));

      const matchesInst =
        selectedInstitution === 'ALL' ||
        !a.institution ||
        a.institution === selectedInstitution ||
        (selectedInstitution.includes('Easwari') && a.institution.includes('Easwari')) ||
        (selectedInstitution.includes('Dental') && a.institution.includes('Dental')) ||
        (selectedInstitution.includes('Prime') && a.institution.includes('Prime')) ||
        (selectedInstitution.includes('Science & Humanities') && (a.institution.includes('Humanities') || a.institution.includes('S&H'))) ||
        (selectedInstitution.includes('SRMIST') && (a.institution === 'SRM IST' || a.institution.includes('SRMIST')));

      const matchesDept =
        selectedDept === 'ALL' ||
        a.department === selectedDept ||
        a.department.toLowerCase().includes(selectedDept.toLowerCase());

      const matchesDesig =
        selectedDesignation === 'ALL' ||
        a.designation === selectedDesignation ||
        (selectedDesignation === 'HOD' && a.designation.includes('HOD'));

      // 4. Search Query
      const matchesSearch =
        searchTerm === '' ||
        a.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.department.toLowerCase().includes(searchTerm.toLowerCase());

      // 5. Status & Grade & Window
      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
      const matchesGrade = selectedGrade === 'ALL' || a.grade === selectedGrade;
      const matchesWindow = selectedWindow === 'ALL' || a.monthYear === selectedWindow;

      // 6. Score Thresholds
      const scoreTotal = a.hodScoreTotal || a.selfScoreTotal || 0;
      const c1Score = a.cat1.totalHodScore || a.cat1.totalSelfScore || 0;
      const c2Score = a.cat2.totalHodScore || a.cat2.totalSelfScore || 0;
      const c3Score = a.cat3.totalHodScore || a.cat3.totalSelfScore || 0;

      const matchesScore =
        scoreTotal >= minTotalScore &&
        c1Score >= minCat1Score &&
        c2Score >= minCat2Score &&
        c3Score >= minCat3Score;

      // 7. Small Field Specific Filters
      const matchesSci = a.cat3.journals.length >= minSciPapers;
      const matchesQ1 = !filterQ1Only || a.cat3.journals.some((j) => j.quartile === 'Q1');
      const matchesPatents = !filterPatentsOnly || a.cat3.patents.length > 0;
      const matchesGrants = !filterGrantsOnly || a.cat3.fundedProjects.length > 0;
      const matchesCitations = !filterCitationsOnly || (a.cat3.citationsScopus?.length > 0 || a.cat3.citationsQ1?.length > 0);
      const matchesPhd = !filterPhdSupervision || (a.cat3.phdSupervisionTable && a.cat3.phdSupervisionTable.length > 0);
      const matchesNptel = !filterNptelMooc || ((a.cat1.nptelTable && a.cat1.nptelTable.length > 0) || (a.cat1.moocTable && a.cat1.moocTable.length > 0));

      return (
        matchesCampus &&
        matchesInst &&
        matchesDept &&
        matchesDesig &&
        matchesSearch &&
        matchesStatus &&
        matchesGrade &&
        matchesWindow &&
        matchesScore &&
        matchesSci &&
        matchesQ1 &&
        matchesPatents &&
        matchesGrants &&
        matchesCitations &&
        matchesPhd &&
        matchesNptel
      );
    });
  }, [
    appraisals,
    selectedFacultyEmpId,
    selectedHodName,
    selectedCampus,
    selectedInstitution,
    selectedDept,
    selectedDesignation,
    searchTerm,
    selectedStatus,
    selectedGrade,
    selectedWindow,
    minTotalScore,
    minCat1Score,
    minCat2Score,
    minCat3Score,
    minSciPapers,
    filterQ1Only,
    filterPatentsOnly,
    filterGrantsOnly,
    filterCitationsOnly,
    filterPhdSupervision,
    filterNptelMooc,
  ]);

  /* ── Sorted & Paginated Records ── */
  const sortedAppraisals = useMemo(() => {
    return [...filteredAppraisals].sort((a, b) => {
      let valA: any = a.facultyName;
      let valB: any = b.facultyName;
      if (sortField === 'score') {
        valA = a.hodScoreTotal || a.selfScoreTotal || 0;
        valB = b.hodScoreTotal || b.selfScoreTotal || 0;
      } else if (sortField === 'grade') {
        valA = a.grade;
        valB = b.grade;
      } else if (sortField === 'dept') {
        valA = a.department;
        valB = b.department;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAppraisals, sortField, sortOrder]);

  const totalRecordsCount = sortedAppraisals.length;
  const effectivePageSize = pageSize === 0 ? Math.max(totalRecordsCount, 1) : pageSize;
  const totalPages = Math.ceil(totalRecordsCount / effectivePageSize) || 1;

  const paginatedAppraisals = useMemo(() => {
    if (pageSize === 0) return sortedAppraisals;
    const startIndex = (currentPage - 1) * pageSize;
    return sortedAppraisals.slice(startIndex, startIndex + pageSize);
  }, [sortedAppraisals, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [
    selectedFacultyEmpId,
    selectedHodName,
    selectedCampus,
    selectedInstitution,
    selectedDept,
    selectedDesignation,
    searchTerm,
    selectedStatus,
    selectedGrade,
    selectedWindow,
    minTotalScore,
    minCat1Score,
    minCat2Score,
    minCat3Score,
    minSciPapers,
    filterQ1Only,
    filterPatentsOnly,
    filterGrantsOnly,
    filterCitationsOnly,
    filterPhdSupervision,
    filterNptelMooc,
    pageSize,
  ]);

  /* ── Reset All Filters Helper ── */
  const handleResetFilters = () => {
    setSelectedFacultyEmpId('ALL');
    setSelectedHodName('ALL');
    setSelectedCampus('ALL');
    setSelectedInstitution('ALL');
    setSelectedDept('ALL');
    setSelectedDesignation('ALL');
    setSearchTerm('');
    setSelectedStatus('ALL');
    setSelectedGrade('ALL');
    setSelectedWindow('ALL');
    setMinTotalScore(0);
    setMinCat1Score(0);
    setMinCat2Score(0);
    setMinCat3Score(0);
    setMinSciPapers(0);
    setFilterQ1Only(false);
    setFilterPatentsOnly(false);
    setFilterGrantsOnly(false);
    setFilterCitationsOnly(false);
    setFilterPhdSupervision(false);
    setFilterNptelMooc(false);
    setSelectedAppraisalIds(new Set());
    triggerToast('All ERP evaluation filters reset.');
  };

  /* ── Checkbox Selection Handlers ── */
  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedAppraisalIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAppraisalIds(next);
  };

  const handleToggleSelectAllPage = () => {
    const currentPageIds = paginatedAppraisals.map((a) => a.id);
    const allSelected = currentPageIds.every((id) => selectedAppraisalIds.has(id));

    const next = new Set(selectedAppraisalIds);
    if (allSelected) {
      currentPageIds.forEach((id) => next.delete(id));
    } else {
      currentPageIds.forEach((id) => next.add(id));
    }
    setSelectedAppraisalIds(next);
  };

  /* ── Correct Executive Metrics Engine ── */
  const executiveMetrics = useMemo(() => {
    let totalPubs = 0;
    let q1Journals = 0;
    let totalPatentsCount = 0;
    let totalGrantsVal = 0;
    let totalGrantsCount = 0;
    let totalScoreSum = 0;
    let gradeACount = 0;
    let gradeBCount = 0;
    let gradeCCount = 0;

    filteredAppraisals.forEach((a) => {
      totalPubs += a.cat3.journals.length;
      q1Journals += a.cat3.journals.filter((j) => j.quartile === 'Q1').length;
      totalPatentsCount += a.cat3.patents.length;
      totalGrantsCount += a.cat3.fundedProjects.length;

      a.cat3.fundedProjects.forEach((p) => {
        totalGrantsVal += Number(p.amountSanctioned || 0);
      });

      totalScoreSum += Math.min((a.hodScoreTotal || a.selfScoreTotal || 0), 350);
      if (a.grade === 'Grade A') gradeACount += 1;
      else if (a.grade === 'Grade B') gradeBCount += 1;
      else gradeCCount += 1;
    });

    const totalCount = filteredAppraisals.length;
    const avgScore = totalCount > 0 ? Number((totalScoreSum / totalCount).toFixed(1)) : 0;
    const gradeAPct = totalCount > 0 ? Number(((gradeACount / totalCount) * 100).toFixed(1)) : 0;
    const gradeBPct = totalCount > 0 ? Number(((gradeBCount / totalCount) * 100).toFixed(1)) : 0;

    return {
      totalCount,
      avgScore,
      totalPubs,
      q1Journals,
      totalPatentsCount,
      totalGrantsVal,
      totalGrantsCount,
      gradeACount,
      gradeBCount,
      gradeCCount,
      gradeAPct,
      gradeBPct,
    };
  }, [filteredAppraisals]);

  /* ── Chart Data ── */
  const departmentChartData = useMemo(() => {
    const deptMap: Record<string, { cat1Sum: number; cat2Sum: number; cat3Sum: number; count: number }> = {};
    filteredAppraisals.forEach((a) => {
      const dept = a.department;
      if (!deptMap[dept]) {
        deptMap[dept] = { cat1Sum: 0, cat2Sum: 0, cat3Sum: 0, count: 0 };
      }
      deptMap[dept].cat1Sum += a.cat1.totalHodScore || a.cat1.totalSelfScore || 0;
      deptMap[dept].cat2Sum += a.cat2.totalHodScore || a.cat2.totalSelfScore || 0;
      deptMap[dept].cat3Sum += a.cat3.totalHodScore || a.cat3.totalSelfScore || 0;
      deptMap[dept].count += 1;
    });

    return Object.entries(deptMap).map(([dept, data]) => ({
      dept: dept.length > 10 ? `${dept.slice(0, 8)}..` : dept,
      Cat1_Teaching: Number((data.cat1Sum / data.count).toFixed(1)),
      Cat2_CoCurricular: Number((data.cat2Sum / data.count).toFixed(1)),
      Cat3_Research: Number((data.cat3Sum / data.count).toFixed(1)),
    }));
  }, [filteredAppraisals]);

  const pieGradeData = useMemo(() => [
    { name: 'Grade A', value: executiveMetrics.gradeACount, color: '#10B981' },
    { name: 'Grade B', value: executiveMetrics.gradeBCount, color: '#2563EB' },
    { name: 'Grade C', value: executiveMetrics.gradeCCount, color: '#F59E0B' },
  ], [executiveMetrics]);

  /* ── EXCEL EXPORT ENGINE FOR SELECTED OR FILTERED FACULTY ── */
  const handleExportExcel = (onlySelected: boolean = false) => {
    const targetRecords = onlySelected
      ? filteredAppraisals.filter((a) => selectedAppraisalIds.has(a.id))
      : filteredAppraisals;

    if (targetRecords.length === 0) {
      triggerToast(onlySelected ? 'Please select at least one faculty row using the checkboxes.' : 'No faculty records match your filters.', 'error');
      return;
    }

    // Sheet 1: Master Summary
    const masterRows = targetRecords.map((a) => ({
      'Employee ID': a.empId,
      'Faculty Name': a.facultyName,
      'Department': a.department,
      'Designation': a.designation,
      'Institution': a.institution || 'SRMIST',
      'Campus': a.campus || 'SRM Ramapuram Campus',
      'Reporting HOD': a.generalDetails?.reportingHodName || '—',
      'Self Score Total': a.selfScoreTotal,
      'HOD Verified Total': a.hodScoreTotal,
      'Performance Grade': a.grade,
      'Form Status': a.status,
      'SCI/Scopus Papers': a.cat3.journals.length,
      'Patents Count': a.cat3.patents.length,
      'Sponsored Grants (₹)': a.cat3.fundedProjects.reduce((sum, p) => sum + Number(p.amountSanctioned || 0), 0),
      'Evaluation Window': a.monthYear,
      'Updated At': a.updatedAt || '—',
    }));

    // Sheet 2: Category III Research Breakdown
    const researchRows: any[] = [];
    targetRecords.forEach((a) => {
      a.cat3.journals.forEach((j) => {
        researchRows.push({
          'Employee ID': a.empId,
          'Faculty Name': a.facultyName,
          'Department': a.department,
          'Paper Title': j.title,
          'Journal Name': j.journalName,
          'Indexing': j.indexing,
          'Quartile': j.quartile,
          'Author Position': j.authorPosition,
          'DOI Link': j.doiLink || '—',
        });
      });
    });

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(masterRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Faculty Appraisal Master');

    if (researchRows.length > 0) {
      const ws2 = XLSX.utils.json_to_sheet(researchRows);
      XLSX.utils.book_append_sheet(wb, ws2, 'Research Publications Detail');
    }

    const filename = onlySelected
      ? `SRM_Ramapuram_Selected_${targetRecords.length}_Faculty.xlsx`
      : `SRM_Ramapuram_Appraisal_Master_${targetRecords.length}_Records.xlsx`;

    XLSX.writeFile(wb, filename);
    triggerToast(`Exported ${targetRecords.length} faculty profile(s) to Excel!`);
  };

  /* ── PDF EXPORT ENGINE ── */
  const handleExportPdf = () => {
    triggerToast('Preparing Institutional Summary PDF for printing...');
    setTimeout(() => {
      window.print();
    }, 300);
  };

  /* ── Schema CRUD Handlers ── */
  const handleAddCriteria = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriteriaLabel.trim()) return;

    const newCriterion: SchemaCriterion = {
      id: `${newCriteriaCategory}.custom_${Date.now()}`,
      category: newCriteriaCategory,
      label: newCriteriaLabel.trim(),
      description: newCriteriaDesc.trim() || 'Custom academic parameter',
      maxScore: Number(newCriteriaMaxScore),
      isRequired: newCriteriaMandatory,
      isLocked: false,
      isCustom: true,
    };

    setSchemaCriteria((prev) => [...prev, newCriterion]);
    setNewCriteriaLabel('');
    setNewCriteriaDesc('');
    setShowAddCriteriaModal(false);
    triggerToast(`Added new criteria '${newCriterion.label}' to ${newCriteriaCategory.toUpperCase()}`);
  };

  const handleUpdateMaxScore = (id: string, newMax: number) => {
    setSchemaCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, maxScore: newMax } : c))
    );
    triggerToast(`Updated parameter maximum score.`);
  };

  const handleToggleLock = (id: string) => {
    setSchemaCriteria((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
    triggerToast(`Toggled parameter lock state.`);
  };

  return (
    <div className="h-full bg-slate-50 text-slate-900 font-sans flex overflow-hidden text-xs">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-24 right-6 z-[180] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── FIXED FILTER SIDEBAR (SIH-Style) — CSS show/hide ── */}
      <aside className={`bg-white border-r border-slate-200/80 p-5 space-y-4 shrink-0 h-full overflow-y-auto shadow-2xs transition-all duration-200 ${isSidebarOpen ? 'w-80' : 'w-0 p-0 overflow-hidden border-0'}`}>
          
          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 uppercase text-[11px] tracking-wider">
                Exhaustive ERP Filters
              </h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset All
            </button>
          </div>

          {/* 1. DIRECT FACULTY MEMBER SELECTOR DROPDOWN */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
            <label className="block text-[10px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1">
              <UserCheck className="w-4 h-4 text-blue-600" /> Direct Faculty Selection
            </label>
            <select
              value={selectedFacultyEmpId}
              onChange={(e) => setSelectedFacultyEmpId(e.target.value)}
              className="w-full text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-xl px-3 py-2.5 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500 shadow-2xs"
            >
              <option value="ALL">All Faculty Profiles ({allFacultyOptions.length} Members)</option>
              {allFacultyOptions.map((f) => (
                <option key={f.empId} value={f.empId}>
                  {f.name} ({f.empId}) — {f.dept}
                </option>
              ))}
            </select>
            {selectedFacultyEmpId !== 'ALL' && (
              <p className="text-[10px] font-bold text-blue-700 mt-1">
                Isolating appraisal evaluation for selected faculty.
              </p>
            )}
          </div>

          {/* 2. DIRECT REPORTING HOD DROPDOWN */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Reporting HOD Name</label>
            <select
              value={selectedHodName}
              onChange={(e) => setSelectedHodName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Reporting HODs ({allHodOptions.length} HODs)</option>
              {allHodOptions.map((hod) => (
                <option key={hod} value={hod}>{hod}</option>
              ))}
            </select>
          </div>

          {/* 3. Campus & Institution */}
          <div className={`space-y-4 ${!isSidebarOpen ? 'hidden' : ''}`}></div>
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Campus</label>
            <select
              value={selectedCampus}
              onChange={(e) => setSelectedCampus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Campuses</option>
              <option value="SRM Ramapuram Campus">SRM Ramapuram</option>
              <option value="SRM Trichy Campus">SRM Trichy</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Constituent College</label>
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableInstitutions.map((i) => (
                <option key={i} value={i}>{i === 'ALL' ? 'All Colleges' : i}</option>
              ))}
            </select>
          </div>

          {/* 4. Department & Designation */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableDepartments.map((d) => (
                <option key={d} value={d}>{d === 'ALL' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Designations</option>
              <option value="Assistant Professor">Assistant Professor</option>
              <option value="Associate Professor">Associate Professor</option>
              <option value="Professor">Professor</option>
              <option value="HOD">HOD</option>
            </select>
          </div>

          {/* 5. Performance Grade */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Performance Grade</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['ALL', 'Grade A', 'Grade B', 'Grade C'] as const).map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`py-2 px-2.5 rounded-xl font-extrabold text-xs border transition-all ${
                    selectedGrade === g
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {g === 'ALL' ? 'All Grades' : g}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Form Status */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400">Form Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Form Statuses</option>
              <option value="HOD_APPROVED">HOD_APPROVED (Ready for HOI)</option>
              <option value="HOI_APPROVED">HOI_APPROVED (Final Sign-Off)</option>
              <option value="SUBMITTED">SUBMITTED (Pending HOD)</option>
              <option value="DRAFT">DRAFT (Faculty Edit)</option>
            </select>
          </div>

          {/* 7. Score Threshold Sliders */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80">
            <label className="block text-[10px] font-black uppercase text-slate-500">Score Threshold Sliders</label>
            
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Min Total Score:</span>
                <span className="text-blue-700 font-mono font-black">{minTotalScore} / 350</span>
              </div>
              <input
                type="range"
                min={0}
                max={350}
                step={10}
                value={minTotalScore}
                onChange={(e) => setMinTotalScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Min Cat I (Teaching):</span>
                <span className="text-blue-700 font-mono font-black">{minCat1Score} / 110</span>
              </div>
              <input
                type="range"
                min={0}
                max={110}
                step={5}
                value={minCat1Score}
                onChange={(e) => setMinCat1Score(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span>Min Cat III (Research):</span>
                <span className="text-purple-700 font-mono font-black">{minCat3Score} / 190</span>
              </div>
              <input
                type="range"
                min={0}
                max={190}
                step={10}
                value={minCat3Score}
                onChange={(e) => setMinCat3Score(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 8. Academic Output Checkboxes (Mapped to API Form Categories) */}
          <div className="space-y-2.5 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black uppercase text-slate-500">Academic Output Checkboxes</label>
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">API Form Mapped</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. SCI / Scopus Papers */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={minSciPapers > 0}
                  onChange={(e) => setMinSciPapers(e.target.checked ? 1 : 0)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">SCI / Scopus Papers &ge; 1</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.1)</span>
                </div>
              </label>

              {/* 2. Q1 Publications */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterQ1Only}
                  onChange={(e) => setFilterQ1Only(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Has Q1 Journal Publications</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.1)</span>
                </div>
              </label>

              {/* 3. Patents */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterPatentsOnly}
                  onChange={(e) => setFilterPatentsOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Has Patents Filed/Granted</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.5)</span>
                </div>
              </label>

              {/* 4. Sponsored Grants */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterGrantsOnly}
                  onChange={(e) => setFilterGrantsOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Has Sponsored Research Grants</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.8)</span>
                </div>
              </label>

              {/* 5. Scopus Citations */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterCitationsOnly}
                  onChange={(e) => setFilterCitationsOnly(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Has Scopus Citations</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.2 &amp; 3.3)</span>
                </div>
              </label>

              {/* 6. PhD Supervision */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterPhdSupervision}
                  onChange={(e) => setFilterPhdSupervision(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Ph.D. Scholars Supervised</span>
                  <span className="text-[9px] font-extrabold text-purple-700 uppercase tracking-wider mt-0.5">Category III (Section 3.6)</span>
                </div>
              </label>

              {/* 7. NPTEL / MOOC */}
              <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-700 hover:text-slate-900 transition-colors">
                <input
                  type="checkbox"
                  checked={filterNptelMooc}
                  onChange={(e) => setFilterNptelMooc(e.target.checked)}
                  className="w-4 h-4 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                />
                <div className="flex flex-col">
                  <span className="text-[11px] leading-tight">Completed NPTEL / MOOC Courses</span>
                  <span className="text-[9px] font-extrabold text-emerald-700 uppercase tracking-wider mt-0.5">Category I (Section 1.6 &amp; 1.7)</span>
                </div>
              </label>
            </div>
          </div>

        </aside>

      {/* ── MAIN WORKSPACE CONTENT WITH STATIC BOX CONSTRAINTS ── */}
      <main className="flex-1 p-5 space-y-5 overflow-y-auto h-full">
        
        {/* Top Chairman Workspace Header Bar */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-blue-50 text-blue-800 border border-blue-200">
                SRMIST Institutional Governance Console
              </span>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 ml-2"
              >
                {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
                <span>{isSidebarOpen ? 'Hide Filters' : 'Show Filters'}</span>
              </button>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SRMIST — Institutional Leadership &amp; Performance Governance Dashboard
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Academic Performance Indicator (API) Evaluation, Multi-Tier Approvals &amp; Enterprise Data Analytics Engine
            </p>
          </div>

          {/* View Mode Controls & Export Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200">
              <button
                onClick={() => setViewMode('DASHBOARD')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'DASHBOARD' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <BarChart2 className="w-4 h-4 inline mr-1" /> Dashboard
              </button>

              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="w-4 h-4 inline mr-1" /> Data Table
              </button>

              <button
                onClick={() => setViewMode('SCHEMA_MANAGER')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'SCHEMA_MANAGER' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-4 h-4 inline mr-1" /> Schema Manager
              </button>
            </div>

            <button
              onClick={() => handleExportExcel(true)}
              disabled={selectedAppraisalIds.size === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Selected ({selectedAppraisalIds.size})</span>
            </button>

            <button
              onClick={() => handleExportExcel(false)}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export All ({filteredAppraisals.length})</span>
            </button>

            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition-all"
              title="Export Institutional Summary as PDF"
            >
              <Printer className="w-4 h-4" />
              <span>PDF Summary</span>
            </button>
          </div>
        </header>

        {/* ── TOP EXECUTIVE KPI METRIC CARDS (FIXED HEIGHT SIH BOXES) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
          
          {/* Card 1: Total Faculty */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-2 h-32 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Total Faculty</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <TrendingUp className="w-3.5 h-3.5" /> +2.5%
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900">{executiveMetrics.totalCount}</p>
            <p className="text-[11px] text-slate-500 font-bold">Matched Evaluation Records</p>
          </div>

          {/* Card 2: Avg Score */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-2 h-32 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Avg Institutional Score</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                <Check className="w-3.5 h-3.5" /> Verified
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-700">{executiveMetrics.avgScore} <span className="text-xs text-slate-400 font-normal">/ 350</span></p>
            <p className="text-[11px] text-slate-500 font-bold">Out of 350 Max Criteria Points</p>
          </div>

          {/* Card 3: SCI / Scopus Publications */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-2 h-32 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">SCI / Scopus Papers</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full">
                Q1: {executiveMetrics.q1Journals}
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-700">{executiveMetrics.totalPubs}</p>
            <p className="text-[11px] text-slate-500 font-bold">Patents Filed: {executiveMetrics.totalPatentsCount}</p>
          </div>

          {/* Card 4: Sponsored Grants */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs space-y-2 h-32 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Grants Funded</span>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-700">
              {executiveMetrics.totalGrantsVal > 0 ? `₹${(executiveMetrics.totalGrantsVal / 100000).toFixed(1)} L` : `${executiveMetrics.totalGrantsCount} Grants`}
            </p>
            <p className="text-[11px] text-slate-500 font-bold">Total Sponsored Projects</p>
          </div>

        </div>

        {/* VIEW MODE 1: DASHBOARD ANALYTICS SHOWCASE (FIXED HEIGHT BOXES) */}
        {viewMode === 'DASHBOARD' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Department Performance Bar Chart Box */}
              <div className="lg:col-span-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4 h-[380px] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-blue-600" /> Department Performance Breakdown
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Average scores across Category I (Teaching), Category II (Outreach), and Category III (Research)</p>
                  </div>
                </div>

                <div className="flex-1 w-full overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="Cat1_Teaching" fill="#2563EB" name="Cat I: Teaching (110)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Cat2_CoCurricular" fill="#7C3AED" name="Cat II: Outreach (50)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="Cat3_Research" fill="#10B981" name="Cat III: Research (190)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Donut Grade Proportions Chart Box */}
              <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs space-y-4 h-[380px] flex flex-col overflow-hidden">
                <div className="border-b border-slate-100 pb-3 shrink-0">
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-emerald-600" /> Performance Grade Proportions
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Grade A, B, C proportions</p>
                </div>

                <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieGradeData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieGradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ── HIGH-DENSITY DATA TABLE WITH ROW CHECKBOX SELECTION (FIXED HEIGHT SIH BOX) ── */}
        {(viewMode === 'TABLE' || viewMode === 'DASHBOARD') && (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs h-[540px] flex flex-col overflow-hidden animate-in fade-in duration-200">
            
            {/* Table Header Toolbar */}
            <div className="p-5 bg-slate-50/70 border-b border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
              
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search faculty name, emp ID, department..."
                    className="w-full text-xs bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <button
                  onClick={handleToggleSelectAllPage}
                  className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <CheckSquare className="w-4 h-4 text-blue-600" />
                  <span>Select Page ({paginatedAppraisals.length})</span>
                </button>
              </div>

              {/* Sorting & Controls */}
              <div className="flex items-center gap-3 text-xs font-bold text-slate-600 shrink-0">
                <span>Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none font-bold text-slate-800"
                >
                  <option value="score">Total Score</option>
                  <option value="name">Faculty Name</option>
                  <option value="grade">Grade</option>
                  <option value="dept">Department</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-100"
                >
                  {sortOrder.toUpperCase()}
                </button>
              </div>

            </div>

            {/* Selective Export Action Ribbon */}
            {selectedAppraisalIds.size > 0 && (
              <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between text-xs font-extrabold shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{selectedAppraisalIds.size} Faculty Row(s) Selected for Custom Download</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleExportExcel(true)}
                    className="bg-white text-blue-950 hover:bg-blue-50 px-4 py-1.5 rounded-xl font-black shadow-2xs transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" /> Download Selected as Excel
                  </button>
                  <button
                    onClick={() => setSelectedAppraisalIds(new Set())}
                    className="text-blue-100 hover:text-white underline text-[11px]"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}

            {/* Data Table Scroll Viewport */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-xs min-w-[980px]">
                <thead className="sticky top-0 z-10 bg-slate-100/90 backdrop-blur-md">
                  <tr className="border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                    <th className="px-4 py-4 text-center w-12">
                      <input
                        type="checkbox"
                        checked={paginatedAppraisals.length > 0 && paginatedAppraisals.every((a) => selectedAppraisalIds.has(a.id))}
                        onChange={handleToggleSelectAllPage}
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className="px-5 py-4 min-w-[220px]">Faculty Member</th>
                    <th className="px-4 py-4 min-w-[220px]">Institution &amp; Dept</th>
                    <th className="px-4 py-4 text-center min-w-[170px]">Score (Self / HOD)</th>
                    <th className="px-4 py-4 text-center min-w-[120px]">Grade</th>
                    <th className="px-4 py-4 text-center min-w-[150px]">Research Output</th>
                    <th className="px-4 py-4 text-center min-w-[130px]">Status</th>
                    <th className="px-5 py-4 text-right min-w-[150px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedAppraisals.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-14 text-center text-slate-400 font-semibold text-xs">
                        No faculty appraisal records match your selected evaluation filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAppraisals.map((rec) => {
                      const isSelectedRow = selectedAppraisalIds.has(rec.id);

                      return (
                        <tr
                          key={rec.id}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            isSelectedRow ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="px-4 py-4 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelectedRow}
                              onChange={() => handleToggleSelectRow(rec.id)}
                              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                            />
                          </td>

                          {/* Faculty Member */}
                          <td className="px-5 py-4 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-900 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                                {rec.facultyName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-extrabold text-slate-900 leading-tight">{rec.facultyName}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{rec.empId} &bull; {rec.designation}</p>
                              </div>
                            </div>
                          </td>

                          {/* Institution & Dept */}
                          <td className="px-4 py-4 align-middle">
                            <p className="font-extrabold text-slate-900 leading-snug truncate max-w-[200px]">{rec.department}</p>
                            <p className="text-[10px] text-slate-400 font-medium leading-normal mt-0.5 truncate max-w-[200px]">
                              {rec.institution || 'SRMIST'}
                            </p>
                          </td>

                          {/* Score Summary */}
                          <td className="px-4 py-4 text-center align-middle">
                            <div className="inline-flex flex-col items-center gap-1">
                              <span className="px-2.5 py-0.5 rounded-md bg-slate-100 font-extrabold text-slate-800 text-[11px] border border-slate-200">
                                Self: {Math.min(rec.selfScoreTotal ?? 0, 350)} / 350
                              </span>
                              <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-extrabold text-[11px] border border-emerald-200">
                                HOD: {Math.min(rec.hodScoreTotal ?? 0, 350)} / 350
                              </span>
                            </div>
                          </td>

                          {/* Grade */}
                          <td className="px-4 py-4 text-center align-middle">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                              rec.grade === 'Grade A' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : rec.grade === 'Grade B' ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                              <Award className="w-3 h-3" />
                              {rec.grade ?? 'Grade C'}
                            </span>
                          </td>

                          {/* Research Output */}
                          <td className="px-4 py-4 text-center align-middle">
                            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{rec.cat3.journals.length} Pubs</span>
                              <span className="bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">{rec.cat3.patents.length} Patents</span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center align-middle">
                            <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md border ${
                              rec.status === 'HOI_APPROVED' ? 'bg-purple-50 text-purple-700 border-purple-200'
                                : rec.status === 'HOD_APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : rec.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {rec.status?.replace(/_/g, ' ') ?? 'DRAFT'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right align-middle">
                            <button
                              onClick={() => setViewRecord(rec)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs border border-blue-200 transition-colors shadow-2xs"
                            >
                              <Eye className="w-3.5 h-3.5" /> View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer (Fixed Box Ribbon) */}
            <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex items-center justify-between shrink-0 h-14">
              <span className="text-xs font-bold text-slate-500">
                Showing {paginatedAppraisals.length} of {totalRecordsCount} entries
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 shadow-2xs"
                >
                  Previous
                </button>
                <span className="text-xs font-extrabold text-slate-800 px-2">Page {currentPage} of {totalPages}</span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 disabled:opacity-40 shadow-2xs"
                >
                  Next
                </button>
              </div>
            </div>

          </div>
        )}

        {/* VIEW MODE 3: DYNAMIC FORM SCHEMA MANAGER */}
        {viewMode === 'SCHEMA_MANAGER' && (
          <div className="bg-white border border-slate-200/80 rounded-3xl shadow-2xs p-6 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-blue-600" /> Dynamic Form Schema &amp; Scoring Criteria Manager
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Real-time CRUD management over Category I, II, and III scoring criteria, maximum thresholds, and required parameters.
                </p>
              </div>

              <button
                onClick={() => setShowAddCriteriaModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-md"
              >
                <Plus className="w-4 h-4" /> Add New Criteria Field
              </button>
            </div>

            {/* Criteria Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px]">
                    <th className="px-4 py-3.5 w-[40%]">Criteria Parameter</th>
                    <th className="px-3 py-3.5 text-center">Category</th>
                    <th className="px-3 py-3.5 text-center">Max Points ✎</th>
                    <th className="px-3 py-3.5 text-center">Mandatory</th>
                    <th className="px-3 py-3.5 text-center">Parameter Lock</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {schemaCriteria.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="font-extrabold text-slate-900">{c.label}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{c.description}</p>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase ${
                          c.category === 'cat1' ? 'bg-blue-100 text-blue-800' :
                          c.category === 'cat2' ? 'bg-purple-100 text-purple-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {c.category.toUpperCase()}
                        </span>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <input
                          type="number"
                          value={c.maxScore}
                          min={1}
                          max={200}
                          onChange={(e) => handleUpdateMaxScore(c.id, Number(e.target.value))}
                          className="w-16 text-center font-extrabold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none"
                        />
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => {
                            setSchemaCriteria((prev) =>
                              prev.map((item) => (item.id === c.id ? { ...item, isRequired: !item.isRequired } : item))
                            );
                            triggerToast(`Toggled parameter requirement.`);
                          }}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-colors ${
                            c.isRequired ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {c.isRequired ? 'Mandatory' : 'Optional'}
                        </button>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleLock(c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-colors ${
                            c.isLocked ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {c.isLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
                          {c.isLocked ? 'Locked' : 'Active'}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        {c.isCustom ? (
                          <button
                            onClick={() => {
                              setSchemaCriteria((prev) => prev.filter((item) => item.id !== c.id));
                              triggerToast(`Deleted custom criteria '${c.label}'`);
                            }}
                            className="text-rose-600 font-bold text-xs p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono">NAAC Standard</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── FULL APPRAISAL MODAL ── */}
      {viewRecord && (
        <FullAppraisalModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

    </div>
  );
};
