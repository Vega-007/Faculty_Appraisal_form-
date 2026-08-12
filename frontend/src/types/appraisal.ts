export type UserRole = 'ADMIN_CHAIRMAN' | 'HOI' | 'HOD' | 'TEACHER';

export type Designation = 'Assistant Professor' | 'Associate Professor' | 'Professor' | 'Head of Department(HOD)';

export type GradeType = 'Grade A' | 'Grade B' | 'Grade C';

export type AppraisalStatus = 'DRAFT' | 'SUBMITTED' | 'HOD_APPROVED' | 'HOI_APPROVED' | 'LOCKED';

export interface MonthlyWindow {
  monthYear: string;
  isOpen: boolean;
  openedAt: string;
  closedAt: string | null;
}

/* ─── General Details & Profile (API 2025 Sheet) ────────── */
export interface TeachingExperienceEntry {
  id: string;
  institutionName: string;
  designation: string;
  periodFrom: string;
  periodTo: string;
  durationYearsMonths: string;
}

export interface IndustryExperienceEntry {
  id: string;
  industryName: string;
  designation: string;
  periodFrom: string;
  periodTo: string;
  durationYearsMonths: string;
}

export interface LeaveDetails {
  calendarYear: string;
  workingDays: number;
  cl: number;
  el: number;
  ml: number;
  lop: number;
  vl: number;
  totalLeaveAvailed: number;
  onDutyAvailed: number;
  effectiveAttendance: number;
  attendancePercentage: number;
}

export interface AcademicCourseResultEntry {
  id: string;
  courseCodeName: string;
  ugPg: 'UG' | 'PG';
  yearDegreeBranch: string;
  noOfStudents: number;
  monthYearExam: string;
  passPercentage: number;
}

export interface MentoringSupportDetails {
  studentsAllotted: number;
  slowLearnersIdentified: number;
  top10Performers: number;
  nilArrears: number;
  moreThan2Arrears: number;
  coachingClassAllotted: number;
  coachingAvgAttendancePct: number;
  eligiblePlacement: number;
  participatedCompetitions: number;
  wonPrizeCompetitions: number;
  placedAsOnDate: number;
  higherStudiesOrEntrepreneur: number;
  counselingSessionsNos: number;
  parentCommunicationCount: number;
  outcomeOfMentoring: string;
  actionPlanAcademicImprovement: string;
  actionPlanPlacementImprovement: string;
}

export interface PhDSupervisionProfile {
  status: 'Completed' | 'Pursuing' | 'Not Registered';
  universityOrInstitution: string;
  probableCompletionYear: string;
  guideshipRecognized: boolean;
  universityRecognizedBy: string;
  specializationArea: string;
  ongoingScholarsPT: number;
  ongoingScholarsFT: number;
  completedScholars: number;
}

export interface IndustryCollaborationDetails {
  industriesIdentified: number;
  industriesContacted: number;
  convertedToCollaboration: number;
  studentsPlacedConnect: number;
  internshipsWithStipend: number;
  internshipsWithoutStipend: number;
  liveProjectsInvolved: number;
}

export interface GeneralDetails {
  institutionName: string;
  facultyName: string;
  facultyId: string;
  qualifications: string;
  department: string;
  dateOfJoining: string;
  designationAtJoining: string;
  presentDesignation: Designation;
  mobileNumber: string;
  officialEmail: string;
  personalEmail: string;
  googleScholarUrl: string;
  scopusAuthorId: string;
  orcidId: string;
  reportingHodName: string;
  reportingDeanName: string;
  residentialAddress: string;
  communicationAddress: string;
  teachingExperience: TeachingExperienceEntry[];
  industryExperience: IndustryExperienceEntry[];
  leaveDetails: LeaveDetails;
  academicCourseResults: AcademicCourseResultEntry[];
  mentoring: MentoringSupportDetails;
  phdProfile: PhDSupervisionProfile;
  industryCollab: IndustryCollaborationDetails;
}

/* ─── Category I Entries (CATEGORY I Sheet) ──────────────── */
export interface TeachingLoadEntry {
  id: string;
  semesterType: 'ODD' | 'EVEN';
  courseCode: string;
  courseName: string;
  assignedL: number;
  assignedT: number;
  assignedP: number;
  assignedR: number;
  taughtL: number;
  taughtT: number;
  taughtP: number;
  taughtR: number;
  proofUrl: string;
}

