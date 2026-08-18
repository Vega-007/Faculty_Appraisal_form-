'use client';

import React from 'react';
import { AppraisalRecord } from '@/types/appraisal';
import { TeacherView } from '@/components/roles/TeacherView';
import { X, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { StatusPill } from '@/components/ui/StatusPill';
import { typography } from '@/lib/design-tokens';

interface FullAppraisalModalProps {
  record: AppraisalRecord;
  onClose: () => void;
}

export const FullAppraisalModal: React.FC<FullAppraisalModalProps> = ({ record, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150 my-0 sm:my-auto">
        
        {/* Clean Sticky Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 text-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 font-bold text-lg flex items-center justify-center shrink-0 border border-blue-200 shadow-2xs">
              {record.facultyName?.charAt(0) ?? '?'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className={typography.h1}>{record.facultyName}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {record.empId}
                </span>
                <GradeBadge grade={record.grade} size="sm" />
                <StatusPill status={record.status} size="sm" />
              </div>
              <p className={typography.caption}>
                {record.designation} &bull; {record.department} &bull; Period: {record.monthYear} &bull; Full Appraisal Record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 no-print">
            <Button
              variant="secondary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4 text-blue-600" />}
            >
              <span>Print / Export PDF</span>
            </Button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
              title="Close Full Appraisal View (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Complete Faculty Performance Form View */}
        <div className="overflow-y-auto flex-1 p-3 sm:p-6 bg-slate-50/50">
          <TeacherView
            appraisal={record}
            isWindowOpen={true}
            readOnly={true}
          />
        </div>

        {/* Sticky Footer */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between shrink-0 no-print">
          <span className="text-xs text-slate-500 font-medium">
            Full Appraisal View for <strong className="text-slate-900 font-semibold">{record.facultyName}</strong> ({record.empId})
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}
          >
            Close Full Appraisal View
          </Button>
        </div>

      </div>
    </div>
  );
};
