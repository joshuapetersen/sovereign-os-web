
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import LiveIntercom from './components/LiveIntercom';
import HUDModule from './components/HUDModule';
import CommCenter from './components/CommCenter';
import TPMStream from './components/TPMStream';
import SettingsMenu from './components/SettingsMenu';
import BootSequence from './components/BootSequence';
import Repository from './components/Repository';
import Studio from './components/Studio';
import NeuralChat from './components/NeuralChat';
import Brainstormer from './components/Brainstormer';
import Radar from './components/Radar';
import GenesisLogo from './components/GenesisLogo'; // IMPORTED THE SOVEREIGN G
import HandController from './components/HandController'; // NEW HAND TRACKER
import EyeController from './components/EyeController'; // NEW EYE TRACKER
import DeveloperDiagnostics from './components/DeveloperDiagnostics'; // NEW DEV DIAGNOSTICS MODULE
import SpatialCommandWheel from './components/SpatialCommandWheel'; // NEW SPATIAL WHEEL MENU
import VolumetricScene from './components/VolumetricScene'; // VOLUMETRIC SCENE
import NetworkTelemetry from './components/NetworkTelemetry'; // NETWORK TELEMETRY MODULE
import { StereoscopicVRView } from './components/StereoscopicVRView'; // STEREOSCOPIC VR OUTPUT VIEW
import { BiometricSecurity } from './components/BiometricSecurity'; // BIOMETRIC SECURITY SCANNER MODULE
import { GoogleServicesModal } from './components/GoogleServicesModal'; // GOOGLE SERVICES & PLAY STORE HUB
import { ambientColorEngine, AmbientColorState, DEFAULT_CYBER_GLOW } from './services/ambientColorService';
import { DashboardTab, DeviceNode, DeviceType, DetectedEntity, ProjectGoal } from './types';
import { parseCommand, identifyObjectFromFrame } from './services/geminiService';
import { Terminal, Sliders, Radar as RadarIcon, Bug, Compass, Sparkles, Eye, Shield, Radio, Ghost } from 'lucide-react';

const STORAGE_KEY = 'SARAH_UNIVERSAL_V9.0_STABLE';

