import { CategoryIScores, CategoryIIScores, CategoryIIIScores, Designation, GradeType } from '@/types/appraisal';

/**
 * Calculates Category I self score and HOD score totals with max score caps.
 */
export function calculateCategory1(cat1?: CategoryIScores) {
  if (!cat1) return { selfTotal: 0, hodTotal: 0 };

  const selfTotal = Math.min(
    110,
    (cat1.teachingLoad?.selfScore ?? 0) +
      (cat1.eContent?.selfScore ?? 0) +
      (cat1.innovativePedagogy?.selfScore ?? 0) +
      (cat1.remedialTeaching?.selfScore ?? 0) +
      (cat1.examDuties?.selfScore ?? 0) +
      (cat1.moocDevelopment?.selfScore ?? 0) +
      (cat1.nptelCompletion?.selfScore ?? 0) +
      (cat1.certifications?.selfScore ?? 0) +
      (cat1.examResults?.selfScore ?? 0) +
      (cat1.copoAttainment?.selfScore ?? 0) +
      (cat1.industryConnect?.selfScore ?? 0) +
      (cat1.studentGuiding?.selfScore ?? 0) +
      (cat1.deptContribution?.selfScore ?? 0)
  );

  const hodTotal = Math.min(
    110,
    (cat1.teachingLoad?.hodScore ?? 0) +
      (cat1.eContent?.hodScore ?? 0) +
      (cat1.innovativePedagogy?.hodScore ?? 0) +
      (cat1.remedialTeaching?.hodScore ?? 0) +
      (cat1.examDuties?.hodScore ?? 0) +
      (cat1.moocDevelopment?.hodScore ?? 0) +
      (cat1.nptelCompletion?.hodScore ?? 0) +
      (cat1.certifications?.hodScore ?? 0) +
      (cat1.examResults?.hodScore ?? 0) +
      (cat1.copoAttainment?.hodScore ?? 0) +
      (cat1.industryConnect?.hodScore ?? 0) +
      (cat1.studentGuiding?.hodScore ?? 0) +
      (cat1.deptContribution?.hodScore ?? 0)
  );

  return { selfTotal, hodTotal };
}

/**
 * Calculates Category II self score and HOD score totals with max score caps.
 */
export function calculateCategory2(cat2?: CategoryIIScores) {
  if (!cat2) return { selfTotal: 0, hodTotal: 0 };

  const selfTotal = Math.min(
    50,
    (cat2.communityService?.selfScore ?? 0) +
      (cat2.professionCommittees?.selfScore ?? 0) +
      (cat2.workshopsWebinars?.selfScore ?? 0) +
      (cat2.fdpAttended?.selfScore ?? 0) +
      (cat2.professionalMemberships?.selfScore ?? 0) +
      (cat2.intlEventsOrganized?.selfScore ?? 0) +
      (cat2.natlEventsOrganized?.selfScore ?? 0) +
      (cat2.stateEventsOrganized?.selfScore ?? 0) +
      (cat2.lecturesChaired?.selfScore ?? 0) +
      (cat2.brandBuilding?.selfScore ?? 0) +
      (cat2.conferencePapers?.selfScore ?? 0)
  );

  const hodTotal = Math.min(
    50,
    (cat2.communityService?.hodScore ?? 0) +
      (cat2.professionCommittees?.hodScore ?? 0) +
      (cat2.workshopsWebinars?.hodScore ?? 0) +
      (cat2.fdpAttended?.hodScore ?? 0) +
      (cat2.professionalMemberships?.hodScore ?? 0) +
      (cat2.intlEventsOrganized?.hodScore ?? 0) +
      (cat2.natlEventsOrganized?.hodScore ?? 0) +
      (cat2.stateEventsOrganized?.hodScore ?? 0) +
      (cat2.lecturesChaired?.hodScore ?? 0) +
      (cat2.brandBuilding?.hodScore ?? 0) +
      (cat2.conferencePapers?.hodScore ?? 0)
  );

  return { selfTotal, hodTotal };
}

/**
 * Calculates Category III self score and HOD score totals with max score caps.
 */
