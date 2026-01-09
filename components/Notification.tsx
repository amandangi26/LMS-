import React, { useEffect, useState } from 'react';

export type NotificationType = 'success' | 'error' | 'info';

export interface NotificationProps {
    type: NotificationType;
    message: string;
    subMessage?: string;
    onClose: () => void;
    isVisible: boolean;
}

const Notification: React.FC<NotificationProps> = ({ type, message, subMessage, onClose, isVisible }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isVisible) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 300); // Wait for animation to finish before actual close
            }, 5000);
            return () => clearTimeout(timer);
        } else {
            setShow(false);
        }
    }, [isVisible, onClose]);

    if (!isVisible && !show) return null;

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-rose-500' : 'bg-indigo-500';
    const icon = type === 'success' ? (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    ) : type === 'error' ? (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    ) : (
        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );

    return (
        <div className={`fixed bottom-6 right-6 z-[200] transform transition-all duration-500 ease-out ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
            }`}>
            <div className={`${bgColor} rounded-2xl shadow-2xl p-1 flex items-start max-w-sm overflow-hidden`}>
                <div className="p-4 bg-transparent shrink-0">
                    {icon}
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex-1 min-w-[200px] border border-white/10">
                    <h4 className="font-black text-white text-sm uppercase tracking-wide mb-1">{message}</h4>
                    {subMessage && <p className="text-xs text-white/90 font-medium leading-relaxed">{subMessage}</p>}
                </div>
                <button onClick={() => setShow(false)} className="p-2 text-white/60 hover:text-white transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default Notification;
