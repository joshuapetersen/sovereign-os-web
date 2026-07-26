import React, { useState, useEffect } from 'react';
import { 
  Wifi, Radio, Activity, RefreshCw, Zap, Server, ShieldCheck, 
  ArrowUpRight, ArrowDownRight, Signal, Cpu, CheckCircle2, AlertOctagon,
  Users, Share2, Globe, Lock, Unlock, Copy, Check, Eye, Box, Layers,
  Plus, Trash2, Compass, Sparkles, Video, UserPlus, Link2
} from 'lucide-react';

interface NodeTelemetry {
  id: string;
  name: string;
  ip: string;
  type: 'CORE_SERVER' | 'SATELLITE' | 'EDGE_RELAY' | 'LOCAL_XR';
  signalStrength: number; // 0 - 100%
  latencyMs: number;
  downloadKbps: number;
  uploadKbps: number;
  status: 'ONLINE' | 'RECONNECTING' | 'OPTIMIZING';
  frequency: string;
}

interface PeerHUDNode {
  id: string;
  callsign: string;
  deviceType: 'VISION_PRO' | 'HOLOLENS_2' | 'QUEST_3' | 'DESKTOP_XR' | 'MOBILE_AR';
  pingMs: number;
  status: 'SYNCED' | 'STREAMING' | 'CONNECTING';
  gazeTarget: string | null;
  spatialCoords: { x: number; y: number; z: number };
  isHost: boolean;
  activeLockObject: string | null;
}

interface SyncEventLog {
  id: string;
  timestamp: string;
  peer: string;
  action: string;
  type: 'SYNC' | 'LOCK' | 'JOIN' | 'TRANSFORM';
}

const INITIAL_NODES: NodeTelemetry[] = [
  { id: 'node-01', name: 'ALPHA-PRIMARY-CORE', ip: '192.168.1.100', type: 'CORE_SERVER', signalStrength: 98, latencyMs: 6, downloadKbps: 42000, uploadKbps: 18500, status: 'ONLINE', frequency: '5.8 GHz' },
  { id: 'node-02', name: 'SARAH-SATELLITE-UPLINK', ip: '10.0.4.88', type: 'SATELLITE', signalStrength: 84, latencyMs: 34, downloadKbps: 15200, uploadKbps: 8400, status: 'ONLINE', frequency: 'K_u Band' },
  { id: 'node-03', name: 'LOCAL-XR-GLASSES-RELAY', ip: '192.168.1.105', type: 'LOCAL_XR', signalStrength: 95, latencyMs: 2, downloadKbps: 88000, uploadKbps: 45000, status: 'ONLINE', frequency: '6.0 GHz UWB' },
  { id: 'node-04', name: 'EDGE-SECURITY-GATEWAY', ip: '172.16.0.12', type: 'EDGE_RELAY', signalStrength: 76, latencyMs: 18, downloadKbps: 9400, uploadKbps: 3100, status: 'ONLINE', frequency: '2.4 GHz' },
];

const INITIAL_PEERS: PeerHUDNode[] = [
  {
    id: 'peer-self',
    callsign: 'COMMANDER_CORE (YOU)',
    deviceType: 'DESKTOP_XR',
    pingMs: 0,
    status: 'SYNCED',
    gazeTarget: 'VOLUMETRIC_CORE_MATRIX',
    spatialCoords: { x: 0.00, y: 0.00, z: 0.00 },
    isHost: true,
    activeLockObject: null,
  },
  {
    id: 'peer-alex',
    callsign: 'ALEX_HOLOLENS',
    deviceType: 'HOLOLENS_2',
    pingMs: 14,
    status: 'SYNCED',
    gazeTarget: 'NODE_01_HEALTH',
    spatialCoords: { x: 0.45, y: -0.12, z: 1.85 },
    isHost: false,
    activeLockObject: 'NODE_01_HEALTH',
  },
  {
    id: 'peer-maya',
    callsign: 'MAYA_VISION_PRO',
    deviceType: 'VISION_PRO',
    pingMs: 19,
    status: 'STREAMING',
    gazeTarget: 'ENVIRONMENTAL_SCAN',
    spatialCoords: { x: -0.72, y: 0.35, z: 2.10 },
    isHost: false,
    activeLockObject: 'ENVIRONMENTAL_SCAN',
  },
  {
    id: 'peer-devin',
    callsign: 'DEVIN_QUEST3',
    deviceType: 'QUEST_3',
    pingMs: 28,
    status: 'SYNCED',
    gazeTarget: 'NEURAL_BRAINSTORM',
    spatialCoords: { x: 0.15, y: 0.88, z: 1.40 },
    isHost: false,
    activeLockObject: null,
  }
];

