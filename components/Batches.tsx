import React, { useState, useMemo } from 'react';
import { Member } from '../types';
import { Icons, OFFICIAL_PLANS } from '../constants';

interface BatchesProps {
  members: Member[];
}

const TOTAL_SEATS = 60;

const Batches: React.FC<BatchesProps> = ({ members }) => {
  const currentHour = new Date().getHours();
  const [selectedPlanId, setSelectedPlanId] = useState<number>(() => {
    const active = OFFICIAL_PLANS.find(p => currentHour >= p.hourRange[0] && currentHour < p.hourRange[1]);
    return active ? active.id : 1;
  });

  const getOccupancyForBatch = (batchTimeStr: string, planId: number) => {
    const cleanStr = batchTimeStr.replace(/\s/g, '').toLowerCase();
    return members.filter(m => {
      const memberBatch = m.batchTime.replace(/\s/g, '').toLowerCase();
      const matchesTime = memberBatch.includes(cleanStr.split('(')[0]) || cleanStr.includes(memberBatch.split('(')[0]);
      if (planId === 6) return matchesTime || memberBatch.includes('12-hour') || memberBatch.includes('fullshift');
      if (planId === 5) return matchesTime || memberBatch.includes('2shift') || memberBatch.includes('10am-06pm');
      return matchesTime;
    });
  };

  const selectedPlan = OFFICIAL_PLANS.find(p => p.id === selectedPlanId)!;
  const batchMembers = getOccupancyForBatch(selectedPlan.time, selectedPlan.id);
  const reservedCount = batchMembers.length;
  const vacantCount = TOTAL_SEATS - reservedCount;

  const seats = useMemo(() => {
    return Array.from({ length: TOTAL_SEATS }, (_, i) => {
      const seatId = (i + 1).toString();
      const occupant = batchMembers.find(m => m.seatNo === seatId || m.seatNo === `${seatId}G`);
      return { id: seatId, occupied: !!occupant, name: occupant?.name };
    });
  }, [batchMembers]);

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic">Shift Seat Matrix</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Select a shift to view floor occupancy</p>
        </div>
        
        <div className="bg-white/60 backdrop-blur-xl px-8 py-4 rounded-[2.5rem] border border-white shadow-xl flex items-center space-x-6">
           <div className="text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Seats</p>
             <p className="text-xl font-black text-slate-800">{TOTAL_SEATS}</p>
           </div>
           <div className="w-px h-10 bg-slate-200"></div>
           <div className="text-center">
             <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Vacant</p>
             <p className="text-xl font-black text-emerald-600">{vacantCount}</p>
           </div>
           <div className="w-px h-10 bg-slate-200"></div>
           <div className="text-center">
             <p className="text-[9px] font-black text-[#84cc16] uppercase tracking-[0.2em] mb-1">Reserved</p>
             <p className="text-xl font-black text-[#84cc16]">{reservedCount}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
        <div className="xl:col-span-1 space-y-4 max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
          {OFFICIAL_PLANS.map((plan) => {
            const occupancy = getOccupancyForBatch(plan.time, plan.id).length;
            const isCurrentlyActive = currentHour >= plan.hourRange[0] && currentHour < plan.hourRange[1];
            const isSelected = selectedPlanId === plan.id;
            
            return (
              <button 
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full text-left relative overflow-hidden p-8 rounded-[3rem] border transition-all duration-500 group
                  ${isSelected ? 'bg-[#84cc16] border-[#84cc16] shadow-2xl shadow-[#84cc16]/30 scale-[1.02] z-10 text-white' : 'bg-white border-white shadow-lg hover:shadow-xl text-slate-800'}
                `}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">{plan.name}</h3>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-white/70' : 'text-slate-400'}`}>{plan.time}</p>
                  </div>
                  {isCurrentlyActive && (
                    <div className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full border border-white/30">
                       <p className="text-[8px] font-black uppercase tracking-widest">Live Now</p>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-2xl font-black">₹{plan.fee}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-[#84cc16]'}`}>{plan.note}</p>
                   </div>
                   <div className="text-right">
                      <p className="text-2xl font-black">{occupancy}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest ${isSelected ? 'text-white/60' : 'text-slate-400'}`}>Reserved</p>
                   </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="xl:col-span-2 bg-white p-12 rounded-[4.5rem] border border-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 h-full flex flex-col">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">{selectedPlan.name} Floor Plan</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: {reservedCount} Booked • {vacantCount} Available</p>
              </div>
              <div className="flex space-x-6">
                 <div className="flex items-center space-x-2">
                   <div className="w-4 h-4 bg-[#84cc16] rounded-lg shadow-[0_0_10px_#84cc16]"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase">Reserved</span>
                 </div>
                 <div className="flex items-center space-x-2">
                   <div className="w-4 h-4 bg-slate-100 rounded-lg border border-slate-200"></div>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Vacant</span>
                 </div>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-4 flex-grow content-start">
              {seats.map(seat => (
                <div 
                  key={seat.id}
                  title={seat.occupied ? `Reserved for ${seat.name}` : `Seat ${seat.id} is Available`}
                  className={`aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group/seat cursor-help
                    ${seat.occupied 
                      ? 'bg-[#84cc16] text-white shadow-lg shadow-[#84cc16]/20' 
                      : 'bg-slate-50 text-slate-300 border border-slate-100 hover:bg-[#84cc16]/10 hover:border-[#84cc16]/30 hover:text-[#84cc16]'}
                  `}
                >
                  <span className="text-[11px] font-black">{seat.id}</span>
                  {seat.occupied && <div className="w-1 h-1 bg-white rounded-full mt-1 opacity-50"></div>}
                </div>
              ))}
            </div>
            
            <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
               <div className="flex items-center space-x-4">
                  <div className="p-4 bg-white rounded-2xl shadow-sm">
                    <Icons.AI className="w-6 h-6 text-[#84cc16]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vidya AI Insight</p>
                    <p className="text-xs font-bold text-slate-600 italic">
                      "In this batch, {vacantCount > 10 ? 'plenty of seats are available near the AC units.' : 'seats are filling fast! Book your spot soon, beta.'}"
                    </p>
                  </div>
               </div>
            </div>
          </div>
          <div className="absolute -right-24 -bottom-24 bg-[#84cc16]/5 w-96 h-96 rounded-full blur-[100px]"></div>
        </div>
      </div>
    </div>
  );
};

export default Batches;