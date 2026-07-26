
import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ProjectGoal } from '../types';

interface ProjectVisualizerProps {
  goals: ProjectGoal[];
}

const ProjectVisualizer: React.FC<ProjectVisualizerProps> = ({ goals }) => {
  const data = goals.map(g => ({
    ...g,
    impactScore: g.impact === 'Critical' ? 10 : g.impact === 'Strategic' ? 8 : 6,
  }));

  return (
    <div className="h-full w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis 
            type="number" 
            dataKey="difficulty" 
            domain={[0, 10]}
            hide
          />
          <YAxis 
            type="number" 
            dataKey="impactScore" 
            domain={[0, 12]}
            hide
          />
          <ZAxis type="number" dataKey="impactScore" range={[50, 200]} />
          <Tooltip 
            cursor={{ stroke: 'rgba(56, 189, 248, 0.2)', strokeWidth: 0.5 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const d = payload[0].payload;
                return (
                  <div className="hud-panel p-2 border border-sky-500/40 text-[9px] mono leading-none bg-black/50 backdrop-blur-md">
                    <div className="text-sky-400 font-bold mb-1">{d.title}</div>
                    <div className="text-sky-600 uppercase font-bold">IMP: {d.impact} // DIF: {d.difficulty}</div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Scatter name="Projects" data={data}>
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill="none"
                stroke={entry.impact === 'Critical' ? '#fb7185' : '#38bdf8'}
                strokeWidth={1}
                className="animate-pulse"
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
      
      {/* Decorative Axes for VR feel */}
      <div className="absolute left-0 bottom-0 w-full h-[1px] bg-sky-500/10"></div>
      <div className="absolute left-0 bottom-0 h-full w-[1px] bg-sky-500/10"></div>
      <div className="absolute left-1 bottom-1 text-[7px] text-sky-500/30 font-bold uppercase">
        Complexity_Landscape_v3.1
      </div>
    </div>
  );
};

export default ProjectVisualizer;
