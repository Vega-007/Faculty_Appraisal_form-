import { supabase, isSupabaseConfigured } from './supabaseClient';
import { AppraisalRecord, MonthlyWindow, AuditLog, MockUser } from '@/types/appraisal';
import {
  MOCK_USERS,
  initialWindows,
  initialAuditLogs,
  initialAppraisals,
  createEmptyAppraisal,
  emptyGeneralDetails,
  emptyCat1,
  emptyCat2,
  emptyCat3,
  emptyDuties,
  emptyUndertaking,
  SEED_APPRAISALS,
} from './initialData';

/* ─── 1. AUTHENTICATION ───────────────────────────────────── */
export async function loginUser(empId: string, pass: string): Promise<MockUser | null> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('emp_id', empId.toUpperCase())
        .single();

      if (!error && data) {
        return {
          empId: data.emp_id,
          name: data.name,
          role: data.role,
          department: data.department,
          designation: data.designation,
          password: pass,
        };
      }
    } catch (e) {
      console.warn('Supabase auth query failed, falling back to mock authentication:', e);
    }
  }

  // Fallback to local mock data
  const user = MOCK_USERS.find(
    (u) => u.empId.toUpperCase() === empId.toUpperCase() && u.password === pass
  );
  return user || null;
}

/* ─── 2. MONTHLY WINDOWS ──────────────────────────────────── */
export async function fetchWindows(): Promise<MonthlyWindow[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('monthly_windows')
        .select('*')
        .order('opened_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map((w) => ({
          monthYear: w.month_year,
          isOpen: w.is_open,
          openedAt: w.opened_at,
          closedAt: w.closed_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase windows query failed, falling back to mock data:', e);
    }
  }
  return initialWindows;
}

export async function toggleWindowApi(monthYear: string, currentOpen: boolean): Promise<MonthlyWindow[]> {
  const nextState = !currentOpen;
  const closedAt = nextState ? null : new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase
        .from('monthly_windows')
        .update({ is_open: nextState, closed_at: closedAt })
        .eq('month_year', monthYear);

      return await fetchWindows();
    } catch (e) {
      console.warn('Supabase window toggle failed:', e);
    }
  }

  return initialWindows.map((w) =>
    w.monthYear === monthYear ? { ...w, isOpen: nextState, closedAt } : w
  );
}

/* ─── 3. APPRAISALS ───────────────────────────────────────── */
export async function fetchAppraisalsApi(): Promise<AppraisalRecord[]> {
  const validEmpIds = new Set(MOCK_USERS.map((u) => u.empId));

  // Initialize map with all 85 seed appraisals from Excel dataset
  const appraisalMap = new Map<string, AppraisalRecord>();
  SEED_APPRAISALS.forEach((rec) => {
    appraisalMap.set(rec.id, rec);
  });

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('appraisals').select('*');
      if (!error && data && data.length > 0) {
        const mapped = data.map(dbRecordToAppraisal);

        // Merge Supabase records for valid faculty into appraisalMap
        mapped.forEach((rec) => {
          if (validEmpIds.has(rec.empId)) {
            appraisalMap.set(rec.id, rec);
          }
        });

        // Purge stale legacy records not in MOCK_USERS from Supabase
        const staleIds = mapped
          .filter((rec) => !validEmpIds.has(rec.empId))
          .map((rec) => rec.id);
        if (staleIds.length > 0) {
          supabase
            .from('appraisals')
            .delete()
            .in('id', staleIds)
            .then(() => {
              console.log('Purged stale legacy appraisals from Supabase:', staleIds);
            });
        }
      }
    } catch (e) {
      console.warn('Supabase appraisals query failed, using local memory state:', e);
    }
  }

  return Array.from(appraisalMap.values());
}

export async function saveAppraisalApi(record: AppraisalRecord): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Ensure Profile exists in Supabase
      const { error: pErr } = await supabase.from('profiles').upsert(
        {
          emp_id: record.empId,
          name: record.facultyName,
          role: 'TEACHER',
          department: record.department,
          institution: record.institution || 'SRM IST',
          campus: record.campus || 'SRM Ramapuram Campus',
          designation: record.designation,
        },
        { onConflict: 'emp_id' }
      );
      if (pErr) console.error('Error upserting profile in Supabase:', pErr);

      // 2. Ensure Monthly Window exists in Supabase
      const { error: wErr } = await supabase.from('monthly_windows').upsert(
        {
          month_year: record.monthYear,
          is_open: true,
        },
        { onConflict: 'month_year' }
      );
      if (wErr) console.error('Error upserting window in Supabase:', wErr);

      // 3. Save Appraisal Record
      const dbPayload = appraisalToDbRecord(record);
      const { error: aErr } = await supabase.from('appraisals').upsert(dbPayload, { onConflict: 'id' });
      if (aErr) {
        console.error('Error saving appraisal to Supabase:', aErr);
      } else {
        console.log(`✅ Successfully saved appraisal [${record.id}] to Supabase!`);
      }
    } catch (e) {
      console.error('Supabase appraisal save exception:', e);
    }
  }
}

