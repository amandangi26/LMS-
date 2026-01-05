
import React, { useState } from 'react';
import { Member, Payment, ProgressEntry } from '../types';
import { Icons } from '../constants';
import * as XLSX from 'xlsx';

interface MembersProps {
  members: Member[];
  payments: Payment[];
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onAddMembersBulk?: (members: Omit<Member, 'id'>[]) => void;
  onArchiveMember: (id: string, reason: string) => void;
  onUpdateMember: (member: Member) => void;
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

const Members: React.FC<MembersProps> = ({ members, payments, onAddMember, onAddMembersBulk, onArchiveMember, onUpdateMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [trackingMember, setTrackingMember] = useState<Member | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [newScore, setNewScore] = useState({ subject: '', score: '' });

  // Archive Modal State
  const [archiveTarget, setArchiveTarget] = useState<string | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  const [newMember, setNewMember] = useState<Omit<Member, 'id'>>({
    name: '', fatherName: '', address: '', phone: '', seatNo: '', batchTime: '', fee: '', dues: '',
    joinDate: new Date().toISOString().split('T')[0], membershipStatus: 'Basic', email: '',
  });

  const getEffectiveDues = (member: Member) => {
    const registryDues = parseDues(member.dues);
    const appPayments = payments.filter(p => p.memberId === member.id).reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, registryDues - appPayments);
  };

  const filteredMembers = members.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
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
    if (plan) setNewMember({ ...newMember, batchTime: plan.time, fee: plan.fee });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalEmail = newMember.email;
    if (!finalEmail || finalEmail.trim() === '') {
      const uniqueSuffix = Date.now().toString().slice(-4);
      finalEmail = `${newMember.name.toLowerCase().replace(/\s+/g, '.')}.${uniqueSuffix}@vidya.com`;
    }
    onAddMember({ ...newMember, email: finalEmail });
    setShowAddForm(false);
  };

