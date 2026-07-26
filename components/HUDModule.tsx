
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Minimize2, GripHorizontal, Pin, PinOff, X, Zap, Sun } from 'lucide-react';
import { AmbientColorState } from '../services/ambientColorService';

interface HUDModuleProps {
  id: string;
  title: string;
  initialPosition: { x: number; y: number };
  children: React.ReactNode;
  visible?: boolean;
  onPositionChange: (id: string, x: number, y: number) => void;
  exitSide?: 'left' | 'right' | 'bottom' | 'top';
  isFocused?: boolean;
  onFocus?: () => void;
  onClose?: () => void;
  ambientGlow?: AmbientColorState;
  isGhostMode?: boolean;
  isHighContrast?: boolean;
  handPosition?: { x: number; y: number } | null;
}

const HUDModule: React.FC<HUDModuleProps> = ({ 
  id, 
  title, 
  initialPosition, 
  children, 
  visible = true, 
  onPositionChange,
  isFocused = false,
  onFocus,
  onClose,
  ambientGlow,
  isGhostMode = false,
  isHighContrast = false,
  handPosition
}) => {
  const [pos, setPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isSliding, setIsSliding] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [floatY, setFloatY] = useState(0);
  const [isGazeRepelled, setIsGazeRepelled] = useState(false);
  const [proximityFactor, setProximityFactor] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  posRef.current = pos;

  const dragStart = useRef({ x: 0, y: 0 });
  const velocityRef = useRef({ vx: 0, vy: 0 });
  const lastPointerRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const inertiaRafRef = useRef<number | null>(null);
  const floatRafRef = useRef<number | null>(null);

  // Dynamic hand/gesture proximity calculation
  useEffect(() => {
    if (!handPosition || !containerRef.current || !visible || isMinimized) {
      setProximityFactor(0);
      return;
    }

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = handPosition.x - centerX;
    const dy = handPosition.y - centerY;
    const dist = Math.hypot(dx, dy);

    const outerDist = 320;
    const innerDist = 40;

    if (dist >= outerDist) {
      setProximityFactor(0);
    } else if (dist <= innerDist) {
      setProximityFactor(1);
    } else {
      const norm = (outerDist - dist) / (outerDist - innerDist);
      const smooth = norm * norm * (3 - 2 * norm);
      setProximityFactor(smooth);
    }
  }, [handPosition, pos, visible, isMinimized]);

  // --- CENTER GAZE CLEAR ZONE AVOIDANCE LOGIC ---
  // In XR/AR, the central field of view (foveal gaze zone) must remain unobstructed.
  // Modules in or entering this central region are automatically shifted to peripheral space.
  const applyGazeAvoidance = useCallback((targetPos: { x: number; y: number }, active: boolean) => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;

    const centerX = w / 2;
    const centerY = h / 2;

    // Primary central gaze clear zone (dead-zone for AR immersion)
    const gazeRadiusX = active ? 220 : 100;
    const gazeRadiusY = active ? 180 : 80;

    const gazeLeft = centerX - gazeRadiusX;
    const gazeRight = centerX + gazeRadiusX;
    const gazeTop = centerY - gazeRadiusY;
    const gazeBottom = centerY + gazeRadiusY;

    // Estimate module bounds
    const modWidth = active ? 320 : 20;
    const modHeight = active ? 280 : 20;

    const modLeft = targetPos.x;
    const modRight = targetPos.x + modWidth;
    const modTop = targetPos.y;
    const modBottom = targetPos.y + modHeight;

    // Check overlap with center gaze box
    const overlapsCenter = !(
      modRight < gazeLeft ||
      modLeft > gazeRight ||
      modBottom < gazeTop ||
      modTop > gazeBottom
    );

    if (!overlapsCenter) {
      return { pos: targetPos, repelled: false };
    }

    // Determine nearest peripheral displacement path (Left, Right, Top, or Bottom)
    const distLeft = Math.abs(modRight - gazeLeft);
    const distRight = Math.abs(gazeRight - modLeft);
    const distTop = Math.abs(modBottom - gazeTop);
    const distBottom = Math.abs(gazeBottom - modTop);

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    let newX = targetPos.x;
    let newY = targetPos.y;

    if (minDist === distLeft) {
      newX = gazeLeft - modWidth - 20;
    } else if (minDist === distRight) {
      newX = gazeRight + 20;
    } else if (minDist === distTop) {
      newY = gazeTop - modHeight - 20;
    } else {
      newY = gazeBottom + 20;
    }

    // Clamp strictly within display bounds
    const clampedX = Math.max(10, Math.min(w - 120, newX));
    const clampedY = Math.max(10, Math.min(h - 60, newY));

    return { pos: { x: clampedX, y: clampedY }, repelled: true };
  }, []);

  // Generate a unique phase offset for hover levitation based on id
  const phaseOffset = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
    }
    return Math.abs(hash % 100);
  }, [id]);

  // Sync with initialPosition prop when external state changes, and apply gaze clearance
  useEffect(() => {
    if (!isDragging && !isSliding && initialPosition) {
      const activeState = !isMinimized && (isHovered || isFocused || isLocked);
      const result = applyGazeAvoidance(initialPosition, activeState);
      setPos(result.pos);
      if (result.repelled) {
        setIsGazeRepelled(true);
        setTimeout(() => setIsGazeRepelled(false), 2000);
      }
    }
  }, [initialPosition, isDragging, isSliding, applyGazeAvoidance, isMinimized, isHovered, isFocused, isLocked]);

  // Auto-repel away from center gaze zone when module expands
  useEffect(() => {
    const active = !isMinimized && (isHovered || isFocused || isDragging || isSliding || isLocked);
    if (active && !isDragging) {
      const result = applyGazeAvoidance(posRef.current, true);
      if (result.repelled) {
        setPos(result.pos);
        setIsGazeRepelled(true);
        onPositionChange(id, result.pos.x, result.pos.y);
        setTimeout(() => setIsGazeRepelled(false), 2000);
      }
    }
  }, [isHovered, isFocused, isLocked, isMinimized, isDragging, isSliding, id, onPositionChange, applyGazeAvoidance]);

  // Floating hover animation loop when unlocked and static
  useEffect(() => {
    if (isLocked || isDragging || isSliding || !visible) {
      setFloatY(0);
      if (floatRafRef.current) cancelAnimationFrame(floatRafRef.current);
      return;
    }

    const animateFloat = () => {
      const time = performance.now() * 0.002 + phaseOffset;
      // Gentle sine-wave hovering offset (-4px to +4px)
      const offset = Math.sin(time) * 4;
      setFloatY(offset);
      floatRafRef.current = requestAnimationFrame(animateFloat);
    };

    floatRafRef.current = requestAnimationFrame(animateFloat);

    return () => {
      if (floatRafRef.current) cancelAnimationFrame(floatRafRef.current);
    };
  }, [isLocked, isDragging, isSliding, visible, phaseOffset]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onFocus?.();

    if (inertiaRafRef.current) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
    setIsSliding(false);
    setIsDragging(true);

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    dragStart.current = { x: clientX - pos.x, y: clientY - pos.y };
    lastPointerRef.current = { x: clientX, y: clientY, time: performance.now() };
    velocityRef.current = { vx: 0, vy: 0 };
  };

  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isDragging) return;

      const now = performance.now();
      if (lastPointerRef.current) {
        const dt = Math.max(1, now - lastPointerRef.current.time);
        const dx = clientX - lastPointerRef.current.x;
        const dy = clientY - lastPointerRef.current.y;

        const instVx = (dx / dt) * 16;
        const instVy = (dy / dt) * 16;

        velocityRef.current = {
          vx: velocityRef.current.vx * 0.3 + instVx * 0.7,
          vy: velocityRef.current.vy * 0.3 + instVy * 0.7,
        };
      }
      lastPointerRef.current = { x: clientX, y: clientY, time: now };

      const rawX = clientX - dragStart.current.x;
      const rawY = clientY - dragStart.current.y;
      const clampedX = Math.max(10, Math.min(window.innerWidth - 120, rawX));
      const clampedY = Math.max(10, Math.min(window.innerHeight - 60, rawY));
      setPos({ x: clampedX, y: clampedY });
    };

    const onMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) handleMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const endDrag = () => {
      if (!isDragging) return;
      setIsDragging(false);

      let { vx, vy } = velocityRef.current;
      const speed = Math.hypot(vx, vy);

      if (speed > 0.5) {
        setIsSliding(true);
        let currentX = posRef.current.x;
        let currentY = posRef.current.y;
        let lastInertiaTime = performance.now();

        const animateInertia = () => {
          const now = performance.now();
          const dt = Math.min(32, Math.max(1, now - lastInertiaTime));
          lastInertiaTime = now;

          // Velocity-based decay factor (exponential friction scaled to 60fps frame delta)
          const decay = Math.pow(0.90, dt / 16.66);
          vx *= decay;
          vy *= decay;

          currentX += vx * (dt / 16.66);
          currentY += vy * (dt / 16.66);

          const minX = 10;
          const maxX = window.innerWidth - 120;
          const minY = 10;
          const maxY = window.innerHeight - 60;

          // Elastic boundary rebound
          if (currentX < minX) {
            currentX = minX;
            vx = -vx * 0.35;
          } else if (currentX > maxX) {
            currentX = maxX;
            vx = -vx * 0.35;
          }

          if (currentY < minY) {
            currentY = minY;
            vy = -vy * 0.35;
          } else if (currentY > maxY) {
            currentY = maxY;
            vy = -vy * 0.35;
          }

          setPos({ x: currentX, y: currentY });

          if (Math.hypot(vx, vy) > 0.1) {
            inertiaRafRef.current = requestAnimationFrame(animateInertia);
          } else {
            setIsSliding(false);
            const active = !isMinimized && (isHovered || isFocused || isLocked);
            const result = applyGazeAvoidance({ x: currentX, y: currentY }, active);
            setPos(result.pos);
            if (result.repelled) {
              setIsGazeRepelled(true);
              setTimeout(() => setIsGazeRepelled(false), 2000);
            }
            onPositionChange(id, result.pos.x, result.pos.y);
          }
        };

        inertiaRafRef.current = requestAnimationFrame(animateInertia);
      } else {
        const active = !isMinimized && (isHovered || isFocused || isLocked);
        const result = applyGazeAvoidance(posRef.current, active);
        setPos(result.pos);
        if (result.repelled) {
          setIsGazeRepelled(true);
          setTimeout(() => setIsGazeRepelled(false), 2000);
        }
        onPositionChange(id, result.pos.x, result.pos.y);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', endDrag);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', endDrag);
    }

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', endDrag);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', endDrag);
    };
  }, [isDragging, id, onPositionChange]);

  if (!visible) return null;

  // Active state: expands when hovered, dragged, sliding, or pinned open. Collapses/disappears into icon pill when unhovered.
  const isActive = !isMinimized && (isHovered || isDragging || isSliding || isLocked || proximityFactor > 0.05);

  // Geometric scale boost as hand approaches
  const effectiveScale = (isDragging ? 1.02 : 1) + proximityFactor * 0.12;

  return (
    <div 
      ref={containerRef}
      style={{
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        transform: `translateY(${floatY}px) scale(${effectiveScale})`,
        transformOrigin: 'top left',
        zIndex: isDragging || isSliding ? 20000 : (isFocused ? 10000 : 5000),
        transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease-out',
      }} 
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => onFocus?.()}
      onClick={(e) => { e.stopPropagation(); onFocus?.(); }}
      className="pointer-events-auto group select-none"
    >
      {/* --- INACTIVE SPATIAL TARGET (No floating pill/card blocking XR vision) --- */}
      {!isActive && (
        <div 
          onMouseDown={startDrag}
          onTouchStart={startDrag}
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(false);
            setIsHovered(true);
            onFocus?.();
          }}
          className="cursor-pointer w-4 h-4 flex items-center justify-center rounded-full transition-all group/node"
          title={`Hover or click to expand ${title}`}
        >
          {/* Micro dot - zero obscuration in XR pass-through */}
          <div 
            style={ambientGlow ? { backgroundColor: ambientGlow.glowTextCss, boxShadow: `0 0 8px ${ambientGlow.glowBorderCss}` } : undefined}
            className="w-1.5 h-1.5 rounded-full bg-sky-400/40 group-hover/node:bg-sky-400 group-hover/node:scale-150 transition-all shadow-[0_0_6px_rgba(14,165,233,0.5)]" 
          />
        </div>
      )}

      {/* --- EXPANDED WINDOW (Pops out when hovered or active) --- */}
      {isActive && (
        <div 
          style={isGhostMode ? {
            boxShadow: '0 0 15px rgba(255, 255, 255, 0.08)',
            borderColor: 'rgba(255, 255, 255, 0.35)'
          } : {
            boxShadow: ambientGlow 
              ? ambientGlow.glowShadowCss 
              : `0 0 ${15 + proximityFactor * 25}px rgba(56, 189, 248, ${0.25 + proximityFactor * 0.45})`,
            borderColor: ambientGlow 
              ? ambientGlow.glowBorderCss 
              : `rgba(56, 189, 248, ${0.3 + proximityFactor * 0.5})`
          }}
          className={`transition-all duration-300 ease-out origin-top-left rounded-xl overflow-hidden flex flex-col ${
            isHighContrast
              ? 'bg-black/98 border-2 border-amber-300/80 shadow-[0_0_25px_rgba(251,191,36,0.35)] contrast-125'
              : isGhostMode 
              ? 'bg-black/95 border border-white/30 saturate-0 contrast-125' 
              : 'bg-black/90 backdrop-blur-md border border-sky-500/30'
          }`}
        >
          
          {/* Header / Drag Handle */}
          <div 
            onMouseDown={startDrag}
            onTouchStart={startDrag}
            className={`flex items-center justify-between px-3 py-2 border-b cursor-grab active:cursor-grabbing select-none transition-colors ${
              isHighContrast
                ? 'bg-amber-400/20 border-amber-300/40 hover:bg-amber-400/30'
                : isGhostMode 
                ? 'bg-white/10 border-white/20 hover:bg-white/15' 
                : 'bg-gradient-to-r from-sky-500/20 via-sky-500/10 to-transparent border-sky-500/20 hover:bg-sky-500/15'
            }`}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal size={14} className={isHighContrast ? "text-amber-300" : isGhostMode ? "text-white/60" : "text-sky-400/70"} />
              <div className={`w-1.5 h-3 rounded-full transition-colors ${
                isHighContrast ? 'bg-amber-300 shadow-[0_0_8px_gold]' : isGhostMode ? 'bg-white border border-white/80' : isDragging ? 'bg-amber-400' : isSliding ? 'bg-emerald-400' : 'bg-sky-400 shadow-[0_0_8px_cyan]'
              }`} />
              <span className={`text-[10px] font-black tracking-[0.2em] uppercase drop-shadow-md ${isHighContrast ? 'text-amber-200' : isGhostMode ? 'text-white' : 'text-white'}`}>
                {title}
              </span>
              {isHighContrast && (
                <span className="px-1.5 py-0.5 bg-amber-400 text-black rounded text-[7px] font-mono font-black uppercase tracking-widest flex items-center gap-1 shadow-[0_0_8px_gold] animate-pulse">
                  <Sun size={9} className="text-black" />
                  <span>SUN BOOST</span>
                </span>
              )}
              {isGhostMode && !isHighContrast && (
                <span className="px-1.5 py-0.5 bg-white/10 border border-white/30 rounded text-[7px] font-mono text-white/80 uppercase tracking-widest font-bold">
                  GHOST
                </span>
              )}
              {proximityFactor > 0.12 && (
                <span className="px-1.5 py-0.5 bg-cyan-500/20 border border-cyan-400/60 rounded text-[7px] font-mono text-cyan-200 uppercase tracking-widest font-bold flex items-center gap-1 shadow-[0_0_10px_cyan] animate-pulse">
                  <Zap size={9} className="text-cyan-300" />
                  <span>+{Math.round(proximityFactor * 18)}% DENSITY</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Lock/Pin toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLocked(prev => !prev);
                }}
                className={`p-1 rounded transition-colors ${
                  isLocked 
                    ? 'text-amber-400 bg-amber-500/20 border border-amber-500/40' 
                    : 'text-white/40 hover:text-sky-300 hover:bg-sky-500/20'
                }`}
                title={isLocked ? "Window Pinned (Stays Open)" : "Window Floating (Auto-collapse on un-hover)"}
              >
                {isLocked ? <Pin size={11} className="fill-amber-400" /> : <PinOff size={11} />}
              </button>

              {/* Minimize button (collapses to icon pill at position) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                className="p-1 text-white/40 hover:text-amber-300 hover:bg-amber-500/20 rounded transition-colors"
                title="Minimize window to current position"
              >
                <Minimize2 size={11} />
              </button>

              {/* Close / Dismiss */}
              {onClose && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onClose(); }}
                  className="p-1 text-white/40 hover:text-rose-400 hover:bg-rose-500/20 rounded transition-colors"
                  title="Close / Dismiss Module"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          {/* Content Body with Dynamic Readability & Content Density Boost */}
          <div 
            style={{
              fontSize: `${100 + proximityFactor * 16}%`,
              lineHeight: 1.25 + proximityFactor * 0.2,
              letterSpacing: proximityFactor > 0.2 ? '0.015em' : undefined,
              fontWeight: isHighContrast ? 700 : undefined,
              WebkitTextStroke: isHighContrast ? '0.2px rgba(255, 255, 255, 0.75)' : undefined,
              textShadow: isHighContrast ? '0 1px 3px rgba(0,0,0,0.98), 0 0 2px rgba(255,255,255,0.4)' : undefined,
              transition: 'all 0.25s ease-out'
            }}
            className={`p-3 relative z-10 overflow-auto max-h-[calc(100vh-120px)] transition-all ${
              isHighContrast 
                ? 'bg-black/98 text-white font-bold [text-rendering:optimizeLegibility]' 
                : isGhostMode 
                ? 'saturate-0 contrast-125 opacity-80 filter grayscale' 
                : ''
            }`}
          >
            {children}
          </div>

          {/* Minimal Footer */}
          <div className="h-4.5 bg-sky-500/5 border-t border-sky-500/10 flex items-center justify-between px-3 select-none">
            <div className="flex gap-1.5 items-center">
              <div className={`w-1 h-1 rounded-full ${
                isGazeRepelled 
                  ? 'bg-cyan-300 animate-ping' 
                  : isDragging 
                  ? 'bg-amber-400 animate-ping' 
                  : isSliding 
                  ? 'bg-emerald-400 animate-bounce' 
                  : proximityFactor > 0.15 
                  ? 'bg-cyan-300 animate-pulse shadow-[0_0_8px_cyan]' 
                  : 'bg-sky-400 animate-pulse'
              }`} />
              <span className={`text-[6px] font-mono uppercase tracking-wider ${
                isGazeRepelled ? 'text-cyan-300 font-bold' : proximityFactor > 0.15 ? 'text-cyan-300 font-bold' : 'text-sky-400/60'
              }`}>
                {isGazeRepelled 
                  ? 'FOVEAL_GAZE_CLEAR' 
                  : isDragging 
                  ? 'KINETIC_DRAG' 
                  : isSliding 
                  ? 'INERTIA_SLIDE' 
                  : proximityFactor > 0.15 
                  ? `GESTURE_PROXIMITY_ACTIVE (+${Math.round(proximityFactor * 100)}%)` 
                  : isLocked 
                  ? 'PINNED_OPEN' 
                  : 'HOVER_ACTIVE'}
              </span>
            </div>
            <span className="text-[6px] font-mono text-sky-500/40 uppercase tracking-widest">
              ID_{id.toUpperCase().slice(0, 4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HUDModule;

