
import React, { useState } from 'react';
import { Download, Check, Search, Package, ExternalLink, Shield, Zap, Eye, Cpu, Box, Loader2, Play, Trash2, Plus, X, Rocket, Filter } from 'lucide-react';

interface AppItem {
  id: string;
  name: string;
  category: string;
  size: string;
  installed: boolean;
  description: string;
  icon: any;
}

const MOCK_APPS: AppItem[] = [
  { id: '1', name: 'Night Vision+', category: 'OPTICS', size: '12MB', installed: false, description: 'Enhanced low-light sensor fusion.', icon: Eye },
  { id: '2', name: 'Tactical Maps', category: 'NAV', size: '45MB', installed: true, description: 'Offline terrain data with elevation.', icon: Box },
  { id: '3', name: 'Bio-Monitor', category: 'HEALTH', size: '8MB', installed: false, description: 'Advanced HRV tracking.', icon: Shield },
  { id: '4', name: 'Neural Overclock', category: 'SYSTEM', size: '2MB', installed: false, description: 'Unlocks CPU voltage limits.', icon: Zap },
  { id: '5', name: 'Spectre Cam', category: 'OPTICS', size: '24MB', installed: false, description: 'Thermal spectrum emulation.', icon: Eye },
  { id: '6', name: 'Genesis Connect', category: 'NET', size: '15MB', installed: false, description: 'External device bridge.', icon: Cpu },
];

const Repository: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [apps, setApps] = useState(MOCK_APPS);
  const [installing, setInstalling] = useState<string | null>(null);
  const [activeLaunchedId, setActiveLaunchedId] = useState<string | null>(null);

  // Custom extension registration
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState('SYSTEM');
  const [newDesc, setNewDesc] = useState('');

  const handleInstall = (id: string) => {
    setInstalling(id);
    setTimeout(() => {
      setApps(prev => prev.map(a => a.id === id ? { ...a, installed: true } : a));
      setInstalling(null);
    }, 1500);
  };

  const handleUninstall = (id: string) => {
    setApps(prev => prev.map(a => a.id === id ? { ...a, installed: false } : a));
    if (activeLaunchedId === id) setActiveLaunchedId(null);
  };

  const handleToggleLaunch = (id: string) => {
    setActiveLaunchedId(prev => prev === id ? null : id);
  };

  const handleAddExtension = () => {
    if (!newName.trim()) return;
    const customApp: AppItem = {
      id: `ext_${Date.now()}`,
      name: newName.trim(),
      category: newCat,
      size: '5MB',
      installed: true,
      description: newDesc.trim() || 'Custom registered Genesis extension.',
      icon: Cpu
    };
    setApps(prev => [customApp, ...prev]);
    setNewName('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const filteredApps = apps.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || a.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'OPTICS', 'NAV', 'HEALTH', 'SYSTEM', 'NET'];

  return (
    <div className="relative flex flex-col h-[500px] w-[500px] text-sky-400 font-mono select-none">
      {/* Header */}
      <div className="flex justify-between items-end mb-4 border-b border-sky-500/20 pb-3">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
            <Package size={20} className="text-sky-400" /> Repository
          </h2>
          <span className="text-[8px] uppercase tracking-[0.3em] opacity-50">Secure_Extensions</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[8px] font-bold rounded flex items-center gap-1 transition-all"
          >
            <Plus size={10} /> REGISTER_MODULE
          </button>
          
          <button 
              onClick={() => window.open('https://play.google.com/store', '_blank')}
              className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-full transition-all group"
          >
            <Play size={10} className="group-hover:text-white fill-current" />
            <span className="text-[7px] font-bold uppercase tracking-widest group-hover:text-white">Play_Store</span>
          </button>
        </div>
      </div>

      {/* Add Custom Extension Modal */}
      {showAddModal && (
        <div className="absolute inset-x-2 top-14 z-30 bg-black/95 border border-sky-500/40 rounded-xl p-3 shadow-[0_0_20px_rgba(56,189,248,0.2)] font-mono text-sky-300">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-sky-500/20">
            <span className="text-[10px] font-bold text-white uppercase">REGISTER CUSTOM EXTENSION</span>
            <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white"><X size={12} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="MODULE NAME" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[10px] text-white outline-none focus:border-sky-400"
            />
            <div className="flex gap-2">
              <select value={newCat} onChange={e => setNewCat(e.target.value)} className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[9px] text-white outline-none flex-1">
                {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <input 
              type="text" 
              placeholder="MODULE DESCRIPTION" 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[9px] text-white outline-none focus:border-sky-400"
            />
            <button 
              onClick={handleAddExtension}
              className="py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400 text-sky-200 text-[9px] font-bold rounded uppercase mt-1"
            >
              INSTALL MODULE
            </button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-500/50" size={14} />
        <input 
          type="text" 
          placeholder="SEARCH_MODULES..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/40 border border-sky-500/20 rounded-lg py-2 pl-10 pr-4 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-sky-500/50 transition-colors placeholder:text-sky-500/30"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-2 mb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-0.5 rounded text-[8px] font-bold uppercase transition-all whitespace-nowrap ${
              selectedCategory === cat ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/5 text-white/40 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* App List */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-2">
        {filteredApps.map(app => {
          const isLaunched = activeLaunchedId === app.id;

          return (
            <div key={app.id} className={`group flex items-center justify-between p-3 border transition-all rounded-lg ${
              isLaunched ? 'bg-sky-500/10 border-sky-400/60 shadow-[0_0_15px_rgba(56,189,248,0.2)]' : 'bg-white/5 border-white/5 hover:border-sky-500/30 hover:bg-white/10'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                  isLaunched ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-black/50 border-white/10 group-hover:border-sky-500/30'
                }`}>
                  <app.icon size={18} className="text-sky-400" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-white uppercase">{app.name}</span>
                    <span className="text-[7px] font-black bg-sky-500/20 px-1.5 rounded text-sky-300">{app.category}</span>
                    {isLaunched && <span className="text-[6.5px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1 rounded animate-pulse">RUNNING</span>}
                  </div>
                  <span className="text-[9px] text-white/40">{app.description}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5">
                {app.installed ? (
                  <>
                    <button 
                      onClick={() => handleToggleLaunch(app.id)}
                      className={`px-3 py-1.5 rounded border text-[8.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 ${
                        isLaunched ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-emerald-500/20 border-emerald-400 text-emerald-300 hover:bg-emerald-500/30'
                      }`}
                    >
                      <Rocket size={10} /> {isLaunched ? 'STOP' : 'LAUNCH'}
                    </button>
                    <button 
                      onClick={() => handleUninstall(app.id)}
                      className="p-1.5 rounded border border-white/10 text-white/40 hover:text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition-colors"
                      title="Uninstall Module"
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => handleInstall(app.id)}
                    disabled={installing === app.id}
                    className="px-4 py-1.5 rounded border text-[8.5px] font-black uppercase tracking-widest transition-all border-white/10 text-white hover:bg-sky-500/20 hover:border-sky-500/50 flex items-center justify-center min-w-[80px]"
                  >
                    {installing === app.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1"><Download size={10} /> Get</span>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-3 pt-2 border-t border-sky-500/10 flex justify-between items-center opacity-40">
        <span className="text-[6px] uppercase tracking-widest">Genesis_Repository_v1.2</span>
        <span className="text-[6px] uppercase tracking-widest flex items-center gap-1"><Shield size={8} /> Verified_Secure</span>
      </div>
    </div>
  );
};

export default Repository;

