
import React, { useState } from 'react';
import { Member } from '../types';
import { Icons } from '../constants';

interface ForcePasswordChangeProps {
  student: Member;
  onUpdate: (newPassword: string, newEmail: string) => Promise<void>;
}

const ForcePasswordChange: React.FC<ForcePasswordChangeProps> = ({ student, onUpdate }) => {
  const [newEmail, setNewEmail] = useState(student.email);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword === 'vidya123') {
      setError('You cannot use the default password.');
      return;
    }

    if (!newEmail.includes('@') || !newEmail.includes('.')) {
      setError('Please enter a valid real email address.');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(newPassword, newEmail);
    } catch (err: any) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[999] flex items-center justify-center p-6">
      <div className="bg-white dark:bg-slate-800 rounded-[3rem] w-full max-w-md shadow-4xl overflow-hidden border border-white dark:border-slate-700 animate-in zoom-in-95 duration-500">
        <div className="p-10 bg-slate-900 text-white text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-16 h-16 bg-[#84cc16]/20 text-[#84cc16] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter italic">Security Required</h3>
            <p className="text-[10px] font-black text-[#84cc16] uppercase tracking-[0.2em] mt-1">Force Password Reset</p>
          </div>
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#84cc16]/10 rounded-full blur-3xl"></div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Namaste <span className="text-slate-900 dark:text-white font-bold">{student.name}</span>, safety is our priority.
            </p>
            <p className="text-[10px] text-[#84cc16] dark:text-[#84cc16] font-bold uppercase tracking-widest bg-[#84cc16]/5 py-2 rounded-lg">
              Update your profile to enter system hub
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Real Email Address</label>
              <input
                required
                type="email"
                placeholder="you@email.com"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20 transition-all"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
              />
              <p className="text-[9px] text-slate-400 font-medium ml-1">This will be your new Login ID</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Secure Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20 transition-all"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
              <p className="text-[9px] text-slate-400 font-medium ml-1">Minimum 6 characters, cannot be 'vidya123'</p>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Confirm Password</label>
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-2xl text-sm font-bold dark:text-white outline-none focus:ring-2 focus:ring-[#84cc16]/20 transition-all"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl animate-shake">
              <p className="text-[10px] font-bold text-rose-500 uppercase text-center leading-relaxed">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-[#84cc16] py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin"></div>
                <span>Securing Registry...</span>
              </>
            ) : (
              <span>Update & Enter Hub</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForcePasswordChange;
