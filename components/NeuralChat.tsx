
import React, { useState, useRef, useEffect } from 'react';
import { Send, BrainCircuit, Mic, Volume2, Upload, Paperclip, Loader2, Download, Trash2, Sparkles } from 'lucide-react';
import { neuralChat, synthesizeSpeech, transcribeAudio } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
  media?: string; // base64 display
}

const QUICK_DIRECTIVES = [
  "System Status Audit",
  "Scan Thermal Anomalies",
  "Optimize Neural Matrix",
  "Security Protocol Check"
];

const NeuralChat: React.FC = () => {
  const [history, setHistory] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinkingMode, setThinkingMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [media, setMedia] = useState<{data: string, mime: string, preview: string} | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend && !media) return;
    setIsProcessing(true);
    
    const userMsg: Message = { role: 'user', text: textToSend, media: media?.preview };
    setHistory(prev => [...prev, userMsg]);
    if (!customText) setInput('');
    const currentMedia = media;
    setMedia(null); // Clear pending media

    try {
        const geminiHistory = history.map(h => ({ role: h.role, parts: [{ text: h.text }] })); // Simplified history
        const responseText = await neuralChat(geminiHistory, userMsg.text, currentMedia ? { data: currentMedia.data, mimeType: currentMedia.mime } : undefined, thinkingMode);
        
        setHistory(prev => [...prev, { role: 'model', text: responseText || "NO_DATA" }]);
    } catch (e: any) {
        console.error("[NeuralChat] Error during neural chat:", e);
        setHistory(prev => [...prev, { role: 'model', text: `ERROR: ${e.message}` }]);
    } finally {
        setIsProcessing(false);
    }
  };

  const handleExportLog = () => {
    if (history.length === 0) return;
    const logStr = history.map(m => `[${m.role.toUpperCase()}]: ${m.text}`).join('\n\n');
    const blob = new Blob([logStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `neural_chat_transcript_${Date.now()}.txt`;
    a.click();
  };

  const handleClearLog = () => {
    setHistory([]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = (reader.result as string).split(',')[1];
              setMedia({ data: base64, mime: file.type, preview: reader.result as string });
          };
          reader.readAsDataURL(file);
      }
  };

  const toggleRecording = async () => {
      if (!isRecording) {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              mediaRecorderRef.current = recorder;
              audioChunksRef.current = [];
              
              recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
              recorder.onstop = async () => {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                      const base64 = (reader.result as string).split(',')[1];
                      setIsProcessing(true);
                      try {
                          const text = await transcribeAudio(base64, 'audio/webm');
                          setInput(prev => prev + " " + text);
                      } catch (e) {
                          console.error(e);
                      } finally {
                          setIsProcessing(false);
                      }
                  };
                  reader.readAsDataURL(blob);
              };
              recorder.start();
              setIsRecording(true);
          } catch (e) {
              console.error("Mic error", e);
          }
      } else {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      }
  };

  const playTTS = async (text: string) => {
      try {
          const base64Audio = await synthesizeSpeech(text);
          if (base64Audio) {
              const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
              audio.play();
          }
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <div className="flex flex-col h-[550px] w-[500px] text-sky-400 font-mono select-none">
      <div className="flex justify-between items-center mb-3 border-b border-sky-500/20 pb-2">
          <div className="flex items-center gap-2">
              <BrainCircuit size={18} className="text-sky-400" />
              <span className="text-sm font-black italic">NEURAL_CHAT</span>
          </div>
          
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <>
                <button 
                  onClick={handleExportLog} 
                  className="p-1 rounded bg-white/5 hover:bg-white/10 text-sky-300 transition-colors"
                  title="Export Transcript"
                >
                  <Download size={13} />
                </button>
                <button 
                  onClick={handleClearLog} 
                  className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-rose-400 transition-colors"
                  title="Clear Log"
                >
                  <Trash2 size={13} />
                </button>
              </>
            )}

            <button 
              onClick={() => setThinkingMode(!thinkingMode)}
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${thinkingMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 opacity-50'}`}
            >
                <div className={`w-2 h-2 rounded-full ${thinkingMode ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`}></div>
                <span className="text-[8px] font-black uppercase tracking-widest">Thinking_Mode</span>
            </button>
          </div>
      </div>

      {/* Quick Directive Chips */}
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto custom-scrollbar pb-1">
        <Sparkles size={11} className="text-sky-400 shrink-0 opacity-70" />
        {QUICK_DIRECTIVES.map(d => (
          <button
            key={d}
            onClick={() => handleSend(d)}
            disabled={isProcessing}
            className="px-2 py-0.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 text-sky-300 rounded text-[7.5px] font-bold uppercase whitespace-nowrap transition-colors shrink-0"
          >
            {d}
          </button>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-4">
          {history.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl border ${msg.role === 'user' ? 'bg-sky-500/10 border-sky-500/30 text-right' : 'bg-white/5 border-white/10 text-left'}`}>
                      {msg.media && (
                          <img src={msg.media} alt="upload" className="max-w-full rounded mb-2 border border-white/10" />
                      )}
                      <p className="text-[12px] whitespace-pre-wrap leading-relaxed opacity-90">{msg.text}</p>
                      {msg.role === 'model' && (
                          <button onClick={() => playTTS(msg.text)} className="mt-2 text-sky-400/50 hover:text-sky-400">
                              <Volume2 size={12} />
                          </button>
                      )}
                  </div>
              </div>
          ))}
          {isProcessing && (
              <div className="flex items-center gap-2 opacity-50 pl-2">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[8px] uppercase tracking-widest">Neural_Processing...</span>
              </div>
          )}
      </div>

      <div className="mt-4 p-2 bg-white/5 border border-sky-500/20 rounded-xl">
          {media && (
              <div className="flex items-center gap-2 mb-2 p-1 bg-black/40 rounded border border-white/10">
                  <Paperclip size={12} />
                  <span className="text-[8px] opacity-70">Media_Attached</span>
                  <button onClick={() => setMedia(null)} className="ml-auto text-rose-500">×</button>
              </div>
          )}
          <div className="flex items-center gap-2">
              <button onClick={() => fileRef.current?.click()} className="p-2 hover:bg-white/10 rounded-full transition-colors text-sky-400">
                  <Upload size={16} />
              </button>
              <input type="file" ref={fileRef} className="hidden" onChange={handleFile} />
              
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="INPUT_DIRECTIVE..."
                className="flex-1 bg-transparent outline-none text-[10px] font-bold text-white placeholder:text-white/20"
              />
              
              <button 
                onClick={toggleRecording}
                className={`p-2 rounded-full transition-all ${isRecording ? 'bg-rose-500 text-white animate-pulse' : 'hover:bg-white/10 text-sky-400'}`}
              >
                  <Mic size={16} />
              </button>
              
              <button onClick={() => handleSend()} className="p-2 bg-sky-500/20 hover:bg-sky-500/40 rounded-full transition-colors text-sky-400">
                  <Send size={16} />
              </button>
          </div>
      </div>
    </div>
  );
};

export default NeuralChat;
