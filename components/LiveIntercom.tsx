
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff, Minimize2, Maximize2 } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

interface LiveIntercomProps {
  onVoiceCommand?: (text: string) => void;
  onActiveChange?: (active: boolean) => void;
  onPulseUpdate?: (scale: number) => void;
  isCameraOn?: boolean;
  onToggleCamSize?: () => void;
  isCamShrunk?: boolean;
  onToggleCam?: () => void;
}

const LiveIntercom: React.FC<LiveIntercomProps> = ({ 
  onVoiceCommand, 
  onActiveChange, 
  onPulseUpdate, 
  isCameraOn,
  onToggleCamSize,
  isCamShrunk,
  onToggleCam
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSarahActive, setIsSarahActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Refs for cleanup
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const nextStartTimeRef = useRef<number>(0);
  const wakeTimeoutRef = useRef<any>(null);

  useEffect(() => {
    onActiveChange?.(isSarahActive);
  }, [isSarahActive, onActiveChange]);

  const decode = (base64: string) => {
    const bString = atob(base64);
    const bytes = new Uint8Array(bString.length);
    for (let i = 0; i < bString.length; i++) bytes[i] = bString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const createBlob = (data: Float32Array): Blob => {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) int16[i] = data[i] * 32768;
    const uint8 = new Uint8Array(int16.buffer);
    let binary = '';
    for (let i = 0; i < uint8.byteLength; i++) binary += String.fromCharCode(uint8[i]);
    return { data: btoa(binary), mimeType: 'audio/pcm;rate=16000' };
  };

  const stopSession = useCallback(() => {
    // 1. Close Session
    if (sessionRef.current) {
        try { sessionRef.current.close(); } catch(e) {}
        sessionRef.current = null;
    }

    // 2. Disconnect Audio Graph
    if (processorRef.current) {
        try { processorRef.current.disconnect(); } catch(e) {}
        processorRef.current = null;
    }
    if (sourceRef.current) {
        try { sourceRef.current.disconnect(); } catch(e) {}
        sourceRef.current = null;
    }

    // 3. Stop Audio Sources
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    
    // 4. Close Audio Contexts
    const closeCtx = async (ctx: AudioContext | null) => {
        if (ctx && ctx.state !== 'closed') {
            try { await ctx.close(); } catch(e) {}
        }
    };
    closeCtx(audioContextRef.current);
    closeCtx(outputAudioContextRef.current);
    
    audioContextRef.current = null;
    outputAudioContextRef.current = null;
    
    setIsConnected(false);
    setIsSarahActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
    onPulseUpdate?.(1);
  }, [onPulseUpdate]);

  useEffect(() => {
      return () => stopSession();
  }, [stopSession]);

  const startSession = async () => {
    setIsConnecting(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("API key is missing for Live Intercom");
      }
      const ai = new GoogleGenAI({ apiKey });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      try {
        if (inputCtx.state === 'suspended') await inputCtx.resume();
        if (outputCtx.state === 'suspended') await outputCtx.resume();
      } catch (e) {
        console.warn("[Audio] Context Resume Failed (Autoplay blocked?)", e);
      }
      
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Setup Audio Graph
            const source = inputCtx.createMediaStreamSource(stream);
            const proc = inputCtx.createScriptProcessor(4096, 1, 1);
            
            proc.onaudioprocess = (e) => {
              // Capture input
              const input = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(input);
              
              // Only send if session is active
              if (sessionRef.current) {
                  sessionRef.current.sendRealtimeInput({ audio: pcmBlob });
              }
            };

            source.connect(proc);
            proc.connect(inputCtx.destination); // Required to keep processor alive
            
            sourceRef.current = source;
            processorRef.current = proc;
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text.toUpperCase();
              if (text.includes("SARAH")) {
                setIsSarahActive(true);
                if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
                wakeTimeoutRef.current = setTimeout(() => setIsSarahActive(false), 10000);
              }
              if (text.includes("MIC OFF") || text.includes("SHUT DOWN")) {
                stopSession();
                return;
              }
              onVoiceCommand?.(msg.serverContent.inputTranscription.text);
            }

            const aData = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (aData) {
                setIsSarahActive(true);
                if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
                wakeTimeoutRef.current = setTimeout(() => setIsSarahActive(false), 5000);

                if (outputCtx.state === 'suspended') await outputCtx.resume();

                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                const buf = await decodeAudioData(decode(aData), outputCtx, 24000, 1);
                const src = outputCtx.createBufferSource();
                src.buffer = buf;
                const analyzer = outputCtx.createAnalyser();
                src.connect(analyzer);
                analyzer.connect(outputCtx.destination);
                src.addEventListener('ended', () => { sourcesRef.current.delete(src); });
                sourcesRef.current.add(src);
                src.start(nextStartTimeRef.current);
                nextStartTimeRef.current += buf.duration;
                
                const monitorPulse = () => {
                  if (!isConnected) return;
                  const data = new Uint8Array(analyzer.frequencyBinCount);
                  analyzer.getByteFrequencyData(data);
                  let sum = 0;
                  for(let i=0; i<data.length; i++) sum += data[i];
                  const norm = sum / (data.length * 255);
                  onPulseUpdate?.(1 + norm * 3.5);
                  if (outputCtx.currentTime < nextStartTimeRef.current) requestAnimationFrame(monitorPulse);
                  else onPulseUpdate?.(1);
                };
                monitorPulse();
            }
          },
          onerror: () => { console.warn("SIGNAL_LOST"); stopSession(); },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Sarah. Brief, feminine OS. Wake word: 'Sarah'.",
          speechConfig: { voiceConfig: { voiceName: 'Kore' } },
          inputAudioTranscription: {},
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { 
        console.error("Session Init Error", err); 
        setIsConnecting(false); 
    }
  };

  return (
    <div className="fixed top-6 right-6 z-[10000] flex items-center gap-4 pointer-events-auto">
      <button 
        onClick={onToggleCam}
        className={`transition-all duration-500 flex items-center justify-center rounded-full border w-8 h-8 hover:scale-110 active:scale-95
          ${isCameraOn ? 'bg-sky-500/10 text-sky-400 border-sky-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}
      >
         {isCameraOn ? <Video size={12} /> : <VideoOff size={12} />}
      </button>
      {isCameraOn && (
        <button onClick={onToggleCamSize} className={`transition-all duration-500 flex items-center justify-center rounded-full border w-8 h-8 bg-sky-500/5 text-sky-400/60 border-white/5 ${isCamShrunk ? 'bg-sky-500/20 text-white border-sky-400' : ''}`}>
            {isCamShrunk ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
        </button>
      )}
      <button onClick={isConnected ? stopSession : startSession} disabled={isConnecting} className={`relative w-8 h-8 flex items-center justify-center rounded-full border ${isSarahActive ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 animate-pulse' : isConnected ? 'border-sky-400/40 bg-sky-400/10 text-sky-400' : 'border-sky-500/20 bg-black/40 text-sky-400/40'}`}>
        {isConnecting && <div className="absolute inset-0 border-[0.5px] border-cyan-400 border-t-transparent rounded-full animate-spin"></div>}
        <div className={`transition-transform duration-1000 ${isConnected ? 'rotate-[360deg]' : ''}`}>
           {isConnected ? <Mic size={12} /> : <MicOff size={12} />}
        </div>
      </button>
    </div>
  );
};

export default LiveIntercom;
