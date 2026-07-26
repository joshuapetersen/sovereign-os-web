
import React, { useState, useRef } from 'react';
import { Image, Film, Edit, Play, Loader2, Upload, Download, Sparkles, Key, History, Wand2 } from 'lucide-react';
import { generateProImage, editImage, generateVeoVideo, pollVideoOperation, fetchGeneratedVideo } from '../services/geminiService';

interface Artifact {
  id: string;
  type: 'IMG' | 'VIDEO';
  url: string;
  prompt: string;
  timestamp: number;
}

const PRESET_PROMPTS = [
  "Cyberpunk Holographic HUD Matrix",
  "Quantum Core Neural Reactor Wireframe",
  "Tactical Drone Infrared Terrain Scan",
  "Futuristic Cybernetic Vector Grid",
  "High-Tech Bio-Sensor Interface"
];

const Studio: React.FC = () => {
  const [mode, setMode] = useState<'GEN_IMG' | 'GEN_VIDEO' | 'EDIT_IMG'>('GEN_IMG');
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [imageSize, setImageSize] = useState('1K');
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{data: string, mime: string} | null>(null);
  const [status, setStatus] = useState('');
  const [artifactsHistory, setArtifactsHistory] = useState<Artifact[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const checkKey = async () => {
    return true;
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        setUploadedImage({ data: base64, mime: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const execute = async () => {
    if (!prompt && mode !== 'GEN_VIDEO') return;
    setIsProcessing(true);
    setResultUrl(null);
    setStatus('CHECKING_AUTH...');
    
    await checkKey();

    setStatus('INITIALIZING_CORE...');

    try {
      if (mode === 'GEN_IMG') {
        setStatus('GENERATING_PIXELS...');
        const url = await generateProImage(prompt, aspectRatio, imageSize);
        setResultUrl(url);
        if (url) {
          setArtifactsHistory(prev => [{
            id: Date.now().toString(),
            type: 'IMG',
            url,
            prompt: prompt || 'Holographic Artifact',
            timestamp: Date.now()
          }, ...prev]);
        }
      } else if (mode === 'EDIT_IMG') {
        if (!uploadedImage) {
            setStatus('MISSING_SOURCE_DATA');
            setIsProcessing(false);
            return;
        }
        setStatus('EDITING_MATRIX...');
        const url = await editImage(uploadedImage.data, uploadedImage.mime, prompt);
        setResultUrl(url);
        if (url) {
          setArtifactsHistory(prev => [{
            id: Date.now().toString(),
            type: 'IMG',
            url,
            prompt: prompt || 'Matrix Edit',
            timestamp: Date.now()
          }, ...prev]);
        }
      } else if (mode === 'GEN_VIDEO') {
        setStatus('VEO_ENGINE_START...');
        let operation = await generateVeoVideo(prompt, aspectRatio, uploadedImage?.data, uploadedImage?.mime);
        
        setStatus('RENDERING_FRAMES...');
        while (true) {
            await new Promise(r => setTimeout(r, 5000));
            operation = await pollVideoOperation(operation);
            if (operation.done) {
                if (operation.error) throw new Error((operation.error as any).message || 'Video generation failed');
                const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (uri) {
                    setStatus('DOWNLOADING_STREAM...');
                    const blob = await fetchGeneratedVideo(uri);
                    const url = URL.createObjectURL(blob);
                    setResultUrl(url);
                    setArtifactsHistory(prev => [{
                      id: Date.now().toString(),
                      type: 'VIDEO',
                      url,
                      prompt: prompt || 'Veo Motion Stream',
                      timestamp: Date.now()
                    }, ...prev]);
                }
                break;
            }
            setStatus('VEO_PROCESSING...');
        }
      }
    } catch (e: any) {
        setStatus(`ERROR: ${e.message}`);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[500px] text-sky-400 font-mono select-none">
      <div className="flex border-b border-sky-500/20 mb-4 justify-between items-center pr-2">
        <div className="flex flex-1">
          {[
            { id: 'GEN_IMG', icon: Image, label: 'IMAGEN_PRO' },
            { id: 'GEN_VIDEO', icon: Film, label: 'VEO_VIDEO' },
            { id: 'EDIT_IMG', icon: Edit, label: 'MATRIX_EDIT' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id as any); setResultUrl(null); setUploadedImage(null); }}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-all ${mode === m.id ? 'bg-sky-500/10 text-white border-b-2 border-sky-400' : 'opacity-40 hover:opacity-100'}`}
            >
              <m.icon size={14} />
              <span className="text-[8px] font-black uppercase tracking-widest">{m.label}</span>
            </button>
          ))}
        </div>

        {artifactsHistory.length > 0 && (
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className={`px-2.5 py-1.5 rounded border text-[8px] font-bold uppercase tracking-wider flex items-center gap-1 ml-2 transition-all ${showHistory ? 'bg-sky-500/30 border-sky-400 text-white' : 'bg-white/5 border-white/10 text-sky-400 opacity-60 hover:opacity-100'}`}
          >
            <History size={12} /> ({artifactsHistory.length})
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-1 custom-scrollbar">
        {showHistory ? (
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center text-[9px] font-bold text-white border-b border-sky-500/20 pb-2">
              <span>GENERATED ARTIFACTS HISTORY</span>
              <button onClick={() => setShowHistory(false)} className="text-sky-400 hover:underline">CLOSE GALLERY</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {artifactsHistory.map(art => (
                <div key={art.id} className="p-2 bg-white/5 border border-sky-500/20 rounded-lg flex flex-col gap-1.5">
                  {art.type === 'VIDEO' ? (
                    <video src={art.url} controls className="w-full h-24 object-cover rounded" />
                  ) : (
                    <img src={art.url} alt="Artifact" className="w-full h-24 object-cover rounded" />
                  )}
                  <p className="text-[8px] text-white/80 truncate">{art.prompt}</p>
                  <a href={art.url} download={`artifact_${art.id}.${art.type === 'VIDEO' ? 'mp4' : 'png'}`} className="text-[7.5px] font-bold text-sky-400 flex items-center gap-1 hover:text-white">
                    <Download size={10} /> DOWNLOAD
                  </a>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
              {(mode === 'EDIT_IMG' || mode === 'GEN_VIDEO') && (
                  <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border border-dashed border-sky-500/30 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all ${uploadedImage ? 'bg-sky-500/10' : 'hover:bg-sky-500/5'}`}
                  >
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />
                      {uploadedImage ? (
                          <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center border border-green-500/50">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                              </div>
                              <span className="text-[8px] mt-2 uppercase">Source_Loaded</span>
                          </div>
                      ) : (
                          <>
                              <Upload size={18} className="mb-1 opacity-50" />
                              <span className="text-[8px] uppercase tracking-widest">Upload_Reference</span>
                          </>
                      )}
                  </div>
              )}

              {/* Preset Prompts */}
              <div className="flex flex-col gap-1">
                <span className="text-[7.5px] uppercase opacity-50 flex items-center gap-1">
                  <Wand2 size={10} /> PRESET PROMPTS
                </span>
                <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-1">
                  {PRESET_PROMPTS.map(p => (
                    <button 
                      key={p} 
                      onClick={() => setPrompt(p)}
                      className="px-2 py-1 bg-white/5 hover:bg-sky-500/20 border border-white/10 hover:border-sky-400 text-sky-200 text-[7.5px] font-bold rounded whitespace-nowrap transition-colors shrink-0"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <textarea 
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder={mode === 'GEN_VIDEO' ? "Describe motion flow..." : "Describe visual artifact..."}
                  className="w-full bg-black/40 border border-sky-500/20 rounded-lg p-3 text-[10px] font-bold text-white uppercase tracking-widest outline-none focus:border-sky-500/50 h-20 resize-none"
              />

              <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                      <span className="text-[8px] uppercase opacity-50">Aspect Ratio</span>
                      <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)} className="bg-black/40 border border-sky-500/20 rounded p-2 text-[9px] uppercase outline-none">
                          {['1:1', '16:9', '9:16', '4:3', '3:4'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                  </div>
                  {mode === 'GEN_IMG' && (
                      <div className="flex flex-col gap-1.5">
                          <span className="text-[8px] uppercase opacity-50">Resolution</span>
                          <div className="flex gap-1">
                              {['1K', '2K', '4K'].map(s => (
                                  <button key={s} onClick={() => setImageSize(s)} className={`flex-1 py-2 text-[8px] font-black border rounded ${imageSize === s ? 'bg-sky-500/20 border-sky-400 text-white' : 'border-sky-500/20 opacity-50'}`}>
                                      {s}
                                  </button>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              <button onClick={execute} disabled={isProcessing} className="mt-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 hover:text-white py-3 rounded-lg font-black uppercase tracking-[0.3em] flex items-center justify-center gap-2 transition-all">
                  {isProcessing ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
                  {isProcessing ? status : 'EXECUTE_PROTOCOL'}
              </button>
          </div>
        )}

        {resultUrl && !showHistory && (
            <div className="mt-4 border border-sky-500/20 rounded-lg overflow-hidden bg-black/50">
                {mode === 'GEN_VIDEO' ? (
                    <video src={resultUrl} autoPlay loop controls className="w-full h-auto" />
                ) : (
                    <img src={resultUrl} alt="Generated" className="w-full h-auto" />
                )}
                <div className="p-2 flex justify-between items-center bg-white/5">
                    <span className="text-[7px] uppercase opacity-50">Artifact_Created</span>
                    <a href={resultUrl} download={`genesis_artifact.${mode === 'GEN_VIDEO' ? 'mp4' : 'png'}`} className="text-sky-400 hover:text-white">
                        <Download size={12} />
                    </a>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Studio;

