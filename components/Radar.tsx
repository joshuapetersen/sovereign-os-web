
import React, { useState } from 'react';
import { DetectedEntity } from '../types';
import { User, Car, Cpu, AlertTriangle, MapPin, Crosshair, X, Radio, Shield, ExternalLink } from 'lucide-react';

interface RadarProps {
  entities: DetectedEntity[];
  onSelectEntity?: (entity: DetectedEntity) => void;
}

const Radar: React.FC<RadarProps> = ({ entities, onSelectEntity }) => {
  const [selectedEntity, setSelectedEntity] = useState<DetectedEntity | null>(null);
  const [rangeZoom, setRangeZoom] = useState<'100M' | '500M' | '1KM'>('500M');
  const [pingedId, setPingedId] = useState<string | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'HUMAN': return User;
      case 'VEHICLE': return Car;
      case 'IOT': return Cpu;
      case 'HAZARD': return AlertTriangle;
      case 'PLACE': return MapPin;
      default: return Cpu;
    }
  };

  const handleEntityClick = (entity: DetectedEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEntity(entity);
    setPingedId(entity.id);
    if (onSelectEntity) onSelectEntity(entity);
    setTimeout(() => setPingedId(null), 2000);
  };

  // Calculate radial distance from center (50, 50)
  const getDistanceMeters = (pos: { x: number; y: number }) => {
    const dx = pos.x - 50;
    const dy = pos.y - 50;
    const distPct = Math.sqrt(dx * dx + dy * dy);
    const maxMeters = rangeZoom === '100M' ? 100 : rangeZoom === '500M' ? 500 : 1000;
    return Math.round((distPct / 50) * maxMeters);
  };

  return (
    <div className="relative aspect-square w-72 bg-transparent rounded-full select-none" onClick={() => setSelectedEntity(null)}>
      {/* Radar Sweep Effect - Subtle and transparent */}
      <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent origin-center animate-[spin_4s_linear_infinite]" style={{ clipPath: 'polygon(50% 50%, 100% 0, 100% 100%)' }}></div>
      </div>
      
      {/* Grid Rings - Wireframe Only, No Fills */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-full overflow-hidden">
        <div className="w-[33%] h-[33%] rounded-full border border-sky-500/30"></div>
        <div className="w-[66%] h-[66%] rounded-full border border-sky-500/30"></div>
        <div className="w-[100%] h-[100%] rounded-full border border-sky-500/50"></div>
        {/* Axis lines */}
        <div className="absolute w-full h-[1px] bg-sky-500/20"></div>
        <div className="absolute h-full w-[1px] bg-sky-500/20"></div>
      </div>

      {/* Range Control Badge */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 flex items-center gap-1 z-20 bg-black/60 border border-sky-500/30 px-2 py-0.5 rounded-full text-[7.5px] font-mono text-sky-300">
        {(['100M', '500M', '1KM'] as const).map(r => (
          <button 
            key={r} 
            onClick={(e) => { e.stopPropagation(); setRangeZoom(r); }}
            className={`px-1.5 py-0.2 rounded ${rangeZoom === r ? 'bg-sky-500/30 font-bold text-white' : 'opacity-50 hover:opacity-100'}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Detected Entities (Blips) */}
      {entities.map((entity) => {
        const Icon = getIcon(entity.type);
        const left = `${entity.pos.x}%`;
        const top = `${entity.pos.y}%`;
        const isSelected = selectedEntity?.id === entity.id;
        const isPinged = pingedId === entity.id;
        
        return (
          <div 
            key={entity.id} 
            onClick={(e) => handleEntityClick(entity, e)}
            className="absolute transition-all duration-500 cursor-pointer group z-10"
            style={{ left, top, transform: 'translate(-50%, -50%)' }}
            title={`${entity.label} [${entity.type}]`}
          >
            {isPinged && (
              <div className="absolute -inset-3 rounded-full border border-sky-400 animate-ping pointer-events-none" />
            )}
            <div className={`relative flex items-center justify-center w-5 h-5 rounded-full border transition-all ${
              isSelected 
                ? 'border-white bg-sky-400 text-black scale-125 shadow-[0_0_12px_#38bdf8]' 
                : entity.type === 'HAZARD' 
                ? 'border-rose-500 bg-rose-500/20 hover:scale-110' 
                : 'border-sky-400 bg-sky-400/20 hover:scale-110'
            } shadow-[0_0_10px_currentColor] animate-pulse`}>
              <Icon size={9} className={isSelected ? 'text-black' : entity.type === 'HAZARD' ? 'text-rose-500' : 'text-sky-400'} />
            </div>

            {/* Hover Tooltip */}
            <div className="absolute left-6 top-0 hidden group-hover:flex flex-col bg-black/80 border border-sky-500/30 rounded px-2 py-1 text-[8px] font-mono text-sky-200 whitespace-nowrap z-30 pointer-events-none">
              <span className="font-bold text-white">{entity.label}</span>
              <span className="text-[7px] text-sky-400/80">{getDistanceMeters(entity.pos)}m • {entity.status}</span>
            </div>
          </div>
        );
      })}

      {/* Center Reference Node */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_cyan]"></div>
      </div>

      {/* Selected Entity Inspector Overlay Modal */}
      {selectedEntity && (
        <div 
          onClick={(e) => e.stopPropagation()}
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-64 bg-black/90 border border-sky-500/40 rounded-xl p-2.5 font-mono text-sky-300 shadow-[0_0_20px_rgba(14,165,233,0.3)] z-30 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          <div className="flex justify-between items-start mb-1.5 border-b border-sky-500/20 pb-1">
            <div className="flex items-center gap-1.5">
              <Crosshair size={12} className="text-sky-400" />
              <span className="text-[10px] font-bold text-white truncate max-w-[130px]">{selectedEntity.label}</span>
            </div>
            <button onClick={() => setSelectedEntity(null)} className="text-white/40 hover:text-white">
              <X size={12} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 text-[8px] mb-2">
            <div className="p-1 bg-white/5 rounded border border-white/5">
              <span className="text-white/40 block">TYPE</span>
              <span className="text-white font-bold">{selectedEntity.type}</span>
            </div>
            <div className="p-1 bg-white/5 rounded border border-white/5">
              <span className="text-white/40 block">DISTANCE</span>
              <span className="text-emerald-400 font-bold">{getDistanceMeters(selectedEntity.pos)} METERS</span>
            </div>
            <div className="p-1 bg-white/5 rounded border border-white/5 col-span-2 flex justify-between items-center">
              <div>
                <span className="text-white/40 block">STATUS</span>
                <span className="text-sky-200 font-bold">{selectedEntity.status}</span>
              </div>
              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded ${
                selectedEntity.type === 'HAZARD' ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/30 text-emerald-300'
              }`}>
                {selectedEntity.type === 'HAZARD' ? 'HAZARD_ALERT' : 'TRACKED'}
              </span>
            </div>
          </div>

          <div className="flex gap-1">
            <button 
              onClick={() => {
                setPingedId(selectedEntity.id);
                setTimeout(() => setPingedId(null), 2000);
              }}
              className="flex-1 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-200 text-[8px] font-bold rounded flex items-center justify-center gap-1 transition-colors"
            >
              <Radio size={10} /> PING NODE
            </button>
            {selectedEntity.interactionUrl && (
              <a 
                href={selectedEntity.interactionUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[8px] font-bold rounded flex items-center justify-center gap-1"
              >
                <ExternalLink size={10} /> LINK
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Radar;