export interface LearningMaterialEntry {
  id: string;
  materialType: string; // E-content 4 quadrant, Workbook, Model, etc.
  courseTitle: string;
  courseContent: string;
  proofUrl: string;
}

export interface InnovativePedagogyEntry {
  id: string;
  courseTitle: string;
  topicUnit: string;
  approachAdopted: string;
  inOrOutClass: 'InClass' | 'Outside Class';
  activityName: string;
  semester: string;
  proofUrl: string;
}

export interface SlowLearnerSupportEntry {
  id: string;
  courseTitle: string;
  semester: string;
  noOfSlowLearners: number;
  pedagogyAdopted: string;
  remedialMaterialsDeveloped: boolean;
  noClearedExam: number;
  proofUrl: string;
}

export interface ExamDutyEntry {
  id: string;
  semester: string;
  invigilationAssigned: number;
  invigilationCompleted: number;
  qpScrutinyAssigned: number;
  qpScrutinyCompleted: number;
  qpSettingAssigned: number;
  qpSettingCompleted: number;
  evaluationAssigned: number;
  evaluationCompleted: number;
  squadAssigned: number;
  squadCompleted: number;
  proofUrl: string;
}

export interface MoocDevelopmentEntry {
  id: string;
  courseType: 'Full Course (>=30 hrs)' | 'Micro-credential (10-30 hrs)';
  courseTitle: string;
  platform: string;
  duration: string;
  intendedStudents: string;
  publishedDate: string;
  learnersEnrolled: number;
  proofUrl: string;
}

export interface NptelEntry {
  id: string;
  researchArea: string;
  courseTitle: string;
  partOfCurriculum: boolean;
  purpose: string;
  durationWeeks: number;
  resultCategory: 'Topper' | 'Elite+Gold' | 'Elite+Silver' | 'Elite' | 'Pass';
  completionDate: string;
  proofUrl: string;
}

export interface ProfessionalCertificationEntry {
  id: string;
  researchArea: string;
  certificationTitle: string;
  offeredByIndustry: boolean;
  industryName: string;
  purpose: string;
  durationWeeks: number;
  platform: string;
  completionDate: string;
  proofUrl: string;
}

export interface EndSemResultEntry {
  id: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  studentsAppeared: number;
  studentsPassed: number;
  passPercentage: number;
  proofUrl: string;
}

export interface CoPoAttainmentEntry {
  id: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  courseType: 'Theory' | 'Lab';
  co1: number;
  co2: number;
  co3: number;
  co4: number;
  co5: number;
  actionPlan: string;
  proofUrl: string;
}

export interface IndustryConnectEntry {
  id: string;
  industryName: string;
  location: string;
  connectType: 'Placement' | 'Stipend Internship' | 'Internship' | 'Research Usecase';
  date: string;
  mouSigned: boolean;
  coeEstablished: boolean;
  stipendInternshipsCount: number;
  nonStipendInternshipsCount: number;
  studentsPlacedCount: number;
  useCasesCount: number;
  proofUrl: string;
}

export interface StudentDesignCompetitionEntry {
  id: string;
  competitionName: string;
  contestType: string;
  organizingBody: string;
  level: 'Institutional' | 'State' | 'National' | 'International';
  studentsInvolved: string;
  contestDate: string;
  outcome: string;
  proofUrl: string;
}

export interface StudentStartupProjectEntry {
  id: string;
  projectTitle: string;
  studentsInvolved: string;
  startupStage: string;
  submissionDate: string;
  registrationDate: string;
  fundingDate: string;
  commercializationDate: string;
  proofUrl: string;
}

export interface DeptInstContributionEntry {
  id: string;
  roleName: string;
  levelOfResponsibility: 'Department' | 'Institution';
  responsibilities: string;
  significantOutcomes: string;
  proofUrl: string;
}