const NetworkTelemetry: React.FC = () => {
  const [nodes, setNodes] = useState<NodeTelemetry[]>(INITIAL_NODES);
  const [peers, setPeers] = useState<PeerHUDNode[]>(INITIAL_PEERS);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectProgress, setReconnectProgress] = useState(0);
  const [throughputHistory, setThroughputHistory] = useState<number[]>(Array(20).fill(45));
  const [activeTab, setActiveTab] = useState<'NODES' | 'P2P_HUD_SYNC'>('P2P_HUD_SYNC');

  // P2P Room State
  const [roomId, setRoomId] = useState('GENESIS-VOLUMETRIC-7729');
  const [copiedCode, setCopiedCode] = useState(false);
  const [inputRoomCode, setInputRoomCode] = useState('');
  
  // Workspace Sync Streams Toggles
  const [syncTransforms, setSyncTransforms] = useState(true);
  const [syncGaze, setSyncGaze] = useState(true);
  const [syncObjectLocks, setSyncObjectLocks] = useState(true);
  const [syncAudioSpatial, setSyncAudioSpatial] = useState(true);

  // Sync Event Log
  const [eventLogs, setEventLogs] = useState<SyncEventLog[]>([
    { id: 'l1', timestamp: '21:14:02', peer: 'MAYA_VISION_PRO', action: 'Anchored Volumetric Spatial Origin', type: 'JOIN' },
    { id: 'l2', timestamp: '21:14:28', peer: 'ALEX_HOLOLENS', action: 'Acquired Edit Lock on [NODE_01_HEALTH]', type: 'LOCK' },
    { id: 'l3', timestamp: '21:15:10', peer: 'COMMANDER_CORE', action: 'Broadcasted HUD Spatial Transform Matrix', type: 'TRANSFORM' },
  ]);

  // Real-time peer spatial coordinate jitter simulation
  useEffect(() => {
    const interval = setInterval(() => {
      // Jitter peer spatial positions slightly to mimic live user movement
      setPeers(prev => prev.map(p => {
        if (p.isHost) return p; // Don't jitter user
        const dx = (Math.random() - 0.5) * 0.04;
        const dy = (Math.random() - 0.5) * 0.04;
        const dz = (Math.random() - 0.5) * 0.03;
        const jitterPing = Math.max(8, p.pingMs + Math.floor((Math.random() - 0.5) * 4));

        return {
          ...p,
          pingMs: jitterPing,
          spatialCoords: {
            x: parseFloat((p.spatialCoords.x + dx).toFixed(2)),
            y: parseFloat((p.spatialCoords.y + dy).toFixed(2)),
            z: parseFloat((p.spatialCoords.z + dz).toFixed(2))
          }
        };
      }));

      // Node throughput simulation
      setNodes(prev => prev.map(node => ({
        ...node,
        latencyMs: Math.max(1, node.latencyMs + Math.floor((Math.random() - 0.5) * 4)),
        downloadKbps: Math.max(1000, node.downloadKbps + Math.floor((Math.random() - 0.5) * 2000)),
        uploadKbps: Math.max(500, node.uploadKbps + Math.floor((Math.random() - 0.5) * 1000))
      })));

      setThroughputHistory(prev => [...prev.slice(1), Math.floor(35 + Math.random() * 30)]);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(roomId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleJoinNewRoom = () => {
    if (!inputRoomCode.trim()) return;
    const cleaned = inputRoomCode.trim().toUpperCase();
    setRoomId(cleaned);
    setInputRoomCode('');

    // Add log
    setEventLogs(prev => [
      {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        peer: 'COMMANDER_CORE',
        action: `Switched P2P Volumetric Mesh Room to [${cleaned}]`,
        type: 'JOIN'
      },
      ...prev
    ]);
  };

  const handleSimulateAddPeer = () => {
    const peerNames = ['SARA_META', 'KEN_MAGIC_LEAP', 'NEO_AVATAR', 'ELENA_VISION'];
    const devices: PeerHUDNode['deviceType'][] = ['VISION_PRO', 'QUEST_3', 'HOLOLENS_2', 'MOBILE_AR'];
    const randomName = peerNames[Math.floor(Math.random() * peerNames.length)] + '_' + Math.floor(Math.random() * 90 + 10);
    const randomDevice = devices[Math.floor(Math.random() * devices.length)];

    const newPeer: PeerHUDNode = {
      id: `p_${Date.now()}`,
      callsign: randomName,
      deviceType: randomDevice,
      pingMs: Math.floor(Math.random() * 20 + 10),
      status: 'SYNCED',
      gazeTarget: 'VOLUMETRIC_SCENE',
      spatialCoords: {
        x: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
        y: parseFloat(((Math.random() - 0.5) * 2).toFixed(2)),
        z: parseFloat((Math.random() * 2 + 1).toFixed(2))
      },
      isHost: false,
      activeLockObject: null
    };

    setPeers(prev => [...prev, newPeer]);

    setEventLogs(prev => [
      {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        peer: randomName,
        action: `Joined Collaborative Volumetric Workspace Mesh (${randomDevice})`,
        type: 'JOIN'
      },
      ...prev
    ]);
  };

  const handleKickPeer = (id: string, callsign: string) => {
    setPeers(prev => prev.filter(p => p.id !== id));
    setEventLogs(prev => [
      {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        peer: callsign,
        action: 'Disconnected from P2P Workspace Mesh',
        type: 'SYNC'
      },
      ...prev
    ]);
  };

  const handleBroadcastState = () => {
    setEventLogs(prev => [
      {
        id: `l_${Date.now()}`,
        timestamp: new Date().toLocaleTimeString().split(' ')[0],
        peer: 'COMMANDER_CORE',
        action: 'Forced Full Volumetric State Sync & Anchor Recalibration across all peers',
        type: 'TRANSFORM'
      },
      ...prev
    ]);
  };

  // Force Reconnect Handshake simulation
  const handleForceReconnect = () => {
    if (isReconnecting) return;
    setIsReconnecting(true);
    setReconnectProgress(0);

    setNodes(prev => prev.map(n => ({ ...n, status: 'RECONNECTING', latencyMs: 999 })));

    let progress = 0;
    const progressInterval = setInterval(() => {
      progress += 25;
      setReconnectProgress(progress);

      if (progress >= 100) {
        clearInterval(progressInterval);
        setIsReconnecting(false);
        setNodes(INITIAL_NODES.map(n => ({ ...n, status: 'ONLINE', latencyMs: Math.max(1, n.latencyMs - 2) })));
      }
    }, 300);
  };

  const totalDlMbps = (nodes.reduce((acc, n) => acc + n.downloadKbps, 0) / 1000).toFixed(1);
  const totalUlMbps = (nodes.reduce((acc, n) => acc + n.uploadKbps, 0) / 1000).toFixed(1);
  const avgLatency = Math.round(nodes.reduce((acc, n) => acc + n.latencyMs, 0) / nodes.length);
  const avgSignal = Math.round(nodes.reduce((acc, n) => acc + n.signalStrength, 0) / nodes.length);

  return (
    <div className="flex flex-col gap-3 p-3.5 w-[380px] bg-black/85 backdrop-blur-md text-white select-none font-sans border border-sky-500/30 rounded-2xl shadow-[0_0_30px_rgba(14,165,233,0.2)]">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-2.5 border-b border-sky-500/20">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/20 border border-sky-400/40 rounded-xl">
            <Radio size={16} className="text-sky-300 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[11px] font-black tracking-wider uppercase text-white">NETWORK & P2P MESH</span>
            <span className="text-[7.5px] font-mono text-sky-400">VOLUMETRIC HUD SYNCHRONIZATION</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('P2P_HUD_SYNC')}
            className={`px-2.5 py-1 rounded-xl font-mono text-[8px] font-bold uppercase transition-all ${
              activeTab === 'P2P_HUD_SYNC'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-white/5 text-white/40 hover:text-white border border-transparent'
            }`}
          >
            P2P HUD SYNC
          </button>
          <button
            onClick={() => setActiveTab('NODES')}
            className={`px-2.5 py-1 rounded-xl font-mono text-[8px] font-bold uppercase transition-all ${
              activeTab === 'NODES'
                ? 'bg-sky-500/30 text-sky-200 border border-sky-400 shadow-[0_0_10px_rgba(14,165,233,0.4)]'
                : 'bg-white/5 text-white/40 hover:text-white border border-transparent'
            }`}
          >
            NODES
          </button>
        </div>
      </div>

      {activeTab === 'P2P_HUD_SYNC' ? (
        /* P2P HUD SYNCHRONIZATION TAB */
        <div className="flex flex-col gap-3">
          
          {/* Active Workspace Mesh Room Bar */}
          <div className="p-2.5 bg-gradient-to-r from-cyan-950/40 via-sky-950/30 to-purple-950/40 border border-cyan-500/30 rounded-xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Globe size={13} className="text-cyan-300 animate-pulse" />
                <span className="text-[8.5px] font-mono font-bold text-cyan-200 uppercase tracking-wider">COLLABORATIVE ROOM:</span>
              </div>
              <span className="text-[8px] font-mono font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase">
                WEBRTC UDP MESH
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex-1 bg-black/60 border border-cyan-500/40 rounded-lg px-2.5 py-1.5 font-mono text-[10px] font-black text-white tracking-widest truncate">
                {roomId}
              </div>
              <button
                onClick={handleCopyCode}
                className="px-2.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 font-mono text-[8px] font-bold rounded-lg flex items-center gap-1 transition-all"
                title="Copy Room Link"
              >
                {copiedCode ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                <span>{copiedCode ? 'COPIED' : 'COPY'}</span>
              </button>
            </div>

            {/* Quick Room Join Input */}
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={inputRoomCode}
                onChange={e => setInputRoomCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleJoinNewRoom()}
                placeholder="ENTER PEER ROOM CODE..."
                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-2 py-1 text-[8.5px] font-mono text-white placeholder:text-white/30 outline-none focus:border-cyan-400/60 uppercase"
              />
              <button
                onClick={handleJoinNewRoom}
                className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-mono text-[8px] font-bold rounded-lg uppercase transition-all"
              >
                JOIN
              </button>
            </div>
          </div>

          {/* Sync Streams Toggle Bar */}
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[8px]">
            <button
              onClick={() => setSyncTransforms(!syncTransforms)}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                syncTransforms ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200' : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <span className="flex items-center gap-1"><Layers size={10} /> HUD TRANSFORMS</span>
              <span className="font-bold">{syncTransforms ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setSyncGaze(!syncGaze)}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                syncGaze ? 'bg-purple-500/20 border-purple-400 text-purple-200' : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <span className="flex items-center gap-1"><Eye size={10} /> GAZE POINTERS</span>
              <span className="font-bold">{syncGaze ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setSyncObjectLocks(!syncObjectLocks)}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                syncObjectLocks ? 'bg-amber-500/20 border-amber-400 text-amber-200' : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <span className="flex items-center gap-1"><Lock size={10} /> OBJECT LOCKS</span>
              <span className="font-bold">{syncObjectLocks ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => setSyncAudioSpatial(!syncAudioSpatial)}
              className={`p-1.5 rounded-lg border flex items-center justify-between transition-all ${
                syncAudioSpatial ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-white/5 border-white/10 text-white/30'
              }`}
            >
              <span className="flex items-center gap-1"><Radio size={10} /> SPATIAL AUDIO</span>
              <span className="font-bold">{syncAudioSpatial ? 'ON' : 'OFF'}</span>
            </button>
          </div>

          {/* Active Peer Mesh List */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[8.5px] font-mono font-bold text-sky-400 uppercase">
              <span className="flex items-center gap-1"><Users size={11} /> CONNECTED HUD PEERS ({peers.length})</span>
              <div className="flex gap-1">
                <button
                  onClick={handleSimulateAddPeer}
                  className="px-1.5 py-0.5 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400 text-sky-200 text-[7.5px] rounded flex items-center gap-1 transition-all"
                >
                  <UserPlus size={9} /> ADD PEER
                </button>
                <button
                  onClick={handleBroadcastState}
                  className="px-1.5 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400 text-cyan-200 text-[7.5px] rounded flex items-center gap-1 transition-all"
                  title="Broadcast full workspace matrix to all connected peers"
                >
                  <Share2 size={9} /> SYNC ALL
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-0.5 custom-scrollbar font-mono text-[8.5px]">
              {peers.map(peer => (
                <div 
                  key={peer.id}
                  className={`p-2 border rounded-xl flex flex-col gap-1 transition-all ${
                    peer.isHost 
                      ? 'bg-sky-500/10 border-sky-400/50' 
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${peer.isHost ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
                      <span className="font-black text-white">{peer.callsign}</span>
                      {peer.isHost && (
                        <span className="text-[6.5px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1 rounded">HOST</span>
                      )}
                      <span className="text-[7px] text-white/40 uppercase">[{peer.deviceType}]</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[7.5px] font-bold text-emerald-400">{peer.pingMs === 0 ? '0ms' : `${peer.pingMs}ms`}</span>
                      {!peer.isHost && (
                        <button
                          onClick={() => handleKickPeer(peer.id, peer.callsign)}
                          className="text-white/30 hover:text-rose-400 transition-colors p-0.5"
                          title="Disconnect Peer"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Spatial Coordinates & Active Lock */}
                  <div className="flex justify-between items-center text-[7.5px] text-white/60 bg-black/40 px-2 py-1 rounded-lg">
                    <span>POS: X:{peer.spatialCoords.x} Y:{peer.spatialCoords.y} Z:{peer.spatialCoords.z}</span>
                    {peer.activeLockObject ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1">
                        <Lock size={8} /> {peer.activeLockObject}
                      </span>
                    ) : (
                      <span className="text-white/30">NO LOCK</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Workspace Activity Log Stream */}
          <div className="p-2 bg-black/60 border border-white/10 rounded-xl flex flex-col gap-1.5 font-mono">
            <span className="text-[8px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Activity size={10} /> REAL-TIME WORKSPACE MUTATION LOG
            </span>
            <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto pr-0.5 custom-scrollbar text-[7.5px]">
              {eventLogs.map(log => (
                <div key={log.id} className="flex items-start gap-1.5 text-white/70">
                  <span className="text-white/30 shrink-0">[{log.timestamp}]</span>
                  <span className="text-cyan-300 font-bold shrink-0">{log.peer}:</span>
                  <span className="text-white/80">{log.action}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        /* INFRASTRUCTURE HARDWARE NODES TAB */
        <div className="flex flex-col gap-3">
          {/* Primary Telemetry Metrics Row */}
          <div className="grid grid-cols-4 gap-1.5 font-mono">
            <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center">
              <span className="text-[7.5px] text-white/50 uppercase">SIGNAL</span>
              <span className="text-[13px] font-black text-emerald-400 mt-0.5">{avgSignal}%</span>
              <span className="text-[7px] text-emerald-300/70">OPTIMAL</span>
            </div>

            <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center">
              <span className="text-[7.5px] text-white/50 uppercase">LATENCY</span>
              <span className="text-[13px] font-black text-cyan-300 mt-0.5">{isReconnecting ? '---' : `${avgLatency}ms`}</span>
              <span className="text-[7px] text-cyan-300/70">ZERO LAG</span>
            </div>

            <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center">
              <span className="text-[7.5px] text-white/50 uppercase">DOWN</span>
              <span className="text-[13px] font-black text-sky-300 mt-0.5 flex items-center gap-0.5">
                <ArrowDownRight size={10} className="text-sky-400" />
                {totalDlMbps}
              </span>
              <span className="text-[7px] text-sky-300/70">Mbps</span>
            </div>

            <div className="p-2 bg-white/5 border border-white/10 rounded-lg flex flex-col items-center">
              <span className="text-[7.5px] text-white/50 uppercase">UP</span>
              <span className="text-[13px] font-black text-purple-300 mt-0.5 flex items-center gap-0.5">
                <ArrowUpRight size={10} className="text-purple-400" />
                {totalUlMbps}
              </span>
              <span className="text-[7px] text-purple-300/70">Mbps</span>
            </div>
          </div>

          {/* Force Reconnect Action Button */}
          <button
            onClick={handleForceReconnect}
            disabled={isReconnecting}
            className={`w-full py-2 px-3 rounded-xl border flex items-center justify-center gap-2 font-mono text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
              isReconnecting 
                ? 'bg-amber-500/20 border-amber-400 text-amber-200 cursor-not-allowed shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                : 'bg-gradient-to-r from-sky-500/20 via-cyan-500/20 to-purple-500/20 border-sky-400/60 text-sky-100 hover:border-sky-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)] hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            <RefreshCw size={12} className={isReconnecting ? 'animate-spin text-amber-300' : 'text-sky-300'} />
            <span>{isReconnecting ? `RE-KEYING HANDSHAKE (${reconnectProgress}%)` : 'FORCE NETWORK RECONNECT'}</span>
          </button>

          {/* Live Sparkline Graph View */}
          <div className="p-2 bg-black/60 border border-white/10 rounded-xl flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-[8.5px] font-mono text-sky-400 font-bold uppercase">
              <span className="flex items-center gap-1"><Activity size={11} /> THROUGHPUT DYNAMICS</span>
              <span className="text-white/50">REAL-TIME STREAM</span>
            </div>

            <div className="h-12 w-full bg-black/40 border border-white/5 rounded p-1 flex items-end gap-1 relative overflow-hidden">
              {throughputHistory.map((val, idx) => (
                <div 
                  key={idx} 
                  style={{ height: `${val}%` }}
                  className="flex-1 bg-gradient-to-t from-sky-500/20 via-cyan-400/60 to-cyan-300 rounded-t-sm transition-all duration-300"
                />
              ))}
            </div>
          </div>

          {/* Connected Nodes Matrix */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8.5px] font-mono text-white/50 font-bold uppercase tracking-wider flex items-center justify-between">
              <span>HARDWARE NODE ARCHITECTURE ({nodes.length})</span>
              <span className="text-emerald-400 text-[8px]">AES-256 ENCRYPTED</span>
            </span>

            <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto pr-0.5 custom-scrollbar">
              {nodes.map((node) => (
                <div 
                  key={node.id} 
                  className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg flex items-center justify-between transition-colors font-mono text-[8.5px]"
                >
                  <div className="flex items-center gap-2">
                    <Server size={13} className="text-sky-400 shrink-0" />
                    <div className="flex flex-col">
                      <span className="text-white font-bold text-[9px] leading-tight">{node.name}</span>
                      <span className="text-white/40 text-[7.5px]">{node.ip} • {node.frequency}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-cyan-300 font-bold">{isReconnecting ? '---' : `${node.latencyMs}ms`}</span>
                      <span className="text-emerald-400 text-[7.5px]">{node.signalStrength}% SIG</span>
                    </div>
                    <div className="w-1.5 h-6 bg-white/10 rounded-full overflow-hidden flex flex-col justify-end">
                      <div 
                        style={{ height: `${node.signalStrength}%` }}
                        className={`w-full transition-all ${node.signalStrength > 80 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default NetworkTelemetry;

