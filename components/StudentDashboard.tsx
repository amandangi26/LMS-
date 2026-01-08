
import React from 'react';
import { Member, Notice, AttendanceLog, Payment, View, ReplacementRequest } from '../types';
import { Icons } from '../constants';

interface StudentDashboardProps {
  student: Member;
  notices: Notice[];
  attendance: AttendanceLog[];
  payments: Payment[];
  requests: ReplacementRequest[];
  onViewChange: (view: View) => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ student, notices, attendance, payments, requests, onViewChange }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCheckedIn = attendance.some(a => a.memberId === student.id && a.checkIn.includes(today));

  // Filter requests for this specific student
  const studentRequests = requests.filter(r => r.memberId === student.id);

  // Calculate next fee deadline (simulated: 30 days after join or last payment)
  const lastPayment = payments.filter(p => p.memberId === student.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const startDate = lastPayment ? new Date(lastPayment.date) : new Date(student.joinDate);
  const nextDeadline = new Date(startDate);
  nextDeadline.setDate(startDate.getDate() + 30);
  const deadlineStr = nextDeadline.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Welcome Hero */}
      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <p className="text-[#84cc16] font-black text-[10px] uppercase tracking-[0.3em] mb-2">Student Hub Portal</p>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Namaste, {student.name.split(' ')[0]}!</h2>
          <p className="text-slate-400 text-sm mt-2 max-w-md font-medium">
            Your seat <span className="text-white font-bold">#{student.seatNo}</span> is ready for your study session in the <span className="text-white font-bold">{student.batchTime}</span> shift.
          </p>
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-[#84cc16]/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${isCheckedIn ? 'bg-[#84cc16]/10 text-[#84cc16]' : 'bg-slate-100 text-slate-400'}`}>
            {isCheckedIn ? '✅' : '🕒'}
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Live Status</p>
            <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {isCheckedIn ? 'Checked In' : 'Not Logged'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-[#84cc16]/10 text-[#84cc16] rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            📈
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Mock Progress</p>
            <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {student.progress && student.progress.length > 0 ? `${student.progress[student.progress.length - 1].score}` : 'Pending'}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-sm flex items-center space-x-5">
          <div className="w-14 h-14 bg-[#84cc16]/10 text-[#84cc16] rounded-2xl flex items-center justify-center text-2xl shadow-lg">
            📅
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Fee Deadline</p>
            <p className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">
              {deadlineStr}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area: Notices & Modification History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Notices Section */}
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center">
                <span className="w-2 h-2 bg-[#84cc16] rounded-full mr-3"></span>
                Recent Library Notices
              </h3>
              <span className="text-[10px] font-black text-[#84cc16] uppercase tracking-widest">Live Updates</span>
            </div>
            <div className="space-y-5">
              {notices.length > 0 ? notices.map(notice => (
                <div key={notice.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-l-4 border-[#84cc16] group hover:bg-white dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm uppercase tracking-tight">{notice.title}</h4>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">{notice.date}</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{notice.content}</p>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">No current broadcasts from management.</div>
              )}
            </div>
          </div>

          {/* Modification History Section */}
          <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center">
                <span className="w-2 h-2 bg-[#84cc16] rounded-full mr-3"></span>
                Modification History
              </h3>
              <button
                onClick={() => onViewChange('replacements')}
                className="text-[10px] font-black text-[#84cc16] uppercase tracking-widest hover:underline"
              >
                Request New Change
              </button>
            </div>

            <div className="space-y-4">
              {studentRequests.length > 0 ? studentRequests.slice().reverse().map(req => (
                <div key={req.id} className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight">
                        {req.requestedSeat ? `Seat Change to #${req.requestedSeat}` : ''}
                        {req.requestedSeat && req.requestedBatch ? ' & ' : ''}
                        {req.requestedBatch ? `Batch Shift` : ''}
                      </p>
                      <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase ${req.status === 'Approved' ? 'bg-[#84cc16]/20 text-[#84cc16]' :
                          req.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                            'bg-slate-100 text-slate-600'
                        }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.date} • {req.requestedBatch || 'Same Shift'}</p>
                  </div>
                  <div className="text-left sm:text-right max-w-xs">
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 italic line-clamp-1">"{req.reason}"</p>
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">No modification requests on record.</div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-6 uppercase tracking-tight">Membership</h3>
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Current Tier</p>
                  <p className="text-xs font-black text-slate-800 dark:text-white uppercase">{student.membershipStatus} Plan</p>
                </div>
                <div className="px-3 py-1 bg-[#84cc16] text-white rounded-lg text-[9px] font-black">ACTIVE</div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                  <span className="text-slate-400">Monthly Fee</span>
                  <span className="text-slate-800 dark:text-slate-200">{student.fee}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight">
                  <span className="text-slate-400">Registry Dues</span>
                  <span className={student.dues.includes('0') ? 'text-emerald-500' : 'text-rose-500'}>{student.dues}</span>
                </div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-tight pt-4 border-t border-slate-50 dark:border-slate-700">
                  <span className="text-slate-400">Join Date</span>
                  <span className="text-slate-800 dark:text-slate-200">{student.joinDate}</span>
                </div>
              </div>

              <button className="w-full bg-slate-900 dark:bg-slate-700 text-[#84cc16] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all mt-4">
                View Digital Card
              </button>
            </div>
          </div>

          <div
            onClick={() => onViewChange('ai-assistant')}
            className="bg-[#84cc16] p-8 rounded-[3rem] shadow-xl shadow-[#84cc16]/20 relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.02] active:scale-95"
          >
            <div className="relative z-10">
              <h4 className="text-white font-black text-lg leading-tight uppercase tracking-tight italic">Need Study Assistance?</h4>
              <p className="text-white/80 text-[10px] font-bold uppercase mt-2">Vidya AI is ready to help you beta.</p>
            </div>
            <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:scale-125 transition-transform duration-700">
              <Icons.AI className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
