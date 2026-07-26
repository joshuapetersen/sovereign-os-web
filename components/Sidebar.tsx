
import React from 'react';
import { 
  LayoutDashboard, Zap, Mic2, Activity, Package, MessageCircle, Palette, BrainCircuit,
  Compass, Radio, Ghost, Eye
} from 'lucide-react';
import { DashboardTab } from '../types';
import { AmbientColorState } from '../services/ambientColorService';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  onOpenWheel: () => void;
  isNetworkOpen: boolean;
  setIsNetworkOpen: (v: boolean) => void;
  isGhostMode: boolean;
  ghostModeOverride: boolean | null;
  ghostModeReason: string | null;
  setGhostModeOverride: React.Dispatch<React.SetStateAction<boolean | null>>;
  latestGazeIntent: {
    targetModuleId: string | null;
    dwellMs: number;
    probability: number;
    isPreloadWarranted: boolean;
    isIntentLocked: boolean;
  };
  opticsMode: string;
  setOpticsMode: (mode: string) => void;
  ambientGlow: AmbientColorState;
  isCamActive: boolean;
  isRadarActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenWheel,
  isNetworkOpen,
  setIsNetworkOpen,
  isGhostMode,
  ghostModeOverride,
  ghostModeReason,
  setGhostModeOverride,
  latestGazeIntent,
  opticsMode,
  setOpticsMode,
  ambientGlow,
  isCamActive,
  isRadarActive,
}) => {
  const navItems = [
    { id: DashboardTab.OVERVIEW, icon: LayoutDashboard, num: '01', label: 'OVERVIEW' },
    { id: DashboardTab.BRAINSTORM, icon: Zap, num: '02', label: 'STRATEGY' },
    { id: DashboardTab.COMM_HUB, icon: MessageCircle, num: '03', label: 'COMM HUB' },
    { id: DashboardTab.LIVE_COMMS, icon: Mic2, num: '04', label: 'LIVE COMMS' },
    { id: DashboardTab.INTEL, icon: Activity, num: '05', label: 'INTEL SCAN' },
    { id: DashboardTab.REPOSITORY, icon: Package, num: '06', label: 'REPOSITORY' },
    { id: DashboardTab.STUDIO, icon: Palette, num: '07', label: 'STUDIO' },
    { id: DashboardTab.NEURAL_CHAT, icon: BrainCircuit, num: '08', label: 'SENTIENCE' },
  ];

  const cycleOpticsMode = () => {
    const modes = ['CYBER_CYAN', 'THERMAL', 'NIGHT_VISION', 'MATRIX'];
    const nextIdx = (modes.indexOf(opticsMode) + 1) % modes.length;
    setOpticsMode(modes[nextIdx]);
  };

  return (
    <aside 
      className="fixed left-0 top-0 bottom-0 w-16 flex flex-col justify-between items-center py-6 z-[10000] opacity-0 hover:opacity-100 transition-all duration-500 group pointer-events-auto select-none font-mono"
    >
      {/* Tactical Boundary Line */}
      <div className="absolute right-0 top-1/6 bottom-1/6 w-[1px] bg-sky-500/10 group-hover:bg-sky-500/30 transition-all pointer-events-none" />

      {/* Top Section: Nav items */}
      <div className="flex flex-col items-center gap-4">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${
                isActive ? 'text-sky-400 scale-110' : 'text-white/20 hover:text-white hover:scale-105'
              }`}
              title={item.label}
            >
              <item.icon size={14} strokeWidth={1.5} />
              <span className="text-[5px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                {item.num}
              </span>
            </button>
          );
        })}
      </div>

      {/* Middle/Bottom HUD Controls (Moved from Top Bar) */}
      <div className="flex flex-col items-center gap-3 pt-3 border-t border-sky-500/10 w-full">
        {/* RADIAL LAUNCHER */}
        <button
          onClick={onOpenWheel}
          className="p-2 rounded-full text-sky-400 hover:text-white hover:bg-sky-500/20 hover:scale-110 transition-all"
          title="Radial Launcher"
        >
          <Compass size={15} className="text-cyan-300 animate-spin" style={{ animationDuration: '10s' }} />
        </button>

        {/* NETWORK TELEMETRY */}
        <button
          onClick={() => setIsNetworkOpen(!isNetworkOpen)}
          className={`p-2 rounded-full transition-all ${
            isNetworkOpen ? 'text-cyan-300 bg-cyan-500/20 shadow-[0_0_10px_cyan]' : 'text-white/20 hover:text-sky-300'
          }`}
          title="Network Telemetry"
        >
          <Radio size={14} className={isNetworkOpen ? 'animate-pulse' : ''} />
        </button>

        {/* GHOST WIREFRAME MODE */}
        <button
          onClick={() => setGhostModeOverride(prev => prev === true ? false : prev === false ? null : true)}
          className={`p-2 rounded-full transition-all ${
            isGhostMode ? 'text-white bg-white/20 shadow-[0_0_10px_white] animate-pulse' : 'text-white/20 hover:text-sky-300'
          }`}
          title={`Ghost Mode: ${ghostModeReason || (ghostModeOverride === true ? 'ON' : 'AUTO')}`}
        >
          <Ghost size={14} />
        </button>

        {/* OPTICS MODE */}
        <button
          onClick={cycleOpticsMode}
          className="p-2 rounded-full text-white/20 hover:text-sky-300 hover:bg-sky-500/10 transition-all"
          title={`Optics Mode: ${opticsMode}`}
        >
          <Eye size={14} />
        </button>
      </div>

      {/* Bottom Status Dots */}
      <div className="flex flex-col items-center gap-2">
        {/* Ambient Glow Light Indicator */}
        <div 
          className="w-2 h-2 rounded-full transition-all" 
          style={{ backgroundColor: ambientGlow.hex, boxShadow: `0 0 8px ${ambientGlow.hex}` }}
          title={`Ambient Light: ${ambientGlow.dominantThemeName}`}
        />

        {/* Sensors */}
        <div className="flex gap-1 items-center">
          <span className={`w-1.5 h-1.5 rounded-full ${isCamActive ? 'bg-emerald-400' : 'bg-rose-500/40'}`} title={`Camera: ${isCamActive ? 'ON' : 'OFF'}`} />
          <span className={`w-1.5 h-1.5 rounded-full ${isRadarActive ? 'bg-sky-400 animate-ping' : 'bg-white/20'}`} title={`Radar: ${isRadarActive ? 'SCANNING' : 'IDLE'}`} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