  const parseCsvToMembers = (csv: string): Omit<Member, 'id'>[] => {
    // Robust CSV parser supporting quoted values and commas inside quotes
    const rows = csv.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
    if (rows.length === 0) return [];

    const splitRow = (line: string) => {
      const cols: string[] = [];
      let cur = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = !inQuotes; }
          continue;
        }
        if (ch === ',' && !inQuotes) { cols.push(cur); cur = ''; continue; }
        cur += ch;
      }
      cols.push(cur);
      return cols.map(c => c.trim());
    };

    const header = splitRow(rows[0]).map(h => h.trim().toLowerCase());
    const dataRows = rows.slice(1);
    return dataRows.map(r => {
      const cols = splitRow(r);
      const obj: any = {};
      header.forEach((h, i) => { obj[h] = (cols[i] ?? '').trim(); });
      return {
        name: (obj.name || obj.student_name || '').toUpperCase(),
        fatherName: (obj.fathername || obj.father_name || obj.fathers_name || '').toUpperCase(),
        address: obj.address || '',
        phone: obj.phone || obj.contact || obj.mobile || '',
        seatNo: obj.seatno || obj.seat_no || obj.seat || '',
        batchTime: obj.batchtime || obj.batch_time || obj.batch || '',
        fee: obj.fee || '',
        dues: obj.dues || '',
        joinDate: obj.joindate || obj.join_date || obj.join || new Date().toISOString().split('T')[0],
        membershipStatus: obj.membershipstatus || obj.membership_status || 'Basic',
        email: obj.email || ''
      } as Omit<Member, 'id'>;
    }).filter(m => m.name && m.phone);
  };

  const handleBulkImport = () => {
    if (!bulkText) return;
    const parsed = parseCsvToMembers(bulkText);
    if (parsed.length === 0) return;
    // Prefer bulk prop if provided, otherwise fall back to single adds
    if (typeof onAddMembersBulk === 'function') {
      onAddMembersBulk(parsed);
    } else {
      parsed.forEach(p => onAddMember(p));
    }
    setBulkText('');
    setShowBulkModal(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (ev) => { setBulkText(String(ev.target?.result || '')); };
      reader.readAsText(file);
      return;
    }

    if (name.endsWith('.xls') || name.endsWith('.xlsx')) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = ev.target?.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(firstSheet);
          setBulkText(csv);
        } catch (err) {
          console.error('Excel parse error', err);
        }
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    // Fallback: try reading as text
    const reader = new FileReader();
    reader.onload = (ev) => { setBulkText(String(ev.target?.result || '')); };
    reader.readAsText(file);
  };

  const handleConfirmArchive = () => {
    if (archiveTarget && archiveReason) {
      onArchiveMember(archiveTarget, archiveReason);
      setArchiveTarget(null);
      setArchiveReason('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Registry..."
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={() => setShowBulkModal(true)} className="bg-emerald-500 text-white px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 shadow-md">
            <span>Bulk Upload</span>
          </button>
          <button onClick={() => setShowAddForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center space-x-2 shadow-lg">
            <Icons.Plus className="w-5 h-5" />
            <span>Add Registry Entry</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50">
            <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-4 py-4">S.N.</th>
              <th className="px-4 py-4">Student Name</th>
              <th className="px-4 py-4">Seat</th>
              <th className="px-4 py-4">Status</th>
              <th className="px-4 py-4 text-right pr-6">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredMembers.map((member, index) => (
              <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-4 text-[10px] font-black text-slate-400">{index + 1}</td>
                <td className="px-4 py-4">
                  <p className="font-bold text-slate-800 text-xs uppercase">{member.name}</p>
                  <p className="text-[9px] text-slate-400">{member.phone}</p>
                </td>
                <td className="px-4 py-4">
                  <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-black">{member.seatNo}</span>
                </td>
                <td className="px-4 py-4">
                  {getEffectiveDues(member) === 0 ? <span className="text-[9px] font-black text-emerald-600">PAID</span> : <span className="text-[9px] font-black text-rose-600">₹{getEffectiveDues(member)} DUE</span>}
                </td>
                <td className="px-4 py-4 text-right pr-6 flex justify-end space-x-2">
                  <button onClick={() => setEditMember(member)} className="p-2 text-slate-600 hover:bg-slate-50 rounded-lg" title="Edit Student">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                    </svg>
                  </button>
                  <button onClick={() => setTrackingMember(member)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg" title="Progress">
                    <Icons.AI className="w-4 h-4" />
                  </button>
                  <button onClick={() => setArchiveTarget(member.id)} className="p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors" title="Archive Student">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress/AI Modal */}
      {trackingMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-4xl shadow-4xl overflow-hidden">
            <div className="p-10 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter">{trackingMember.name}</h3>
                <p className="text-[10px] font-black text-[#84cc16] uppercase tracking-[0.2em] mt-1">Local Progress Hub</p>
              </div>
              <button onClick={() => setTrackingMember(null)} className="p-4 bg-white/10 rounded-2xl"><Icons.Plus className="w-6 h-6 rotate-45" /></button>
            </div>

            <div className="p-12 grid grid-cols-1 lg:grid-cols-2 gap-10 bg-slate-50/30">
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl">
                <h5 className="text-xs font-black text-slate-800 uppercase mb-8">Add Mock Result</h5>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <input type="text" placeholder="SUBJECT" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={newScore.subject} onChange={e => setNewScore({ ...newScore, subject: e.target.value })} />
                  <input type="number" placeholder="SCORE %" className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold" value={newScore.score} onChange={e => setNewScore({ ...newScore, score: e.target.value })} />
                </div>
                <button onClick={handleAddScore} className="w-full bg-[#84cc16] text-white py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-[#84cc16]/20">Save Result to Local DB</button>
              </div>

              <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                {(trackingMember.progress || []).slice().reverse().map(item => (
                  <div key={item.id} className="p-6 bg-white rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase">{item.subject}</p>
                      <p className="text-[9px] text-slate-400 font-bold">{item.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-indigo-600">{item.score}</p>
                      <p className="text-[8px] font-black text-emerald-500 uppercase">Synced</p>
                    </div>
                  </div>
                ))}
                {(!trackingMember.progress || trackingMember.progress.length === 0) && <p className="text-center py-20 text-slate-300 font-bold uppercase text-[10px]">No scores recorded yet beta.</p>}
              </div>
            </div>
            <div className="p-8 bg-white border-t border-slate-100 flex justify-end">
              <button onClick={() => setTrackingMember(null)} className="px-12 py-4 bg-slate-900 text-[#84cc16] rounded-2xl text-[10px] font-black uppercase shadow-lg">Back to Registry</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase text-slate-800">New Admission Entry</h3>
              <button onClick={() => setShowAddForm(false)}><Icons.Plus className="w-6 h-6 rotate-45 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Registration Plan</label>
                <select onChange={handlePlanSelect} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-indigo-500 transition-colors">
                  <option value="">Choose Official Batch...</option>
                  {OFFICIAL_PLANS.map(p => <option key={p.label} value={p.label}>{p.label}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Full Name</label>
                <input required placeholder="Student Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value.toUpperCase() })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Father's Name</label>
                <input required placeholder="Father Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.fatherName} onChange={e => setNewMember({ ...newMember, fatherName: e.target.value.toUpperCase() })} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Residential Address</label>
                <input required placeholder="Complete Home Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500" value={newMember.address} onChange={e => setNewMember({ ...newMember, address: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Contact Number</label>
                <input required placeholder="Mobile No." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.phone} onChange={e => setNewMember({ ...newMember, phone: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Seat Allocation</label>
                <input required placeholder="Seat No." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.seatNo} onChange={e => setNewMember({ ...newMember, seatNo: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Initial Dues</label>
                <input placeholder="Ex: 500/-" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.dues} onChange={e => setNewMember({ ...newMember, dues: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Join Date</label>
                <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.joinDate} onChange={e => setNewMember({ ...newMember, joinDate: e.target.value })} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Email Address (Optional)</label>
                <input placeholder="Ex: student@gmail.com (Leave blank to auto-generate)" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={newMember.email} onChange={e => setNewMember({ ...newMember, email: e.target.value })} />
              </div>

              <button type="submit" className="col-span-1 md:col-span-2 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase shadow-xl hover:shadow-2xl transition-all mt-4">Complete Registry Entry</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {editMember && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black uppercase text-slate-800">Edit Student</h3>
              <button onClick={() => setEditMember(null)}><Icons.Plus className="w-6 h-6 rotate-45 text-slate-400" /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault();
                let finalEmail = editMember.email;
                if (!finalEmail || finalEmail.trim() === '') {
                  const uniqueSuffix = Date.now().toString().slice(-4);
                  finalEmail = `${editMember.name.toLowerCase().replace(/\s+/g, '.')}.${uniqueSuffix}@vidya.com`;
                }
                onUpdateMember({ ...editMember, email: finalEmail });
                setEditMember(null);
              }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Full Name</label>
                <input required placeholder="Student Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.name} onChange={e => setEditMember({ ...editMember, name: e.target.value.toUpperCase() })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Father's Name</label>
                <input required placeholder="Father Name" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.fatherName} onChange={e => setEditMember({ ...editMember, fatherName: e.target.value.toUpperCase() })} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Residential Address</label>
                <input required placeholder="Complete Home Address" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-indigo-500" value={editMember.address} onChange={e => setEditMember({ ...editMember, address: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Contact Number</label>
                <input required placeholder="Mobile No." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.phone} onChange={e => setEditMember({ ...editMember, phone: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Seat Allocation</label>
                <input required placeholder="Seat No." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.seatNo} onChange={e => setEditMember({ ...editMember, seatNo: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Initial Dues</label>
                <input placeholder="Ex: 500/-" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.dues} onChange={e => setEditMember({ ...editMember, dues: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Join Date</label>
                <input type="date" required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.joinDate} onChange={e => setEditMember({ ...editMember, joinDate: e.target.value })} />
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1 mb-1 block">Email Address</label>
                <input placeholder="student@gmail.com" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-indigo-500" value={editMember.email} onChange={e => setEditMember({ ...editMember, email: e.target.value })} />
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-end space-x-3 mt-2">
                <button type="button" onClick={() => setEditMember(null)} className="py-3 px-4 border rounded-xl">Cancel</button>
                <button type="submit" className="py-3 px-6 bg-indigo-600 text-white rounded-xl font-bold">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-3xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black uppercase">Bulk Import Students (CSV)</h3>
              <button onClick={() => setShowBulkModal(false)}><Icons.Plus className="w-6 h-6 rotate-45 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-500 mb-3">Provide CSV with header. Example headers: name,phone,fatherName,address,seatNo,batchTime,fee,dues,joinDate,email</p>
            <div className="flex items-center gap-4 mb-3">
              <input type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" onChange={handleFileSelect} className="text-sm" />
              <button onClick={() => setBulkText('')} className="text-xs px-3 py-1 border rounded">Clear</button>
            </div>
            <textarea value={bulkText} onChange={e => setBulkText(e.target.value)} className="w-full h-48 p-3 border border-slate-200 rounded-xl mb-4 font-mono text-sm" placeholder={`name,phone,fatherName,address,seatNo,batchTime,fee,dues,joinDate,email\nJohn Doe,9876543210,Mr Doe,Some Address,12,06AM-10AM,299,0,2026-01-01,john@example.com`}></textarea>
            <div className="flex justify-end space-x-3">
              <button onClick={() => { setBulkText(''); setShowBulkModal(false); }} className="py-2 px-4 rounded-xl border">Cancel</button>
              <button onClick={handleBulkImport} className="py-2 px-4 bg-emerald-600 text-white rounded-xl font-bold">Import</button>
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-4">Archive Student?</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">This will move the student to the History section. They can be restored later.</p>

            <div className="space-y-2 mb-6">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Reason for Leaving</label>
              <select
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
              >
                <option value="">Select Reason...</option>
                <option value="Course Completed">Course Completed</option>
                <option value="Fees Issue">Fees Issue</option>
                <option value="Relocated">Relocated</option>
                <option value="Personal Reasons">Personal Reasons</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button onClick={() => setArchiveTarget(null)} className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
              <button
                onClick={handleConfirmArchive}
                disabled={!archiveReason}
                className="flex-1 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
