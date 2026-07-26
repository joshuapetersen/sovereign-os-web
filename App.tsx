
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import LiveIntercom from './components/LiveIntercom';
import HUDModule from './components/HUDModule';
import CommCenter from './components/CommCenter';
import TPMStream from './components/TPMStream';
import SettingsMenu from './components/SettingsMenu';
import GenesisLogo from './components/GenesisLogo';
import { DashboardTab, DeviceNode } from './types';
import { parseCommand } from './services/geminiService';
import { Terminal, Sliders } from 'lucide-react';

const STORAGE_KEY = 'SARAH_UNIVERSAL_V8.2_STABLE';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [systemMessage, setSystemMessage] = useState<string>('GENESIS_IDENTITY_CONFIRMED');
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isSarahActive, setIsSarahActive] = useState(false);
  const [lookSensitivity, setLookSensitivity] = useState(0.5); 
  const [isWatchMode, setIsWatchMode] = useState(false);
  const [isSarahSilent, setIsSarahSilent] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pulseScale, setPulseScale] = useState(1);
  const [stats] = useState({ bpm: 68, latency: 12, sync: 100 });
  const [pairedNodes, setPairedNodes] = useState<DeviceNode[]>([
    { id: 'watch-01', name: 'AI_WATCH_ULTRA', type: 'WATCH', connected: false },
    { id: 'mobile-02', name: 'NODE_MOBILE_X', type: 'WATCH', connected: false }
  ]);

  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [modulePositions, setModulePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
    const w = window.innerWidth;
    const h = window.innerHeight;
    return {
      core: { x: w / 2 - 160, y: h / 2 - 120 },
      radar: { x: w - 400, y: 80 },
      comms: { x: w / 2 - 225, y: h / 2 - 250 },
      settings: { x: w / 2 - 290, y: h / 2 - 240 }
    };
  });

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setModulePositions(prev => {
      const updated = { ...prev, [id]: { x, y } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const initCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1920 } } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCamActive(true);
    } catch (e) { setSystemMessage("OPTICAL_DEGRADED"); }
  }, []);

  useEffect(() => { 
    initCam(); 
  }, [initCam]);

  // Direct Cursor DOM Update (Non-React)
  useEffect(() => {
    const cursor = document.getElementById('neural-cursor');
    const handlePointer = (e: PointerEvent) => {
      if (cursor) {
        cursor.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };
    window.addEventListener('pointermove', handlePointer);
    return () => window.removeEventListener('pointermove', handlePointer);
  }, []);

  const handleAction = async (input: string) => {
    if (!input.trim()) return;
    setIsProcessing(true);
    try {
      const res = await parseCommand(input, 37.77, -122.41, true);
      setSystemMessage(res.response || "GENESIS_PROTOCOL_EXECUTED");
    } catch (e) { setSystemMessage("SYNC_FAULT"); } finally { setIsProcessing(false); setCommandInput(''); }
  };

  return (
    <div style={{'--pulse-intensity': pulseScale - 1} as any} className={`relative h-screen w-screen overflow-hidden transition-all duration-1000 ${isWatchMode ? 'bg-[#050505]' : 'bg-black'}`}>
      
      {/* KINETIC OPTICAL FEED */}
      <video 
        ref={videoRef} autoPlay playsInline muted 
        className={`fixed top-0 left-0 w-full h-full object-cover -z-10 transform scaleX(-1) transition-all duration-1000 filter brightness(0.2) contrast(1.1) saturate(0.2) ${isWatchMode ? 'opacity-0 scale-90 blur-3xl' : 'opacity-100 scale-100'}`} 
      />

      {/* ANCHORED GENESIS IDENTITY */}
      <div className="fixed top-8 left-10 z-[10000] flex items-center gap-6 pointer-events-auto">
         <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="group outline-none">
            <GenesisLogo 
              active={isProcessing || isSarahActive} 
              overdrive={isProcessing || isSyncing}
              scale={isWatchMode ? 0.8 : 1} 
            />
         </button>
      </div>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <LiveIntercom 
        onVoiceCommand={(text) => text.toUpperCase().includes("SETTINGS") && setIsSettingsOpen(true)} 
        onPulseUpdate={setPulseScale} 
        onActiveChange={setIsSarahActive} 
        isCameraOn={isCamActive} 
      />

      <TPMStream stats={stats} stability="STABLE" />

      <main className={`w-full h-full relative transition-all duration-1000 ${isWatchMode ? 'scale-[0.8] rounded-[6rem] shadow-[0_0_100px_rgba(0,0,0,1)]' : ''}`}>
        
        <HUDModule id="settings" title="SOVEREIGN_COMMAND" initialPosition={modulePositions.settings} onPositionChange={handlePositionChange} sensitivity={lookSensitivity} visible={isSettingsOpen}>
           <SettingsMenu 
             lookSensitivity={lookSensitivity}
             setLookSensitivity={setLookSensitivity}
             isWatchMode={isWatchMode}
             setIsWatchMode={setIsWatchMode}
             isSarahSilent={isSarahSilent}
             setIsSarahSilent={setIsSarahSilent}
             pairedNodes={pairedNodes}
           />
        </HUDModule>

        <HUDModule id="core" title="GENESIS_OS_NODE" initialPosition={modulePositions.core} onPositionChange={handlePositionChange} sensitivity={lookSensitivity}>
          <div className="flex flex-col gap-6 py-4 w-[300px]">
             <div className="text-[10px] font-black uppercase tracking-[0.4em] text-white/90 text-center animate-pulse">{systemMessage}</div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1 border-l border-sky-400/20 pl-4 py-2">
                   <span className="text-[6px] text-white/30 uppercase font-black">Spatial_Mesh</span>
                   <span className="text-[10px] font-bold text-sky-400">{(lookSensitivity * 100).toFixed(0)}%_ACTIVE</span>
                </div>
                <div className="flex flex-col gap-1 border-l border-sky-400/20 pl-4 py-2">
                   <span className="text-[6px] text-white/30 uppercase font-black">Node_Sync</span>
                   <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-sky-400">{pairedNodes.filter(n => n.connected).length}_LINKS</span>
                   </div>
                </div>
             </div>

             <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="flex items-center justify-center gap-3 text-[8px] text-sky-400 font-black border border-sky-400/20 bg-sky-400/5 px-4 py-4 uppercase tracking-[0.5em] hover:bg-sky-400/10 transition-all rounded-xl">
                <Sliders size={12} /> Manual_Override
             </button>
          </div>
        </HUDModule>

        <HUDModule id="radar" title={isSyncing ? "HANDSHAKE..." : "ENVIRONMENT"} initialPosition={modulePositions.radar} onPositionChange={handlePositionChange} sensitivity={lookSensitivity}>
           <div id="hud-module-radar" className={`relative aspect-square w-full bg-[#080808]/90 rounded-full border border-white/5 overflow-hidden transition-all duration-700 ${isSyncing ? 'shadow-[0_0_80px_rgba(14,165,233,0.4)] border-sky-400 scale-105' : ''}`}>
              <div className={`radar-sweep ${isSyncing ? 'animate-[radar-rotate_1.5s_linear_infinite] opacity-100' : 'opacity-20'}`}></div>
              {isSyncing && (
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-16 h-16 border-[1px] border-sky-400/20 border-t-sky-400 rounded-full animate-spin"></div>
                </div>
              )}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className={`w-1 h-1 rounded-full ${isSyncing ? 'bg-sky-400' : 'bg-white/10'}`}></div>
              </div>
           </div>
        </HUDModule>

        <HUDModule id="comms" title="SECURE_STREAMS" initialPosition={modulePositions.comms} onPositionChange={handlePositionChange} sensitivity={lookSensitivity} visible={activeTab === DashboardTab.COMM_HUB}>
           <CommCenter />
        </HUDModule>

        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 w-[420px] z-[1000] opacity-20 hover:opacity-100 transition-all duration-700">
          <div className="flex items-center gap-6 border border-white/10 py-5 px-10 bg-black/80 rounded-[3rem] backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <Terminal size={14} className="text-cyan-400/50" />
            <input type="text" value={commandInput} onChange={(e) => setCommandInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAction(commandInput)} placeholder="GENESIS_DIRECTIVE..." className="bg-transparent border-none outline-none text-[11px] w-full font-black uppercase tracking-[0.5em] text-white/90" />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
