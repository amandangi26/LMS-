
import React, { useState, useMemo, useEffect } from 'react';
import { Resource, AccessLog } from '../types';
import { Icons } from '../constants';

interface CatalogProps {
  resources: Resource[];
  accessLogs: AccessLog[];
  onAdd: (res: Omit<Resource, 'id'>) => void;
  onRemove: (id: string) => void;
  onAccess: (resId: string) => void;
}

// Major Exams that users want to "exclusively" focus on
const MAJOR_EXAMS = ['UPSC', 'SSC', 'NEET', 'JEE', 'BANKING', 'GATE'];
const OTHER_CATEGORIES = ['RAILWAYS', 'CBSE X', 'CBSE XII', 'BSEB X', 'BSEB XII', 'SKILLS'];
const ALL_CATEGORIES = ['ALL', ...MAJOR_EXAMS, ...OTHER_CATEGORIES];

const SUBJECT_MAP: Record<string, string[]> = {
  'UPSC': ['POLITY', 'HISTORY', 'ECONOMY', 'GEOGRAPHY', 'ETHICS', 'INTERNATIONAL RELATIONS', 'ENVIRONMENT'],
  'SSC': ['ENGLISH', 'QUANTS', 'REASONING', 'GENERAL AWARENESS'],
  'NEET': ['BIOLOGY', 'PHYSICS', 'CHEMISTRY'],
  'JEE': ['MATHS', 'PHYSICS', 'CHEMISTRY'],
  'BANKING': ['ENGLISH', 'REASONING', 'QUANTITATIVE APTITUDE', 'BANKING AWARENESS'],
  'RAILWAYS': ['GENERAL SCIENCE', 'GENERAL STUDIES', 'MATHS', 'REASONING'],
  'CBSE X': ['MATHS', 'SCIENCE', 'SOCIAL SCIENCE', 'HINDI', 'ENGLISH'],
  'CBSE XII': ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'ENGLISH'],
  'BSEB X': ['HINDI', 'SANSKRIT', 'MATHS', 'SCIENCE', 'SOCIAL SCIENCE'],
  'BSEB XII': ['PHYSICS', 'CHEMISTRY', 'MATHS', 'BIOLOGY', 'HINDI', 'ENGLISH'],
  'GATE': ['CORE SUBJECT', 'ENGINEERING MATHS', 'GENERAL APTITUDE'],
  'SKILLS': ['PROGRAMMING', 'OFFICE TOOLS', 'COMMUNICATION']
};

