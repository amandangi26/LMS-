
import React, { useState } from 'react';
// Changed Book to Resource and Loan to AccessLog to match types.ts
import { Resource, Member, AccessLog } from '../types';
import { Icons } from '../constants';

interface CirculationProps {
  resources: Resource[];
  members: Member[];
  logs: AccessLog[];
  onAccess: (resId: string, memId: string) => void;
}

const Circulation: React.FC<CirculationProps> = ({ resources, members, logs, onAccess }) => {
  const [selectedRes, setSelectedRes] = useState('');
  const [selectedMem, setSelectedMem] = useState('');

  const handleIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRes && selectedMem) {
      onAccess(selectedRes, selectedMem);
      setSelectedRes('');
      setSelectedMem('');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
            <Icons.Plus className="w-5 h-5 text-indigo-600" />
            <span>Grant Resource Access</span>
          </h3>
          <form onSubmit={handleIssue} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Resource</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selectedRes}
                onChange={(e) => setSelectedRes(e.target.value)}
              >
                <option value="">Choose a resource...</option>
                {resources.map(res => (
                  <option key={res.id} value={res.id}>{res.title} ({res.author})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Select Member</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={selectedMem}
                onChange={(e) => setSelectedMem(e.target.value)}
              >
                <option value="">Choose a member...</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.email})</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={!selectedRes || !selectedMem}
              className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4 shadow-lg shadow-indigo-600/10"
            >
              Access Resource
            </button>
          </form>
        </div>

        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
          <h4 className="font-bold text-indigo-800 text-sm mb-2 uppercase tracking-wide">Digital Policy</h4>
          <ul className="text-sm text-indigo-700 space-y-2">
            <li className="flex items-start space-x-2">
              <span className="mt-1">•</span>
              <span>All resources are digital and accessed via cloud links.</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="mt-1">•</span>
              <span>Access is logged automatically for auditing purposes.</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm h-fit">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
          <Icons.Circulation className="w-5 h-5 text-indigo-600" />
          <span>Recent Digital Access History</span>
        </h3>
        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
          {logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <p>No activity recorded yet</p>
            </div>
          ) : (
            logs.slice(-10).reverse().map(log => {
              const res = resources.find(r => r.id === log.resourceId);
              const member = members.find(m => m.id === log.memberId);
              return (
                <div key={log.id} className="p-4 rounded-xl border border-slate-100 hover:border-indigo-100 bg-white transition-all flex justify-between items-center group">
                  <div>
                    <h5 className="font-bold text-slate-800">{res?.title}</h5>
                    <p className="text-xs text-slate-500 mb-2">Member: <span className="text-slate-700 font-medium">{member?.name}</span></p>
                    <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">Access Date</span>
                        <span className="text-xs font-semibold text-indigo-600">{new Date(log.accessDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default Circulation;
