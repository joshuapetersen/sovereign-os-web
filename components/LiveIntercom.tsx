
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { GoogleGenAI, Modality, LiveServerMessage, Blob } from '@google/genai';

interface LiveIntercomProps {
  onVoiceCommand?: (text: string) => void;
  onActiveChange?: (active: boolean) => void;
  onPulseUpdate?: (scale: number) => void;
  isCameraOn?: boolean;
}

const LiveIntercom: React.FC<LiveIntercomProps> = ({ onVoiceCommand, onActiveChange, onPulseUpdate, isCameraOn }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSarahActive, setIsSarahActive] = useState(false); // Active state after wake word
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  // Fix: Use any instead of NodeJS.Timeout to resolve namespace error in browser-based TypeScript environments
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
    if (sessionRef.current) try { sessionRef.current.close(); } catch(e) {}
    sourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
    sourcesRef.current.clear();
    if (audioContextRef.current) audioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    setIsConnected(false);
    setIsSarahActive(false);
    setIsConnecting(false);
    nextStartTimeRef.current = 0;
    onPulseUpdate?.(1);
  }, [onPulseUpdate]);

  const startSession = async () => {
    setError(null);
    setIsConnecting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            const source = inputCtx.createMediaStreamSource(stream);
            const proc = inputCtx.createScriptProcessor(4096, 1, 1);
            proc.onaudioprocess = (e) => {
              const input = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(input);
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(proc);
            proc.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              const text = msg.serverContent.inputTranscription.text.toUpperCase();
              
              // Wake word logic
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
                // If Sarah is speaking, she's definitely active
                setIsSarahActive(true);
                if (wakeTimeoutRef.current) clearTimeout(wakeTimeoutRef.current);
                wakeTimeoutRef.current = setTimeout(() => setIsSarahActive(false), 5000);

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
          onerror: () => { setError("SIGNAL_LOST"); stopSession(); },
          onclose: () => stopSession()
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are Sarah (Voice: Kore). You are a precise, feminine silent sentinel. Listen for 'Sarah' as a wake word. Only speak when addressed. If you hear 'Mic off', disconnect. Be brief and tactical.",
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          inputAudioTranscription: {},
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err: any) { setError("INIT_FAULT"); setIsConnecting(false); }
  };

  return (
    <div className="fixed top-6 right-6 z-[10000] flex items-center gap-2 pointer-events-auto">
      {/* Camera: Red Pulse if Active, Blue Standby */}
      <div className={`transition-all duration-500 flex items-center justify-center rounded-full border border-white/5 w-4 h-4
        ${isCameraOn ? 'bg-rose-500/10 text-rose-500 animate-pulse border-rose-500/30' : 'bg-sky-500/5 text-sky-400/60'}`}>
         {isCameraOn ? <Video size={6} /> : <VideoOff size={6} />}
      </div>

      {/* Mic: Red Pulse if Active (Sarah engaged), Blue Standby (connected/listening) */}
      <button
        onClick={isConnected ? stopSession : startSession}
        disabled={isConnecting}
        className={`relative w-4 h-4 flex items-center justify-center rounded-full transition-all duration-300 border
          ${isSarahActive ? 'border-rose-500/40 bg-rose-500/10 text-rose-500 animate-pulse' : 
            isConnected ? 'border-sky-400/40 bg-sky-400/10 text-sky-400' : 'border-sky-500/20 bg-black/40 text-sky-400/40 hover:border-sky-400'}`}
      >
        {isConnecting && <div className="absolute inset-0 border-[0.5px] border-cyan-400 border-t-transparent rounded-full animate-spin"></div>}
        <div className={`transition-transform duration-1000 ${isConnected ? 'rotate-[360deg]' : ''}`}>
           {isConnected ? <Mic size={6} /> : <MicOff size={6} />}
        </div>
      </button>

      {error && (
        <div className="absolute top-6 right-0 text-[4px] text-rose-500 font-black tracking-widest uppercase bg-black/80 px-1 border border-rose-500/20">
          {error}
        </div>
      )}
    </div>
  );
};

export default LiveIntercom;
