
import React, { useState, useEffect, useRef } from 'react';
import { Member, Payment, ProgressEntry } from '../types';
import { Icons } from '../constants';

interface MembersProps {
  members: Member[];
  payments: Payment[];
  onAddMember: (member: Omit<Member, 'id'>) => Promise<void>;
  onDeleteMember: (id: string) => void;
  onUpdateMember: (member: Member) => void;
  showNotification: (type: 'success' | 'error' | 'info', message: string, subMessage?: string) => void;
}

const OFFICIAL_PLANS = [
  { label: 'Plan 1: 06AM-10AM (No AC)', time: '06AM-10AM (4 HOUR) WITHOUT AC', fee: '299/-' },
  { label: 'Plan 2: 10AM-02PM', time: '10AM-02PM (4 HOUR)', fee: '399/-' },
  { label: 'Plan 3: 02PM-06PM', time: '02PM-06PM (4 HOUR)', fee: '399/-' },
  { label: 'Plan 4: 06PM-10PM (Happy Hour)', time: '06PM-10PM (4 HOUR) HAPPY HOUR', fee: '399/-' },
  { label: 'Plan 5: Two Shift (10AM-06PM)', time: 'TWO SHIFT (10AM-06PM)', fee: '799/-' },
  { label: 'Plan 6: Full Shift (06AM-06PM)', time: 'FULL SHIFT (06AM-06PM)', fee: '1199/-' },
];

const parseDues = (duesStr: string): number => {
  if (!duesStr || duesStr.toLowerCase().includes('paid')) return 0;
  const cleanStr = duesStr.replace(/\/\-|\s/g, '').trim();
  if (cleanStr.includes('+')) {
    return cleanStr.split('+').reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }
  return parseFloat(cleanStr) || 0;
};