/* ─── 4. AUDIT LOGS ───────────────────────────────────────── */
export async function fetchAuditLogsApi(): Promise<AuditLog[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (!error && data) {
        return data.map((l) => ({
          id: l.id,
          timestamp: l.timestamp,
          performedBy: l.performed_by,
          role: l.role,
          action: l.action,
          details: l.details,
        }));
      }
    } catch (e) {
      console.warn('Supabase audit logs query failed:', e);
    }
  }
  return initialAuditLogs;
}

export async function logAuditEventApi(log: AuditLog): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('audit_logs').insert({
        id: log.id,
        timestamp: log.timestamp,
        performed_by: log.performedBy,
        role: log.role,
        action: log.action,
        details: log.details,
      });
    } catch (e) {
      console.warn('Supabase audit log insert failed:', e);
    }
  }
}

/* ─── HELPER MAPPERS ──────────────────────────────────────── */
function dbRecordToAppraisal(db: any): AppraisalRecord {
  const seed = SEED_APPRAISALS.find((s) => s.empId === db.emp_id) || SEED_APPRAISALS[0];
  const defaultGen = seed ? seed.generalDetails : emptyGeneralDetails(db.faculty_name, db.emp_id, db.department, db.designation);
  const defaultCat1 = seed ? seed.cat1 : emptyCat1();
  const defaultCat2 = seed ? seed.cat2 : emptyCat2();
  const defaultCat3 = seed ? seed.cat3 : emptyCat3();
  const defaultDuties = seed ? seed.duties : emptyDuties();
  const defaultUndertaking = seed ? seed.undertaking : emptyUndertaking();

  const rawGen = db.general_details || {};
  const mergedGen = { ...defaultGen, ...rawGen };
  if (!mergedGen.teachingExperience || mergedGen.teachingExperience.length === 0) {
    mergedGen.teachingExperience = defaultGen.teachingExperience;
  }
  if (!mergedGen.industryExperience || mergedGen.industryExperience.length === 0) {
    mergedGen.industryExperience = defaultGen.industryExperience;
  }
  if (!mergedGen.communicationAddress) {
    mergedGen.communicationAddress = defaultGen.communicationAddress || 'Department of Computer Science, SRM Institute of Science & Technology, Chennai';
  }
  if (!mergedGen.residentialAddress) {
    mergedGen.residentialAddress = defaultGen.residentialAddress || 'No 45, Campus Green Avenue, Ramapuram, Chennai - 600089';
  }
  if (!mergedGen.academicCourseResults || mergedGen.academicCourseResults.length === 0) {
    mergedGen.academicCourseResults = defaultGen.academicCourseResults;
  }

  const rawCat1 = db.cat1 || {};
  const mergedCat1 = { ...defaultCat1, ...rawCat1 };
  (
    [
      'teachingLoadTable', 'learningMaterialsTable', 'innovativePedagogyTable', 'slowLearnersTable',
      'examDutiesTable', 'moocTable', 'nptelTable', 'certificationsTable', 'examResultsTable',
      'copoTable', 'industryConnectTable', 'studentCompetitionsTable', 'studentStartupsTable', 'deptContributionsTable'
    ] as const
  ).forEach((tbl) => {
    if (!mergedCat1[tbl] || mergedCat1[tbl].length === 0) {
      (mergedCat1 as any)[tbl] = (defaultCat1 as any)[tbl];
    }
  });

  const rawCat2 = db.cat2 || {};
  const mergedCat2 = { ...defaultCat2, ...rawCat2 };
  (
    [
      'communityServiceTable', 'professionCommitteesTable', 'workshopsWebinarsTable', 'fdpAttendedTable',
      'professionalMembershipsTable', 'eventsOrganizedTable', 'deliveredLecturesTable', 'brandBuildingTable', 'conferencePapersTable'
    ] as const
  ).forEach((tbl) => {
    if (!mergedCat2[tbl] || mergedCat2[tbl].length === 0) {
      (mergedCat2 as any)[tbl] = (defaultCat2 as any)[tbl];
    }
  });

  const rawCat3 = db.cat3 || {};
  const mergedCat3 = { ...defaultCat3, ...rawCat3 };
  (
    [
      'journals', 'citationsScopus', 'citationsQ1', 'consultancy', 'patents',
      'phdSupervisionTable', 'researchAwardsTable', 'fundedProjects', 'industryUseCases'
    ] as const
  ).forEach((tbl) => {
    if (!mergedCat3[tbl] || mergedCat3[tbl].length === 0) {
      (mergedCat3 as any)[tbl] = (defaultCat3 as any)[tbl];
    }
  });

  const rawDuties = db.duties || {};
  const mergedDuties = { ...defaultDuties, ...rawDuties };
  if (!mergedDuties.assignedDuties || mergedDuties.assignedDuties.length === 0) {
    mergedDuties.assignedDuties = defaultDuties.assignedDuties;
  }

  const rawUndertaking = db.undertaking || {};
  const mergedUndertaking = { ...defaultUndertaking, ...rawUndertaking };
  if (!mergedUndertaking.lastYearCompliance || mergedUndertaking.lastYearCompliance.length === 0) {
    mergedUndertaking.lastYearCompliance = defaultUndertaking.lastYearCompliance;
  }

  return {
    id: db.id,
    facultyId: db.faculty_id,
    facultyName: db.faculty_name,
    empId: db.emp_id,
    department: db.department,
    institution: db.institution || 'SRM IST',
    campus: db.campus || 'SRM Ramapuram Campus',
    designation: db.designation,
    monthYear: db.month_year,
    status: db.status,
    generalDetails: mergedGen,
    cat1: mergedCat1,
    cat2: mergedCat2,
    cat3: mergedCat3,
    duties: mergedDuties,
    undertaking: mergedUndertaking,
    selfScoreTotal: Number(db.self_score_total || mergedCat1.totalSelfScore + mergedCat2.totalSelfScore + mergedCat3.totalSelfScore || 268),
    hodScoreTotal: Number(db.hod_score_total || mergedCat1.totalHodScore + mergedCat2.totalHodScore + mergedCat3.totalHodScore || 268),
    hoiScoreTotal: Number(db.hoi_score_total || db.hod_score_total || 268),
    grade: db.grade || 'Grade A',
    hodRemarks: db.hod_remarks || 'Verified all academic and research metrics.',
    hoiRemarks: db.hoi_remarks || 'Approved for Grade A performance.',
    revisionFlags: db.revision_flags || [],
    revisionRemarks: db.revision_remarks || '',
    appraisalAccessEnabled: db.appraisal_access_enabled !== undefined ? db.appraisal_access_enabled : true,
    customFields: db.custom_fields || { naac_score: 92, nirf_weightage: 18, scopus_h_index: 8 },
    updatedAt: db.updated_at,
  };
}

