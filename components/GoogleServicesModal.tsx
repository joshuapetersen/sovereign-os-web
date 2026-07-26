import React, { useState } from 'react';
import { 
  CheckCircle2, Download, RefreshCw, ShieldCheck, Sparkles, ExternalLink,
  Layers, Zap, Search, UserCheck, HardDrive, Smartphone, AlertCircle,
  Play, Cpu, Radio, Globe, Lock, Sliders, Server, Star, Folder
} from 'lucide-react';
import { GoogleWorkspaceSuite } from './GoogleWorkspaceSuite';

interface AppletExtension {
  id: string;
  name: string;
  category: 'EXTENSIONS' | 'AI_TOOLS' | 'SYSTEM' | 'HUD_OPTICS';
  version: string;
  size: string;
  rating: number;
  description: string;
  status: 'INSTALLED' | 'UPDATE_AVAILABLE' | 'NOT_INSTALLED';
  iconColor: string;
}

interface GoogleServicesModalProps {
  onClose?: () => void;
  onOpenApplet?: (appletId: string) => void;
}

export const GoogleServicesModal: React.FC<GoogleServicesModalProps> = ({
  onClose,
  onOpenApplet
}) => {
  const [activeTab, setActiveTab] = useState<'WORKSPACE' | 'PLAY_STORE' | 'ACCOUNT'>('WORKSPACE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Google Sync Toggles
  const [servicesSync, setServicesSync] = useState({
    calendar: true,
    drive: true,
    geminiAi: true,
    playProtect: true,
    workspace: true,
    cloudBackup: true
  });

  // Applet list in Play Store
  const [applets, setApplets] = useState<AppletExtension[]>([
    {
      id: 'volumetric-engine',
      name: 'Genesis Volumetric 3D Render Matrix',
      category: 'HUD_OPTICS',
      version: 'v2.4.1',
      size: '14.2 MB',
      rating: 4.9,
      description: 'Real-time raymarched spatial background renderer with custom optics shaders.',
      status: 'INSTALLED',
      iconColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/20'
    },
    {
      id: 'sarah-multilingual',
      name: 'SARAH AI Multilingual Voice Models',
      category: 'AI_TOOLS',
      version: 'v2.0.0',
      size: '28.5 MB',
      rating: 4.8,
      description: 'Expands SARAH live intercom with Japanese, Spanish, German & UK English voices.',
      status: 'UPDATE_AVAILABLE',
      iconColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/20'
    },
    {
      id: 'stereoscopic-vr',
      name: 'Stereoscopic 3D VR Lens Warp Shader',
      category: 'HUD_OPTICS',
      version: 'v1.8.0',
      size: '8.1 MB',
      rating: 5.0,
      description: 'Splits HUD canvas into dual-eye side-by-side display with optical barrel distortion.',
      status: 'INSTALLED',
      iconColor: 'text-purple-400 border-purple-500/40 bg-purple-500/20'
    },
    {
      id: 'satellite-radar',
      name: 'Tactical Satellite Radar & Terrain Mesh',
      category: 'SYSTEM',
      version: 'v3.1.2',
      size: '19.4 MB',
      rating: 4.7,
      description: '3D spatial entity radar tracking vehicles, IoT nodes, and hazards.',
      status: 'INSTALLED',
      iconColor: 'text-sky-400 border-sky-500/40 bg-sky-500/20'
    },
    {
      id: 'deep-neural-brainstorm',
      name: 'Deep Research Brainstormer & Strategy Tool',
      category: 'AI_TOOLS',
      version: 'v1.5.0',
      size: '11.0 MB',
      rating: 4.9,
      description: 'Generates ROI goals, tactical execution blueprints, and neural mind maps.',
      status: 'INSTALLED',
      iconColor: 'text-amber-400 border-amber-500/40 bg-amber-500/20'
    },
    {
      id: 'hardware-overclock',
      name: 'TPM Hardware & Thermal Overclock Monitor',
      category: 'SYSTEM',
      version: 'v1.2.0',
      size: '6.3 MB',
      rating: 4.6,
      description: 'Monitors GPU frame rates, neural throughput, and thermal throttling in real time.',
      status: 'NOT_INSTALLED',
      iconColor: 'text-rose-400 border-rose-500/40 bg-rose-500/20'
    }
  ]);

  const [installingId, setInstallingId] = useState<string | null>(null);

  const handleAction = (appletId: string, action: 'INSTALL' | 'UPDATE') => {
    setInstallingId(appletId);
    setTimeout(() => {
      setApplets(prev =>
        prev.map(item =>
          item.id === appletId ? { ...item, status: 'INSTALLED' } : item
        )
      );
      setInstallingId(null);
    }, 1200);
  };

  const handleUpdateAll = () => {
    setInstallingId('ALL');
    setTimeout(() => {
      setApplets(prev =>
        prev.map(item => ({ ...item, status: 'INSTALLED' }))
      );
      setInstallingId(null);
    }, 1800);
  };

  const filteredApplets = applets.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col gap-4 p-4 text-xs font-mono text-cyan-100 max-w-xl w-full">
      {/* HEADER WITH GOOGLE LOGO & PROFILE CARD */}
      <div className="flex items-center justify-between p-3 bg-black/60 border border-cyan-500/30 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-red-500 to-amber-500 p-[2px] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center font-black text-sm text-white">
              G
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest uppercase text-white">
                GOOGLE PLAY SERVICES
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <ShieldCheck size={10} />
                <span>PROTECT CERTIFIED</span>
              </span>
            </div>
            <span className="text-[10px] text-cyan-300/70">
              joshuapetersen119@gmail.com • Google One 100GB
            </span>
          </div>
        </div>

        {/* TOP TABS */}
        <div className="flex gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
          <button
            onClick={() => setActiveTab('WORKSPACE')}
            className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase transition-all ${
              activeTab === 'WORKSPACE'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_cyan]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            WORKSPACE TOOLS
          </button>
          <button
            onClick={() => setActiveTab('PLAY_STORE')}
            className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase transition-all ${
              activeTab === 'PLAY_STORE'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_cyan]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            PLAY STORE
          </button>
          <button
            onClick={() => setActiveTab('ACCOUNT')}
            className={`px-2.5 py-1 rounded text-[9.5px] font-bold uppercase transition-all ${
              activeTab === 'ACCOUNT'
                ? 'bg-cyan-500 text-black shadow-[0_0_10px_cyan]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            ACCOUNT
          </button>
        </div>
      </div>

      {/* WORKSPACE TOOLS TAB CONTENT */}
      {activeTab === 'WORKSPACE' && (
        <GoogleWorkspaceSuite />
      )}

      {/* PLAY STORE TAB CONTENT */}
      {activeTab === 'PLAY_STORE' && (
        <div className="flex flex-col gap-3">
          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-2.5 text-cyan-400/60" />
              <input 
                type="text"
                placeholder="Search HUD applets, shaders & extensions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-black/70 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-mono"
              />
            </div>

            <button
              onClick={handleUpdateAll}
              disabled={installingId === 'ALL'}
              className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-400/50 text-emerald-200 font-black text-[9.5px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={installingId === 'ALL' ? 'animate-spin text-emerald-300' : ''} />
              <span>{installingId === 'ALL' ? 'UPDATING...' : 'UPDATE ALL'}</span>
            </button>
          </div>

          {/* CATEGORY CHIPS */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[9px] font-bold">
            {['ALL', 'AI_TOOLS', 'HUD_OPTICS', 'SYSTEM'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-full border transition-all ${
                  selectedCategory === cat 
                    ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_8px_cyan]' 
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                }`}
              >
                {cat.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* APPLET EXTENSION CARDS GRID */}
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredApplets.map((item) => (
              <div 
                key={item.id}
                className="flex items-center justify-between p-3 bg-black/60 border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${item.iconColor}`}>
                    <Layers size={18} />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">{item.name}</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/10 text-cyan-300">
                        {item.version}
                      </span>
                    </div>
                    <span className="text-[9.5px] text-white/60 line-clamp-1">{item.description}</span>
                    <div className="flex items-center gap-2 text-[8.5px] text-white/40 mt-0.5">
                      <span className="flex items-center gap-0.5 text-amber-300">
                        <Star size={9} fill="currentColor" />
                        {item.rating}
                      </span>
                      <span>• {item.size}</span>
                      <span>• {item.category}</span>
                    </div>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                <div>
                  {item.status === 'INSTALLED' && (
                    <button
                      onClick={() => onOpenApplet?.(item.id)}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[9px] font-bold uppercase rounded-lg transition-all flex items-center gap-1"
                    >
                      <Play size={10} className="text-emerald-400" />
                      <span>OPEN</span>
                    </button>
                  )}

                  {item.status === 'UPDATE_AVAILABLE' && (
                    <button
                      onClick={() => handleAction(item.id, 'UPDATE')}
                      disabled={installingId === item.id}
                      className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-black text-[9px] font-black uppercase rounded-lg transition-all shadow-[0_0_10px_gold] flex items-center gap-1"
                    >
                      <RefreshCw size={10} className={installingId === item.id ? 'animate-spin' : ''} />
                      <span>{installingId === item.id ? 'UPDATING' : 'UPDATE'}</span>
                    </button>
                  )}

                  {item.status === 'NOT_INSTALLED' && (
                    <button
                      onClick={() => handleAction(item.id, 'INSTALL')}
                      disabled={installingId === item.id}
                      className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black text-[9px] font-black uppercase rounded-lg transition-all shadow-[0_0_10px_cyan] flex items-center gap-1"
                    >
                      <Download size={10} className={installingId === item.id ? 'animate-bounce' : ''} />
                      <span>{installingId === item.id ? 'INSTALLING' : 'INSTALL'}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GOOGLE ACCOUNT & SYNC TAB CONTENT */}
      {activeTab === 'ACCOUNT' && (
        <div className="flex flex-col gap-3">
          {/* USER ACCOUNT CARD */}
          <div className="p-3.5 bg-gradient-to-r from-blue-950/60 via-indigo-950/50 to-black border border-blue-500/40 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center font-bold text-cyan-200 text-base shadow-[0_0_15px_cyan]">
                JP
              </div>
              <div className="flex flex-col">
                <span className="font-black text-white text-sm">Joshua Petersen</span>
                <span className="text-[10px] text-cyan-300">joshuapetersen119@gmail.com</span>
                <span className="text-[8.5px] text-emerald-300/80 font-bold mt-0.5">
                  ✓ VERIFIED GOOGLE ACCOUNT & GEMINI AI STUDIO TOKEN
                </span>
              </div>
            </div>

            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg text-[9px] font-bold uppercase transition-all">
              MANAGE ACCOUNT
            </button>
          </div>

          {/* STORAGE USAGE BAR */}
          <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px]">
              <span className="font-bold text-white flex items-center gap-1">
                <HardDrive size={12} className="text-cyan-400" />
                Google One Cloud Storage
              </span>
              <span className="text-cyan-300 font-bold">12.8 GB / 100 GB (12.8%)</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/10">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 w-[12.8%]" />
            </div>
            <span className="text-[8.5px] text-white/50">
              HUD Archives, Voice Models, and Volumetric Caches synced to Google Drive
            </span>
          </div>

          {/* SYNC SERVICE SWITCHES */}
          <div className="flex flex-col gap-1.5 p-3 bg-black/60 border border-white/10 rounded-xl">
            <span className="text-[10px] font-black uppercase text-cyan-300 pb-1 border-b border-white/10">
              BACKGROUND SYNC & INTEGRATION SERVICES
            </span>

            {[
              { key: 'geminiAi', label: 'Gemini AI Studio Studio API Link', sub: 'Provides real-time model token access & grounding' },
              { key: 'calendar', label: 'Google Calendar Agenda Sync', sub: 'Integrates live events into HUD timeline' },
              { key: 'drive', label: 'Google Drive Archive Sync', sub: 'Automated telemetry & media backups' },
              { key: 'playProtect', label: 'Google Play Protect Live Scan', sub: 'Real-time security check for applet extensions' },
              { key: 'cloudBackup', label: 'Genesis HUD Cloud Settings Backup', sub: 'Syncs spatial layouts across devices' }
            ].map((srv) => (
              <div key={srv.key} className="flex items-center justify-between py-1 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-[10.5px]">{srv.label}</span>
                  <span className="text-[8.5px] text-white/50">{srv.sub}</span>
                </div>
                <button
                  onClick={() => setServicesSync(prev => ({ ...prev, [srv.key]: !(prev as any)[srv.key] }))}
                  className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                    (servicesSync as any)[srv.key] ? 'bg-cyan-500' : 'bg-white/20'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-black transition-transform ${
                    (servicesSync as any)[srv.key] ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleServicesModal;
