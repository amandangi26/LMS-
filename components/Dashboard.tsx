
import React, { useMemo } from 'react';
import { Resource, Member, Payment, Notice } from '../types';

interface DashboardProps {
  resources: Resource[];
  members: Member[];
  payments: Payment[];
  notices: Notice[];
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

const Dashboard: React.FC<DashboardProps> = ({ resources, members, payments, notices }) => {
  const totalOutstanding = useMemo(() => members.reduce((sum, m) => {
    const registryDues = parseDues(m.dues);
    const paidInApp = payments.filter(p => p.memberId === m.id).reduce((s, p) => s + p.amount, 0);
    return sum + Math.max(0, registryDues - paidInApp);
  }, 0), [members, payments]);

  const stats = [
    { label: 'E-Resources', value: resources.length, icon: '📚' },
    { label: 'Enrolled', value: members.length, icon: '👤' },
    { label: 'Outstanding', value: `₹${totalOutstanding}`, color: 'text-rose-500', icon: '💳' },
    { label: 'Recent Notices', value: notices.length, icon: '📢' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-xl">
              {stat.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className={`text-xl font-bold ${stat.color || 'text-slate-900'}`}>{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Enrolments</h3>
            <div className="space-y-4">
              {members.slice(-5).reverse().map(m => (
                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center font-bold text-xs">
                      {m.seatNo}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{m.name}</p>
                      <p className="text-[11px] text-slate-400 font-medium">{m.batchTime}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added Recently</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Internal Alerts</h3>
          <div className="space-y-4 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
            {notices.map(notice => (
              <div key={notice.id} className="p-4 border-l-2 border-[#84cc16] bg-slate-50/50 rounded-r-xl">
                 <h4 className="text-xs font-bold text-slate-800 uppercase mb-1">{notice.title}</h4>
                 <p className="text-xs text-slate-500 leading-relaxed">{notice.content}</p>
                 <p className="text-[10px] text-slate-400 mt-2 font-medium">{notice.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
