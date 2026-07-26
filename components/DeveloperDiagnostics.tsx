import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Activity, Cpu, Database, Eye, Terminal, Zap, Gauge, Sliders, 
  RefreshCw, Play, Pause, Copy, Check, AlertTriangle, Bug, Search, 
  Layers, Crosshair, ShieldAlert, Monitor, HardDrive, Wifi, Sparkles, Box, Compass
} from 'lucide-react';
import { DashboardTab, DeviceType } from '../types';
import { gazePersistence } from '../services/gazePersistenceService';

interface DeveloperDiagnosticsProps {
  systemMessage: string;
  activeTab: DashboardTab;
  deviceType: DeviceType;
  isCamActive: boolean;
  detectedEntitiesCount: number;
  modulePositions: Record<string, { x: number; y: number }>;
  onTriggerReboot?: () => void;
  onClearStorage?: () => void;
  onInjectTestEntity?: () => void;
  latestGazeIntent?: {
    targetModuleId: string | null;
    dwellMs: number;
    probability: number;
    isPreloadWarranted: boolean;
    isIntentLocked: boolean;
  };
}

type DiagTab = 'PERF_FPS' | 'TELEMETRY' | 'STATE_TREE' | 'DEBUG_TOOLS' | 'GAZE_INTENT';

const DeveloperDiagnostics: React.FC<DeveloperDiagnosticsProps> = ({
  systemMessage,
  activeTab,
  deviceType,
  isCamActive,
  detectedEntitiesCount,
  modulePositions,
  onTriggerReboot,
  onClearStorage,
  onInjectTestEntity,
  latestGazeIntent
}) => {
  const [activeDiagTab, setActiveDiagTab] = useState<DiagTab>('PERF_FPS');
  const [gazeData, setGazeData] = useState(() => gazePersistence.getData());

  useEffect(() => {
    const interval = setInterval(() => {
      setGazeData(gazePersistence.getData());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // --- REAL-TIME FPS & FRAME TIME ENGINE ---
  const [fps, setFps] = useState<number>(60);
  const [frameTimeMs, setFrameTimeMs] = useState<number>(16.6);
  const [fpsHistory, setFpsHistory] = useState<number[]>(() => Array(60).fill(60));
  const [minFps, setMinFps] = useState<number>(60);
  const [maxFps, setMaxFps] = useState<number>(60);
  const [droppedFrames, setDroppedFrames] = useState<number>(0);
  
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const rafIdRef = useRef<number | null>(null);

  // Performance Toggles
  const [showFpsOverlay, setShowFpsOverlay] = useState<boolean>(true);
  const [targetFpsLimit, setTargetFpsLimit] = useState<number>(120);

  // Telemetry Controls
  const [isTelemetryPaused, setIsTelemetryPaused] = useState<boolean>(false);
  const [telemetryMode, setTelemetryMode] = useState<'METRICS' | 'RAW_JSON'>('METRICS');
  const [copied, setCopied] = useState<boolean>(false);

  // State Inspector Search
  const [stateSearch, setStateSearch] = useState<string>('');

  // Debug Overlays & Fault Injection Toggles
  const [showGazeVectorOverlay, setShowGazeVectorOverlay] = useState<boolean>(false);
  const [showModuleBoundsOverlay, setShowModuleBoundsOverlay] = useState<boolean>(false);
  const [verboseLogging, setVerboseLogging] = useState<boolean>(true);
  const [simulatedThermalThrottling, setSimulatedThermalThrottling] = useState<boolean>(false);
  const [simulatedGazeDrift, setSimulatedGazeDrift] = useState<boolean>(false);

  // --- FPS MONITOR LOOP ---
  useEffect(() => {
    let lastFrameTimestamp = performance.now();

    const loop = (now: number) => {
      const delta = now - lastFrameTimestamp;
      lastFrameTimestamp = now;

      frameCountRef.current++;

      if (now - lastTimeRef.current >= 500) {
        const currentFps = Math.min(targetFpsLimit, Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        const currentFrameTime = parseFloat((1000 / (currentFps || 60)).toFixed(1));

        setFps(currentFps);
        setFrameTimeMs(currentFrameTime);
        
        setMinFps(prev => (prev === 0 ? currentFps : Math.min(prev, currentFps)));
        setMaxFps(prev => Math.max(prev, currentFps));

        if (currentFps < 45) {
          setDroppedFrames(prev => prev + 1);
        }

        setFpsHistory(prev => [...prev.slice(1), currentFps]);

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [targetFpsLimit]);

  // Simulated telemetry state generator
  const telemetryData = useMemo(() => {
    return {
      timestamp: new Date().toISOString(),
      performance: {
        fps,
        frameTimeMs,
        targetFpsLimit,
        droppedFrames,
        memoryUsageMb: typeof window !== 'undefined' && (performance as any).memory
          ? Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024))
          : 148,
        webglRenderer: 'ANGLE (NVIDIA GeForce RTX 4090 OpenXR Direct3D11 vs_5_0 ps_5_0)'
      },
      sensors: {
        cameraActive: isCamActive,
        cameraResolution: isCamActive ? '1920x1080@60fps' : 'OFFLINE',
        eyeGazeVector: {
          x: (Math.sin(Date.now() / 800) * 0.25).toFixed(3),
          y: (Math.cos(Date.now() / 600) * 0.18).toFixed(3),
          z: 1.45,
          fovealLock: true,
          driftNoise: simulatedGazeDrift ? 'ACTIVE_0.04deg' : 'NONE'
        },
        handController: {
          leftPinchConfidence: 0.94,
          rightPinchConfidence: 0.88,
          activeGesture: 'POINTER_TAP'
        },
        spatialOrientation: {
          yawDeg: (Math.sin(Date.now() / 1500) * 12).toFixed(1),
          pitchDeg: (Math.cos(Date.now() / 1200) * 8).toFixed(1),
          rollDeg: 0.2
        }
      },
      systemState: {
        activeTab,
        deviceType,
        systemMessage,
        detectedEntitiesCount,
        thermalStatus: simulatedThermalThrottling ? 'THROTTLED_78C' : 'NOMINAL_38C'
      }
    };
  }, [fps, frameTimeMs, targetFpsLimit, droppedFrames, isCamActive, simulatedGazeDrift, activeTab, deviceType, systemMessage, detectedEntitiesCount, simulatedThermalThrottling]);

  const handleCopyTelemetry = () => {
    navigator.clipboard.writeText(JSON.stringify(telemetryData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-[400px] h-[520px] bg-[#0a0d12]/95 border border-sky-500/30 rounded-2xl p-3 flex flex-col font-sans select-none shadow-[0_0_40px_rgba(14,165,233,0.15)] text-white backdrop-blur-md">
      
      {/* HUD Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-sky-500/20 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/20 border border-sky-400/40 rounded-lg text-sky-300">
            <Bug size={16} />
          </div>
          <div className="flex flex-col">
            <span className="text-[12px] font-black uppercase tracking-wider text-sky-100">DEV_DIAGNOSTICS_V4.2</span>
            <span className="text-[8px] font-mono text-sky-400/70">OPENXR_PERF_INSPECTOR</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className={`px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase border ${
            fps >= 55 ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {fps} FPS
          </span>
          <span className="text-[8px] font-mono text-white/40">{frameTimeMs}ms</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-5 gap-1 p-1 bg-black/50 border border-white/10 rounded-lg mb-3">
        {[
          { id: 'PERF_FPS', label: 'FPS / PERF', icon: Gauge },
          { id: 'TELEMETRY', label: 'TELEMETRY', icon: Activity },
          { id: 'GAZE_INTENT', label: 'EYE INTENT', icon: Eye },
          { id: 'STATE_TREE', label: 'STATE', icon: Database },
          { id: 'DEBUG_TOOLS', label: 'OVERLAYS', icon: Sliders }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeDiagTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveDiagTab(tab.id as DiagTab)}
              className={`py-1.5 px-0.5 rounded flex flex-col items-center gap-1 text-[7.5px] font-bold tracking-wider transition-all ${
                isActive
                  ? 'bg-sky-500/25 border border-sky-400 text-sky-200 shadow-[0_0_10px_rgba(14,165,233,0.3)]'
                  : 'text-white/40 hover:text-white/80 hover:bg-white/5 border border-transparent'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-sky-300' : 'text-white/40'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        
        {/* 1. FPS & PERFORMANCE MONITOR */}
        {activeDiagTab === 'PERF_FPS' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Live FPS Display Banner */}
            <div className="p-3 bg-gradient-to-r from-sky-950/40 via-black/60 to-purple-950/40 border border-sky-500/30 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest">Frame Rate (FPS)</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-[28px] font-black text-white font-mono leading-none">{fps}</span>
                  <span className="text-[10px] font-mono text-sky-300 font-bold">/ {targetFpsLimit} TARGET</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[9px] font-mono text-right">
                <span className="text-white/40">Frame Time:</span>
                <span className="text-sky-300 font-bold">{frameTimeMs} ms</span>
                <span className="text-white/40">Min / Max:</span>
                <span className="text-emerald-300 font-bold">{minFps} / {maxFps}</span>
                <span className="text-white/40">Dropped:</span>
                <span className={droppedFrames > 0 ? "text-amber-400 font-bold" : "text-white/60"}>{droppedFrames}</span>
              </div>
            </div>

            {/* Real-time Visual FPS Histogram */}
            <div className="p-3 bg-black/60 border border-sky-500/20 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[9px] font-mono text-sky-400">
                <span>FPS HISTOGRAM (LAST 60 SEC)</span>
                <span>VSYNC_LOCKED</span>
              </div>

              <div className="flex items-end gap-[2px] h-20 w-full bg-black/80 rounded p-1 border border-white/5">
                {fpsHistory.map((val, idx) => {
                  const pct = Math.min(100, Math.max(10, (val / targetFpsLimit) * 100));
                  const isLow = val < 45;
                  return (
                    <div 
                      key={idx} 
                      className={`flex-1 rounded-t transition-all duration-300 ${
                        isLow ? 'bg-rose-500 shadow-[0_0_6px_red]' : val >= 90 ? 'bg-purple-400' : 'bg-sky-400'
                      }`}
                      style={{ height: `${pct}%` }}
                      title={`${val} FPS`}
                    />
                  );
                })}
              </div>

              <div className="flex justify-between text-[7.5px] font-mono text-white/30">
                <span>-60s</span>
                <span>-30s</span>
                <span>NOW</span>
              </div>
            </div>

            {/* Target FPS Controls & Stress Test */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2">
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">Target Display Refresh & Benchmarking</span>
              <div className="grid grid-cols-4 gap-1.5">
                {[60, 72, 90, 120].map(rate => (
                  <button
                    key={rate}
                    onClick={() => setTargetFpsLimit(rate)}
                    className={`py-1.5 rounded border text-[9px] font-bold transition-all ${
                      targetFpsLimit === rate 
                        ? 'bg-sky-500/30 border-sky-400 text-sky-200' 
                        : 'bg-black/40 border-white/10 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    {rate} HZ
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  let load = 0;
                  const start = Date.now();
                  const stressInterval = setInterval(() => {
                    for(let i=0; i<1000000; i++) load += Math.sqrt(i);
                    if (Date.now() - start > 4000) {
                      clearInterval(stressInterval);
                    }
                  }, 50);
                }}
                className="mt-1 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400 text-purple-200 font-bold text-[8.5px] rounded-lg uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <Zap size={12} className="text-purple-300 animate-pulse" /> RUN_4S_NEURAL_BENCHMARK_LOAD
              </button>
            </div>
          </div>
        )}

        {/* 2. TELEMETRY DATA STREAM */}
        {activeDiagTab === 'TELEMETRY' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between bg-black/60 p-2 border border-white/10 rounded-lg">
              <div className="flex gap-1">
                <button
                  onClick={() => setTelemetryMode('METRICS')}
                  className={`px-2 py-1 text-[8.5px] font-bold rounded border ${
                    telemetryMode === 'METRICS' ? 'bg-sky-500/30 border-sky-400 text-sky-200' : 'border-transparent text-white/40'
                  }`}
                >
                  VISUAL GAUGES
                </button>
                <button
                  onClick={() => setTelemetryMode('RAW_JSON')}
                  className={`px-2 py-1 text-[8.5px] font-bold rounded border ${
                    telemetryMode === 'RAW_JSON' ? 'bg-sky-500/30 border-sky-400 text-sky-200' : 'border-transparent text-white/40'
                  }`}
                >
                  RAW JSON
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTelemetryPaused(!isTelemetryPaused)}
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-sky-300 transition-colors"
                  title={isTelemetryPaused ? "Resume Feed" : "Pause Feed"}
                >
                  {isTelemetryPaused ? <Play size={12} /> : <Pause size={12} />}
                </button>
                <button
                  onClick={handleCopyTelemetry}
                  className="px-2 py-1 bg-sky-500/20 border border-sky-500/40 text-sky-300 rounded text-[8px] font-bold flex items-center gap-1 hover:bg-sky-500/30 transition-colors"
                >
                  {copied ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                  <span>{copied ? 'COPIED' : 'COPY'}</span>
                </button>
              </div>
            </div>

            {telemetryMode === 'METRICS' ? (
              <div className="flex flex-col gap-2.5">
                {/* Memory & WebGL */}
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Memory & WebGL Pipeline</span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white/40">Heap Usage:</span>
                      <span className="text-emerald-300 font-bold">{telemetryData.performance.memoryUsageMb} MB</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-1">
                      <span className="text-white/40">Optics Cam:</span>
                      <span className="text-sky-300 font-bold">{telemetryData.sensors.cameraResolution}</span>
                    </div>
                  </div>
                </div>

                {/* Spatial Gaze & Tracking */}
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Spatial Sensors & Gaze Vector</span>
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-[9px]">
                    <div className="p-1.5 bg-black/40 rounded border border-white/5">
                      <div className="text-[7.5px] text-white/40">GAZE X</div>
                      <div className="text-sky-300 font-bold">{telemetryData.sensors.eyeGazeVector.x}</div>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded border border-white/5">
                      <div className="text-[7.5px] text-white/40">GAZE Y</div>
                      <div className="text-sky-300 font-bold">{telemetryData.sensors.eyeGazeVector.y}</div>
                    </div>
                    <div className="p-1.5 bg-black/40 rounded border border-white/5">
                      <div className="text-[7.5px] text-white/40">GAZE Z</div>
                      <div className="text-sky-300 font-bold">{telemetryData.sensors.eyeGazeVector.z}m</div>
                    </div>
                  </div>
                </div>

                {/* Orientation & Hand Gestures */}
                <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
                  <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Headset Orientation & Gestures</span>
                  <div className="grid grid-cols-2 gap-2 text-[9.5px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-white/40">Pitch / Yaw:</span>
                      <span className="text-purple-300 font-bold">{telemetryData.sensors.spatialOrientation.pitchDeg}° / {telemetryData.sensors.spatialOrientation.yawDeg}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40">Pinch Confidence:</span>
                      <span className="text-emerald-300 font-bold">{(telemetryData.sensors.handController.leftPinchConfidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Raw JSON Stream */
              <pre className="p-3 bg-black/90 border border-sky-500/30 rounded-xl font-mono text-[9px] text-emerald-400 overflow-x-auto max-h-[300px] leading-relaxed">
                {JSON.stringify(telemetryData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* GAZE INTENT & PERSISTENCE PRELOAD INSPECTOR */}
        {activeDiagTab === 'GAZE_INTENT' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            {/* Real-time Target Intent Banner */}
            <div className="p-3 bg-gradient-to-r from-cyan-950/50 via-black/80 to-purple-950/50 border border-cyan-500/40 rounded-xl flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[8.5px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                  <Compass size={11} /> GAZE PREDICTIVE INTENT LOCK
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-[20px] font-black text-white font-mono uppercase">
                    {latestGazeIntent?.targetModuleId || 'NO_GAZE_TARGET'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span className={`px-2 py-0.5 rounded text-[8.5px] font-mono font-black uppercase border ${
                  latestGazeIntent?.isIntentLocked 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]' 
                    : latestGazeIntent?.isPreloadWarranted 
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400 animate-pulse'
                    : 'bg-white/5 text-white/40 border-white/10'
                }`}>
                  {latestGazeIntent?.isIntentLocked ? 'ZERO_LATENCY_LOCKED' : latestGazeIntent?.isPreloadWarranted ? 'PRELOADING_STATE' : 'SEARCHING'}
                </span>
                <span className="text-[9px] font-mono text-cyan-300 font-bold">
                  {latestGazeIntent?.probability || 0}% INTENT CONFIDENCE
                </span>
              </div>
            </div>

            {/* Dwell Metrics & Preload Statistics */}
            <div className="p-3 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-2">
              <div className="flex justify-between items-center text-[9px] font-bold text-sky-400 uppercase tracking-wider">
                <span>Module Dwell Affinity Matrix</span>
                <span className="text-emerald-400 font-mono text-[8px]">LATENCY SAVED: 0ms (INSTANT)</span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 font-mono text-[8.5px]">
                {Object.entries(gazeData.moduleStats).map(([modId, stat]) => (
                  <div key={modId} className="p-2 bg-black/60 rounded border border-sky-500/20 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold uppercase">{modId}</span>
                      <span className="text-cyan-300 font-bold">{stat.hoverCount} HOVERS</span>
                    </div>
                    <div className="flex justify-between text-white/50 text-[7.5px]">
                      <span>Avg Dwell: {stat.averageDwellMs}ms</span>
                      <span className="text-emerald-400">Preloaded: {stat.preloadsTriggered}x</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Persistent Gaze History Control */}
            <div className="p-2.5 bg-black/40 border border-white/10 rounded-xl flex justify-between items-center">
              <div className="flex flex-col text-[8px] font-mono text-white/60">
                <span>Gaze Persistence Schema: v{gazeData.version}</span>
                <span>Sessions Recorded: {gazeData.totalGazeSessions}</span>
              </div>
              <button
                onClick={() => {
                  gazePersistence.resetData();
                  setGazeData(gazePersistence.getData());
                }}
                className="px-2.5 py-1.5 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded text-[8.5px] font-bold hover:bg-rose-500/30 transition-colors flex items-center gap-1"
              >
                <RefreshCw size={10} /> RESET GAZE DATA
              </button>
            </div>
          </div>
        )}

        {/* 3. INTERNAL STATE TREE INSPECTOR */}
        {activeDiagTab === 'STATE_TREE' && (
          <div className="flex flex-col gap-2.5 animate-in fade-in duration-200">
            {/* Search Filter */}
            <div className="flex items-center gap-2 bg-black/60 border border-sky-500/20 rounded-lg px-2.5 py-1.5">
              <Search size={12} className="text-sky-400/60" />
              <input
                type="text"
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Search state key or value..."
                className="w-full bg-transparent text-[10px] text-white outline-none placeholder:text-white/30 font-mono"
              />
            </div>

            {/* Tree Inspector List */}
            <div className="p-2.5 bg-black/80 border border-sky-500/20 rounded-xl flex flex-col gap-2 font-mono text-[9.5px]">
              {[
                { key: 'activeTab', value: activeTab },
                { key: 'deviceType', value: deviceType },
                { key: 'isCamActive', value: String(isCamActive) },
                { key: 'detectedEntitiesCount', value: String(detectedEntitiesCount) },
                { key: 'systemMessage', value: systemMessage },
                { key: 'moduleCount', value: String(Object.keys(modulePositions).length) },
                { key: 'windowDimensions', value: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A' },
                { key: 'devicePixelRatio', value: typeof window !== 'undefined' ? String(window.devicePixelRatio) : '1.0' },
                { key: 'userAgent', value: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 45) + '...' : 'N/A' }
              ]
                .filter(item => !stateSearch || item.key.toLowerCase().includes(stateSearch.toLowerCase()) || item.value.toLowerCase().includes(stateSearch.toLowerCase()))
                .map(item => (
                  <div key={item.key} className="flex justify-between items-center py-1 border-b border-white/5 last:border-none">
                    <span className="text-sky-400 font-bold">{item.key}:</span>
                    <span className="text-emerald-300 truncate max-w-[200px]">{item.value}</span>
                  </div>
                ))}
            </div>

            {/* Module Coordinates List */}
            <div className="p-2.5 bg-white/5 border border-white/10 rounded-xl flex flex-col gap-1.5">
              <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">HUD Module Coordinates</span>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[8.5px]">
                {Object.entries(modulePositions).map(([modId, pos]) => (
                  <div key={modId} className="p-1.5 bg-black/40 rounded border border-white/5 flex justify-between">
                    <span className="text-white/60">{modId}:</span>
                    <span className="text-sky-300 font-bold">X:{Math.round(pos.x)}, Y:{Math.round(pos.y)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. DEBUG OVERLAYS & FAULT INJECTION */}
        {activeDiagTab === 'DEBUG_TOOLS' && (
          <div className="flex flex-col gap-3 animate-in fade-in duration-200">
            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">Visual Debug Overlays</span>
            
            <div className="flex flex-col gap-1.5 bg-black/50 border border-white/10 rounded-xl p-2.5">
              <div 
                onClick={() => setShowGazeVectorOverlay(!showGazeVectorOverlay)}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Crosshair size={14} className={showGazeVectorOverlay ? "text-cyan-300" : "text-white/30"} />
                  <span className="text-[11px] text-white font-medium">Show Gaze Vector Crosshair</span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${showGazeVectorOverlay ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400' : 'bg-white/10 text-white/30'}`}>
                  {showGazeVectorOverlay ? 'ON' : 'OFF'}
                </span>
              </div>

              <div 
                onClick={() => setShowModuleBoundsOverlay(!showModuleBoundsOverlay)}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Box size={14} className={showModuleBoundsOverlay ? "text-purple-300" : "text-white/30"} />
                  <span className="text-[11px] text-white font-medium">Highlight Spatial Module Bounds</span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${showModuleBoundsOverlay ? 'bg-purple-500/30 text-purple-200 border border-purple-400' : 'bg-white/10 text-white/30'}`}>
                  {showModuleBoundsOverlay ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Fault Injection & Stress Test</span>

            <div className="flex flex-col gap-1.5 bg-black/50 border border-amber-500/20 rounded-xl p-2.5">
              <div 
                onClick={() => setSimulatedThermalThrottling(!simulatedThermalThrottling)}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className={simulatedThermalThrottling ? "text-amber-400" : "text-white/30"} />
                  <span className="text-[11px] text-white font-medium">Simulate Thermal Throttling (78°C)</span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${simulatedThermalThrottling ? 'bg-amber-500/30 text-amber-200 border border-amber-400' : 'bg-white/10 text-white/30'}`}>
                  {simulatedThermalThrottling ? 'ACTIVE' : 'OFF'}
                </span>
              </div>

              <div 
                onClick={() => setSimulatedGazeDrift(!simulatedGazeDrift)}
                className="flex items-center justify-between py-1.5 px-2 hover:bg-white/5 rounded cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Eye size={14} className={simulatedGazeDrift ? "text-rose-400" : "text-white/30"} />
                  <span className="text-[11px] text-white font-medium">Inject Eye Tracking Noise Drift</span>
                </div>
                <span className={`text-[8px] font-bold px-2 py-0.5 rounded ${simulatedGazeDrift ? 'bg-rose-500/30 text-rose-200 border border-rose-400' : 'bg-white/10 text-white/30'}`}>
                  {simulatedGazeDrift ? 'INJECTED' : 'OFF'}
                </span>
              </div>
            </div>

            <span className="text-[9px] font-bold text-sky-400 uppercase tracking-wider">System Triggers</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onTriggerReboot}
                className="py-2 px-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-[9px] rounded-lg hover:bg-rose-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} />
                <span>TRIGGER REBOOT</span>
              </button>

              <button
                onClick={onClearStorage}
                className="py-2 px-3 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[9px] rounded-lg hover:bg-amber-500/30 transition-all flex items-center justify-center gap-1.5"
              >
                <Database size={12} />
                <span>RESET POSITIONS</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer System Bar */}
      <div className="mt-2 pt-2 border-t border-sky-500/20 flex justify-between items-center text-[8px] font-mono text-sky-400/60">
        <span>STATUS: OPENXR_ONLINE</span>
        <span>BUILD_2026.07.23</span>
      </div>
    </div>
  );
};

export default DeveloperDiagnostics;
