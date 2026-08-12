import {
  AppraisalRecord,
  GeneralDetails,
  CategoryIScores,
  CategoryIIScores,
  CategoryIIIScores,
  DepartmentalDuties,
  UndertakingCommitment,
  Designation,
  MonthlyWindow,
  AuditLog,
  MockUser,
} from '@/types/appraisal';

import { SchemaCriterion } from '@/types/appraisal';
import { MOCK_USERS, SEED_APPRAISALS } from './mockSeedData';

export { MOCK_USERS, SEED_APPRAISALS };

export const DEFAULT_SCHEMA_CRITERIA: SchemaCriterion[] = [
  // Category I
  { id: 'cat1.teachingLoad', category: 'cat1', label: '1.1 Teaching Load Compliance', description: 'L-T-P-R teaching load fulfillment', maxScore: 10, isRequired: true, isLocked: false },
  { id: 'cat1.eContent', category: 'cat1', label: '1.2 E-Content / Textbooks', description: 'Development of digital learning resources', maxScore: 10, isRequired: false, isLocked: false },
  { id: 'cat1.innovativePedagogy', category: 'cat1', label: '1.3 Innovative Pedagogies', description: 'Flipped classroom, PBL, active learning', maxScore: 15, isRequired: true, isLocked: false },
  { id: 'cat1.remedialTeaching', category: 'cat1', label: '1.4 Remedial Teaching', description: 'Classes for slow learners', maxScore: 5, isRequired: false, isLocked: false },
  { id: 'cat1.examDuties', category: 'cat1', label: '1.5 End-Sem Exam Duties', maxScore: 5, description: 'Invigilation, scrutiny, evaluation', isRequired: true, isLocked: false },
  { id: 'cat1.moocDevelopment', category: 'cat1', label: '1.6 MOOC Development', maxScore: 10, description: 'SWAYAM/NPTEL module creation', isRequired: false, isLocked: false },
  { id: 'cat1.nptelCompletion', category: 'cat1', label: '1.7 NPTEL Course Completion', maxScore: 10, description: 'Certification course completion', isRequired: false, isLocked: false },
  { id: 'cat1.certifications', category: 'cat1', label: '1.8 Industry Certifications', maxScore: 5, description: 'Professional industry credentials', isRequired: false, isLocked: false },
  { id: 'cat1.examResults', category: 'cat1', label: '1.9 Avg Exam Pass Percentage', maxScore: 5, description: 'Course pass percentage performance', isRequired: true, isLocked: false },
  { id: 'cat1.copoAttainment', category: 'cat1', label: '1.10 CO-PO Attainment', maxScore: 5, description: 'Course outcome attainment level', isRequired: true, isLocked: false },
  { id: 'cat1.industryConnect', category: 'cat1', label: '1.11 Industry Connect & MoUs', maxScore: 10, description: 'Corporate linkages and MoUs signed', isRequired: false, isLocked: false },
  { id: 'cat1.studentGuiding', category: 'cat1', label: '1.12 Guiding Student Competitions', maxScore: 10, description: 'Hackathons & design contests', isRequired: false, isLocked: false },
  { id: 'cat1.deptContribution', category: 'cat1', label: '1.13 Departmental Contribution', maxScore: 10, description: 'NBA/NAAC co-convenership & roles', isRequired: true, isLocked: false },

  // Category II
  { id: 'cat2.communityService', category: 'cat2', label: '2.1 Community Service', maxScore: 5, description: 'NSS/NCC/Extension activities', isRequired: false, isLocked: false },
  { id: 'cat2.professionCommittees', category: 'cat2', label: '2.2 Professional Committees', maxScore: 5, description: 'IEEE/ACM/CSI committee roles', isRequired: false, isLocked: false },
  { id: 'cat2.workshopsWebinars', category: 'cat2', label: '2.3 Workshops / Webinars', maxScore: 5, description: 'Participation in national workshops', isRequired: false, isLocked: false },
  { id: 'cat2.fdpAttended', category: 'cat2', label: '2.4 FDP / Training Programs', maxScore: 5, description: 'Faculty development programs', isRequired: true, isLocked: false },
  { id: 'cat2.professionalMemberships', category: 'cat2', label: '2.5 Professional Memberships', maxScore: 5, description: 'Life membership in societies', isRequired: false, isLocked: false },
  { id: 'cat2.intlEventsOrganized', category: 'cat2', label: '2.6 International Events', maxScore: 5, description: 'Organizing intl conferences', isRequired: false, isLocked: false },
  { id: 'cat2.natlEventsOrganized', category: 'cat2', label: '2.7 National Events', maxScore: 3, description: 'Organizing national symposia', isRequired: false, isLocked: false },
  { id: 'cat2.stateEventsOrganized', category: 'cat2', label: '2.8 State / College Events', maxScore: 2, description: 'Department technical fests', isRequired: false, isLocked: false },
  { id: 'cat2.lecturesChaired', category: 'cat2', label: '2.9 Keynote Lectures / Chair', maxScore: 5, description: 'Session chair / invited talks', isRequired: false, isLocked: false },
  { id: 'cat2.brandBuilding', category: 'cat2', label: '2.10 Brand Building & Outreach', maxScore: 5, description: 'Institutional branding & PR', isRequired: false, isLocked: false },
  { id: 'cat2.conferencePapers', category: 'cat2', label: '2.11 Conference Papers', maxScore: 5, description: 'IEEE/Springer conference papers', isRequired: false, isLocked: false },

  // Category III
  { id: 'cat3.journals', category: 'cat3', label: '3.1 Journal Publications (SCI/Scopus)', maxScore: 60, description: 'Peer-reviewed indexed journals', isRequired: true, isLocked: false },
  { id: 'cat3.citationsScopus', category: 'cat3', label: '3.2 Scopus Citations', maxScore: 25, description: 'Citations count in Scopus', isRequired: false, isLocked: false },
  { id: 'cat3.citationsQ1', category: 'cat3', label: '3.3 Q1 Citations', maxScore: 25, description: 'Citations in Q1 top journals', isRequired: false, isLocked: false },
  { id: 'cat3.consultancy', category: 'cat3', label: '3.4 Consultancy Projects', maxScore: 20, description: 'Industry consultancy revenue', isRequired: false, isLocked: false },
  { id: 'cat3.patents', category: 'cat3', label: '3.5 Patents Published / Granted', maxScore: 20, description: 'Intellectual property filings', isRequired: false, isLocked: false },
  { id: 'cat3.phdSupervisionTable', category: 'cat3', label: '3.6 PhD Supervision', maxScore: 15, description: 'Supervising PT/FT scholars', isRequired: false, isLocked: false },
  { id: 'cat3.researchAwardsTable', category: 'cat3', label: '3.7 Research & Academic Awards', maxScore: 10, description: 'National/State awards received', isRequired: false, isLocked: false },
  { id: 'cat3.fundedProjects', category: 'cat3', label: '3.8 Sponsored Grants & Funded Projects', maxScore: 15, description: 'External research funding', isRequired: false, isLocked: false },
];

