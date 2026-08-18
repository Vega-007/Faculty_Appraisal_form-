'use client';

import React, { useState, useEffect } from 'react';
import {
  AppraisalRecord,
  TeachingExperienceEntry,
  IndustryExperienceEntry,
  AcademicCourseResultEntry,
  TeachingLoadEntry,
  LearningMaterialEntry,
  InnovativePedagogyEntry,
  SlowLearnerSupportEntry,
  ExamDutyEntry,
  MoocDevelopmentEntry,
  NptelEntry,
  ProfessionalCertificationEntry,
  EndSemResultEntry,
  CoPoAttainmentEntry,
  IndustryConnectEntry,
  StudentDesignCompetitionEntry,
  StudentStartupProjectEntry,
  DeptInstContributionEntry,
  CommunityServiceEntry,
  ProfessionCommitteeEntry,
  WorkshopSeminarEntry,
  FdpAttendedEntry,
  ProfessionalMembershipEntry,
  EventOrganizedEntry,
  DeliveredLectureEntry,
  BrandBuildingEntry,
  ConferencePaperEntry,
  JournalPublicationEntry,
  CitationEntry,
  CitationQ1Entry,
  ConsultancyEntry,
  PatentEntry,
  PhDSupervisionEntry,
  ResearchAwardEntry,
  FundedProjectEntry,
  IndustryUseCaseEntry,
  LastYearComplianceEntry,
  RevisionFlagItem,
  GradeType,
} from '@/types/appraisal';
import { SEED_APPRAISALS } from '@/lib/mockSeedData';
import { GradeDetailModal } from '@/components/GradeDetailModal';
import { calculateCategory1, calculateCategory2, calculateCategory3, calculateGrade } from '@/lib/scoring';
import {
  Lock,
  Save,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  X,
  ExternalLink,
  ChevronRight,
  FileText,
  BookOpen,
  Layers,
  Award,
  ClipboardCheck,
  User,
  Building,
  GraduationCap,
  Calendar,
  Briefcase,
  Printer,
  Info,
  AlertTriangle,
  ArrowDown,
} from 'lucide-react';
import { StatusPill } from '@/components/ui/StatusPill';
import { Button } from '@/components/ui/Button';

/* ─── UI Atoms ─────────────────────────────────────────────── */

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  return <StatusPill status={status} size="sm" />;
};

const SectionHeader: React.FC<{ id: string; icon: React.ReactNode; title: string; subtitle?: string; maxPts?: number }> = ({
  id, icon, title, subtitle, maxPts,
}) => (
  <div id={id} className="flex items-center gap-3 pt-10 pb-4 border-b-2 border-blue-600 mb-6 scroll-mt-20">
    <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
    </div>
    {maxPts && (
      <span className="text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full shrink-0">
        Max {maxPts} pts
      </span>
    )}
  </div>
);

const SubHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div className="mb-4 pb-2 border-b border-slate-200">
    <h3 className="text-sm font-bold text-slate-800">{title}</h3>
    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode; hint?: string; required?: boolean }> = ({
  label, children, hint, required,
}) => (
  <div className="space-y-1">
    <label className="block text-xs font-semibold text-slate-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="text-[13px] text-slate-400 leading-snug">{hint}</p>}
  </div>
);

const TextInput: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; className?: string }> = ({
  value, onChange, disabled, placeholder, className = '',
}) => (
  <input
    type="text"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    className={`w-full text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors ${className}`}
  />
);

const TextArea: React.FC<{ value: string; onChange: (v: string) => void; disabled?: boolean; placeholder?: string; rows?: number }> = ({
  value, onChange, disabled, placeholder, rows = 3,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    disabled={disabled}
    placeholder={placeholder}
    rows={rows}
    className="w-full text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 resize-none transition-colors"
  />
);

const NumberInput: React.FC<{ value: number; onChange: (v: number) => void; min?: number; max?: number; disabled?: boolean; className?: string; placeholder?: string }> = ({
  value, onChange, min = 0, max, disabled, className = '', placeholder = '0',
}) => (
  <input
    type="number"
    value={value === 0 ? '' : value}
    onChange={(e) => onChange(Number(e.target.value))}
    min={min}
    max={max}
    disabled={disabled}
    placeholder={placeholder}
    className={`w-full text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors ${className}`}
  />
);

/* ── DateInput: supports both typed DD/MM/YYYY and calendar picker ── */
// Converts YYYY-MM-DD (native) → DD/MM/YYYY (display)
function nativeToDisplay(native: string): string {
  if (!native) return '';
  const [y, m, d] = native.split('-');
  if (!y || !m || !d) return native;
  return `${d}/${m}/${y}`;
}
// Converts DD/MM/YYYY or DD.MM.YYYY → YYYY-MM-DD (native)
function displayToNative(display: string): string {
  const clean = display.replace(/\./g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    const [d, m, y] = parts;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return '';
}
// Normalise any typed value to DD/MM/YYYY on blur
function normaliseDate(raw: string): string {
  if (!raw || raw === 'Till Date' || raw.toLowerCase() === 'till date') return raw;
  const clean = raw.replace(/\./g, '/').trim();
  const parts = clean.split('/');
  if (parts.length === 3) {
    const [d, m, y] = parts;
    const dd = d.padStart(2, '0');
    const mm = m.padStart(2, '0');
    if (y.length === 4 && !isNaN(Number(dd)) && !isNaN(Number(mm))) {
      return `${dd}/${mm}/${y}`;
    }
  }
  return raw;
}

const DateInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  allowTillDate?: boolean;
}> = ({ value, onChange, disabled, placeholder = 'DD/MM/YYYY', className = '', allowTillDate = false }) => {
  const pickerRef = React.useRef<HTMLInputElement>(null);
  const nativeVal = displayToNative(value);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleTextBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) return;
    if (allowTillDate && raw.toLowerCase().includes('till')) {
      onChange('Till Date');
      return;
    }
    onChange(normaliseDate(raw));
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      onChange(nativeToDisplay(e.target.value));
    }
  };

  return (
    <div className={`flex items-center gap-1 w-full ${className}`}>
      <input
        type="text"
        value={value}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors min-w-0"
      />
      {!disabled && (
        <>
          <button
            type="button"
            onClick={() => pickerRef.current?.showPicker?.() || pickerRef.current?.click()}
            title="Pick date from calendar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <input
            ref={pickerRef}
            type="date"
            value={nativeVal}
            onChange={handleCalendarChange}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
          />
        </>
      )}
    </div>
  );
};

/* ── MonthYearInput: MM/YYYY — typed or month picker ── */
const MonthYearInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}> = ({ value, onChange, disabled, placeholder = 'MM/YYYY' }) => {
  const pickerRef = React.useRef<HTMLInputElement>(null);

  // Convert "Apr 2025" or "04/2025" → "2025-04" for native month input
  const toNativeMonth = (v: string): string => {
    const clean = v.trim();
    // Already YYYY-MM
    if (/^\d{4}-\d{2}$/.test(clean)) return clean;
    // MM/YYYY or MM-YYYY
    const slashMatch = clean.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (slashMatch) return `${slashMatch[2]}-${slashMatch[1].padStart(2, '0')}`;
    // "Apr 2025" style
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const named = clean.match(/^([A-Za-z]{3})\s+(\d{4})$/);
    if (named) {
      const m = monthNames[named[1].toLowerCase()];
      if (m) return `${named[2]}-${m}`;
    }
    return '';
  };

  const fromNativeMonth = (native: string): string => {
    // "2025-04" → "04/2025"
    if (!native) return '';
    const [y, m] = native.split('-');
    return `${m}/${y}`;
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) onChange(fromNativeMonth(e.target.value));
  };

  return (
    <div className="flex items-center gap-1 w-full">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors min-w-0"
      />
      {!disabled && (
        <>
          <button
            type="button"
            onClick={() => pickerRef.current?.showPicker?.() || pickerRef.current?.click()}
            title="Pick month from calendar"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md border border-slate-200 bg-white text-slate-400 hover:text-blue-600 hover:border-blue-300 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </button>
          <input
            ref={pickerRef}
            type="month"
            value={toNativeMonth(value)}
            onChange={handleCalendarChange}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
            tabIndex={-1}
          />
        </>
      )}
    </div>
  );
};

/* ─── SCORING GUIDES DATA DICTIONARY ────────────────────────── */
interface GuideItem {
  label: string;
  pts: string;
  desc: string;
}

interface ScoringGuide {
  title: string;
  code: string;
  maxPts: number;
  formula?: string;
  summary: string;
  items: GuideItem[];
  notes?: string[];
}

