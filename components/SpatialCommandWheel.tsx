import React, { useState, useEffect } from 'react';
import { 
  Bug, Radar as RadarIcon, Mic, Settings, MessageSquare, 
  Palette, FolderGit2, Eye, Shield, Zap, Sparkles, X, Activity, Terminal, Radio, Wifi
} from 'lucide-react';

interface SpatialCommandWheelProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (actionId: string) => void;
  activeOpticsMode: string;
  onChangeOpticsMode: (mode: string) => void;
}

const SpatialCommandWheel: React.FC<SpatialCommandWheelProps> = ({
  isOpen,
  onClose,
  onSelectAction,
  activeOpticsMode,
  onChangeOpticsMode
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const actions = [
    { id: 'DIAGNOSTICS', label: 'DEV DIAGNOSTICS', icon: Bug, desc: 'Real-time FPS, Telemetry & Overlays', color: 'from-emerald-500/30 to-emerald-900/40' },
    { id: 'NETWORK', label: 'NETWORK LINK', icon: Wifi, desc: 'Signal Strength, Ping & Force Reconnect', color: 'from-cyan-500/30 to-cyan-900/40' },
    { id: 'RADAR', label: 'RADAR INTEL', icon: RadarIcon, desc: '360° LiDAR Spatial Threat Scan', color: 'from-sky-500/30 to-sky-900/40' },
    { id: 'COMMS', label: 'SARAH VOICE', icon: Mic, desc: 'Gemini 2.5 Live Voice Intercom', color: 'from-purple-500/30 to-purple-900/40' },
    { id: 'SETTINGS', label: 'ANDROID 15 XR', icon: Settings, desc: 'Biometrics, Network, Audio Matrix', color: 'from-blue-500/30 to-blue-900/40' },
    { id: 'NEURALCHAT', label: 'NEURAL CHAT', icon: MessageSquare, desc: 'Deep Cognitive Thinking & Code', color: 'from-indigo-500/30 to-indigo-900/40' },
    { id: 'STUDIO', label: 'SPATIAL STUDIO', icon: Palette, desc: 'Volumetric 3D Interactive Canvas', color: 'from-fuchsia-500/30 to-fuchsia-900/40' },
    { id: 'REPOSITORY', label: 'CORE REPO', icon: FolderGit2, desc: 'System Artifacts & Memory Vault', color: 'from-amber-500/30 to-amber-900/40' },
  ];

  const opticsModes = [
    { id: 'CYBER_CYAN', label: 'CYBER CYAN', color: 'text-cyan-400 border-cyan-400 bg-cyan-500/10' },
    { id: 'THERMAL', label: 'THERMAL AR', color: 'text-rose-400 border-rose-400 bg-rose-500/10' },
    { id: 'NIGHT_VISION', label: 'NIGHT VISION', color: 'text-emerald-400 border-emerald-400 bg-emerald-500/10' },
    { id: 'MATRIX', label: 'MATRIX EDGE', color: 'text-purple-400 border-purple-400 bg-purple-500/10' }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[15000] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-200 select-none">
      
      {/* Background Reticle Grid */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[600px] h-[600px] rounded-full border border-sky-500/10 animate-ping" />
        <div className="w-[450px] h-[450px] rounded-full border border-dashed border-sky-400/20 animate-spin" style={{ animationDuration: '20s' }} />
        <div className="w-[300px] h-[300px] rounded-full border border-cyan-500/15" />
      </div>

      {/* Main Wheel Container */}
      <div className="relative w-[500px] h-[500px] flex items-center justify-center">
        
        {/* Center Hub Logo & Cancel Button */}
        <div 
          onClick={onClose}
          className="relative z-20 w-24 h-24 rounded-full bg-black/90 border-2 border-sky-400 flex flex-col items-center justify-center cursor-pointer hover:scale-110 hover:bg-sky-500/20 hover:shadow-[0_0_30px_cyan] transition-all group"
        >
          <X size={24} className="text-sky-300 group-hover:rotate-90 transition-transform duration-300" />
          <span className="text-[8px] font-mono text-sky-400 uppercase tracking-widest mt-1">DISMISS</span>
        </div>

        {/* Radial Action Nodes */}
        {actions.map((act, index) => {
          const total = actions.length;
          const angle = (index * (360 / total) - 90) * (Math.PI / 180);
          const radius = 170; // Pixel radius
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          const Icon = act.icon;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={act.id}
              style={{
                transform: `translate(${x}px, ${y}px)`
              }}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                onSelectAction(act.id);
                onClose();
              }}
              className={`absolute z-10 w-28 h-28 rounded-2xl p-2.5 flex flex-col items-center justify-center cursor-pointer border backdrop-blur-md transition-all duration-300 ${
                isHovered 
                  ? `bg-gradient-to-br ${act.color} border-sky-300 scale-110 shadow-[0_0_25px_rgba(14,165,233,0.5)] z-30` 
                  : 'bg-black/80 border-sky-500/30 hover:border-sky-400'
              }`}
            >
              <div className={`p-2 rounded-xl mb-1 transition-transform duration-300 ${isHovered ? 'scale-125 text-white' : 'text-sky-400'}`}>
                <Icon size={22} />
              </div>
              <span className="text-[9.5px] font-extrabold text-white text-center leading-tight tracking-wider uppercase">{act.label}</span>
              {isHovered && (
                <span className="text-[7px] text-sky-200/90 text-center font-mono mt-1 leading-tight animate-in fade-in duration-150">
                  {act.desc}
                </span>
              )}
            </div>
          );
        })}

        {/* Quick Optics Preset Selector at Bottom */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/90 border border-sky-500/30 rounded-xl p-2 backdrop-blur-md">
          <div className="flex items-center gap-1 px-2 text-[8px] font-mono text-sky-400 uppercase font-bold border-r border-sky-500/20">
            <Eye size={12} />
            <span>OPTICS SHIFT</span>
          </div>
          {opticsModes.map(mode => (
            <button
              key={mode.id}
              onClick={() => onChangeOpticsMode(mode.id)}
              className={`px-2.5 py-1 text-[8.5px] font-bold rounded border transition-all ${
                activeOpticsMode === mode.id
                  ? mode.color + ' shadow-[0_0_10px_currentColor]'
                  : 'border-white/10 text-white/40 hover:bg-white/10'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpatialCommandWheel;
