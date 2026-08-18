'use client';

import React from 'react';
import { AppraisalRecord } from '@/types/appraisal';
import { X, User, MapPin, BookOpen, Briefcase, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { typography } from '@/lib/design-tokens';

interface PersonalInfoModalProps {
  record: AppraisalRecord;
  onClose: () => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ record, onClose }) => {
  const g = record.generalDetails || ({} as any);
  const teachingExp = g.teachingExperience || [];
  const industryExp = g.industryExperience || [];
  const leaveDetails = g.leaveDetails || {
    calendarYear: '—',
    workingDays: 0,
    cl: 0,
    el: 0,
    ml: 0,
    lop: 0,
    vl: 0,
    attendancePercentage: 0,
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-0 sm:my-auto">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-base flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              {record.facultyName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <h3 className={`${typography.h1} truncate`}>
                {record.facultyName}
              </h3>
              <p className={typography.caption}>
                {record.empId} &bull; {record.designation} &bull; {record.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 no-print">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5 text-blue-600" />}
            >
              <span>Print Profile</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close Profile (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 text-xs text-slate-800 bg-slate-50/50">
          
          {/* Section 1.1: Basic Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-4 h-4" /> 1.1 Basic &amp; Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Institution</span><span className="font-medium text-slate-900">{g.institutionName || 'SRMIST'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Faculty Name</span><span className="font-medium text-slate-900">{record.facultyName}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Employee ID</span><span className="font-medium font-mono text-slate-900">{record.empId}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Qualifications</span><span className="font-medium text-slate-900">{g.qualifications || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Department</span><span className="font-medium text-slate-900">{record.department}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Date of Joining</span><span className="font-medium text-slate-900">{g.dateOfJoining || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Designation at Joining</span><span className="font-medium text-slate-900">{g.designationAtJoining || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Present Designation</span><span className="font-semibold text-blue-700">{record.designation}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Mobile Number</span><span className="font-medium text-slate-900">{g.mobileNumber || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Official Email</span><span className="font-medium text-slate-900">{g.officialEmail || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Personal Email</span><span className="font-medium text-slate-900">{g.personalEmail || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Google Scholar</span><span className="font-medium text-blue-600">{g.googleScholarUrl ? <a href={g.googleScholarUrl} target="_blank" rel="noreferrer" className="underline">Profile Link</a> : '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Scopus Author ID</span><span className="font-medium text-slate-900">{g.scopusAuthorId || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">ORCID ID</span><span className="font-medium text-slate-900">{g.orcidId || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px] font-semibold uppercase">Reporting HOD</span><span className="font-medium text-slate-900">{g.reportingHodName || '—'}</span></div>
            </div>
          </div>

          {/* Section 1.2: Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
              <h5 className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Residential Address</h5>
              <p className="text-slate-600 leading-relaxed">{g.residentialAddress || 'No residential address entered.'}</p>
            </div>
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
              <h5 className="font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> Communication Address</h5>
              <p className="text-slate-600 leading-relaxed">{g.communicationAddress || 'No communication address entered.'}</p>
            </div>
          </div>

          {/* Section 1.3 & 1.4: Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
              <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-600" /> Teaching Experience ({teachingExp.length})</h5>
              {teachingExp.length === 0 ? <p className="text-slate-400 italic">No entries</p> : (
                <div className="space-y-1.5">
                  {teachingExp.map((t) => (
                    <div key={t.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between">
                      <div><p className="font-semibold text-slate-800">{t.institutionName}</p><p className="text-slate-500 text-[11px]">{t.designation}</p></div>
                      <span className="font-mono text-slate-500 text-[11px]">{t.durationYearsMonths || `${t.periodFrom}–${t.periodTo}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl p-3.5 bg-white shadow-2xs">
              <h5 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-blue-600" /> Industry / Research Exp ({industryExp.length})</h5>
              {industryExp.length === 0 ? <p className="text-slate-400 italic">No entries</p> : (
                <div className="space-y-1.5">
                  {industryExp.map((i) => (
                    <div key={i.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex justify-between">
                      <div><p className="font-semibold text-slate-800">{i.industryName}</p><p className="text-slate-500 text-[11px]">{i.designation}</p></div>
                      <span className="font-mono text-slate-500 text-[11px]">{i.durationYearsMonths || `${i.periodFrom}–${i.periodTo}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 1.5: Leave Details */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-2xs">
            <h5 className="font-semibold text-slate-800 mb-2.5">1.5 Leave Details (Calendar Year {leaveDetails.calendarYear})</h5>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">Working Days</span><span className="font-bold text-slate-800">{leaveDetails.workingDays}</span></div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">CL Availed</span><span className="font-bold text-slate-800">{leaveDetails.cl}</span></div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">EL Availed</span><span className="font-bold text-slate-800">{leaveDetails.el}</span></div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">ML Availed</span><span className="font-bold text-slate-800">{leaveDetails.ml}</span></div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">LoP Availed</span><span className="font-bold text-slate-800">{leaveDetails.lop}</span></div>
              <div className="p-2 bg-slate-50 rounded-lg border border-slate-200"><span className="text-slate-400 block text-[11px]">Attendance %</span><span className="font-bold text-emerald-700">{leaveDetails.attendancePercentage}%</span></div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex justify-end shrink-0 no-print">
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Close Profile
          </Button>
        </div>
      </div>
    </div>
  );
};