const SCORING_GUIDES: Record<string, ScoringGuide> = {
  // ── CATEGORY 1 ──
  'cat1_1.1': {
    title: 'Teaching Load Compliance',
    code: '1.1',
    maxPts: 10,
    formula: '(Classes Taught ÷ Total Classes Assigned) × 100%',
    summary: 'Teaching load calculated from actual credit mix across ODD and EVEN semesters.',
    items: [
      { label: '100% Compliance', pts: '10 Pts', desc: 'All assigned credit hours taught fully' },
      { label: 'Partial Compliance', pts: 'Proportional', desc: 'Score calculated proportionally based on percentage taught' }
    ],
    notes: [
      'HoD timetable verification is mandatory.',
      'Classes taught include lectures, tutorials, lab sessions, and other assigned teaching activities.',
      'Proof link required: Signed Timetable & Attendance Register.'
    ]
  },
  'cat1_1.2': {
    title: 'Learning Materials & E-Content Developed',
    code: '1.2',
    maxPts: 10,
    summary: 'Imparting knowledge using prescribed materials or E-Content developed during AY 2025.',
    items: [
      { label: 'E-Content Development', pts: '2 Pts / content', desc: 'Must follow 4-Quadrant approach (Text, Video, Self-Assessment, Discussion)' },
      { label: 'Workbook Developed', pts: '2 Pts / workbook', desc: 'Student-facing practice workbooks for the course' },
      { label: 'Models / Prototypes Developed', pts: '2 Pts / model', desc: 'Physical or digital models for classroom demonstration' }
    ],
    notes: [
      'Must be developed during the current Assessment Year (2025).',
      'Proof link required: Drive link to developed e-content / workbook PDF / model photos.'
    ]
  },
  'cat1_1.3': {
    title: 'Innovative Pedagogical Approaches',
    code: '1.3',
    maxPts: 15,
    summary: 'Adoption of Active Learning Methods & Formative Assessments in teaching, aligned with intended CO/PO competencies.',
    items: [
      { label: 'Active Learning / Formative Activity', pts: '1 Pt / activity', desc: 'Max 15 activities (1 pt per activity)' }
    ],
    notes: [
      'Qualifying approaches: Flipped Classroom, Case-Based Learning, Problem-Based Learning, Collaborative Learning, Peer Instruction, Gamification, Think-Pair-Share, Formative Quizzes, Socratic Method.',
      'Can be In-Class or Outside-Class activities.',
      'Proof link required: Lesson plan, activity sheet, or student submission samples.'
    ]
  },
  'cat1_1.4': {
    title: 'Remedial Teaching & Slow Learners Support',
    code: '1.4',
    maxPts: 5,
    summary: 'Targeted support and academic intervention for slow learners identified in allotted courses.',
    items: [
      { label: 'Use of Specific Pedagogical Strategies', pts: '3 Pts', desc: 'Peer tutoring, scaffolding, blended remedial sessions' },
      { label: 'Remedial Learning Materials Developed', pts: '2 Pts', desc: 'Custom notes, question banks, practice sets for slow learners' }
    ],
    notes: [
      'Proof link required: Slow learners list, remedial timetable, materials shared, and end-sem pass outcome.'
    ]
  },
  'cat1_1.5': {
    title: 'End-Semester Examination Duties',
    code: '1.5',
    maxPts: 5,
    summary: 'Full compliance with all examination-related duties assigned by the Controller of Examinations.',
    items: [
      { label: '100% Exam Duties Compliance', pts: '5 Pts', desc: 'Full completion of all assigned exam duties' }
    ],
    notes: [
      'Duties covered: Question Paper Setting, QP Scrutiny, Invigilation Duty, Answer Script Evaluation, Squad Duty.',
      'Proof link required: Official duty allotment circulars and completion certificates.'
    ]
  },
  'cat1_1.6': {
    title: 'MOOC Course Development',
    code: '1.6',
    maxPts: 10,
    summary: 'Creation and delivery of online courses on recognized MOOC platforms (SWAYAM, Coursera, edX, NPTEL, etc.).',
    items: [
      { label: 'Full MOOC Course (≥ 30 hours)', pts: '10 Pts', desc: 'Complete course with modules, videos, and assessments' },
      { label: 'Microcredential Course (10–30 hours)', pts: '5 Pts', desc: 'Short modular course of minimum 10 hours' }
    ],
    notes: [
      'Platform name must be specified.',
      'Proof link required: Platform URL, course launch certificate, learner enrollment count.'
    ]
  },
  'cat1_1.7': {
    title: 'NPTEL Course Completion',
    code: '1.7',
    maxPts: 10,
    summary: 'Completion of NPTEL / SWAYAM courses during Jan–Apr 2025 or Jul–Oct 2025 windows.',
    items: [
      { label: 'Topper', pts: '8 Pts', desc: 'Top scorer in NPTEL course' },
      { label: 'Elite + Gold', pts: '6 Pts', desc: '≥ 85% score' },
      { label: 'Elite + Silver', pts: '5 Pts', desc: '75% – 84% score' },
      { label: 'Elite', pts: '4 Pts', desc: '60% – 74% score' },
      { label: 'Successfully Completed', pts: '3 Pts', desc: 'Pass certificate' }
    ],
    notes: [
      'Only courses completed during AY 2025 (Jan-Apr / Jul-Oct) are eligible.',
      'Proof link required: Official NPTEL certificate copy.'
    ]
  },
  'cat1_1.8': {
    title: 'Internationally Recognized Professional Certifications',
    code: '1.8',
    maxPts: 5,
    summary: 'International or industry certifications attended through the Institution or professional bodies.',
    items: [
      { label: 'Professional Certification', pts: '2.5 Pts / course', desc: 'Subject to max 5 pts (2 courses max)' }
    ],
    notes: [
      'Qualifying bodies: AWS, Google Cloud, Azure, Cisco, Oracle, Coursera (Industry), IEEE, NASSCOM, etc.',
      'Proof link required: Official certification diploma / badge.'
    ]
  },
  'cat1_1.9': {
    title: 'Average End-Semester Pass Percentage',
    code: '1.9',
    maxPts: 5,
    summary: 'Average pass percentage achieved across all subjects taught in ODD and EVEN semesters.',
    items: [
      { label: '100% Pass Result', pts: '5 Pts', desc: 'All students passed across all courses' },
      { label: '> 90% Pass Result', pts: '4 Pts', desc: '90.01% – 99.99% pass' },
      { label: '> 80% Pass Result', pts: '3 Pts', desc: '80.01% – 90.00% pass' },
      { label: '> 70% Pass Result', pts: '2 Pts', desc: '70.01% – 80.00% pass' }
    ],
    notes: [
      'Proof link required: Official university exam result sheet signed by HoD.'
    ]
  },
  'cat1_1.10': {
    title: 'CO–PO Attainment Calculation',
    code: '1.10',
    maxPts: 5,
    summary: 'CO–PO attainment calculation for all allotted subjects (including Lab courses).',
    items: [
      { label: '100% Compliance', pts: '5 Pts', desc: 'Attainment sheet submitted for all allotted courses' }
    ],
    notes: [
      'Level 3 (≥70%), Level 2 (50-70%), Level 1 (<50%). Action plan required if attainment is below target.',
      'Proof link required: Approved CO-PO attainment sheet with action plan.'
    ]
  },
  'cat1_1.11': {
    title: 'Industry Connect Facilitated',
    code: '1.11',
    maxPts: 10,
    summary: 'Facilitating industry engagement resulting in tangible academic and career outcomes.',
    items: [
      { label: 'Centre of Excellence (CoE) Established', pts: '10 Pts', desc: 'Formal CoE set up with industry' },
      { label: 'MoU Signed', pts: '5 Pts each', desc: 'Officially signed institutional MoU' },
      { label: 'Industry Use Case Obtained', pts: '5 Pts each', desc: 'Live project / use case from industry' },
      { label: 'Student Placement', pts: '3 Pts / industry', desc: 'Campus placements secured' },
      { label: 'Stipend Internship', pts: '2 Pts / student', desc: 'Paid student internships' },
      { label: 'Non-Stipend Internship', pts: '1 Pt / student', desc: 'Unpaid training internships' }
    ],
    notes: [
      'Max 10 pts cap for this criterion.',
      'Proof link required: MoU document, placement offer letters, or internship certificates.'
    ]
  },
  'cat1_1.12': {
    title: 'Guiding Students in Competitions / Startups',
    code: '1.12',
    maxPts: 10,
    summary: 'Mentoring student teams for design competitions, hackathons, and startup incubation.',
    items: [
      { label: '1.12A — International Prize', pts: '10 Pts / batch', desc: 'Prize won at international contest' },
      { label: '1.12A — National Prize', pts: '5 Pts / batch', desc: 'Prize won at national level' },
      { label: '1.12A — State Prize', pts: '3 Pts / batch', desc: 'Prize won at state level' },
      { label: '1.12A — Institutional Prize', pts: '2 Pts / batch', desc: 'Prize won at institutional contest' },
      { label: '1.12A — Participation', pts: '1 Pt / batch', desc: 'State/National level participation' },
      { label: '1.12B — Startup Commercialized', pts: '5 Pts / startup', desc: 'Startup product commercialized' },
      { label: '1.12B — Startup Funded', pts: '3 Pts / startup', desc: 'External funding received' },
      { label: '1.12B — Startup Registered', pts: '2 Pts / startup', desc: 'Formally registered startup' },
      { label: '1.12B — Idea Submitted', pts: '1 Pt / startup', desc: 'Incubation proposal submitted' }
    ],
    notes: [
      'Max 10 pts combined cap.',
      'Proof link required: Certificates of award, hackathon rank list, or startup registration.'
    ]
  },
  'cat1_1.13': {
    title: 'Contribution to Department / Institution',
    code: '1.13',
    maxPts: 10,
    summary: 'Administrative and coordination duties performed for Department or Institution.',
    items: [
      { label: 'Institutional Role (Coordinator / In-charge)', pts: '5 Pts / role', desc: 'Exam cell, IIC Lead, Placement Cell, Research Cell, etc.' },
      { label: 'Departmental Role (Coordinator / In-charge)', pts: '2 Pts / role', desc: 'Lab in-charge, NBA/NAAC coordinator, Timetable lead, etc.' }
    ],
    notes: [
      'Max 10 pts cap.',
      'Proof link required: Official office order / circular signed by HoD or Principal.'
    ]
  },

  // ── CATEGORY 2 ──
  'cat2_2.1': {
    title: 'Community Service & Mentoring Activities',
    code: '2.1',
    maxPts: 5,
    summary: 'Social service, outreach, and student mentoring through NSS / NCC / Rotary / Jaycees / NGOs.',
    items: [
      { label: 'Community Service Activity', pts: '1 Pt / activity', desc: '1 point per organized social or mentoring activity (Max 5 pts)' }
    ],
    notes: ['Proof link required: Event photos, certificates, or activity report.']
  },
  'cat2_2.2': {
    title: 'Roles in Profession-Related Committees',
    code: '2.2',
    maxPts: 5,
    summary: 'Holding responsible officer/committee positions in professional societies (IEEE, CSI, ACM, ISTE, etc.).',
    items: [
      { label: 'International Level Committee', pts: '5 Pts each', desc: 'Office bearer / executive committee member' },
      { label: 'National Level Committee', pts: '3 Pts each', desc: 'National executive committee role' },
      { label: 'State Level Committee', pts: '2 Pts each', desc: 'State chapter committee role' }
    ],
    notes: ['Proof link required: Official appointment letter from professional society.']
  },
  'cat2_2.3': {
    title: 'Workshops, Seminars & Webinars Attended',
    code: '2.3',
    maxPts: 5,
    summary: 'Attending domain-specific academic workshops, technical seminars, and webinars.',
    items: [
      { label: 'Workshop / Seminar / Webinar', pts: '1 Pt / activity', desc: '1 point per activity attended (Max 5 pts)' }
    ],
    notes: ['Proof link required: Participation certificates.']
  },
  'cat2_2.4': {
    title: 'Participation in FDP / Short-Term Training Programmes',
    code: '2.4',
    maxPts: 5,
    summary: 'Attending Faculty Development Programmes (FDP) or STTP of minimum 1-week duration.',
    items: [
      { label: 'FDP / STTP (Min 1-Week)', pts: '2.5 Pts / program', desc: '2.5 points per 1-week program (Max 5 pts = 2 FDPs)' }
    ],
    notes: ['Minimum duration must be 5 working days (1 week). Proof link required: FDP completion certificate.']
  },
  'cat2_2.5': {
    title: 'Membership of Professional Bodies',
    code: '2.5',
    maxPts: 5,
    summary: 'Active life or annual membership in recognized professional bodies (IEEE, ACM, ISTE, CSI, IETE, etc.).',
    items: [
      { label: 'Professional Body Membership', pts: '2.5 Pts / membership', desc: '2.5 points per active membership (Max 5 pts = 2 memberships)' }
    ],
    notes: ['Proof link required: Membership card or receipt copy.']
  },
  'cat2_2.6': {
    title: 'International Events Organized',
    code: '2.6',
    maxPts: 5,
    summary: 'Organizing International Conferences, Symposia, Hackathons, or Seminars as Coordinator or Member.',
    items: [
      { label: 'Coordinator', pts: '5 Pts', desc: 'Lead organizer / Convener' },
      { label: 'Co-coordinator', pts: '3 Pts each', desc: 'Co-convener / Co-coordinator' },
      { label: 'Committee Member', pts: '1 Pt each', desc: 'Organizing committee member' }
    ],
    notes: ['Proof link required: Event brochure & sanction order.']
  },
  'cat2_2.7': {
    title: 'National Level Events Organized',
    code: '2.7',
    maxPts: 3,
    summary: 'Organizing National Level Conferences, FDPs, Workshops, or Hackathons.',
    items: [
      { label: 'Coordinator', pts: '3 Pts', desc: 'Convener / Lead Coordinator' },
      { label: 'Co-coordinator', pts: '2 Pts each', desc: 'Co-convener' },
      { label: 'Committee Member', pts: '1 Pt each', desc: 'Committee member' }
    ],
    notes: ['Proof link required: Event flyer & official duty allocation order.']
  },
  'cat2_2.8': {
    title: 'State / University / College Level Events Organized',
    code: '2.8',
    maxPts: 2,
    summary: 'Organizing State, University, or College level technical events, workshops, or contests.',
    items: [
      { label: 'Coordinator', pts: '1 Pt each', desc: 'Coordinator / Convener' },
      { label: 'Committee Member', pts: '0.5 Pt each', desc: 'Organizing member' }
    ],
    notes: ['Proof link required: Event report & circular.']
  },
  'cat2_2.9': {
    title: 'Delivered Lectures / Chaired Sessions / Jury Member',
    code: '2.9',
    maxPts: 5,
    summary: 'Resource person for keynote talks, session chairing, or jury evaluation at conferences and hackathons.',
    items: [
      { label: 'International Level', pts: '5 Pts each', desc: 'Keynote / Session Chair abroad or intl event' },
      { label: 'National Level', pts: '3 Pts each', desc: 'Invited talk / Session Chair at national conference' },
      { label: 'State / College Level', pts: '2 Pts each', desc: 'Guest lecture / Jury member' }
    ],
    notes: ['Proof link required: Invitation letter & appreciation certificate.']
  },
  'cat2_2.10': {
    title: 'Brand-Building & Outreach Programs Organized',
    code: '2.10',
    maxPts: 5,
    summary: 'Organizing institutional brand promotion, school outreach, or publicity events.',
    items: [
      { label: 'Coordinator', pts: '3 Pts each', desc: 'Lead coordinator' },
      { label: 'Committee Member', pts: '1 Pt each', desc: 'Organizing member' }
    ],
    notes: ['Proof link required: Outreach event report & photos.']
  },
  'cat2_2.11': {
    title: 'Paper Presented in International / National Conferences',
    code: '2.11',
    maxPts: 5,
    summary: 'Oral or poster presentation of research papers at registered academic conferences.',
    items: [
      { label: 'International Conference Paper', pts: '3 Pts each', desc: 'Presented at international conference' },
      { label: 'National Conference Paper', pts: '2 Pts each', desc: 'Presented at national conference' }
    ],
    notes: ['Proof link required: Paper presentation certificate & proceedings page.']
  },

  // ── CATEGORY 3 ──
  'cat3_3.1': {
    title: 'Journal Publications',
    code: '3.1',
    maxPts: 50,
    summary: 'Research articles published in SCI/Scopus indexed journals during AY 2025. Publications are non-shareable within the institution.',
    items: [
      { label: 'SCI Q1 Journal (JCR)', pts: '15 Pts / paper', desc: 'Clarivate Analytics JCR Q1' },
      { label: 'SCI Q2 Journal (JCR)', pts: '10 Pts / paper', desc: 'Clarivate Analytics JCR Q2' },
      { label: 'SCI Q3 / Q4 Journal (JCR)', pts: '7.5 Pts / paper', desc: 'Clarivate Analytics JCR Q3 or Q4' },
      { label: 'Scopus-Indexed Journal', pts: '5 Pts / paper', desc: 'Scopus indexed without SCI' }
    ],
    notes: [
      'First Author / Corresponding Author → Full Marks.',
      'If PhD Scholar is First Author → Supervisor (2nd Author) gets Full Marks (if only 2 authors).',
      'Other positions: Marks = Base Marks ÷ Total Number of Authors.',
      'Must carry institutional affiliation to SRM Group of Institutions.',
      'Proof link required: DOI / Scopus link & Published PDF.'
    ]
  },
  'cat3_3.2': {
    title: 'Citations in Scopus Database (Current Period)',
    code: '3.2',
    maxPts: 25,
    summary: 'Total Scopus citations received during AY 2025 (excluding self-citations). Must carry institutional affiliation.',
    items: [
      { label: '> 300 Citations', pts: '25 Pts', desc: 'Excluding self-citations' },
      { label: '200 – 300 Citations', pts: '15 Pts', desc: 'Excluding self-citations' },
      { label: '100 – 200 Citations', pts: '10 Pts', desc: 'Excluding self-citations' },
      { label: '50 – 100 Citations', pts: '5 Pts', desc: 'Excluding self-citations' },
      { label: '< 50 Citations', pts: '2 Pts', desc: 'Minimum citation milestone' }
    ],
    notes: ['Proof link required: Scopus author citation profile link.']
  },
  'cat3_3.3': {
    title: 'Citations Received from Top 25% Journals',
    code: '3.3',
    maxPts: 25,
    summary: 'Citations received from top 25% quartile (Q1) journals during AY 2025.',
    items: [
      { label: '> 200 Citations from Q1', pts: '25 Pts', desc: 'Top 25% journal citations' },
      { label: '101 – 200 Citations', pts: '20 Pts', desc: 'Top 25% journal citations' },
      { label: '51 – 100 Citations', pts: '15 Pts', desc: 'Top 25% journal citations' },
      { label: '26 – 50 Citations', pts: '10 Pts', desc: 'Top 25% journal citations' },
      { label: '10 – 25 Citations', pts: '5 Pts', desc: 'Top 25% journal citations' }
    ],
    notes: ['Proof link required: Scopus Q1 citation summary report.']
  },
  'cat3_3.4': {
    title: 'Consultancy Received',
    code: '3.4',
    maxPts: 10,
    summary: 'Industrial consultancy revenue generated and deposited into official university account.',
    items: [
      { label: 'Above ₹ 2.00 Lakhs', pts: '10 Pts', desc: 'Consultancy amount > ₹2,00,000' },
      { label: '₹ 1.00 Lakh – ₹ 2.00 Lakhs', pts: '8 Pts', desc: 'Consultancy amount ₹1L – ₹2L' },
      { label: '₹ 25,001 – ₹ 1.00 Lakh', pts: '5 Pts', desc: 'Consultancy amount ₹25K – ₹1L' },
      { label: '₹ 10,000 – ₹ 25,000', pts: '3 Pts', desc: 'Consultancy amount ₹10K – ₹25K' }
    ],
    notes: ['Proof link required: Sanction letter & University receipt bank advice.']
  },
  'cat3_3.5': {
    title: 'Patents Granted / Published',
    code: '3.5',
    maxPts: 20,
    summary: 'Patents filed with institutional applicant name during AY 2025. Non-shareable within institution.',
    items: [
      { label: 'Patent Granted', pts: '10 Pts / patent', desc: 'Official patent grant certificate' },
      { label: 'Patent Published', pts: '5 Pts / patent', desc: 'Published in Indian Patent Journal' }
    ],
    notes: ['Proof link required: Official IPO / WIPO patent publication gazette copy.']
  },
  'cat3_3.6': {
    title: 'Ph.D. Research Guidance',
    code: '3.6',
    maxPts: 15,
    summary: 'Guiding doctoral scholars registered or graduated during AY 2025.',
    items: [
      { label: 'Ph.D. Scholar Graduated (Full-Time)', pts: '7.5 Pts / scholar', desc: 'Degree awarded in CY' },
      { label: 'Ph.D. Scholar Graduated (Part-Time)', pts: '5 Pts / scholar', desc: 'Degree awarded in CY' },
      { label: 'Ph.D. Scholar Registered (Current Year)', pts: '3 Pts / scholar', desc: 'Newly registered in CY' }
    ],
    notes: ['Proof link required: University guide allocation letter & viva notification.']
  },
  'cat3_3.7': {
    title: 'Research Awards / Top 2% Scientists List',
    code: '3.7',
    maxPts: 5,
    summary: 'Recognized research awards or inclusion in Stanford Top 2% Scientists list.',
    items: [
      { label: 'Renowned Award / Top 2% Scientist', pts: '5 Pts each', desc: 'National/International research recognition' }
    ],
    notes: ['Proof link required: Official award citation / Stanford-Elsevier list database link.']
  },
  'cat3_3.8': {
    title: 'Funded Projects Sanctioned / Proposals',
    code: '3.8',
    maxPts: 15,
    summary: 'External sponsored research grants sanctioned by government agencies (DST, SERB, ICMR, ISRO, AICTE, etc.).',
    items: [
      { label: 'Above ₹ 20 Lakhs Sanctioned', pts: '15 Pts', desc: 'Project grant > ₹20 Lakhs' },
      { label: '₹ 5.01 – 20 Lakhs Sanctioned', pts: '10 Pts', desc: 'Project grant ₹5L – ₹20L' },
      { label: '₹ 1.00 – 5 Lakhs Sanctioned', pts: '5 Pts', desc: 'Project grant ₹1L – ₹5L' },
      { label: '< ₹ 1.00 Lakh Sanctioned', pts: '2 Pts', desc: 'Seed grant < ₹1L' },
      { label: 'Proposal Submitted', pts: '1 Pt / proposal', desc: 'Submitted proposal (Max 3 pts)' }
    ],
    notes: [
      'Credit distribution: PI = 100%, Co-PI = 75%.',
      'Proof link required: Sanction order copy from funding agency.'
    ]
  },
  'cat3_3.9': {
    title: 'Industry Use Case Implementation under MoU/NDA',
    code: '3.9',
    maxPts: 25,
    summary: 'Technical deliverables (prototype, AI model, digital twin, process optimization) implemented under official MoU/NDA.',
    items: [
      { label: 'Implemented Industry Use Case', pts: '20 Pts / usecase', desc: 'Delivered prototype / solution under signed MoU' }
    ],
    notes: [
      'Credit distribution: PI = 100%, Co-PI = 75%, Team Member = 50%.',
      'SRMIST must be listed as academic partner in MoU.',
      'Proof link required: Completion certificate & technical report signed by industry partner.'
    ]
  }
};

/* ─── SCORING GUIDE MODAL COMPONENT ─────────────────────────── */
interface ScoringGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  guideKey: string | null;
}

