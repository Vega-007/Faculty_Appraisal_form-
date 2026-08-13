'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
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
  CheckCircle2,
  Search,
  Eye,
  X,
  Award,
  Building2,
  FileSpreadsheet,
  Grid,
  Sliders,
  RotateCcw,
  Printer,
  PanelLeftClose,
  PanelLeft,
  SlidersHorizontal,
  Building,
  School,
  CheckSquare,
  Users,
  Layers,
  BookOpen,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ArrowLeft,
} from 'lucide-react';

import * as XLSX from 'xlsx';

interface AdminChairmanViewProps {
  appraisals: AppraisalRecord[];
  monthlyWindows: MonthlyWindow[];
  auditLogs: AuditLog[];
  onToggleWindow: (monthYear: string) => void;
  onUpdateAppraisal: (updated: AppraisalRecord) => void;
  onRefreshData?: () => Promise<boolean>;
}

export const AdminChairmanView: React.FC<AdminChairmanViewProps> = ({
  appraisals,
  monthlyWindows,
  auditLogs,
  onToggleWindow,
  onUpdateAppraisal,
  onRefreshData,
}) => {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (onRefreshData) {
        const ok = await onRefreshData();
        if (ok) triggerToast('Refreshed institutional database records.');
        else triggerToast('Failed to refresh data.', 'error');
      } else {
        triggerToast('Refreshed dashboard data.');
      }
    } catch (err) {
      triggerToast('Refresh failed.', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  /* ── 1. Active View Mode: TABLE or SCHEMA_MANAGER ── */
  const [viewMode, setViewMode] = useState<'TABLE' | 'SCHEMA_MANAGER'>('TABLE');

  /* ── 2. Filter Sidebar Toggle State ── */
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  /* ── 2b. Sidebar Resize State ── */
  const [sidebarWidth, setSidebarWidth] = useState<number>(280);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(280);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    setIsDragging(true);

    const onMouseMove = (me: MouseEvent) => {
      const delta = me.clientX - dragStartX.current;
      const newWidth = Math.min(480, Math.max(200, dragStartWidth.current + delta));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sidebarWidth]);

  /* ── 3. PRIMARY & SECONDARY FILTER STATES ── */
  const [selectedCampus, setSelectedCampus] = useState<string>('ALL');
  const [selectedInstitution, setSelectedInstitution] = useState<string>('ALL');
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');       // NEW: school level
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  /* ── 3b. Tree Navigator Expand/Collapse State (independent of selection) ── */
  const [expandedCampuses, setExpandedCampuses] = useState<Set<string>>(new Set());
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());   // NEW
  // selectionLevel tracks what level is currently selected for context header
  const [selectionLevel, setSelectionLevel] = useState<'ALL' | 'CAMPUS' | 'INSTITUTION' | 'SCHOOL' | 'DEPARTMENT'>('ALL');
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

  /* ── 4. Table Selection Checkboxes for Excel Download ── */
  const [selectedAppraisalIds, setSelectedAppraisalIds] = useState<Set<string>>(new Set());

  /* ── 5. Table Pagination & Sorting ── */
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<'name' | 'score' | 'grade' | 'dept'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

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

  /* ── Helper: get ALL departments under an institution (flatten schools if present) ── */
  const getAllDeptsForInst = useCallback((instName: string): string[] => {
    for (const c of CAMPUS_HIERARCHY) {
      const inst = c.institutions.find((i) => i.name === instName);
      if (!inst) continue;
      if (inst.schools) return inst.schools.flatMap((s) => s.departments);
      return inst.departments || [];
    }
    return [];
  }, []);

  /* ── Helper: get departments under a school within an institution ── */
  const getDeptsForSchool = useCallback((instName: string, schoolName: string): string[] => {
    for (const c of CAMPUS_HIERARCHY) {
      const inst = c.institutions.find((i) => i.name === instName);
      if (!inst || !inst.schools) continue;
      const school = inst.schools.find((s) => s.name === schoolName);
      return school?.departments || [];
    }
    return [];
  }, []);

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
    if (selectedSchool !== 'ALL') {
      return ['ALL', ...getDeptsForSchool(selectedInstitution, selectedSchool)];
    }
    if (selectedInstitution !== 'ALL') {
      const depts = getAllDeptsForInst(selectedInstitution);
      if (depts.length > 0) return ['ALL', ...Array.from(new Set(depts))];
    }
    if (selectedCampus !== 'ALL') {
      const node = CAMPUS_HIERARCHY.find((c) => c.campus === selectedCampus);
      if (node) {
        const depts: string[] = [];
        node.institutions.forEach((inst) => {
          if (inst.schools) inst.schools.forEach((s) => depts.push(...s.departments));
          else depts.push(...(inst.departments || []));
        });
        return ['ALL', ...Array.from(new Set(depts))];
      }
    }
    const set = new Set(appraisals.map((a) => a.department));
    return ['ALL', ...Array.from(set)];
  }, [selectedCampus, selectedInstitution, selectedSchool, appraisals, getAllDeptsForInst, getDeptsForSchool]);

  /* ── MASTER EXHAUSTIVE REAL-TIME FILTER ENGINE ── */
  const filteredAppraisals = useMemo(() => {
    return appraisals.filter((a) => {
      // 1. Campus & Institution & School & Department
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

      // School-level filter: when school selected, match depts under that school
      const schoolDepts = selectedSchool !== 'ALL' ? getDeptsForSchool(selectedInstitution, selectedSchool) : [];
      const matchesSchool =
        selectedSchool === 'ALL' ||
        schoolDepts.includes(a.department) ||
        schoolDepts.some((d) => a.department.toLowerCase().includes(d.toLowerCase()));

      const matchesDept =
        selectedDept === 'ALL' ||
        a.department === selectedDept ||
        a.department.toLowerCase().includes(selectedDept.toLowerCase());

      // 2. Search Query
      const matchesSearch =
        searchTerm === '' ||
        a.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.department.toLowerCase().includes(searchTerm.toLowerCase());

      // 3. Status & Grade & Window
      const matchesStatus = selectedStatus === 'ALL' || a.status === selectedStatus;
      const matchesGrade = selectedGrade === 'ALL' || a.grade === selectedGrade;
      const matchesWindow = selectedWindow === 'ALL' || a.monthYear === selectedWindow;

      // 4. Score Thresholds
      const scoreTotal = a.hodScoreTotal || a.selfScoreTotal || 0;
      const c1Score = a.cat1.totalHodScore || a.cat1.totalSelfScore || 0;
      const c2Score = a.cat2.totalHodScore || a.cat2.totalSelfScore || 0;
      const c3Score = a.cat3.totalHodScore || a.cat3.totalSelfScore || 0;

      const matchesScore =
        scoreTotal >= minTotalScore &&
        c1Score >= minCat1Score &&
        c2Score >= minCat2Score &&
        c3Score >= minCat3Score;

      // 5. Small Field Specific Filters
      const matchesSci = a.cat3.journals.length >= minSciPapers;
      const matchesQ1 = !filterQ1Only || a.cat3.journals.some((j) => j.quartile === 'Q1');
      const matchesPatents = !filterPatentsOnly || a.cat3.patents.length > 0;
      const matchesGrants = !filterGrantsOnly || a.cat3.fundedProjects.length > 0;

      return (
        matchesCampus &&
        matchesInst &&
        matchesSchool &&
        matchesDept &&
        matchesSearch &&
        matchesStatus &&
        matchesGrade &&
        matchesWindow &&
        matchesScore &&
        matchesSci &&
        matchesQ1 &&
        matchesPatents &&
        matchesGrants
      );
    });
  }, [
    appraisals,
    selectedCampus,
    selectedInstitution,
    selectedSchool,
    selectedDept,
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
    getDeptsForSchool,
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
    selectedCampus,
    selectedInstitution,
    selectedDept,
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
    pageSize,
  ]);

  /* ── Reset All Filters Helper ── */
  const handleResetFilters = () => {
    setSelectedCampus('ALL');
    setSelectedInstitution('ALL');
    setSelectedSchool('ALL');
    setSelectedDept('ALL');
    setSelectionLevel('ALL');
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
    setSelectedAppraisalIds(new Set());
    triggerToast('All evaluation scope filters reset.');
  };

  /* ── Tree Navigator Helpers ── */
  const handleToggleCampusExpand = (campusName: string) => {
    setExpandedCampuses((prev) => {
      const next = new Set(prev);
      if (next.has(campusName)) next.delete(campusName);
      else next.add(campusName);
      return next;
    });
  };

  const handleToggleInstExpand = (instName: string) => {
    setExpandedInstitutions((prev) => {
      const next = new Set(prev);
      if (next.has(instName)) next.delete(instName);
      else next.add(instName);
      return next;
    });
  };

  const handleToggleSchoolExpand = (schoolKey: string) => {
    setExpandedSchools((prev) => {
      const next = new Set(prev);
      if (next.has(schoolKey)) next.delete(schoolKey);
      else next.add(schoolKey);
      return next;
    });
  };

  const handleSelectCampus = (campusName: string) => {
    setSelectedCampus(campusName);
    setSelectedInstitution('ALL');
    setSelectedSchool('ALL');
    setSelectedDept('ALL');
    setSelectionLevel('CAMPUS');
    // Auto-expand this campus in the tree
    setExpandedCampuses((prev) => new Set(Array.from(prev).concat(campusName)));
  };

  const handleSelectAllCampuses = () => {
    setSelectedCampus('ALL');
    setSelectedInstitution('ALL');
    setSelectedSchool('ALL');
    setSelectedDept('ALL');
    setSelectionLevel('ALL');
  };

  const handleSelectInstitution = (campusName: string, instName: string) => {
    setSelectedCampus(campusName);
    setSelectedInstitution(instName);
    setSelectedSchool('ALL');
    setSelectedDept('ALL');
    setSelectionLevel('INSTITUTION');
    // Auto-expand the institution in tree
    setExpandedInstitutions((prev) => new Set(Array.from(prev).concat(instName)));
  };

  const handleSelectSchool = (campusName: string, instName: string, schoolName: string) => {
    setSelectedCampus(campusName);
    setSelectedInstitution(instName);
    setSelectedSchool(schoolName);
    setSelectedDept('ALL');
    setSelectionLevel('SCHOOL');
    // Auto-expand school in tree
    const schoolKey = `${instName}::${schoolName}`;
    setExpandedSchools((prev) => new Set(Array.from(prev).concat(schoolKey)));
  };

  const handleSelectDepartment = (campusName: string, instName: string, schoolName: string, deptName: string) => {
    setSelectedCampus(campusName);
    setSelectedInstitution(instName);
    setSelectedSchool(schoolName);
    setSelectedDept(deptName);
    setSelectionLevel('DEPARTMENT');
  };

  /* ── Dashboard context label based on selection level ── */
  const dashboardContextLabel = useMemo(() => {
    if (selectionLevel === 'DEPARTMENT') return 'Department Faculty Performance';
    if (selectionLevel === 'SCHOOL') return 'School-wide Faculty Performance';
    if (selectionLevel === 'INSTITUTION') return 'College-wide Faculty Performance';
    if (selectionLevel === 'CAMPUS') return 'Campus-wide Faculty Performance';
    return 'Institution-wide Faculty Performance';
  }, [selectionLevel]);

  const dashboardTitleLabel = useMemo(() => {
    if (selectionLevel === 'DEPARTMENT') return `${selectedDept} Department`;
    if (selectionLevel === 'SCHOOL') return `${selectedInstitution} — ${selectedSchool}`;
    if (selectionLevel === 'INSTITUTION') return selectedInstitution;
    if (selectionLevel === 'CAMPUS') return selectedCampus;
    return 'All SRM Campuses';
  }, [selectionLevel, selectedDept, selectedSchool, selectedInstitution, selectedCampus]);

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

  /* ── Executive Metrics Engine ── */
  const executiveMetrics = useMemo(() => {
    let totalScoreSum = 0;
    let gradeACount = 0;
    let gradeBCount = 0;
    let gradeCCount = 0;

    filteredAppraisals.forEach((a) => {
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
      gradeACount,
      gradeBCount,
      gradeCCount,
      gradeAPct,
      gradeBPct,
    };
  }, [filteredAppraisals]);

  /* ── EXCEL EXPORT ENGINE FOR SELECTED OR FILTERED FACULTY ── */
  const handleExportExcel = (onlySelected: boolean = false) => {
    const targetRecords = onlySelected
      ? filteredAppraisals.filter((a) => selectedAppraisalIds.has(a.id))
      : filteredAppraisals;

    if (targetRecords.length === 0) {
      triggerToast(onlySelected ? 'Please select at least one faculty row using the checkboxes.' : 'No faculty records match your filters.', 'error');
      return;
    }

    const masterRows = targetRecords.map((a) => ({
      'Employee ID': a.empId,
      'Faculty Name': a.facultyName,
      'Department': a.department,
      'Designation': a.designation,
      'Institution': a.institution || 'SRMIST',
      'Campus': a.campus || 'SRM Ramapuram Campus',
      'Self Score Total': a.selfScoreTotal,
      'HOD Verified Total': a.hodScoreTotal,
      'Performance Grade': a.grade,
      'Form Status': a.status,
      'Evaluation Window': a.monthYear,
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(masterRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Faculty Performance Master');

    const filename = onlySelected
      ? `Selected_${targetRecords.length}_Faculty_Performance.xlsx`
      : `Faculty_Performance_Master_${targetRecords.length}_Records.xlsx`;

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

  /* ── Department Breakdown Summary for Selected View ── */
  const deptBreakdownSummary = useMemo(() => {
    const map: Record<string, number> = {};
    filteredAppraisals.forEach((a) => {
      const dept = a.department || 'General';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filteredAppraisals]);

  return (
    <div className="h-full bg-slate-50 text-slate-900 font-sans flex overflow-hidden text-xs">
      
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[180] flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold border animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'success'
              ? 'bg-slate-900 text-emerald-400 border-emerald-500/40'
              : 'bg-rose-900 text-rose-100 border-rose-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── TREE NAVIGATOR SIDEBAR (Campus → College → Department) ── */}
      <aside
        style={isSidebarOpen ? { width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth } : undefined}
        className={`bg-white border-r border-slate-200/80 shrink-0 h-full overflow-y-auto shadow-sm flex flex-col ${
          isSidebarOpen
            ? (isDragging ? '' : 'transition-none')
            : 'w-0 p-0 overflow-hidden border-0'
        }`}
      >

          {/* Sidebar Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4 pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h3 className="font-extrabold text-slate-900 uppercase text-[13px] tracking-wider">
                Institutional Scope
              </h3>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* ── CLICKABLE TREE NAVIGATOR ── */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">

            {/* Root: All Campuses node */}
            <button
              onClick={handleSelectAllCampuses}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-100 text-left ${
                selectionLevel === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <School className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">All Campuses</span>
              {selectionLevel === 'ALL' && (
                <span className="ml-auto text-xs font-black bg-white/20 rounded-full px-1.5 py-0.5">
                  {executiveMetrics.totalCount}
                </span>
              )}
            </button>

            {/* Campus nodes */}
            {CAMPUS_HIERARCHY.map((campusNode) => {
              const isCampusSelected = selectionLevel === 'CAMPUS' && selectedCampus === campusNode.campus;
              const isCampusExpanded = expandedCampuses.has(campusNode.campus);
              const isCampusActive = selectedCampus === campusNode.campus && selectionLevel !== 'ALL';

              return (
                <div key={campusNode.campus} className="space-y-0.5">

                  {/* Campus Row */}
                  <div className={`flex items-center gap-1 rounded-xl transition-all duration-100 ${
                    isCampusSelected
                      ? 'bg-blue-600 text-white shadow-md'
                      : isCampusActive
                      ? 'bg-blue-50'
                      : 'hover:bg-slate-50'
                  }`}>
                    {/* Expand arrow – only expands, does NOT select */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleCampusExpand(campusNode.campus); }}
                      className={`w-7 h-8 flex items-center justify-center shrink-0 transition-transform duration-150 rounded-l-xl ${
                        isCampusSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                      }`}
                      title="Expand/Collapse"
                      aria-label={`${isCampusExpanded ? 'Collapse' : 'Expand'} ${campusNode.campus}`}
                    >
                      <span className={`inline-block transition-transform duration-200 text-[13px] font-black leading-none ${
                        isCampusExpanded ? 'rotate-90' : ''
                      }`}>›</span>
                    </button>

                    {/* Campus name – click to SELECT campus */}
                    <button
                      onClick={() => handleSelectCampus(campusNode.campus)}
                      className={`flex-1 flex items-center gap-2 py-2 pr-3 text-xs font-bold text-left transition-colors ${
                        isCampusSelected ? 'text-white' : isCampusActive ? 'text-blue-700' : 'text-slate-700 hover:text-slate-900'
                      }`}
                      title={`Select ${campusNode.campus} scope`}
                    >
                      <Building2 className="w-3 h-3 shrink-0" />
                      <span className="truncate">{campusNode.campus.replace(' Campus', '')}</span>
                    </button>
                  </div>

                  {/* Institution nodes (shown when campus is expanded) */}
                  {isCampusExpanded && (
                    <div className="pl-5 space-y-0.5 border-l-2 border-slate-100 ml-3.5">
                      {campusNode.institutions.map((inst) => {
                        const isInstSelected = selectionLevel === 'INSTITUTION' && selectedInstitution === inst.name;
                        const isInstExpanded = expandedInstitutions.has(inst.name);
                        const isInstActive = selectedInstitution === inst.name && selectionLevel !== 'CAMPUS' && selectionLevel !== 'ALL';
                        const hasSchools = !!(inst.schools && inst.schools.length > 0);
                        const hasDepts = !hasSchools && !!(inst.departments && inst.departments.length > 0);

                        return (
                          <div key={inst.name} className="space-y-0.5">

                            {/* Institution Row */}
                            <div className={`flex items-center gap-1 rounded-xl transition-all duration-100 ${
                              isInstSelected
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : isInstActive
                                ? 'bg-indigo-50'
                                : 'hover:bg-slate-50'
                            }`}>
                              {/* Expand arrow */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleToggleInstExpand(inst.name); }}
                                className={`w-6 h-7 flex items-center justify-center shrink-0 transition-transform duration-150 rounded-l-xl ${
                                  isInstSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                }`}
                                title="Expand/Collapse"
                                aria-label={`${isInstExpanded ? 'Collapse' : 'Expand'} ${inst.name}`}
                              >
                                {(hasSchools || hasDepts) && (
                                  <span className={`inline-block transition-transform duration-200 text-xs font-black leading-none ${
                                    isInstExpanded ? 'rotate-90' : ''
                                  }`}>›</span>
                                )}
                              </button>

                              {/* Institution name – click to SELECT institution */}
                              <button
                                onClick={() => handleSelectInstitution(campusNode.campus, inst.name)}
                                className={`flex-1 py-1.5 pr-2 text-[13px] font-bold text-left leading-tight transition-colors ${
                                  isInstSelected ? 'text-white' : isInstActive ? 'text-indigo-700' : 'text-slate-600 hover:text-slate-900'
                                }`}
                                title={`Select ${inst.name} scope`}
                              >
                                <span className="block truncate">{inst.name}</span>
                              </button>
                            </div>

                            {/* Children: Schools (if SRM IST type) OR Departments (if flat) */}
                            {isInstExpanded && (
                              <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-2.5">
                                {hasSchools && inst.schools!.map((school) => {
                                  const schoolKey = `${inst.name}::${school.name}`;
                                  const isSchoolSelected = selectionLevel === 'SCHOOL' && selectedSchool === school.name && selectedInstitution === inst.name;
                                  const isSchoolExpanded = expandedSchools.has(schoolKey);
                                  const isSchoolActive = selectedSchool === school.name && selectedInstitution === inst.name && selectionLevel !== 'INSTITUTION' && selectionLevel !== 'ALL' && selectionLevel !== 'CAMPUS';

                                  return (
                                    <div key={school.name} className="space-y-0.5">
                                      {/* School Row */}
                                      <div className={`flex items-center gap-1 rounded-lg transition-all duration-100 ${
                                        isSchoolSelected
                                          ? 'bg-violet-600 text-white shadow-sm'
                                          : isSchoolActive
                                          ? 'bg-violet-50'
                                          : 'hover:bg-slate-50'
                                      }`}>
                                        {/* School expand arrow */}
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleToggleSchoolExpand(schoolKey); }}
                                          className={`w-6 h-7 flex items-center justify-center shrink-0 rounded-l-lg ${
                                            isSchoolSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                          }`}
                                          title="Expand/Collapse school"
                                        >
                                          <span className={`inline-block transition-transform duration-200 text-xs font-black leading-none ${
                                            isSchoolExpanded ? 'rotate-90' : ''
                                          }`}>›</span>
                                        </button>
                                        {/* School name – click to SELECT school */}
                                        <button
                                          onClick={() => handleSelectSchool(campusNode.campus, inst.name, school.name)}
                                          className={`flex-1 py-1.5 pr-2 text-[13px] font-bold text-left leading-tight transition-colors ${
                                            isSchoolSelected ? 'text-white' : isSchoolActive ? 'text-violet-700' : 'text-slate-600 hover:text-slate-900'
                                          }`}
                                          title={`Select ${school.name} school scope`}
                                        >
                                          <span className="block truncate">{school.name}</span>
                                        </button>
                                      </div>

                                      {/* Departments under school */}
                                      {isSchoolExpanded && (
                                        <div className="pl-4 space-y-0.5 border-l-2 border-slate-100 ml-2.5">
                                          {school.departments.map((dept) => {
                                            const isDeptSelected =
                                              selectionLevel === 'DEPARTMENT' &&
                                              selectedDept === dept &&
                                              selectedInstitution === inst.name;

                                            return (
                                              <button
                                                key={dept}
                                                onClick={() => handleSelectDepartment(campusNode.campus, inst.name, school.name, dept)}
                                                className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold text-left transition-all duration-100 ${
                                                  isDeptSelected
                                                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                                    : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'
                                                }`}
                                                title={`Select ${dept} department`}
                                              >
                                                <BookOpen className={`w-2.5 h-2.5 shrink-0 ${
                                                  isDeptSelected ? 'text-white/80' : 'text-emerald-500'
                                                }`} />
                                                <span className="truncate">{dept}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Flat departments (for non-school institutions) */}
                                {hasDepts && inst.departments!.map((dept) => {
                                  const isDeptSelected =
                                    selectionLevel === 'DEPARTMENT' &&
                                    selectedDept === dept &&
                                    selectedInstitution === inst.name;

                                  return (
                                    <button
                                      key={dept}
                                      onClick={() => handleSelectDepartment(campusNode.campus, inst.name, 'ALL', dept)}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] font-semibold text-left transition-all duration-100 ${
                                        isDeptSelected
                                          ? 'bg-emerald-600 text-white shadow-sm font-bold'
                                          : 'text-slate-500 hover:bg-emerald-50 hover:text-emerald-800'
                                      }`}
                                      title={`Select ${dept} department`}
                                    >
                                      <BookOpen className={`w-3 h-3 shrink-0 ${
                                        isDeptSelected ? 'text-white/80' : 'text-emerald-500'
                                      }`} />
                                      <span className="truncate">{dept}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* 4. COLLAPSIBLE ADVANCED FILTERS SECTION */}
          <details className="group border border-slate-200/80 rounded-2xl bg-slate-50/50 overflow-hidden mx-3">
            <summary className="p-3 font-black text-[13px] uppercase tracking-wider text-slate-700 cursor-pointer flex items-center justify-between select-none hover:bg-slate-100/80 transition-colors">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Advanced Filters
              </span>
              <span className="text-xs font-bold text-blue-600 group-open:rotate-180 transition-transform">&darr;</span>
            </summary>

            <div className="p-3 space-y-3 border-t border-slate-200/80 bg-white">
              
              {/* Form Status */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase text-slate-400">Form Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="HOD_APPROVED">HOD Approved</option>
                  <option value="HOI_APPROVED">HOI Approved</option>
                  <option value="SUBMITTED">Submitted</option>
                  <option value="DRAFT">Draft</option>
                </select>
              </div>

              {/* Score Threshold Sliders */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-black uppercase text-slate-400">Min Total Score Filter</label>
                <div className="flex justify-between text-[13px] font-bold text-slate-700">
                  <span>Score &ge;:</span>
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

              {/* Academic Output Checkboxes */}
              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                <label className="block text-xs font-black uppercase text-slate-400 mb-1">Academic Criteria</label>

                <label className="flex items-start gap-2 cursor-pointer text-[13px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={minSciPapers > 0}
                    onChange={(e) => setMinSciPapers(e.target.checked ? 1 : 0)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                  />
                  <span>SCI / Scopus Papers &ge; 1</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-[13px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterQ1Only}
                    onChange={(e) => setFilterQ1Only(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                  />
                  <span>Has Q1 Journal Publications</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-[13px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterPatentsOnly}
                    onChange={(e) => setFilterPatentsOnly(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                  />
                  <span>Has Patents Filed/Granted</span>
                </label>

                <label className="flex items-start gap-2 cursor-pointer text-[13px] font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterGrantsOnly}
                    onChange={(e) => setFilterGrantsOnly(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer mt-0.5 shrink-0"
                  />
                  <span>Has Sponsored Grants</span>
                </label>
              </div>

            </div>
          </details>

          {/* Tree Legend */}
          <div className="p-3 pt-2 border-t border-slate-100 shrink-0 space-y-1">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1.5">Selection Guide</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 shrink-0"></span>
              <span>Click name → Select scope</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-black text-slate-400 text-[13px] leading-none ml-0.5">›</span>
              <span className="ml-0.5">Click arrow → Expand tree</span>
            </div>
          </div>

        </aside>

      {/* ── DRAG RESIZE HANDLE ── */}
      {isSidebarOpen && (
        <div
          onMouseDown={startDrag}
          className="relative shrink-0 w-1 group cursor-col-resize select-none z-20"
          title="Drag to resize sidebar"
          style={isDragging ? { cursor: 'col-resize' } : undefined}
        >
          {/* Invisible wider hit-zone for easier grabbing */}
          <div className="absolute inset-y-0 -left-1 -right-1" />
          {/* Visual indicator line */}
          <div className={`absolute inset-y-0 left-0 w-[3px] rounded-full transition-colors duration-150 ${
            isDragging
              ? 'bg-blue-500'
              : 'bg-transparent group-hover:bg-blue-400/70'
          }`} />
        </div>
      )}

      {/* Global cursor lock while dragging */}
      {isDragging && (
        <style>{`* { cursor: col-resize !important; user-select: none !important; }`}</style>
      )}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-3 space-y-2.5 flex flex-col h-full overflow-hidden min-w-0">
        
        {/* Top Chairman Workspace Header Bar */}
        <header className="flex items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-xl px-4 py-3 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            {/* Scope breadcrumb badge (Green for Dept, Purple for School, Indigo for College, Blue for Campus) */}
            <span className={`px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black border flex items-center gap-2 shrink-0 shadow-2xs ${
              selectionLevel === 'DEPARTMENT' ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : selectionLevel === 'SCHOOL' ? 'bg-purple-50 text-purple-900 border-purple-300'
              : selectionLevel === 'INSTITUTION' ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
              : selectionLevel === 'CAMPUS' ? 'bg-blue-50 text-blue-900 border-blue-300'
              : 'bg-slate-100 text-slate-800 border-slate-300'
            }`}>
              <School className="w-4 h-4 text-emerald-600 shrink-0" />
              {selectionLevel === 'ALL' && 'All Campuses Overview'}
              {selectionLevel === 'CAMPUS' && selectedCampus.replace(' Campus', '')}
              {selectionLevel === 'INSTITUTION' && (
                <>
                  <span className="opacity-70">{selectedCampus.replace(' Campus', '')}</span>
                  <span className="opacity-40 font-black">›</span>
                  <span>{selectedInstitution.split('(')[0].trim()}</span>
                </>
              )}
              {selectionLevel === 'SCHOOL' && (
                <>
                  <span className="opacity-70">{selectedInstitution.split('(')[0].trim()}</span>
                  <span className="opacity-40 font-black">›</span>
                  <span>{selectedSchool}</span>
                </>
              )}
              {selectionLevel === 'DEPARTMENT' && (
                <>
                  <span className="opacity-70">{selectedInstitution.split('(')[0].trim()}</span>
                  <span className="opacity-40 font-black">›</span>
                  <span className="font-extrabold">{selectedDept}</span>
                </>
              )}
            </span>
          </div>


          {/* Controls, Refresh & Export Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-xs font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
              title="Refresh latest data from backend"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
            >
              {isSidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
              <span>{isSidebarOpen ? 'Hide Scope' : 'Show Scope'}</span>
            </button>
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 inline mr-1" />Data View
              </button>
              <button
                onClick={() => setViewMode('SCHEMA_MANAGER')}
                className={`px-3 py-1.5 rounded-md text-xs font-black transition-all ${
                  viewMode === 'SCHEMA_MANAGER' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 inline mr-1" />Schema
              </button>
            </div>
            <button
              onClick={() => handleExportExcel(false)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export ({filteredAppraisals.length})</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition-all"
              title="Export Institutional Summary as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </header>

        {/* ── GRADE NAVIGATION BREADCRUMB / BACK BANNER ── */}
        {selectedGrade !== 'ALL' && (
          <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 shadow-2xs shrink-0 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5">
              <Award className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                Filtered View: <strong className="text-blue-900 font-black">{selectedGrade}</strong> ({executiveMetrics.totalCount} faculty matched)
              </span>
            </div>
            <button
              onClick={() => setSelectedGrade('ALL')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-2xs transition-all active:scale-95 cursor-pointer"
              title="Clear grade filter and return to full dashboard view"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>← Back to All Grades</span>
            </button>
          </div>
        )}


        {/* ── COMPACT PERFORMANCE STATISTICS (4 CARDS) ── */}
        <div className="grid grid-cols-4 gap-2 shrink-0">
          
          {/* Card 1: Total Faculty */}
          <div className="bg-white border border-slate-200/80 rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 leading-none mb-0.5">Total Faculty</p>
              <p className="text-xl font-black text-slate-900 leading-none">{executiveMetrics.totalCount}
                <span className="text-xs text-slate-400 font-normal ml-1">matched</span>
              </p>
            </div>
          </div>

          {/* Card 2: Grade A (INTERACTIVE CLICKABLE CARD) */}
          <button
            onClick={() => setSelectedGrade(selectedGrade === 'Grade A' ? 'ALL' : 'Grade A')}
            className={`text-left rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3 transition-all duration-150 cursor-pointer ${
              selectedGrade === 'Grade A'
                ? 'bg-emerald-600 border-2 border-emerald-600 ring-2 ring-emerald-500/20'
                : 'bg-white border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              selectedGrade === 'Grade A' ? 'bg-white/20' : 'bg-emerald-50 border border-emerald-100'
            }`}>
              <Award className={`w-4 h-4 ${selectedGrade === 'Grade A' ? 'text-white' : 'text-emerald-600'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-wider leading-none mb-0.5 ${
                selectedGrade === 'Grade A' ? 'text-emerald-100' : 'text-emerald-800'
              }`}>Grade A <span className="ml-1 text-[9px] font-bold opacity-80">{executiveMetrics.gradeAPct}%</span></p>
              <p className={`text-xl font-black leading-none ${
                selectedGrade === 'Grade A' ? 'text-white' : 'text-emerald-700'
              }`}>{executiveMetrics.gradeACount}
                <span className={`text-xs font-normal ml-1 ${selectedGrade === 'Grade A' ? 'text-emerald-100' : 'text-emerald-600'}`}>≥310 pts</span>
              </p>
            </div>
          </button>

          {/* Card 3: Grade B (INTERACTIVE CLICKABLE CARD) */}
          <button
            onClick={() => setSelectedGrade(selectedGrade === 'Grade B' ? 'ALL' : 'Grade B')}
            className={`text-left rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3 transition-all duration-150 cursor-pointer ${
              selectedGrade === 'Grade B'
                ? 'bg-amber-500 border-2 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border border-slate-200/80 hover:border-amber-300 hover:bg-amber-50/50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              selectedGrade === 'Grade B' ? 'bg-white/20' : 'bg-amber-50 border border-amber-100'
            }`}>
              <Award className={`w-4 h-4 ${selectedGrade === 'Grade B' ? 'text-white' : 'text-amber-600'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-wider leading-none mb-0.5 ${
                selectedGrade === 'Grade B' ? 'text-amber-100' : 'text-amber-800'
              }`}>Grade B <span className="ml-1 text-[9px] font-bold opacity-80">{executiveMetrics.gradeBPct}%</span></p>
              <p className={`text-xl font-black leading-none ${
                selectedGrade === 'Grade B' ? 'text-white' : 'text-amber-700'
              }`}>{executiveMetrics.gradeBCount}
                <span className={`text-xs font-normal ml-1 ${selectedGrade === 'Grade B' ? 'text-amber-100' : 'text-amber-600'}`}>265–309</span>
              </p>
            </div>
          </button>

          {/* Card 4: Grade C (INTERACTIVE CLICKABLE CARD) */}
          <button
            onClick={() => setSelectedGrade(selectedGrade === 'Grade C' ? 'ALL' : 'Grade C')}
            className={`text-left rounded-xl px-3 py-2.5 shadow-sm flex items-center gap-3 transition-all duration-150 cursor-pointer ${
              selectedGrade === 'Grade C'
                ? 'bg-rose-600 border-2 border-rose-600 ring-2 ring-rose-500/20'
                : 'bg-white border border-slate-200/80 hover:border-rose-300 hover:bg-rose-50/50'
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
              selectedGrade === 'Grade C' ? 'bg-white/20' : 'bg-rose-50 border border-rose-100'
            }`}>
              <Award className={`w-4 h-4 ${selectedGrade === 'Grade C' ? 'text-white' : 'text-rose-600'}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-black uppercase tracking-wider leading-none mb-0.5 ${
                selectedGrade === 'Grade C' ? 'text-rose-100' : 'text-rose-800'
              }`}>Grade C <span className="ml-1 text-[9px] font-bold opacity-80">{Math.max(0, Number((100 - executiveMetrics.gradeAPct - executiveMetrics.gradeBPct).toFixed(1)))}%</span></p>
              <p className={`text-xl font-black leading-none ${
                selectedGrade === 'Grade C' ? 'text-white' : 'text-rose-700'
              }`}>{executiveMetrics.gradeCCount}
                <span className={`text-xs font-normal ml-1 ${selectedGrade === 'Grade C' ? 'text-rose-100' : 'text-rose-600'}`}>&lt;265</span>
              </p>
            </div>
          </button>

        </div>

        {/* ── HIGH-DENSITY DATA TABLE WITH CLEAR CATEGORY BREAKDOWN ── */}
        {viewMode === 'TABLE' && (
          <div className="flex-1 bg-white border border-slate-200/80 rounded-2xl shadow-2xs flex flex-col overflow-hidden animate-in fade-in duration-150">
            
          {/* Table Toolbar */}
          <div className="px-3 py-2 bg-white border-b border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search faculty, ID, department..."
                  className="text-[13px] bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-56"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {/* Page size selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-slate-500 shrink-0">Show:</span>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    onClick={() => setPageSize(size)}
                    className={`px-2 py-1 rounded text-[13px] font-bold transition-all ${
                      pageSize === size
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
            {/* Sorting Controls */}
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600 shrink-0">
              <span className="text-slate-400">Sort:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as any)}
                className="bg-white border border-slate-200 rounded px-2 py-1 outline-none font-bold text-slate-700 text-[13px]"
              >
                <option value="score">Total Score</option>
                <option value="name">Name</option>
                <option value="grade">Grade</option>
                <option value="dept">Dept</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 bg-white border border-slate-200 rounded font-bold hover:bg-slate-50 text-[13px]"
              >
                {sortOrder.toUpperCase()}
              </button>
            </div>
          </div>

          {/* Data Table Scroll Viewport */}
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left min-w-[860px]">
              <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                <tr className="text-slate-500 font-black uppercase text-[9px] tracking-wider">
                  <th className="px-3 py-2 text-center w-8">
                    <input
                      type="checkbox"
                      checked={paginatedAppraisals.length > 0 && paginatedAppraisals.every((a) => selectedAppraisalIds.has(a.id))}
                      onChange={handleToggleSelectAllPage}
                      className="w-3 h-3 accent-blue-600 rounded cursor-pointer"
                    />
                  </th>
                  <th className="px-3 py-2 min-w-[160px]">Faculty Member</th>
                  <th className="px-3 py-2 min-w-[130px]">College / Dept</th>
                  <th className="px-3 py-2 text-center min-w-[56px]" title="Category 1: Teaching, Learning & Evaluation Activities (Max 110 Pts)">CAT 1 ℹ</th>
                  <th className="px-3 py-2 text-center min-w-[56px]" title="Category 2: Co-Curricular, Extension & Outreach (Max 50 Pts)">CAT 2 ℹ</th>
                  <th className="px-3 py-2 text-center min-w-[56px]" title="Category 3: Research & Publications (Max 190 Pts)">CAT 3 ℹ</th>
                  <th className="px-3 py-2 text-center min-w-[80px]">Total /350</th>
                  <th className="px-3 py-2 text-center min-w-[76px]">Grade</th>
                  <th className="px-3 py-2 text-center min-w-[96px]">Status</th>
                  <th className="px-3 py-2 text-right min-w-[64px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedAppraisals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-semibold text-xs">
                      No faculty performance records match your selected evaluation criteria.
                    </td>
                  </tr>
                ) : (
                  paginatedAppraisals.map((rec) => {
                    const isSelectedRow = selectedAppraisalIds.has(rec.id);
                    
                    const cat1Score = rec.cat1.totalHodScore || rec.cat1.totalSelfScore || 0;
                    const cat2Score = rec.cat2.totalHodScore || rec.cat2.totalSelfScore || 0;
                    const cat3Score = rec.cat3.totalHodScore || rec.cat3.totalSelfScore || 0;
                    const totalScore = Math.min(cat1Score + cat2Score + cat3Score, 350);

                    return (
                  <tr
                        key={rec.id}
                        className={`hover:bg-blue-50/30 transition-colors border-b border-slate-100 ${
                          isSelectedRow ? 'bg-blue-50/50' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-2 text-center align-middle">
                          <input
                            type="checkbox"
                            checked={isSelectedRow}
                            onChange={() => handleToggleSelectRow(rec.id)}
                            className="w-3 h-3 accent-blue-600 rounded cursor-pointer"
                          />
                        </td>

                        {/* Faculty Member */}
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 font-black text-[13px] flex items-center justify-center shrink-0 border border-blue-200">
                              {rec.facultyName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[13px] text-slate-900 leading-tight">{rec.facultyName}</p>
                              <p className="text-[9px] text-slate-400 font-mono mt-0.5">{rec.empId} &bull; {rec.designation}</p>
                            </div>
                          </div>
                        </td>

                        {/* College & Dept */}
                        <td className="px-3 py-2 align-middle">
                          <p className="font-bold text-[13px] text-slate-900 leading-snug truncate max-w-[140px]">{rec.department}</p>
                          <p className="text-[9px] text-slate-400 font-medium leading-normal mt-0.5 truncate max-w-[140px]">
                            {rec.institution || rec.campus || 'SRMIST'}
                          </p>
                        </td>

                        {/* CAT 1 */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[13px] font-bold cursor-help"
                            title="Category 1: Teaching, Learning & Evaluation Activities (Max 110 Pts)"
                          >
                            {cat1Score}
                          </span>
                        </td>

                        {/* CAT 2 */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200 text-[13px] font-bold cursor-help"
                            title="Category 2: Co-Curricular, Extension & Outreach (Max 50 Pts)"
                          >
                            {cat2Score}
                          </span>
                        </td>

                        {/* CAT 3 */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span
                            className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[13px] font-bold cursor-help"
                            title="Category 3: Research & Publications (Max 190 Pts)"
                          >
                            {cat3Score}
                          </span>
                        </td>

                        {/* Total Score – emphasized */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span
                            className="inline-block px-2.5 py-1 rounded-md bg-slate-900 text-white font-black text-[13px] shadow-sm font-mono cursor-help"
                            title="Total Academic Performance Indicator (API) Score (Max 350 Pts)"
                          >
                            {totalScore}<span className="text-slate-400 font-normal text-[9px]">/350</span>
                          </span>
                        </td>

                        {/* Grade */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span className={`inline-flex items-center gap-1 text-xs font-extrabold px-2 py-0.5 rounded-full border ${
                            rec.grade === 'Grade A' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.grade === 'Grade B' ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <Award className="w-2.5 h-2.5" />
                            {rec.grade ?? 'Grade C'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-3 py-2 text-center align-middle">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                            rec.status === 'HOI_APPROVED' ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : rec.status === 'HOD_APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : rec.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}>
                            {rec.status?.replace(/_/g, ' ') ?? 'DRAFT'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-2 text-right align-middle">
                          <button
                            onClick={() => setViewRecord(rec)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs border border-blue-200 transition-colors"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-3 py-2 bg-white border-t border-slate-200/80 flex items-center justify-between shrink-0">
            <span className="text-[13px] font-medium text-slate-500">
              Showing <span className="font-bold text-slate-700">{((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalRecordsCount)}</span> of <span className="font-bold text-slate-700">{totalRecordsCount}</span> entries
              {selectedDept !== 'ALL' && <span className="ml-2 text-blue-600 font-bold">· Dept: {selectedDept}</span>}
              {selectedGrade !== 'ALL' && <span className="ml-1 text-blue-600 font-bold">· {selectedGrade}</span>}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50"
              >
                Previous
              </button>
              <span className="text-[13px] font-extrabold text-slate-800 px-2">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50"
              >
                Next
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[13px] font-bold text-slate-600 disabled:opacity-30 hover:bg-slate-50"
              >
                »
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
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-black uppercase text-xs">
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
                        <p className="text-[13px] text-slate-400 mt-0.5">{c.description}</p>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span className={`text-xs font-extrabold px-2.5 py-1 rounded-md uppercase ${
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
                          className={`px-2.5 py-1 rounded-full text-xs font-extrabold border transition-colors ${
                            c.isRequired ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                          }`}
                        >
                          {c.isRequired ? 'Mandatory' : 'Optional'}
                        </button>
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <button
                          onClick={() => handleToggleLock(c.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border transition-colors ${
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
                          <span className="text-xs text-slate-400 font-mono">NAAC Standard</span>
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
