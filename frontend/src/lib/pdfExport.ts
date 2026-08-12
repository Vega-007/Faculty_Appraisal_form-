import jsPDF from 'jspdf';
import { AppraisalRecord } from '@/types/appraisal';

export function generateAppraisalPDF(record: AppraisalRecord) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Dark Navy Blue
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('SRM INSTITUTE OF SCIENCE AND TECHNOLOGY', 105, 14, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('FACULTY PERFORMANCE APPRAISAL CERTIFICATE 2025-2026', 105, 24, { align: 'center' });

  doc.setFontSize(9);
  doc.text(`Official Appraisal Record - ${record.monthYear}`, 105, 31, { align: 'center' });

  // Faculty Profile Card
  let y = 48;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 36, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 36, 'S');

  doc.setTextColor(17, 24, 39);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Faculty Name: ${record.facultyName}`, 20, y + 10);
  doc.text(`Employee ID: ${record.empId}`, 120, y + 10);

  doc.text(`Department: ${record.department}`, 20, y + 20);
  doc.text(`Designation: ${record.designation}`, 120, y + 20);

  doc.text(`Status: ${record.status}`, 20, y + 30);
  doc.text(`Grade Awarded: ${record.grade}`, 120, y + 30);

  // Score Summary Box
  y += 46;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ACADEMIC PERFORMANCE INDICATORS (API) BREAKDOWN', 14, y);

  y += 6;
  // Table Header
  doc.setFillColor(37, 99, 235);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text('Category Description', 20, y + 7);
  doc.text('Max Allotted', 110, y + 7);
  doc.text('Self Score', 142, y + 7);
  doc.text('HOD Verified', 172, y + 7);

  // Row 1: Category I
  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, 182, 10, 'F');
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'normal');
  doc.text('Category I: Teaching, Learning & Evaluation', 20, y + 7);
  doc.text('110 Points', 110, y + 7);
  doc.text(`${record.cat1.totalSelfScore}`, 145, y + 7);
  doc.text(`${record.cat1.totalHodScore}`, 175, y + 7);

  // Row 2: Category II
  y += 10;
  doc.setFillColor(249, 250, 251);
  doc.rect(14, y, 182, 10, 'F');
  doc.text('Category II: Co-Curricular & Professional', 20, y + 7);
  doc.text('50 Points', 110, y + 7);
  doc.text(`${record.cat2.totalSelfScore}`, 145, y + 7);
  doc.text(`${record.cat2.totalHodScore}`, 175, y + 7);

  // Row 3: Category III
  y += 10;
  doc.setFillColor(255, 255, 255);
  doc.rect(14, y, 182, 10, 'F');
  doc.text('Category III: Research & Contributions', 20, y + 7);
  doc.text('190 Points', 110, y + 7);
  doc.text(`${record.cat3.totalSelfScore}`, 145, y + 7);
  doc.text(`${record.cat3.totalHodScore}`, 175, y + 7);

  // Total Score Row
  y += 10;
  doc.setFillColor(224, 231, 255);
  doc.rect(14, y, 182, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('TOTAL API SCORE OBTAINED', 20, y + 8);
  doc.text('350 Points', 110, y + 8);
  doc.text(`${record.selfScoreTotal} / 350`, 142, y + 8);
  doc.text(`${record.hodScoreTotal} / 350`, 172, y + 8);

  // Research Publications Summary
  y += 24;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(17, 24, 39);
  doc.text('KEY RESEARCH OUTPUT & PUBLICATIONS', 14, y);

  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (record.cat3.journals.length === 0) {
    doc.text('No journal publications recorded for this period.', 14, y + 5);
  } else {
    record.cat3.journals.forEach((j, idx) => {
      doc.text(`${idx + 1}. "${j.title}" - ${j.journalName} (${j.indexing} ${j.quartile}) - Points: ${j.calculatedScore}`, 14, y + 6);
      y += 8;
    });
  }

  // Undertaking Confirmation
  y += 20;
  doc.setFillColor(243, 244, 246);
  doc.rect(14, y, 182, 28, 'F');
  doc.setDrawColor(209, 213, 219);
  doc.rect(14, y, 182, 28, 'S');

  doc.setFontSize(8);
  doc.setTextColor(55, 65, 81);
  doc.text('DECLARATION & VERIFICATION:', 18, y + 8);
  doc.text('I hereby confirm that the details and documents furnished in this Annual Appraisal Form have been verified', 18, y + 15);
  doc.text('in person by the HOD and Institutional Appraisal Verifying Team.', 18, y + 21);

  // Signatures Line
  y += 42;
  doc.setDrawColor(156, 163, 175);
  doc.line(20, y, 65, y);
  doc.line(85, y, 130, y);
  doc.line(145, y, 190, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Faculty Signature', 25, y + 6);
  doc.text('HOD Signature', 95, y + 6);
  doc.text('Principal / Director', 150, y + 6);

  doc.save(`Appraisal_Certificate_${record.empId}_${record.facultyName.replace(/\s+/g, '_')}.pdf`);
}
