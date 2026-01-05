
import React, { useState, useMemo } from 'react';
import { Member, ProgressEntry } from '../types';
import { Icons } from '../constants';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgressTrackerProps {
  members: Member[];
  onUpdateMember: (member: Member) => void;
}

const ProgressTracker: React.FC<ProgressTrackerProps> = ({ members, onUpdateMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Member | null>(null);
  const [newScore, setNewScore] = useState({ subject: '', score: '' });

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.seatNo.includes(searchTerm)
  );

  const handleAddScore = () => {
    if (!selectedStudent || !newScore.subject || !newScore.score) return;
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      subject: newScore.subject.toUpperCase(),
      score: newScore.score,
    };
    const updated = { ...selectedStudent, progress: [...(selectedStudent.progress || []), entry] };
    onUpdateMember(updated);
    setSelectedStudent(updated);
    setNewScore({ subject: '', score: '' });
  };

  const chartData = useMemo(() => {
    if (!selectedStudent || !selectedStudent.progress) return [];
    return selectedStudent.progress.map(p => ({
      name: p.date,
      score: parseInt(p.score || '0'),
      subject: p.subject
    }));
  }, [selectedStudent]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Progress Hub</h2>
          <p className="text-xs text-slate-500 mt-1">Track and analyze academic performance across the library registry.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or seat..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-100 rounded-xl text-sm outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student List */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden h-[600px] flex flex-col">
          <div className="p-4 border-b border-slate-50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Student</h3>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredMembers.map(m => {
              const latestScore = m.progress && m.progress.length > 0 
                ? m.progress[m.progress.length - 1].score + '%'
                : 'No Data';
              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedStudent(m)}
                  className={`w-full flex items-center justify-between p-4 transition-all border-b border-slate-50 ${
                    selectedStudent?.id === m.id ? 'bg-slate-50' : 'hover:bg-slate-50/50'
                  }`}
                >
                  <div className="text-left">
                    <p className={`text-sm font-bold ${selectedStudent?.id === m.id ? 'text-[#84cc16]' : 'text-slate-800'}`}>
                      {m.name}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">Seat {m.seatNo}</p>
                  </div>
                  <span className="text-[10px] font-black text-slate-300 uppercase">{latestScore}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Details & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {selectedStudent ? (
            <>
              {/* Header Info */}
              <div className="bg-white p-8 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">{selectedStudent.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">{selectedStudent.batchTime}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#84cc16] uppercase tracking-[0.2em] mb-1">Status</p>
                  <p className="text-sm font-bold text-slate-800">Academic Monitoring Active</p>
                </div>
              </div>

              {/* Data Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-2xl border border-slate-100 h-80 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Score Trajectory</h4>
                  {chartData.length > 0 ? (
                    <div className="flex-1 -ml-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#94a3b8' }} 
                          />
                          <YAxis 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fontSize: 9, fill: '#94a3b8' }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#84cc16" 
                            strokeWidth={3} 
                            dot={{ fill: '#84cc16', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, strokeWidth: 0 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-xs text-slate-300 font-medium">
                      No data points recorded yet beta.
                    </div>
                  )}
                </div>

                <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">New Performance Record</h4>
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="SUBJECT (E.G. MATHS)" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold uppercase" 
                      value={newScore.subject} 
                      onChange={e => setNewScore({...newScore, subject: e.target.value})} 
                    />
                    <input 
                      type="number" 
                      placeholder="SCORE %" 
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold" 
                      value={newScore.score} 
                      onChange={e => setNewScore({...newScore, score: e.target.value})} 
                    />
                    <button 
                      onClick={handleAddScore}
                      className="w-full bg-slate-900 text-[#84cc16] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/10 active:scale-95 transition-all"
                    >
                      Update Registry Entry
                    </button>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4 text-right">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {selectedStudent.progress?.slice().reverse().map(p => (
                      <tr key={p.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-medium">{p.date}</td>
                        <td className="px-6 py-4 text-slate-700 font-bold uppercase">{p.subject}</td>
                        <td className="px-6 py-4 text-right font-black text-slate-900">{p.score}%</td>
                      </tr>
                    ))}
                    {(!selectedStudent.progress || selectedStudent.progress.length === 0) && (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-300 font-medium">No records found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 opacity-50">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                 <Icons.Progress className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Select a student from the list to view progress</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
