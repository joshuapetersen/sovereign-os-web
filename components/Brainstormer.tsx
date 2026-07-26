
import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Binary, Target, TrendingUp, Tag, Plus, Download, Trash2, X, Filter } from 'lucide-react';
import { brainstormGoals, generateGoalVisual } from '../services/geminiService';
import { ProjectGoal } from '../types';
import ProjectVisualizer from './ProjectVisualizer';

interface BrainstormerProps {
  goals?: ProjectGoal[];
  onGoalsUpdate: (goals: ProjectGoal[]) => void;
}

const DEFAULT_GOALS: ProjectGoal[] = [
  {
    id: 'g1',
    title: 'Holographic Neural Mesh',
    impact: 'Critical',
    description: 'Deploy real-time 3D spatial interface nodes.',
    difficulty: 8,
    potentialROI: '+320%',
    tags: ['SPATIAL', 'NEURAL']
  },
  {
    id: 'g2',
    title: 'Quantum Sensor Array',
    impact: 'Strategic',
    description: 'Low-latency biometric telemetry sync.',
    difficulty: 5,
    potentialROI: '+180%',
    tags: ['IOT', 'OPTICS']
  }
];

const Brainstormer: React.FC<BrainstormerProps> = ({ goals = [], onGoalsUpdate }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [localGoals, setLocalGoals] = useState<ProjectGoal[]>(goals.length ? goals : DEFAULT_GOALS);
  const [impactFilter, setImpactFilter] = useState<'ALL' | 'Critical' | 'Strategic' | 'Operational'>('ALL');

  // Manual goal creation state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newImpact, setNewImpact] = useState<'Critical' | 'Strategic' | 'Operational'>('Strategic');
  const [newDifficulty, setNewDifficulty] = useState(5);
  const [newROI, setNewROI] = useState('+150%');

  const activeGoals = goals.length > 0 ? goals : localGoals;

  const updateGoalsState = (updated: ProjectGoal[]) => {
    setLocalGoals(updated);
    onGoalsUpdate(updated);
  };

  const handleBrainstorm = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setProgress('INIT_NEURAL_REASONING...');
    try {
      const res = await brainstormGoals(input);
      const newGoals = res?.goals || [];
      if (newGoals.length > 0) {
        setProgress(`SYNTHESIZING_VISUAL...`);
        const visual = await generateGoalVisual(newGoals[0].title);
        newGoals[0].imageUrl = visual || undefined;
      }
      updateGoalsState(newGoals);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  const handleAddGoal = () => {
    if (!newTitle.trim()) return;
    const customGoal: ProjectGoal = {
      id: `g_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom strategic objective.',
      impact: newImpact,
      difficulty: newDifficulty,
      potentialROI: newROI,
      tags: ['CUSTOM', 'DIRECTIVE']
    };
    updateGoalsState([customGoal, ...activeGoals]);
    setNewTitle('');
    setNewDesc('');
    setShowAddModal(false);
  };

  const handleDeleteGoal = (id: string) => {
    updateGoalsState(activeGoals.filter(g => g.id !== id));
  };

  const handleExportStrategy = () => {
    const jsonStr = JSON.stringify(activeGoals, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `genesis_strategy_matrix_${Date.now()}.json`;
    a.click();
  };

  const filteredGoals = activeGoals.filter(g => impactFilter === 'ALL' || g.impact === impactFilter);

  return (
    <div className="relative flex flex-col h-[520px] w-[460px] text-sky-400 font-mono space-y-3 select-none">
      <div className="flex justify-between items-center border-b border-sky-500/20 pb-2">
        <h2 className="text-lg font-black flex items-center gap-2 italic tracking-tighter uppercase">
          <Sparkles className="text-sky-400 w-4 h-4" />
          Neural_Strategy
        </h2>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleExportStrategy}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-sky-300 rounded border border-white/10 transition-colors"
            title="Export Strategy Matrix JSON"
          >
            <Download size={12} />
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-2 py-1 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-200 text-[8px] font-bold rounded flex items-center gap-1"
          >
            <Plus size={10} /> ADD_GOAL
          </button>
        </div>
      </div>

      {/* Manual Goal Creation Modal */}
      {showAddModal && (
        <div className="absolute inset-x-2 top-10 z-20 bg-black/95 border border-sky-500/40 rounded-xl p-3 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
          <div className="flex justify-between items-center mb-2 pb-1 border-b border-sky-500/20">
            <span className="text-[10px] font-bold text-white uppercase">ADD STRATEGIC DIRECTIVE</span>
            <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white"><X size={12} /></button>
          </div>
          <div className="flex flex-col gap-2">
            <input 
              type="text" 
              placeholder="GOAL TITLE" 
              value={newTitle} 
              onChange={e => setNewTitle(e.target.value)} 
              className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[10px] text-white outline-none focus:border-sky-400"
            />
            <textarea 
              placeholder="GOAL DESCRIPTION" 
              value={newDesc} 
              onChange={e => setNewDesc(e.target.value)} 
              className="bg-black/60 border border-sky-500/30 rounded p-1.5 text-[9px] text-white outline-none focus:border-sky-400 h-14 resize-none"
            />
            <div className="grid grid-cols-3 gap-2 text-[8px]">
              <div>
                <span className="text-white/40 block mb-1">IMPACT</span>
                <select value={newImpact} onChange={(e: any) => setNewImpact(e.target.value)} className="w-full bg-black/60 border border-sky-500/30 text-white rounded p-1">
                  <option value="Critical">Critical</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Operational">Operational</option>
                </select>
              </div>
              <div>
                <span className="text-white/40 block mb-1">DIFFICULTY ({newDifficulty}/10)</span>
                <input type="range" min={1} max={10} value={newDifficulty} onChange={e => setNewDifficulty(parseInt(e.target.value))} className="w-full accent-sky-400" />
              </div>
              <div>
                <span className="text-white/40 block mb-1">ROI</span>
                <input type="text" value={newROI} onChange={e => setNewROI(e.target.value)} className="w-full bg-black/60 border border-sky-500/30 text-white rounded p-1" />
              </div>
            </div>
            <button 
              onClick={handleAddGoal}
              className="py-1.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400 text-sky-200 text-[9px] font-bold rounded uppercase mt-1"
            >
              REGISTER GOAL
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="[ DEFINE_EVOLUTION_PARAMETERS (e.g. Next-gen autonomous drone platform) ]"
          className="w-full h-20 bg-black/40 border border-sky-500/20 rounded p-3 text-sky-100 placeholder:text-sky-800 focus:outline-none focus:border-sky-500/50 resize-none transition-all text-xs leading-relaxed"
        />
        <button
          onClick={handleBrainstorm}
          disabled={loading || !input.trim()}
          className="mt-1 w-full bg-sky-500/10 hover:bg-sky-500/20 disabled:opacity-30 border border-sky-500/30 text-sky-300 py-2 rounded font-black flex items-center justify-center gap-2 transition-all uppercase tracking-[0.3em] text-[8.5px]"
        >
          {loading ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
          {loading ? progress || 'Synthesizing...' : 'START_NEURAL_SYNTHESIS'}
        </button>
      </div>

      {/* Impact Filters */}
      <div className="flex items-center gap-1.5 text-[8px] px-1">
        <Filter size={10} className="text-sky-500/50" />
        {(['ALL', 'Critical', 'Strategic', 'Operational'] as const).map(f => (
          <button
            key={f}
            onClick={() => setImpactFilter(f)}
            className={`px-2 py-0.5 rounded uppercase font-bold transition-all ${
              impactFilter === f ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/5 text-white/40 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Goal Cards & Scatter Visualization */}
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
        {filteredGoals.length > 0 && (
          <div className="h-32 w-full bg-black/50 border border-sky-500/20 rounded-lg p-2 overflow-hidden">
            <ProjectVisualizer goals={filteredGoals} />
          </div>
        )}

        <div className="space-y-2">
          {filteredGoals.map(goal => (
            <div key={goal.id} className="group p-3 bg-white/5 border border-white/10 rounded-lg hover:border-sky-500/40 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-bold text-white uppercase">{goal.title}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase ${
                    goal.impact === 'Critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                  }`}>
                    {goal.impact}
                  </span>
                  <button 
                    onClick={() => handleDeleteGoal(goal.id)}
                    className="text-white/20 hover:text-rose-400 p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete Goal"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
              <p className="text-[9px] text-white/60 mb-2 leading-tight">{goal.description}</p>

              {goal.imageUrl && (
                <div className="mb-2 rounded overflow-hidden border border-sky-500/30 h-24">
                  <img src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="flex justify-between items-center text-[7px] opacity-70 border-t border-white/5 pt-1.5">
                <span className="flex items-center gap-1"><TrendingUp size={8} /> ROI: {goal.potentialROI}</span>
                <span className="flex items-center gap-1"><Target size={8} /> Difficulty: {goal.difficulty}/10</span>
                <div className="flex gap-1">
                  {goal.tags.map(t => (
                    <span key={t} className="px-1 bg-white/10 rounded text-[6px]">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Brainstormer;

