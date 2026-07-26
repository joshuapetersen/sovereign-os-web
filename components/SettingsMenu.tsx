
import React, { useState } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Eye, 
  Shield, 
  Settings, 
  Cpu, 
  Smartphone, 
  Volume2, 
  Moon,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  SmartphoneNfc,
  Watch,
  Activity,
  Zap
} from 'lucide-react';

interface SettingsMenuProps {
  lookSensitivity: number;
  setLookSensitivity: (val: number) => void;
  isWatchMode: boolean;
  setIsWatchMode: (val: boolean) => void;
  isSarahSilent: boolean;
  setIsSarahSilent: (val: boolean) => void;
  pairedNodes: any[];
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  lookSensitivity,
  setLookSensitivity,
  isWatchMode,
  setIsWatchMode,
  isSarahSilent,
  setIsSarahSilent,
  pairedNodes
}) => {
  const [activeCategory, setActiveCategory] = useState('Connectivity');

  const categories = [
    { id: 'Connectivity', icon: Wifi, label: 'Networks' },
    { id: 'Perception', icon: Eye, label: 'Sensors' },
    { id: 'Sarah_Core', icon: Cpu, label: 'Neural' },
    { id: 'Security', icon: Shield, label: 'Safety' },
    { id: 'System', icon: Settings, label: 'Kernel' },
  ];

  const SettingRow = ({ icon: Icon, title, subtitle, action, active = false }: any) => (
    <div className="flex items-center justify-between p-4 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] transition-all cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className={`p-2 rounded-full ${active ? 'bg-sky-500/20 text-sky-400' : 'bg-white/5 text-white/40'}`}>
          <Icon size={16} />
        </div>
        <div className="flex flex-col">
          <span className="text-[11px] text-white font-bold">{title}</span>
          <span className="text-[7px] text-white/30 uppercase tracking-widest">{subtitle}</span>
        </div>
      </div>
      {action ? action : <ChevronRight size={14} className="opacity-20 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
    </div>
  );

  return (
    <div className="flex h-[480px] w-[580px] bg-[#0c0c0c]/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]">
      {/* Sidebar Navigation */}
      <div className="w-20 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-black/40">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-500 ${activeCategory === cat.id ? 'text-sky-400 scale-110' : 'text-white/20 hover:text-white/50'}`}
          >
            <cat.icon size={20} strokeWidth={1.5} />
            <span className={`text-[5px] font-black uppercase tracking-widest transition-opacity duration-500 ${activeCategory === cat.id ? 'opacity-100' : 'opacity-0'}`}>
              {cat.label}
            </span>
          </button>
        ))}
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 p-10 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        <header className="mb-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-sky-400/60 mb-1">
            Manual_Override_Terminal
          </h2>
          <h1 className="text-2xl font-black text-white tracking-tighter italic">Sovereign Settings</h1>
        </header>

        {activeCategory === 'Perception' && (
          <div className="flex flex-col gap-8">
            <section className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <div className="flex flex-col">
                  <span className="text-[11px] text-white font-bold">Kinetic Sensitivity</span>
                  <span className="text-[7px] text-white/30 uppercase tracking-widest">Parallax Drift Intensity</span>
                </div>
                <span className="text-[10px] text-sky-400 font-mono font-bold bg-sky-400/10 px-2 py-0.5 rounded-full">
                  {(lookSensitivity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="relative px-1">
                <input 
                  type="range" min="0" max="1" step="0.01" 
                  value={lookSensitivity} 
                  onChange={(e) => setLookSensitivity(parseFloat(e.target.value))}
                  className="w-full accent-sky-400 h-1 bg-white/5 rounded-full appearance-none cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-[5px] text-white/10 uppercase font-black">
                  <span>Static_Locked</span>
                  <span>Hyper_Immersive</span>
                </div>
              </div>
            </section>

            <SettingRow 
              icon={SmartphoneNfc} 
              title="Touch_Haptics" 
              subtitle="Calibration for mobile glass feedback" 
              action={<ToggleRight size={24} className="text-sky-400" />}
            />
          </div>
        )}

        {activeCategory === 'Connectivity' && (
          <div className="flex flex-col gap-4">
            <section className="bg-sky-400/5 p-4 rounded-3xl border border-sky-400/10 mb-2">
               <div className="flex items-center gap-3 mb-4">
                  <Zap size={14} className="text-sky-400 animate-pulse" />
                  <span className="text-[9px] font-black uppercase text-sky-400">Optical_Pairing_Active</span>
               </div>
               <p className="text-[9px] text-white/50 leading-relaxed">
                 Look at any module (Radar/Comms) for 1.5s to initiate an automatic spatial handshake with local nodes.
               </p>
            </section>

            <div className="text-[8px] text-white/20 uppercase font-black tracking-widest mt-4 ml-1">Device_Mesh</div>
            
            {pairedNodes.map((node) => (
              <SettingRow 
                key={node.id}
                icon={node.type === 'WATCH' ? Watch : Smartphone} 
                title={node.name} 
                subtitle={node.connected ? 'Signal_Anchored' : 'Discovery_Mode'}
                active={node.connected}
                action={
                  node.connected ? 
                  <span className="text-[7px] text-sky-400 font-black border border-sky-400/30 px-2 py-1 rounded-full bg-sky-400/10 uppercase tracking-widest">Synced</span> : 
                  <Bluetooth size={14} className="text-white/20 animate-pulse" />
                }
              />
            ))}
          </div>
        )}

        {activeCategory === 'Sarah_Core' && (
          <div className="flex flex-col gap-4">
            <SettingRow 
              icon={Volume2} 
              title="Silent Sentinel Protocol" 
              subtitle="Voice response restricted to wake-word"
              action={
                <button onClick={() => setIsSarahSilent(!isSarahSilent)} className="text-sky-400 transition-transform active:scale-90">
                  {isSarahSilent ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-20" />}
                </button>
              }
            />

            <SettingRow 
              icon={Activity} 
              title="Neural Sensitivity" 
              subtitle="AI confidence threshold for proactive alerts"
            />
            
            <div className="mt-6 p-6 border border-white/5 rounded-[2rem] bg-black/40 flex flex-col gap-4">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/60">Voice Profile</span>
                  <span className="text-[9px] font-black text-sky-400">Kore_Sentinel_V7</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-white/60">Wake Word</span>
                  <span className="text-[9px] font-black text-rose-400">"Sarah"</span>
               </div>
            </div>
          </div>
        )}

        {activeCategory === 'System' && (
          <div className="flex flex-col gap-4">
            <SettingRow 
              icon={Watch} 
              title="AI Watch Profile" 
              subtitle="Force 1:1 round-safe UI optimization"
              action={
                <button onClick={() => setIsWatchMode(!isWatchMode)} className="text-sky-400">
                  {isWatchMode ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="opacity-20" />}
                </button>
              }
            />
            <SettingRow icon={Moon} title="Dark_Optics" subtitle="OLED preservation mode" />
            <div className="mt-8 text-center opacity-20 hover:opacity-100 transition-opacity">
               <span className="text-[7px] font-black uppercase tracking-[1em]">Genesis_Prime_OS_v7.8.2_STABLE</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsMenu;
