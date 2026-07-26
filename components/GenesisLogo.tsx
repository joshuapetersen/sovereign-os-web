
import React from 'react';

interface GenesisLogoProps {
  active?: boolean;
  scale?: number;
  overdrive?: boolean;
}

const GenesisLogo: React.FC<GenesisLogoProps> = ({ active = true, scale = 1, overdrive = false }) => {
  return (
    <div 
      className="flex items-center gap-4 select-none pointer-events-none transition-transform duration-700"
      style={{ transform: `scale(${scale})` }}
    >
      <div className="relative w-12 h-12 flex items-center justify-center">
        {/* Outer Rotating Ring */}
        <div className={`absolute inset-0 border-[0.5px] rounded-full transition-all duration-1000 ${
          overdrive ? 'border-rose-500/40 animate-[spin_2s_linear_infinite]' : 
          active ? 'border-sky-500/20 animate-[spin_8s_linear_infinite]' : 'border-white/5'
        }`}>
           <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full shadow-[0_0_12px_currentColor] ${
             overdrive ? 'bg-rose-500 text-rose-500' : 'bg-sky-400 text-sky-400'
           }`}></div>
        </div>
        
        {/* Hexagon Frame */}
        <svg viewBox="0 0 100 100" className={`w-9 h-9 transition-all duration-1000 ${
          overdrive ? 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]' :
          active ? 'text-sky-400 drop-shadow-[0_0_12px_rgba(14,165,233,0.5)]' : 'text-sky-900'
        }`}>
          <path 
            d="M50 5 L90 25 L90 75 L50 95 L10 75 L10 25 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5"
            className={active || overdrive ? 'animate-pulse' : ''}
          />
          <path 
            d="M50 25 L75 38 L75 62 L50 75 L25 62 L25 38 Z" 
            fill="currentColor" 
            fillOpacity={overdrive ? "0.2" : "0.1"}
            stroke="currentColor" 
            strokeWidth="0.5"
          />
          {/* Stylized G */}
          <path 
            d="M60 40 L40 40 L40 60 L60 60 L60 50 L50 50" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="5" 
            strokeLinecap="square"
            className="transition-all duration-500"
          />
        </svg>

        {/* Core Singularity */}
        <div className={`absolute w-1.5 h-1.5 rounded-full transition-all duration-500 ${
          overdrive ? 'bg-rose-500 animate-ping' : 
          active ? 'bg-sky-400 opacity-60' : 'bg-white/5'
        }`}></div>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-2">
           <span className="text-sm font-black tracking-[0.3em] text-white italic">GENESIS</span>
           <span className={`text-[10px] font-light tracking-[0.4em] transition-colors ${overdrive ? 'text-rose-400' : 'text-sky-400/60'}`}>PRIME</span>
        </div>
        <div className="flex items-center gap-1 overflow-hidden">
           <div className={`h-[0.5px] transition-all duration-1000 ${overdrive ? 'w-8 bg-rose-500/60' : 'w-4 bg-sky-500/40'}`}></div>
           <span className={`text-[6px] font-black tracking-[0.6em] uppercase whitespace-nowrap transition-colors ${overdrive ? 'text-rose-400/60' : 'text-sky-500/40'}`}>
             {overdrive ? 'OVERDRIVE_PROTOCOL' : 'Sovereign_Identity'}
           </span>
        </div>
      </div>
    </div>
  );
};

export default GenesisLogo;
