
import React, { useMemo } from 'react';
import { Resource, Member, Payment, Notice } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface DashboardProps {
  resources: Resource[];
  members: Member[];
  payments: Payment[];
  notices: Notice[];
  userRole: 'admin' | 'student';
  onAddNotice: (notice: Omit<Notice, 'id'>) => Promise<void>;
  onDeleteNotice: (id: string) => Promise<void>;
  onExport: () => void;
  onImport: (data: any) => void;
}

const parseDues = (duesStr: string): number => {
  if (!duesStr || duesStr.toLowerCase().includes('paid')) return 0;
  const cleanStr = duesStr.replace(/\/\-|\s/g, '').trim();
  if (cleanStr.includes('+')) {
    return cleanStr.split('+').reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }
  return parseFloat(cleanStr) || 0;
};

const Dashboard: React.FC<DashboardProps> = ({ resources, members, payments, notices, userRole, onAddNotice, onDeleteNotice }) => {
  const [newNotice, setNewNotice] = React.useState({ title: '', content: '' });
  const [isPosting, setIsPosting] = React.useState(false);

  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotice.title || !newNotice.content) return;
    setIsPosting(true);
    try {
      await onAddNotice({
        title: newNotice.title.toUpperCase(),
        content: newNotice.content,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        priority: 'Normal'
      });
      setNewNotice({ title: '', content: '' });
    } finally {
      setIsPosting(false);
    }
  };
  const totalOutstanding = useMemo(() => members.filter(m => !m.isArchived).reduce((sum, m) => {
    const registryDues = parseDues(m.dues);
    const paidInApp = payments.filter(p => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, registryDues - paidInApp);
  }, 0), [members, payments]);

  const activeMembers = useMemo(() => members.filter(m => !m.isArchived), [members]);

  const stats = [
    { label: 'E-Resources', value: resources.length, icon: '📚' },
    { label: 'Enrolled', value: activeMembers.length, icon: '👤' },
    { label: 'Outstanding', value: `₹${totalOutstanding}`, color: 'text-rose-500 dark:text-rose-400', icon: '💳' },
    { label: 'Recent Notices', value: notices.length, icon: '📢' },
  ];

  const trendData = useMemo(() => {
    const dailyData: Record<string, number> = {};

    // Group payments by date
    payments.forEach(p => {
      const date = p.date; // Expecting YYYY-MM-DD
      dailyData[date] = (dailyData[date] || 0) + p.amount;
    });

    // Convert to array and sort by date
    return Object.entries(dailyData)
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        amount,
        rawDate: date
      }))
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .slice(-7); // Show last 7 days of activity
  }, [payments]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center space-x-4 transition-colors">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-900 rounded-xl flex items-center justify-center text-xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color || 'text-slate-900 dark:text-white'}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Payment Trends Chart */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">Collection Trends</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Daily Revenue Analysis</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-[#84cc16] rounded-full"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Collections (₹)</span>
              </div>
            </div>

            <div className="h-64 w-full">
              {trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#84cc16" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#84cc16" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        backgroundColor: '#0f172a',
                        color: '#fff'
                      }}
                      itemStyle={{ color: '#84cc16', fontWeight: 'black', fontSize: '12px' }}
                      labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', fontWeight: 'bold' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#84cc16"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-[10px] font-black uppercase tracking-widest">No transaction data to plot.</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Recent Enrolments</h3>
            <div className="space-y-4">
              {activeMembers.slice(-5).reverse().map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center font-bold text-xs dark:text-slate-300">
                      {m.seatNo}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase">{m.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tight">{m.batchTime}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Recently</span>
                </div>
              ))}
              {activeMembers.length === 0 && (
                <p className="py-10 text-center text-slate-400 text-xs italic uppercase">No students in registry node.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-1 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl transition-all h-fit flex flex-col overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Internal Alerts</h3>
                <p className="text-[9px] text-[#84cc16] font-black uppercase tracking-[0.2em] mt-1">Registry Broadcast Node</p>
              </div>
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-[#84cc16]/10 border border-[#84cc16]/20 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#84cc16] rounded-full animate-pulse"></span>
                <span className="text-[8px] font-black text-[#84cc16] uppercase tracking-widest">Live</span>
              </div>
            </div>

            {userRole === 'admin' && (
              <form onSubmit={handlePostNotice} className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4 shadow-inner group">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Alert Subject</label>
                  <input
                    required
                    placeholder="E.G., FEE REMINDER / MAINTENANCE"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-[11px] font-black uppercase dark:text-white outline-none focus:ring-4 focus:ring-[#84cc16]/10 focus:border-[#84cc16] transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    value={newNotice.title}
                    onChange={e => setNewNotice({ ...newNotice, title: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Broadcast Message</label>
                  <textarea
                    required
                    placeholder="ENTER DETAILED BROADCAST CONTENT..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-xs font-medium dark:text-white outline-none focus:ring-4 focus:ring-[#84cc16]/10 focus:border-[#84cc16] transition-all min-h-[100px] placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                    value={newNotice.content}
                    onChange={e => setNewNotice({ ...newNotice, content: e.target.value })}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isPosting}
                  className="w-full bg-slate-900 dark:bg-white dark:text-black text-[#84cc16] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:shadow-[#84cc16]/20 hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isPosting ? (
                    <>
                      <div className="w-3 h-3 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin"></div>
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <span>📡</span>
                      <span>Deploy Internal Alert</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="px-8 pb-8 space-y-6 overflow-y-auto max-h-[450px] custom-scrollbar">
            {notices.map((notice, idx) => (
              <div
                key={notice.id}
                className={`relative p-6 rounded-[2rem] border transition-all group animate-in fade-in slide-in-from-right-4 duration-500 delay-[${idx * 100}ms] ${notice.priority === 'High'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30'
                  : 'bg-white dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 shadow-sm'
                  }`}
              >
                {userRole === 'admin' && (
                  <button
                    onClick={() => onDeleteNotice(notice.id)}
                    className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all z-10"
                    title="Recall Alert"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${notice.priority === 'High' ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                    }`}>
                    {notice.priority === 'High' ? 'Priority' : 'General'}
                  </div>
                  <span className="text-[9px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-widest">#{notices.length - idx}</span>
                </div>

                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 group-hover:text-[#84cc16] transition-colors line-clamp-1">{notice.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-4">{notice.content}</p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex items-center space-x-2">
                    <div className="w-1.5 h-1.5 bg-[#84cc16] rounded-full"></div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{notice.date}</span>
                  </div>
                </div>
              </div>
            ))}

            {notices.length === 0 && (
              <div className="py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-2xl mx-auto opacity-20">📡</div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">No active signals</p>
                  <p className="text-[9px] font-bold text-slate-300 dark:text-slate-800 uppercase mt-1">Registry node is silent</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
