
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Resource, Member, AccessLog } from '../types';
import { Icons } from '../constants';
import { getLibraryChat } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';

interface GroundingLink {
  uri: string;
  title: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: GroundingLink[];
}

interface AIAssistantProps {
  resources: Resource[];
  members: Member[];
  logs: AccessLog[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ resources, members, logs }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'assistant', 
      content: 'Namaste! I am Vidya AI. I am your specialized concierge. Ask me anything about your studies or any topic, and I will provide focused, expert information using the web and our resources.' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize chat session once and hold it in a memo to persist context
  const chatSession = useMemo(() => getLibraryChat({ resources, members, logs }), [resources, members, logs]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleSend = async (text: string = input) => {
    const messageToSend = text.trim();
    if (!messageToSend || isLoading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageToSend }]);
    setIsLoading(true);

    try {
      const result: GenerateContentResponse = await chatSession.sendMessage({ message: messageToSend });
      const responseText = result.text || "I'm sorry, I couldn't process that request.";
      
      // Extract grounding links from metadata if available
      const groundingChunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const sources: GroundingLink[] = [];
      
      if (groundingChunks) {
        groundingChunks.forEach((chunk: any) => {
          if (chunk.web && chunk.web.uri && chunk.web.title) {
            sources.push({
              uri: chunk.web.uri,
              title: chunk.web.title
            });
          }
        });
      }

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseText,
        sources: sources.length > 0 ? sources : undefined
      }]);
    } catch (error) {
      console.error("Vidya AI Error:", error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Vidya Server encountered a minor syncing error while searching. Please try again in a moment." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (msg: ChatMessage) => {
    return (
      <div className="space-y-4">
        <div className="whitespace-pre-wrap leading-relaxed font-medium">
          {msg.content}
        </div>
        {msg.sources && msg.sources.length > 0 && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <p className="text-[10px] font-black text-[#84cc16] uppercase tracking-[0.2em] mb-2">Sources & References</p>
            <div className="flex flex-wrap gap-2">
              {msg.sources.map((source, i) => (
                <a 
                  key={i} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all flex items-center space-x-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" />
                  </svg>
                  <span className="truncate max-w-[150px]">{source.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto h-[750px] bg-white rounded-[4rem] border border-white shadow-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-700">
      <div className="p-10 bg-slate-900 text-white flex justify-between items-center shadow-xl">
        <div className="flex items-center space-x-6">
          <div className="p-4 bg-[#84cc16] rounded-[1.5rem] shadow-xl shadow-[#84cc16]/20">
            <Icons.AI className="w-8 h-8 text-slate-900" />
          </div>
          <div>
            <h3 className="font-black text-2xl tracking-tighter leading-none mb-1 uppercase">Vidya AI</h3>
            <p className="text-[10px] text-[#84cc16] font-black uppercase tracking-widest">Grounding Active • Context Aware</p>
          </div>
        </div>
        <div className="bg-white/10 px-6 py-2.5 rounded-full border border-white/20 backdrop-blur-xl">
           <span className="text-[10px] font-black uppercase tracking-widest text-[#84cc16]">Real-time Search</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-12 space-y-10 custom-scrollbar bg-slate-50/20">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[#84cc16] text-white rounded-[2.5rem] rounded-tr-none shadow-lg' : 'bg-white text-slate-800 rounded-[2.5rem] rounded-tl-none border border-slate-100 shadow-xl shadow-slate-200/50'} p-8 text-sm`}>
              {renderContent(msg)}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
             <div className="bg-white p-8 rounded-[2.5rem] rounded-tl-none border border-slate-100 shadow-xl flex items-center space-x-4">
               <div className="flex space-x-2">
                  <div className="w-2.5 h-2.5 bg-[#84cc16] rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-[#84cc16] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-[#84cc16] rounded-full animate-bounce [animation-delay:0.4s]"></div>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Searching the web...</span>
             </div>
          </div>
        )}
      </div>

      <div className="p-10 border-t border-slate-50 bg-white">
        <div className="relative flex items-center">
          <input
            type="text"
            className="w-full bg-slate-100 border-none rounded-[2rem] px-8 py-6 outline-none focus:ring-8 focus:ring-[#84cc16]/5 transition-all text-sm font-bold placeholder:text-slate-400"
            placeholder="Ask anything (e.g., Explain Quantum Computing past and future)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="absolute right-4 bg-slate-900 text-[#84cc16] w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-slate-800 disabled:opacity-30 transition-all shadow-xl active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
