'use client';

import React from 'react';
import { AppraisalRecord } from '@/types/appraisal';
import { X, User, Phone, Mail, Globe, MapPin, Calendar, Award, BookOpen, Briefcase, Download, Printer } from 'lucide-react';

interface PersonalInfoModalProps {
  record: AppraisalRecord;
  onClose: () => void;
}

export const PersonalInfoModal: React.FC<PersonalInfoModalProps> = ({ record, onClose }) => {
  const g = record.generalDetails;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-bold text-base flex items-center justify-center shrink-0">
              {record.facultyName.charAt(0)}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">{record.facultyName} — Faculty Personal &amp; Institutional Profile</h3>
              <p className="text-xs text-slate-500">{record.empId} &bull; {record.designation} &bull; {record.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Download PDF
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-800">
          
          {/* Section 1.1: Basic Details */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 space-y-3">
            <h4 className="text-xs font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4" /> 1.1 Basic &amp; Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div><span className="text-slate-400 block text-[11px]">Institution</span><span className="font-semibold">{g.institutionName || 'SRMIST'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Faculty Name</span><span className="font-semibold">{record.facultyName}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Employee ID</span><span className="font-semibold font-mono">{record.empId}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Qualifications</span><span className="font-semibold">{g.qualifications || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Department</span><span className="font-semibold">{record.department}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Date of Joining</span><span className="font-semibold">{g.dateOfJoining || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Designation at Joining</span><span className="font-semibold">{g.designationAtJoining || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Present Designation</span><span className="font-semibold text-blue-600">{record.designation}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Mobile Number</span><span className="font-semibold">{g.mobileNumber || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Official Email</span><span className="font-semibold">{g.officialEmail || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Personal Email</span><span className="font-semibold">{g.personalEmail || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Google Scholar</span><span className="font-semibold text-blue-600">{g.googleScholarUrl ? <a href={g.googleScholarUrl} target="_blank" rel="noreferrer" className="underline">Profile Link</a> : '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Scopus Author ID</span><span className="font-semibold">{g.scopusAuthorId || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">ORCID ID</span><span className="font-semibold">{g.orcidId || '—'}</span></div>
              <div><span className="text-slate-400 block text-[11px]">Reporting HoD</span><span className="font-semibold">{g.reportingHodName || '—'}</span></div>
            </div>
          </div>

          {/* Section 1.2: Addresses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h5 className="font-bold text-slate-700 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Residential Address</h5>
              <p className="text-slate-600 leading-relaxed">{g.residentialAddress || 'No residential address entered.'}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <h5 className="font-bold text-slate-700 mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-500" /> Communication Address</h5>
              <p className="text-slate-600 leading-relaxed">{g.communicationAddress || 'No communication address entered.'}</p>
            </div>
          </div>

          {/* Section 1.3 & 1.4: Experience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-3">
              <h5 className="font-bold text-slate-700 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-600" /> Teaching Experience ({g.teachingExperience.length})</h5>
              {g.teachingExperience.length === 0 ? <p className="text-slate-400 italic">No entries</p> : (
                <div className="space-y-1.5">
                  {g.teachingExperience.map((t) => (
                    <div key={t.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                      <div><p className="font-semibold text-slate-800">{t.institutionName}</p><p className="text-slate-400">{t.designation}</p></div>
                      <span className="font-mono text-slate-500">{t.durationYearsMonths || `${t.periodFrom}–${t.periodTo}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-slate-200 rounded-lg p-3">
              <h5 className="font-bold text-slate-700 mb-2 flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5 text-purple-600" /> Industry / Research Exp ({g.industryExperience.length})</h5>
              {g.industryExperience.length === 0 ? <p className="text-slate-400 italic">No entries</p> : (
                <div className="space-y-1.5">
                  {g.industryExperience.map((i) => (
                    <div key={i.id} className="p-2 bg-slate-50 rounded border border-slate-100 flex justify-between">
                      <div><p className="font-semibold text-slate-800">{i.industryName}</p><p className="text-slate-400">{i.designation}</p></div>
                      <span className="font-mono text-slate-500">{i.durationYearsMonths || `${i.periodFrom}–${i.periodTo}`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 1.5: Leave Details */}
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
            <h5 className="font-bold text-slate-800 mb-2">1.5 Leave Details (Calendar Year {g.leaveDetails.calendarYear})</h5>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">Working Days</span><span className="font-bold text-slate-800">{g.leaveDetails.workingDays}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">CL Availed</span><span className="font-bold text-slate-800">{g.leaveDetails.cl}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">EL Availed</span><span className="font-bold text-slate-800">{g.leaveDetails.el}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">ML Availed</span><span className="font-bold text-slate-800">{g.leaveDetails.ml}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">LoP Availed</span><span className="font-bold text-slate-800">{g.leaveDetails.lop}</span></div>
              <div className="p-2 bg-white rounded border border-slate-200"><span className="text-slate-400 block text-[10px]">Attendance %</span><span className="font-bold text-green-600">{g.leaveDetails.attendancePercentage}%</span></div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-md hover:bg-slate-800 text-xs">
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