export interface CategoryIScores {
  teachingLoad: { selfScore: number; hodScore: number; proofUrl: string };
  eContent: { selfScore: number; hodScore: number; proofUrl: string };
  innovativePedagogy: { selfScore: number; hodScore: number; proofUrl: string };
  remedialTeaching: { selfScore: number; hodScore: number; proofUrl: string };
  examDuties: { selfScore: number; hodScore: number; proofUrl: string };
  moocDevelopment: { selfScore: number; hodScore: number; proofUrl: string };
  nptelCompletion: { selfScore: number; hodScore: number; proofUrl: string };
  certifications: { selfScore: number; hodScore: number; proofUrl: string };
  examResults: { selfScore: number; hodScore: number; proofUrl: string };
  copoAttainment: { selfScore: number; hodScore: number; proofUrl: string };
  industryConnect: { selfScore: number; hodScore: number; proofUrl: string };
  studentGuiding: { selfScore: number; hodScore: number; proofUrl: string };
  deptContribution: { selfScore: number; hodScore: number; proofUrl: string };
  // Detailed Tables
  teachingLoadTable: TeachingLoadEntry[];
  learningMaterialsTable: LearningMaterialEntry[];
  innovativePedagogyTable: InnovativePedagogyEntry[];
  slowLearnersTable: SlowLearnerSupportEntry[];
  examDutiesTable: ExamDutyEntry[];
  moocTable: MoocDevelopmentEntry[];
  nptelTable: NptelEntry[];
  certificationsTable: ProfessionalCertificationEntry[];
  examResultsTable: EndSemResultEntry[];
  copoTable: CoPoAttainmentEntry[];
  industryConnectTable: IndustryConnectEntry[];
  studentCompetitionsTable: StudentDesignCompetitionEntry[];
  studentStartupsTable: StudentStartupProjectEntry[];
  deptContributionsTable: DeptInstContributionEntry[];
  totalSelfScore: number;
  totalHodScore: number;
}

/* ─── Category II Entries (CATEGORY II Sheet) ─────────────── */
export interface CommunityServiceEntry {
  id: string;
  activityTitle: string;
  organizingBody: string;
  date: string;
  venue: string;
  noOfStudents: number;
  roleOfFaculty: string;
  proofUrl: string;
}

export interface ProfessionCommitteeEntry {
  id: string;
  committeeName: string;
  level: 'International' | 'National' | 'State';
  positionRole: string;
  durationFromTo: string;
  proofUrl: string;
}

export interface WorkshopSeminarEntry {
  id: string;
  eventType: 'Workshop' | 'Seminar' | 'Webinar';
  eventTitle: string;
  date: string;
  mode: 'Online' | 'Offline';
  organizedBy: string;
  duration: string;
  proofUrl: string;
}

export interface FdpAttendedEntry {
  id: string;
  programType: string;
  programTitle: string;
  organizingInstitution: string;
  durationDays: number;
  dates: string;
  mode: 'Online' | 'Offline';
  proofUrl: string;
}

export interface ProfessionalMembershipEntry {
  id: string;
  societyName: string;
  membershipType: 'Life' | 'Annual' | 'Fellow' | 'Senior Member';
  membershipNumber: string;
  level: 'International' | 'National' | 'State';
  validityYear: string;
  proofUrl: string;
}

export interface EventOrganizedEntry {
  id: string;
  eventType: string;
  eventTitle: string;
  organizedBy: string;
  date: string;
  role: 'Coordinator' | 'Co-coordinator' | 'Committee Member';
  level: 'International' | 'National' | 'State' | 'College';
  noOfParticipants: number;
  proofUrl: string;
}

export interface DeliveredLectureEntry {
  id: string;
  eventType: string;
  lectureTitle: string;
  organizedBy: string;
  date: string;
  level: 'International' | 'National' | 'State' | 'College';
  role: 'Keynote Speaker' | 'Session Chair' | 'Resource Person' | 'Jury Member';
  mode: 'Online' | 'Offline';
  proofUrl: string;
}

export interface BrandBuildingEntry {
  id: string;
  activityType: string;
  activityTitle: string;
  organizedBy: string;
  date: string;
  venue: string;
  role: 'Coordinator' | 'Committee Member';
  noOfBeneficiaries: number;
  proofUrl: string;
}

