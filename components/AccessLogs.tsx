
import React, { useState } from 'react';
import { Resource, Member, AccessLog } from '../types';
import { Icons } from '../constants';

interface AccessLogsProps {
  resources: Resource[];
  members: Member[];
  logs: AccessLog[];
  onAccess: (resId: string, memId: string) => void;
}

const AccessLogs: React.FC<AccessLogsProps> = ({ resources, members, logs, onAccess }) => {
  const [selectedRes, setSelectedRes] = useState('');
  const [selectedMem, setSelectedMem] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm h-fit">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">⚡</div>
          <span>Instant Access</span>
        </h3>
        <p className="text-sm text-slate-500 mb-6">Select a member and a digital resource to record access and open the link.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Member</label>
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={selectedMem} onChange={e => setSelectedMem(e.target.value)}>
              <option value="">Select Member...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.membershipStatus})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Resource</label>
            <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm" value={selectedRes} onChange={e => setSelectedRes(e.target.value)}>
              <option value="">Select Resource...</option>
              {resources.map(r => <option key={r.id} value={r.id}>[{r.type}] {r.title}</option>)}
            </select>
          </div>
          <button 
            disabled={!selectedRes || !selectedMem}
            onClick={() => { onAccess(selectedRes, selectedMem); setSelectedRes(''); setSelectedMem(''); }}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            Launch Resource
          </button>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">📖</div>
          <span>Real-time Access Stream</span>
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {logs.slice().reverse().map(log => {
            const res = resources.find(r => r.id === log.resourceId);
            const mem = members.find(m => m.id === log.memberId);
            return (
              <div key={log.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                <div>
                  <h4 className="font-bold text-slate-800">{res?.title}</h4>
                  <p className="text-xs text-slate-400 italic">Accessed by {mem?.name}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-1 rounded-lg font-bold">ONLINE</span>
                  <p className="text-[10px] text-slate-400 mt-1">{new Date(log.accessDate).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
          {logs.length === 0 && <div className="text-center py-20 text-slate-300">No logs found.</div>}
        </div>
      </div>
    </div>
  );
};

export default AccessLogs;
