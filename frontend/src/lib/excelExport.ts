import * as XLSX from 'xlsx';
import { AppraisalRecord } from '@/types/appraisal';

export function exportCollegeAnalyticsExcel(appraisals: AppraisalRecord[], monthYear: string) {
  // 1. Overview Sheet Data
  const overviewData = appraisals.map((a) => ({
    'Emp ID': a.empId,
    'Faculty Name': a.facultyName,
    Department: a.department,
    Designation: a.designation,
    'Month / Year': a.monthYear,
    Status: a.status,
    'Category I (Max 110)': a.cat1.totalSelfScore,
    'Category II (Max 50)': a.cat2.totalSelfScore,
    'Category III (Max 190)': a.cat3.totalSelfScore,
    'Total Score (Max 350)': a.selfScoreTotal,
    'HOD Verified Score': a.hodScoreTotal,
    'Grade Awarded': a.grade,
  }));

  // 2. Research Publications Sheet Data
  const researchData: any[] = [];
  appraisals.forEach((a) => {
    a.cat3.journals.forEach((j) => {
      researchData.push({
        'Emp ID': a.empId,
        'Faculty Name': a.facultyName,
        Department: a.department,
        'Paper Title': j.title,
        Journal: j.journalName,
        Indexing: j.indexing,
        Quartile: j.quartile,
        'Author Position': j.authorPosition,
        'No. of Authors': j.numberOfAuthors,
        'Calculated Score': j.calculatedScore,
        'DOI Link': j.doiLink,
      });
    });
  });

  // 3. Departmental Summary Sheet
  const deptStats: Record<string, { totalFaculty: number; totalScoreSum: number; gradeA: number; gradeB: number; gradeC: number }> = {};
  appraisals.forEach((a) => {
    if (!deptStats[a.department]) {
      deptStats[a.department] = { totalFaculty: 0, totalScoreSum: 0, gradeA: 0, gradeB: 0, gradeC: 0 };
    }
    deptStats[a.department].totalFaculty += 1;
    deptStats[a.department].totalScoreSum += a.selfScoreTotal;
    if (a.grade === 'Grade A') deptStats[a.department].gradeA += 1;
    else if (a.grade === 'Grade B') deptStats[a.department].gradeB += 1;
    else deptStats[a.department].gradeC += 1;
  });

  const summaryData = Object.keys(deptStats).map((dept) => ({
    Department: dept,
    'Total Faculty': deptStats[dept].totalFaculty,
    'Average Score': (deptStats[dept].totalScoreSum / deptStats[dept].totalFaculty).toFixed(1),
    'Grade A Count': deptStats[dept].gradeA,
    'Grade B Count': deptStats[dept].gradeB,
    'Grade C Count': deptStats[dept].gradeC,
  }));

  // Create Workbook
  const wb = XLSX.utils.book_new();

  const wsOverview = XLSX.utils.json_to_sheet(overviewData);
  const wsResearch = XLSX.utils.json_to_sheet(researchData.length ? researchData : [{ Message: 'No research papers recorded' }]);
  const wsSummary = XLSX.utils.json_to_sheet(summaryData);

  XLSX.utils.book_append_sheet(wb, wsOverview, 'Faculty Overview');
  XLSX.utils.book_append_sheet(wb, wsResearch, 'Research Output');
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Department Summary');

  // Save Excel file
  XLSX.writeFile(wb, `Faculty_Appraisal_Analytics_${monthYear.replace(/\s+/g, '_')}.xlsx`);
}