function ScoringGuideModal({ isOpen, onClose, guideKey }: ScoringGuideModalProps) {
  if (!isOpen || !guideKey) return null;
  const guide = SCORING_GUIDES[guideKey];
  if (!guide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="bg-blue-600 text-white text-xs font-mono font-bold px-2 py-0.5 rounded">
              {guide.code}
            </span>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">{guide.title}</h3>
              <p className="text-[13px] text-slate-300">Official API 2025 Appraisal Scoring Rule</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold bg-blue-500/30 text-blue-200 border border-blue-400/40 px-2.5 py-0.5 rounded-full">
              Max {guide.maxPts} Pts
            </span>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4 text-xs text-slate-700">
          <p className="text-xs font-medium text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
            {guide.summary}
          </p>

          {guide.formula && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-bold text-blue-900 mb-1">📐 Scoring Formula:</p>
              <p className="font-mono text-xs text-blue-800 font-semibold">{guide.formula}</p>
            </div>
          )}

          {guide.items && guide.items.length > 0 && (
            <div>
              <h4 className="font-bold text-slate-800 uppercase text-xs tracking-wider mb-2">Points Allocation Matrix</h4>
              <div className="grid grid-cols-1 gap-1.5">
                {guide.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{item.label}</p>
                      {item.desc && <p className="text-[13px] text-slate-500 mt-0.5">{item.desc}</p>}
                    </div>
                    <span className="shrink-0 bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded text-xs">
                      {item.pts}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {guide.notes && guide.notes.length > 0 && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-3 space-y-1">
              <p className="font-bold text-amber-900 text-xs">⚠️ Verification &amp; Proof Notes:</p>
              <ul className="list-disc ml-4 space-y-1 text-[13px] text-amber-800">
                {guide.notes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Revision History Info Modal ──────────────────────────── */
interface RevisionHistoryModalProps {
  flagItem: RevisionFlagItem;
  criterionTitle: string;
  currentSelfScore: number;
  currentProofUrl: string;
  onClose: () => void;
}

function RevisionHistoryModal({
  flagItem,
  criterionTitle,
  currentSelfScore,
  currentProofUrl,
  onClose,
}: RevisionHistoryModalProps) {
  const origScore = flagItem.originalSelfScore !== undefined ? flagItem.originalSelfScore : 'Initial / 0';
  const origProof = flagItem.originalProofUrl || 'Initial / None';
  const isChanged = (flagItem.originalSelfScore !== undefined && flagItem.originalSelfScore !== currentSelfScore) ||
                    (flagItem.originalProofUrl !== undefined && flagItem.originalProofUrl !== currentProofUrl);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-800 to-rose-900 px-5 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-white/10 text-amber-300">
              <Info className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold leading-tight">ⓘ Flag &amp; Revision History</h3>
              <p className="text-[13px] text-red-200 mt-0.5">Reviewer feedback &amp; score comparison</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">Target Criterion</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{criterionTitle}</p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 space-y-1">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wide flex items-center gap-1">
              ⚠️ Reviewer Flag Reason ({flagItem.flaggedBy || 'HOD/HOI'})
            </span>
            <p className="text-xs text-red-900 italic font-medium leading-relaxed">
              &ldquo;{flagItem.reason || 'Please update details and re-submit.'}&rdquo;
            </p>
          </div>

          {/* Comparison Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-xs">Score &amp; Proof Comparison</span>
              {isChanged ? (
                <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-300">
                  ✓ Updated by Faculty
                </span>
              ) : (
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full border border-amber-300">
                  Pending Faculty Edit
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Previous / Older */}
              <div className="space-y-1.5 border-r border-slate-200 pr-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">Previous (Older)</span>
                <div>
                  <span className="text-xs text-slate-500 block">Self Score</span>
                  <span className="font-mono font-bold text-slate-600 text-xs">{origScore} Pts</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Proof Link</span>
                  <span className="font-mono text-xs text-slate-500 truncate block max-w-[140px]" title={String(origProof)}>{String(origProof)}</span>
                </div>
              </div>

              {/* Current / Updated */}
              <div className="space-y-1.5 pl-1">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wide block">Current (Updated)</span>
                <div>
                  <span className="text-xs text-slate-500 block">Self Score</span>
                  <span className="font-mono font-bold text-blue-700 text-xs">{currentSelfScore} Pts</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Proof Link</span>
                  <span className="font-mono text-xs text-blue-600 truncate block max-w-[140px]" title={currentProofUrl}>{currentProofUrl || '—'}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[13px] text-slate-400 text-center italic">
            This field will remain highlighted in red until verified and approved by HOD/HOI.
          </p>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}

interface CriteriaRowProps {
  id?: string;
  number: string;
  title: string;
  description: string;
  maxScore: number;
  selfScore: number;
  onSelfScoreChange: (v: number) => void;
  proofUrl: string;
  onProofUrlChange: (v: string) => void;
  disabled: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  flagItem?: RevisionFlagItem;
  scoringGuideKey?: string;
  onOpenGuide?: (key: string) => void;
}

function CriteriaRow({
  id, number, title, description, maxScore, selfScore, onSelfScoreChange, proofUrl, onProofUrlChange, disabled, isFlagged, flagReason, flagItem, scoringGuideKey, onOpenGuide
}: CriteriaRowProps) {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const elementId = id || (scoringGuideKey ? `crit-${scoringGuideKey}` : undefined);
  return (
    <div id={elementId} className={`grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 p-3 sm:py-3.5 border rounded-lg transition-all duration-300 items-start ${isFlagged ? 'bg-red-50/70 border-2 border-red-400 shadow-md my-2 ring-2 ring-red-400/30' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
      <div className="sm:col-span-6 lg:col-span-7">
        <div className="flex gap-2">
          <span className={`text-xs font-bold shrink-0 w-6 sm:w-7 ${isFlagged ? 'text-red-600' : 'text-slate-400'} mt-0.5`}>{number}</span>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-semibold text-slate-800 leading-snug">{title}</p>
              {scoringGuideKey && onOpenGuide && (
                <button
                  type="button"
                  onClick={() => onOpenGuide(scoringGuideKey)}
                  title="View detailed scoring rules & excel instructions"
                  className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors shrink-0"
                >
                  <Info className="w-3 h-3 text-blue-600" />
                  <span>Scoring Rules</span>
                </button>
              )}
              {isFlagged && (
                <div className="inline-flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                    ⚠️ Revision Flagged
                  </span>
                  {flagItem && (
                    <button
                      type="button"
                      onClick={() => setShowHistoryModal(true)}
                      className="inline-flex items-center gap-1 text-[13px] font-bold text-red-700 hover:text-red-900 bg-white hover:bg-red-50 border border-red-300 px-2.5 py-0.5 rounded-full transition-colors shadow-2xs cursor-pointer"
                      title="Click to view previous vs updated score & proof history"
                    >
                      <Info className="w-3 h-3 text-red-600" />
                      <span>(i) View Change History</span>
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>
            {isFlagged && flagReason && (
              <p className="text-xs text-red-700 font-semibold bg-white/90 border border-red-200 rounded px-2.5 py-1 mt-2 shadow-xs flex items-center justify-between gap-2">
                <span>Note from HOD/HOI: {flagReason}</span>
                {flagItem && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="text-xs text-red-600 underline font-bold hover:text-red-800 shrink-0"
                  >
                    View Details →
                  </button>
                )}
              </p>
            )}
          </div>
        </div>
      </div>
      <div className="flex sm:flex-col items-center justify-between sm:justify-center gap-2 sm:col-span-3 lg:col-span-2 bg-slate-50 sm:bg-transparent p-2 sm:p-0 rounded-md">
        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Self Score</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={selfScore === 0 ? '' : selfScore}
            min={0}
            max={maxScore}
            onChange={(e) => !disabled && onSelfScoreChange(Math.min(maxScore, Number(e.target.value)))}
            disabled={disabled}
            placeholder="0"
            className={`w-16 text-center text-sm font-bold border rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors ${isFlagged ? 'border-red-400 text-red-700 focus:ring-red-500 bg-red-50/50' : 'border-slate-200'}`}
          />
          <span className="text-xs text-slate-400 shrink-0">/ {maxScore}</span>
        </div>
      </div>
      <div className="sm:col-span-3 lg:col-span-3">
        <label className="text-xs text-slate-400 font-semibold uppercase tracking-wide block mb-1">Proof URL (Drive Link)</label>
        <input
          type="text"
          value={proofUrl}
          onChange={(e) => !disabled && onProofUrlChange(e.target.value)}
          disabled={disabled}
          placeholder="https://drive.google.com/..."
          className="w-full text-xs text-blue-600 border border-slate-200 rounded-md px-2.5 py-1 bg-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-slate-50 transition-colors"
        />
      </div>

      {/* Revision History Info Modal */}
      {showHistoryModal && flagItem && (
        <RevisionHistoryModal
          flagItem={flagItem}
          criterionTitle={`${number} ${title}`}
          currentSelfScore={selfScore}
          currentProofUrl={proofUrl}
          onClose={() => setShowHistoryModal(false)}
        />
      )}
    </div>
  );
}

interface DynamicTableProps {
  id?: string;
  title: string;
  subtitle?: string;
  addLabel: string;
  onAdd: () => void;
  headers: string[];
  rows: React.ReactNode[];
  emptyText: string;
  isReadOnly?: boolean;
  isFlagged?: boolean;
  flagReason?: string;
  scoringGuideKey?: string;
  onOpenGuide?: (key: string) => void;
}

function DynamicTable({ id, title, subtitle, addLabel, onAdd, headers, rows, emptyText, isReadOnly, isFlagged, flagReason, scoringGuideKey, onOpenGuide }: DynamicTableProps) {
  const elementId = id || (scoringGuideKey ? `table-${scoringGuideKey}` : undefined);
  return (
    <div id={elementId} className={`mb-6 p-3 rounded-xl transition-all duration-300 ${isFlagged ? 'bg-red-50/50 border-2 border-red-400 shadow-md ring-2 ring-red-400/20' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-slate-800">{title}</p>
            {scoringGuideKey && onOpenGuide && (
              <button
                type="button"
                onClick={() => onOpenGuide(scoringGuideKey)}
                title="View scoring rules"
                className="inline-flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-full transition-colors"
              >
                <Info className="w-3 h-3 text-blue-600" />
                <span>Scoring Rules</span>
              </button>
            )}
            {isFlagged && (
              <span className="text-xs font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse shadow-xs">
                ⚠️ Revision Flagged
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-snug">{subtitle}</p>}
          {isFlagged && flagReason && (
            <p className="text-xs text-red-700 font-semibold bg-white/90 border border-red-200 rounded px-2.5 py-1 mt-1.5 shadow-xs">
              Note from HOD/HOI: {flagReason}
            </p>
          )}
        </div>
        {!isReadOnly && (
          <button
            onClick={onAdd}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 border border-slate-200 rounded-md text-slate-700 bg-white hover:bg-slate-50 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            {addLabel}
          </button>
        )}
      </div>
      <div className="border border-slate-200 rounded-lg overflow-x-auto -mx-1 sm:mx-0">
        <table className="w-full text-left form-table min-w-[550px]">
          <thead>
            <tr>
              {headers.map((h) => <th key={h}>{h}</th>)}
              {!isReadOnly && <th className="w-8"></th>}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length + 1} className="text-center text-slate-400 py-6 text-xs">
                  {emptyText}
                </td>
              </tr>
            ) : rows}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Anchor Jump Nav Bar ──────────────────────────────────── */
const SECTIONS = [
  { id: 'sec-general', label: '1. General Details & Profile' },
  { id: 'sec-cat1', label: '2. Category I: Teaching' },
  { id: 'sec-cat2', label: '3. Category II: Co-Curricular' },
  { id: 'sec-cat3', label: '4. Category III: Research' },
  { id: 'sec-duties', label: '5. Duties' },
  { id: 'sec-undertaking', label: '6. Undertaking' },
];

const JumpNav: React.FC<{ isModal?: boolean }> = ({ isModal }) => (
  <div className={`${isModal ? 'sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 py-1.5 shadow-2xs' : 'sticky top-14 z-40 bg-white border-b border-slate-200 shadow-sm py-1'}`}>
    <div className="max-w-screen-xl mx-auto px-3 sm:px-6 flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {SECTIONS.map((sec, i) => (
        <React.Fragment key={sec.id}>
          <a
            href={`#${sec.id}`}
            className="flex items-center text-xs py-1.5 px-2.5 sm:py-2 sm:px-3 font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100/80 rounded-lg transition-colors whitespace-nowrap"
          >
            {sec.label}
          </a>
          {i < SECTIONS.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
        </React.Fragment>
      ))}
    </div>
  </div>
);

/* ─── Main TeacherView Component ────────────────────────────── */
interface TeacherViewProps {
  appraisal: AppraisalRecord;
  onUpdateAppraisal?: (updated: AppraisalRecord) => void;
  isWindowOpen?: boolean;
  readOnly?: boolean;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  appraisal,
  onUpdateAppraisal,
  isWindowOpen = true,
  readOnly = false,
}) => {
  const normalizeAppraisal = (app: AppraisalRecord): AppraisalRecord => {
    if (!app) return {} as any;
    return {
      ...app,
      facultyName: app.facultyName || '',
      empId: app.empId || '',
      department: app.department || '',
      designation: app.designation || '',
      status: app.status || 'DRAFT',
      generalDetails: {
        ...(app.generalDetails || {}),
        teachingExperience: app.generalDetails?.teachingExperience || [],
        industryExperience: app.generalDetails?.industryExperience || [],
        academicCourseResults: app.generalDetails?.academicCourseResults || [],
        leaveDetails: app.generalDetails?.leaveDetails ? {
          ...app.generalDetails.leaveDetails,
        } : {
          calendarYear: '',
          workingDays: 0,
          cl: 0,
          el: 0,
          ml: 0,
          lop: 0,
          vl: 0,
          totalLeaveAvailed: 0,
          onDutyAvailed: 0,
          effectiveAttendance: 0,
          attendancePercentage: 0,
        } as any,
        mentoring: app.generalDetails?.mentoring ? {
          ...app.generalDetails.mentoring,
        } : {
          studentsAllotted: 0,
          slowLearnersIdentified: 0,
          top10Performers: 0,
          nilArrears: 0,
          moreThan2Arrears: 0,
          coachingClassAllotted: 0,
          coachingAvgAttendancePct: 0,
          eligiblePlacement: 0,
          participatedCompetitions: 0,
          wonPrizeCompetitions: 0,
          placedAsOnDate: 0,
          higherStudiesOrEntrepreneur: 0,
          counselingSessionsNos: 0,
          parentCommunicationCount: 0,
          outcomeOfMentoring: '',
          actionPlanAcademicImprovement: '',
          actionPlanPlacementImprovement: '',
        } as any,
        phdProfile: app.generalDetails?.phdProfile ? {
          ...app.generalDetails.phdProfile,
        } : {
          status: 'Not Registered',
          universityOrInstitution: '',
          probableCompletionYear: '',
          guideshipRecognized: false,
          universityRecognizedBy: '',
          specializationArea: '',
          ongoingScholarsPT: 0,
          ongoingScholarsFT: 0,
          completedScholars: 0,
        } as any,
        industryCollab: app.generalDetails?.industryCollab ? {
          ...app.generalDetails.industryCollab,
        } : {
          industriesIdentified: 0,
          industriesContacted: 0,
          convertedToCollaboration: 0,
          studentsPlacedConnect: 0,
          internshipsWithStipend: 0,
          internshipsWithoutStipend: 0,
          liveProjectsInvolved: 0,
        } as any,
      } as any,
      duties: {
        ...(app.duties || {}),
      } as any,
      cat1: {
        ...(app.cat1 || {}),
        teachingLoadTable: app.cat1?.teachingLoadTable || [],
        learningMaterialsTable: app.cat1?.learningMaterialsTable || [],
        copoTable: app.cat1?.copoTable || [],
      } as any,
      cat2: {
        ...(app.cat2 || {}),
      } as any,
      cat3: {
        ...(app.cat3 || {}),
        journals: app.cat3?.journals || [],
        consultancy: app.cat3?.consultancy || [],
        patents: app.cat3?.patents || [],
        fundedProjects: app.cat3?.fundedProjects || [],
        industryUseCases: app.cat3?.industryUseCases || [],
      } as any,
      revisionFlags: app.revisionFlags || [],
    };
  };

  const [data, setData] = useState<AppraisalRecord>(() => normalizeAppraisal(appraisal));

  useEffect(() => {
    setData(normalizeAppraisal(appraisal));
  }, [appraisal]);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [guideKey, setGuideKey] = useState<string | null>(null);
  const [selectedGradeModal, setSelectedGradeModal] = useState<GradeType | null>(null);

  const handleOpenGuide = (key: string) => setGuideKey(key);

  const cat1Self = calculateCategory1(data.cat1).selfTotal;
  const cat2Self = calculateCategory2(data.cat2).selfTotal;
  const cat3Self = calculateCategory3(data.cat3).selfTotal;
  const totalSelfScore = Number((cat1Self + cat2Self + cat3Self).toFixed(1));

  const isAccessDisabled = data.appraisalAccessEnabled === false;
  const isReadOnly = readOnly || !isWindowOpen || data.status === 'LOCKED' || data.status === 'HOD_APPROVED' || isAccessDisabled;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const recalcAndSave = (record: AppraisalRecord, newStatus?: typeof data.status) => {
    const c1 = calculateCategory1(record.cat1).selfTotal;
    const c2 = calculateCategory2(record.cat2).selfTotal;
    const c3 = calculateCategory3(record.cat3).selfTotal;
    const updated: AppraisalRecord = {
      ...record,
      selfScoreTotal: Number((c1 + c2 + c3).toFixed(1)),
      status: newStatus ?? record.status,
      updatedAt: new Date().toISOString(),
    };
    setData(updated);
    if (onUpdateAppraisal) {
      onUpdateAppraisal(updated);
    }
    return updated;
  };

  const handleSaveDraft = () => {
    recalcAndSave(data, 'DRAFT');
    showToast('Draft saved successfully.', 'success');
  };

  const handleSubmit = () => {
    // Required field validation
    const missing: string[] = [];

    // General Details — required basics
    if (!data.facultyName.trim()) missing.push('Name of Faculty (General Info)');
    if (!data.empId.trim()) missing.push('Faculty ID / Employee ID (General Info)');
    if (!data.department.trim()) missing.push('Department (General Info)');
    if (!data.generalDetails.officialEmail.trim()) missing.push('Official E-mail ID (General Info)');
    if (!data.generalDetails.mobileNumber.trim()) missing.push('Mobile Number (General Info)');
    if (!data.generalDetails.dateOfJoining.trim()) missing.push('Date of Joining (General Info)');
    if (!data.generalDetails.qualifications.trim()) missing.push('Qualifications (General Info)');
    if (!data.generalDetails.reportingHodName.trim()) missing.push('Reporting HoD Name (General Info)');

    // Duties — required
    if (!data.duties.pastDeptContributions.trim()) missing.push('Contribution to Department (Duties)');
    if (!data.duties.pastInstContributions.trim()) missing.push('Contribution to Institution (Duties)');
    if (!data.duties.futureDeptRolesWished.trim()) missing.push('Departmental Roles Wished (Duties)');
    if (!data.duties.futureInstRolesWished.trim()) missing.push('Institutional Roles Wished (Duties)');

    if (missing.length > 0) {
      const firstMissing = missing[0];
      showToast(
        `Please fill in all required fields. Missing: ${firstMissing}${missing.length > 1 ? ` (and ${missing.length - 1} more)` : ''}.`,
        'error'
      );
      // Scroll to the relevant section
      if (firstMissing.includes('General Info')) {
        document.getElementById('sec-general')?.scrollIntoView({ behavior: 'smooth' });
      } else if (firstMissing.includes('Duties')) {
        document.getElementById('sec-duties')?.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    recalcAndSave(data, 'SUBMITTED');
    showToast('Appraisal submitted for HOD review.', 'success');
  };

  /* Helper to patch GeneralDetails with defensive deep merging */
  const patchGeneral = (patch: Partial<AppraisalRecord['generalDetails']>) =>
    setData((d) => {
      const gd = d.generalDetails || {} as any;
      return {
        ...d,
        generalDetails: {
          ...gd,
          ...patch,
          mentoring: patch.mentoring
            ? { ...(gd.mentoring || {}), ...patch.mentoring }
            : gd.mentoring,
          leaveDetails: patch.leaveDetails
            ? { ...(gd.leaveDetails || {}), ...patch.leaveDetails }
            : gd.leaveDetails,
          phdProfile: patch.phdProfile
            ? { ...(gd.phdProfile || {}), ...patch.phdProfile }
            : gd.phdProfile,
          industryCollab: patch.industryCollab
            ? { ...(gd.industryCollab || {}), ...patch.industryCollab }
            : gd.industryCollab,
        },
      };
    });

  /* Helper to patch Cat1 score fields */
  const updateCat1Score = (key: string, patch: object) =>
    setData((d) => ({
      ...d,
      cat1: { ...(d.cat1 || {}), [key]: { ...(((d.cat1 as any) || {})[key] || {}), ...patch } },
    }));

  /* Helper to patch Cat2 score fields */
  const updateCat2Score = (key: string, patch: object) =>
    setData((d) => ({
      ...d,
      cat2: { ...(d.cat2 || {}), [key]: { ...(((d.cat2 as any) || {})[key] || {}), ...patch } },
    }));

  /* ─── REVISION FLAGGING HELPERS ────────────────────────── */
  const FLAG_KEY_TO_ID_MAP: Record<string, string> = {
    // Category 1
    'cat1.teachingload': 'crit-cat1_1.1',
    'teachingload': 'crit-cat1_1.1',
    'cat1.econtent': 'crit-cat1_1.2',
    'econtent': 'crit-cat1_1.2',
    'learningmaterials': 'crit-cat1_1.2',
    'cat1.innovativepedagogy': 'crit-cat1_1.3',
    'innovativepedagogy': 'crit-cat1_1.3',
    'cat1.remedialteaching': 'crit-cat1_1.4',
    'remedialteaching': 'crit-cat1_1.4',
    'slowlearners': 'crit-cat1_1.4',
    'cat1.examduties': 'crit-cat1_1.5',
    'examduties': 'crit-cat1_1.5',
    'cat1.moocdevelopment': 'crit-cat1_1.6',
    'moocdevelopment': 'crit-cat1_1.6',
    'cat1.nptelcompletion': 'crit-cat1_1.7',
    'nptelcompletion': 'crit-cat1_1.7',
    'cat1.certifications': 'crit-cat1_1.8',
    'certifications': 'crit-cat1_1.8',
    'cat1.examresults': 'crit-cat1_1.9',
    'examresults': 'crit-cat1_1.9',
    'passpercentage': 'crit-cat1_1.9',
    'cat1.copoattainment': 'crit-cat1_1.10',
    'copoattainment': 'crit-cat1_1.10',
    'cat1.industryconnect': 'crit-cat1_1.11',
    'industryconnect': 'crit-cat1_1.11',
    'cat1.studentguiding': 'crit-cat1_1.12',
    'studentguiding': 'crit-cat1_1.12',
    'guidingstudents': 'crit-cat1_1.12',
    'cat1.deptcontribution': 'crit-cat1_1.13',
    'deptcontribution': 'crit-cat1_1.13',

    // Category 2
    'cat2.communityservice': 'crit-cat2_2.1',
    'communityservice': 'crit-cat2_2.1',
    'cat2.professioncommittees': 'crit-cat2_2.2',
    'professioncommittees': 'crit-cat2_2.2',
    'cat2.workshopswebinars': 'crit-cat2_2.3',
    'workshopswebinars': 'crit-cat2_2.3',
    'cat2.fdpattended': 'crit-cat2_2.4',
    'fdpattended': 'crit-cat2_2.4',
    'cat2.professionalmemberships': 'crit-cat2_2.5',
    'professionalmemberships': 'crit-cat2_2.5',
    'cat2.intleventsorganized': 'crit-cat2_2.6',
    'intleventsorganized': 'crit-cat2_2.6',
    'cat2.natleventsorganized': 'crit-cat2_2.7',
    'natleventsorganized': 'crit-cat2_2.7',
    'cat2.stateeventsorganized': 'crit-cat2_2.8',
    'stateeventsorganized': 'crit-cat2_2.8',
    'cat2.lectureschaired': 'crit-cat2_2.9',
    'lectureschaired': 'crit-cat2_2.9',
    'cat2.brandbuilding': 'crit-cat2_2.10',
    'brandbuilding': 'crit-cat2_2.10',
    'cat2.conferencepapers': 'crit-cat2_2.11',
    'conferencepapers': 'crit-cat2_2.11',

    // Category 3
    'cat3.journals': 'table-cat3_3.1',
    'journals': 'table-cat3_3.1',
    'journalpublications': 'table-cat3_3.1',
    'cat3.consultancy': 'table-cat3_3.4',
    'consultancy': 'table-cat3_3.4',
    'cat3.patents': 'table-cat3_3.5',
    'patents': 'table-cat3_3.5',
    'cat3.fundedprojects': 'table-cat3_3.8',
    'fundedprojects': 'table-cat3_3.8',
    'cat3.industryusecases': 'table-cat3_3.9',
    'industryusecases': 'table-cat3_3.9',

    // Sections
    'duties': 'sec-duties',
    'generalinfo': 'sec-general',
    'generaldetails': 'sec-general',
    'cat1': 'sec-cat1',
    'cat2': 'sec-cat2',
    'cat3': 'sec-cat3',
  };

  const getFlagInfo = (fieldKey: string) => {
    if (!data.revisionFlags || data.revisionFlags.length === 0) return { isFlagged: false, reason: undefined, flagItem: undefined };
    const norm = fieldKey.toLowerCase().trim();
    const flag = data.revisionFlags.find((f) => {
      const fk = f.key.toLowerCase().trim();
      return (
        fk === norm ||
        fk === `cat1.${norm}` ||
        fk === `cat2.${norm}` ||
        fk === `cat3.${norm}` ||
        fk.endsWith(`.${norm}`) ||
        norm.endsWith(`.${fk}`)
      );
    });
    if (flag) return { isFlagged: true, reason: flag.reason, flagItem: flag };
    return { isFlagged: false, reason: undefined, flagItem: undefined };
  };

  const scrollToFlaggedField = (flagKey: string) => {
    const normKey = flagKey.toLowerCase().trim();
    const cleanKey = normKey.replace(/^cat[123]\./, '');

    let targetId = FLAG_KEY_TO_ID_MAP[flagKey] || FLAG_KEY_TO_ID_MAP[normKey] || FLAG_KEY_TO_ID_MAP[cleanKey];

    let el = targetId ? document.getElementById(targetId) : null;

    if (!el) {
      el = document.getElementById(`crit-cat1_${cleanKey}`) ||
           document.getElementById(`crit-cat2_${cleanKey}`) ||
           document.getElementById(`table-cat3_${cleanKey}`) ||
           document.getElementById(`sec-${cleanKey}`) ||
           document.querySelector(`[id*="${cleanKey}"]`);
    }

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('flag-highlight-pulse');
      setTimeout(() => {
        el?.classList.remove('flag-highlight-pulse');
      }, 2600);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-16 right-5 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-md text-sm font-medium border ${
          toast.type === 'success' ? 'bg-white border-green-200 text-green-700' : 'bg-white border-red-200 text-red-700'
        }`}>
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{toast.msg}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Horizontal Jump Nav Bar — sticky header */}
      <div className="shrink-0">
        <JumpNav isModal={readOnly} />
      </div>

      {/* Scrollable Form Content */}
      <div className="flex-1 overflow-y-auto">


      {/* Revision Requested Banner (HIGH-PRIORITY RED CARD) */}
      {(data.revisionFlags && data.revisionFlags.length > 0 || data.revisionRemarks) && !isReadOnly && (
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 pt-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-red-900/95 via-red-800 to-rose-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-red-500/40 backdrop-blur-md transition-all duration-300">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1">
                {/* Header Title */}
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 ring-4 ring-white/10 text-red-200 shrink-0">
                    <AlertTriangle className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                    ⚠️ Action Required: Revision Requested by HOD / HOI Reviewer
                  </h3>
                </div>

                {/* Reviewer Note / Remarks */}
                {data.revisionRemarks && (
                  <div className="bg-black/30 backdrop-blur-xs border border-red-400/30 rounded-xl p-3.5 sm:p-4 text-xs sm:text-sm text-red-100 italic leading-relaxed shadow-inner">
                    &ldquo;{data.revisionRemarks}&rdquo;
                  </div>
                )}

                {/* Flagged Items Pills */}
                {data.revisionFlags && data.revisionFlags.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <p className="text-xs sm:text-sm font-semibold text-red-100 flex items-center gap-2">
                      <span>Flagged Items ({data.revisionFlags.length}):</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {data.revisionFlags.map((f) => {
                        const rawKey = f.key.replace(/^cat[123]\./, '');
                        return (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => scrollToFlaggedField(f.key)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-white text-red-700 hover:bg-red-50 hover:scale-105 active:scale-95 shadow-md border border-red-200 transition-all cursor-pointer group"
                            title={`Click to jump directly to ${rawKey}`}
                          >
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                            <span>{rawKey}</span>
                            <ArrowDown className="w-3 h-3 text-red-500 group-hover:translate-y-0.5 transition-transform" />
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-red-200/90 font-medium pt-1">
                      Please update the highlighted red sections below and re-submit.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HOD Access Restricted Banner */}
      {isAccessDisabled && (
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 pt-4">
          <div className="flex items-center gap-3 bg-gradient-to-r from-red-900 to-rose-900 border border-red-700 text-white rounded-xl p-4 shadow-lg">
            <Lock className="w-5 h-5 shrink-0 text-red-300 animate-pulse" />
            <div className="flex-1">
              <span className="font-bold text-sm block">🔒 Appraisal Form Access Disabled by Department HOD</span>
              <span className="text-xs text-red-200 block mt-0.5">
                Form editing and submission access for your profile has been restricted by your HOD. Please contact your Department Head to enable submission access.
              </span>
            </div>
            <StatusBadge status={data.status} />
          </div>
        </div>
      )}

      {/* Read-Only Warning Banner */}
      {isReadOnly && !isAccessDisabled && (
        <div className="max-w-screen-xl mx-auto px-3 sm:px-6 pt-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm">
            <Lock className="w-4 h-4 shrink-0" />
            <div className="flex-1">
              <span className="font-semibold">Read-Only Archive Mode. </span>
              <span className="text-red-600 font-normal">
                {!isWindowOpen ? `Submission window for ${data.monthYear} is closed.` : `Appraisal status is ${data.status}.`}
              </span>
            </div>
            <StatusBadge status={data.status} />
          </div>
        </div>
      )}

      {/* ── Main Vertical Scrolling Form ── */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-6 pb-28">

        {/* ════════════════════════════════════════════════════════════
            SECTION 1: GENERAL DETAILS & PROFILE (API 2025 Sheet)
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-general"
          icon={<User className="w-4 h-4" />}
          title="1. General Details & Profile"
          subtitle="Annual Performance Report — Faculty Self-Performance Form (API 2025)"
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8 space-y-6">

          {/* Institutional & Personal Information */}
          <div>
            <SubHeader title="1.1 Basic & Institutional Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="1. Name of Institution" required hint="e.g. SRMIST, Faculty of Science & Humanities / Engineering">
                <TextInput value={data.generalDetails.institutionName} onChange={(v) => patchGeneral({ institutionName: v })} disabled={isReadOnly} placeholder="SRMIST, Faculty of Science and Humanities" />
              </Field>
              <Field label="2. Name of Faculty" required hint="Full official name as per University appointment letter">
                <TextInput value={data.facultyName} onChange={(v) => setData((d) => ({ ...d, facultyName: v }))} disabled={isReadOnly} placeholder="Full Name" />
              </Field>
              <Field label="Faculty ID / Employee ID" required hint="Unique SRM employee code (e.g. T741)">
                <TextInput value={data.empId} onChange={(v) => setData((d) => ({ ...d, empId: v }))} disabled={isReadOnly} placeholder="e.g. T741" />
              </Field>
              <Field label="3. Qualifications" required hint="Degrees & certifications (e.g. M.Sc., M.Phil., Ph.D, NET/SET)">
                <TextInput value={data.generalDetails.qualifications} onChange={(v) => patchGeneral({ qualifications: v })} disabled={isReadOnly} placeholder="e.g. M.Sc., M.Phil., (Ph.D)" />
              </Field>
              <Field label="4. Department" required hint="Academic department (e.g. Computer Science)">
                <TextInput value={data.department} onChange={(v) => setData((d) => ({ ...d, department: v }))} disabled={isReadOnly} placeholder="Computer Science" />
              </Field>
              <Field label="5. Date of Joining" required hint="Date of initial appointment at SRMIST (DD/MM/YYYY)">
                <DateInput value={data.generalDetails.dateOfJoining} onChange={(v) => patchGeneral({ dateOfJoining: v })} disabled={isReadOnly} placeholder="DD/MM/YYYY" />
              </Field>
              <Field label="6. Designation at Joining" hint="Designation assigned at initial joining date">
                <TextInput value={data.generalDetails.designationAtJoining} onChange={(v) => patchGeneral({ designationAtJoining: v })} disabled={isReadOnly} placeholder="Assistant Professor" />
              </Field>
              <Field label="7. Present Designation" hint="Current official academic rank">
                <select value={data.designation} onChange={(e) => setData((d) => ({ ...d, designation: e.target.value as any }))} disabled={isReadOnly} className="w-full text-sm text-slate-800 border border-slate-200 rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400">
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                </select>
              </Field>
              <Field label="8. Mobile Number" required hint="Active 10-digit primary phone number">
                <TextInput value={data.generalDetails.mobileNumber} onChange={(v) => patchGeneral({ mobileNumber: v })} disabled={isReadOnly} placeholder="10-digit mobile no." />
              </Field>
              <Field label="9. Official E-mail ID" required hint="Official SRM institutional email address (@srmist.edu.in)">
                <TextInput value={data.generalDetails.officialEmail} onChange={(v) => patchGeneral({ officialEmail: v })} disabled={isReadOnly} placeholder="name@srmist.edu.in" />
              </Field>
              <Field label="10. Personal E-mail ID" hint="Secondary contact email address">
                <TextInput value={data.generalDetails.personalEmail} onChange={(v) => patchGeneral({ personalEmail: v })} disabled={isReadOnly} placeholder="personal@gmail.com" />
              </Field>
              <Field label="11. Google Scholar Profile URL" hint="Direct link to public Google Scholar profile page">
                <TextInput value={data.generalDetails.googleScholarUrl} onChange={(v) => patchGeneral({ googleScholarUrl: v })} disabled={isReadOnly} placeholder="https://scholar.google.com/..." />
              </Field>
              <Field label="12. Scopus Author ID" hint="Unique 11-digit Scopus author identification number">
                <TextInput value={data.generalDetails.scopusAuthorId} onChange={(v) => patchGeneral({ scopusAuthorId: v })} disabled={isReadOnly} placeholder="Scopus Author ID" />
              </Field>
              <Field label="13. ORCID ID" hint="Digital researcher identifier (e.g. 0000-0002-1825-0097)">
                <TextInput value={data.generalDetails.orcidId} onChange={(v) => patchGeneral({ orcidId: v })} disabled={isReadOnly} placeholder="0000-000x-xxxx-xxxx" />
              </Field>
              <Field label="14. Reporting HoD Name" required hint="Full name of current Department Head">
                <TextInput value={data.generalDetails.reportingHodName} onChange={(v) => patchGeneral({ reportingHodName: v })} disabled={isReadOnly} placeholder="Dr. Y. Angeline Christobel" />
              </Field>
              <Field label="15. Reporting Dean / Principal Name" hint="Full name of reporting Dean or Principal">
                <TextInput value={data.generalDetails.reportingDeanName} onChange={(v) => patchGeneral({ reportingDeanName: v })} disabled={isReadOnly} placeholder="Dr. S. Thirumagan" />
              </Field>
            </div>
          </div>

          {/* Address */}
          <div>
            <SubHeader title="1.2 Addresses" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Residential Address" hint="Current residence address during working tenure">
                <TextArea value={data.generalDetails.residentialAddress} onChange={(v) => patchGeneral({ residentialAddress: v })} disabled={isReadOnly} placeholder="Full residential address" rows={3} />
              </Field>
              <Field label="Communication Address" hint="Permanent or official mailing address">
                <TextArea value={data.generalDetails.communicationAddress} onChange={(v) => patchGeneral({ communicationAddress: v })} disabled={isReadOnly} placeholder="Full communication address" rows={3} />
              </Field>
            </div>
          </div>

          {/* Teaching Experience Table */}
          <DynamicTable
            title="1.3 Teaching Experience Details (Starting from latest)"
            subtitle="Record all full-time academic teaching positions held"
            addLabel="Add Teaching Exp"
            isReadOnly={isReadOnly}
            onAdd={() => patchGeneral({ teachingExperience: [...data.generalDetails.teachingExperience, { id: `te-${Date.now()}`, institutionName: '', designation: '', periodFrom: '', periodTo: '', durationYearsMonths: '' }] })}
            headers={['Institution Name', 'Designation', 'Period (From)', 'Period (To)', 'No. of Years & Months']}
            emptyText="No teaching experience added yet."
            rows={data.generalDetails.teachingExperience.map((item) => (
              <tr key={item.id}>
                <td><TextInput value={item.institutionName} onChange={(v) => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.map((x) => x.id === item.id ? { ...x, institutionName: v } : x) })} disabled={isReadOnly} placeholder="SRMIST" /></td>
                <td><TextInput value={item.designation} onChange={(v) => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.map((x) => x.id === item.id ? { ...x, designation: v } : x) })} disabled={isReadOnly} placeholder="Assistant Professor" /></td>
                <td><DateInput value={item.periodFrom} onChange={(v) => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.map((x) => x.id === item.id ? { ...x, periodFrom: v } : x) })} disabled={isReadOnly} placeholder="DD/MM/YYYY" /></td>
                <td><DateInput value={item.periodTo} onChange={(v) => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.map((x) => x.id === item.id ? { ...x, periodTo: v } : x) })} disabled={isReadOnly} placeholder="DD/MM/YYYY or Till Date" allowTillDate /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={item.durationYearsMonths} onChange={(v) => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.map((x) => x.id === item.id ? { ...x, durationYearsMonths: v } : x) })} disabled={isReadOnly} placeholder="e.g. 5Y & 2M" />
                    {!isReadOnly && <button onClick={() => patchGeneral({ teachingExperience: data.generalDetails.teachingExperience.filter((x) => x.id !== item.id) })} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* Industry Experience Table */}
          <DynamicTable
            title="1.4 Industrial / Research Experience (Starting from latest)"
            subtitle="Record corporate, R&D, or industrial consulting experience"
            addLabel="Add Industry Exp"
            isReadOnly={isReadOnly}
            onAdd={() => patchGeneral({ industryExperience: [...data.generalDetails.industryExperience, { id: `ie-${Date.now()}`, industryName: '', designation: '', periodFrom: '', periodTo: '', durationYearsMonths: '' }] })}
            headers={['Industry Name', 'Designation', 'Period (From)', 'Period (To)', 'No. of Years & Months']}
            emptyText="No industry experience added yet."
            rows={data.generalDetails.industryExperience.map((item) => (
              <tr key={item.id}>
                <td><TextInput value={item.industryName} onChange={(v) => patchGeneral({ industryExperience: data.generalDetails.industryExperience.map((x) => x.id === item.id ? { ...x, industryName: v } : x) })} disabled={isReadOnly} placeholder="Cognizant" /></td>
                <td><TextInput value={item.designation} onChange={(v) => patchGeneral({ industryExperience: data.generalDetails.industryExperience.map((x) => x.id === item.id ? { ...x, designation: v } : x) })} disabled={isReadOnly} placeholder="Senior Analyst" /></td>
                <td><DateInput value={item.periodFrom} onChange={(v) => patchGeneral({ industryExperience: data.generalDetails.industryExperience.map((x) => x.id === item.id ? { ...x, periodFrom: v } : x) })} disabled={isReadOnly} placeholder="DD/MM/YYYY" /></td>
                <td><DateInput value={item.periodTo} onChange={(v) => patchGeneral({ industryExperience: data.generalDetails.industryExperience.map((x) => x.id === item.id ? { ...x, periodTo: v } : x) })} disabled={isReadOnly} placeholder="DD/MM/YYYY or Till Date" allowTillDate /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={item.durationYearsMonths} onChange={(v) => patchGeneral({ industryExperience: data.generalDetails.industryExperience.map((x) => x.id === item.id ? { ...x, durationYearsMonths: v } : x) })} disabled={isReadOnly} placeholder="e.g. 2Y & 0M" />
                    {!isReadOnly && <button onClick={() => patchGeneral({ industryExperience: data.generalDetails.industryExperience.filter((x) => x.id !== item.id) })} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* Leave Details */}
          <div>
            <SubHeader title="1.5 Leave Details (01st Jan 2025 to 31st Dec 2025)" subtitle="Record official leave history for attendance compliance audit" />
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <Field label="Calendar Year" hint="Assessment period year"><TextInput value={data.generalDetails.leaveDetails.calendarYear} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, calendarYear: v } })} disabled={isReadOnly} /></Field>
              <Field label="Total Working Days" hint="Total college working days"><NumberInput value={data.generalDetails.leaveDetails.workingDays} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, workingDays: v } })} disabled={isReadOnly} /></Field>
              <Field label="CL Availed" hint="Casual Leave taken (max 12/yr)"><NumberInput value={data.generalDetails.leaveDetails.cl} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, cl: v } })} disabled={isReadOnly} /></Field>
              <Field label="EL Availed" hint="Earned Leave taken"><NumberInput value={data.generalDetails.leaveDetails.el} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, el: v } })} disabled={isReadOnly} /></Field>
              <Field label="ML Availed" hint="Medical Leave taken"><NumberInput value={data.generalDetails.leaveDetails.ml} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, ml: v } })} disabled={isReadOnly} /></Field>
              <Field label="LoP Availed" hint="Loss of Pay leave days"><NumberInput value={data.generalDetails.leaveDetails.lop} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, lop: v } })} disabled={isReadOnly} /></Field>
              <Field label="VL Availed" hint="Vacation Leave taken"><NumberInput value={data.generalDetails.leaveDetails.vl} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, vl: v } })} disabled={isReadOnly} /></Field>
              <Field label="Total Leave Availed" hint="CL + EL + ML + LoP + VL"><NumberInput value={data.generalDetails.leaveDetails.totalLeaveAvailed} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, totalLeaveAvailed: v } })} disabled={isReadOnly} /></Field>
              <Field label="On Duty Availed" hint="Official Duty (OD) for university work"><NumberInput value={data.generalDetails.leaveDetails.onDutyAvailed} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, onDutyAvailed: v } })} disabled={isReadOnly} /></Field>
              <Field label="Effective Attendance" hint="Working Days minus Total Leaves"><NumberInput value={data.generalDetails.leaveDetails.effectiveAttendance} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, effectiveAttendance: v } })} disabled={isReadOnly} /></Field>
              <Field label="Attendance %" hint="(Effective ÷ Total Days) × 100"><NumberInput value={data.generalDetails.leaveDetails.attendancePercentage} onChange={(v) => patchGeneral({ leaveDetails: { ...data.generalDetails.leaveDetails, attendancePercentage: v } })} disabled={isReadOnly} /></Field>
            </div>
          </div>

          {/* Academic Details - End Sem Theory Results Table */}
          <DynamicTable
            title="1.6 Academic Details (Theory Courses End-Semester Examination Results)"
            addLabel="Add Course Result"
            isReadOnly={isReadOnly}
            onAdd={() => patchGeneral({ academicCourseResults: [...data.generalDetails.academicCourseResults, { id: `cr-${Date.now()}`, courseCodeName: '', ugPg: 'UG', yearDegreeBranch: '', noOfStudents: 0, monthYearExam: '', passPercentage: 0 }] })}
            headers={['Course Code & Name', 'UG / PG', 'Year, Degree, Branch', 'No. of Students', 'Month & Year of Exam', 'Pass %']}
            emptyText="No academic course results added yet."
            rows={data.generalDetails.academicCourseResults.map((cr) => (
              <tr key={cr.id}>
                <td><TextInput value={cr.courseCodeName} onChange={(v) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, courseCodeName: v } : x) })} disabled={isReadOnly} placeholder="USA20601J - Python" /></td>
                <td><select value={cr.ugPg} onChange={(e) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, ugPg: e.target.value as any } : x) })} disabled={isReadOnly} className="text-xs border rounded p-1"><option>UG</option><option>PG</option></select></td>
                <td><TextInput value={cr.yearDegreeBranch} onChange={(v) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, yearDegreeBranch: v } : x) })} disabled={isReadOnly} placeholder="III B.Sc CS" /></td>
                <td><NumberInput value={cr.noOfStudents} onChange={(v) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, noOfStudents: v } : x) })} disabled={isReadOnly} /></td>
                <td><MonthYearInput value={cr.monthYearExam} onChange={(v) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, monthYearExam: v } : x) })} disabled={isReadOnly} placeholder="MM/YYYY" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <NumberInput value={cr.passPercentage} onChange={(v) => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.map((x) => x.id === cr.id ? { ...x, passPercentage: v } : x) })} disabled={isReadOnly} placeholder="1.0" />
                    {!isReadOnly && <button onClick={() => patchGeneral({ academicCourseResults: data.generalDetails.academicCourseResults.filter((x) => x.id !== cr.id) })} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* Mentoring & Student Support Activities */}
          <div>
            <SubHeader title="1.7 Mentoring & Student Support Activities" subtitle="Record student mentee care, slow learner remediation, and career outcomes" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Total Students Allotted" hint="Total mentees assigned under your guidance"><NumberInput value={data.generalDetails.mentoring.studentsAllotted} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, studentsAllotted: v } })} disabled={isReadOnly} /></Field>
              <Field label="Slow Learners Identified" hint="Mentees with academic arrears or CGPA < 6.0"><NumberInput value={data.generalDetails.mentoring.slowLearnersIdentified} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, slowLearnersIdentified: v } })} disabled={isReadOnly} /></Field>
              <Field label="Top 10 Performers" hint="Mentees ranking in top 10 class positions"><NumberInput value={data.generalDetails.mentoring.top10Performers} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, top10Performers: v } })} disabled={isReadOnly} /></Field>
              <Field label="Students with Nil Arrears" hint="Mentees with zero pending backlog papers"><NumberInput value={data.generalDetails.mentoring.nilArrears} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, nilArrears: v } })} disabled={isReadOnly} /></Field>
              <Field label="Students with >2 Arrears" hint="Mentees carrying 3 or more pending backlogs"><NumberInput value={data.generalDetails.mentoring.moreThan2Arrears} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, moreThan2Arrears: v } })} disabled={isReadOnly} /></Field>
              <Field label="Coaching Class Allotted" hint="Remedial coaching hours assigned for mentees"><NumberInput value={data.generalDetails.mentoring.coachingClassAllotted} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, coachingClassAllotted: v } })} disabled={isReadOnly} /></Field>
              <Field label="Coaching Avg Attendance %" hint="Average student attendance in remedial sessions"><NumberInput value={data.generalDetails.mentoring.coachingAvgAttendancePct} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, coachingAvgAttendancePct: v } })} disabled={isReadOnly} /></Field>
              <Field label="Eligible Students for Placement" hint="Final year mentees eligible for campus placements"><NumberInput value={data.generalDetails.mentoring.eligiblePlacement} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, eligiblePlacement: v } })} disabled={isReadOnly} /></Field>
              <Field label="Participated in Competitions/Hackathons" hint="Mentees guided to participate in Hackathons/SIH"><NumberInput value={data.generalDetails.mentoring.participatedCompetitions} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, participatedCompetitions: v } })} disabled={isReadOnly} /></Field>
              <Field label="Won Prize in Competitions" hint="Mentees securing 1st/2nd/3rd prize in events"><NumberInput value={data.generalDetails.mentoring.wonPrizeCompetitions} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, wonPrizeCompetitions: v } })} disabled={isReadOnly} /></Field>
              <Field label="Placed as on Date" hint="Mentees who secured job offers"><NumberInput value={data.generalDetails.mentoring.placedAsOnDate} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, placedAsOnDate: v } })} disabled={isReadOnly} /></Field>
              <Field label="Aspiring Higher Studies / Entrepreneur" hint="Mentees pursuing MS/M.Tech or founding startups"><NumberInput value={data.generalDetails.mentoring.higherStudiesOrEntrepreneur} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, higherStudiesOrEntrepreneur: v } })} disabled={isReadOnly} /></Field>
              <Field label="Counseling Sessions Conducted (Nos.)" hint="One-on-one academic/personal mentee sessions"><NumberInput value={data.generalDetails.mentoring.counselingSessionsNos} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, counselingSessionsNos: v } })} disabled={isReadOnly} /></Field>
              <Field label="Parent Communication Count" hint="Official phone calls/meetings with parents"><NumberInput value={data.generalDetails.mentoring.parentCommunicationCount} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, parentCommunicationCount: v } })} disabled={isReadOnly} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Field label="Outcome of Mentoring" hint="Summary of overall mentee progress and achievements"><TextArea value={data.generalDetails.mentoring.outcomeOfMentoring} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, outcomeOfMentoring: v } })} disabled={isReadOnly} placeholder="Describe overall outcome..." rows={2} /></Field>
              <Field label="Action Plan to Improve Academic Performance" hint="Strategies for improving mentee pass % and CGPA"><TextArea value={data.generalDetails.mentoring.actionPlanAcademicImprovement} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, actionPlanAcademicImprovement: v } })} disabled={isReadOnly} placeholder="Describe action plan..." rows={2} /></Field>
              <Field label="Action Plan to Improve Placement" hint="Training & placement preparation initiatives for mentees"><TextArea value={data.generalDetails.mentoring.actionPlanPlacementImprovement} onChange={(v) => patchGeneral({ mentoring: { ...data.generalDetails.mentoring, actionPlanPlacementImprovement: v } })} disabled={isReadOnly} placeholder="Describe placement initiatives..." rows={2} /></Field>
            </div>
          </div>

          {/* Ph.D. Status & Supervision */}
          <div>
            <SubHeader title="1.8 Ph.D. Status & Research Supervision" subtitle="Track personal doctoral status and university research guideship" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Ph.D. Status" hint="Current personal doctoral status">
                <select value={data.generalDetails.phdProfile.status} onChange={(e) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, status: e.target.value as any } })} disabled={isReadOnly} className="w-full text-sm border rounded p-2"><option>Completed</option><option>Pursuing</option><option>Not Registered</option></select>
              </Field>
              <Field label="Institution / University (if pursuing)" hint="University where enrolled for Ph.D."><TextInput value={data.generalDetails.phdProfile.universityOrInstitution} onChange={(v) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, universityOrInstitution: v } })} disabled={isReadOnly} placeholder="e.g. SRM IST" /></Field>
              <Field label="Probable Completion Year" hint="Expected thesis submission year"><TextInput value={data.generalDetails.phdProfile.probableCompletionYear} onChange={(v) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, probableCompletionYear: v } })} disabled={isReadOnly} placeholder="e.g. 2026" /></Field>
              <Field label="Specialization Area" hint="Core research domain / field"><TextInput value={data.generalDetails.phdProfile.specializationArea} onChange={(v) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, specializationArea: v } })} disabled={isReadOnly} placeholder="e.g. Machine Learning" /></Field>
              <Field label="Ongoing Scholars (Part-Time)" hint="Active part-time Ph.D. scholars under your guideship"><NumberInput value={data.generalDetails.phdProfile.ongoingScholarsPT} onChange={(v) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, ongoingScholarsPT: v } })} disabled={isReadOnly} /></Field>
              <Field label="Ongoing Scholars (Full-Time)" hint="Active full-time Ph.D. scholars under your guideship"><NumberInput value={data.generalDetails.phdProfile.ongoingScholarsFT} onChange={(v) => patchGeneral({ phdProfile: { ...data.generalDetails.phdProfile, ongoingScholarsFT: v } })} disabled={isReadOnly} /></Field>
            </div>
          </div>

          {/* Industry Collaboration */}
          <div>
            <SubHeader title="1.9 Industry Collaboration" subtitle="Record MoUs, industrial partnerships, internships, and live projects" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Industries Identified" hint="Companies surveyed for MoU/collab"><NumberInput value={data.generalDetails.industryCollab.industriesIdentified} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, industriesIdentified: v } })} disabled={isReadOnly} /></Field>
              <Field label="Industries Contacted" hint="Companies officially communicated with"><NumberInput value={data.generalDetails.industryCollab.industriesContacted} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, industriesContacted: v } })} disabled={isReadOnly} /></Field>
              <Field label="Converted to Collaboration" hint="Signed MoUs or formal agreements"><NumberInput value={data.generalDetails.industryCollab.convertedToCollaboration} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, convertedToCollaboration: v } })} disabled={isReadOnly} /></Field>
              <Field label="Students Placed" hint="Students hired via industry connect"><NumberInput value={data.generalDetails.industryCollab.studentsPlacedConnect} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, studentsPlacedConnect: v } })} disabled={isReadOnly} /></Field>
              <Field label="Internships (With Stipend)" hint="Paid student industry internships"><NumberInput value={data.generalDetails.industryCollab.internshipsWithStipend} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, internshipsWithStipend: v } })} disabled={isReadOnly} /></Field>
              <Field label="Internships (No Stipend)" hint="Unpaid training internships"><NumberInput value={data.generalDetails.industryCollab.internshipsWithoutStipend} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, internshipsWithoutStipend: v } })} disabled={isReadOnly} /></Field>
              <Field label="Live Projects Involved" hint="Active consultancy/industry use cases"><NumberInput value={data.generalDetails.industryCollab.liveProjectsInvolved} onChange={(v) => patchGeneral({ industryCollab: { ...data.generalDetails.industryCollab, liveProjectsInvolved: v } })} disabled={isReadOnly} /></Field>
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 2: CATEGORY I — TEACHING, LEARNING & EVALUATION
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-cat1"
          icon={<BookOpen className="w-4 h-4" />}
          title="2. Category I — Teaching, Learning & Evaluation Activities"
          subtitle="Academic Year: January 2025 – December 2025"
          maxPts={110}
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8 space-y-6">

          {/* ── Category I: Quick Score Summary Header ── */}
          <div className="mb-2 pb-4 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">Category I: Teaching, Learning &amp; Evaluation Activities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Assessment Period: January 2025 – December 2025 &bull; Maximum Score: <span className="font-bold text-blue-700">110 Points</span></p>
                <p className="text-xs text-slate-400 mt-1">Teaching load calculated from actual credit mix. <strong>HoD timetable verification is mandatory.</strong> Enter your self-assessed score and attach proof links for each criterion below.</p>
              </div>
            </div>
          </div>

          {/* Category I Criteria Self-Scores (1.1 – 1.13) */}
          <div className="space-y-3">
            <SubHeader title="Category I Criteria Self-Scores" subtitle="Click 'Scoring Rules' on any row to view full Excel calculation guidelines & proof requirements" />
            <CriteriaRow number="1.1" title="Teaching Load Compliance" description="(Classes Taught / Assigned) × 100% — Max 10 pts" maxScore={10} selfScore={data.cat1.teachingLoad.selfScore} onSelfScoreChange={(v) => updateCat1Score('teachingLoad', { selfScore: v })} proofUrl={data.cat1.teachingLoad.proofUrl} onProofUrlChange={(v) => updateCat1Score('teachingLoad', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('teachingLoad').isFlagged} flagReason={getFlagInfo('teachingLoad').reason} flagItem={getFlagInfo('teachingLoad').flagItem} scoringGuideKey="cat1_1.1" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.2" title="Learning Materials / E-Content Developed" description="2 pts each: E-Content (4-Quadrant), Workbook, Model — Max 10 pts" maxScore={10} selfScore={data.cat1.eContent.selfScore} onSelfScoreChange={(v) => updateCat1Score('eContent', { selfScore: v })} proofUrl={data.cat1.eContent.proofUrl} onProofUrlChange={(v) => updateCat1Score('eContent', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('eContent').isFlagged} flagReason={getFlagInfo('eContent').reason} flagItem={getFlagInfo('eContent').flagItem} scoringGuideKey="cat1_1.2" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.3" title="Innovative Pedagogical Approaches" description="1 pt per activity (Active Learning / Formative Assessment) — Max 15 pts" maxScore={15} selfScore={data.cat1.innovativePedagogy.selfScore} onSelfScoreChange={(v) => updateCat1Score('innovativePedagogy', { selfScore: v })} proofUrl={data.cat1.innovativePedagogy.proofUrl} onProofUrlChange={(v) => updateCat1Score('innovativePedagogy', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('innovativePedagogy').isFlagged} flagReason={getFlagInfo('innovativePedagogy').reason} flagItem={getFlagInfo('innovativePedagogy').flagItem} scoringGuideKey="cat1_1.3" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.4" title="Remedial Teaching & Slow Learners Support" description="Pedagogical strategy: 3 pts + Remedial materials: 2 pts — Max 5 pts" maxScore={5} selfScore={data.cat1.remedialTeaching.selfScore} onSelfScoreChange={(v) => updateCat1Score('remedialTeaching', { selfScore: v })} proofUrl={data.cat1.remedialTeaching.proofUrl} onProofUrlChange={(v) => updateCat1Score('remedialTeaching', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('remedialTeaching').isFlagged} flagReason={getFlagInfo('remedialTeaching').reason} flagItem={getFlagInfo('remedialTeaching').flagItem} scoringGuideKey="cat1_1.4" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.5" title="End-Semester Examination Duties" description="QP Setting + Scrutiny + Invigilation + Evaluation + Squad — 100% = 5 pts" maxScore={5} selfScore={data.cat1.examDuties.selfScore} onSelfScoreChange={(v) => updateCat1Score('examDuties', { selfScore: v })} proofUrl={data.cat1.examDuties.proofUrl} onProofUrlChange={(v) => updateCat1Score('examDuties', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('examDuties').isFlagged} flagReason={getFlagInfo('examDuties').reason} flagItem={getFlagInfo('examDuties').flagItem} scoringGuideKey="cat1_1.5" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.6" title="MOOC / Online Course Development" description="Full course (≥30 hrs): 10 pts | Microcredential (10–30 hrs): 5 pts — Max 10 pts" maxScore={10} selfScore={data.cat1.moocDevelopment.selfScore} onSelfScoreChange={(v) => updateCat1Score('moocDevelopment', { selfScore: v })} proofUrl={data.cat1.moocDevelopment.proofUrl} onProofUrlChange={(v) => updateCat1Score('moocDevelopment', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('moocDevelopment').isFlagged} flagReason={getFlagInfo('moocDevelopment').reason} flagItem={getFlagInfo('moocDevelopment').flagItem} scoringGuideKey="cat1_1.6" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.7" title="NPTEL Course Completion" description="Topper=8 | Elite+Gold=6 | Elite+Silver=5 | Elite=4 | Completion=3 — Max 10 pts" maxScore={10} selfScore={data.cat1.nptelCompletion.selfScore} onSelfScoreChange={(v) => updateCat1Score('nptelCompletion', { selfScore: v })} proofUrl={data.cat1.nptelCompletion.proofUrl} onProofUrlChange={(v) => updateCat1Score('nptelCompletion', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('nptelCompletion').isFlagged} flagReason={getFlagInfo('nptelCompletion').reason} flagItem={getFlagInfo('nptelCompletion').flagItem} scoringGuideKey="cat1_1.7" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.8" title="Internationally Recognized Professional Certifications" description="2.5 pts per course — Max 5 pts (2 courses max)" maxScore={5} selfScore={data.cat1.certifications.selfScore} onSelfScoreChange={(v) => updateCat1Score('certifications', { selfScore: v })} proofUrl={data.cat1.certifications.proofUrl} onProofUrlChange={(v) => updateCat1Score('certifications', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('certifications').isFlagged} flagReason={getFlagInfo('certifications').reason} flagItem={getFlagInfo('certifications').flagItem} scoringGuideKey="cat1_1.8" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.9" title="Average End-Semester Examination Results" description="100%=5pts | >90%=4pts | >80%=3pts | >70%=2pts — Max 5 pts" maxScore={5} selfScore={data.cat1.examResults.selfScore} onSelfScoreChange={(v) => updateCat1Score('examResults', { selfScore: v })} proofUrl={data.cat1.examResults.proofUrl} onProofUrlChange={(v) => updateCat1Score('examResults', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('examResults').isFlagged} flagReason={getFlagInfo('examResults').reason} flagItem={getFlagInfo('examResults').flagItem} scoringGuideKey="cat1_1.9" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.10" title="CO–PO Attainment Calculation (All Allotted Subjects incl. Lab)" description="100% compliance (all subjects submitted) = 5 pts" maxScore={5} selfScore={data.cat1.copoAttainment.selfScore} onSelfScoreChange={(v) => updateCat1Score('copoAttainment', { selfScore: v })} proofUrl={data.cat1.copoAttainment.proofUrl} onProofUrlChange={(v) => updateCat1Score('copoAttainment', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('copoAttainment').isFlagged} flagReason={getFlagInfo('copoAttainment').reason} flagItem={getFlagInfo('copoAttainment').flagItem} scoringGuideKey="cat1_1.10" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.11" title="Industry Connect Facilitated with Outcomes" description="Placement=3/industry | Stipend Intern=2/student | Intern=1/student | MoU=5 | CoE=10 | Usecase=5 — Max 10 pts" maxScore={10} selfScore={data.cat1.industryConnect.selfScore} onSelfScoreChange={(v) => updateCat1Score('industryConnect', { selfScore: v })} proofUrl={data.cat1.industryConnect.proofUrl} onProofUrlChange={(v) => updateCat1Score('industryConnect', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('industryConnect').isFlagged} flagReason={getFlagInfo('industryConnect').reason} flagItem={getFlagInfo('industryConnect').flagItem} scoringGuideKey="cat1_1.11" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.12" title="Guiding Students — Design Competitions & Startups" description="1.12A: Competitions (1–10 pts/batch) + 1.12B: Startups (1–5 pts) — Max 10 pts" maxScore={10} selfScore={data.cat1.studentGuiding.selfScore} onSelfScoreChange={(v) => updateCat1Score('studentGuiding', { selfScore: v })} proofUrl={data.cat1.studentGuiding.proofUrl} onProofUrlChange={(v) => updateCat1Score('studentGuiding', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('studentGuiding').isFlagged} flagReason={getFlagInfo('studentGuiding').reason} flagItem={getFlagInfo('studentGuiding').flagItem} scoringGuideKey="cat1_1.12" onOpenGuide={handleOpenGuide} />
            <CriteriaRow number="1.13" title="Contribution to Department / Institution" description="Dept role = 2 pts each | Institution role = 5 pts each — Max 10 pts" maxScore={10} selfScore={data.cat1.deptContribution.selfScore} onSelfScoreChange={(v) => updateCat1Score('deptContribution', { selfScore: v })} proofUrl={data.cat1.deptContribution.proofUrl} onProofUrlChange={(v) => updateCat1Score('deptContribution', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('deptContribution').isFlagged} flagReason={getFlagInfo('deptContribution').reason} flagItem={getFlagInfo('deptContribution').flagItem} scoringGuideKey="cat1_1.13" onOpenGuide={handleOpenGuide} />
          </div>

          {/* ═══════════════════════════════════════════
              DETAIL TABLES (1.1 – 1.13)
          ═══════════════════════════════════════════ */}

          {/* 1.1 Teaching Load Tables */}
          <DynamicTable
            title="1.1 Teaching Load — Semester-Wise Course Details"
            subtitle="L = Lecture hours | T = Tutorial hours | P = Practical hours | R = Research hours (as per syllabus). Score = (Total Taught ÷ Total Assigned) × 100% → 100% compliance = 10 pts"
            addLabel="Add Course"
            isReadOnly={isReadOnly}
            onAdd={() => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: [...d.cat1.teachingLoadTable, { id: `tl-${Date.now()}`, semesterType: 'ODD', courseCode: '', courseName: '', assignedL: 0, assignedT: 0, assignedP: 0, assignedR: 0, taughtL: 0, taughtT: 0, taughtP: 0, taughtR: 0, proofUrl: '' }] } }))}
            headers={['Sem', 'Course Code', 'Course Name', 'Credit Hrs Assigned (L / T / P / R)', 'Credit Hrs Taught (L / T / P / R)', 'Proof URL (Drive Link)']}
            emptyText="No teaching load entries added. Add each course taught (ODD and EVEN semester)."
            rows={data.cat1.teachingLoadTable.map((tl) => (
              <tr key={tl.id}>
                <td><select value={tl.semesterType} onChange={(e) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, semesterType: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>ODD</option><option>EVEN</option></select></td>
                <td><TextInput value={tl.courseCode} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, courseCode: v } : x) } }))} disabled={isReadOnly} placeholder="USA20601J" /></td>
                <td><TextInput value={tl.courseName} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, courseName: v } : x) } }))} disabled={isReadOnly} placeholder="Python Programming" /></td>
                <td>
                  <div className="flex gap-1 text-xs">
                    <NumberInput value={tl.assignedL} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, assignedL: v } : x) } }))} disabled={isReadOnly} placeholder="L" />
                    <NumberInput value={tl.assignedT} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, assignedT: v } : x) } }))} disabled={isReadOnly} placeholder="T" />
                    <NumberInput value={tl.assignedP} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, assignedP: v } : x) } }))} disabled={isReadOnly} placeholder="P" />
                  </div>
                </td>
                <td>
                  <div className="flex gap-1 text-xs">
                    <NumberInput value={tl.taughtL} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, taughtL: v } : x) } }))} disabled={isReadOnly} placeholder="L" />
                    <NumberInput value={tl.taughtT} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, taughtT: v } : x) } }))} disabled={isReadOnly} placeholder="T" />
                    <NumberInput value={tl.taughtP} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, taughtP: v } : x) } }))} disabled={isReadOnly} placeholder="P" />
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={tl.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.map((x) => x.id === tl.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat1: { ...d.cat1, teachingLoadTable: d.cat1.teachingLoadTable.filter((x) => x.id !== tl.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* 1.2 Learning Materials Developed */}
          <DynamicTable
            title="1.2 Learning Materials Developed"
            addLabel="Add Material"
            isReadOnly={isReadOnly}
            onAdd={() => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: [...d.cat1.learningMaterialsTable, { id: `lm-${Date.now()}`, materialType: '', courseTitle: '', courseContent: '', proofUrl: '' }] } }))}
            headers={['Material Type', 'Course Title', 'Course Content', 'Proof URL']}
            emptyText="No materials added."
            rows={data.cat1.learningMaterialsTable.map((lm) => (
              <tr key={lm.id}>
                <td><TextInput value={lm.materialType} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: d.cat1.learningMaterialsTable.map((x) => x.id === lm.id ? { ...x, materialType: v } : x) } }))} disabled={isReadOnly} placeholder="E-content 4 Quadrant" /></td>
                <td><TextInput value={lm.courseTitle} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: d.cat1.learningMaterialsTable.map((x) => x.id === lm.id ? { ...x, courseTitle: v } : x) } }))} disabled={isReadOnly} placeholder="Python Programming" /></td>
                <td><TextInput value={lm.courseContent} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: d.cat1.learningMaterialsTable.map((x) => x.id === lm.id ? { ...x, courseContent: v } : x) } }))} disabled={isReadOnly} placeholder="Lab Manual / Workbook" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={lm.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: d.cat1.learningMaterialsTable.map((x) => x.id === lm.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat1: { ...d.cat1, learningMaterialsTable: d.cat1.learningMaterialsTable.filter((x) => x.id !== lm.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* 1.10 CO-PO Attainment Calculation */}
          <DynamicTable
            title="1.10 CO-PO Attainment Calculation (Theory / Lab Courses)"
            addLabel="Add CO-PO Record"
            isReadOnly={isReadOnly}
            onAdd={() => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: [...d.cat1.copoTable, { id: `cp-${Date.now()}`, semester: '', courseCode: '', courseTitle: '', courseType: 'Theory', co1: 0, co2: 0, co3: 0, co4: 0, co5: 0, actionPlan: '', proofUrl: '' }] } }))}
            headers={['Sem', 'Course Code & Title', 'Type', 'CO1-CO5 Attainments', 'Action Plan', 'Proof URL']}
            emptyText="No CO-PO attainment entries added."
            rows={data.cat1.copoTable.map((cp) => (
              <tr key={cp.id}>
                <td><TextInput value={cp.semester} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, semester: v } : x) } }))} disabled={isReadOnly} placeholder="ODD" /></td>
                <td><TextInput value={`${cp.courseCode} ${cp.courseTitle}`.trim()} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, courseCode: v } : x) } }))} disabled={isReadOnly} placeholder="USA20601J Python" /></td>
                <td><select value={cp.courseType} onChange={(e) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, courseType: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>Theory</option><option>Lab</option></select></td>
                <td>
                  <div className="flex gap-1 text-xs">
                    <NumberInput value={cp.co1} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, co1: v } : x) } }))} disabled={isReadOnly} placeholder="CO1" />
                    <NumberInput value={cp.co2} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, co2: v } : x) } }))} disabled={isReadOnly} placeholder="CO2" />
                    <NumberInput value={cp.co3} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, co3: v } : x) } }))} disabled={isReadOnly} placeholder="CO3" />
                  </div>
                </td>
                <td><TextInput value={cp.actionPlan} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, actionPlan: v } : x) } }))} disabled={isReadOnly} placeholder="Action plan" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={cp.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.map((x) => x.id === cp.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat1: { ...d.cat1, copoTable: d.cat1.copoTable.filter((x) => x.id !== cp.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* Category I Live Dynamic Total Summary Row */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-blue-50/80 border border-blue-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wide">Category I Total Self Score (Teaching &amp; Evaluation)</span>
              <p className="text-[13px] text-blue-700 font-medium">Dynamically calculated as you enter scores &amp; proof links above</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-blue-200 shadow-xs">
              <span className="text-lg font-black text-blue-700">{cat1Self.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-bold">/ 110 Max Pts</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 3: CATEGORY II — CO-CURRICULAR & PROFESSIONAL
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-cat2"
          icon={<Layers className="w-4 h-4" />}
          title="3. Category II — Co-Curricular, Extension & Professional Related Activities"
          subtitle="Academic Year: January 2025 – December 2025"
          maxPts={50}
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8 space-y-6">
          <SubHeader title="Category II Criteria Scores" subtitle="Enter your self-scores for criteria 2.1 to 2.11 (Click 'Scoring Rules' on any row for detailed instructions)" />
          <CriteriaRow number="2.1" title="Community Service & Mentoring" description="Max 5 pts" maxScore={5} selfScore={data.cat2.communityService.selfScore} onSelfScoreChange={(v) => updateCat2Score('communityService', { selfScore: v })} proofUrl={data.cat2.communityService.proofUrl} onProofUrlChange={(v) => updateCat2Score('communityService', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('communityService').isFlagged} flagReason={getFlagInfo('communityService').reason} flagItem={getFlagInfo('communityService').flagItem} scoringGuideKey="cat2_2.1" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.2" title="Roles in Profession-Related Committees" description="Max 5 pts" maxScore={5} selfScore={data.cat2.professionCommittees.selfScore} onSelfScoreChange={(v) => updateCat2Score('professionCommittees', { selfScore: v })} proofUrl={data.cat2.professionCommittees.proofUrl} onProofUrlChange={(v) => updateCat2Score('professionCommittees', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('professionCommittees').isFlagged} flagReason={getFlagInfo('professionCommittees').reason} flagItem={getFlagInfo('professionCommittees').flagItem} scoringGuideKey="cat2_2.2" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.3" title="Workshops, Seminars & Webinars" description="Max 5 pts" maxScore={5} selfScore={data.cat2.workshopsWebinars.selfScore} onSelfScoreChange={(v) => updateCat2Score('workshopsWebinars', { selfScore: v })} proofUrl={data.cat2.workshopsWebinars.proofUrl} onProofUrlChange={(v) => updateCat2Score('workshopsWebinars', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('workshopsWebinars').isFlagged} flagReason={getFlagInfo('workshopsWebinars').reason} flagItem={getFlagInfo('workshopsWebinars').flagItem} scoringGuideKey="cat2_2.3" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.4" title="FDP / Short-Term Training Attended" description="Max 5 pts" maxScore={5} selfScore={data.cat2.fdpAttended.selfScore} onSelfScoreChange={(v) => updateCat2Score('fdpAttended', { selfScore: v })} proofUrl={data.cat2.fdpAttended.proofUrl} onProofUrlChange={(v) => updateCat2Score('fdpAttended', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('fdpAttended').isFlagged} flagReason={getFlagInfo('fdpAttended').reason} flagItem={getFlagInfo('fdpAttended').flagItem} scoringGuideKey="cat2_2.4" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.5" title="Professional Body Memberships" description="Max 5 pts" maxScore={5} selfScore={data.cat2.professionalMemberships.selfScore} onSelfScoreChange={(v) => updateCat2Score('professionalMemberships', { selfScore: v })} proofUrl={data.cat2.professionalMemberships.proofUrl} onProofUrlChange={(v) => updateCat2Score('professionalMemberships', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('professionalMemberships').isFlagged} flagReason={getFlagInfo('professionalMemberships').reason} flagItem={getFlagInfo('professionalMemberships').flagItem} scoringGuideKey="cat2_2.5" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.6" title="International Events Organized" description="Max 5 pts" maxScore={5} selfScore={data.cat2.intlEventsOrganized.selfScore} onSelfScoreChange={(v) => updateCat2Score('intlEventsOrganized', { selfScore: v })} proofUrl={data.cat2.intlEventsOrganized.proofUrl} onProofUrlChange={(v) => updateCat2Score('intlEventsOrganized', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('intlEventsOrganized').isFlagged} flagReason={getFlagInfo('intlEventsOrganized').reason} flagItem={getFlagInfo('intlEventsOrganized').flagItem} scoringGuideKey="cat2_2.6" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.7" title="National Events Organized" description="Max 3 pts" maxScore={3} selfScore={data.cat2.natlEventsOrganized.selfScore} onSelfScoreChange={(v) => updateCat2Score('natlEventsOrganized', { selfScore: v })} proofUrl={data.cat2.natlEventsOrganized.proofUrl} onProofUrlChange={(v) => updateCat2Score('natlEventsOrganized', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('natlEventsOrganized').isFlagged} flagReason={getFlagInfo('natlEventsOrganized').reason} flagItem={getFlagInfo('natlEventsOrganized').flagItem} scoringGuideKey="cat2_2.7" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.8" title="State / College Events Organized" description="Max 2 pts" maxScore={2} selfScore={data.cat2.stateEventsOrganized.selfScore} onSelfScoreChange={(v) => updateCat2Score('stateEventsOrganized', { selfScore: v })} proofUrl={data.cat2.stateEventsOrganized.proofUrl} onProofUrlChange={(v) => updateCat2Score('stateEventsOrganized', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('stateEventsOrganized').isFlagged} flagReason={getFlagInfo('stateEventsOrganized').reason} flagItem={getFlagInfo('stateEventsOrganized').flagItem} scoringGuideKey="cat2_2.8" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.9" title="Delivered Lectures / Chaired Sessions / Jury" description="Max 5 pts" maxScore={5} selfScore={data.cat2.lecturesChaired.selfScore} onSelfScoreChange={(v) => updateCat2Score('lecturesChaired', { selfScore: v })} proofUrl={data.cat2.lecturesChaired.proofUrl} onProofUrlChange={(v) => updateCat2Score('lecturesChaired', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('lecturesChaired').isFlagged} flagReason={getFlagInfo('lecturesChaired').reason} flagItem={getFlagInfo('lecturesChaired').flagItem} scoringGuideKey="cat2_2.9" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.10" title="Brand-Building & Outreach Programs" description="Max 5 pts" maxScore={5} selfScore={data.cat2.brandBuilding.selfScore} onSelfScoreChange={(v) => updateCat2Score('brandBuilding', { selfScore: v })} proofUrl={data.cat2.brandBuilding.proofUrl} onProofUrlChange={(v) => updateCat2Score('brandBuilding', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('brandBuilding').isFlagged} flagReason={getFlagInfo('brandBuilding').reason} flagItem={getFlagInfo('brandBuilding').flagItem} scoringGuideKey="cat2_2.10" onOpenGuide={handleOpenGuide} />
          <CriteriaRow number="2.11" title="Conference Papers Presented" description="Max 5 pts" maxScore={5} selfScore={data.cat2.conferencePapers.selfScore} onSelfScoreChange={(v) => updateCat2Score('conferencePapers', { selfScore: v })} proofUrl={data.cat2.conferencePapers.proofUrl} onProofUrlChange={(v) => updateCat2Score('conferencePapers', { proofUrl: v })} disabled={isReadOnly} isFlagged={getFlagInfo('conferencePapers').isFlagged} flagReason={getFlagInfo('conferencePapers').reason} flagItem={getFlagInfo('conferencePapers').flagItem} scoringGuideKey="cat2_2.11" onOpenGuide={handleOpenGuide} />

          {/* Category II Live Dynamic Total Summary Row */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-purple-50/80 border border-purple-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Category II Total Self Score (Co-Curricular &amp; Professional)</span>
              <p className="text-[13px] text-purple-700 font-medium">Dynamically calculated as you enter scores &amp; proof links above</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-purple-200 shadow-xs">
              <span className="text-lg font-black text-purple-700">{cat2Self.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-bold">/ 50 Max Pts</span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 4: CATEGORY III — RESEARCH & CONTRIBUTIONS
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-cat3"
          icon={<Award className="w-4 h-4" />}
          title="4. Category III — Research and Related Contributions"
          subtitle="Academic Year: January 2025 – December 2025"
          maxPts={190}
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8 space-y-6">
          <DynamicTable
            id="table-cat3_3.1"
            title="3.1 Journal Publications (Max 50 pts)"
            subtitle="SCI Q1: 15 pts · Q2: 10 pts · Q3/Q4: 7.5 pts · Scopus: 5 pts (Click 'Scoring Rules' for author credit rules)"
            scoringGuideKey="cat3_3.1"
            onOpenGuide={handleOpenGuide}
            addLabel="Add Journal"
            isReadOnly={isReadOnly}
            isFlagged={getFlagInfo('journals').isFlagged}
            flagReason={getFlagInfo('journals').reason}
            onAdd={() => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: [...d.cat3.journals, { id: `j-${Date.now()}`, title: '', journalName: '', indexing: 'Scopus', quartile: 'Q1', authorPosition: 'First', numberOfAuthors: 2, doiLink: '', proofUrl: '', calculatedScore: 0 }] } }))}
            headers={['Paper Title', 'Journal Name', 'Indexing', 'Quartile', 'Author Position', 'Authors', 'DOI / Link', 'Proof URL']}
            emptyText="No journal publications added."
            rows={data.cat3.journals.map((j) => (
              <tr key={j.id}>
                <td><TextInput value={j.title} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, title: v } : x) } }))} disabled={isReadOnly} placeholder="Paper title" /></td>
                <td><TextInput value={j.journalName} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, journalName: v } : x) } }))} disabled={isReadOnly} placeholder="Journal name" /></td>
                <td><select value={j.indexing} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, indexing: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>SCI</option><option>Scopus</option><option>Other</option></select></td>
                <td><select value={j.quartile} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, quartile: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option><option>None</option></select></td>
                <td><select value={j.authorPosition} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, authorPosition: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option value="First">First</option><option value="Corresponding">Corresponding</option><option value="Supervisor">Supervisor</option><option value="Other">Other</option></select></td>
                <td><NumberInput value={j.numberOfAuthors} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, numberOfAuthors: v } : x) } }))} disabled={isReadOnly} /></td>
                <td><TextInput value={j.doiLink} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, doiLink: v } : x) } }))} disabled={isReadOnly} placeholder="DOI link" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={j.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.map((x) => x.id === j.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat3: { ...d.cat3, journals: d.cat3.journals.filter((x) => x.id !== j.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          <DynamicTable
            id="table-cat3_3.4"
            title="3.4 Consultancy Received (Max 10 pts)"
            subtitle="₹10K–25K = 3 pts | ₹25K–1L = 5 pts | ₹1L–2L = 8 pts | >₹2L = 10 pts"
            scoringGuideKey="cat3_3.4"
            onOpenGuide={handleOpenGuide}
            addLabel="Add Consultancy"
            isReadOnly={isReadOnly}
            isFlagged={getFlagInfo('consultancy').isFlagged}
            flagReason={getFlagInfo('consultancy').reason}
            onAdd={() => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: [...d.cat3.consultancy, { id: `con-${Date.now()}`, projectTitle: '', clientName: '', consultancyPeriod: '', amountReceived: 0, institutionalAccountReceived: true, sanctionNo: '', proofUrl: '' }] } }))}
            headers={['Project Title', 'Client Name', 'Amount (₹)', 'Sanction / Agreement No.', 'Proof URL']}
            emptyText="No consultancy entries added."
            rows={data.cat3.consultancy.map((c) => (
              <tr key={c.id}>
                <td><TextInput value={c.projectTitle} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.map((x) => x.id === c.id ? { ...x, projectTitle: v } : x) } }))} disabled={isReadOnly} placeholder="Project title" /></td>
                <td><TextInput value={c.clientName} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.map((x) => x.id === c.id ? { ...x, clientName: v } : x) } }))} disabled={isReadOnly} placeholder="Client name" /></td>
                <td><NumberInput value={c.amountReceived} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.map((x) => x.id === c.id ? { ...x, amountReceived: v } : x) } }))} disabled={isReadOnly} /></td>
                <td><TextInput value={c.sanctionNo} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.map((x) => x.id === c.id ? { ...x, sanctionNo: v } : x) } }))} disabled={isReadOnly} placeholder="Sanction no." /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={c.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.map((x) => x.id === c.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat3: { ...d.cat3, consultancy: d.cat3.consultancy.filter((x) => x.id !== c.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          <DynamicTable
            id="table-cat3_3.5"
            title="3.5 Patents (Max 20 pts)"
            subtitle="Granted = 10 pts per patent | Published = 5 pts per patent"
            scoringGuideKey="cat3_3.5"
            onOpenGuide={handleOpenGuide}
            addLabel="Add Patent"
            isReadOnly={isReadOnly}
            isFlagged={getFlagInfo('patents').isFlagged}
            flagReason={getFlagInfo('patents').reason}
            onAdd={() => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: [...d.cat3.patents, { id: `pat-${Date.now()}`, title: '', appNumber: '', status: 'Published', inventorPosition: '', institutionalAffiliation: true, proofUrl: '' }] } }))}
            headers={['Patent Title', 'App. No.', 'Status', 'Inventor Position', 'Proof URL']}
            emptyText="No patent entries added."
            rows={data.cat3.patents.map((p) => (
              <tr key={p.id}>
                <td><TextInput value={p.title} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.map((x) => x.id === p.id ? { ...x, title: v } : x) } }))} disabled={isReadOnly} placeholder="Patent title" /></td>
                <td><TextInput value={p.appNumber} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.map((x) => x.id === p.id ? { ...x, appNumber: v } : x) } }))} disabled={isReadOnly} placeholder="Application no." /></td>
                <td><select value={p.status} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.map((x) => x.id === p.id ? { ...x, status: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>Published</option><option>Granted</option></select></td>
                <td><TextInput value={p.inventorPosition} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.map((x) => x.id === p.id ? { ...x, inventorPosition: v } : x) } }))} disabled={isReadOnly} placeholder="1st Inventor" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={p.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.map((x) => x.id === p.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat3: { ...d.cat3, patents: d.cat3.patents.filter((x) => x.id !== p.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          <DynamicTable
            id="table-cat3_3.8"
            title="3.8 Funded Projects (Max 15 pts)"
            subtitle="<₹1L = 2 pts | ₹1–5L = 5 pts | ₹5–20L = 10 pts | >₹20L = 15 pts (PI: 100%, Co-PI: 75%)"
            scoringGuideKey="cat3_3.8"
            onOpenGuide={handleOpenGuide}
            addLabel="Add Project"
            isReadOnly={isReadOnly}
            isFlagged={getFlagInfo('fundedProjects').isFlagged}
            flagReason={getFlagInfo('fundedProjects').reason}
            onAdd={() => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: [...d.cat3.fundedProjects, { id: `fp-${Date.now()}`, projectTitle: '', agency: '', role: 'PI', status: 'Sanctioned', amountSanctioned: 0, sanctionNoDate: '', duration: '', institutionalApproval: true, proofUrl: '' }] } }))}
            headers={['Project Title', 'Agency', 'Role', 'Status', 'Amount (₹)', 'Sanction No/Date', 'Duration', 'Proof URL']}
            emptyText="No funded project entries added."
            rows={data.cat3.fundedProjects.map((fp) => (
              <tr key={fp.id}>
                <td><TextInput value={fp.projectTitle} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, projectTitle: v } : x) } }))} disabled={isReadOnly} placeholder="Project title" /></td>
                <td><TextInput value={fp.agency} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, agency: v } : x) } }))} disabled={isReadOnly} placeholder="DST / SERB" /></td>
                <td><select value={fp.role} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, role: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>PI</option><option>Co-PI</option></select></td>
                <td><select value={fp.status} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, status: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>Sanctioned</option><option>Submitted</option></select></td>
                <td><NumberInput value={fp.amountSanctioned} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, amountSanctioned: v } : x) } }))} disabled={isReadOnly} /></td>
                <td><TextInput value={fp.sanctionNoDate} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, sanctionNoDate: v } : x) } }))} disabled={isReadOnly} placeholder="No / Date" /></td>
                <td><TextInput value={fp.duration} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, duration: v } : x) } }))} disabled={isReadOnly} placeholder="2 Years" /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={fp.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.map((x) => x.id === fp.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat3: { ...d.cat3, fundedProjects: d.cat3.fundedProjects.filter((x) => x.id !== fp.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          <DynamicTable
            id="table-cat3_3.9"
            title="3.9 Industry Use Case Implementation under MoU/NDA (Max 25 pts)"
            subtitle="20 Pts per implemented use case (PI: 100%, Co-PI: 75%, Team: 50%)"
            scoringGuideKey="cat3_3.9"
            onOpenGuide={handleOpenGuide}
            addLabel="Add Use Case"
            isReadOnly={isReadOnly}
            isFlagged={getFlagInfo('industryUseCases').isFlagged}
            flagReason={getFlagInfo('industryUseCases').reason}
            onAdd={() => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: [...d.cat3.industryUseCases, { id: `uc-${Date.now()}`, title: '', partnerName: '', role: 'PI', deliverableType: '', implementationPeriod: '', status: 'Completed', proofUrl: '' }] } }))}
            headers={['Use Case Title', 'Partner Name', 'Role', 'Deliverable Type', 'Period', 'Status', 'Proof URL']}
            emptyText="No industry use cases added."
            rows={data.cat3.industryUseCases.map((uc) => (
              <tr key={uc.id}>
                <td><TextInput value={uc.title} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, title: v } : x) } }))} disabled={isReadOnly} placeholder="AI Model" /></td>
                <td><TextInput value={uc.partnerName} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, partnerName: v } : x) } }))} disabled={isReadOnly} placeholder="Company" /></td>
                <td><select value={uc.role} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, role: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>PI</option><option>Co-PI</option><option>Team Member</option></select></td>
                <td><TextInput value={uc.deliverableType} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, deliverableType: v } : x) } }))} disabled={isReadOnly} placeholder="Prototype" /></td>
                <td><TextInput value={uc.implementationPeriod} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, implementationPeriod: v } : x) } }))} disabled={isReadOnly} placeholder="Jan–Dec 2025" /></td>
                <td><select value={uc.status} onChange={(e) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, status: e.target.value as any } : x) } }))} disabled={isReadOnly} className="text-xs border rounded p-1"><option>Completed</option><option>Implemented</option></select></td>
                <td>
                  <div className="flex items-center gap-1">
                    <TextInput value={uc.proofUrl} onChange={(v) => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.map((x) => x.id === uc.id ? { ...x, proofUrl: v } : x) } }))} disabled={isReadOnly} placeholder="Drive link / NA" />
                    {!isReadOnly && <button onClick={() => setData((d) => ({ ...d, cat3: { ...d.cat3, industryUseCases: d.cat3.industryUseCases.filter((x) => x.id !== uc.id) } }))} className="text-slate-300 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                </td>
              </tr>
            ))}
          />

          {/* Category III Live Dynamic Total Summary Row */}
          <div className="mt-6 pt-4 border-t border-slate-200 bg-amber-50/80 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
            <div>
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Category III Total Self Score (Research &amp; Contributions)</span>
              <p className="text-[13px] text-amber-700 font-medium">Dynamically calculated across publications, patents, consultancy &amp; projects</p>
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-lg border border-amber-200 shadow-xs">
              <span className="text-lg font-black text-amber-700">{cat3Self.toFixed(1)}</span>
              <span className="text-xs text-slate-500 font-bold">/ 190 Max Pts</span>
            </div>
          </div>

        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 5: DUTIES
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-duties"
          icon={<FileText className="w-4 h-4" />}
          title="5. Departmental & Institutional Duties"
          subtitle="Record past contributions and future role aspirations"
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contribution to Department from Date of Joining" required hint="Type NA if not applicable">
              <TextArea value={data.duties.pastDeptContributions} onChange={(v) => setData((d) => ({ ...d, duties: { ...d.duties, pastDeptContributions: v } }))} disabled={isReadOnly} placeholder="Lab In-Charge, NBA Coordinator... or NA" rows={4} />
            </Field>
            <Field label="Contribution to Institution from Date of Joining" required hint="Type NA if not applicable">
              <TextArea value={data.duties.pastInstContributions} onChange={(v) => setData((d) => ({ ...d, duties: { ...d.duties, pastInstContributions: v } }))} disabled={isReadOnly} placeholder="Committee Member, Exam Cell... or NA" rows={4} />
            </Field>
            <Field label="Departmental Role(s) You Wish to Undertake" required hint="Type NA if not applicable">
              <TextInput value={data.duties.futureDeptRolesWished} onChange={(v) => setData((d) => ({ ...d, duties: { ...d.duties, futureDeptRolesWished: v } }))} disabled={isReadOnly} placeholder="e.g. Research Lab Lead or NA" />
            </Field>
            <Field label="Institutional Role(s) You Wish to Undertake" required hint="Type NA if not applicable">
              <TextInput value={data.duties.futureInstRolesWished} onChange={(v) => setData((d) => ({ ...d, duties: { ...d.duties, futureInstRolesWished: v } }))} disabled={isReadOnly} placeholder="e.g. IIC Cell Lead or NA" />
            </Field>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            EXCEL REPLICA: OVERALL APPRAISAL SCORE SUMMARY & GRADE MATRIX
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-grand-summary"
          icon={<Award className="w-4 h-4 text-emerald-600" />}
          title="6. Overall Performance Score Summary & Grade Matrix (Excel API 2025 Sheet Replica)"
          subtitle="Comprehensive compilation of all Category scores, Maximum thresholds, and Final Institutional Grade"
        />

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold tracking-wide uppercase">Faculty Performance Form 2025 — Grand Performance Summary</h3>
              <p className="text-xs text-slate-300 mt-0.5">Faculty Name: {data.facultyName} ({data.empId}) &bull; Dept: {data.department}</p>
            </div>
            <button
              onClick={() => setSelectedGradeModal(calculateGrade(data.designation, totalSelfScore))}
              title="Click to view detailed Grade report & print"
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer hover:scale-105"
            >
              <span className="text-slate-400 font-medium">Assessment Grade:</span>
              <span className="font-extrabold text-amber-400 text-sm">
                {calculateGrade(data.designation, totalSelfScore)}
              </span>
            </button>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200">
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[13px] w-[50%]">Category Description</th>
                  <th className="px-4 py-3 font-bold text-slate-700 uppercase tracking-wider text-[13px] text-center">Maximum Points</th>
                  <th className="px-4 py-3 font-bold text-blue-700 uppercase tracking-wider text-[13px] text-center">Self-Score Gained ✎</th>
                  <th className="px-4 py-3 font-bold text-emerald-700 uppercase tracking-wider text-[13px] text-center">% Attained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    Category I: Teaching, Learning &amp; Evaluation Activities (Criteria 1.1 – 1.13)
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-600">110 Pts</td>
                  <td className="px-4 py-3 text-center font-extrabold text-blue-700 bg-blue-50/50">{cat1Self.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-600">{((cat1Self / 110) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    Category II: Co-Curricular, Extension &amp; Professional Related Activities (Criteria 2.1 – 2.11)
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-600">50 Pts</td>
                  <td className="px-4 py-3 text-center font-extrabold text-purple-700 bg-purple-50/50">{cat2Self.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-600">{((cat2Self / 50) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">
                    Category III: Research and Related Academic Contributions (Criteria 3.1 – 3.8)
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-600">190 Pts</td>
                  <td className="px-4 py-3 text-center font-extrabold text-amber-700 bg-amber-50/50">{cat3Self.toFixed(1)}</td>
                  <td className="px-4 py-3 text-center font-semibold text-slate-600">{((cat3Self / 190) * 100).toFixed(1)}%</td>
                </tr>
                <tr className="bg-emerald-50 border-t-2 border-emerald-300 font-extrabold text-emerald-950">
                  <td className="px-4 py-3.5 text-sm uppercase tracking-wide">
                    GRAND TOTAL SCORE (CATEGORIES I + II + III)
                  </td>
                  <td className="px-4 py-3.5 text-center text-sm font-black text-slate-800">350 Pts</td>
                  <td className="px-4 py-3.5 text-center text-base font-black text-emerald-700 bg-emerald-100/70">{totalSelfScore.toFixed(1)} / 350</td>
                  <td className="px-4 py-3.5 text-center text-sm font-black text-emerald-700">{((totalSelfScore / 350) * 100).toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Official Excel Grading Scale Box */}
          <div className="px-6 pb-6 pt-2">
            <div className="border border-slate-200 rounded-lg bg-slate-50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Official Faculty Performance Form 2025 Grade Qualification Parameters</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className={`p-3 rounded-xl border ${totalSelfScore >= 245 ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <p className="font-bold text-sm text-emerald-800">Grade A (&ge; 245 Pts)</p>
                  <p className="text-[11px] font-normal mt-0.5 text-emerald-700">&ge; 70% Overall Score — Outstanding Performance</p>
                </div>
                <div className={`p-3 rounded-xl border ${totalSelfScore >= 175 && totalSelfScore < 245 ? 'bg-amber-50 border-amber-200 text-amber-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <p className="font-bold text-sm text-amber-800">Grade B (175 – 244 Pts)</p>
                  <p className="text-[11px] font-normal mt-0.5 text-amber-700">50% – 69.9% Overall Score — Good / Satisfactory</p>
                </div>
                <div className={`p-3 rounded-xl border ${totalSelfScore < 175 ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold shadow-2xs' : 'bg-white border-slate-200 text-slate-600'}`}>
                  <p className="font-bold text-sm text-rose-800">Grade C (&lt; 175 Pts)</p>
                  <p className="text-[11px] font-normal mt-0.5 text-rose-700">&lt; 50% Overall Score — Needs Improvement / Revision</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            SECTION 7: UNDERTAKING & COMMITMENTS
        ════════════════════════════════════════════════════════════ */}
        <SectionHeader
          id="sec-undertaking"
          icon={<ClipboardCheck className="w-4 h-4" />}
          title="7. Commitment / Undertaking for Current Academic Year"
          subtitle="Targets for Upcoming Assessment Year 2026 & Compliance Declarations"
        />

        <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 mb-8 space-y-6">

          {/* 13 Annual Targets */}
          <div>
            <SubHeader title="6.1 Annual Commitment & Targets for Academic Year 2026" subtitle="Self-committed target goals to achieve during upcoming academic evaluation period" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="1. SCI Publications Target" hint="Target number of Web of Science / SCI papers to publish"><NumberInput value={data.undertaking.publicationsSci} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, publicationsSci: v } }))} disabled={isReadOnly} /></Field>
              <Field label="1. Scopus Publications Target" hint="Target number of Scopus indexed journal papers"><NumberInput value={data.undertaking.publicationsScopus} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, publicationsScopus: v } }))} disabled={isReadOnly} /></Field>
              <Field label="2. Funding Proposals to Submit as PI" hint="Target R&D proposals to submit to DST/SERB/ISRO"><NumberInput value={data.undertaking.proposalsToSubmit} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, proposalsToSubmit: v } }))} disabled={isReadOnly} /></Field>
              <Field label="2. Funding Projects to Get as PI" hint="Target funded research projects to be sanctioned"><NumberInput value={data.undertaking.proposalsToGet} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, proposalsToGet: v } }))} disabled={isReadOnly} /></Field>
              <Field label="3. Consultancy Min Amount (₹)" hint="Target consultancy revenue to generate (in Rupees)"><NumberInput value={data.undertaking.consultancyMinAmount} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, consultancyMinAmount: v } }))} disabled={isReadOnly} /></Field>
              <Field label="4. Patents to Publish" hint="Target number of patent applications to file/publish"><NumberInput value={data.undertaking.patentsPublish} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, patentsPublish: v } }))} disabled={isReadOnly} /></Field>
              <Field label="4. Patents to Get Granted" hint="Target number of patents to get officially granted"><NumberInput value={data.undertaking.patentsGrant} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, patentsGrant: v } }))} disabled={isReadOnly} /></Field>
              <Field label="5. Citation Target" hint="Target increase in total Google Scholar / Scopus citations"><NumberInput value={data.undertaking.citationsTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, citationsTarget: v } }))} disabled={isReadOnly} /></Field>
              <Field label="6. Top 25% (Q1) Citation Target" hint="Target citations for papers published in Q1 journals"><NumberInput value={data.undertaking.q1CitationsTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, q1CitationsTarget: v } }))} disabled={isReadOnly} /></Field>
              <Field label="7. Workshop / Conference to Organize" hint="Target workshops, FDPs or conferences to organize"><NumberInput value={data.undertaking.workshopsToOrganize} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, workshopsToOrganize: v } }))} disabled={isReadOnly} /></Field>
              <Field label="8. Industry Connect Outcomes Target" hint="Target MoUs, internships or industrial placements"><NumberInput value={data.undertaking.mouOutcomes} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, mouOutcomes: v } }))} disabled={isReadOnly} /></Field>
              <Field label="9. NPTEL Courses Target" hint="Target NPTEL 8/12 week courses to complete"><NumberInput value={data.undertaking.nptelTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, nptelTarget: v } }))} disabled={isReadOnly} /></Field>
              <Field label="10. Pursuing Ph.D. Target" hint="Target milestone if currently pursuing doctoral degree"><TextInput value={data.undertaking.pursuingPhdTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, pursuingPhdTarget: v } }))} disabled={isReadOnly} placeholder="Target status or NA" /></Field>
              <Field label="11. Ph.D. Guideship Target" hint="Target recognition as university Ph.D. supervisor"><TextInput value={data.undertaking.phdGuideshipTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, phdGuideshipTarget: v } }))} disabled={isReadOnly} placeholder="Target status or NA" /></Field>
              <Field label="12. Scholars Supervision (Part-Time)" hint="Target part-time Ph.D. scholars to guide"><NumberInput value={data.undertaking.scholarsPtTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, scholarsPtTarget: v } }))} disabled={isReadOnly} /></Field>
              <Field label="12. Scholars Supervision (Full-Time)" hint="Target full-time Ph.D. scholars to guide"><NumberInput value={data.undertaking.scholarsFtTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, scholarsFtTarget: v } }))} disabled={isReadOnly} /></Field>
              <Field label="13. Help in Admission Target" hint="Target number of student admissions facilitated"><NumberInput value={data.undertaking.admissionHelpTarget} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, admissionHelpTarget: v } }))} disabled={isReadOnly} /></Field>
            </div>
          </div>

          {/* Memos & Disciplinary Declaration */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <SubHeader title="6.2 Disciplinary & Compliance Declarations" />
            <div className="p-4 border border-slate-100 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-700">Have you been issued any memo in the year 2025 or earlier?</p>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="radio" name="memoRadio" disabled={isReadOnly} checked={opt === 'Yes' ? data.undertaking.memosIssued : !data.undertaking.memosIssued} onChange={() => setData((d) => ({ ...d, undertaking: { ...d.undertaking, memosIssued: opt === 'Yes' } }))} className="accent-blue-600" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
              {data.undertaking.memosIssued && (
                <Field label="Memo Date of Issue & Details">
                  <TextInput value={data.undertaking.memoDetails ?? ''} onChange={(v) => setData((d) => ({ ...d, undertaking: { ...d.undertaking, memoDetails: v } }))} disabled={isReadOnly} placeholder="Mention date of issue and enclose memo copy details..." />
                </Field>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700">Any disciplinary action taken against you by Higher Authorities in 2025?</p>
                <div className="flex gap-4">
                  {['Yes', 'No'].map((opt) => (
                    <label key={opt} className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input type="radio" name="discRadio" disabled={isReadOnly} checked={opt === 'Yes' ? data.undertaking.disciplinaryAction : !data.undertaking.disciplinaryAction} onChange={() => setData((d) => ({ ...d, undertaking: { ...d.undertaking, disciplinaryAction: opt === 'Yes' } }))} className="accent-blue-600" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Declaration Statement */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed italic">
            <strong>Faculty Confirmation &amp; Declaration:</strong> I hereby confirm that all details and documents relevant to my Annual Performance Appraisal Form submitted by me are true to the best of my knowledge and have been clarified and verified in my presence by the verifying team.
          </div>

        </div>

      </div>

      {/* ── Sticky Bottom Action Bar (Faculty Edit Mode Only) ── */}
      {!readOnly && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg">
          <div className="max-w-screen-xl mx-auto px-3 sm:px-6 min-h-[3.5rem] py-2 sm:py-0 flex flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <StatusBadge status={data.status} />
              <span className="hidden sm:inline">Last saved: {new Date(data.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium px-3 py-1.5 sm:py-2 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Download PDF / Print</span>
                <span className="sm:hidden">Print</span>
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isReadOnly}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-medium px-3 sm:px-4 py-1.5 sm:py-2 rounded-md border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={isReadOnly}
                className="flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-colors whitespace-nowrap"
              >
                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Submit for HOD Review</span>
                <span className="xs:hidden">Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Scoring Guide Modal Popup ── */}
      </div>{/* end scrollable form content */}
      <ScoringGuideModal isOpen={Boolean(guideKey)} onClose={() => setGuideKey(null)} guideKey={guideKey} />
      {selectedGradeModal && (
        <GradeDetailModal
          grade={selectedGradeModal}
          appraisals={SEED_APPRAISALS}
          onClose={() => setSelectedGradeModal(null)}
        />
      )}
    </div>
  );
};