function appraisalToDbRecord(rec: AppraisalRecord): any {
  const safeDesignation = (rec.designation && rec.designation.includes('HOD')) ? 'Professor' : (rec.designation || 'Assistant Professor');

  return {
    id: rec.id,
    faculty_id: rec.empId,
    emp_id: rec.empId,
    faculty_name: rec.facultyName,
    department: rec.department,
    institution: rec.institution || 'SRM IST',
    campus: rec.campus || 'SRM Ramapuram Campus',
    designation: safeDesignation,
    month_year: rec.monthYear,
    status: rec.status,
    general_details: rec.generalDetails,
    cat1: rec.cat1,
    cat2: rec.cat2,
    cat3: rec.cat3,
    duties: rec.duties,
    undertaking: rec.undertaking,
    self_score_total: rec.selfScoreTotal,
    hod_score_total: rec.hodScoreTotal,
    hoi_score_total: rec.hoiScoreTotal ?? rec.hodScoreTotal,
    grade: rec.grade,
    hod_remarks: rec.hodRemarks,
    hoi_remarks: rec.hoiRemarks,
    revision_flags: rec.revisionFlags || [],
    revision_remarks: rec.revisionRemarks || '',
    appraisal_access_enabled: rec.appraisalAccessEnabled !== undefined ? rec.appraisalAccessEnabled : true,
    custom_fields: rec.customFields || {},
    updated_at: rec.updatedAt,
  };
}
