import React, { useState, useMemo } from 'react';
import { Member } from '../types';

interface LoginProps {
  onLogin: (role: 'admin' | 'student', student?: Member) => void;
  members: Member[];
}

const ADMIN_CONFIG = {
  id: 'admin@vidyalibrary.com',
  password: 'vidyaadmin#2024',
  email: 'ankarranjan3@gmail.com'
};

const Login: React.FC<LoginProps> = ({ onLogin, members }) => {
  const [mode, setMode] = useState<'selection' | 'student-login' | 'admin-login'>('selection');
  const [uuid, setUuid] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Stabilized Thematic System (Branding consistency)
  const portalArt = useMemo(() => {
    const subjects = [
      { id: 'TIME', title: 'CHRONOS' },
      { id: 'STUDY', title: 'ARCHIVE' },
      { id: 'GROWTH', title: 'NEXUS' },
      { id: 'SECURITY', title: 'VAULT' }
    ];
    return subjects[Math.floor(Math.random() * subjects.length)];
  }, []);

  const BRAND_COLOR = "#84cc16"; // Unified Vidya Green

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const student = members.find(m =>
      m.id.toLowerCase() === uuid.trim().toLowerCase() &&
      (m.password === password || (!m.password && password === 'vidya123'))
    );

    if (student) {
      onLogin('student', student);
    } else {
      setError('Access Denied: Invalid Student UUID or Password.');
    }
  };

  const handleAdminCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminId === ADMIN_CONFIG.id && adminPass === ADMIN_CONFIG.password) {
      setError('');
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        onLogin('admin');
      }, 800);
    } else {
      setError('Invalid Admin Credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-700">
      <style>{`
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes float-gentle { 0%, 100% { transform: translateY(0) scale(1); } 50% { transform: translateY(-20px) scale(1.05); } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.2); opacity: 0; } }
        @keyframes line-draw { 0% { height: 0; opacity: 0; } 100% { height: 100%; opacity: 0.2; } }
        .animate-spin-slow { animation: spin-slow 30s linear infinite; }
        .animate-float-gentle { animation: float-gentle 6s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        .animate-grow { animation: line-draw 1.5s ease-out forwards; }
      `}</style>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden border border-slate-100 dark:border-slate-800 relative z-10 transition-all duration-500">
        {/* Left Side: Thematic Illustration */}
        <div className="p-12 bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
            {portalArt.id === 'TIME' && (
              <div className="relative w-80 h-80 flex items-center justify-center">
                <div className="absolute inset-0 border-[1px] border-white/10 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-10 border-[1px] border-dashed border-white/10 rounded-full"></div>
                <div className="w-1 h-32 bg-gradient-to-t from-[#84cc16] to-transparent rounded-full origin-bottom rotate-[45deg] animate-pulse"></div>
                <div className="w-1 h-24 bg-gradient-to-t from-white/40 to-transparent rounded-full origin-bottom rotate-[-30deg]"></div>
                <div className="absolute w-4 h-4 bg-[#84cc16] rounded-full blur-[4px] animate-pulse"></div>
              </div>
            )}
            {portalArt.id === 'STUDY' && (
              <div className="relative w-80 h-80 flex items-center justify-center animate-float-gentle">
                <svg className="w-48 h-48 opacity-40 text-[#84cc16]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <div className="absolute inset-0 border-2 border-[#84cc16]/5 rounded-3xl rotate-12"></div>
                <div className="absolute inset-0 border-2 border-[#84cc16]/5 rounded-3xl -rotate-6"></div>
              </div>
            )}
            {portalArt.id === 'SECURITY' && (
              <div className="relative w-72 h-72 flex items-center justify-center">
                <div className="absolute inset-0 border-2 border-[#84cc16]/20 rounded-full animate-pulse-ring"></div>
                <div className="absolute inset-8 border-2 border-[#84cc16]/10 rounded-full animate-pulse-ring" style={{ animationDelay: '1s' }}></div>
                <svg className="w-32 h-32 text-[#84cc16]/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            )}
            {portalArt.id === 'GROWTH' && (
              <div className="flex items-end space-x-6 h-64">
                {[40, 70, 50, 90, 60, 80].map((h, i) => (
                  <div key={i} className="w-4 bg-[#84cc16]/20 rounded-t-lg animate-grow" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                ))}
              </div>
            )}
          </div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-10 translate-y-[-10px]">
              <div className="p-2 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                <img src="https://image2url.com/r2/default/images/1767537268702-ace32085-6e35-4209-afed-54ffee4bfb6b.jpeg" alt="Vidya" className="w-10 h-10 rounded-xl object-cover ring-1 ring-[#84cc16]/50" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase tracking-tighter text-white">Vidya Library</h1>
                <p className="text-[8px] font-black text-[#84cc16] uppercase tracking-[0.4em] ml-0.5 mt-0.5">Systems Node v2.0</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-5xl font-black italic tracking-tighter uppercase leading-[0.9] group-hover:scale-105 transition-transform duration-700">
                {mode.startsWith('admin') ? 'Admin' : 'Academic'} <br />
                <span className="text-[#84cc16]">{portalArt.id}.</span>
              </h2>
              <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-xs uppercase tracking-widest opacity-80">
                {mode.startsWith('admin')
                  ? 'Central control node. Registry management and financial logistics center.'
                  : 'Premium resources and growth tracking in a focused digital environment.'}
              </p>
            </div>
          </div>

          <div className="relative z-10 pt-10 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.4em]" style={{ color: portalArt.accent }}>Active Registry</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase">Sitamarhi, Bihar</p>
              </div>
              <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <p className="text-[8px] font-black text-white/60 tracking-widest">{portalArt.title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Logic Flow */}
        <div className="p-14 bg-white dark:bg-slate-900 flex flex-col justify-center transition-colors">
          {mode === 'selection' ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Identity Control</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Select Access Level to Proceed</p>
              </div>

              <div className="space-y-4">
                <button onClick={() => setMode('admin-login')} className="w-full group p-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">Systems Administrator</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master Node Access</p>
                    </div>
                    <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm text-slate-400 group-hover:bg-slate-900 group-hover:text-[#84cc16] transition-all">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                  </div>
                </button>

                <button onClick={() => setMode('student-login')} className="w-full group p-6 bg-slate-900 dark:bg-slate-800 border border-slate-800 rounded-[2.5rem] text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-black text-[#84cc16] uppercase text-sm tracking-tight">Academic Member</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Student Portal Access</p>
                    </div>
                    <div className="p-4 bg-[#84cc16] rounded-2xl shadow-lg shadow-[#84cc16]/20 text-slate-900">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
              <button onClick={() => { setMode('selection'); setError(''); }} className="text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-[0.2em] flex items-center transition-colors">
                <svg className="w-3 h-3 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                Back to Gateway
              </button>

              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                  {mode === 'admin-login' ? 'Vault Credentials' : 'Member ID Access'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Encrypted Authentication Required</p>
              </div>

              <form onSubmit={mode === 'admin-login' ? handleAdminCredentials : handleStudentLogin} className="space-y-5">
                <div className="space-y-4">
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[#84cc16]">Identification ID</label>
                    <input
                      required
                      type={mode === 'admin-login' ? 'email' : 'text'}
                      placeholder={mode === 'admin-login' ? 'admin@vidyalibrary.com' : 'S-UUID-001'}
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-[#84cc16]/10 focus:border-[#84cc16] transition-all"
                      value={mode === 'admin-login' ? adminId : uuid}
                      onChange={e => mode === 'admin-login' ? setAdminId(e.target.value) : setUuid(e.target.value)}
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1 transition-colors group-focus-within:text-[#84cc16]">Security Password</label>
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full p-5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl text-sm font-bold dark:text-white outline-none focus:ring-4 focus:ring-[#84cc16]/10 focus:border-[#84cc16] transition-all"
                      value={mode === 'admin-login' ? adminPass : password}
                      onChange={e => mode === 'admin-login' ? setAdminPass(e.target.value) : setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && <div className="p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl"><p className="text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase text-center">{error}</p></div>}

                <button
                  disabled={isLoading}
                  type="submit"
                  className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-[#84cc16] py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Authorize Access'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Background Noise Grain */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
    </div>
  );
};

export default Login;
