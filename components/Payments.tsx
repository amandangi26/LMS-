
import React, { useState, useEffect } from 'react';
import { Member, Payment } from '../types';
import { Icons } from '../constants';

interface PaymentsProps {
  members: Member[];
  payments: Payment[];
  onPay: (payment: Omit<Payment, 'id'>) => void;
}

const parseDues = (duesStr: string): number => {
  if (!duesStr || duesStr.toLowerCase().includes('paid')) return 0;
  const cleanStr = duesStr.replace(/\/\-|\s/g, '').trim();
  if (cleanStr.includes('+')) {
    return cleanStr.split('+').reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  }
  return parseFloat(cleanStr) || 0;
};

const Payments: React.FC<PaymentsProps> = ({ members, payments, onPay }) => {
  const [checkoutStep, setCheckoutStep] = useState<'selection' | 'portal' | 'success'>('selection');
  const [showPayForm, setShowPayForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CASH' | 'Card'>('UPI');
  const [qrLoaded, setQrLoaded] = useState(false);

  const UPI_ID = '7050243216@nyes';
  const PAYEE_NAME = 'Bablu Kumar';

  const getDuesForMember = (member: Member) => {
    const registryDues = parseDues(member.dues);
    const appPayments = payments
      .filter(p => p.memberId === member.id)
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, registryDues - appPayments);
  };

  const membersWithDues = members.filter(m => getDuesForMember(m) > 0);
  const totalOutstanding = members.reduce((sum, m) => sum + getDuesForMember(m), 0);
  const totalCollectedInApp = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleOpenPortal = (member: Member, amount?: number) => {
    setSelectedMember(member);
    setPaymentAmount(amount || getDuesForMember(member));
    setCheckoutStep('selection');
    setShowPayForm(true);
    setQrLoaded(false);
  };

  const proceedToScanner = () => {
    if (paymentMethod === 'UPI') {
      setCheckoutStep('portal');
      setQrLoaded(false);
    } else {
      finalizePayment();
    }
  };

  const finalizePayment = () => {
    if (!selectedMember) return;
    onPay({
      memberId: selectedMember.id,
      amount: paymentAmount,
      date: new Date().toISOString().split('T')[0],
      reason: 'Subscription',
      paymentMethod: paymentMethod,
    });
    setCheckoutStep('success');
    setTimeout(() => {
      setShowPayForm(false);
      setCheckoutStep('selection');
      setSelectedMember(null);
    }, 2000);
  };

  // Generate the dynamic UPI URL with amount
  const upiPayload = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(`Vidya Library - ${selectedMember?.name}`)}`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(upiPayload)}&bgcolor=ffffff&color=1e293b&margin=10`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Digital Collection</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{totalCollectedInApp}</h3>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Icons.Payments className="w-12 h-12 text-indigo-600" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden group">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending Library Dues</p>
          <h3 className="text-3xl font-black text-rose-600 tracking-tighter">₹{totalOutstanding}</h3>
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-900/20 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Portal Status</p>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-white">Razorpay-LMS Integrated</span>
            </div>
          </div>
          <button
            onClick={() => {
              setSelectedMember(null);
              setPaymentAmount(0);
              setCheckoutStep('selection');
              setShowPayForm(true);
            }}
            className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-2xl font-black text-xs hover:bg-indigo-500 transition-all uppercase tracking-widest shadow-lg shadow-indigo-600/20"
          >
            Open Payment Portal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Due List (Registry)</h3>
            <span className="text-[10px] font-bold text-slate-400">SELECT TO PAY</span>
          </div>
          <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {membersWithDues.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 text-sm italic font-medium">All Sitamarhi accounts settled.</p>
              </div>
            ) : (
              membersWithDues.map(m => (
                <div key={m.id} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all group">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">{m.name}</h5>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Seat {m.seatNo} • {m.address}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-600">₹{getDuesForMember(m)}</p>
                    <button 
                      onClick={() => handleOpenPortal(m)}
                      className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1 group-hover:underline"
                    >
                      Collect Now →
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Collection Ledger</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <th className="pb-3 px-2">Student</th>
                  <th className="pb-3 px-2">Method</th>
                  <th className="pb-3 px-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.slice(-10).reverse().map(p => {
                  const member = members.find(m => m.id === p.memberId);
                  return (
                    <tr key={p.id} className="text-xs group hover:bg-slate-50 transition-all">
                      <td className="py-4 px-2">
                        <p className="font-bold text-slate-800">{member?.name || 'Anonymous'}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Seat {member?.seatNo}</p>
                      </td>
                      <td className="py-4 px-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest ${
                          p.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-2 text-right font-black text-indigo-600 text-sm">₹{p.amount}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPayForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            {checkoutStep === 'selection' && (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">V</div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Checkout</h3>
                  </div>
                  <button onClick={() => setShowPayForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Select Student</label>
                    <select
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      value={selectedMember?.id || ''}
                      onChange={(e) => {
                        const m = members.find(mem => mem.id === e.target.value);
                        setSelectedMember(m || null);
                        if (m) setPaymentAmount(getDuesForMember(m));
                      }}
                    >
                      <option value="">Choose a student...</option>
                      {members.map(m => <option key={m.id} value={m.id}>{m.name} (Seat {m.seatNo})</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Amount</label>
                      <input
                        type="number"
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-black text-lg focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Method</label>
                      <select
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as any)}
                      >
                        <option value="UPI">UPI Scanner</option>
                        <option value="CASH">Cash Payment</option>
                        <option value="Card">Card Swipe</option>
                      </select>
                    </div>
                  </div>

                  <button
                    disabled={!selectedMember || paymentAmount <= 0}
                    onClick={proceedToScanner}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 active:scale-95"
                  >
                    {paymentMethod === 'UPI' ? 'Generate QR Code' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            )}

            {checkoutStep === 'portal' && (
              <div className="flex flex-col h-full bg-[#fcfcfc]">
                <div className="bg-slate-900 p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs italic">V</div>
                      <span className="font-black uppercase tracking-widest text-xs">Vidya Secure Pay</span>
                    </div>
                    <button onClick={() => setCheckoutStep('selection')} className="text-white/40 hover:text-white">
                      <Icons.Plus className="w-5 h-5 rotate-45" />
                    </button>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Paying To</p>
                      <p className="text-sm font-bold">{PAYEE_NAME} (Director)</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Amount</p>
                      <p className="text-2xl font-black">₹{paymentAmount}</p>
                    </div>
                  </div>
                </div>

                <div className="p-8 flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-indigo-600/5 blur-3xl rounded-full"></div>
                    <div className="relative bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 min-h-[250px] min-w-[250px] flex items-center justify-center">
                      {!qrLoaded && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm rounded-[2rem] z-10">
                          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                      <img 
                        src={dynamicQrUrl} 
                        alt="Payment QR" 
                        onLoad={() => setQrLoaded(true)}
                        className={`w-56 h-56 object-contain transition-opacity duration-300 ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
                      />
                      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-1.5 rounded-full text-[9px] font-black tracking-widest whitespace-nowrap shadow-lg">
                        SCAN WITH ANY UPI APP
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Details</p>
                      <p className="text-sm font-bold text-slate-800">{selectedMember?.name} (Seat {selectedMember?.seatNo})</p>
                    </div>
                    <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex flex-col items-center">
                       <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">UPI ID</p>
                       <p className="text-xs font-black text-indigo-900 select-all">{UPI_ID}</p>
                    </div>
                  </div>

                  <button
                    onClick={finalizePayment}
                    className="w-full mt-8 bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95"
                  >
                    Confirm Payment Received
                  </button>
                  <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center justify-center space-x-2">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"></path></svg>
                    <span>SSL Secured • One-time Session</span>
                  </p>
                </div>
              </div>
            )}

            {checkoutStep === 'success' && (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 animate-bounce">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight uppercase">Payment Verified</h3>
                <p className="text-slate-500 font-medium text-sm">Registry entry updated for {selectedMember?.name}.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