export interface ConferencePaperEntry {
  id: string;
  conferenceName: string;
  paperTitle: string;
  organizedBy: string;
  date: string;
  level: 'International' | 'National';
  venue: string;
  proceedingsDetails: string;
  proofUrl: string;
}

export interface CategoryIIScores {
  communityService: { selfScore: number; hodScore: number; proofUrl: string };
  professionCommittees: { selfScore: number; hodScore: number; proofUrl: string };
  workshopsWebinars: { selfScore: number; hodScore: number; proofUrl: string };
  fdpAttended: { selfScore: number; hodScore: number; proofUrl: string };
  professionalMemberships: { selfScore: number; hodScore: number; proofUrl: string };
  intlEventsOrganized: { selfScore: number; hodScore: number; proofUrl: string };
  natlEventsOrganized: { selfScore: number; hodScore: number; proofUrl: string };
  stateEventsOrganized: { selfScore: number; hodScore: number; proofUrl: string };
  lecturesChaired: { selfScore: number; hodScore: number; proofUrl: string };
  brandBuilding: { selfScore: number; hodScore: number; proofUrl: string };
  conferencePapers: { selfScore: number; hodScore: number; proofUrl: string };
  // Detailed Tables
  communityServiceTable: CommunityServiceEntry[];
  professionCommitteesTable: ProfessionCommitteeEntry[];
  workshopsWebinarsTable: WorkshopSeminarEntry[];
  fdpAttendedTable: FdpAttendedEntry[];
  professionalMembershipsTable: ProfessionalMembershipEntry[];
  eventsOrganizedTable: EventOrganizedEntry[];
  deliveredLecturesTable: DeliveredLectureEntry[];
  brandBuildingTable: BrandBuildingEntry[];
  conferencePapersTable: ConferencePaperEntry[];
  totalSelfScore: number;
  totalHodScore: number;
}

/* ─── Category III Entries (Category III Sheet) ──────────── */
export interface JournalPublicationEntry {
  id: string;
  title: string;
  journalName: string;
  indexing: 'SCI' | 'Scopus' | 'Other';
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'None';
  authorPosition: 'First' | 'Corresponding' | 'Supervisor' | 'Other';
  numberOfAuthors: number;
  doiLink: string;
  proofUrl: string;
  calculatedScore: number;
}

export interface CitationEntry {
  id: string;
  paperTitle: string;
  journal: string;
  year: number;
  citationCount: number;
  selfCitationsRemoved: boolean;
  hasInstitutionalAffiliation: boolean;
  proofUrl: string;
}

export interface CitationQ1Entry {
  id: string;
  paperTitle: string;
  journal: string;
  year: number;
  quartile: 'Q1';
  q1CitationCount: number;
  hasInstitutionalAffiliation: boolean;
  proofUrl: string;
}

export interface ConsultancyEntry {
  id: string;
  projectTitle: string;
  clientName: string;
  consultancyPeriod: string;
  amountReceived: number;
  institutionalAccountReceived: boolean;
  sanctionNo: string;
  proofUrl: string;
}

export interface PatentEntry {
  id: string;
  title: string;
  appNumber: string;
  status: 'Published' | 'Granted';
  inventorPosition: string;
  institutionalAffiliation: boolean;
  proofUrl: string;
}

export interface PhDSupervisionEntry {
  id: string;
  scholarName: string;
  researchTitle: string;
  role: 'Guide' | 'Co-Guide';
  status: 'Registered' | 'Graduated';
  mode: 'Full-Time' | 'Part-Time';
  yearRegGrad: string;
  yearCompletion: string;
  proofUrl: string;
}

export interface ResearchAwardEntry {
  id: string;
  awardTitle: string;
  organization: string;
  level: 'International' | 'National' | 'State';
  dateYear: string;
  category: 'Research Award' | 'Recognition' | 'Top 2% Scientists List';
  institutionalAffiliationMentioned: boolean;
  proofUrl: string;
}

export interface FundedProjectEntry {
  id: string;
  projectTitle: string;
  agency: string;
  role: 'PI' | 'Co-PI';
  status: 'Submitted' | 'Sanctioned';
  amountSanctioned: number;
  sanctionNoDate: string;
  duration: string;
  institutionalApproval: boolean;
  proofUrl: string;
}

