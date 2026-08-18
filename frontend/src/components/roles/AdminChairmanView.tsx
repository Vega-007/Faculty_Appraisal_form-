'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  AppraisalRecord,
  MonthlyWindow,
  AuditLog,
  CAMPUS_HIERARCHY,
  SchemaCriterion,
  GradeType,
} from '@/types/appraisal';
import { DEFAULT_SCHEMA_CRITERIA } from '@/lib/initialData';
import { FullAppraisalModal } from '@/components/FullAppraisalModal';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { typography, tableTokens } from '@/lib/design-tokens';
import {
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
  School,
  Users,
  BookOpen,
  Lock,
  Unlock,
  Plus,
  Trash2,
  ArrowLeft,
  GripVertical,
  ChevronRight,
} from 'lucide-react';

import * as XLSX from 'xlsx';

interface AdminChairmanViewProps {
  appraisals?: AppraisalRecord[];
  monthlyWindows?: MonthlyWindow[];
  auditLogs?: AuditLog[];
  onToggleWindow?: (monthYear: string) => void;
  onUpdateAppraisal?: (updated: AppraisalRecord) => void;
  onRefreshData?: () => Promise<boolean>;
}

export const AdminChairmanView: React.FC<AdminChairmanViewProps> = ({
  appraisals = [],
  monthlyWindows = [],
  auditLogs = [],
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
  const [sidebarWidth, setSidebarWidth] = useState<number>(300);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartX = useRef<number>(0);
  const dragStartWidth = useRef<number>(300);

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragStartX.current = e.clientX;
    dragStartWidth.current = sidebarWidth;
    setIsDragging(true);

    const onMouseMove = (me: MouseEvent) => {
      const delta = me.clientX - dragStartX.current;
      const newWidth = Math.min(480, Math.max(240, dragStartWidth.current + delta));
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
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  /* ── 3b. Tree Navigator Expand/Collapse State ── */
  const [expandedCampuses, setExpandedCampuses] = useState<Set<string>>(new Set());
  const [expandedInstitutions, setExpandedInstitutions] = useState<Set<string>>(new Set());
  const [expandedSchools, setExpandedSchools] = useState<Set<string>>(new Set());
  const [selectionLevel, setSelectionLevel] = useState<'ALL' | 'CAMPUS' | 'INSTITUTION' | 'SCHOOL' | 'DEPARTMENT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  const [selectedGrade, setSelectedGrade] = useState('ALL');
  const [selectedGradeModal, setSelectedGradeModal] = useState<GradeType | null>(null);
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
  const [sortField, setSortField] = useState<'name' | 'score' | 'grade' | 'dept' | 'status'>('score');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

  /* ── 6. Modal States ── */
  const [viewRecord, setViewRecord] = useState<AppraisalRecord | null>(null);
  const [showAddCriteriaModal, setShowAddCriteriaModal] = useState<boolean>(false);

  /* ── 7. Schema Manager State ── */
  const [schemaCriteria, setSchemaCriteria] = useState<SchemaCriterion[]>(DEFAULT_SCHEMA_CRITERIA || []);
  const [newCriteriaLabel, setNewCriteriaLabel] = useState('');
  const [newCriteriaCategory, setNewCriteriaCategory] = useState<'cat1' | 'cat2' | 'cat3'>('cat1');
  const [newCriteriaMaxScore, setNewCriteriaMaxScore] = useState<number>(10);
  const [newCriteriaDesc, setNewCriteriaDesc] = useState('');
  const [newCriteriaMandatory, setNewCriteriaMandatory] = useState<boolean>(false);
  const [draggedItemIdx, setDraggedItemIdx] = useState<number | null>(null);
  const [isRowDraggable, setIsRowDraggable] = useState<number | null>(null);
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);

  const triggerToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  /* ── Helper: get departments under a school within an institution ── */
  const getDeptsForSchool = useCallback((instName: string, schoolName: string): string[] => {
    if (!Array.isArray(CAMPUS_HIERARCHY)) return [];
    for (const c of CAMPUS_HIERARCHY) {
      if (!c || !Array.isArray(c.institutions)) continue;
      const inst = c.institutions.find((i) => i && i.name === instName);
      if (!inst || !Array.isArray(inst.schools)) continue;
      const school = inst.schools.find((s) => s && s.name === schoolName);
      return Array.isArray(school?.departments) ? school.departments : [];
    }
    return [];
  }, []);

  /* ── MASTER EXHAUSTIVE REAL-TIME FILTER ENGINE ── */
  const safeAppraisalsList = useMemo(() => {
    return Array.isArray(appraisals) ? appraisals : [];
  }, [appraisals]);

  const scopeAppraisalsList = useMemo(() => {
    return safeAppraisalsList.filter((a) => {
      if (!a) return false;
      const aCampus = a.campus || '';
      const aInst = a.institution || '';
      const aDept = a.department || '';

      const matchesCampus =
        selectedCampus === 'ALL' ||
        !aCampus ||
        aCampus === selectedCampus ||
        (selectedCampus === 'SRM Ramapuram Campus' && (!aCampus || aCampus.includes('Ramapuram'))) ||
        (selectedCampus === 'SRM Trichy Campus' && aCampus.includes('Trichy'));

      const matchesInst =
        selectedInstitution === 'ALL' ||
        !aInst ||
        aInst === selectedInstitution ||
        (selectedInstitution.includes('Easwari') && aInst.includes('Easwari')) ||
        (selectedInstitution.includes('Dental') && aInst.includes('Dental')) ||
        (selectedInstitution.includes('Prime') && aInst.includes('Prime')) ||
        (selectedInstitution.includes('Science & Humanities') && (aInst.includes('Humanities') || aInst.includes('S&H'))) ||
        (selectedInstitution.includes('SRMIST') && (aInst === 'SRM IST' || aInst.includes('SRMIST')));

      const schoolDepts = selectedSchool !== 'ALL' ? getDeptsForSchool(selectedInstitution, selectedSchool) : [];
      const matchesSchool =
        selectedSchool === 'ALL' ||
        schoolDepts.includes(aDept) ||
        schoolDepts.some((d) => aDept.toLowerCase().includes(d.toLowerCase()));

      const matchesDept =
        selectedDept === 'ALL' ||
        aDept === selectedDept ||
        aDept.toLowerCase().includes(selectedDept.toLowerCase());

      return matchesCampus && matchesInst && matchesSchool && matchesDept;
    });
  }, [safeAppraisalsList, selectedCampus, selectedInstitution, selectedSchool, selectedDept, getDeptsForSchool]);

  const filteredAppraisals = useMemo(() => {
    return safeAppraisalsList.filter((a) => {
      if (!a) return false;

      // 1. Campus & Institution & School & Department
      const aCampus = a.campus || '';
      const aInst = a.institution || '';
      const aDept = a.department || '';

      const matchesCampus =
        selectedCampus === 'ALL' ||
        !aCampus ||
        aCampus === selectedCampus ||
        (selectedCampus === 'SRM Ramapuram Campus' && (!aCampus || aCampus.includes('Ramapuram'))) ||
        (selectedCampus === 'SRM Trichy Campus' && aCampus.includes('Trichy'));

      const matchesInst =
        selectedInstitution === 'ALL' ||
        !aInst ||
        aInst === selectedInstitution ||
        (selectedInstitution.includes('Easwari') && aInst.includes('Easwari')) ||
        (selectedInstitution.includes('Dental') && aInst.includes('Dental')) ||
        (selectedInstitution.includes('Prime') && aInst.includes('Prime')) ||
        (selectedInstitution.includes('Science & Humanities') && (aInst.includes('Humanities') || aInst.includes('S&H'))) ||
        (selectedInstitution.includes('SRMIST') && (aInst === 'SRM IST' || aInst.includes('SRMIST')));

      const schoolDepts = selectedSchool !== 'ALL' ? getDeptsForSchool(selectedInstitution, selectedSchool) : [];
      const matchesSchool =
        selectedSchool === 'ALL' ||
        schoolDepts.includes(aDept) ||
        schoolDepts.some((d) => aDept.toLowerCase().includes(d.toLowerCase()));

      const matchesDept =
        selectedDept === 'ALL' ||
        aDept === selectedDept ||
        aDept.toLowerCase().includes(selectedDept.toLowerCase());

      // 2. Search Query
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === '' ||
        (a.facultyName && a.facultyName.toLowerCase().includes(q)) ||
        (a.empId && a.empId.toLowerCase().includes(q)) ||
        (a.designation && a.designation.toLowerCase().includes(q)) ||
        (a.department && a.department.toLowerCase().includes(q));

      // 3. Status & Grade & Window
      const matchesStatus = selectedStatus.length === 0 || selectedStatus.includes(a.status);
      const matchesGrade = selectedGrade === 'ALL' || a.grade === selectedGrade;
      const matchesWindow = selectedWindow === 'ALL' || a.monthYear === selectedWindow;

      // 4. Score Thresholds
      const scoreTotal = a.hodScoreTotal || a.selfScoreTotal || 0;
      const c1Score = a.cat1?.totalHodScore || a.cat1?.totalSelfScore || 0;
      const c2Score = a.cat2?.totalHodScore || a.cat2?.totalSelfScore || 0;
      const c3Score = a.cat3?.totalHodScore || a.cat3?.totalSelfScore || 0;

      const matchesScore =
        scoreTotal >= minTotalScore &&
        c1Score >= minCat1Score &&
        c2Score >= minCat2Score &&
        c3Score >= minCat3Score;

      // 5. Small Field Specific Filters
      const journalsList = Array.isArray(a.cat3?.journals) ? a.cat3.journals : [];
      const patentsList = Array.isArray(a.cat3?.patents) ? a.cat3.patents : [];
      const fundedProjectsList = Array.isArray(a.cat3?.fundedProjects) ? a.cat3.fundedProjects : [];

      const matchesSci = journalsList.length >= minSciPapers;
      const matchesQ1 = !filterQ1Only || journalsList.some((j) => j && j.quartile === 'Q1');
      const matchesPatents = !filterPatentsOnly || patentsList.length > 0;
      const matchesGrants = !filterGrantsOnly || fundedProjectsList.length > 0;

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
    safeAppraisalsList,
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
      let valA: any = a?.facultyName || '';
      let valB: any = b?.facultyName || '';
      if (sortField === 'score') {
        valA = a?.hodScoreTotal || a?.selfScoreTotal || 0;
        valB = b?.hodScoreTotal || b?.selfScoreTotal || 0;
      } else if (sortField === 'grade') {
        valA = a?.grade || '';
        valB = b?.grade || '';
      } else if (sortField === 'dept') {
        valA = a?.department || '';
        valB = b?.department || '';
      } else if (sortField === 'status') {
        valA = a?.status || '';
        valB = b?.status || '';
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
    setSelectedStatus([]);
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
    setExpandedCampuses(new Set(['SRM Ramapuram Campus']));
    setExpandedInstitutions(new Set(['SRM Institute of Science & Technology (SRMIST)']));
    setExpandedSchools(new Set());
    triggerToast('All scope filters & navigation tree reset.');
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
    setExpandedInstitutions((prev) => new Set(Array.from(prev).concat(instName)));
  };

  const handleSelectSchool = (campusName: string, instName: string, schoolName: string) => {
    setSelectedCampus(campusName);
    setSelectedInstitution(instName);
    setSelectedSchool(schoolName);
    setSelectedDept('ALL');
    setSelectionLevel('SCHOOL');
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

  /* ── Checkbox Selection Handlers ── */
  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedAppraisalIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedAppraisalIds(next);
  };

  const handleToggleSelectAllPage = () => {
    const currentPageIds = (paginatedAppraisals || []).map((a) => a.id);
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

    (filteredAppraisals || []).forEach((a) => {
      if (!a) return;
      totalScoreSum += Math.min((a.hodScoreTotal || a.selfScoreTotal || 0), 350);
      if (a.grade === 'Grade A') gradeACount += 1;
      else if (a.grade === 'Grade B') gradeBCount += 1;
      else gradeCCount += 1;
    });

    const totalCount = filteredAppraisals.length;
    const avgScore = totalCount > 0 ? Number((totalScoreSum / totalCount).toFixed(1)) : 0;
    const gradeAPct = totalCount > 0 ? Number(((gradeACount / totalCount) * 100).toFixed(1)) : 0;
    const gradeBPct = totalCount > 0 ? Number(((gradeBCount / totalCount) * 100).toFixed(1)) : 0;
    const gradeCPct = totalCount > 0 ? Number(((gradeCCount / totalCount) * 100).toFixed(1)) : 0;

    return {
      totalCount,
      avgScore,
      gradeACount,
      gradeBCount,
      gradeCCount,
      gradeAPct,
      gradeBPct,
      gradeCPct,
    };
  }, [filteredAppraisals]);

  /* ── All Campus Aggregated Statistics Engine ── */
  const campusCollegeMetrics = useMemo(() => {
    const calcMetrics = (subset: AppraisalRecord[]) => {
      let totalCount = subset.length;
      let gradeACount = 0;
      let gradeBCount = 0;
      let gradeCCount = 0;

      (subset || []).forEach((a) => {
        if (!a) return;
        if (a.grade === 'Grade A') gradeACount += 1;
        else if (a.grade === 'Grade B') gradeBCount += 1;
        else gradeCCount += 1;
      });

      const gradeAPct = totalCount > 0 ? Number(((gradeACount / totalCount) * 100).toFixed(1)) : 0;
      const gradeBPct = totalCount > 0 ? Number(((gradeBCount / totalCount) * 100).toFixed(1)) : 0;
      const gradeCPct = totalCount > 0 ? Number(((gradeCCount / totalCount) * 100).toFixed(1)) : 0;

      return { totalCount, gradeACount, gradeBCount, gradeCCount, gradeAPct, gradeBPct, gradeCPct };
    };

    const ramapuramList = safeAppraisalsList.filter((a) => a && (a.campus?.includes('Ramapuram') || !a.campus));
    const trichyList = safeAppraisalsList.filter((a) => a && a.campus?.includes('Trichy'));

    // Ramapuram colleges
    const srmistList = ramapuramList.filter((a) => a && (a.institution?.includes('SRMIST') || a.institution?.includes('SRM Institute') || a.institution?.includes('SRM IST')));
    const easwariList = ramapuramList.filter((a) => a && (a.institution?.includes('Easwari') || a.institution?.includes('EEC')));
    const dentalList = ramapuramList.filter((a) => a && (a.institution?.includes('Dental') || a.institution?.includes('SRMDC')));

    // SRMIST Schools breakdown
    const etDepts = new Set([
      'Computer Science & Engineering (CSE)',
      'Artificial Intelligence (AI)',
      'Electronics & Communication Engineering (ECE)',
      'Electrical & Electronics Engineering (EEE)',
      'Information Technology (IT)',
      'Biomedical Engineering (BME)',
      'Civil Engineering',
      'Mechanical Engineering',
    ]);

    const flabsDepts = new Set([
      'COMMERCE',
      'Commerce - PA, ISM, IAF& SF',
      'BCA',
      'Commerce (A&F)',
      'Data Science',
      'B.Sc Cyber Security',
      'B.Sc Computer Science',
      'B.Sc. (AI & ML)',
      'MCA',
      'Viscom',
      'Film Tech',
      'Fashion Designing',
      'JMC',
      'LCS (English)',
      'LCS (Tamil)',
      'Biotechnology',
      'Psychology',
      'Mathematics',
      'Physics',
      'Chemistry',
      'Economics',
      'Computer Science & Applications',
      'English',
      'FLABS',
    ]);

    const srmistEtList = srmistList.filter((a) => a && etDepts.has(a.department));
    const srmistFlabsList = srmistList.filter((a) => a && flabsDepts.has(a.department));
    const srmistMgmtList = srmistList.filter((a) => a && a.department === 'Management Studies');
    const srmistBarchList = srmistList.filter((a) => a && (a.department === 'SEAD' || a.department?.includes('Arch')));

    // Trichy colleges
    const trichyEnggList = trichyList.filter((a) => a && a.institution?.includes('Engineering'));
    const trichyMedList = trichyList.filter((a) => a && a.institution?.includes('Medical'));

    return {
      overall: calcMetrics(safeAppraisalsList),
      ramapuram: {
        total: calcMetrics(ramapuramList),
        srmist: calcMetrics(srmistList),
        srmistSchools: {
          et: calcMetrics(srmistEtList),
          flabs: calcMetrics(srmistFlabsList),
          management: calcMetrics(srmistMgmtList),
          barch: calcMetrics(srmistBarchList),
        },
        easwari: calcMetrics(easwariList),
        dental: calcMetrics(dentalList),
      },
      trichy: {
        total: calcMetrics(trichyList),
        trichyEngg: calcMetrics(trichyEnggList),
        trichyMed: calcMetrics(trichyMedList),
      },
    };
  }, [safeAppraisalsList]);

  /* ── EXCEL EXPORT ENGINE ── */
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
      (prev || []).map((c) => (c.id === id ? { ...c, maxScore: newMax } : c))
    );
    triggerToast(`Updated parameter maximum score.`);
  };

  const handleToggleLock = (id: string) => {
    setSchemaCriteria((prev) =>
      (prev || []).map((c) => (c.id === id ? { ...c, isLocked: !c.isLocked } : c))
    );
    triggerToast(`Toggled parameter lock state.`);
  };

  const handleAddCriteria = () => {
    if (!newCriteriaLabel.trim()) {
      triggerToast('Criteria name is required', 'error');
      return;
    }
    const newCriterion: SchemaCriterion = {
      id: `custom_${Date.now()}`,
      category: newCriteriaCategory,
      label: newCriteriaLabel,
      description: newCriteriaDesc,
      maxScore: newCriteriaMaxScore,
      isRequired: newCriteriaMandatory,
      isLocked: false,
      isCustom: true,
    };
    setSchemaCriteria((prev) => [...(prev || []), newCriterion]);
    triggerToast(`Added criteria field: ${newCriteriaLabel}`);
    
    // Reset state
    setNewCriteriaLabel('');
    setNewCriteriaCategory('cat1');
    setNewCriteriaMaxScore(10);
    setNewCriteriaDesc('');
    setNewCriteriaMandatory(false);
    setShowAddCriteriaModal(false);
  };

  return (
    <div className="relative flex bg-slate-50 text-slate-900 font-sans text-xs w-full">
      
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

      {/* Mobile Backdrop Overlay for Scope Sidebar */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* ── TREE NAVIGATOR SIDEBAR (Campus → College → Department) ── */}
      <aside
        style={isSidebarOpen ? { width: sidebarWidth, minWidth: sidebarWidth, maxWidth: sidebarWidth } : undefined}
        className={`bg-white border-r border-slate-200 shrink-0 flex flex-col shadow-2xs ${
          isSidebarOpen
            ? 'max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:shadow-2xl max-lg:w-[300px] max-lg:max-w-[85vw] lg:relative lg:flex lg:min-h-full'
            : 'w-0 p-0 overflow-hidden border-0'
        }`}
      >

        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3.5 py-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
            <h3 className={typography.labelMicro}>
              Institutional Scope
            </h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
              title="Reset to All Campuses scope"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md p-1 transition-colors cursor-pointer"
              title="Hide Scope Sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── CLICKABLE INDEPENDENTLY SCROLLABLE TREE NAVIGATOR ── */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 min-h-0">

          {/* Root: All Campuses node */}
          <button
            onClick={handleSelectAllCampuses}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
              selectionLevel === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Select All Campuses Overview"
          >
            <School className="w-4 h-4 shrink-0" />
            <span className="truncate flex-1">All Campuses</span>
            <span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${
              selectionLevel === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {executiveMetrics.totalCount}
            </span>
          </button>

          {/* Campus nodes */}
          {(CAMPUS_HIERARCHY || []).map((campusNode) => {
            if (!campusNode) return null;
            const isCampusSelected = selectionLevel === 'CAMPUS' && selectedCampus === campusNode.campus;
            const isCampusExpanded = expandedCampuses.has(campusNode.campus);
            const isCampusActive = selectedCampus === campusNode.campus && selectionLevel !== 'ALL';

            return (
              <div key={campusNode.campus} className="space-y-1">

                {/* Campus Row */}
                <div className={`flex items-center gap-1 rounded-xl transition-all ${
                  isCampusSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isCampusActive
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-slate-100/70'
                }`}>
                  {/* Expand arrow */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleCampusExpand(campusNode.campus); }}
                    className={`w-7 h-8 flex items-center justify-center shrink-0 transition-transform rounded-l-xl cursor-pointer ${
                      isCampusSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                    title={`${isCampusExpanded ? 'Collapse' : 'Expand'} ${campusNode.campus}`}
                    aria-label={`${isCampusExpanded ? 'Collapse' : 'Expand'} ${campusNode.campus}`}
                  >
                    <span className={`inline-block transition-transform duration-150 text-xs font-bold leading-none ${
                      isCampusExpanded ? 'rotate-90' : ''
                    }`}>›</span>
                  </button>

                  {/* Campus name */}
                  <button
                    onClick={() => handleSelectCampus(campusNode.campus)}
                    className={`flex-1 flex items-center gap-2 py-2 pr-2.5 text-xs font-semibold text-left min-w-0 transition-colors cursor-pointer ${
                      isCampusSelected ? 'text-white font-bold' : isCampusActive ? 'text-blue-700 font-bold' : 'text-slate-700 hover:text-slate-900'
                    }`}
                    title={campusNode.campus}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{campusNode.campus.replace(' Campus', '')}</span>
                  </button>
                </div>

                {/* Institution nodes */}
                {isCampusExpanded && Array.isArray(campusNode.institutions) && (
                  <div className="pl-4 space-y-1 border-l border-slate-200 ml-3.5 tree-line">
                    {campusNode.institutions.map((inst) => {
                      if (!inst) return null;
                      const isInstSelected = selectionLevel === 'INSTITUTION' && selectedInstitution === inst.name;
                      const isInstExpanded = expandedInstitutions.has(inst.name);
                      const isInstActive = selectedInstitution === inst.name && selectionLevel !== 'CAMPUS' && selectionLevel !== 'ALL';
                      const hasSchools = !!(Array.isArray(inst.schools) && inst.schools.length > 0);
                      const hasDepts = !hasSchools && !!(Array.isArray(inst.departments) && inst.departments.length > 0);

                      return (
                        <div key={inst.name} className="space-y-1">

                          {/* Institution Row */}
                          <div className={`flex items-center gap-1 rounded-xl transition-all ${
                            isInstSelected
                              ? 'bg-blue-600 text-white shadow-xs font-bold'
                              : isInstActive
                              ? 'bg-blue-50 border border-blue-200'
                              : 'hover:bg-slate-100/70'
                          }`}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleToggleInstExpand(inst.name); }}
                              className={`w-6 h-7 flex items-center justify-center shrink-0 transition-transform rounded-l-xl cursor-pointer ${
                                isInstSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                              }`}
                              title={`${isInstExpanded ? 'Collapse' : 'Expand'} ${inst.name}`}
                              aria-label={`${isInstExpanded ? 'Collapse' : 'Expand'} ${inst.name}`}
                            >
                              {(hasSchools || hasDepts) && (
                                <span className={`inline-block transition-transform duration-150 text-xs font-bold leading-none ${
                                  isInstExpanded ? 'rotate-90' : ''
                                }`}>›</span>
                              )}
                            </button>

                            <button
                              onClick={() => handleSelectInstitution(campusNode.campus, inst.name)}
                              className={`flex-1 py-1.5 pr-2 text-xs font-semibold text-left leading-tight min-w-0 transition-colors cursor-pointer ${
                                isInstSelected ? 'text-white' : isInstActive ? 'text-blue-700 font-bold' : 'text-slate-700 hover:text-slate-900'
                              }`}
                              title={inst.name}
                            >
                              <span className="block truncate">{inst.name}</span>
                            </button>
                          </div>

                          {/* Children: Schools OR Departments */}
                          {isInstExpanded && (
                            <div className="pl-3.5 space-y-1 border-l border-slate-200 ml-2.5 tree-line">
                              {hasSchools && (inst.schools || []).map((school) => {
                                if (!school) return null;
                                const schoolKey = `${inst.name}::${school.name}`;
                                const isSchoolSelected = selectionLevel === 'SCHOOL' && selectedSchool === school.name && selectedInstitution === inst.name;
                                const isSchoolExpanded = expandedSchools.has(schoolKey);
                                const isSchoolActive = selectedSchool === school.name && selectedInstitution === inst.name && selectionLevel !== 'INSTITUTION' && selectionLevel !== 'ALL' && selectionLevel !== 'CAMPUS';

                                return (
                                  <div key={school.name} className="space-y-1">
                                    {/* School Row */}
                                    <div className={`flex items-center gap-1 rounded-lg transition-all ${
                                      isSchoolSelected
                                        ? 'bg-blue-600 text-white shadow-xs font-bold'
                                        : isSchoolActive
                                        ? 'bg-blue-50 border border-blue-200'
                                        : 'hover:bg-slate-100/70'
                                    }`}>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleToggleSchoolExpand(schoolKey); }}
                                        className={`w-5 h-7 flex items-center justify-center shrink-0 rounded-l-lg cursor-pointer ${
                                          isSchoolSelected ? 'text-white/80 hover:bg-white/10' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                                        }`}
                                        title={`${isSchoolExpanded ? 'Collapse' : 'Expand'} ${school.name}`}
                                      >
                                        <span className={`inline-block transition-transform duration-150 text-xs font-bold leading-none ${
                                          isSchoolExpanded ? 'rotate-90' : ''
                                        }`}>›</span>
                                      </button>
                                      <button
                                        onClick={() => handleSelectSchool(campusNode.campus, inst.name, school.name)}
                                        className={`flex-1 py-1.5 pr-2 text-xs font-semibold text-left leading-tight min-w-0 transition-colors cursor-pointer ${
                                          isSchoolSelected ? 'text-white' : isSchoolActive ? 'text-blue-700 font-bold' : 'text-slate-700 hover:text-slate-900'
                                        }`}
                                        title={`${inst.name} — ${school.name}`}
                                      >
                                        <span className="block truncate">{school.name}</span>
                                      </button>
                                    </div>

                                    {/* Departments under school */}
                                    {isSchoolExpanded && (
                                      <div className="pl-3.5 space-y-1 border-l border-slate-200 ml-2 tree-line">
                                        {(school.departments || []).map((dept) => {
                                          const isDeptSelected =
                                            selectionLevel === 'DEPARTMENT' &&
                                            selectedDept === dept &&
                                            selectedInstitution === inst.name;

                                          return (
                                            <button
                                              key={dept}
                                              onClick={() => handleSelectDepartment(campusNode.campus, inst.name, school.name, dept)}
                                              className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all min-w-0 cursor-pointer ${
                                                isDeptSelected
                                                  ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                              }`}
                                              title={`${dept} Department`}
                                            >
                                              <BookOpen className={`w-3 h-3 shrink-0 ${
                                                isDeptSelected ? 'text-white' : 'text-slate-400'
                                              }`} />
                                              <span className="truncate flex-1">{dept}</span>
                                            </button>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                              {/* Flat departments */}
                              {hasDepts && (inst.departments || []).map((dept) => {
                                const isDeptSelected =
                                  selectionLevel === 'DEPARTMENT' &&
                                  selectedDept === dept &&
                                  selectedInstitution === inst.name;

                                return (
                                  <button
                                    key={dept}
                                    onClick={() => handleSelectDepartment(campusNode.campus, inst.name, 'ALL', dept)}
                                    className={`w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-all min-w-0 cursor-pointer ${
                                      isDeptSelected
                                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                    }`}
                                    title={`${dept} Department`}
                                  >
                                    <BookOpen className={`w-3 h-3 shrink-0 ${
                                      isDeptSelected ? 'text-white' : 'text-slate-400'
                                    }`} />
                                    <span className="truncate flex-1">{dept}</span>
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

        {/* ── PINNED BOTTOM FILTERS ── */}
        <div className="shrink-0 border-t border-slate-200 bg-slate-50 p-2.5 space-y-2">
          <details className="group border border-slate-200 rounded-xl bg-white overflow-hidden shadow-2xs">
            <summary className="p-2.5 font-bold text-xs uppercase tracking-wider text-slate-700 cursor-pointer flex items-center justify-between select-none hover:bg-slate-50 transition-colors">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" /> Advanced Filters
              </span>
              <span className="text-xs font-bold text-blue-600 group-open:rotate-180 transition-transform">&darr;</span>
            </summary>

            <div className="p-2.5 space-y-2.5 border-t border-slate-100 bg-white">
              {/* Form Status */}
              <div className="space-y-1">
                <label className={typography.labelMicro}>Form Status</label>
                <div className="flex flex-col gap-1.5 p-1 bg-white border border-slate-200 rounded-lg shadow-2xs">
                  {['HOD_APPROVED', 'HOI_APPROVED', 'SUBMITTED', 'DRAFT'].map((st) => (
                    <label key={st} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded-md transition-colors">
                      <input
                        type="checkbox"
                        checked={selectedStatus.includes(st)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedStatus((prev) => [...prev, st]);
                          else setSelectedStatus((prev) => prev.filter((s) => s !== st));
                        }}
                        className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-700">{st.replace('_', ' ')}</span>
                    </label>
                  ))}
                  {selectedStatus.length > 0 && (
                    <button
                      onClick={() => setSelectedStatus([])}
                      className="text-left text-[10px] font-bold text-blue-600 hover:underline px-1 py-0.5 mt-0.5"
                    >
                      Clear Status Filter
                    </button>
                  )}
                </div>
              </div>

              {/* Score Threshold Sliders */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className={typography.labelMicro}>Min Total Score</label>
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Score &ge;:</span>
                  <span className="text-blue-700 font-mono font-bold">{minTotalScore} / 350</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={350}
                  step={10}
                  value={minTotalScore}
                  onChange={(e) => setMinTotalScore(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer h-1.5"
                />
              </div>

              {/* Academic Output Checkboxes */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <label className={`${typography.labelMicro} mb-1 block`}>Academic Criteria</label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={minSciPapers > 0}
                    onChange={(e) => setMinSciPapers(e.target.checked ? 1 : 0)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <span>SCI / Scopus Papers &ge; 1</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterQ1Only}
                    onChange={(e) => setFilterQ1Only(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <span>Has Q1 Journal Publications</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterPatentsOnly}
                    onChange={(e) => setFilterPatentsOnly(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <span>Has Patents Filed/Granted</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={filterGrantsOnly}
                    onChange={(e) => setFilterGrantsOnly(e.target.checked)}
                    className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer shrink-0"
                  />
                  <span>Has Sponsored Grants</span>
                </label>
              </div>

            </div>
          </details>
        </div>

      </aside>

      {/* ── DRAG RESIZE HANDLE (Desktop Only) ── */}
      {isSidebarOpen && (
        <div
          onMouseDown={startDrag}
          className="hidden lg:block relative shrink-0 w-1 group cursor-col-resize select-none z-20"
          title="Drag to resize sidebar"
          style={isDragging ? { cursor: 'col-resize' } : undefined}
        >
          <div className="absolute inset-y-0 -left-1 -right-1" />
          <div className={`absolute inset-y-0 left-0 w-[3px] rounded-full transition-colors duration-150 ${
            isDragging
              ? 'bg-blue-500'
              : 'bg-transparent group-hover:bg-blue-400/70'
          }`} />
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTENT ── */}
      <main className="flex-1 p-3.5 space-y-3 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 bg-white border border-slate-200 rounded-xl px-4 py-2.5 shadow-2xs shrink-0 min-w-0">
          
          {/* Breadcrumb Scope Hierarchy */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg mr-1 cursor-pointer shrink-0 transition-colors"
                title="Show Scope Sidebar"
              >
                <PanelLeft className="w-4 h-4 text-blue-600" />
              </button>
            )}
            <span className={`${typography.labelMicro} mr-1 shrink-0`}>Scope:</span>
            
            {selectionLevel === 'ALL' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shrink-0">
                <School className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>All Campuses Overview</span>
              </span>
            )}

            {selectionLevel !== 'ALL' && (
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5 shrink-0" title={selectedCampus}>
                <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{selectedCampus.replace(' Campus', '')}</span>
              </span>
            )}

            {(selectionLevel === 'INSTITUTION' || selectionLevel === 'SCHOOL' || selectionLevel === 'DEPARTMENT') && (
              <>
                <span className="text-slate-300 font-bold text-xs shrink-0">›</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5 shrink-0" title={selectedInstitution}>
                  <School className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <span>{selectedInstitution.split('(')[0].trim()}</span>
                </span>
              </>
            )}

            {(selectionLevel === 'SCHOOL' || (selectionLevel === 'DEPARTMENT' && selectedSchool !== 'ALL')) && (
              <>
                <span className="text-slate-300 font-bold text-xs shrink-0">›</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1 shrink-0" title={selectedSchool}>
                  <span>{selectedSchool}</span>
                </span>
              </>
            )}

            {selectionLevel === 'DEPARTMENT' && (
              <>
                <span className="text-slate-300 font-bold text-xs shrink-0">›</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-2xs flex items-center gap-1.5 shrink-0" title={`${selectedDept} Department`}>
                  <BookOpen className="w-3.5 h-3.5 text-blue-100 shrink-0" />
                  <span>{selectedDept}</span>
                </span>
              </>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              icon={<RotateCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />}
            >
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </Button>



            {/* View Mode Toggle */}
            <div className="bg-slate-100 p-0.5 rounded-lg flex items-center gap-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('TABLE')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Grid className="w-3.5 h-3.5 inline mr-1" />Data
              </button>
              <button
                onClick={() => setViewMode('SCHEMA_MANAGER')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  viewMode === 'SCHEMA_MANAGER' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 inline mr-1" />Evaluation Criteria
              </button>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleExportExcel(false)}
              icon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
            >
              <span>Export ({filteredAppraisals.length})</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleExportPdf}
              icon={<Printer className="w-3.5 h-3.5" />}
            >
              <span>PDF</span>
            </Button>
          </div>
        </header>

        {selectionLevel === 'ALL' ? (
          /* ── ALL CAMPUSES AGGREGATED EXECUTIVE DASHBOARD (INITIAL LANDING VIEW) ── */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Welcome & Overall Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 rounded-2xl p-5 sm:p-6 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-blue-200 text-xs font-semibold backdrop-blur-xs border border-white/10">
                  <Building2 className="w-3.5 h-3.5" /> Institutional Executive Overview
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional Faculty Performance Portal</h2>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">Aggregated Analytics Across SRM Ramapuram &amp; SRM Trichy Campuses</p>
              </div>

              <div className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-xs border border-white/10 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-blue-200">All Campuses Roster</p>
                  <p className="text-2xl font-black text-white leading-none mt-0.5">{campusCollegeMetrics.overall.totalCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-600/50 flex items-center justify-center border border-white/20">
                  <Users className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* Overall Performance Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Total Faculty */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex items-center justify-between">
                <div>
                  <p className={typography.displayStat}>{campusCollegeMetrics.overall.totalCount}</p>
                  <p className={`${typography.labelMicro} mt-1`}>Total Faculty Roster</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">all campuses combined</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* Grade A */}
              <div
                onClick={() => setSelectedGradeModal('Grade A')}
                className="bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                title="Click to view Grade A popup report"
              >
                <div>
                  <p className={`${typography.displayStat} text-emerald-700`}>{campusCollegeMetrics.overall.gradeACount}</p>
                  <p className={`${typography.labelMicro} text-emerald-800 font-bold mt-1`}>Grade A ({campusCollegeMetrics.overall.gradeAPct}%)</p>
                  <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Click for dept breakdown</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              {/* Grade B */}
              <div
                onClick={() => setSelectedGradeModal('Grade B')}
                className="bg-white border border-slate-200 hover:border-amber-300 hover:bg-amber-50/20 rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                title="Click to view Grade B popup report"
              >
                <div>
                  <p className={`${typography.displayStat} text-amber-700`}>{campusCollegeMetrics.overall.gradeBCount}</p>
                  <p className={`${typography.labelMicro} text-amber-800 font-bold mt-1`}>Grade B ({campusCollegeMetrics.overall.gradeBPct}%)</p>
                  <p className="text-[11px] text-amber-600 font-medium mt-0.5">Click for dept breakdown</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
              </div>

              {/* Grade C */}
              <div
                onClick={() => setSelectedGradeModal('Grade C')}
                className="bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50/20 rounded-xl p-4 shadow-2xs flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01]"
                title="Click to view Grade C popup report"
              >
                <div>
                  <p className={`${typography.displayStat} text-rose-700`}>{campusCollegeMetrics.overall.gradeCCount}</p>
                  <p className={`${typography.labelMicro} text-rose-800 font-bold mt-1`}>Grade C ({campusCollegeMetrics.overall.gradeCPct}%)</p>
                  <p className="text-[11px] text-rose-600 font-medium mt-0.5">Click for dept breakdown</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* ── 1. SRM RAMAPURAM CAMPUS SECTION ── */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">1. SRM Ramapuram Campus</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                  {campusCollegeMetrics.ramapuram.total.totalCount} Faculty Members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* College 1: SRMIST */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <School className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">SRMIST</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">E&amp;T, FLABS, Management, B.Arch</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {campusCollegeMetrics.ramapuram.srmist.totalCount} Faculty
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div
                      onClick={() => setSelectedGradeModal('Grade A')}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-emerald-800">Grade A</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmist.gradeACount}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.srmist.gradeAPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade B')}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-amber-800">Grade B</p>
                      <p className="text-base font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmist.gradeBCount}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.srmist.gradeBPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade C')}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-rose-800">Grade C</p>
                      <p className="text-base font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmist.gradeCCount}</p>
                      <p className="text-[10px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.srmist.gradeCPct}%</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectInstitution('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)')}
                    className="w-full justify-between mt-2"
                    icon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                  >
                    <span>Explore SRMIST Departments</span>
                  </Button>
                </div>

                {/* College 2: Easwari */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">Easwari Engg College</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">EEC Engineering &amp; Tech</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {campusCollegeMetrics.ramapuram.easwari.totalCount} Faculty
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div
                      onClick={() => setSelectedGradeModal('Grade A')}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-emerald-800">Grade A</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.easwari.gradeACount}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.easwari.gradeAPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade B')}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-amber-800">Grade B</p>
                      <p className="text-base font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.easwari.gradeBCount}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.easwari.gradeBPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade C')}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-rose-800">Grade C</p>
                      <p className="text-base font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.easwari.gradeCCount}</p>
                      <p className="text-[10px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.easwari.gradeCPct}%</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectInstitution('SRM Ramapuram Campus', 'Easwari Engineering College (EEC)')}
                    className="w-full justify-between mt-2"
                    icon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                  >
                    <span>Explore Easwari Departments</span>
                  </Button>
                </div>

                {/* College 3: SRM Dental College */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Award className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">SRM Dental College</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">SRMDC Dental Sciences</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                      {campusCollegeMetrics.ramapuram.dental.totalCount} Faculty
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div
                      onClick={() => setSelectedGradeModal('Grade A')}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-emerald-800">Grade A</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.dental.gradeACount}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.dental.gradeAPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade B')}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-amber-800">Grade B</p>
                      <p className="text-base font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.dental.gradeBCount}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.dental.gradeBPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade C')}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-rose-800">Grade C</p>
                      <p className="text-base font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.dental.gradeCCount}</p>
                      <p className="text-[10px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.dental.gradeCPct}%</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectInstitution('SRM Ramapuram Campus', 'SRM Dental College (SRMDC)')}
                    className="w-full justify-between mt-2"
                    icon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                  >
                    <span>Explore Dental Departments</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* ── 2. SRM TRICHY CAMPUS SECTION ── */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">2. SRM Trichy Campus</h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
                  {campusCollegeMetrics.trichy.total.totalCount} Faculty Members
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* College 1: SRM Trichy Engineering College */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <School className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">SRM Trichy Engineering College</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">CSE, ECE, Mechanical, Civil</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      {campusCollegeMetrics.trichy.trichyEngg.totalCount} Faculty
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div
                      onClick={() => setSelectedGradeModal('Grade A')}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-emerald-800">Grade A</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.trichy.trichyEngg.gradeACount}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{campusCollegeMetrics.trichy.trichyEngg.gradeAPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade B')}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-amber-800">Grade B</p>
                      <p className="text-base font-black text-amber-700 mt-0.5">{campusCollegeMetrics.trichy.trichyEngg.gradeBCount}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{campusCollegeMetrics.trichy.trichyEngg.gradeBPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade C')}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-rose-800">Grade C</p>
                      <p className="text-base font-black text-rose-700 mt-0.5">{campusCollegeMetrics.trichy.trichyEngg.gradeCCount}</p>
                      <p className="text-[10px] text-rose-600 font-medium">{campusCollegeMetrics.trichy.trichyEngg.gradeCPct}%</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectInstitution('SRM Trichy Campus', 'SRM Trichy Engineering College')}
                    className="w-full justify-between mt-2"
                    icon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                  >
                    <span>Explore Trichy Engineering Departments</span>
                  </Button>
                </div>

                {/* College 2: SRM Trichy Medical College */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 shadow-2xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">SRM Trichy Medical College</h4>
                        <p className="text-[11px] text-slate-500 font-medium truncate">Medicine, Surgery, Paediatrics, Anaesthesiology</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                      {campusCollegeMetrics.trichy.trichyMed.totalCount} Faculty
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <div
                      onClick={() => setSelectedGradeModal('Grade A')}
                      className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-center cursor-pointer hover:bg-emerald-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-emerald-800">Grade A</p>
                      <p className="text-base font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.trichy.trichyMed.gradeACount}</p>
                      <p className="text-[10px] text-emerald-600 font-medium">{campusCollegeMetrics.trichy.trichyMed.gradeAPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade B')}
                      className="p-2.5 rounded-xl bg-amber-50/60 border border-amber-100 text-center cursor-pointer hover:bg-amber-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-amber-800">Grade B</p>
                      <p className="text-base font-black text-amber-700 mt-0.5">{campusCollegeMetrics.trichy.trichyMed.gradeBCount}</p>
                      <p className="text-[10px] text-amber-600 font-medium">{campusCollegeMetrics.trichy.trichyMed.gradeBPct}%</p>
                    </div>

                    <div
                      onClick={() => setSelectedGradeModal('Grade C')}
                      className="p-2.5 rounded-xl bg-rose-50/60 border border-rose-100 text-center cursor-pointer hover:bg-rose-100/60 transition-colors"
                    >
                      <p className="text-[11px] font-bold text-rose-800">Grade C</p>
                      <p className="text-base font-black text-rose-700 mt-0.5">{campusCollegeMetrics.trichy.trichyMed.gradeCCount}</p>
                      <p className="text-[10px] text-rose-600 font-medium">{campusCollegeMetrics.trichy.trichyMed.gradeCPct}%</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSelectInstitution('SRM Trichy Campus', 'SRM Trichy Medical College')}
                    className="w-full justify-between mt-2"
                    icon={<ChevronRight className="w-4 h-4 text-slate-400" />}
                  >
                    <span>Explore Trichy Medical Departments</span>
                  </Button>
                </div>
              </div>
            </div>

          </div>
        ) : (
          /* ── DETAILED DEPARTMENT / COLLEGE FACULTY TABLE VIEW ── */
          <div className="space-y-4">
            {/* ── GRADE FILTER BANNER ── */}
            {selectedGrade !== 'ALL' && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 shadow-2xs shrink-0 animate-in fade-in duration-150">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Award className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate">
                    Active Filter View: <strong className="text-blue-900 font-bold">{selectedGrade}</strong> ({executiveMetrics.totalCount} faculty matched)
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setSelectedGradeModal(selectedGrade as GradeType)}
                    icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                  >
                    <span>View {selectedGrade} Report</span>
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setSelectedGrade('ALL')}
                    icon={<ArrowLeft className="w-3.5 h-3.5" />}
                  >
                    <span>Back to All Grades</span>
                  </Button>
                </div>
              </div>
            )}

            {/* ── SRMIST SUB-SCHOOLS 4-CARD BOX GRID ── */}
            {(selectedInstitution.includes('SRMIST') || selectedSchool !== 'ALL') && (
              <div className="space-y-3 bg-slate-100/70 p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <School className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">SRMIST Constituent Schools Overview</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Click any school box to filter departments and view specific faculty statistics</p>
                    </div>
                  </div>
                  {selectedSchool !== 'ALL' && (
                    <button
                      onClick={() => handleSelectInstitution('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)')}
                      className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Reset to All SRMIST Schools
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: E&T */}
                  <div className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3.5 transition-all ${
                    selectedSchool === 'E&T' ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                          <School className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">E&amp;T</h5>
                          <p className="text-[10px] text-slate-500 font-medium truncate">Engineering &amp; Tech</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                        {campusCollegeMetrics.ramapuram.srmistSchools.et.totalCount} Faculty
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                      <div
                        onClick={() => setSelectedGradeModal('Grade A')}
                        className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 cursor-pointer hover:bg-emerald-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-emerald-800">Grade A</p>
                        <p className="text-sm font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeACount}</p>
                        <p className="text-[9px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeAPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade B')}
                        className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100 cursor-pointer hover:bg-amber-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-amber-800">Grade B</p>
                        <p className="text-sm font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeBCount}</p>
                        <p className="text-[9px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeBPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade C')}
                        className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-100 cursor-pointer hover:bg-rose-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-rose-800">Grade C</p>
                        <p className="text-sm font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeCCount}</p>
                        <p className="text-[9px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.et.gradeCPct}%</p>
                      </div>
                    </div>

                    <Button
                      variant={selectedSchool === 'E&T' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleSelectSchool('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)', 'E&T')}
                      className="w-full justify-between mt-1 text-xs"
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      <span>Explore E&amp;T Departments</span>
                    </Button>
                  </div>

                  {/* Card 2: FLABS */}
                  <div className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3.5 transition-all ${
                    selectedSchool === 'FLABS' ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">FLABS</h5>
                          <p className="text-[10px] text-slate-500 font-medium truncate">Liberal Arts &amp; Biz</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                        {campusCollegeMetrics.ramapuram.srmistSchools.flabs.totalCount} Faculty
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                      <div
                        onClick={() => setSelectedGradeModal('Grade A')}
                        className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 cursor-pointer hover:bg-emerald-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-emerald-800">Grade A</p>
                        <p className="text-sm font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeACount}</p>
                        <p className="text-[9px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeAPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade B')}
                        className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100 cursor-pointer hover:bg-amber-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-amber-800">Grade B</p>
                        <p className="text-sm font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeBCount}</p>
                        <p className="text-[9px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeBPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade C')}
                        className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-100 cursor-pointer hover:bg-rose-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-rose-800">Grade C</p>
                        <p className="text-sm font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeCCount}</p>
                        <p className="text-[9px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.flabs.gradeCPct}%</p>
                      </div>
                    </div>

                    <Button
                      variant={selectedSchool === 'FLABS' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleSelectSchool('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)', 'FLABS')}
                      className="w-full justify-between mt-1 text-xs"
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      <span>Explore FLABS Departments</span>
                    </Button>
                  </div>

                  {/* Card 3: Management */}
                  <div className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3.5 transition-all ${
                    selectedSchool === 'Management' ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">Management</h5>
                          <p className="text-[10px] text-slate-500 font-medium truncate">School of Management</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {campusCollegeMetrics.ramapuram.srmistSchools.management.totalCount} Faculty
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                      <div
                        onClick={() => setSelectedGradeModal('Grade A')}
                        className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 cursor-pointer hover:bg-emerald-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-emerald-800">Grade A</p>
                        <p className="text-sm font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeACount}</p>
                        <p className="text-[9px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeAPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade B')}
                        className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100 cursor-pointer hover:bg-amber-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-amber-800">Grade B</p>
                        <p className="text-sm font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeBCount}</p>
                        <p className="text-[9px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeBPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade C')}
                        className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-100 cursor-pointer hover:bg-rose-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-rose-800">Grade C</p>
                        <p className="text-sm font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeCCount}</p>
                        <p className="text-[9px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.management.gradeCPct}%</p>
                      </div>
                    </div>

                    <Button
                      variant={selectedSchool === 'Management' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleSelectSchool('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)', 'Management')}
                      className="w-full justify-between mt-1 text-xs"
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      <span>Explore Management Depts</span>
                    </Button>
                  </div>

                  {/* Card 4: B.Arch */}
                  <div className={`bg-white border rounded-2xl p-4 shadow-xs space-y-3.5 transition-all ${
                    selectedSchool === 'B.Arch' ? 'border-blue-500 ring-2 ring-blue-500/25 bg-blue-50/20' : 'border-slate-200 hover:border-blue-300'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-bold text-xs text-slate-900 truncate">B.Arch</h5>
                          <p className="text-[10px] text-slate-500 font-medium truncate">SEAD Architecture</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                        {campusCollegeMetrics.ramapuram.srmistSchools.barch.totalCount} Faculty
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                      <div
                        onClick={() => setSelectedGradeModal('Grade A')}
                        className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 cursor-pointer hover:bg-emerald-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-emerald-800">Grade A</p>
                        <p className="text-sm font-black text-emerald-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeACount}</p>
                        <p className="text-[9px] text-emerald-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeAPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade B')}
                        className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100 cursor-pointer hover:bg-amber-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-amber-800">Grade B</p>
                        <p className="text-sm font-black text-amber-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeBCount}</p>
                        <p className="text-[9px] text-amber-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeBPct}%</p>
                      </div>
                      <div
                        onClick={() => setSelectedGradeModal('Grade C')}
                        className="p-1.5 rounded-lg bg-rose-50/70 border border-rose-100 cursor-pointer hover:bg-rose-100/70 transition-colors"
                      >
                        <p className="text-[10px] font-bold text-rose-800">Grade C</p>
                        <p className="text-sm font-black text-rose-700 mt-0.5">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeCCount}</p>
                        <p className="text-[9px] text-rose-600 font-medium">{campusCollegeMetrics.ramapuram.srmistSchools.barch.gradeCPct}%</p>
                      </div>
                    </div>

                    <Button
                      variant={selectedSchool === 'B.Arch' ? 'primary' : 'secondary'}
                      size="sm"
                      onClick={() => handleSelectSchool('SRM Ramapuram Campus', 'SRM Institute of Science & Technology (SRMIST)', 'B.Arch')}
                      className="w-full justify-between mt-1 text-xs"
                      icon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      <span>Explore SEAD Depts</span>
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ── PERFORMANCE STATISTICS (4 CARDS) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
              
              {/* Card 1: Total Faculty */}
              <div
                onClick={() => setSelectedGrade('ALL')}
                className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition-all ${
                  selectedGrade === 'ALL' ? 'border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/30' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="min-w-0">
                  <p className={typography.displayStat}>{executiveMetrics.totalCount}</p>
                  <p className={`${typography.labelMicro} mt-1 truncate`}>Total Faculty</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5 truncate">matched in scope</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>

              {/* Card 2: Grade A */}
              <div
                onClick={() => setSelectedGradeModal('Grade A')}
                className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedGrade === 'Grade A'
                    ? 'border-emerald-500 ring-2 ring-emerald-500/25 bg-emerald-50/50'
                    : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                }`}
                title="Click to view Grade A detailed report modal"
              >
                <div className="min-w-0">
                  <p className={`${typography.displayStat} ${selectedGrade === 'Grade A' ? 'text-emerald-800' : 'text-slate-900'}`}>
                    {executiveMetrics.gradeACount}
                  </p>
                  <p className={`${typography.labelMicro} mt-1 truncate text-emerald-800 font-bold`}>
                    Grade A ({executiveMetrics.gradeAPct}%)
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium mt-0.5 truncate">≥ 310 pts · Click to open report</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Card 3: Grade B */}
              <div
                onClick={() => setSelectedGradeModal('Grade B')}
                className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedGrade === 'Grade B'
                    ? 'border-amber-500 ring-2 ring-amber-500/25 bg-amber-50/50'
                    : 'border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                }`}
                title="Click to view Grade B detailed report modal"
              >
                <div className="min-w-0">
                  <p className={`${typography.displayStat} ${selectedGrade === 'Grade B' ? 'text-amber-800' : 'text-slate-900'}`}>
                    {executiveMetrics.gradeBCount}
                  </p>
                  <p className={`${typography.labelMicro} mt-1 truncate text-amber-800 font-bold`}>
                    Grade B ({executiveMetrics.gradeBPct}%)
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium mt-0.5 truncate">265–309 pts · Click to open report</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-5 h-5 text-amber-600" />
                </div>
              </div>

              {/* Card 4: Grade C */}
              <div
                onClick={() => setSelectedGradeModal('Grade C')}
                className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-xs flex items-center justify-between gap-3.5 cursor-pointer transition-all hover:scale-[1.01] ${
                  selectedGrade === 'Grade C'
                    ? 'border-rose-500 ring-2 ring-rose-500/25 bg-rose-50/50'
                    : 'border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
                }`}
                title="Click to view Grade C detailed report modal"
              >
                <div className="min-w-0">
                  <p className={`${typography.displayStat} ${selectedGrade === 'Grade C' ? 'text-rose-800' : 'text-slate-900'}`}>
                    {executiveMetrics.gradeCCount}
                  </p>
                  <p className={`${typography.labelMicro} mt-1 truncate text-rose-800 font-bold`}>
                    Grade C ({executiveMetrics.gradeCPct}%)
                  </p>
                  <p className="text-[11px] text-rose-700 font-medium mt-0.5 truncate">&lt; 265 pts · Click to open report</p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Award className="w-5 h-5 text-rose-600" />
                </div>
              </div>
            </div>

        {/* ── HIGH-DENSITY DATA TABLE ── */}
        {viewMode === 'TABLE' && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xs flex flex-col animate-in fade-in duration-150">
            
            {/* Table Toolbar */}
            <div className="px-4 py-2.5 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search faculty, ID, department..."
                    className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 w-60 shadow-2xs"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status Multi-select Popover Filter */}
                <div className="relative shrink-0">
                  <button
                    onClick={() => setShowStatusPopover(!showStatusPopover)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-xs font-semibold text-slate-700 shadow-2xs cursor-pointer h-[34px]"
                  >
                    <span>Status Filter</span>
                    {selectedStatus.length > 0 && (
                      <span className="bg-blue-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                        {selectedStatus.length}
                      </span>
                    )}
                    <span className="text-[9px] text-slate-400">▼</span>
                  </button>

                  {showStatusPopover && (
                    <>
                      {/* Backdrop to close the popover */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowStatusPopover(false)}
                      />
                      {/* Popover content */}
                      <div className="absolute left-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 z-20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-100">
                        <p className="font-bold text-[10px] text-slate-400 uppercase tracking-wider px-1">Filter by Status</p>
                        <div className="flex flex-col gap-1">
                          {['HOD_APPROVED', 'HOI_APPROVED', 'SUBMITTED', 'DRAFT'].map((st) => (
                            <label
                              key={st}
                              className="flex items-center gap-2 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={selectedStatus.includes(st)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedStatus((prev) => [...prev, st]);
                                  else setSelectedStatus((prev) => prev.filter((s) => s !== st));
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              />
                              <span className="text-xs font-semibold text-slate-700">
                                {st.replace('_', ' ')}
                              </span>
                            </label>
                          ))}
                        </div>
                        {selectedStatus.length > 0 && (
                          <div className="border-t border-slate-100 pt-1.5 flex justify-between items-center px-1">
                            <button
                              onClick={() => setSelectedStatus([])}
                              className="text-[10px] font-bold text-rose-600 hover:underline"
                            >
                              Clear All
                            </button>
                            <button
                              onClick={() => setShowStatusPopover(false)}
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                            >
                              Done
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Page size selector */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 font-medium shrink-0">Show:</span>
                  {(PAGE_SIZE_OPTIONS || [10, 20, 50, 100]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setPageSize(size)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        pageSize === size
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sorting Controls */}
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
                <span className="text-slate-400 font-normal">Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as any)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 outline-none font-semibold text-slate-700 text-xs shadow-2xs cursor-pointer"
                >
                  <option value="score">Total Score</option>
                  <option value="name">Name</option>
                  <option value="grade">Grade</option>
                  <option value="dept">Dept</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-bold hover:bg-slate-50 text-xs shadow-2xs cursor-pointer"
                >
                  {sortOrder.toUpperCase()}
                </button>
              </div>
            </div>

            {/* Data Table Viewport */}
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[960px] border-collapse">
                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={paginatedAppraisals.length > 0 && paginatedAppraisals.every((a) => a && selectedAppraisalIds.has(a.id))}
                        onChange={handleToggleSelectAllPage}
                        className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                      />
                    </th>
                    <th className={tableTokens.th}>Faculty Member</th>
                    <th className={tableTokens.th}>College / Department</th>
                    <th className={`${tableTokens.thCenter} whitespace-nowrap`} title="Category 1: Teaching, Learning & Evaluation (Max 110)">CAT 1</th>
                    <th className={`${tableTokens.thCenter} whitespace-nowrap`} title="Category 2: Co-Curricular & Outreach (Max 50)">CAT 2</th>
                    <th className={`${tableTokens.thCenter} whitespace-nowrap`} title="Category 3: Research & Publications (Max 190)">CAT 3</th>
                    <th className={`${tableTokens.thCenter} whitespace-nowrap`}>Total /350</th>
                    <th className={tableTokens.thCenter}>Grade</th>
                    <th className={tableTokens.thCenter}>Status</th>
                    <th className={tableTokens.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {paginatedAppraisals.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-14 text-center text-slate-400 font-medium text-sm">
                        No faculty performance records match your selected evaluation criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAppraisals.map((rec) => {
                      if (!rec) return null;
                      const isSelectedRow = selectedAppraisalIds.has(rec.id);
                      
                      const cat1Score = rec.cat1?.totalHodScore || rec.cat1?.totalSelfScore || 0;
                      const cat2Score = rec.cat2?.totalHodScore || rec.cat2?.totalSelfScore || 0;
                      const cat3Score = rec.cat3?.totalHodScore || rec.cat3?.totalSelfScore || 0;
                      const totalScore = Math.min(cat1Score + cat2Score + cat3Score, 350);

                      return (
                        <tr
                          key={rec.id}
                          className={`${tableTokens.tr} ${isSelectedRow ? 'bg-blue-50/40' : ''}`}
                        >
                          <td className="px-4 py-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={isSelectedRow}
                              onChange={() => handleToggleSelectRow(rec.id)}
                              className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
                            />
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
                                {rec.facultyName?.charAt(0) ?? '?'}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-slate-900 leading-tight truncate">{rec.facultyName}</p>
                                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{rec.empId} &bull; {rec.designation}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-middle">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-slate-900 leading-tight truncate" title={rec.department}>{rec.department}</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate" title={rec.institution || rec.campus || 'SRMIST'}>
                                {rec.institution || rec.campus || 'SRMIST'}
                              </p>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                              {cat1Score}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                              {cat2Score}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                              {cat3Score}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-900 text-white font-bold text-xs shadow-2xs font-mono">
                              {totalScore}<span className="text-slate-400 font-normal">/350</span>
                            </span>
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <GradeBadge
                              grade={rec.grade || 'Grade C'}
                              size="sm"
                              onClick={() => setSelectedGradeModal((rec.grade || 'Grade C') as GradeType)}
                            />
                          </td>

                          <td className="px-4 py-3 text-center align-middle">
                            <StatusPill status={rec.status} size="sm" />
                          </td>

                          <td className="px-4 py-3 text-right align-middle">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setViewRecord(rec)}
                              icon={<Eye className="w-3.5 h-3.5 text-blue-600" />}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs font-medium text-slate-500">
                Showing <span className="font-bold text-slate-900">{totalRecordsCount === 0 ? 0 : ((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalRecordsCount)}</span> of <span className="font-bold text-slate-900">{totalRecordsCount}</span> entries
                {selectedDept !== 'ALL' && <span className="ml-2 text-blue-600 font-semibold">· Dept: {selectedDept}</span>}
                {selectedGrade !== 'ALL' && <span className="ml-1 text-blue-600 font-semibold">· {selectedGrade}</span>}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Previous
                </button>
                <span className="text-xs font-bold text-slate-900 px-2">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 disabled:opacity-30 hover:bg-slate-50 cursor-pointer shadow-2xs"
                >
                  »
                </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

        {/* VIEW MODE: SCHEMA MANAGER */}
        {viewMode === 'SCHEMA_MANAGER' && (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-5 space-y-5 animate-in fade-in duration-200 overflow-y-auto flex-1">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3.5">
              <div>
                <h2 className={`${typography.h2} flex items-center gap-2`}>
                  <Sliders className="w-5 h-5 text-blue-600" /> Evaluation Criteria Management
                </h2>
                <p className={typography.caption}>
                  Manage Category I, II, and III scoring criteria parameters and maximum score thresholds.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowAddCriteriaModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Criteria Parameter
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-slate-500 w-8"></th>
                    <th className={`${tableTokens.th} w-[40%]`}>Criteria Parameter</th>
                    <th className={tableTokens.thCenter}>Category</th>
                    <th className={tableTokens.thCenter}>Max Points ✎</th>
                    <th className={tableTokens.thCenter}>Mandatory</th>
                    <th className={tableTokens.thCenter}>Parameter Lock</th>
                    <th className={tableTokens.thRight}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {[
                    { key: 'cat1', label: 'Category I — Teaching, Learning & Evaluation', bg: 'bg-blue-50/60 border-blue-100 text-blue-800' },
                    { key: 'cat2', label: 'Category II — Co-Curricular, Extension & Professional Development', bg: 'bg-amber-50/60 border-amber-100 text-amber-800' },
                    { key: 'cat3', label: 'Category III — Research, Publications & Academic Contributions', bg: 'bg-emerald-50/60 border-emerald-100 text-emerald-800' }
                  ].map((cat) => {
                    const catItems = (schemaCriteria || []).filter(c => c && c.category === cat.key);
                    return (
                      <React.Fragment key={cat.key}>
                        <tr className={`${cat.bg} border-y`}>
                          <td colSpan={7} className="px-4 py-3 font-bold text-xs uppercase tracking-wider">
                            {cat.label}
                          </td>
                        </tr>
                        {catItems.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-4 py-6 text-center text-slate-400 font-medium italic">
                              No parameters defined in this category.
                            </td>
                          </tr>
                        ) : (
                          catItems.map((c) => {
                            const idx = (schemaCriteria || []).findIndex((item) => item.id === c.id);
                            if (idx === -1) return null;
                            return (
                              <tr
                                key={c.id}
                                draggable={isRowDraggable === idx}
                                onDragStart={(e) => {
                                  setDraggedItemIdx(idx);
                                  e.dataTransfer.effectAllowed = 'move';
                                  const tr = e.currentTarget;
                                  setTimeout(() => {
                                    tr.style.opacity = '0.5';
                                  }, 0);
                                }}
                                onDragEnd={(e) => {
                                  setDraggedItemIdx(null);
                                  setIsRowDraggable(null);
                                  e.currentTarget.style.opacity = '1';
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDragEnter={(e) => {
                                  if (draggedItemIdx === null || draggedItemIdx === idx) return;
                                  const draggedItem = schemaCriteria[draggedItemIdx];
                                  if (draggedItem.category !== c.category) return;
                                  
                                  setSchemaCriteria((prev) => {
                                    const newItems = [...(prev || [])];
                                    newItems.splice(draggedItemIdx, 1);
                                    newItems.splice(idx, 0, draggedItem);
                                    setDraggedItemIdx(idx);
                                    return newItems;
                                  });
                                }}
                                className={`hover:bg-slate-50 transition-colors ${draggedItemIdx === idx ? 'bg-blue-50/50 cursor-grabbing' : ''}`}
                              >
                                <td 
                                  className="px-2 py-3 text-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors select-none"
                                  onMouseDown={() => setIsRowDraggable(idx)}
                                  onMouseUp={() => setIsRowDraggable(null)}
                                >
                                  <GripVertical className="w-4 h-4 mx-auto" />
                                </td>
                                
                                <td className="px-4 py-3">
                                  <p className="font-semibold text-slate-900">{c.label}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">{c.description}</p>
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md uppercase bg-slate-100 text-slate-700 border border-slate-200">
                                    {c.category ? c.category.toUpperCase() : 'CAT1'}
                                  </span>
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <input
                                    type="number"
                                    value={c.maxScore}
                                    min={1}
                                    max={200}
                                    onChange={(e) => handleUpdateMaxScore(c.id, Number(e.target.value))}
                                    className="w-16 text-center font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-2 py-1 outline-none"
                                  />
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => {
                                      setSchemaCriteria((prev) =>
                                        (prev || []).map((item) => (item.id === c.id ? { ...item, isRequired: !item.isRequired } : item))
                                      );
                                      triggerToast(`Toggled parameter requirement.`);
                                    }}
                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                                      c.isRequired ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                                    }`}
                                  >
                                    {c.isRequired ? 'Mandatory' : 'Optional'}
                                  </button>
                                </td>

                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => handleToggleLock(c.id)}
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                                      c.isLocked ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    }`}
                                  >
                                    {c.isLocked ? <Lock className="w-3 h-3 text-rose-600" /> : <Unlock className="w-3 h-3 text-emerald-600" />}
                                    {c.isLocked ? 'Locked' : 'Active'}
                                  </button>
                                </td>

                                <td className="px-4 py-3 text-right">
                                  {c.isCustom ? (
                                    <button
                                      onClick={() => {
                                        setSchemaCriteria((prev) => (prev || []).filter((item) => item.id !== c.id));
                                        triggerToast(`Deleted custom criteria '${c.label}'`);
                                      }}
                                      className="text-rose-600 font-semibold text-xs p-1 hover:text-rose-800 cursor-pointer"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-400 font-mono">NAAC Standard</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* ── ADD CRITERIA MODAL ── */}
      {showAddCriteriaModal && (
        <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" /> Add Evaluation Parameter
              </h2>
              <button
                onClick={() => setShowAddCriteriaModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Category Selection</label>
                <select
                  value={newCriteriaCategory}
                  onChange={(e) => setNewCriteriaCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cat1">Category I — Teaching, Learning & Evaluation</option>
                  <option value="cat2">Category II — Co-Curricular & Professional Activities</option>
                  <option value="cat3">Category III — Research & Publications</option>
                </select>
              </div>

              {/* Label */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Parameter Name</label>
                <input
                  type="text"
                  placeholder="e.g. Guest Lectures Organised"
                  value={newCriteriaLabel}
                  onChange={(e) => setNewCriteriaLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Max Score */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Maximum Points</label>
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={newCriteriaMaxScore}
                  onChange={(e) => setNewCriteriaMaxScore(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Mandatory */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newCriteriaMandatory"
                  checked={newCriteriaMandatory}
                  onChange={(e) => setNewCriteriaMandatory(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="newCriteriaMandatory" className="font-semibold text-slate-700 cursor-pointer select-none">
                  Mandatory Parameter (Must be filled by faculty)
                </label>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Brief Description / Guideline</label>
                <textarea
                  placeholder="Provide instructions or compliance requirements for the HOD/HOI..."
                  value={newCriteriaDesc}
                  onChange={(e) => setNewCriteriaDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowAddCriteriaModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddCriteria}
              >
                Add Field
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── GRADE DETAIL MODAL ── */}
      {selectedGradeModal && (
        <GradeDetailModal
          grade={selectedGradeModal}
          appraisals={filteredAppraisals}
          onClose={() => setSelectedGradeModal(null)}
          onSelectRecord={(rec) => {
            setSelectedGradeModal(null);
            setViewRecord(rec);
          }}
        />
      )}

      {/* ── FULL FACULTY APPRAISAL VIEW MODAL ── */}
      {viewRecord && (
        <FullAppraisalModal
          record={viewRecord}
          onClose={() => setViewRecord(null)}
        />
      )}

    </div>
  );
};
