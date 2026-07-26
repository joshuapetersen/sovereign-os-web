
import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, User, Send, CheckCheck, Clock, ShieldCheck, PhoneOff, Mic, MicOff, Volume2, VolumeX, Plus, Search, X } from 'lucide-react';
import { Message, Contact } from '../types';

const MOCK_MESSAGES: Message[] = [
  { id: '1', sender: 'Marcus Prime', content: 'Director, the server farm at Sector 7 is nearing 90% thermal capacity. Advise.', timestamp: Date.now() - 300000, type: 'RCS', status: 'READ' },
  { id: '2', sender: 'Evelyn V', content: 'The neural mapping data is ready for your review. It’s cleaner than expected.', timestamp: Date.now() - 120000, type: 'IM', status: 'DELIVERED' },
  { id: '3', sender: 'Sarah OS', content: 'Security handshake with Satellite 4-B established.', timestamp: Date.now() - 10000, type: 'SYSTEM', status: 'DELIVERED' }
];

const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', name: 'Marcus Prime', status: 'ONLINE', trustScore: 98 },
  { id: 'c2', name: 'Evelyn V', status: 'ONLINE', trustScore: 95 },
  { id: 'c3', name: 'Unknown Node', status: 'OFFLINE', trustScore: 12 }
];

const CommCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MSG' | 'LOG' | 'CONTACTS'>('MSG');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [contacts, setContacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [input, setInput] = useState('');
  const [msgFilter, setMsgFilter] = useState<'ALL' | 'RCS' | 'IM' | 'SYSTEM'>('ALL');

  // Call simulation state
  const [activeCallContact, setActiveCallContact] = useState<Contact | null>(null);
  const [callDurationSec, setCallDurationSec] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);

  // Add contact state
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactTrust, setNewContactTrust] = useState(85);
  const [contactSearch, setContactSearch] = useState('');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeCallContact) {
      timer = setInterval(() => {
        setCallDurationSec(prev => prev + 1);
      }, 1000);
    } else {
      setCallDurationSec(0);
    }
    return () => clearInterval(timer);
  }, [activeCallContact]);

  const handleStartCall = (contact: Contact) => {
    setActiveCallContact(contact);
    setCallDurationSec(0);
  };

  const handleEndCall = () => {
    setActiveCallContact(null);
  };

  const handleAddContact = () => {
    if (!newContactName.trim()) return;
    const newContact: Contact = {
      id: `c_${Date.now()}`,
      name: newContactName.trim(),
      status: 'ONLINE',
      trustScore: newContactTrust
    };
    setContacts(prev => [...prev, newContact]);
    setNewContactName('');
    setShowAddContact(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'DIRECTOR (YOU)',
      content: input,
      timestamp: Date.now(),
      type: 'RCS',
      status: 'DELIVERED'
    };
    setMessages(prev => [userMsg, ...prev]);
    const sentText = input;
    setInput('');

    // Simulate AI response
    setTimeout(() => {
      const responseMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'Sarah OS',
        content: `Ack: "${sentText}". Encryption confirmed. Command routed through Node-01.`,
        timestamp: Date.now(),
        type: 'SYSTEM',
        status: 'READ'
      };
      setMessages(prev => [responseMsg, ...prev]);
    }, 1000);
  };

  const filteredMessages = messages.filter(m => msgFilter === 'ALL' || m.type === msgFilter);
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()));

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative flex flex-col h-[500px] w-[450px] text-sky-400 font-mono select-none">
      {/* Active Call Simulation Overlay */}
      {activeCallContact && (
        <div className="absolute inset-0 z-30 bg-black/95 border border-sky-500/40 rounded-xl p-6 flex flex-col justify-between items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center gap-2 mt-4 text-center">
            <div className="w-16 h-16 rounded-full bg-sky-500/20 border border-sky-400 flex items-center justify-center animate-pulse shadow-[0_0_20px_cyan]">
              <User size={32} className="text-sky-300" />
            </div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider mt-2">{activeCallContact.name}</h3>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck size={10} /> ENCRYPTED VOIP CHANNEL
            </span>
            <span className="text-xl font-bold font-mono text-sky-300 tracking-widest mt-1">
              {formatDuration(callDurationSec)}
            </span>
          </div>

          <div className="flex items-center gap-6 mb-6">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full border transition-all ${isMuted ? 'bg-rose-500/20 border-rose-500 text-rose-300' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button 
              onClick={handleEndCall}
              className="p-5 rounded-full bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.6)] transition-transform hover:scale-110"
              title="Terminate Call"
            >
              <PhoneOff size={24} />
            </button>

            <button 
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`p-4 rounded-full border transition-all ${isSpeaker ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}`}
              title={isSpeaker ? "Speaker On" : "Speaker Off"}
            >
              {isSpeaker ? <Volume2 size={20} /> : <VolumeX size={20} />}
            </button>
          </div>
        </div>
      )}

      {/* Header Tabs */}
      <div className="flex border-b border-sky-400/20 mb-3">
        {[
          { id: 'MSG', icon: MessageSquare, label: 'STREAMS' },
          { id: 'LOG', icon: Clock, label: 'HISTORY' },
          { id: 'CONTACTS', icon: User, label: 'NODES' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-all ${activeTab === t.id ? 'bg-sky-500/10 text-white border-b-2 border-sky-400' : 'opacity-30 hover:opacity-100'}`}
          >
            <t.icon size={14} />
            <span className="text-[7px] font-black uppercase tracking-widest">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Subfilters / Actions */}
      {activeTab === 'MSG' && (
        <div className="flex items-center gap-1 mb-3 px-1">
          <span className="text-[8px] opacity-40 uppercase tracking-widest mr-1">FILTER:</span>
          {(['ALL', 'RCS', 'IM', 'SYSTEM'] as const).map(f => (
            <button
              key={f}
              onClick={() => setMsgFilter(f)}
              className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase transition-all ${
                msgFilter === f ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/5 text-white/40 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {activeTab === 'CONTACTS' && (
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sky-500/40" />
            <input 
              type="text" 
              placeholder="SEARCH_NODES..." 
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              className="w-full bg-black/40 border border-sky-500/20 rounded py-1 pl-8 pr-2 text-[9px] text-white uppercase outline-none focus:border-sky-400"
            />
          </div>
          <button 
            onClick={() => setShowAddContact(true)}
            className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[8px] font-bold rounded flex items-center gap-1"
          >
            <Plus size={10} /> ADD_NODE
          </button>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="absolute inset-x-2 top-12 z-20 bg-black/95 border border-sky-500/40 rounded-lg p-3 font-mono text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-sky-500/20">
            <span className="text-[10px] font-bold text-white uppercase">ADD NEW COMM NODE</span>
            <button onClick={() => setShowAddContact(false)} className="text-white/40 hover:text-white"><X size={12} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="NODE NAME / CALLSIGN" 
              value={newContactName} 
              onChange={e => setNewContactName(e.target.value)} 
              className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[10px] text-white outline-none focus:border-sky-400"
            />
            <div className="flex items-center justify-between text-[8px]">
              <span>TRUST INDEX ({newContactTrust}%)</span>
              <input 
                type="range" min={10} max={100} value={newContactTrust} 
                onChange={e => setNewContactTrust(parseInt(e.target.value))} 
                className="w-24 accent-sky-400"
              />
            </div>
            <button 
              onClick={handleAddContact}
              className="py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400 text-sky-200 text-[9px] font-bold rounded uppercase mt-1"
            >
              CONFIRM REGISTRATION
            </button>
          </div>
        </div>
      )}

      {/* List Body */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {activeTab === 'MSG' && (
          <div className="flex flex-col gap-3">
            {filteredMessages.map(m => (
              <div key={m.id} className="group relative p-3 bg-white/5 border border-white/5 hover:border-sky-500/40 transition-all rounded-sm">
                <div className="flex justify-between items-start mb-1.5">
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

        {activeTab === 'LOG' && (
          <div className="flex flex-col gap-2">
            {messages.map(m => (
              <div key={m.id} className="p-2 border-b border-sky-500/10 text-[9px]">
                <div className="flex justify-between opacity-50">
                  <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                  <span>{m.type}</span>
                </div>
                <div className="text-white font-bold">{m.sender}: {m.content}</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'CONTACTS' && (
          <div className="flex flex-col gap-2">
            {filteredContacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 hover:bg-sky-500/10 hover:border-sky-500/30 transition-all rounded-lg">
                <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full ${c.status === 'ONLINE' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-white/10'}`}></div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase text-white">{c.name}</span>
                      <span className="text-[7px] opacity-40">TRUST_INDEX: {c.trustScore}%</span>
                   </div>
                </div>
                
                <button 
                  onClick={() => handleStartCall(c)}
                  className="p-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 rounded-full transition-all"
                  title={`Call ${c.name}`}
                >
                  <Phone size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spatial Input Target */}
      <div className="mt-3 pt-3 border-t border-sky-400/20">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-center gap-3 bg-sky-500/5 p-3 rounded-lg group hover:bg-sky-500/10 transition-all border border-sky-500/20"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ENCRYPT_INPUT..."
            className="flex-1 bg-transparent outline-none text-[11px] font-bold uppercase tracking-widest text-white placeholder:text-sky-900"
          />
          <button type="submit" className="w-8 h-8 flex items-center justify-center bg-sky-500/20 rounded-full hover:bg-sky-500/40 hover:scale-105 transition-all">
            <Send size={14} className="text-sky-400" />
          </button>
        </form>
        <div className="mt-1.5 flex justify-center">
           <span className="text-[5.5px] opacity-20 uppercase tracking-[0.5em]">Interaction_Node: Hand_Motion_Ready</span>
        </div>
      </div>
    </div>
  );
};

export default CommCenter;

