
import React, { useEffect, useState } from 'react';

interface BootSequenceProps {
  onComplete: () => void;
  phase: number; // Controlled by App.tsx now for sync
  status: string; // Real-time diagnostic message
}

const BootSequence: React.FC<BootSequenceProps> = ({ onComplete, phase, status }) => {
  return (
    <div className={`fixed inset-0 z-[50] bg-black flex items-center justify-center overflow-hidden transition-opacity duration-1000 ${phase >= 4 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* Background Matrix / Neural Fog */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.15)_0%,transparent_60%)]"></div>
      
      {/* Binary Stream Background */}
      <div className={`absolute inset-0 z-0 w-full h-full transition-opacity duration-1000 ${phase >= 2 ? 'opacity-10' : 'opacity-0'}`}>
           <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30 animate-pulse"></div>
           <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-500/30 animate-[scan_4s_linear_infinite]"></div>
      </div>

      {/* Boot Status Text - Centered under where the Logo will be */}
      <div className={`absolute bottom-1/4 flex flex-col items-center gap-3 transition-all duration-500 ${phase >= 4 ? 'opacity-0 translate-y-10' : 'opacity-100 translate-y-0'}`}>
           <div className="flex gap-4 text-[8px] font-black tracking-[0.5em] text-sky-400 font-mono">
              <span className={phase >= 1 ? 'text-white' : 'opacity-30'}>[ SINGULARITY ]</span>
              <span className={phase >= 2 ? 'text-white' : 'opacity-30'}>[ SDNA_LINK ]</span>
              <span className={phase >= 3 ? 'text-white' : 'opacity-30'}>[ SOVEREIGN_ROOT ]</span>
           </div>
           
           {/* Real-time Status Output */}
           <div className="h-4 flex items-center justify-center">
               <span className="text-[10px] font-mono text-sky-300 uppercase animate-pulse">
                   &gt; {status}
               </span>
           </div>

           {/* Progress Bar */}
           <div className="w-64 h-[2px] bg-white/5 relative overflow-hidden">
              <div 
                className="absolute inset-0 bg-sky-500 transition-all duration-300 ease-out" 
                style={{ width: `${(phase / 4) * 100}%` }}
              ></div>
           </div>
      </div>
    </div>
  );
};

export default BootSequence;