export interface IndustryUseCaseEntry {
  id: string;
  title: string;
  partnerName: string;
  role: 'PI' | 'Co-PI' | 'Team Member';
  deliverableType: string;
  implementationPeriod: string;
  status: 'Completed' | 'Implemented';
  proofUrl: string;
}

export interface CategoryIIIScores {
  journals: JournalPublicationEntry[];
  citationsScopus: CitationEntry[];
  citationsQ1: CitationQ1Entry[];
  consultancy: ConsultancyEntry[];
  patents: PatentEntry[];
  phdSupervisionTable: PhDSupervisionEntry[];
  researchAwardsTable: ResearchAwardEntry[];
  fundedProjects: FundedProjectEntry[];
  industryUseCases: IndustryUseCaseEntry[];
  totalSelfScore: number;
  totalHodScore: number;
}

/* ─── Undertaking & Commitments ──────────────────────────── */
export interface LastYearComplianceEntry {
  id: string;
  undertakingGiven: string;
  status: string;
}

export interface UndertakingCommitment {
  publicationsSci: number;
  publicationsScopus: number;
  proposalsToSubmit: number;
  proposalsToGet: number;
  consultancyMinAmount: number;
  patentsPublish: number;
  patentsGrant: number;
  citationsTarget: number;
  q1CitationsTarget: number;
  workshopsToOrganize: number;
  mouOutcomes: number;
  nptelTarget: number;
  pursuingPhdTarget: string;
  phdGuideshipTarget: string;
  scholarsPtTarget: number;
  scholarsFtTarget: number;
  admissionHelpTarget: number;
  // Disciplinary / Memo
  memosIssued: boolean;
  memoDetails?: string;
  disciplinaryAction: boolean;
  // Last year compliance
  lastYearCompliance: LastYearComplianceEntry[];
}

export interface DepartmentalDuties {
  assignedDuties: string[];
  pastDeptContributions: string;
  pastInstContributions: string;
  futureDeptRolesWished: string;
  futureInstRolesWished: string;
}

export interface RevisionFlagItem {
  key: string;
  flaggedBy: 'HOD' | 'HOI';
  reason: string;
  originalSelfScore?: number;
  originalProofUrl?: string;
  updatedSelfScore?: number;
  updatedProofUrl?: string;
}

export type CampusName = 'SRM Ramapuram Campus' | 'SRM Trichy Campus';

export type InstitutionName =
  | 'SRM Institute of Science & Technology (SRMIST)'
  | 'Easwari Engineering College (EEC)'
  | 'SRM School of Environment, Architecture & Design (SEAD)'
  | 'SRMIST College of Science & Humanities (S&H)'
  | 'SRM Dental College & Hospital (SRMDC)'
  | 'SRM Prime Hospital (SPH)'
  | 'Easwari Engineering College'
  | 'SRM Dental College'
  | 'SRM IST'
  | 'SRM Trichy Engineering College'
  | 'SRM Trichy Medical College';

export interface CampusHierarchyNode {
  campus: CampusName;
  institutions: {
    name: InstitutionName;
    departments: string[];
  }[];
}