/* ─── Monthly Submission Windows ─────────────────────────── */
export const initialWindows: MonthlyWindow[] = [
  {
    monthYear: 'January 2026',
    isOpen: true,
    openedAt: '2026-01-01T00:00:00Z',
    closedAt: null,
  },
  {
    monthYear: 'December 2025',
    isOpen: false,
    openedAt: '2025-12-01T00:00:00Z',
    closedAt: '2025-12-31T23:59:59Z',
  },
  {
    monthYear: 'November 2025',
    isOpen: false,
    openedAt: '2025-11-01T00:00:00Z',
    closedAt: '2025-11-30T23:59:59Z',
  },
];

/* ─── Empty General Details ──────────────────────────────── */
export function emptyGeneralDetails(
  facultyName: string,
  facultyId: string,
  department: string,
  designation: Designation | string,
  reportingHodName?: string
): GeneralDetails {
  const seedGen = SEED_APPRAISALS[0].generalDetails;
  return {
    ...seedGen,
    facultyName,
    facultyId,
    department,
    designationAtJoining: designation as Designation,
    presentDesignation: designation as Designation,
    officialEmail: `${facultyId.toLowerCase()}@srmist.edu.in`,
    personalEmail: `${facultyId.toLowerCase()}@gmail.com`,
    reportingHodName: reportingHodName || seedGen.reportingHodName || '',
  };
}

/* ─── Empty Category I Scores & Tables ───────────────────── */
export function emptyCat1(): CategoryIScores {
  return { ...SEED_APPRAISALS[0].cat1 };
}

/* ─── Empty Category II Scores & Tables ──────────────────── */
export function emptyCat2(): CategoryIIScores {
  return { ...SEED_APPRAISALS[0].cat2 };
}

/* ─── Empty Category III Scores & Tables ─────────────────── */
export function emptyCat3(): CategoryIIIScores {
  return { ...SEED_APPRAISALS[0].cat3 };
}

export function emptyDuties(): DepartmentalDuties {
  return { ...SEED_APPRAISALS[0].duties };
}

export function emptyUndertaking(): UndertakingCommitment {
  return { ...SEED_APPRAISALS[0].undertaking };
}

/* ─── Factory: Blank Appraisal Record ────────────────────── */
export function createEmptyAppraisal(
  empId: string,
  facultyName: string,
  department: string,
  designation: Designation | string,
  monthYear: string,
  institution: string = 'SRM IST',
  campus: string = 'SRM Ramapuram Campus',
  reportingHodName?: string
): AppraisalRecord {
  return {
    id: `appr-${empId}-${monthYear.replace(/\s+/g, '-').toLowerCase()}`,
    facultyId: empId,
    facultyName,
    empId,
    department,
    institution,
    campus,
    designation: designation as Designation,
    monthYear,
    status: 'DRAFT',
    generalDetails: emptyGeneralDetails(facultyName, empId, department, designation, reportingHodName),
    cat1: emptyCat1(),
    cat2: emptyCat2(),
    cat3: emptyCat3(),
    duties: emptyDuties(),
    undertaking: emptyUndertaking(),
    selfScoreTotal: 0,
    hodScoreTotal: 0,
    hoiScoreTotal: 0,
    grade: 'Grade C',
    hodRemarks: '',
    hoiRemarks: '',
    revisionFlags: [],
    revisionRemarks: '',
    appraisalAccessEnabled: true,
    customFields: {},
    updatedAt: new Date().toISOString(),
  };
}

export const initialAppraisals: AppraisalRecord[] = SEED_APPRAISALS;
export const initialAuditLogs: AuditLog[] = [];
