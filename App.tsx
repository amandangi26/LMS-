
import React, { useState, useEffect } from 'react';
import { View, Resource, Member, Payment, AccessLog, AttendanceLog, Notice, UserRole, ReplacementRequest, ChatMessage } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import StudentDashboard from './components/StudentDashboard';
import Catalog from './components/Catalog';
import Members from './components/Members';
import AIAssistant from './components/AIAssistant';
import Payments from './components/Payments';
import Batches from './components/Batches';
import Attendance from './components/Attendance';
import ProgressTracker from './components/ProgressTracker';
import Replacements from './components/Replacements';
import Settings from './components/Settings';
import Archive from './components/Archive';
import CommunityChat from './components/CommunityChat';
import Login from './components/Login';
import ForcePasswordChange from './components/ForcePasswordChange';
import Notification, { NotificationType } from './components/Notification';
import { dbService, isDbConfigured, generateUUID } from './services/dbService';

const SEED_RESOURCES: Resource[] = [
  {
    id: 'ssc-cgl-syll',
    title: 'SSC CGL 2024 OFFICIAL SYLLABUS',
    author: 'Staff Selection Commission',
    category: 'SSC',
    subject: 'GENERAL AWARENESS',
    type: 'PDF',
    accessUrl: 'https://ssc.gov.in/api/attachments/notices/Notice_CGL_2024.pdf',
    thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=400',
    description: 'Detailed official notification including exam pattern, tier-wise syllabus, and marking scheme for CGL 2024.'
  }
];

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem('vidya_role');
    // For admin security, do not persist admin sessions across browser restarts
    if (saved === 'admin') return null;
    return (saved as UserRole) || null;
  });
  const [currentStudent, setCurrentStudent] = useState<Member | null>(() => {
    const saved = localStorage.getItem('vidya_student');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<'connected' | 'local' | 'error'>('local');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('vidya_theme') === 'dark');

  const [resources, setResources] = useState<Resource[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [attendance, setAttendance] = useState<AttendanceLog[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replacementRequests, setReplacementRequests] = useState<ReplacementRequest[]>(() => {
    const saved = localStorage.getItem('vidya_replacements');
    return saved ? JSON.parse(saved) : [];
  });

  // Notification State
  const [notification, setNotification] = useState<{ type: NotificationType; message: string; subMessage?: string; isVisible: boolean }>({
    type: 'success', message: '', isVisible: false
  });

  const showNotification = (type: NotificationType, message: string, subMessage?: string) => {
    setNotification({ type, message, subMessage, isVisible: true });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const checkConnection = async () => {
    try {
      showNotification('info', 'Verifying Connection...', 'Pinging Cloud Database Node...');
      const start = Date.now();
      await dbService.getMembers(); // Simple read to check connection
      const end = Date.now();
      setDbStatus('connected');
      showNotification('success', 'Connection Secure', `Latency: ${end - start}ms`);
    } catch (error: any) {
      setDbStatus('error');
      showNotification('error', 'Connection Failed', error.message || 'Unknown network error');
    }
  };

  useEffect(() => {
    localStorage.setItem('vidya_replacements', JSON.stringify(replacementRequests));
  }, [replacementRequests]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('vidya_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('vidya_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [m, r, p, a, n] = await Promise.all([
          dbService.getMembers().catch(() => []),
          dbService.getResources().catch(() => SEED_RESOURCES),
          dbService.getPayments().catch(() => []),
          dbService.getAttendance().catch(() => []),
          dbService.getNotices().catch(() => [])
        ]);

        setMembers(m);
        setResources(r.length > 0 ? r : SEED_RESOURCES);
        setPayments(p);
        setAttendance(a);
        setNotices(n);
        setDbStatus(isDbConfigured ? 'connected' : 'local');
      } catch (err: any) {
        setDbStatus('local');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Poll for messages every 5 seconds for free "real-time" sync
    const chatInterval = setInterval(async () => {
      try {
        const msgs = await dbService.getMessages();
        setMessages(msgs);
      } catch (err) {
        console.warn("Chat sync failed");
      }
    }, 5000);

    return () => clearInterval(chatInterval);
  }, []);

  useEffect(() => {
    if (userRole === 'student') {
      localStorage.setItem('vidya_role', 'student');
    } else if (userRole === 'admin') {
      // Do not save admin role to localStorage for forced login on every visit
      localStorage.removeItem('vidya_role');
    } else {
      localStorage.removeItem('vidya_role');
    }

    if (currentStudent) {
      localStorage.setItem('vidya_student', JSON.stringify(currentStudent));
      if (currentView === 'dashboard') setCurrentView('student-home');
    } else {
      localStorage.removeItem('vidya_student');
      if (userRole === 'admin' && currentView === 'student-home') setCurrentView('dashboard');
    }
  }, [userRole, currentStudent, currentView]);

  const handleUpdateAccount = async (newPassword: string, newEmail: string) => {
    if (!currentStudent) return;
    const updatedMember = { ...currentStudent, password: newPassword, email: newEmail };
    await dbService.upsertMember(updatedMember);
    setCurrentStudent(updatedMember);
    setMembers(prev => prev.map(m => m.id === updatedMember.id ? updatedMember : m));
  };

  const handleArchiveMember = async (id: string) => {
    try {
      const member = members.find(m => m.id === id);
      if (!member) return;
      const updated = { ...member, isArchived: true };
      const result = await dbService.upsertMember(updated);
      setMembers(prev => prev.map(m => m.id === id ? (result || updated) : m));
    } catch (err: any) {
      alert("Archive karne mein error: " + err.message);
    }
  };

  const handleRestoreMember = async (member: Member) => {
    try {
      const updated = { ...member, isArchived: false };
      const result = await dbService.upsertMember(updated);
      setMembers(prev => prev.map(m => m.id === member.id ? (result || updated) : m));
    } catch (err: any) {
      alert("Restore karne mein error: " + err.message);
    }
  };

  const handleDeleteMember = async (id: string) => {
    try {
      if (!window.confirm("Permanently delete this student from the cloud node? This cannot be undone.")) return;
      await dbService.deleteMember(id);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert("Delete karne mein error: " + err.message);
    }
  };

  const handleAddNotice = async (notice: Omit<Notice, 'id'>) => {
    try {
      const result = await dbService.addNotice(notice);
      if (result) setNotices(prev => [result, ...prev]);
    } catch (err: any) {
      alert("Notice add karne mein error: " + err.message);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await dbService.deleteNotice(id);
      setNotices(prev => prev.filter(n => n.id !== id));
    } catch (err: any) {
      alert("Notice delete karne mein error: " + err.message);
    }
  };

  const handleSendMessage = async (content: string, receiverId: string) => {
    try {
      const msgData: Omit<ChatMessage, 'id' | 'created_at'> = {
        sender_id: userRole === 'admin' ? 'admin' : (currentStudent?.id || 'unknown'),
        receiver_id: receiverId,
        sender_name: userRole === 'admin' ? 'Head Librarian' : (currentStudent?.name || 'Student'),
        sender_role: userRole || 'unknown',
        content
      };
      const result = await dbService.sendMessage(msgData);
      if (result) setMessages(prev => [...prev, result]);
    } catch (err: any) {
      alert("Message send karne mein error: " + err.message);
    }
  };

  const handleAddReplacement = (data: Partial<ReplacementRequest>) => {
    if (!currentStudent) return;
    const newReq: ReplacementRequest = {
      id: generateUUID(),
      memberId: currentStudent.id,
      studentName: currentStudent.name,
      currentSeat: currentStudent.seatNo,
      currentBatch: currentStudent.batchTime,
      requestedSeat: data.requestedSeat,
      requestedBatch: data.requestedBatch,
      reason: data.reason || 'Unspecified reason',
      status: 'Pending',
      date: new Date().toLocaleDateString('en-GB')
    };
    setReplacementRequests(prev => [...prev, newReq]);
  };

  const handleUpdateReplacementStatus = (id: string, status: 'Approved' | 'Rejected') => {
    setReplacementRequests(prev => prev.map(req => {
      if (req.id === id) {
        if (status === 'Approved') {
          const updatedMembers = members.map(m => {
            if (m.id === req.memberId) {
              const updated = {
                ...m,
                seatNo: req.requestedSeat || m.seatNo,
                batchTime: req.requestedBatch || m.batchTime
              };
              if (currentStudent?.id === m.id) setCurrentStudent(updated);
              // Update persistence for DB as well
              dbService.upsertMember(updated);
              return updated;
            }
            return m;
          });
          setMembers(updatedMembers);
        }
        return { ...req, status };
      }
      return req;
    }));
  };

  const handleLogin = (role: UserRole, student?: Member) => {
    setUserRole(role);
    if (student) {
      setCurrentStudent(student);
      setCurrentView('student-home');
    } else {
      setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentStudent(null);
  };

  const needsPasswordChange = userRole === 'student' && currentStudent && (currentStudent.password === 'vidya123' || !currentStudent.password);

  if (!userRole) {
    return <Login onLogin={handleLogin} members={members} />;
  }

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-[#84cc16] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-xs">Authenticating Vidya Node...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard resources={resources} members={members} payments={payments} notices={notices} userRole={userRole as 'admin' | 'student'} onAddNotice={handleAddNotice} onDeleteNotice={handleDeleteNotice} onExport={() => { }} onImport={() => { }} />;
      case 'student-home':
        return currentStudent ? (
          <StudentDashboard
            student={currentStudent}
            notices={notices}
            attendance={attendance}
            payments={payments}
            requests={replacementRequests}
            onViewChange={setCurrentView}
          />
        ) : null;
      case 'catalog':
        return <Catalog resources={resources} accessLogs={accessLogs} onAdd={() => { }} onRemove={() => { }} onAccess={() => { }} />;
      case 'members':
        return <Members
          members={members.filter(m => !m.isArchived)}
          payments={payments}
          onAddMember={async (m) => {
            try {
              const nm = await dbService.upsertMember(m);
              if (nm) {
                setMembers(prev => [...prev, nm]);
                showNotification('success', 'Student Admitted', `Welcome, ${m.name}!`);
              }
            } catch (err: any) {
              console.error("Member creation error", err);
              throw err;
            }
          }}
          onDeleteMember={handleArchiveMember}
          onUpdateMember={(m) => dbService.upsertMember(m).then(() => setMembers(prev => prev.map(old => old.id === m.id ? m : old)))}
          showNotification={showNotification}
        />;
      case 'archive':
        return <Archive members={members} onRestore={handleRestoreMember} />;
      case 'progress':
      case 'my-performance':
        return <ProgressTracker members={userRole === 'student' ? [currentStudent!] : members} onUpdateMember={() => { }} />;
      case 'batch':
        return <Batches members={members} />;
      case 'replacements':
        return (
          <Replacements
            role={userRole}
            members={members}
            requests={replacementRequests}
            currentStudent={currentStudent || undefined}
            onAddRequest={handleAddReplacement}
            onUpdateStatus={handleUpdateReplacementStatus}
          />
        );
      case 'payments':
        return <Payments members={members} payments={payments} onPay={() => { }} />;
      case 'ai-assistant':
        return <AIAssistant resources={resources} members={members} logs={accessLogs} activeStudent={currentStudent || undefined} />;
      case 'attendance':
      case 'my-attendance':
        return <Attendance members={userRole === 'student' ? [currentStudent!] : members} attendance={attendance} onUpdate={() => { }} />;
      case 'chat':
        return <CommunityChat messages={messages} members={members} userRole={userRole} currentStudent={currentStudent || undefined} onSendMessage={handleSendMessage} />;
      case 'settings':
        return <Settings isDarkMode={isDarkMode} onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} />;
      default:
        return <Dashboard resources={resources} members={members} payments={payments} notices={notices} userRole={userRole as 'admin' | 'student'} onAddNotice={handleAddNotice} onDeleteNotice={handleDeleteNotice} onExport={() => { }} onImport={() => { }} />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        userRole={userRole}
        onLogout={handleLogout}
        studentName={currentStudent?.name}
      />
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto max-w-7xl mx-auto w-full">
        <header className="mb-8 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white uppercase leading-none">
              {userRole === 'admin' ? 'Registry Node' : 'Student Hub'}
            </h1>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase mt-1.5">
              Vidya Library • Mohanpur Bazar
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`hidden sm:flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-bold transition-all bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400`}>
              <span className={`w-2 h-2 rounded-full bg-emerald-500 animate-pulse`}></span>
              <span>{dbStatus === 'connected' ? 'Cloud Integrated' : 'Local Node Active'}</span>
            </div>
          </div>
        </header>
        {renderView()}
      </main>

      {needsPasswordChange && currentStudent && (
        <ForcePasswordChange
          student={currentStudent}
          onUpdate={handleUpdateAccount}
        />
      )}
    </div>
  );
};

export default App;
