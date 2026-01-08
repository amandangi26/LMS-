import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, UserRole, Member } from '../types';

interface ChatProps {
    messages: ChatMessage[];
    members: Member[];
    userRole: UserRole;
    currentStudent?: Member;
    onSendMessage: (content: string, receiverId: string) => Promise<void>;
}

const CommunityChat: React.FC<ChatProps> = ({ messages, members, userRole, currentStudent, onSendMessage }) => {
    const [selectedContact, setSelectedContact] = useState<{ id: string, name: string, role: string } | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, selectedContact]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || isSending || !selectedContact) return;

        setIsSending(true);
        try {
            await onSendMessage(newMessage.trim(), selectedContact.id);
            setNewMessage('');
        } finally {
            setIsSending(false);
        }
    };

    useEffect(() => {
        if (userRole === 'student' && !selectedContact) {
            setSelectedContact({ id: 'admin', name: 'HEAD LIBRARIAN', role: 'admin' });
        }
    }, [userRole, selectedContact]);

    const currentUserId = userRole === 'admin' ? 'admin' : currentStudent?.id;

    // Filter messages for current conversation
    const filteredMessages = messages.filter(msg =>
        (msg.sender_id === currentUserId && msg.receiver_id === selectedContact?.id) ||
        (msg.sender_id === selectedContact?.id && msg.receiver_id === currentUserId)
    );

    const contacts = userRole === 'admin'
        ? members.filter(m => !m.isArchived).map(m => ({ id: m.id, name: m.name, role: 'student' }))
        : [{ id: 'admin', name: 'HEAD LIBRARIAN', role: 'admin' }];

    return (
        <div className="flex bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 shadow-2xl overflow-hidden h-[calc(100vh-12rem)] min-h-[600px] animate-in fade-in zoom-in duration-500">
            {/* Contacts Sidebar */}
            <div className="w-80 border-r border-slate-50 dark:border-slate-700/50 flex flex-col bg-slate-50/30 dark:bg-slate-900/10">
                <div className="p-8 pb-4">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Contacts</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Select a Node</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {contacts.map(contact => (
                        <button
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={`w-full p-4 rounded-3xl flex items-center space-x-4 transition-all ${selectedContact?.id === contact.id
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-black shadow-xl -translate-y-1'
                                : 'hover:bg-slate-100 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs ${selectedContact?.id === contact.id
                                ? 'bg-[#84cc16] text-slate-900'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                                }`}>
                                {contact.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex flex-col items-start overflow-hidden">
                                <span className="text-[11px] font-black uppercase tracking-tight truncate w-full">{contact.name}</span>
                                <span className={`text-[8px] font-bold uppercase tracking-widest ${selectedContact?.id === contact.id ? 'opacity-60' : 'text-slate-400'
                                    }`}>
                                    {contact.role}
                                </span>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-slate-800">
                {!selectedContact ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4">
                        <div className="text-6xl animate-bounce opacity-20">💬</div>
                        <div>
                            <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] opacity-40">No Signal Selected</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 opacity-40">Pick a contact from the left nodes to start</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-8 pb-6 border-b border-slate-50 dark:border-slate-700/50 flex justify-between items-center bg-white/50 dark:bg-slate-800/50 backdrop-blur-md sticky top-0 z-20">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{selectedContact.name}</h2>
                                <p className="text-[10px] text-[#84cc16] font-black uppercase tracking-[0.2em] mt-1 flex items-center">
                                    <span className="w-1.5 h-1.5 bg-[#84cc16] rounded-full animate-pulse mr-2"></span>
                                    Connected to {selectedContact.role} node
                                </p>
                            </div>
                        </div>

                        {/* Message List */}
                        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
                            {filteredMessages.map((msg, idx) => {
                                const isOwn = msg.sender_id === currentUserId;
                                return (
                                    <div key={msg.id} className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className="flex items-center space-x-2 mb-1 px-2">
                                            <span className="text-[8px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-tighter">
                                                {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                                            </span>
                                        </div>
                                        <div className={`max-w-[80%] p-4 rounded-3xl text-sm font-medium shadow-sm transition-all hover:shadow-md ${isOwn
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-black rounded-tr-none'
                                            : 'bg-slate-50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredMessages.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-10 pointer-events-none">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Encrypted Channel Empty</p>
                                    <p className="text-[9px] font-bold uppercase mt-1">Start the first transmission</p>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-8 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                            <form onSubmit={handleSubmit} className="relative flex items-center">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isSending}
                                    placeholder={`TRANSMIT TO ${selectedContact.name}...`}
                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 p-5 rounded-[2rem] text-xs font-bold dark:text-white outline-none focus:ring-4 focus:ring-[#84cc16]/10 focus:border-[#84cc16] transition-all placeholder:text-slate-400"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="absolute right-3 bg-slate-900 dark:bg-white text-[#84cc16] p-3 rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {isSending ? (
                                        <div className="w-5 h-5 border-2 border-[#84cc16] border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CommunityChat;