const App: React.FC = () => {
  const [bootPhase, setBootPhase] = useState(0); // 0-4
  const [bootStatus, setBootStatus] = useState('INIT_SYSTEM_CORE...');
  const [hasBooted, setHasBooted] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCamActive, setIsCamActive] = useState(false);
  const [systemMessage, setSystemMessage] = useState<string>('SOVEREIGN_CORE_ACTIVE');
  const [projectGoals, setProjectGoals] = useState<ProjectGoal[]>([]);

  // --- PRACTICAL BOOT SEQUENCE ---
  // Replaces the fake timer with actual system initialization
  const initCam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play();
      }
      setIsCamActive(true);
      return true;
    } catch (e) { 
      console.error("Camera Init Failed", e);
      return false;
    }
  }, []);

  useEffect(() => {
    const systemBoot = async () => {
        // PHASE 1: CORE INTEGRITY
        setBootPhase(1);
        setBootStatus('CHECKING_NEURAL_LINKS...');
        
        // Check API Key existence (Basic integrity)
        if (!process.env.API_KEY) {
            setBootStatus('CRITICAL_ERROR: API_KEY_MISSING');
            await new Promise(r => setTimeout(r, 2000)); // Let user see error
            // We proceed anyway to show UI, but system is degraded
        }
        await new Promise(r => setTimeout(r, 500)); // Minimum visual stability

        // PHASE 2: OPTICAL SENSORS
        setBootPhase(2);
        setBootStatus('INITIALIZING_OPTICS...');
        
        const camSuccess = await initCam();
        if (camSuccess) {
            setBootStatus('OPTICAL_LINK_ESTABLISHED');
        } else {
            setBootStatus('OPTICAL_FAULT_DETECTED (BYPASSING)');
            setSystemMessage('OPTICS_OFFLINE');
        }
        await new Promise(r => setTimeout(r, 800));

        // PHASE 3: AUDIO HANDSHAKE
        setBootPhase(3);
        setBootStatus('SYNCING_AUDIO_PROTOCOLS...');
        try {
            // Check mic permission without keeping stream open
            const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            micStream.getTracks().forEach(t => t.stop());
            setBootStatus('AUDIO_INPUT_VERIFIED');
        } catch (e) {
            setBootStatus('AUDIO_PERMISSION_DENIED');
        }
        await new Promise(r => setTimeout(r, 500));

        // PHASE 4: COMPLETE
        setBootPhase(4);
        setBootStatus('SYSTEM_READY');
        setHasBooted(true);
    };

    systemBoot();
  }, [initCam]);

  const [activeTab, setActiveTab] = useState<DashboardTab>(DashboardTab.OVERVIEW);
  const [commandInput, setCommandInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSarahActive, setIsSarahActive] = useState(false);
  
  // DEFAULT TO FALSE: Clean boot, no clutter.
  const [isRadarActive, setIsRadarActive] = useState(false);
  
  // Initialize with system_stats focused so it appears open on boot
  const [focusedModule, setFocusedModule] = useState<string | null>('system_stats');
  
  // AUTO-SHRINK LOGIC: 
  // After boot completes, wait 1.5s then clear focus. 
  // This makes the health module "shrink into the corner".
  useEffect(() => {
    if (hasBooted) {
      const timer = setTimeout(() => {
        setFocusedModule(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasBooted]);

  const [lookSensitivity, setLookSensitivity] = useState(0.6); 
  const [deviceType, setDeviceType] = useState<DeviceType>('DESKTOP');
  const [isSarahSilent, setIsSarahSilent] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isWheelOpen, setIsWheelOpen] = useState(false);
  const [opticsMode, setOpticsMode] = useState<string>('CYBER_CYAN');
  const [latestGazeIntent, setLatestGazeIntent] = useState<{
    targetModuleId: string | null;
    dwellMs: number;
    probability: number;
    isPreloadWarranted: boolean;
    isIntentLocked: boolean;
  }>({
    targetModuleId: null,
    dwellMs: 0,
    probability: 0,
    isPreloadWarranted: false,
    isIntentLocked: false
  });
  const [preloadedModules, setPreloadedModules] = useState<Record<string, boolean>>({});
  const [ambientGlow, setAmbientGlow] = useState<AmbientColorState>(DEFAULT_CYBER_GLOW);
  const [pulseScale, setPulseScale] = useState(1);
  const [handPosition, setHandPosition] = useState<{ x: number; y: number } | null>(null);
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false);
  const [isStereoscopic, setIsStereoscopic] = useState<boolean>(false);

  // --- BIOMETRIC SECURITY & GOOGLE SERVICES STATE ---
  const [isBiometricUnlocked, setIsBiometricUnlocked] = useState<boolean>(false);
  const [biometricClearance, setBiometricClearance] = useState<string>('RESTRICTED');
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [isGoogleServicesOpen, setIsGoogleServicesOpen] = useState<boolean>(false);

  // Track global pointer activity for proximity scaling when camera hand tracking is offline
  useEffect(() => {
    const handlePointerMove = (e: MouseEvent) => {
      setHandPosition(prev => prev ? prev : { x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, []);

  // --- AUTOMATED GHOST MODE WIREFRAME SYSTEM ---
  const [ghostModeOverride, setGhostModeOverride] = useState<boolean | null>(null); // null = auto
  const [lastUserInteraction, setLastUserInteraction] = useState<number>(Date.now());
  const [isLowEngagement, setIsLowEngagement] = useState<boolean>(false);
  const [currentFps, setCurrentFps] = useState<number>(60);
  const [isLowPerformance, setIsLowPerformance] = useState<boolean>(false);

  // Refresh interaction timestamp when eye tracking gaze or dwell is active
  useEffect(() => {
    if (latestGazeIntent.targetModuleId || latestGazeIntent.dwellMs > 0) {
      setLastUserInteraction(Date.now());
    }
  }, [latestGazeIntent]);

  // Track global user interaction events (mousemove, touch, keypress)
  useEffect(() => {
    const handleActivity = () => setLastUserInteraction(Date.now());
    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, []);

  // Monitor idle engagement (triggers low engagement mode if > 12s without activity)
  useEffect(() => {
    const interval = setInterval(() => {
      const idleTimeMs = Date.now() - lastUserInteraction;
      setIsLowEngagement(idleTimeMs > 12000);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastUserInteraction]);

  // Monitor frame rate & hardware metrics
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const measureFps = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (now - lastTime));
        setCurrentFps(fps);
        setIsLowPerformance(fps < 30);
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(measureFps);
    };

    rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Calculate active Ghost Mode state & reasoning
  const isGhostMode = ghostModeOverride !== null 
    ? ghostModeOverride 
    : (isLowEngagement || isLowPerformance);

  const ghostModeReason = ghostModeOverride !== null
    ? (ghostModeOverride ? 'MANUAL' : null)
    : isLowPerformance
    ? 'FPS_THROTTLE'
    : isLowEngagement
    ? 'LOW_ENGAGEMENT'
    : null;

  // --- CONTINUOUS ENVIRONMENTAL AMBIENT COLOR SAMPLING ---
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCamActive) {
      interval = setInterval(() => {
        const glow = ambientColorEngine.extractAmbientColor(videoRef.current, isCamActive);
        setAmbientGlow(glow);
      }, 350);
    } else {
      setAmbientGlow(DEFAULT_CYBER_GLOW);
    }
    return () => clearInterval(interval);
  }, [isCamActive]);
  const [isCamShrunk, setIsCamShrunk] = useState(false);
  const [detectedEntities, setDetectedEntities] = useState<DetectedEntity[]>([]);
  const [stats] = useState({ bpm: 68, latency: 8, sync: 100 });
  
  const [pairedNodes] = useState<DeviceNode[]>([
    { id: 'watch-01', name: 'SARAH_WATCH', type: 'WATCH', connected: true },
    { id: 'mobile-02', name: 'NODE_X', type: 'WATCH', connected: false }
  ]);
  
  const [modulePositions, setModulePositions] = useState<Record<string, { x: number; y: number }>>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      core: { x: 20, y: Math.max(80, h - 320) }, // Lower-left health stats
      radar: { x: Math.max(20, w - 440), y: 90 }, // Upper-right environmental scan
      comms: { x: Math.max(20, Math.floor(w / 2 - 225)), y: Math.max(60, Math.floor(h / 2 - 250)) }, // Center comms
      settings: { x: Math.max(20, Math.floor(w / 2 - 280)), y: 80 }, // Top Center settings
      diagnostics: { x: Math.max(20, Math.floor(w / 2 + 100)), y: 90 }, // Top Right diagnostics
      repository: { x: Math.max(20, Math.floor(w / 2 - 250)), y: Math.max(60, Math.floor(h / 2 - 250)) },
      studio: { x: Math.max(20, Math.floor(w / 2 - 250)), y: Math.max(60, Math.floor(h / 2 - 280)) },
      neuralchat: { x: Math.max(20, Math.floor(w / 2 - 250)), y: Math.max(60, Math.floor(h / 2 - 270)) },
      brainstormer: { x: Math.max(20, Math.floor(w / 2 - 230)), y: Math.max(60, Math.floor(h / 2 - 270)) }
    };
  });

  useEffect(() => {
    switch(activeTab) {
      case DashboardTab.COMM_HUB: setFocusedModule('comms'); break;
      case DashboardTab.REPOSITORY: setFocusedModule('repository'); break;
      case DashboardTab.STUDIO: setFocusedModule('studio'); break;
      case DashboardTab.NEURAL_CHAT: setFocusedModule('neuralchat'); break;
      case DashboardTab.BRAINSTORM: setFocusedModule('brainstormer'); break;
      case DashboardTab.OVERVIEW: setFocusedModule(null); break; // Don't auto-focus stats on tab switch, let hover handle it
      case DashboardTab.INTEL: setFocusedModule('radar'); break;
    }
  }, [activeTab]);

  // AUTO-ACTIVATE RADAR ON INTEL TAB
  // This ensures expected behavior (content appears) when navigating to the tab,
  // but allows the toggle to turn it off afterwards if desired.
  useEffect(() => {
    if (activeTab === DashboardTab.INTEL) {
      setIsRadarActive(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isSettingsOpen) setFocusedModule('settings');
  }, [isSettingsOpen]);

  useEffect(() => {
    if (isDiagnosticsOpen) setFocusedModule('diagnostics');
  }, [isDiagnosticsOpen]);

  useEffect(() => {
    if (isRadarActive) setFocusedModule('radar');
  }, [isRadarActive]);

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setModulePositions(prev => {
      const updated = { ...prev, [id]: { x, y } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // --- GESTURE HANDLING ---
  const handleGesture = useCallback((gesture: 'SWIPE_LEFT' | 'SWIPE_RIGHT' | 'PINCH') => {
    console.log("GESTURE RECEIVED:", gesture);
    if (gesture === 'SWIPE_LEFT') {
        // Swipe Left (Right to Left) -> Activate Scan
        setSystemMessage("GESTURE: SCAN_INITIATED");
        setIsRadarActive(true);
    }
  }, []);

  const handleDwellClick = useCallback(() => {
      setSystemMessage("OPTICAL_INTERACTION: CONFIRMED");
  }, []);

  const captureFrame = useCallback(() => {
    if (videoRef.current && isCamActive && videoRef.current.readyState === 4) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.5).split(',')[1];
      }
    }
    return null;
  }, [isCamActive]);

  useEffect(() => {
    let interval: any;
    // Only scan if camera is on, system booted, AND Radar is explicitly active
    // We use strictly isRadarActive here to save resources when hidden
    const shouldScan = isCamActive && hasBooted && isRadarActive;
    
    if (shouldScan) {
      interval = setInterval(async () => {
        const frame = captureFrame();
        if (frame) {
          try {
            const result = await identifyObjectFromFrame(frame);
            if (result && result.entities) setDetectedEntities(result.entities);
          } catch (e) { console.warn("RADAR_ERROR", e); }
        }
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [isCamActive, hasBooted, isRadarActive, captureFrame]);

  const toggleCam = useCallback(() => {
    if (isCamActive) {
      const stream = videoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      setIsCamActive(false);
    } else initCam();
  }, [isCamActive, initCam]);

  const handleAction = async (input: string) => {
    if (!input.trim()) return;
    setIsProcessing(true);
    const upper = input.toUpperCase();
    if (upper.includes('STUDIO') || upper.includes('GENERATE') || upper.includes('IMAGE') || upper.includes('VIDEO')) {
      setActiveTab(DashboardTab.STUDIO);
    } else if (upper.includes('COMM') || upper.includes('MESSAGE') || upper.includes('CALL')) {
      setActiveTab(DashboardTab.COMM_HUB);
    } else if (upper.includes('CHAT') || upper.includes('TALK') || upper.includes('ASK')) {
      setActiveTab(DashboardTab.NEURAL_CHAT);
    } else if (upper.includes('BRAINSTORM') || upper.includes('GOAL') || upper.includes('STRATEGY')) {
      setActiveTab(DashboardTab.BRAINSTORM);
    } else if (upper.includes('ARCHIVE') || upper.includes('REPO') || upper.includes('STORE')) {
      setActiveTab(DashboardTab.REPOSITORY);
    } else if (upper.includes('SCAN') || upper.includes('RADAR') || upper.includes('INTEL')) {
      setIsRadarActive(true);
      setActiveTab(DashboardTab.INTEL);
    } else if (upper.includes('DIAG') || upper.includes('DEV') || upper.includes('PERF') || upper.includes('FPS') || upper.includes('DEBUG')) {
      setIsDiagnosticsOpen(true);
    }

    try {
      const res = await parseCommand(input, 37.77, -122.41, true);
      setSystemMessage(res.response || "PROTOCOL_STABLE");
    } catch (e) { setSystemMessage("SYNC_FAULT"); }
    finally { setIsProcessing(false); setCommandInput(''); }
  };

  const handleSelectWheelAction = (actionId: string) => {
    switch (actionId) {
      case 'DIAGNOSTICS': setIsDiagnosticsOpen(true); break;
      case 'NETWORK': setIsNetworkOpen(true); break;
      case 'RADAR': setIsRadarActive(true); setActiveTab(DashboardTab.INTEL); break;
      case 'COMMS': setActiveTab(DashboardTab.COMM_HUB); break;
      case 'SETTINGS': setIsSettingsOpen(true); break;
      case 'NEURALCHAT': setActiveTab(DashboardTab.NEURAL_CHAT); break;
      case 'STUDIO': setActiveTab(DashboardTab.STUDIO); break;
      case 'REPOSITORY': setActiveTab(DashboardTab.REPOSITORY); break;
    }
  };

  const handleGazeIntentUpdate = (event: {
    targetModuleId: string | null;
    dwellMs: number;
    probability: number;
    isPreloadWarranted: boolean;
    isIntentLocked: boolean;
  }) => {
    setLatestGazeIntent(event);

    if (event.targetModuleId && event.isPreloadWarranted) {
      setPreloadedModules(prev => ({ ...prev, [event.targetModuleId!]: true }));

      // Zero-latency pre-focus when intent locks (confidence >= 85%)
      if (event.isIntentLocked && focusedModule !== event.targetModuleId) {
        setFocusedModule(event.targetModuleId);
      }
    }
  };

  const getDeviceFrameStyles = () => {
      switch(deviceType) {
          case 'PHONE': return 'w-[375px] h-[812px] rounded-[60px] border-[14px] border-[#0a0a0a] shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative pointer-events-auto';
          case 'TABLET': return 'w-[1024px] h-[768px] rounded-[40px] border-[14px] border-[#0a0a0a] shadow-2xl overflow-hidden relative pointer-events-auto';
          case 'WATCH': return 'w-[340px] h-[340px] rounded-full border-[10px] border-[#111] shadow-2xl overflow-hidden relative pointer-events-auto';
          case 'TV': return 'w-screen h-screen border-none relative pointer-events-auto';
          default: return 'w-full h-full border-none relative pointer-events-auto';
      }
  };

  // Determine visibility strictly
  const isStatsVisible = deviceType !== 'WATCH' && (activeTab === DashboardTab.OVERVIEW || activeTab === DashboardTab.INTEL);
  
  // Radar is visible STRICTLY if toggle is ON. 
  // (Auto-on is handled by the useEffect above)
  const isRadarVisible = isRadarActive && deviceType !== 'WATCH';

  return (
    <div 
        style={{'--pulse-intensity': pulseScale - 1} as any} 
        className="relative h-screen w-screen bg-transparent flex items-center justify-center overflow-hidden transition-all duration-1000"
    >
      {/* 
         THE SOVEREIGN LOGO
      */}
      <div 
        className={`fixed z-[1000] transition-all duration-1500 cubic-bezier(0.22, 1, 0.36, 1) pointer-events-none ${
          !hasBooted 
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[3]' 
            : 'top-6 left-5 translate-x-0 translate-y-0 scale-[0.12] origin-top-left'
        }`}
      >
         <GenesisLogo emotionState={isSarahActive ? 'ENGAGED' : isProcessing ? 'PROCESSING' : 'NEUTRAL'} />
      </div>

      <BootSequence onComplete={() => {}} phase={bootPhase} status={bootStatus} />

      <StereoscopicVRView isStereoscopic={isStereoscopic} onToggleStereo={() => setIsStereoscopic(!isStereoscopic)}>
        <div className={`${getDeviceFrameStyles()} z-10 bg-transparent`}>
        
        {/* VOLUMETRIC SCENE 3D BACKGROUND */}
        <VolumetricScene 
            intensity={pulseScale} 
            emotion={isSarahActive ? 'ENGAGED' : isProcessing ? 'PROCESSING' : 'NEUTRAL'} 
            opticsMode={opticsMode}
            isVoiceActive={isSarahActive}
        />

        {/* SPATIAL RADIAL COMMAND WHEEL MODAL */}
        <SpatialCommandWheel 
            isOpen={isWheelOpen}
            onClose={() => setIsWheelOpen(false)}
            onSelectAction={handleSelectWheelAction}
            activeOpticsMode={opticsMode}
            onChangeOpticsMode={setOpticsMode}
        />

        <video 
            ref={videoRef} autoPlay playsInline muted 
            className={`absolute inset-0 object-cover w-full h-full transition-all duration-1000
            ${isCamShrunk ? 'top-6 right-6 w-52 h-32 z-[9000] rounded-xl border border-sky-500/50 opacity-100 shadow-[0_0_30px_rgba(14,165,233,0.6)]' : 'z-[-5] opacity-80 filter contrast-125'}
            `} 
            style={{ pointerEvents: 'none' }}
        />

        <HandController 
            videoElement={videoRef.current} 
            isCamActive={isCamActive} 
            onGesture={handleGesture}
            onHandMove={(pos) => setHandPosition(pos)}
        />

        {/* EYE/GAZE CONTROLLER */}
        <EyeController 
            videoElement={videoRef.current}
            isCamActive={isCamActive}
            focusedModule={focusedModule}
            onDwellClick={handleDwellClick}
            onGazeIntentUpdate={handleGazeIntentUpdate}
        />

        <div className={`w-full h-full transition-opacity duration-1000 ${hasBooted ? 'opacity-100' : 'opacity-0'} relative z-20 bg-transparent pointer-events-none`}>
            {deviceType !== 'WATCH' && (
              <Sidebar 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                onOpenWheel={() => setIsWheelOpen(true)}
                isNetworkOpen={isNetworkOpen}
                setIsNetworkOpen={setIsNetworkOpen}
                isGhostMode={isGhostMode}
                ghostModeOverride={ghostModeOverride}
                ghostModeReason={ghostModeReason}
                setGhostModeOverride={setGhostModeOverride}
                latestGazeIntent={latestGazeIntent}
                opticsMode={opticsMode}
                setOpticsMode={setOpticsMode}
                ambientGlow={ambientGlow}
                isCamActive={isCamActive}
                isRadarActive={isRadarActive}
              />
            )}
            
            <LiveIntercom 
                onPulseUpdate={setPulseScale} 
                onActiveChange={setIsSarahActive} 
                isCameraOn={isCamActive} 
                onToggleCamSize={() => setIsCamShrunk(!isCamShrunk)}
                isCamShrunk={isCamShrunk}
                onToggleCam={toggleCam}
            />

            {deviceType !== 'WATCH' && <TPMStream stats={stats} stability="STABLE" />}

            {/* TOP HUD BAR FOR QUICK ACTIONS (BIOMETRICS & GOOGLE SERVICES) */}
            <div className="fixed top-3 right-6 z-[9500] flex items-center gap-2 pointer-events-auto font-mono text-[9px]">
              {/* GOOGLE ACCOUNT & PLAY STORE TRIGGER */}
              <button
                onClick={() => setIsGoogleServicesOpen(!isGoogleServicesOpen)}
                className="px-2.5 py-1 bg-black/70 hover:bg-black/90 border border-blue-500/40 hover:border-cyan-400 rounded-full text-white backdrop-blur-md transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(59,130,246,0.3)] group"
                title="Google Account & Play Store Options"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-blue-500 via-red-500 to-amber-500 flex items-center justify-center text-[7px] font-black text-black">
                  G
                </div>
                <span className="font-bold text-white/90 group-hover:text-cyan-300">PLAY STORE</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>

              {/* BIOMETRIC SECURITY VAULT TRIGGER */}
              <button
                onClick={() => setIsBiometricModalOpen(!isBiometricModalOpen)}
                className={`px-2.5 py-1 bg-black/70 hover:bg-black/90 border rounded-full backdrop-blur-md transition-all flex items-center gap-1.5 shadow-md ${
                  isBiometricUnlocked
                    ? 'border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                    : 'border-rose-500/40 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                }`}
                title="Biometric Security Vault"
              >
                <Shield size={11} className={isBiometricUnlocked ? "text-emerald-400" : "text-rose-400 animate-pulse"} />
                <span className="font-black uppercase tracking-wider">
                  {isBiometricUnlocked ? 'LEVEL 5 CLEARANCE' : 'BIOMETRIC LOCK'}
                </span>
              </button>
            </div>

            <main className="w-full h-full relative pointer-events-none">
                
                {/* SETTINGS: Anchored Top Center, Expands Down */}
                <HUDModule 
                    id="settings" title="SYSTEM_CONFIG" 
                    initialPosition={modulePositions.settings} onPositionChange={handlePositionChange} 
                    visible={isSettingsOpen} 
                    isFocused={focusedModule === 'settings'} onFocus={() => setFocusedModule('settings')}
                    onClose={() => setIsSettingsOpen(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                    <SettingsMenu 
                        lookSensitivity={lookSensitivity}
                        setLookSensitivity={setLookSensitivity}
                        deviceType={deviceType}
                        setDeviceType={setDeviceType}
                        isSarahSilent={isSarahSilent}
                        setIsSarahSilent={setIsSarahSilent}
                        pairedNodes={pairedNodes}
                        isHighContrast={isHighContrast}
                        setIsHighContrast={setIsHighContrast}
                        isStereoscopic={isStereoscopic}
                        setIsStereoscopic={setIsStereoscopic}
                        isBiometricUnlocked={isBiometricUnlocked}
                        onOpenBiometrics={() => setIsBiometricModalOpen(true)}
                        onOpenGoogleServices={() => setIsGoogleServicesOpen(true)}
                    />
                </HUDModule>

                {/* BIOMETRIC SECURITY SCANNER HUD MODULE */}
                <HUDModule 
                    id="biometric_vault" title="BIOMETRIC_SECURITY_VAULT" 
                    initialPosition={{ x: window.innerWidth / 2 - 280, y: 100 }} 
                    onPositionChange={handlePositionChange} 
                    visible={isBiometricModalOpen} 
                    isFocused={focusedModule === 'biometric_vault'} onFocus={() => setFocusedModule('biometric_vault')}
                    onClose={() => setIsBiometricModalOpen(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                  <BiometricSecurity 
                    isUnlocked={isBiometricUnlocked}
                    onUnlockStateChange={(unlocked, level) => {
                      setIsBiometricUnlocked(unlocked);
                      setBiometricClearance(level);
                    }}
                    videoElement={videoRef.current}
                    onClose={() => setIsBiometricModalOpen(false)}
                  />
                </HUDModule>

                {/* GOOGLE PLAY STORE & ACCOUNT HUB HUD MODULE */}
                <HUDModule 
                    id="google_hub" title="GOOGLE_PLAY_SERVICES" 
                    initialPosition={{ x: window.innerWidth / 2 - 280, y: 120 }} 
                    onPositionChange={handlePositionChange} 
                    visible={isGoogleServicesOpen} 
                    isFocused={focusedModule === 'google_hub'} onFocus={() => setFocusedModule('google_hub')}
                    onClose={() => setIsGoogleServicesOpen(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                  <GoogleServicesModal 
                    onClose={() => setIsGoogleServicesOpen(false)}
                    onOpenApplet={(appletId) => {
                      if (appletId === 'volumetric-engine') setOpticsMode('CYBER_CYAN');
                      if (appletId === 'satellite-radar') setIsRadarActive(true);
                      if (appletId === 'stereoscopic-vr') setIsStereoscopic(true);
                    }}
                  />
                </HUDModule>

                {/* SYSTEM HEALTH: Anchored Bottom Left */}
                <HUDModule 
                  id="system_stats" 
                  title="NODE_01_HEALTH" 
                  initialPosition={modulePositions.core} 
                  onPositionChange={handlePositionChange} 
                  visible={isStatsVisible} 
                  isFocused={focusedModule === 'system_stats'} 
                  onClose={() => setIsStatsVisible(false)}
                  ambientGlow={ambientGlow}
                  isGhostMode={isGhostMode}
                  isHighContrast={isHighContrast}
                  handPosition={handPosition}
                >
                <div className="flex flex-col gap-6 py-4 w-[280px] pointer-events-auto">
                    <div className="text-[9px] font-black uppercase tracking-[0.5em] text-sky-400 text-center animate-pulse">{systemMessage}</div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1 border-l border-sky-400/20 pl-4 py-1">
                          <span className="text-[5px] text-white/50 uppercase font-black">Resonance</span>
                          <span className="text-[10px] font-bold text-sky-300">1.0927_HZ</span>
                        </div>
                        <div className="flex flex-col gap-1 border-l border-rose-500/20 pl-4 py-1">
                          <span className="text-[5px] text-white/50 uppercase font-black">SDNA_Density</span>
                          <span className="text-[10px] font-bold text-rose-300">0.999999999</span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {/* MAIN TOGGLE FOR RADAR */}
                        <div 
                            onClick={(e) => { e.stopPropagation(); setIsRadarActive(!isRadarActive); }}
                            className={`flex items-center justify-between p-2 rounded-lg border transition-all cursor-pointer group ${
                                isRadarActive 
                                ? 'bg-sky-500/20 border-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.3)]' 
                                : 'bg-black/40 border-white/10 hover:border-white/30'
                            }`}
                        >
                             <div className="flex items-center gap-3">
                                <RadarIcon size={12} className={isRadarActive ? "text-sky-300 animate-pulse" : "text-white/30"} />
                                <div className="flex flex-col">
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${isRadarActive ? 'text-white' : 'text-white/50'}`}>Env_Scanner</span>
                                    <span className="text-[6px] uppercase tracking-widest text-white/30">{isRadarActive ? 'Analyzing...' : 'Standby'}</span>
                                </div>
                             </div>
                             
                             <div className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-wider transition-colors ${
                                 isRadarActive ? 'bg-sky-400 text-black' : 'bg-white/10 text-white/40'
                             }`}>
                                  {isRadarActive ? 'ACTIVE' : 'OFF'}
                             </div>
                        </div>

                        {/* Config & Dev Buttons */}
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center gap-2 text-[7px] text-sky-400/70 font-black border border-sky-400/10 bg-sky-400/5 py-2.5 uppercase tracking-[0.2em] hover:bg-sky-400/15 hover:text-sky-300 transition-all rounded-lg">
                              <Sliders size={10} /> CONFIG
                          </button>

                          <button onClick={() => setIsDiagnosticsOpen(!isDiagnosticsOpen)} className={`flex items-center justify-center gap-2 text-[7px] font-black border py-2.5 uppercase tracking-[0.2em] transition-all rounded-lg ${
                            isDiagnosticsOpen 
                              ? 'text-emerald-300 border-emerald-400/40 bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.3)]' 
                              : 'text-sky-400/70 border-sky-400/10 bg-sky-400/5 hover:bg-sky-400/15 hover:text-sky-300'
                          }`}>
                              <Bug size={10} /> DIAGNOSTICS
                          </button>
                        </div>
                    </div>
                </div>
                </HUDModule>

                {/* DEVELOPER DIAGNOSTICS HUD MODULE */}
                <HUDModule 
                    id="diagnostics" title="DEV_DIAGNOSTICS" 
                    initialPosition={modulePositions.diagnostics || { x: 800, y: 90 }} 
                    onPositionChange={handlePositionChange} 
                    visible={isDiagnosticsOpen} 
                    isFocused={focusedModule === 'diagnostics'} onFocus={() => setFocusedModule('diagnostics')}
                    onClose={() => setIsDiagnosticsOpen(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                  <DeveloperDiagnostics 
                    systemMessage={systemMessage}
                    activeTab={activeTab}
                    deviceType={deviceType}
                    isCamActive={isCamActive}
                    detectedEntitiesCount={detectedEntities.length}
                    modulePositions={modulePositions}
                    latestGazeIntent={latestGazeIntent}
                    onTriggerReboot={() => {
                      setHasBooted(false);
                      setBootPhase(0);
                      setTimeout(() => setHasBooted(true), 2500);
                    }}
                    onClearStorage={() => {
                      localStorage.removeItem(STORAGE_KEY);
                      window.location.reload();
                    }}
                    onInjectTestEntity={() => {
                      setDetectedEntities(prev => [
                        ...prev, 
                        { id: `test-${Date.now()}`, type: 'ANOMALY', distance: 2.4, confidence: 0.99, x: 0, y: 0 }
                      ]);
                      setIsRadarActive(true);
                    }}
                  />
                </HUDModule>

                {/* NETWORK TELEMETRY HUD MODULE */}
                <HUDModule 
                    id="network" title="NETWORK_TELEMETRY" 
                    initialPosition={modulePositions.network || { x: 420, y: 90 }} 
                    onPositionChange={handlePositionChange} 
                    visible={isNetworkOpen} 
                    isFocused={focusedModule === 'network'} onFocus={() => setFocusedModule('network')}
                    onClose={() => setIsNetworkOpen(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                  <NetworkTelemetry />
                </HUDModule>

                {/* RADAR: Anchored Right */}
                <HUDModule 
                    id="radar" title="ENVIRONMENTAL_SCAN" 
                    initialPosition={modulePositions.radar} onPositionChange={handlePositionChange} 
                    visible={isRadarVisible} 
                    isFocused={focusedModule === 'radar'} onFocus={() => setFocusedModule('radar')}
                    onClose={() => setIsRadarActive(false)}
                    ambientGlow={ambientGlow}
                    isGhostMode={isGhostMode}
                    isHighContrast={isHighContrast}
                    handPosition={handPosition}
                >
                  <Radar entities={detectedEntities} />
                </HUDModule>

                {/* CENTRAL MODULES */}
                <HUDModule id="comms" title="COMM_LINK" initialPosition={modulePositions.comms} onPositionChange={handlePositionChange} visible={activeTab === DashboardTab.COMM_HUB && deviceType !== 'WATCH'} isFocused={focusedModule === 'comms'} onFocus={() => setFocusedModule('comms')} onClose={() => setActiveTab(DashboardTab.OVERVIEW)} ambientGlow={ambientGlow} isGhostMode={isGhostMode} isHighContrast={isHighContrast} handPosition={handPosition}>
                  <CommCenter />
                </HUDModule>
                
                <HUDModule id="repository" title="ARCHIVE_05" initialPosition={modulePositions.repository} onPositionChange={handlePositionChange} visible={activeTab === DashboardTab.REPOSITORY && deviceType !== 'WATCH'} isFocused={focusedModule === 'repository'} onFocus={() => setFocusedModule('repository')} onClose={() => setActiveTab(DashboardTab.OVERVIEW)} ambientGlow={ambientGlow} isGhostMode={isGhostMode} isHighContrast={isHighContrast} handPosition={handPosition}>
                  <Repository />
                </HUDModule>
                
                <HUDModule id="studio" title="MATRIX_SYNTH" initialPosition={modulePositions.studio} onPositionChange={handlePositionChange} visible={activeTab === DashboardTab.STUDIO && deviceType !== 'WATCH'} isFocused={focusedModule === 'studio'} onFocus={() => setFocusedModule('studio')} onClose={() => setActiveTab(DashboardTab.OVERVIEW)} ambientGlow={ambientGlow} isGhostMode={isGhostMode} isHighContrast={isHighContrast} handPosition={handPosition}>
                  <Studio />
                </HUDModule>

                <HUDModule id="neuralchat" title="SENTIENCE_CORE" initialPosition={modulePositions.neuralchat} onPositionChange={handlePositionChange} visible={activeTab === DashboardTab.NEURAL_CHAT && deviceType !== 'WATCH'} isFocused={focusedModule === 'neuralchat'} onFocus={() => setFocusedModule('neuralchat')} onClose={() => setActiveTab(DashboardTab.OVERVIEW)} ambientGlow={ambientGlow} isGhostMode={isGhostMode} isHighContrast={isHighContrast} handPosition={handPosition}>
                  <NeuralChat />
                </HUDModule>

                <HUDModule id="brainstormer" title="NEURAL_BRAINSTORM" initialPosition={modulePositions.brainstormer} onPositionChange={handlePositionChange} visible={activeTab === DashboardTab.BRAINSTORM && deviceType !== 'WATCH'} isFocused={focusedModule === 'brainstormer'} onFocus={() => setFocusedModule('brainstormer')} onClose={() => setActiveTab(DashboardTab.OVERVIEW)} ambientGlow={ambientGlow} isGhostMode={isGhostMode} isHighContrast={isHighContrast} handPosition={handPosition}>
                  <Brainstormer goals={projectGoals} onGoalsUpdate={setProjectGoals} />
                </HUDModule>

                {/* Command Bar */}
                {deviceType !== 'WATCH' && (
                    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[400px] z-[9000] opacity-50 hover:opacity-100 transition-all duration-700 pointer-events-auto">
                      <div className="flex items-center gap-6 border border-sky-400/20 py-4 px-8 bg-black/60 rounded-full backdrop-blur-sm shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
                          <Terminal size={12} className="text-sky-400/50" />
                          <input 
                            type="text" 
                            value={commandInput} 
                            onChange={(e) => setCommandInput(e.target.value)} 
                            onKeyDown={(e) => e.key === 'Enter' && handleAction(commandInput)} 
                            placeholder="DIRECT_COMMAND_PROTOCOL..." 
                            className="bg-transparent border-none outline-none text-[10px] w-full font-black uppercase tracking-[0.5em] text-sky-100 placeholder:text-sky-900" 
                          />
                      </div>
                    </div>
                )}
            </main>
        </div>
      </div>
      </StereoscopicVRView>
    </div>
  );
};

export default App;