export function calculateCategory3(cat3?: CategoryIIIScores) {
  if (!cat3) return { selfTotal: 0, hodTotal: 0 };

  // Journal calculation — only count rows with a paper title entered
  let journalScore = 0;
  (cat3.journals || []).forEach((j) => {
    if (!j?.title?.trim()) return; // skip empty/default rows
    let base = 5;
    if (j.indexing === 'SCI') {
      if (j.quartile === 'Q1') base = 15;
      else if (j.quartile === 'Q2') base = 10;
      else if (j.quartile === 'Q3' || j.quartile === 'Q4') base = 7.5;
      else base = 5;
    } else if (j.indexing === 'Scopus') {
      base = 5;
    } else {
      base = 2;
    }

    let score = base;
    if (j.authorPosition !== 'First' && j.authorPosition !== 'Corresponding' && j.authorPosition !== 'Supervisor') {
      score = base / Math.max(1, j.numberOfAuthors || 1);
    }
    j.calculatedScore = Number(score.toFixed(2));
    journalScore += j.calculatedScore;
  });
  journalScore = Math.min(50, journalScore);

  // Scopus citations calculation
  let citationScore = 0;
  const totalCitations = (cat3.citationsScopus || []).reduce((acc, c) => acc + (c?.citationCount || 0), 0);
  if (totalCitations > 300) citationScore = 25;
  else if (totalCitations >= 200) citationScore = 15;
  else if (totalCitations >= 100) citationScore = 10;
  else if (totalCitations >= 50) citationScore = 5;
  else if (totalCitations > 0) citationScore = 2;

  // Q1 Citations calculation
  let q1CitationScore = 0;
  const q1Citations = (cat3.citationsQ1 || []).reduce((acc, c) => acc + (c?.q1CitationCount || 0), 0);
  if (q1Citations > 200) q1CitationScore = 25;
  else if (q1Citations >= 101) q1CitationScore = 20;
  else if (q1Citations >= 51) q1CitationScore = 15;
  else if (q1Citations >= 26) q1CitationScore = 10;
  else if (q1Citations >= 10) q1CitationScore = 5;

  // Consultancy calculation
  let consultancyScore = 0;
  const totalConsultancy = (cat3.consultancy || []).reduce((acc, c) => acc + (c?.amountReceived || 0), 0);
  if (totalConsultancy > 200000) consultancyScore = 10;
  else if (totalConsultancy >= 100000) consultancyScore = 8;
  else if (totalConsultancy >= 25000) consultancyScore = 5;
  else if (totalConsultancy >= 10000) consultancyScore = 3;

  // Patents — only count rows with a title
  let patentScore = 0;
  (cat3.patents || []).forEach((p) => {
    if (!p?.title?.trim()) return;
    patentScore += p.status === 'Granted' ? 10 : 5;
  });
  patentScore = Math.min(20, patentScore);

  // PhD Guidance — only count rows with a scholar name
  let phdScore = 0;
  (cat3.phdSupervisionTable || []).forEach((phd) => {
    if (!phd?.scholarName?.trim()) return;
    if (phd.status === 'Registered') phdScore += 3;
    else if (phd.mode === 'Full-Time') phdScore += 7.5;
    else phdScore += 5;
  });
  phdScore = Math.min(15, phdScore);

  // Research Awards — only count rows with an award title
  const filledAwards = (cat3.researchAwardsTable || []).filter(a => a?.awardTitle?.trim()?.length > 0);
  const awardsScore = Math.min(5, filledAwards.length * 5);

  // Funded Projects — only count rows with a project title
  let fundedScore = 0;
  (cat3.fundedProjects || []).forEach((fp) => {
    if (!fp?.projectTitle?.trim()) return;
    if (fp.status === 'Submitted') {
      fundedScore += 1;
    } else {
      let base = 2;
      if (fp.amountSanctioned > 2000000) base = 15;
      else if (fp.amountSanctioned >= 501000) base = 10;
      else if (fp.amountSanctioned >= 100001) base = 5;

      const creditMultiplier = fp.role === 'PI' ? 1.0 : 0.75;
      fundedScore += base * creditMultiplier;
    }
  });
  fundedScore = Math.min(15, fundedScore);

  // Industry Use Case — only count rows with a title
  let useCaseScore = 0;
  (cat3.industryUseCases || []).forEach((uc) => {
    if (!uc?.title?.trim()) return;
    let multiplier = 1.0;
    if (uc.role === 'Co-PI') multiplier = 0.75;
    else if (uc.role === 'Team Member') multiplier = 0.5;
    useCaseScore += 20 * multiplier;
  });
  useCaseScore = Math.min(25, useCaseScore);

  const selfTotal = Math.min(
    190,
    journalScore + citationScore + q1CitationScore + consultancyScore + patentScore + phdScore + awardsScore + fundedScore + useCaseScore
  );

  return { selfTotal, hodTotal: cat3.totalHodScore || selfTotal };
}

/**
 * Calculates grade based on designation and total score (out of 350).
 */
export function calculateGrade(designation: Designation, totalScore: number): GradeType {
  if (designation === 'Professor') {
    if (totalScore > 275) return 'Grade A';
    if (totalScore >= 210) return 'Grade B';
    return 'Grade C';
  } else if (designation === 'Associate Professor') {
    if (totalScore > 255) return 'Grade A';
    if (totalScore >= 190) return 'Grade B';
    return 'Grade C';
  } else {
    // Assistant Professor
    if (totalScore > 240) return 'Grade A';
    if (totalScore >= 175) return 'Grade B';
    return 'Grade C';
  }
}
