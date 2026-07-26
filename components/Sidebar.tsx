
import React from 'react';
import { LayoutDashboard, Zap, Mic2, Activity, Package, MessageCircle } from 'lucide-react';
import { DashboardTab } from '../types';

interface SidebarProps {
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: DashboardTab.OVERVIEW, icon: LayoutDashboard, label: '01' },
    { id: DashboardTab.BRAINSTORM, icon: Zap, label: '02' },
    { id: DashboardTab.COMM_HUB, icon: MessageCircle, label: '03' },
    { id: DashboardTab.LIVE_COMMS, icon: Mic2, label: '04' },
    { id: DashboardTab.INTEL, icon: Activity, label: '05' },
    { id: DashboardTab.REPOSITORY, icon: Package, label: '06' },
  ];

  return (
    /* Ghost Navigation: Strictly vanishes when not hovered */
    <aside className="fixed left-0 top-0 bottom-0 w-16 flex flex-col justify-center items-center gap-8 z-[200] opacity-0 hover:opacity-100 transition-all duration-700 group pointer-events-auto select-none">
        {/* Invisible hit-area extender for peripheral activation */}
        <div className="absolute left-0 top-0 bottom-0 w-12 -z-10 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
        
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === item.id ? 'text-sky-400 scale-110' : 'text-white/10 hover:text-white hover:scale-105'
            }`}
          >
            <item.icon size={12} strokeWidth={1} />
            <span className="text-[4px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
              {item.label}
            </span>
          </button>
        ))}

        {/* Tactical boundary line */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-[0.5px] bg-sky-500/5 group-hover:bg-sky-500/20 transition-all"></div>
    </aside>
  );
};

export default Sidebar;