export const CAMPUS_HIERARCHY: CampusHierarchyNode[] = [
  {
    campus: 'SRM Ramapuram Campus',
    institutions: [
      {
        name: 'SRM Institute of Science & Technology (SRMIST)',
        departments: [
          'Computer Science & Engineering (CSE)',
          'Artificial Intelligence (AI)',
          'Electronics & Communication Engineering (ECE)',
          'Electrical & Electronics Engineering (EEE)',
          'Information Technology (IT)',
          'Biomedical Engineering (BME)',
          'Biotechnology',
          'Civil Engineering',
          'Mechanical Engineering',
          'Science & Humanities (S&H)',
          'Computer Science & Applications',
          'Commerce',
          'English',
          'Psychology',
          'Economics',
          'Media / Visual Communication',
          'Mathematics',
          'Physics',
          'Chemistry',
          'Management Studies',
        ],
      },
      {
        name: 'Easwari Engineering College (EEC)',
        departments: [
          'Computer Science & Engineering (CSE)',
          'Computer Science & Business Systems (CSBS)',
          'Information Technology (IT)',
          'Artificial Intelligence & Data Science (AI & DS)',
          'Artificial Intelligence & Machine Learning (AI & ML)',
          'Cyber Security',
          'Electronics & Communication Engineering (ECE)',
          'Electronics & Instrumentation Engineering (EIE)',
          'Electrical & Electronics Engineering (EEE)',
          'Biomedical Engineering (BME)',
          'Mechanical Engineering',
          'Automobile Engineering',
          'Civil Engineering',
          'Robotics & Automation',
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'Management Studies',
        ],
      },
      {
        name: 'SRM School of Environment, Architecture & Design (SEAD)',
        departments: ['Architecture', 'Design', 'Environment'],
      },
      {
        name: 'SRMIST College of Science & Humanities (S&H)',
        departments: [
          'Computer Science & Applications',
          'Commerce',
          'English',
          'Biotechnology',
          'Psychology',
          'Economics',
          'Media / Visual Communication',
          'Mathematics',
          'Physics',
          'Chemistry',
        ],
      },
      {
        name: 'SRM Dental College & Hospital (SRMDC)',
        departments: [
          'Conservative Dentistry & Endodontics',
          'Prosthodontics & Crown & Bridge',
          'Orthodontics & Dentofacial Orthopaedics',
          'Periodontology',
          'Oral & Maxillofacial Surgery',
          'Oral Medicine & Radiology',
          'Oral Pathology & Microbiology',
          'Pediatric & Preventive Dentistry',
          'Public Health Dentistry',
        ],
      },
      {
        name: 'SRM Prime Hospital (SPH)',
        departments: [
          'General Medicine',
          'General Surgery',
          'Orthopaedics',
          'Obstetrics & Gynaecology',
          'Paediatrics',
          'Radiology',
          'Anaesthesiology',
          'Emergency & Critical Care',
          'Pathology / Laboratory',
          'Dental',
        ],
      },
    ],
  },
  {
    campus: 'SRM Trichy Campus',
    institutions: [
      {
        name: 'SRM Trichy Engineering College',
        departments: [
          'Computer Science & Engineering (CSE)',
          'Electronics & Communication Engineering (ECE)',
          'Mechanical Engineering',
          'Civil Engineering',
        ],
      },
      {
        name: 'SRM Trichy Medical College',
        departments: ['General Medicine', 'General Surgery', 'Paediatrics', 'Anaesthesiology'],
      },
    ],
  },
];

export interface CustomMetricColumn {
  id: string;
  label: string;
  category: 'Research' | 'Academic' | 'Institutional';
  dataType: 'number' | 'text' | 'boolean';
  defaultValue: string | number;
}

export interface AppraisalRecord {
  id: string;
  facultyId: string;
  facultyName: string;
  empId: string;
  department: string;
  institution?: InstitutionName | string;
  campus?: CampusName | string;
  designation: Designation;
  monthYear: string;
  status: AppraisalStatus;
  generalDetails: GeneralDetails;
  cat1: CategoryIScores;
  cat2: CategoryIIScores;
  cat3: CategoryIIIScores;
  duties: DepartmentalDuties;
  undertaking: UndertakingCommitment;
  selfScoreTotal: number;
  hodScoreTotal: number;
  hoiScoreTotal?: number;
  grade: GradeType;
  hodRemarks?: string;
  hoiRemarks?: string;
  revisionFlags?: RevisionFlagItem[];
  revisionRemarks?: string;
  appraisalAccessEnabled?: boolean; // HOD Access Control Switchboard state
  customFields?: Record<string, string | number>; // Dynamic Custom Matrix fields
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  performedBy: string;
  role: UserRole;
  action: string;
  details: string;
}

export interface SchemaCriterion {
  id: string;
  category: 'cat1' | 'cat2' | 'cat3';
  label: string;
  description: string;
  maxScore: number;
  isRequired: boolean;
  isLocked: boolean;
  isCustom?: boolean;
}

export interface MockUser {
  empId: string;
  name: string;
  role: UserRole;
  department: string;
  institution?: InstitutionName | string;
  campus?: CampusName | string;
  designation: Designation;
  password: string;
  reportingHodName?: string;
  appraisalAccessEnabled?: boolean;
}
