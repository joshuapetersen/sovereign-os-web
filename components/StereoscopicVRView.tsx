import React, { useState } from 'react';
import { Eye, X, Zap, Sliders, Sparkles, Plus, Minus, Maximize2, ShieldCheck } from 'lucide-react';

interface StereoscopicVRViewProps {
  isStereoscopic: boolean;
  onToggleStereo?: () => void;
  children: React.ReactNode;
}

export const StereoscopicVRView: React.FC<StereoscopicVRViewProps> = ({
  isStereoscopic,
  onToggleStereo,
  children,
}) => {
  const [ipdMm, setIpdMm] = useState<number>(63.5);
  const [distortionLevel, setDistortionLevel] = useState<number>(0.85); // 0.5 to 1.0
  const [showOpticMesh, setShowOpticMesh] = useState<boolean>(true);

  if (!isStereoscopic) {
    return <>{children}</>;
  }

  // Calculate pixel displacement based on IPD (standard 63.5mm center point)
  const ipdOffsetPx = (ipdMm - 63.5) * 0.8;

  return (
    <div className="fixed inset-0 z-[8000] bg-black font-mono overflow-hidden select-none flex flex-col">
      {/* VR HEADSET TOP TELEMETRY & CONTROL BAR */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[10000] flex items-center gap-3 px-4 py-1.5 bg-black/90 border border-cyan-400/60 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(6,182,212,0.5)]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <Eye size={15} className="text-cyan-300 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            STEREOSCOPIC_SBS_VR
          </span>
        </div>

        <div className="h-3 w-[1px] bg-cyan-500/30" />

        {/* IPD CONTROL */}
        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/10 text-[9px] font-bold text-cyan-300">
          <span className="text-white/50 text-[8px]">IPD:</span>
          <span>{ipdMm.toFixed(1)}mm</span>
          <div className="flex gap-0.5 ml-1">
            <button 
              onClick={() => setIpdMm(prev => Math.max(55, prev - 0.5))}
              className="w-4 h-4 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 flex items-center justify-center transition-colors"
              title="Decrease IPD"
            >
              <Minus size={10} />
            </button>
            <button 
              onClick={() => setIpdMm(prev => Math.min(75, prev + 0.5))}
              className="w-4 h-4 rounded bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-200 flex items-center justify-center transition-colors"
              title="Increase IPD"
            >
              <Plus size={10} />
            </button>
          </div>
        </div>

        {/* DISTORTION WARP LEVEL */}
        <button
          onClick={() => setDistortionLevel(prev => (prev >= 1.0 ? 0.5 : prev + 0.15))}
          className="flex items-center gap-1 bg-cyan-500/15 border border-cyan-400/30 hover:bg-cyan-500/30 text-cyan-300 text-[9px] font-bold px-2 py-0.5 rounded-full transition-all"
          title="Adjust Lens Warp Distortion Correction"
        >
          <Zap size={10} className="text-amber-300" />
          <span>WARP: {Math.round(distortionLevel * 100)}%</span>
        </button>

        {/* OPTIC MESH TOGGLE */}
        <button
          onClick={() => setShowOpticMesh(!showOpticMesh)}
          className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full border transition-all ${
            showOpticMesh 
              ? 'bg-purple-500/20 border-purple-400/50 text-purple-200 shadow-[0_0_10px_purple]' 
              : 'bg-white/5 border-white/10 text-white/40'
          }`}
          title="Toggle Optical Calibration Grid Overlay"
        >
          <Sparkles size={10} />
          <span>OPTIC_GRID</span>
        </button>

        <div className="h-3 w-[1px] bg-cyan-500/30" />

        {/* EXIT SBS VR BUTTON */}
        <button 
          onClick={onToggleStereo}
          className="px-2.5 py-1 bg-red-500/20 border border-red-400/60 hover:bg-red-500/40 text-red-200 text-[9px] font-black uppercase tracking-wider rounded-full transition-all flex items-center gap-1 shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        >
          <X size={12} />
          <span>EXIT VR</span>
        </button>
      </div>

      {/* SVG FILTER DEFINITIONS FOR BARREL LENS DISTORTION & CHROMATIC ABERRATION */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="vrBarrelDistortionLeft" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={distortionLevel * 8} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="vrBarrelDistortionRight" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.005" numOctaves="1" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={distortionLevel * 8} xChannelSelector="G" yChannelSelector="R" />
          </filter>
        </defs>
      </svg>

      {/* DUAL EYE SIDE-BY-SIDE VIEWPORT GRID */}
      <div className="relative w-full h-full flex overflow-hidden bg-black">
        {/* LEFT EYE VIEWPORT */}
        <div className="relative w-1/2 h-full border-r-2 border-cyan-500/40 overflow-hidden flex items-center justify-center bg-black">
          {/* LEFT EYE RENDER FRAME WITH BINOCULAR PARALLAX SHIFT & BARREL SCALE */}
          <div 
            style={{
              transform: `scale(${0.95 - (1.0 - distortionLevel) * 0.05}) translate(${ipdOffsetPx}px, 0px) perspective(900px) rotateY(0.8deg)`,
              transformOrigin: 'center center',
              filter: `contrast(1.1) saturate(1.15) drop-shadow(0 0 15px rgba(56, 189, 248, 0.2))`,
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full h-full relative flex items-center justify-center"
          >
            {children}
          </div>

          {/* LEFT EYE LENS DISTORTION SHADER OVERLAY */}
          <VRLensOverlay 
            eye="LEFT" 
            ipdMm={ipdMm} 
            distortionLevel={distortionLevel} 
            showOpticMesh={showOpticMesh} 
          />
        </div>

        {/* RIGHT EYE VIEWPORT */}
        <div className="relative w-1/2 h-full overflow-hidden flex items-center justify-center bg-black">
          {/* RIGHT EYE RENDER FRAME WITH BINOCULAR PARALLAX SHIFT & BARREL SCALE */}
          <div 
            style={{
              transform: `scale(${0.95 - (1.0 - distortionLevel) * 0.05}) translate(${-ipdOffsetPx}px, 0px) perspective(900px) rotateY(-0.8deg)`,
              transformOrigin: 'center center',
              filter: `contrast(1.1) saturate(1.15) drop-shadow(0 0 15px rgba(56, 189, 248, 0.2))`,
              transition: 'transform 0.15s ease-out'
            }}
            className="w-full h-full relative flex items-center justify-center"
          >
            {children}
          </div>

          {/* RIGHT EYE LENS DISTORTION SHADER OVERLAY */}
          <VRLensOverlay 
            eye="RIGHT" 
            ipdMm={ipdMm} 
            distortionLevel={distortionLevel} 
            showOpticMesh={showOpticMesh} 
          />
        </div>
      </div>
    </div>
  );
};

// --- VR LENS DISTORTION CORRECTION SHADER OVERLAY ---
interface VRLensOverlayProps {
  eye: 'LEFT' | 'RIGHT';
  ipdMm: number;
  distortionLevel: number;
  showOpticMesh: boolean;
}

const VRLensOverlay: React.FC<VRLensOverlayProps> = ({
  eye,
  ipdMm,
  distortionLevel,
  showOpticMesh
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-[9900] flex flex-col justify-between p-4 overflow-hidden">
      {/* CIRCULAR OPTICAL FRESNEL LENS VIGNETTE MASK */}
      <div 
        style={{
          background: `radial-gradient(circle at 50% 50%, transparent 58%, rgba(0,0,0,0.4) 75%, rgba(0,0,0,0.85) 88%, rgba(0,0,0,0.99) 100%)`,
          boxShadow: eye === 'LEFT' 
            ? 'inset 0 0 50px rgba(56, 189, 248, 0.15), inset 0 0 100px rgba(168, 85, 247, 0.1)' 
            : 'inset 0 0 50px rgba(56, 189, 248, 0.15), inset 0 0 100px rgba(168, 85, 247, 0.1)'
        }}
        className="absolute inset-0 rounded-full border border-cyan-500/20 opacity-90 scale-105"
      />

      {/* CHROMATIC ABERRATION CHROMATIC FRINGE BORDERS */}
      <div 
        style={{
          boxShadow: eye === 'LEFT'
            ? 'inset 2px 0 12px rgba(239, 68, 68, 0.35), inset -2px 0 12px rgba(6, 182, 212, 0.35)'
            : 'inset -2px 0 12px rgba(239, 68, 68, 0.35), inset 2px 0 12px rgba(6, 182, 212, 0.35)'
        }}
        className="absolute inset-0 rounded-full border border-white/10 opacity-70"
      />

      {/* OPTICAL CALIBRATION GRID & BARREL DISTORTION LINES */}
      {showOpticMesh && (
        <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none">
          {/* Concentric Barrel Distortion Rings */}
          <circle cx="50%" cy="50%" r="20%" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="50%" cy="50%" r="35%" fill="none" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="1" strokeDasharray="6 6" />
          <circle cx="50%" cy="50%" r="48%" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" />

          {/* Curved Optic Grid Mesh Lines */}
          <path d="M 0 50% Q 50% 46% 100% 50%" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
          <path d="M 0 50% Q 50% 54% 100% 50%" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
          <path d="M 50% 0 Q 46% 50% 50% 100%" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
          <path d="M 50% 0 Q 54% 50% 50% 100%" fill="none" stroke="rgba(56, 189, 248, 0.25)" strokeWidth="1" />
        </svg>
      )}

      {/* CENTRAL OPTICAL AXIS FOCAL CROSSHAIR RETICLE */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none opacity-40">
        <div className="w-6 h-[1px] bg-cyan-400" />
        <div className="h-6 w-[1px] bg-cyan-400 -ml-3" />
        <div className="w-2 h-2 rounded-full border border-cyan-300 -ml-1 animate-ping" />
      </div>

      {/* TOP OPTIC HEADS-UP OVERLAY TEXT */}
      <div className="relative z-10 flex justify-between items-center text-[8px] font-bold tracking-widest text-cyan-400/80 uppercase">
        <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>{eye}_OPTICAL_LENS</span>
        </div>
        <div className="text-[7.5px] font-mono text-purple-300/80 bg-black/60 px-1.5 py-0.5 rounded border border-purple-500/30">
          K1: -{(distortionLevel * 0.22).toFixed(2)} | K2: +0.05
        </div>
      </div>

      {/* BOTTOM OPTIC STATUS BAR */}
      <div className="relative z-10 flex justify-between items-end text-[7.5px] font-mono text-cyan-300/70">
        <div className="flex flex-col bg-black/70 p-1 rounded border border-white/10">
          <span>FOV: 120° DUAL_BINOCULAR</span>
          <span>IPD_AXIS: {(ipdMm / 2).toFixed(2)}mm</span>
        </div>
        <div className="flex items-center gap-1 bg-black/70 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300">
          <ShieldCheck size={9} />
          <span>LENS_WARP_CORRECTION_OK</span>
        </div>
      </div>
    </div>
  );
};
