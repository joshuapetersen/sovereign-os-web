
import React, { useState, useRef, useEffect, useMemo } from 'react';

interface HUDModuleProps {
  id: string;
  title: string;
  initialPosition: { x: number; y: number };
  children: React.ReactNode;
  visible?: boolean;
  onPositionChange: (id: string, x: number, y: number) => void;
  sensitivity?: number;
}

const HUDModule: React.FC<HUDModuleProps> = ({ 
  id, 
  title, 
  initialPosition, 
  children, 
  visible = true, 
  onPositionChange,
  sensitivity = 0.5
}) => {
  const [pos, setPos] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [manualLockUntil, setManualLockUntil] = useState(0);
  
  // Kinetic Refs (Raw Tracking)
  const targetPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const lerpPos = useRef({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const rafRef = useRef<number | null>(null);
  
  const dragStart = useRef({ x: 0, y: 0 });
  const moduleRef = useRef<HTMLDivElement>(null);

  // Sync state to ref for high-freq access
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('pointermove', handleMove);
    return () => window.removeEventListener('pointermove', handleMove);
  }, []);

  // Optimized Kinetic Loop (Runs independent of React state)
  useEffect(() => {
    const updateKinetic = () => {
      // Damping factor: higher sensitivity = faster response
      const damping = 0.04 + (sensitivity * 0.12);
      
      lerpPos.current.x += (targetPos.current.x - lerpPos.current.x) * damping;
      lerpPos.current.y += (targetPos.current.y - lerpPos.current.y) * damping;
      
      if (moduleRef.current && !isDragging) {
        const perspectiveX = ((lerpPos.current.x / window.innerWidth) - 0.5) * 50 * sensitivity;
        const perspectiveY = ((lerpPos.current.y / window.innerHeight) - 0.5) * 50 * sensitivity;
        
        // Calculate dynamic properties
        const rect = moduleRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const dist = Math.sqrt(Math.pow(targetPos.current.x - centerX, 2) + Math.pow(targetPos.current.y - centerY, 2));
        
        const isManuallyLocked = Date.now() < manualLockUntil;
        const isActive = isFocused || dist < 220 || isManuallyLocked;
        
        const screenW = window.innerWidth;
        const isLeft = pos.x < screenW / 2;
        
        // Calculate display values
        const dX = isActive ? pos.x : (isLeft ? -290 : screenW - 30);
        const dY = pos.y;
        const scale = isActive ? 1 : 0.7;
        const yaw = isActive ? 0 : (isLeft ? 55 : -55);
        const opacity = isActive ? 1 : 0.2;
        const blur = isActive ? 0 : 8;

        // Direct DOM update (Fast path)
        moduleRef.current.style.transform = `translate3d(${dX}px, ${dY}px, 0) scale(${scale}) rotateY(${yaw + perspectiveX}deg) rotateX(${-perspectiveY}deg)`;
        moduleRef.current.style.opacity = opacity.toString();
        moduleRef.current.style.filter = `blur(${blur}px)`;
      }
      
      rafRef.current = requestAnimationFrame(updateKinetic);
    };

    rafRef.current = requestAnimationFrame(updateKinetic);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [sensitivity, isDragging, isFocused, manualLockUntil, pos.x, pos.y]);

  useEffect(() => { setPos(initialPosition); }, [initialPosition]);

  if (!visible) return null;

  const startDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setIsFocused(true);
    dragStart.current = { x: clientX - pos.x, y: clientY - pos.y };
  };

  const onDrag = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const newX = clientX - dragStart.current.x;
    const newY = clientY - dragStart.current.y;
    setPos({ x: newX, y: newY });
  };

  const endDrag = () => {
    if (isDragging) {
      onPositionChange(id, pos.x, pos.y);
      setManualLockUntil(Date.now() + 15000);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent) => onDrag(e.clientX, e.clientY);
    const handleUp = () => endDrag();
    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  return (
    <div 
      ref={moduleRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: isDragging ? 2000 : 100,
        willChange: 'transform, opacity, filter',
        pointerEvents: 'auto',
        transition: isDragging ? 'none' : 'opacity 0.5s ease, filter 0.5s ease, scale 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        perspective: '3000px',
      }} 
      onMouseEnter={() => setIsFocused(true)}
      onMouseLeave={() => setIsFocused(false)}
      className="hud-element select-none min-w-[320px]"
    >
      <div 
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        className="flex items-center gap-2 mb-1 cursor-grab active:cursor-grabbing group"
      >
        <div className="h-[1px] bg-sky-400 w-24"></div>
        <span className="text-[7px] font-black tracking-[0.8em] uppercase text-sky-400">
          {title}
        </span>
      </div>
      
      <div className="bg-black/90 backdrop-blur-3xl p-6 border border-sky-400/60 shadow-[0_0_80px_rgba(14,165,233,0.1)]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px]"></div>
        <div className="relative">
          {children}
        </div>
        <div className="mt-4 flex justify-between items-center text-[5px] opacity-30 font-mono tracking-widest uppercase">
           <span>HEX::{id.toUpperCase()}</span>
           <span>SYNC::SECURE</span>
        </div>
      </div>
    </div>
  );
};

export default HUDModule;