const Catalog: React.FC<CatalogProps> = ({ resources, accessLogs, onAdd, onRemove, onAccess }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [activeSubject, setActiveSubject] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingResource, setViewingResource] = useState<Resource | null>(null);

  const [newRes, setNewRes] = useState<Omit<Resource, 'id'>>({
    title: '', author: '', category: 'JEE', subject: '', type: 'PDF', accessUrl: '', description: ''
  });

  useEffect(() => {
    setActiveSubject('ALL');
  }, [activeCategory]);

  const availableSubjects = useMemo(() => {
    if (activeCategory === 'ALL') return [];
    return SUBJECT_MAP[activeCategory] || [];
  }, [activeCategory]);

  const filteredResources = useMemo(() => {
    return resources.filter(res => {
      const catMatch = activeCategory === 'ALL' || res.category === activeCategory;
      const subMatch = activeSubject === 'ALL' || res.subject === activeSubject;
      const searchMatch = res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.author.toLowerCase().includes(searchTerm.toLowerCase());
      return catMatch && subMatch && searchMatch;
    });
  }, [resources, activeCategory, activeSubject, searchTerm]);

  const handleOpenVault = (res: Resource) => {
    onAccess(res.id);
    setViewingResource(res);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">Digital Repository</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-wider">Premium Academic Vault for Students</p>
          </div>
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="relative flex-grow md:w-80">
              <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title or author..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-[#84cc16]/20 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setShowAdd(true)} className="bg-slate-900 text-[#84cc16] px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all shrink-0">
              <span>+ Add Entry</span>
            </button>
          </div>
        </div>

        {/* Exclusive Exam Focus Center */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-1.5 h-6 bg-[#84cc16] rounded-full"></div>
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Exam Focus Center</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('ALL')}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === 'ALL'
                  ? 'bg-slate-900 text-[#84cc16] shadow-lg'
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                }`}
            >
              Show All
            </button>
            {MAJOR_EXAMS.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                    ? 'bg-[#84cc16] text-white shadow-lg shadow-[#84cc16]/20'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-800 border border-slate-100'
                  }`}
              >
                {cat}
              </button>
            ))}
            <div className="w-px h-10 bg-slate-100 mx-2 hidden sm:block"></div>
            {OTHER_CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === cat
                    ? 'bg-slate-800 text-white shadow-lg'
                    : 'bg-white text-slate-400 hover:text-slate-700 border border-slate-200'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeCategory !== 'ALL' && availableSubjects.length > 0 && (
            <div className="pt-6 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4">Refine by Subject in {activeCategory}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSubject('ALL')}
                  className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${activeSubject === 'ALL'
                      ? 'bg-slate-100 text-slate-800'
                      : 'bg-white text-slate-300 hover:text-slate-500 border border-slate-100'
                    }`}
                >
                  All Subjects
                </button>
                {availableSubjects.map(sub => (
                  <button
                    key={sub}
                    onClick={() => setActiveSubject(sub)}
                    className={`px-4 py-2 rounded-lg text-[9px] font-bold uppercase transition-all ${activeSubject === sub
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm'
                        : 'bg-white text-slate-400 hover:text-slate-800 border border-slate-100'
                      }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredResources.length > 0 ? filteredResources.map(res => (
          <div key={res.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full hover:border-[#84cc16]/30">
            <div className="flex justify-between items-start mb-5">
              <div className="flex flex-wrap gap-1.5">
                <span className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-wider ${MAJOR_EXAMS.includes(res.category) ? 'bg-[#84cc16]/10 text-[#84cc16]' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {res.category}
                </span>
                {res.subject && (
                  <span className="px-2.5 py-1 bg-indigo-50 rounded-md text-[8px] font-black text-indigo-400 uppercase tracking-wider">
                    {res.subject}
                  </span>
                )}
              </div>
              <button onClick={() => onRemove(res.id)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-all">
                <Icons.Plus className="w-3.5 h-3.5 rotate-45" />
              </button>
            </div>

            <h3 className="font-bold text-slate-800 text-sm mb-1 uppercase tracking-tight line-clamp-2 leading-snug">{res.title}</h3>
            <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-4">By {res.author}</p>
            <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 flex-grow line-clamp-3">{res.description}</p>

            <div className="pt-5 border-t border-slate-50 flex gap-2 mt-auto">
              <button
                onClick={() => handleOpenVault(res)}
                className="flex-1 bg-slate-900 text-[#84cc16] py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center space-x-2"
              >
                <Icons.Inventory className="w-3 h-3" />
                <span>Open Vault</span>
              </button>
              <a
                href={res.accessUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onAccess(res.id)}
                className="bg-slate-50 text-slate-400 w-11 h-11 rounded-xl flex items-center justify-center hover:bg-[#84cc16]/10 hover:text-[#84cc16] transition-all border border-slate-100"
                title="Open in Browser"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
                </svg>
              </a>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-40 text-center bg-white rounded-3xl border border-slate-100 border-dashed">
            <div className="mb-6 opacity-5 flex justify-center">
              <Icons.Inventory className="w-24 h-24 text-slate-900" />
            </div>
            <p className="text-lg font-bold text-slate-300 uppercase tracking-[0.2em]">No Matches Found</p>
            <p className="text-slate-400 mt-2 font-medium text-[10px] uppercase tracking-widest">Adjust your filters or clear search to browse all books</p>
            <button onClick={() => { setActiveCategory('ALL'); setActiveSubject('ALL'); setSearchTerm(''); }} className="mt-8 bg-slate-900 text-[#84cc16] px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg">Reset Hub</button>
          </div>
        )}
      </div>

      {/* Internal PDF Viewer Modal */}
      {viewingResource && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-7xl h-[92vh] rounded-[2.5rem] flex flex-col overflow-hidden shadow-4xl animate-in zoom-in-95 duration-300">
            <div className="px-8 py-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center border border-red-100">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-base text-slate-800 uppercase tracking-tight leading-none">{viewingResource.title}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></span>
                    Encrypted Connection • Internal Reader
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <a
                  href={viewingResource.accessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#84cc16] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-[#65a30d] transition-all"
                >
                  If Blank, Click Here to Open Direct
                </a>
                <button onClick={() => setViewingResource(null)} className="bg-slate-900 text-[#84cc16] w-12 h-12 rounded-xl flex items-center justify-center hover:rotate-90 transition-all shadow-xl">
                  <Icons.Plus className="w-6 h-6 rotate-45" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-200 overflow-hidden relative">
              <div className="absolute inset-0 flex items-center justify-center z-0">
                <div className="text-center p-12">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Establishing Secure Stream...</p>
                  <p className="text-[10px] text-slate-400 italic">Note: Some NCERT servers may block the internal reader. Use the "Direct Link" button above if the screen remains white.</p>
                </div>
              </div>
              <iframe
                src={`${viewingResource.accessUrl}#toolbar=0&navpanes=0`}
                className="w-full h-full border-none bg-white relative z-10"
                title="Internal Reader"
              />
            </div>

            <div className="px-8 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Authorized Academic Access Only</p>
              <span className="text-[9px] font-black text-[#84cc16] uppercase tracking-widest">Vidya Site Registry Node</span>
            </div>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[150] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl w-full max-w-xl p-10 shadow-2xl border border-white animate-in zoom-in-95 duration-500">
            <h3 className="text-xl font-bold mb-8 text-slate-900 uppercase tracking-tight">New Asset Registration</h3>
            <form onSubmit={(e) => { e.preventDefault(); onAdd(newRes); setShowAdd(false); }} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Asset Name</label>
                <input required className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#84cc16]/20 transition-all" value={newRes.title} onChange={e => setNewRes({ ...newRes, title: e.target.value.toUpperCase() })} placeholder="E.G. ORGANIC CHEMISTRY VOL 1" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Focus Category</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#84cc16]/20" value={newRes.category} onChange={e => setNewRes({ ...newRes, category: e.target.value })}>
                    {ALL_CATEGORIES.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Core Subject</label>
                  <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#84cc16]/20" value={newRes.subject} onChange={e => setNewRes({ ...newRes, subject: e.target.value })}>
                    <option value="">None / Other</option>
                    {(SUBJECT_MAP[newRes.category] || []).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Digital Access URL</label>
                <input required type="url" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#84cc16]/20" value={newRes.accessUrl} onChange={e => setNewRes({ ...newRes, accessUrl: e.target.value })} placeholder="HTTPS://PDF.LINK/..." />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cover Image URL (Optional)</label>
                <input type="url" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-[#84cc16]/20" value={newRes.thumbnail || ''} onChange={e => setNewRes({ ...newRes, thumbnail: e.target.value })} placeholder="HTTPS://IMAGE.LINK/..." />
              </div>
              <div className="flex space-x-4 pt-8">
                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">Cancel</button>
                <button type="submit" className="flex-[2] bg-slate-900 text-[#84cc16] py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Publish Resource</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalog;
