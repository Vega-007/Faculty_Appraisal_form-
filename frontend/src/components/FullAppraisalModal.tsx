'use client';

import React from 'react';
import { AppraisalRecord } from '@/types/appraisal';
import { TeacherView } from '@/components/roles/TeacherView';
import { X, Printer, User, Award, ShieldCheck } from 'lucide-react';

interface FullAppraisalModalProps {
  record: AppraisalRecord;
  onClose: () => void;
}

export const FullAppraisalModal: React.FC<FullAppraisalModalProps> = ({ record, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden">
        
        {/* Sticky Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-600 text-white font-black text-xl flex items-center justify-center shrink-0 shadow-md">
              {record.facultyName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white">{record.facultyName}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                  {record.empId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-black border ${
                  record.grade === 'Grade A' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  record.grade === 'Grade B' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {record.grade}
                </span>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                  record.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                  record.status === 'HOD_APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                  'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {record.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {record.designation} &bull; {record.department} &bull; Period: {record.monthYear} &bull; Complete Faculty Appraisal Form View
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print / Export PDF
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Complete Faculty Login Form View */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-50">
          <TeacherView
            appraisal={record}
            isWindowOpen={true}
            readOnly={true}
          />
        </div>

        {/* Sticky Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-white flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500 font-medium">
            Viewing Complete Faculty Appraisal Form for <strong className="text-slate-900">{record.facultyName}</strong> ({record.empId})
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
          >
            Close Full Appraisal View
          </button>
        </div>

      </div>
    </div>
  );
};
