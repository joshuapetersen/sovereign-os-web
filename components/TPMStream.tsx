
import React, { useMemo } from 'react';
import { Activity, Wifi, Zap, Cpu } from 'lucide-react';

interface TPMStreamProps {
  stats: { bpm: number; latency: number; sync: number };
  stability: 'STABLE' | 'DEGRADED' | 'OVERLOAD';
}

const TPMStream: React.FC<TPMStreamProps> = ({ stats, stability }) => {
  // Generate a random-ish wave for the telemetry aesthetic
  const waveform = useMemo(() => Array.from({ length: 20 }, () => Math.random() * 100), [stats.bpm]);

  return (
    <div className="fixed bottom-4 right-4 z-[9000] flex flex-col items-end group pointer-events-auto">
      {/* The Ghost Ribbon: Invisible (Opacity 0) until hovered */}
      <div className="flex items-center gap-4 transition-all duration-1000 opacity-0 group-hover:opacity-100 group-active:scale-95">
        
        {/* Biometric Waveform */}
        <div className="flex items-end gap-[1px] h-4 mb-1">
          {waveform.map((h, i) => (
            <div 
              key={i} 
              className={`w-[1px] transition-all duration-500 ${stability === 'STABLE' ? 'bg-cyan-400' : 'bg-rose-500'}`}
              style={{ height: `${h}%`, opacity: 0.2 + (i / 20) }}
            />
          ))}
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-black tracking-[0.2em] text-white/40 group-hover:text-cyan-400">TPM_V6.1_STREAM</span>
            <Activity size={10} className={stability === 'STABLE' ? 'text-cyan-400' : 'text-rose-500 animate-pulse'} />
          </div>
          <div className="h-[1px] w-24 bg-gradient-to-l from-white/20 to-transparent mt-0.5 group-hover:from-cyan-400"></div>
        </div>
      </div>

      {/* Expanded Data Overlay: Shows on hover */}
      <div className="mt-2 grid grid-cols-3 gap-4 overflow-hidden transition-all duration-700 max-h-0 group-hover:max-h-20 opacity-0 group-hover:opacity-100">
        <div className="flex flex-col items-end">
          <span className="text-[5px] text-white/30 uppercase">Neural_BPM</span>
          <span className={`text-[10px] font-bold ${stats.bpm > 100 ? 'text-rose-500' : 'text-cyan-400'}`}>{stats.bpm}</span>
        </div>
        <div className="flex flex-col items-end border-x border-white/5 px-4">
          <span className="text-[5px] text-white/30 uppercase">RCS_Sync</span>
          <span className="text-[10px] font-bold text-sky-400">{stats.sync}%</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[5px] text-white/30 uppercase">Net_Lat</span>
          <span className="text-[10px] font-bold text-purple-400">{stats.latency}MS</span>
        </div>
      </div>
      
      {/* Subtle Bottom Interaction Node - Visible as a tiny dot to indicate presence? User said 'nothing', so hide it too. */}
      {/* Keeping empty div for structure if needed, or just removing visible styles */}
      <div className="mt-1 w-32 h-[2px] bg-transparent relative overflow-hidden rounded-full"></div>
    </div>
  );
};

export default TPMStream;
