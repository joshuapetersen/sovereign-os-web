
import React, { useState } from 'react';
import { MessageSquare, Phone, User, Send, CheckCheck, Clock, ShieldCheck } from 'lucide-react';
import { Message, Contact } from '../types';

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'Marcus Prime', content: 'Director, the server farm at Sector 7 is nearing 90% thermal capacity. Advise.', timestamp: Date.now() - 300000, type: 'RCS', status: 'READ' },
  { id: '2', sender: 'Evelyn V', content: 'The neural mapping data is ready for your review. It’s cleaner than expected.', timestamp: Date.now() - 120000, type: 'IM', status: 'DELIVERED' },
  { id: '3', sender: 'Sarah OS', content: 'Security handshake with Satellite 4-B established.', timestamp: Date.now() - 10000, type: 'SYSTEM', status: 'DELIVERED' }
];

const MOCK_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Marcus Prime', status: 'ONLINE', trustScore: 98 },
  { id: 'c2', name: 'Evelyn V', status: 'ONLINE', trustScore: 95 },
  { id: 'c3', name: 'Unknown Node', status: 'OFFLINE', trustScore: 12 }
];

const CommCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MSG' | 'LOG' | 'CONTACTS'>('MSG');
  const [input, setInput] = useState('');

  return (
    <div className="flex flex-col h-[500px] w-[450px] text-sky-400 font-mono">
      {/* Header Tabs */}
      <div className="flex border-b border-sky-400/20 mb-4">
        {[
          { id: 'MSG', icon: MessageSquare, label: 'STREAMS' },
          { id: 'LOG', icon: Clock, label: 'HISTORY' },
          { id: 'CONTACTS', icon: User, label: 'NODES' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'bg-sky-500/10 text-white' : 'opacity-30 hover:opacity-100'}`}
          >
            <t.icon size={14} />
            <span className="text-[7px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'MSG' && (
          <div className="flex flex-col gap-4">
            {MOCK_MESSAGES.map(m => (
              <div key={m.id} className="group relative p-4 bg-white/5 border border-white/5 hover:border-sky-500/40 transition-all rounded-sm">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[9px] font-black uppercase text-sky-300 tracking-tighter">{m.sender}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[6px] opacity-30">{m.type}</span>
                    <CheckCheck size={10} className={m.status === 'READ' ? 'text-sky-400' : 'opacity-20'} />
                  </div>
                </div>
                <p className="text-[11px] text-white/80 leading-relaxed font-light">{m.content}</p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'CONTACTS' && (
          <div className="flex flex-col gap-2">
            {MOCK_CONTACTS.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:bg-sky-500/10 transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                   <div className={`w-2 h-2 rounded-full ${c.status === 'ONLINE' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-white/10'}`}></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase">{c.name}</span>
                      <span className="text-[6px] opacity-40">TRUST_INDEX: {c.trustScore}%</span>
                   </div>
                </div>
                <Phone size={12} className="opacity-20 hover:opacity-100 hover:text-green-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spatial Input Target */}
      <div className="mt-4 pt-4 border-t border-sky-400/20">
        <div className="relative flex items-center gap-4 bg-sky-500/5 p-4 rounded-lg group hover:bg-sky-500/10 transition-all">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENCRYPT_INPUT..."
            className="flex-1 bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-sky-900"
          />
          <button className="w-10 h-10 flex items-center justify-center bg-sky-500/20 rounded-full hover:bg-sky-500/40 hover:scale-110 transition-all">
            <Send size={16} className="text-sky-400" />
          </button>
        </div>
        <div className="mt-2 flex justify-center">
           <span className="text-[5px] opacity-20 uppercase tracking-[0.5em]">Interaction_Node: Hand_Motion_Ready</span>
        </div>
      </div>
    </div>
  );
};

export default CommCenter;
