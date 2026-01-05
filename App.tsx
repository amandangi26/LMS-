
import React, { useState, useEffect } from 'react';
import { View, Resource, Member, Payment, AccessLog, AttendanceLog, Notice } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Catalog from './components/Catalog';
import Members from './components/Members';
import AIAssistant from './components/AIAssistant';
import Payments from './components/Payments';
import Batches from './components/Batches';
import Attendance from './components/Attendance';
import ProgressTracker from './components/ProgressTracker';
import History from './components/History';
import { dbService, isDbConfigured } from './services/dbService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'local' | 'error'>('local');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [resources, setResources] = useState<Resource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);

  // Initial Data Fetch
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        if (!isDbConfigured) {
          setDbStatus('local');
          throw new Error("SUPABASE_ANON_KEY is missing. Operating in Local Mode.");
        }

        const [m, r, p, a, n] = await Promise.all([
          dbService.getMembers(),
          dbService.getResources(),
          dbService.getPayments(),
          dbService.getAttendance(),
          dbService.getNotices()
        ]);

        setMembers(m);
        setResources(r);
        setPayments(p);
        setAttendance(a);
        setNotices(n);
        setDbStatus('connected');
      } catch (err: any) {
        const msg = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
        console.warn("Database Sync Notice:", msg);

        // If it's just a missing config, we don't treat it as a scary error
        if (msg.includes("Config Not Found") || msg.includes("missing") || msg.includes("Invalid API key")) {
          setDbStatus('local');
        } else {
          setDbStatus('error');
          setErrorMessage(msg);
        }

        // Fallback to local storage
        const savedMembers = localStorage.getItem('vidya_members');
        const savedResources = localStorage.getItem('vidya_resources');
        const savedPayments = localStorage.getItem('vidya_payments');
        if (savedMembers) setMembers(JSON.parse(savedMembers));
        if (savedResources) setResources(JSON.parse(savedResources));
        if (savedPayments) setPayments(JSON.parse(savedPayments));
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Sync to local storage as secondary backup
  useEffect(() => {
    if (members.length > 0) localStorage.setItem('vidya_members', JSON.stringify(members));
    if (resources.length > 0) localStorage.setItem('vidya_resources', JSON.stringify(resources));
    if (payments.length > 0) localStorage.setItem('vidya_payments', JSON.stringify(payments));
  }, [members, resources, payments]);

  const updateMember = async (updatedMember: Member) => {
    try {
      setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
      if (dbStatus === 'connected') {
        await dbService.upsertMember(updatedMember);
        if (updatedMember.progress && updatedMember.progress.length > 0) {
          const latest = updatedMember.progress[updatedMember.progress.length - 1];
          if (latest.id.length > 12) {
            await dbService.addProgress(updatedMember.id, latest);
          }
        }
      }
    } catch (err) {
      console.error("Member update sync failed:", err);
    }
  };

  const addResource = async (res: Omit<Resource, 'id'>) => {
    try {
      if (dbStatus === 'connected') {
        const saved = await dbService.addResource(res);
        if (saved) setResources(prev => [...prev, saved]);
      } else {
        setResources(prev => [...prev, { ...res, id: 'res-' + Date.now() }]);
      }
    } catch (err) {
      console.error("Resource sync error:", err);
    }
  };

  const removeResource = async (id: string) => {
    try {
      setResources(prev => prev.filter(r => r.id !== id));
      if (dbStatus === 'connected') await dbService.deleteResource(id);
    } catch (err) {
      console.error("Resource deletion error:", err);
    }
  };

  const handleResourceAccess = (resId: string, memberId: string = 'ANONYMOUS_GUEST') => {
    const newLog: AccessLog = {
      id: Date.now().toString(),
      resourceId: resId,
      memberId: memberId,
      accessDate: new Date().toISOString(),
    };
    setAccessLogs(prev => [...prev, newLog]);
  };

  const handleAttendance = async (log: AttendanceLog) => {
    try {
      setAttendance(prev => {
        const existingIdx = prev.findIndex(a => a.id === log.id);
        if (existingIdx > -1) {
          const updated = [...prev];
          updated[existingIdx] = log;
          return updated;
        }
        return [...prev, log];
      });
      if (dbStatus === 'connected') await dbService.upsertAttendance(log);
    } catch (err) {
      console.error("Attendance sync error:", err);
    }
  };

  const handlePayment = async (p: Omit<Payment, 'id'>) => {
    try {
      if (dbStatus === 'connected') {
        const saved = await dbService.addPayment(p);
        if (saved) setPayments(prev => [...prev, saved]);
      } else {
        setPayments(prev => [...prev, { ...p, id: 'pay-' + Date.now() }]);
      }
    } catch (err) {
      console.error("Payment sync error:", err);
    }
  };

  const handleAddMember = async (m: Omit<Member, 'id'>) => {
    try {
      // Members.tsx now handles email generation (manual or auto-unique)
      const email = m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString().slice(-4)}@vidya.com`;

      if (dbStatus === 'connected') {
        const saved = await dbService.upsertMember({ ...m, email, status: 'Active' });
        if (saved) setMembers(prev => [...prev, { ...m, id: saved.id, email, status: 'Active' }]);
      } else {
        setMembers(prev => [...prev, { ...m, id: 'mem-' + Date.now(), email, status: 'Active' }]);
      }
    } catch (err) {
      console.error("Member creation sync error:", err);
    }
  };

  const handleAddMembersBulk = async (membersArr: Omit<Member, 'id'>[]) => {
    try {
      if (membersArr.length === 0) return;
      if (dbStatus === 'connected') {
        const results = await Promise.all(membersArr.map(m => dbService.upsertMember({ ...m, email: m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}.${Date.now().toString().slice(-4)}@vidya.com`, status: 'Active' })));
        const toAdd = results.map((r, i) => ({ ...membersArr[i], id: r?.id || 'mem-' + Date.now() + '-' + i, email: membersArr[i].email || r?.email || '', status: 'Active' } as Member));
        setMembers(prev => [...prev, ...toAdd]);
      } else {
        const now = Date.now();
        const toAdd = membersArr.map((m, i) => ({ ...m, id: 'mem-' + (now + i), email: m.email || `${m.name.toLowerCase().replace(/\s+/g, '.')}.${(now + i).toString().slice(-4)}@vidya.com`, status: 'Active' } as Member));
        setMembers(prev => [...prev, ...toAdd]);
      }
    } catch (err) {
      console.error('Bulk member creation error:', err);
    }
  };

  const handleArchiveMember = async (id: string, reason: string) => {
    try {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'Archived', archiveReason: reason, archivedAt: new Date().toISOString() } : m));
      if (dbStatus === 'connected') await dbService.archiveMember(id, reason);
    } catch (err) {
      console.error("Archive error:", err);
    }
  };

  const handleRestoreMember = async (id: string) => {
    try {
      setMembers(prev => prev.map(m => m.id === id ? { ...m, status: 'Active', archiveReason: undefined, archivedAt: undefined } : m));
      if (dbStatus === 'connected') await dbService.restoreMember(id);
    } catch (err) {
      console.error("Restore error:", err);
    }
  };

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Authenticating Vidya Node...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {dbStatus === 'error' && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl mb-6">
            <p className="text-rose-600 text-xs font-bold uppercase tracking-wider mb-1 flex items-center">
              <span className="mr-2">⚠️</span> System Alert
            </p>
            <p className="text-rose-500 text-[10px] font-medium leading-relaxed">
              External Database could not be reached. Using **Secure Local Storage**.
              {errorMessage && <span className="block mt-1 opacity-70">Log: {errorMessage}</span>}
            </p>
          </div>
        )}

        {(() => {
          switch (currentView) {
            case 'dashboard':
              return <Dashboard
                resources={resources} members={members.filter(m => m.status !== 'Archived')}
                payments={payments} notices={notices}
                onExport={() => { }} onImport={() => { }}
              />;
            case 'catalog': return <Catalog
              resources={resources}
              accessLogs={accessLogs}
              onAdd={addResource}
              onAccess={handleResourceAccess}
              onRemove={removeResource}
            />;
            case 'members':
              return <Members
                members={members.filter(m => m.status !== 'Archived')}
                payments={payments}
                onAddMember={handleAddMember}
                onAddMembersBulk={handleAddMembersBulk}
                onArchiveMember={handleArchiveMember}
                onUpdateMember={updateMember}
              />;
            case 'history':
              return <History members={members} onRestore={handleRestoreMember} />;
            case 'progress': return <ProgressTracker members={members} onUpdateMember={updateMember} />;
            case 'batch': return <Batches members={members} />;
            case 'payments': return <Payments members={members} payments={payments} onPay={handlePayment} />;
            case 'ai-assistant': return <AIAssistant resources={resources} members={members} logs={accessLogs} />;
            case 'attendance': return <Attendance members={members} attendance={attendance} onUpdate={handleAttendance} />;
            default: return <Dashboard resources={resources} members={members} payments={payments} notices={notices} onExport={() => { }} onImport={() => { }} />;
          }
        })()}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase leading-none">Vidya Library</h1>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase mt-1.5">Registry Node • Mohanpur Bazar</p>
          </div>
          <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${dbStatus === 'connected' ? 'bg-white border-slate-200 text-slate-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
            }`}>
            <span className={`w-2 h-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-400'
              }`}></span>
            <span>{dbStatus === 'connected' ? 'Cloud Integrated' : 'Local Registry Active'}</span>
          </div>
        </header>
        {renderView()}
      </main>
    </div>
  );
};

export default App;