const Members: React.FC<MembersProps> = ({ members, payments, onAddMember, onDeleteMember, onUpdateMember, showNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [trackingMember, setTrackingMember] = useState<Member | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newScore, setNewScore] = useState({ subject: '', score: '' });

  const [newMember, setNewMember] = useState<Omit<Member, 'id'>>({
    name: '', fatherName: '', address: '', phone: '', seatNo: '', batchTime: '', fee: '', dues: '',
    joinDate: new Date().toISOString().split('T')[0], membershipStatus: 'Basic', email: '', password: '',
    idProofType: '', idProofImage: '',
  });


  const getEffectiveDues = (member: Member) => {
    const registryDues = parseDues(member.dues);
    const appPayments = payments.filter(p => p.memberId === member.id).reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, registryDues - appPayments);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.phone.includes(searchTerm) ||
    m.seatNo.includes(searchTerm) ||
    m.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddScore = () => {
    if (!trackingMember || !newScore.subject || !newScore.score) return;
    const entry: ProgressEntry = {
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      subject: newScore.subject.toUpperCase(),
      score: newScore.score + '%',
    };
    const updated = { ...trackingMember, progress: [...(trackingMember.progress || []), entry] };
    onUpdateMember(updated);
    setTrackingMember(updated);
    setNewScore({ subject: '', score: '' });
  };

  const handlePlanSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const plan = OFFICIAL_PLANS.find(p => p.label === e.target.value);
    if (plan) {
      setNewMember({ ...newMember, batchTime: plan.time, fee: plan.fee });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const finalEmail = newMember.email || `${newMember.name.toLowerCase().replace(/\s+/g, '.')}@vidya.com`;
      await onAddMember({ ...newMember, email: finalEmail });

      setShowAddForm(false);
      setNewMember({
        name: '', fatherName: '', address: '', phone: '', seatNo: '', batchTime: '', fee: '', dues: '',
        joinDate: new Date().toISOString().split('T')[0], membershipStatus: 'Basic', email: '', password: '',
        idProofType: '', idProofImage: '',
      });
    } catch (error: any) {
      console.error("Submission error:", error);
      showNotification('error', 'Admission Failed', error.message || 'Check for duplicate entries (e.g. Seat No)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Registry (Name, Address, Seat)..."
            className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => setShowAddForm(true)} className="bg-[#84cc16] text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 shadow-lg hover:bg-[#84cc16]/90 transition-all active:scale-95">
          <Icons.Plus className="w-5 h-5" />
          <span>New Admission</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-x-auto transition-colors">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-900/50">
            <tr className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-4 py-4">S.N.</th>
              <th className="px-4 py-4">Student Info</th>
              <th className="px-4 py-4">Seat No.</th>
              <th className="px-4 py-4">Address</th>
              <th className="px-4 py-4">Financials</th>
              <th className="px-4 py-4 text-right pr-6">Track</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredMembers.map((member, index) => (
              <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group">
                <td className="px-4 py-4 text-[10px] font-black text-slate-400 dark:text-slate-500">{index + 1}</td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase">{member.name}</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">S/O: {member.fatherName}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg text-[10px] font-black">{member.seatNo}</span>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-900/40 px-2 py-1 rounded inline-block">{member.address}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Fee: {member.fee}</p>
                  {getEffectiveDues(member) === 0 ?
                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">PAID</span> :
                    <span className="text-[9px] font-black text-rose-600 dark:text-rose-400">₹{getEffectiveDues(member)} DUE</span>
                  }
                </td>
                <td className="px-4 py-4 text-right pr-6">
                  <div className="flex justify-end space-x-2">
                    <button onClick={() => setTrackingMember(member)} className="p-2 text-[#84cc16] hover:bg-[#84cc16]/10 rounded-lg transition-colors">
                      <Icons.AI className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDeleteMember(member.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {trackingMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-4xl shadow-4xl overflow-hidden border border-white dark:border-slate-700 transition-colors animate-in zoom-in-95 duration-300">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{trackingMember.name}</h3>
                <p className="text-[10px] font-black text-[#84cc16] uppercase tracking-[0.2em] mt-1">Student Registry Details</p>
              </div>
              <button onClick={() => setTrackingMember(null)} className="p-4 bg-white/10 rounded-2xl hover:bg-white/20 transition-all"><Icons.Plus className="w-6 h-6 rotate-45" /></button>
            </div>

            <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-50/30 dark:bg-slate-900/20">
              <div className="bg-white dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 shadow-xl space-y-6">
                <div>
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student UUID (Login ID)</h5>
                  <p className="text-sm font-bold text-[#84cc16] font-mono break-all bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">{trackingMember.id}</p>
                </div>


                <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add Mock Result</h5>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <input type="text" placeholder="SUBJECT" className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20" value={newScore.subject} onChange={e => setNewScore({ ...newScore, subject: e.target.value })} />
                    <input type="number" placeholder="SCORE %" className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20" value={newScore.score} onChange={e => setNewScore({ ...newScore, score: e.target.value })} />
                  </div>
                  <button onClick={handleAddScore} className="w-full bg-[#84cc16] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#84cc16]/20 active:scale-95 transition-all">Save Result</button>
                </div>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {(trackingMember.progress || []).slice().reverse().map(item => (
                  <div key={item.id} className="p-6 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase">{item.subject}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-[#84cc16] uppercase tracking-tighter">{item.score}</p>
                    </div>
                  </div>
                ))}
                {(!trackingMember.progress || trackingMember.progress.length === 0) && <p className="text-center py-20 text-slate-300 dark:text-slate-600 font-bold uppercase text-[10px]">No scores recorded.</p>}
              </div>
            </div>
            <div className="p-8 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button onClick={() => setTrackingMember(null)} className="px-12 py-4 bg-slate-900 text-[#84cc16] rounded-2xl text-[10px] font-black uppercase shadow-lg hover:bg-slate-800 transition-all">Back to Registry</button>
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-3xl p-10 shadow-4xl border border-white dark:border-slate-700 animate-in zoom-in-95 duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black uppercase text-slate-800 dark:text-white tracking-tighter">Student Registration</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-1">Assign Credentials & Registry Details</p>
              </div>
              <button onClick={() => setShowAddForm(false)} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:rotate-90 transition-all">
                <Icons.Plus className="w-6 h-6 rotate-45 text-slate-400 dark:text-slate-600" />
              </button>
            </div>


            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                <label className="text-[10px] font-black text-[#84cc16] uppercase tracking-widest block">Digital Access Security</label>
                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Set Access Password</label>
                    <input
                      required
                      type="text"
                      placeholder="SET PASSWORD (MIN 6 CHARS)"
                      className="w-full p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20"
                      value={newMember.password}
                      onChange={e => setNewMember({ ...newMember, password: e.target.value })}
                    />
                    <p className="text-[9px] text-slate-400 mt-2 ml-1 italic font-medium">Student will use their auto-generated UUID and this password to login.</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Personal Details</label>
                  <input required placeholder="STUDENT FULL NAME" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value.toUpperCase() })} />
                  <input required placeholder="FATHER'S NAME" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.fatherName} onChange={e => setNewMember({ ...newMember, fatherName: e.target.value.toUpperCase() })} />
                  <input required placeholder="CONTACT PHONE" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} />
                  <input required placeholder="ADDRESS" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.address} onChange={e => setNewMember({ ...newMember, address: e.target.value.toUpperCase() })} />
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Library Matrix</label>
                  <select onChange={handlePlanSelect} className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none">
                    <option value="">Select Shift Plan...</option>
                    {OFFICIAL_PLANS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                  </select>
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="SEAT NO." className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.seatNo} onChange={e => setNewMember({ ...newMember, seatNo: e.target.value })} />
                    <input required placeholder="MONTHLY FEE" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.fee} onChange={e => setNewMember({ ...newMember, fee: e.target.value })} />
                  </div>
                  <input placeholder="INITIAL DUES" className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold dark:text-white outline-none" value={newMember.dues} onChange={e => setNewMember({ ...newMember, dues: e.target.value })} />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-slate-700 flex space-x-4">
                <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Discard</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-[#84cc16] disabled:bg-[#84cc16]/50 text-white py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                  {isSubmitting ? 'Registering...' : 'Submit Registry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
