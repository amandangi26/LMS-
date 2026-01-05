
import React, { useState } from 'react';
import { Member } from '../types';
import { Icons } from '../constants';

interface HistoryProps {
    members: Member[];
    onRestore: (id: string) => void;
}

const History: React.FC<HistoryProps> = ({ members, onRestore }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const archivedMembers = members.filter(m => m.status === 'Archived');

    const filteredMembers = archivedMembers.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.archiveReason?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Alumni & History</h2>
                    <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Archived Student Records</p>
                </div>
                <div className="relative w-full md:w-80">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search archives..."
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-[#84cc16]/20 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMembers.length > 0 ? filteredMembers.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Icons.Members className="w-16 h-16 text-slate-900" />
                        </div>

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider">
                                Left: {m.archivedAt ? new Date(m.archivedAt).toLocaleDateString() : 'N/A'}
                            </span>
                            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                        </div>

                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-1 relative z-10">{m.name}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 relative z-10">
                            Reason: {m.archiveReason || 'Not Specified'}
                        </p>

                        <button
                            onClick={() => onRestore(m.id)}
                            className="w-full py-3 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-900 hover:text-[#84cc16] hover:border-slate-900 transition-all relative z-10 flex items-center justify-center space-x-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Restore Profile</span>
                        </button>
                    </div>
                )) : (
                    <div className="col-span-full py-20 text-center">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                            <Icons.Members className="w-8 h-8" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No Archived Records Found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default History;
