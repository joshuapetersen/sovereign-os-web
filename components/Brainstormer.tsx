
import React, { useState } from 'react';
import { Send, Loader2, Sparkles, Binary } from 'lucide-react';
import { brainstormGoals, generateGoalVisual } from '../services/geminiService';
import { ProjectGoal } from '../types';

interface BrainstormerProps {
  onGoalsUpdate: (goals: ProjectGoal[]) => void;
}

const Brainstormer: React.FC<BrainstormerProps> = ({ onGoalsUpdate }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');

  const handleBrainstorm = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setProgress('INIT_NEURAL_REASONING...');
    try {
      const { goals } = await brainstormGoals(input);
      if (goals.length > 0) {
        setProgress(`SYNTHESIZING_VISUAL...`);
        const visual = await generateGoalVisual(goals[0].title);
        goals[0].imageUrl = visual || undefined;
      }
      onGoalsUpdate(goals);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setProgress('');
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 text-sky-400">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-black flex items-center gap-3 italic tracking-tighter uppercase">
          <Sparkles className="text-sky-400 w-5 h-5" />
          Neural_Strategy
        </h2>
        <div className="flex items-center gap-2 px-2 py-0.5 bg-sky-500/10 border border-sky-500/20 rounded-full">
           <Binary size={10} className="animate-pulse" />
           <span className="text-[7px] font-bold uppercase tracking-widest">PRO_ENGINE_ACTIVE</span>
        </div>
      </div>

      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="[ DEFINE_EVOLUTION_PARAMETERS ]"
          className="w-full h-32 bg-transparent border border-sky-500/10 rounded p-4 text-sky-100 placeholder:text-sky-900 focus:outline-none focus:border-sky-500/40 resize-none transition-all mono text-sm leading-relaxed"
        />
        <button
          onClick={handleBrainstorm}
          disabled={loading || !input.trim()}
          className="mt-4 w-full bg-sky-500/5 hover:bg-sky-500/15 disabled:opacity-30 disabled:cursor-not-allowed border border-sky-500/20 text-sky-400 py-4 rounded font-black flex items-center justify-center gap-3 transition-all uppercase tracking-[0.4em] text-[10px]"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
          {loading ? 'Thinking...' : 'Start_Synthesis'}
        </button>
      </div>

      {loading && (
        <div className="text-[8px] uppercase tracking-[0.3em] animate-pulse font-bold text-center border border-white/5 py-2">
           &gt;&gt; {progress}
        </div>
      )}

      <div className="text-[7px] opacity-20 uppercase font-black tracking-[0.5em] text-center">
         Reasoning_Budget: 16k_Tokens // Path: Evolution_Engine
      </div>
    </div>
  );
};

export default Brainstormer;
