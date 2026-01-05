
import React, { useState, useMemo } from 'react';
import { Member, AttendanceLog } from '../types';
import { Icons, OFFICIAL_PLANS } from '../constants';

interface AttendanceProps {
  members: Member[];
  attendance: AttendanceLog[];
  onUpdate: (log: AttendanceLog) => void;
}

const Attendance: React.FC<AttendanceProps> = ({ members, attendance, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyCurrentShift, setShowOnlyCurrentShift] = useState(true);
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  const activePlan = useMemo(() => {
    return OFFICIAL_PLANS.find(p => currentHour >= p.hourRange[0] && currentHour < p.hourRange[1]);
  }, [currentHour]);

  const normalize = (str: string) => str.replace(/\s/g, '').toLowerCase();

  const isMemberInCurrentShift = (member: Member) => {
    if (!activePlan) return false;
    const mBatch = normalize(member.batchTime);
    const pTime = normalize(activePlan.time).split('(')[0];
    const isDirectMatch = mBatch.includes(pTime) || pTime.includes(mBatch.split('(')[0]);
    const isDoubleShift = mBatch.includes('10am-06pm') || mBatch.includes('2shift');
    const isUltimateShift = mBatch.includes('06am-06pm') || mBatch.includes('fullshift') || mBatch.includes('12-hour');
    if (activePlan.id === 5) return isDoubleShift || isUltimateShift;
    if (activePlan.id === 6) return isUltimateShift;
    if (isDoubleShift && currentHour >= 10 && currentHour < 18) return true;
    if (isUltimateShift && currentHour >= 6 && currentHour < 18) return true;
    return isDirectMatch;
  };

  const filteredMembers = members.filter(m => {
    const searchMatch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.seatNo.includes(searchTerm);
    return showOnlyCurrentShift ? searchMatch && isMemberInCurrentShift(m) : searchMatch;
  });

  const getTodayStatus = (memberId: string) => attendance.find(a => a.memberId === memberId && a.checkIn.startsWith(today));

  const handleAction = (member: Member) => {
    const status = getTodayStatus(member.id);
    if (!status) {
      onUpdate({ id: `att-${member.id}-${today}`, memberId: member.id, checkIn: new Date().toISOString(), status: 'Present' });
    } else if (!status.checkOut) {
      onUpdate({ ...status, checkOut: new Date().toISOString(), status: 'Left' });
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-400">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-100">
        <div>
           <h2 className="text-xl font-bold text-slate-900">Live Attendance</h2>
           <p className="text-xs text-slate-500 font-medium mt-1">Active Shift: {activePlan?.name || 'Closed'}</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative flex-grow sm:w-64">
             <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input
               type="text"
               placeholder="Search student..."
               className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setShowOnlyCurrentShift(!showOnlyCurrentShift)}
            className={`p-2 rounded-xl border transition-all ${showOnlyCurrentShift ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-400'}`}
            title="Toggle Shift Filter"
          >
            <Icons.Batch className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-4">Seat</th>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredMembers.map(m => {
              const status = getTodayStatus(m.id);
              const isCheckedIn = !!status;
              const isCheckedOut = !!status?.checkOut;
              const inShift = isMemberInCurrentShift(m);

              return (
                <tr key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-bold text-slate-400">{m.seatNo}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium uppercase">{m.batchTime}</p>
                  </td>
                  <td className="px-6 py-4">
                    {isCheckedIn ? (
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${isCheckedOut ? 'bg-slate-100 text-slate-500' : 'bg-emerald-50 text-emerald-600'}`}>
                        {isCheckedOut ? 'LEFT' : 'ACTIVE'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-300">WAITING</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleAction(m)}
                      disabled={isCheckedOut || (!isCheckedIn && !inShift)}
                      className={`text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${
                        isCheckedOut ? 'invisible' : 
                        isCheckedIn ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' :
                        inShift ? 'bg-slate-900 text-[#84cc16] hover:bg-slate-800' : 'bg-slate-100 text-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {isCheckedIn ? 'Out' : 'In'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Attendance;
