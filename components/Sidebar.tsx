
import React from 'react';
import { View } from '../types';
import { Icons } from '../constants';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Overview', icon: Icons.Dashboard },
    {
      id: 'attendance', label: 'Entry Log', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
        </svg>
      )
    },
    { id: 'catalog', label: 'Digital Hub', icon: Icons.Inventory },
    { id: 'members', label: 'Students', icon: Icons.Members },
    { id: 'progress', label: 'Progress Hub', icon: Icons.Progress },
    { id: 'batch', label: 'Floor Map', icon: Icons.Batch },
    { id: 'payments', label: 'Fees', icon: Icons.Payments },
    {
      id: 'history', label: 'Alumni / History', icon: (props: any) => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      )
    },
    { id: 'ai-assistant', label: 'Vidya AI', icon: Icons.AI },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-100 flex flex-col shrink-0 z-50">
      <div className="p-8 flex flex-col h-full">
        <div className="flex items-center space-x-3 mb-12 px-1">
          <img
            src="https://image2url.com/r2/default/images/1767537268702-ace32085-6e35-4209-afed-54ffee4bfb6b.jpeg"
            alt="Vidya Library Logo"
            className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-slate-100"
          />
          <span className="font-bold text-lg tracking-tight text-slate-900 uppercase">Vidya</span>
        </div>

        <nav className="space-y-1 flex-grow">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as View)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${currentView === item.id
                  ? 'bg-slate-50 text-slate-900 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-800'
                }`}
            >
              <item.icon className={`w-5 h-5 ${currentView === item.id ? 'text-[#84cc16]' : 'text-slate-400'}`} />
              <span className="text-sm tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-50">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4">Registry Node</p>
          <p className="text-xs font-bold text-slate-900 px-4 mt-1 uppercase">Mohanpur Bazar</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
