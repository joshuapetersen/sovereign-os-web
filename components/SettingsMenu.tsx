import React, { useState, useEffect } from 'react';
import { 
  Wifi, Bluetooth, Smartphone, Battery, Monitor, BrainCircuit, 
  ChevronRight, ArrowLeft, ToggleLeft, ToggleRight, 
  Layout, Moon, Globe, Shield, Settings, 
  Signal, Lock, Cloud, Radio, Share2, MousePointer, 
  HardDrive, Zap, RefreshCw, Eye, Grid, Thermometer, 
  Layers, Mic, User, Activity, Cast, Key, Search,
  Volume2, VolumeX, Bell, Sliders, Cpu, EyeOff,
  Fingerprint, Compass, Maximize, AlertTriangle, Terminal,
  SlidersHorizontal, Check, Info, FileText, Database,
  BatteryCharging, Vibrate, Sparkles, Folder, Play, Pause,
  ShieldCheck, SmartphoneNfc, Crosshair, Wrench, RotateCcw, Sun
} from 'lucide-react';
import { DeviceType, DeviceNode } from '../types';

// --- COMPREHENSIVE ANDROID & VR SETTINGS STATE ---
interface SettingsState {
  // 1. NETWORK & INTERNET
  wifi: boolean;
  wifiSsid: string;
  wifiBand: '5GHz' | '6GHz' | 'Wi-Fi 7';
  mobileData: boolean;
  dataSaver: boolean;
  hotspotEnabled: boolean;
  hotspotSsid: string;
  airplaneMode: boolean;
  vpnEnabled: boolean;
  vpnProtocol: 'WireGuard' | 'OpenVPN' | 'IPsec';
  dnsProvider: 'GOOGLE' | 'CLOUDFLARE' | 'ADGUARD' | 'CUSTOM';
  customDnsHost: string;
  
  // 2. SOUND & AUDIO MATRIX
  mediaVolume: number;
  ringVolume: number;
  notificationVolume: number;
  alarmVolume: number;
  spatialMicVolume: number;
  soundProfile: 'NORMAL' | 'VIBRATE' | 'SILENT' | 'DND';
  spatialAudio: boolean;
  headTracking: 'OFF' | 'FIXED' | 'DYNAMIC';
  dolbyAtmos: boolean;
  eqPreset: 'FLAT' | 'TACTICAL' | 'BASS_BOOST' | 'CYBER' | 'VOCAL';
  hapticStrength: number;

  // 3. BIOMETRICS, SECURITY & PRIVACY
  fingerprintEnrolled: boolean;
  faceUnlockEnabled: boolean;
  eyeGazeAuth: boolean;
  screenLockType: 'NONE' | 'PIN' | 'PATTERN' | 'BIOMETRIC';
  screenLockPin: string;
  globalMicMute: boolean;
  globalCamMute: boolean;
  locationEnabled: boolean;
  incognitoMode: boolean;
  appLockEnabled: boolean;

  // 4. VR & SPATIAL COMPUTING (XR)
  passthroughMode: 'COLOR' | 'MONO_EDGE' | 'THERMAL' | 'CYBER_CYAN';
  passthroughOpacity: number;
  ipdValue: number; // 58mm - 72mm
  guardianMode: 'ROOMSCALE' | 'STATIONARY' | 'OFF';
  guardianSensitivity: 'LOW' | 'MEDIUM' | 'HIGH';
  eyeTrackingEnabled: boolean;
  handTrackingEnabled: boolean;
  pinchSensitivity: number;
  displayRefreshRate: '72HZ' | '90HZ' | '120HZ' | '144HZ';
  fovOffset: number;
  stereoscopicOutput: boolean;

  // 5. DEVELOPER OPTIONS (ANDROID & VR DEV SUITE)
  devMode: boolean;
  usbDebugging: boolean;
  wirelessAdb: boolean;
  stayAwake: boolean;
  logcatStreaming: boolean;
  showTouches: boolean;
  pointerLocation: boolean;
  windowAnimScale: number;
  transitionAnimScale: number;
  animatorDurationScale: number;
  force4xMsaa: boolean;
  gpuProfiling: boolean;
  vrPerfOverlay: boolean;
  foveatedRendering: 'OFF' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EYE_TRACKED';
  passthroughEdgeDetect: boolean;

  // 6. GENESIS AI INTELLIGENCE
  voiceModel: 'KORE' | 'PUCK' | 'FENRIR';
  personalityLogic: number; // 0-100
  thinkingTokens: '8K' | '16K' | '32K';
  visionConfidence: number;

  // 7. DISPLAY & THEME
  themeColor: 'CYAN' | 'AMBER' | 'ROSE' | 'GREEN' | 'OLED_BLACK';
  brightness: number;
  autoBrightness: boolean;
  nightMode: boolean;
  uiScale: number;
  fontScale: number;
  screenTimeoutSec: number;

  // 8. POWER & BATTERY
  powerProfile: 'PERFORMANCE' | 'BALANCED' | 'SAVER' | 'ULTRA_VR';
  batterySaver: boolean;
  chargeLimit80: boolean;
  reverseCharging: boolean;
  batteryHealthPct: number;
  batteryTempC: number;

  // 9. STORAGE & MEMORY
  usedStorageGb: number;
  totalStorageGb: number;
  ramUsageGb: number;
  totalRamGb: number;
  cacheCleared: boolean;

  // 10. ACCESSIBILITY & SYSTEM
  language: 'EN_US' | 'EN_UK' | 'JP' | 'ES' | 'DE';
  talkback: boolean;
  highContrastText: boolean;
  colorCorrection: 'NONE' | 'PROTANOPIA' | 'DEUTERANOPIA' | 'TRITANOPIA';
  monoAudio: boolean;
  autoUpdate: boolean;
}

interface SettingsMenuProps {
  lookSensitivity: number;
  setLookSensitivity: (val: number) => void;
  deviceType: DeviceType;
  setDeviceType: (type: DeviceType) => void;
  isSarahSilent: boolean;
  setIsSarahSilent: (val: boolean) => void;
  pairedNodes: DeviceNode[];
  isHighContrast?: boolean;
  setIsHighContrast?: (val: boolean) => void;
  isStereoscopic?: boolean;
  setIsStereoscopic?: (val: boolean) => void;
  isBiometricUnlocked?: boolean;
  onOpenBiometrics?: () => void;
  onOpenGoogleServices?: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  lookSensitivity,
  setLookSensitivity,
  deviceType,
  setDeviceType,
  isSarahSilent,
  setIsSarahSilent,
  pairedNodes,
  isHighContrast,
  setIsHighContrast,
  isStereoscopic,
  setIsStereoscopic,
  isBiometricUnlocked,
  onOpenBiometrics,
  onOpenGoogleServices
}) => {
  // --- STATE INITIALIZATION ---
  const [settings, setSettings] = useState<SettingsState>({
    wifi: true,
    wifiSsid: 'Genesis_XR_5G_Node',
    wifiBand: '6GHz',
    mobileData: true,
    dataSaver: false,
    hotspotEnabled: false,
    hotspotSsid: 'Genesis_Hotspot_Mesh',
    airplaneMode: false,
    vpnEnabled: false,
    vpnProtocol: 'WireGuard',
    dnsProvider: 'GOOGLE',
    customDnsHost: 'dns.google',

    mediaVolume: 80,
    ringVolume: 70,
    notificationVolume: 65,
    alarmVolume: 90,
    spatialMicVolume: 85,
    soundProfile: 'NORMAL',
    spatialAudio: true,
    headTracking: 'DYNAMIC',
    dolbyAtmos: true,
    eqPreset: 'TACTICAL',
    hapticStrength: 75,

    fingerprintEnrolled: true,
    faceUnlockEnabled: true,
    eyeGazeAuth: true,
    screenLockType: 'BIOMETRIC',
    screenLockPin: '1092',
    globalMicMute: false,
    globalCamMute: false,
    locationEnabled: true,
    incognitoMode: false,
    appLockEnabled: true,

    passthroughMode: 'COLOR',
    passthroughOpacity: 100,
    ipdValue: 63,
    guardianMode: 'ROOMSCALE',
    guardianSensitivity: 'MEDIUM',
    eyeTrackingEnabled: true,
    handTrackingEnabled: true,
    pinchSensitivity: 80,
    displayRefreshRate: '120HZ',
    fovOffset: 0,
    stereoscopicOutput: isStereoscopic || false,

    devMode: true,
    usbDebugging: true,
    wirelessAdb: true,
    stayAwake: false,
    logcatStreaming: false,
    showTouches: false,
    pointerLocation: false,
    windowAnimScale: 1.0,
    transitionAnimScale: 1.0,
    animatorDurationScale: 1.0,
    force4xMsaa: true,
    gpuProfiling: false,
    vrPerfOverlay: true,
    foveatedRendering: 'EYE_TRACKED',
    passthroughEdgeDetect: false,

    voiceModel: 'KORE',
    personalityLogic: 65,
    thinkingTokens: '32K',
    visionConfidence: 0.88,

    themeColor: 'CYAN',
    brightness: 85,
    autoBrightness: true,
    nightMode: false,
    uiScale: 1.0,
    fontScale: 1.0,
    screenTimeoutSec: 300,

    powerProfile: 'PERFORMANCE',
    batterySaver: false,
    chargeLimit80: true,
    reverseCharging: false,
    batteryHealthPct: 98,
    batteryTempC: 32.4,

    usedStorageGb: 142.5,
    totalStorageGb: 512,
    ramUsageGb: 6.8,
    totalRamGb: 16,
    cacheCleared: false,

    language: 'EN_US',
    talkback: false,
    highContrastText: false,
    colorCorrection: 'NONE',
    monoAudio: false,
    autoUpdate: true
  });

  const [screenStack, setScreenStack] = useState<string[]>(['MAIN']);
  const [searchQuery, setSearchQuery] = useState('');
  const [logMessages, setLogMessages] = useState<string[]>([
    '[LOGCAT] Android 15 XR Kernel initialized (v6.6.18)',
    '[XR_COMPOSITOR] Passthrough stereo stream active @ 120fps',
    '[FOVEATION] Dynamic Eye Tracking pipeline locked',
    '[SECURITY] Biometric iris enclave verified',
    '[ADB] Wireless debugging listening on 192.168.1.104:5555'
  ]);

  const currentScreen = screenStack[screenStack.length - 1];

  const navigateTo = (screen: string) => setScreenStack([...screenStack, screen]);
  const goBack = () => setScreenStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // Sync external high-contrast mode prop
  useEffect(() => {
    if (isHighContrast !== undefined && isHighContrast !== settings.highContrastText) {
      setSettings(prev => ({ ...prev, highContrastText: isHighContrast }));
    }
  }, [isHighContrast]);

  const toggleHighContrast = (val: boolean) => {
    updateSetting('highContrastText', val);
    setIsHighContrast?.(val);
  };

  // Sync external stereoscopic mode prop
  useEffect(() => {
    if (isStereoscopic !== undefined && isStereoscopic !== settings.stereoscopicOutput) {
      setSettings(prev => ({ ...prev, stereoscopicOutput: isStereoscopic }));
    }
  }, [isStereoscopic]);

  const toggleStereoscopic = (val: boolean) => {
    updateSetting('stereoscopicOutput', val);
    setIsStereoscopic?.(val);
  };

  // Add dummy logcat streaming entry when logcat is turned on
  useEffect(() => {
    if (!settings.logcatStreaming) return;
    const interval = setInterval(() => {
      const msgs = [
        `[GPU] Frame render time: ${(Math.random() * 2 + 5).toFixed(2)}ms`,
        `[INPUT] Hand gesture pinch confidence: ${(Math.random() * 0.15 + 0.85).toFixed(2)}`,
        `[GAZE] Eye tracking origin offset: X=${(Math.random() * 2 - 1).toFixed(2)}, Y=${(Math.random() * 2 - 1).toFixed(2)}`,
        `[AUDIO] HRTF spatial buffer clear. Dynamic head orientation synchronized.`
      ];
      setLogMessages(prev => [msgs[Math.floor(Math.random() * msgs.length)], ...prev.slice(0, 15)]);
    }, 1500);
    return () => clearInterval(interval);
  }, [settings.logcatStreaming]);

  // --- REUSABLE UI ELEMENTS ---
  const Header = ({ title }: { title: string }) => (
    <div className="flex items-center gap-3 mb-3 pb-2 border-b border-sky-500/20 sticky top-0 bg-[#0c0c0c]/95 backdrop-blur z-30 pt-2 px-3">
      {screenStack.length > 1 ? (
        <button onClick={goBack} className="p-1.5 rounded-full hover:bg-white/10 text-sky-400 transition-colors">
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="p-1.5 text-sky-400/60">
          <Settings size={18} />
        </div>
      )}
      <h2 className="text-[13px] text-sky-100 font-bold tracking-wider uppercase flex-1 truncate">{title}</h2>
      <span className="text-[8px] font-mono text-sky-500/40 bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/20">
        {screenStack.length > 1 ? screenStack.join(' › ') : 'ANDROID 15 XR'}
      </span>
    </div>
  );

  const Section = ({ label }: { label: string }) => (
    <div className="text-[9px] font-black text-sky-400/80 uppercase tracking-[0.2em] px-2 mt-5 mb-2 border-l-2 border-sky-500/40 pl-2">
      {label}
    </div>
  );

  const NavRow = ({ icon: Icon, title, subtitle, target, badge }: any) => (
    <div 
      onClick={() => navigateTo(target)}
      className="group flex items-center justify-between py-2.5 px-3 cursor-pointer hover:bg-white/5 border border-transparent hover:border-sky-500/20 rounded-lg transition-all mb-1"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {Icon && (
          <div className="p-2 bg-white/5 rounded-lg group-hover:bg-sky-500/20 group-hover:text-sky-300 text-sky-400/80 transition-colors shrink-0">
            <Icon size={16} />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] text-white/90 font-medium group-hover:text-white truncate">{title}</span>
          {subtitle && <span className="text-[9.5px] text-white/40 group-hover:text-white/60 truncate">{subtitle}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {badge && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
            {badge}
          </span>
        )}
        <ChevronRight size={14} className="text-white/20 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );

  const ToggleRow = ({ title, subtitle, active, onToggle, icon: Icon }: any) => (
    <div 
      onClick={(e) => { e.stopPropagation(); onToggle(!active); }}
      className="flex items-center justify-between py-2.5 px-3 hover:bg-white/5 rounded-lg mb-1 cursor-pointer transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <Icon size={16} className={active ? "text-sky-400" : "text-white/30"} />}
        <div className="flex flex-col min-w-0">
          <span className="text-[12px] text-white/90 font-medium truncate">{title}</span>
          {subtitle && <span className="text-[9.5px] text-white/40 truncate">{subtitle}</span>}
        </div>
      </div>
      <button className={`transition-all duration-300 shrink-0 ${active ? 'text-sky-400 scale-105 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'text-white/20'}`}>
        {active ? <ToggleRight size={28} fill="currentColor" /> : <ToggleLeft size={28} />}
      </button>
    </div>
  );

  const SliderRow = ({ label, value, min, max, onChange, unit = '', step = 1, icon: Icon }: any) => (
    <div className="py-2.5 px-3 hover:bg-white/5 rounded-lg mb-1">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-sky-400/80" />}
          <span className="text-[11.5px] text-white/80 font-medium">{label}</span>
        </div>
        <span className="text-[10px] font-mono text-sky-300 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
          {value}{unit}
        </span>
      </div>
      <input 
        type="range" min={min} max={max} step={step} value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-400 h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20"
      />
    </div>
  );

  const SelectRow = ({ label, value, options, onChange }: any) => (
    <div className="py-2.5 px-3 hover:bg-white/5 rounded-lg mb-1 flex items-center justify-between">
      <span className="text-[12px] text-white/90 font-medium">{label}</span>
      <div className="flex gap-1 flex-wrap justify-end">
        {options.map((opt: string) => (
          <button 
            key={opt} 
            onClick={() => onChange(opt)}
            className={`px-2 py-0.5 text-[8.5px] font-bold border rounded transition-all ${
              value === opt ? 'bg-sky-500/25 border-sky-400 text-white shadow-[0_0_8px_rgba(56,189,248,0.3)]' : 'border-white/10 text-white/40 hover:bg-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const InputRow = ({ label, value, onChange, placeholder }: any) => (
    <div className="py-2.5 px-3 hover:bg-white/5 rounded-lg mb-1">
      <span className="text-[10px] text-white/50 mb-1 block uppercase tracking-wider font-bold">{label}</span>
      <input 
        type="text" 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/60 border border-sky-500/20 rounded p-2 text-[11.5px] text-white outline-none focus:border-sky-400 transition-colors font-mono"
      />
    </div>
  );

  // --- MAIN DASHBOARD / ROOT MENU ---
  const renderMain = () => {
    // If searching, render instant search results across all settings
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const allSearchable = [
        { title: 'Wi-Fi & Networks', subtitle: 'Wi-Fi 7, SSID, Bands, MAC Randomization', target: 'WIFI' },
        { title: 'Mobile Data & eSIM', subtitle: '5G NR, VoLTE, APN Settings', target: 'MOBILE' },
        { title: 'Hotspot & Tethering', subtitle: 'Wi-Fi Hotspot, USB Tethering', target: 'HOTSPOT' },
        { title: 'VPN & Tunneling', subtitle: 'WireGuard, OpenVPN, Split Tunneling', target: 'VPN' },
        { title: 'Private DNS', subtitle: 'DoH, Cloudflare, Google DNS', target: 'DNS' },
        { title: 'Sound & Volume Matrix', subtitle: 'Media, Call, Alarm, Mic, EQ, Dolby Atmos', target: 'SOUND' },
        { title: 'Spatial Audio & HRTF', subtitle: '3D Head Tracking, Room Acoustics', target: 'SPATIAL_AUDIO' },
        { title: 'Biometrics & Security', subtitle: 'Fingerprint, Face Unlock, Eye Gaze Auth', target: 'BIOMETRICS' },
        { title: 'Screen Lock & PIN', subtitle: 'Pattern, 6-Digit PIN, Smart Lock', target: 'LOCKSCREEN' },
        { title: 'Privacy Dashboard', subtitle: 'Camera, Mic, Precise Location Permissions', target: 'PRIVACY' },
        { title: 'VR Passthrough & Optics', subtitle: 'Stereo Color, Thermal AR, IPD Calibration', target: 'PASSTHROUGH' },
        { title: 'Guardian & Boundary', subtitle: 'Roomscale, Floor Calibration, Sensitivity', target: 'GUARDIAN' },
        { title: 'Developer Options', subtitle: 'ADB, Logcat, 4x MSAA, VR Perf Overlay', target: 'DEV' },
        { title: 'Display & Refresh Rate', subtitle: '120Hz, 144Hz, HDR, Night Light', target: 'DISPLAY' },
        { title: 'Power & Battery Health', subtitle: 'Battery Saver, Thermal Temp, Charging Limit', target: 'POWER' },
        { title: 'Genesis AI Intelligence', subtitle: 'Voice Model, Personality Logic, Thinking Tokens', target: 'GENESIS' },
        { title: 'Accessibility & Vision', subtitle: 'TalkBack, High Contrast, Color Correction', target: 'ACCESSIBILITY' },
        { title: 'System & About Headset', subtitle: 'Android 15 XR, Build AP2A, Kernel 6.6', target: 'ABOUT' }
      ].filter(item => item.title.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q));

      return (
        <div className="flex flex-col gap-1">
          <div className="text-[9px] uppercase font-mono text-sky-400 px-2 py-1">
            Search Results ({allSearchable.length})
          </div>
          {allSearchable.length > 0 ? (
            allSearchable.map(item => (
              <NavRow key={item.target} icon={Search} title={item.title} subtitle={item.subtitle} target={item.target} />
            ))
          ) : (
            <div className="text-center py-8 text-white/40 text-[11px]">No setting matching "{searchQuery}"</div>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col animate-in fade-in duration-200">
        {/* Quick Settings Grid Tiles */}
        <div className="grid grid-cols-6 gap-1.5 mb-4 p-2 bg-white/[0.02] border border-white/5 rounded-xl">
          <button 
            onClick={() => updateSetting('wifi', !settings.wifi)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.wifi ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
          >
            <Wifi size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Wi-Fi</span>
          </button>

          <button 
            onClick={() => updateSetting('bluetooth', !settings.bluetooth)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.bluetooth ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
          >
            <Bluetooth size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">BT Array</span>
          </button>

          <button 
            onClick={() => toggleStereoscopic(!settings.stereoscopicOutput)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.stereoscopicOutput ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.6)]' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
            title="Toggle Stereoscopic 3D Side-by-Side Output with Lens Distortion Shader Overlay"
          >
            <Eye size={16} className={settings.stereoscopicOutput ? "text-cyan-300 animate-pulse" : ""} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Stereo VR</span>
          </button>

          <button 
            onClick={() => toggleHighContrast(!settings.highContrastText)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.highContrastText ? 'bg-amber-500/25 text-amber-300 border border-amber-400 shadow-[0_0_12px_gold]' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
            title="Toggle High Contrast Mode for bright outdoor/sunlight environments"
          >
            <Sun size={16} className={settings.highContrastText ? "text-amber-300 animate-pulse" : ""} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Sun Boost</span>
          </button>

          <button 
            onClick={() => updateSetting('airplaneMode', !settings.airplaneMode)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.airplaneMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
          >
            <Radio size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">Airplane</span>
          </button>

          <button 
            onClick={() => updateSetting('devMode', !settings.devMode)}
            className={`p-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
              settings.devMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-white/40 border border-transparent'
            }`}
          >
            <Terminal size={16} />
            <span className="text-[8px] font-bold uppercase tracking-wider">VR Dev</span>
          </button>
        </div>

        {/* Categories */}
        <Section label="Google Account & Play Services" />
        <div 
          onClick={onOpenGoogleServices}
          className="p-3 bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-black border border-blue-500/30 hover:border-cyan-400 rounded-xl cursor-pointer transition-all mb-2 flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-red-500 to-amber-500 p-[1.5px] flex items-center justify-center">
              <div className="w-full h-full bg-black rounded-[6px] flex items-center justify-center font-black text-xs text-white">
                G
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                Google Account & Play Store Hub
              </span>
              <span className="text-[9px] text-cyan-200/70">
                joshuapetersen119@gmail.com • Play Protect Certified & Extensions
              </span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            MANAGE
          </span>
        </div>

        <Section label="Connectivity & Uplinks" />
        <NavRow icon={Signal} title="Network & Internet" subtitle={`Wi-Fi: ${settings.wifi ? settings.wifiSsid : 'Off'} | 5G NR Active`} target="NETWORK" />
        <NavRow icon={Bluetooth} title="Connected Devices" subtitle="Bluetooth, NFC, Peripherals, Air Cast" target="DEVICES" />

        <Section label="Audio, Vision & Security" />
        <NavRow icon={Volume2} title="Sound & Audio Control" subtitle={`Profile: ${settings.soundProfile} | Spatial HRTF Active`} target="SOUND" />
        <NavRow icon={ShieldCheck} title="Biometrics & Security" subtitle={isBiometricUnlocked ? "Level 5 Omega Clearance Verified" : "Palm / Retina Scanner Lock Active"} target="BIOMETRICS" badge={isBiometricUnlocked ? "VERIFIED" : "LOCKED"} />
        <NavRow icon={Eye} title="VR & Spatial Computing (XR)" subtitle={`Passthrough: ${settings.passthroughMode} | IPD: ${settings.ipdValue}mm`} target="PASSTHROUGH" badge="XR OPTICS" />
        <NavRow icon={Lock} title="Privacy & Permissions" subtitle="Global Mutes, Location, App Permissions" target="PRIVACY" />

        <Section label="Performance & System Engine" />
        <NavRow icon={Terminal} title="Developer Options" subtitle={settings.devMode ? "ADB, Logcat, 4x MSAA, VR Overlay Active" : "Disabled"} target="DEV" badge="DEV MODE" />
        <NavRow icon={BrainCircuit} title="Genesis Intelligence Core" subtitle={`Voice: ${settings.voiceModel} | Tokens: ${settings.thinkingTokens}`} target="GENESIS" />
        <NavRow icon={Monitor} title="Display & Refresh Rate" subtitle={`Refresh: ${settings.displayRefreshRate} | Theme: ${settings.themeColor}`} target="DISPLAY" />
        <NavRow icon={BatteryCharging} title="Power & Battery Health" subtitle={`Battery: 98% Good | Profile: ${settings.powerProfile}`} target="POWER" />
        <NavRow icon={Database} title="Storage & Memory" subtitle={`${settings.usedStorageGb}GB / ${settings.totalStorageGb}GB | RAM: ${settings.ramUsageGb}GB`} target="STORAGE" />
        <NavRow icon={Globe} title="Accessibility & Language" subtitle="TalkBack, Color Correction, High Contrast" target="ACCESSIBILITY" />
        <NavRow icon={Info} title="About Headset & Android 15" subtitle="Android 15 XR Edition | Build AP2A.260723.001" target="ABOUT" />
      </div>
    );
  };

  // --- 1. NETWORK & INTERNET ---
  const renderNetwork = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Primary Uplinks" />
      <NavRow icon={Wifi} title="Wi-Fi Matrix" subtitle={settings.wifi ? `Connected: ${settings.wifiSsid} (${settings.wifiBand})` : "Radio Off"} target="WIFI" />
      <NavRow icon={Signal} title="Mobile Network & Dual SIM" subtitle={settings.mobileData ? "5G NR Sub-6GHz Encrypted" : "Disabled"} target="MOBILE" />
      <NavRow icon={Radio} title="Hotspot & Tethering" subtitle={settings.hotspotEnabled ? "Broadcasting: " + settings.hotspotSsid : "Off"} target="HOTSPOT" />

      <Section label="Tunnels & DNS" />
      <NavRow icon={Lock} title="VPN Configuration" subtitle={settings.vpnEnabled ? `Tunnel Active (${settings.vpnProtocol})` : "Direct Exposure"} target="VPN" />
      <NavRow icon={Cloud} title="Private DNS" subtitle={`Provider: ${settings.dnsProvider}`} target="DNS" />
      
      <Section label="Data Controls" />
      <ToggleRow icon={Activity} title="Data Saver" subtitle="Restricts background app data usage" active={settings.dataSaver} onToggle={(v: boolean) => updateSetting('dataSaver', v)} />
      <ToggleRow icon={Radio} title="Airplane Mode" subtitle="Disable all RF radios (Wi-Fi, Cellular, BT)" active={settings.airplaneMode} onToggle={(v: boolean) => updateSetting('airplaneMode', v)} />
    </div>
  );

  const renderWifi = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <ToggleRow icon={Wifi} title="Wi-Fi Radio" subtitle="Tri-Band 2.4GHz / 5GHz / 6GHz Scan" active={settings.wifi} onToggle={(v: boolean) => updateSetting('wifi', v)} />
      {settings.wifi && (
        <div className="mt-3 flex flex-col gap-2">
          <SelectRow label="Frequency Band" value={settings.wifiBand} options={['5GHz', '6GHz', 'Wi-Fi 7']} onChange={(v: any) => updateSetting('wifiBand', v)} />
          <Section label="Discovered Access Points" />
          {[
            { ssid: 'Genesis_XR_5G_Node', band: '6GHz (Wi-Fi 7)', secure: true, connected: true, rssi: '-42 dBm' },
            { ssid: 'Starlink_Orbit_Mesh_Alpha', band: '5GHz', secure: true, connected: false, rssi: '-58 dBm' },
            { ssid: 'Quantum_Uplink_Encrypted', band: '6GHz', secure: true, connected: false, rssi: '-64 dBm' },
            { ssid: 'Lab_Public_Guest', band: '2.4GHz', secure: false, connected: false, rssi: '-70 dBm' }
          ].map(net => (
            <div 
              key={net.ssid} 
              onClick={() => updateSetting('wifiSsid', net.ssid)}
              className={`flex items-center justify-between p-2.5 border rounded-lg cursor-pointer transition-all ${
                settings.wifiSsid === net.ssid ? 'bg-sky-500/20 border-sky-400' : 'bg-white/5 border-white/5 hover:border-sky-500/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <Wifi size={14} className={net.connected ? 'text-emerald-400 animate-pulse' : 'text-white/50'} />
                <div className="flex flex-col">
                  <span className="text-[11.5px] font-bold text-white/90">{net.ssid}</span>
                  <span className="text-[8.5px] text-white/40">{net.band} • {net.rssi}</span>
                </div>
              </div>
              {settings.wifiSsid === net.ssid ? (
                <span className="text-[8px] text-sky-300 font-bold bg-sky-500/30 px-2 py-0.5 rounded border border-sky-400">CONNECTED</span>
              ) : (
                <Lock size={12} className="opacity-40" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- 2. SOUND & AUDIO CONTROL ---
  const renderSound = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Sound Profile" />
      <SelectRow 
        label="Active Profile" 
        value={settings.soundProfile} 
        options={['NORMAL', 'VIBRATE', 'SILENT', 'DND']} 
        onChange={(v: any) => updateSetting('soundProfile', v)} 
      />

      <Section label="Volume Levels" />
      <SliderRow icon={Volume2} label="Media Volume" value={settings.mediaVolume} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('mediaVolume', v)} />
      <SliderRow icon={Bell} label="Notification Volume" value={settings.notificationVolume} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('notificationVolume', v)} />
      <SliderRow icon={Smartphone} label="Call / Ring Volume" value={settings.ringVolume} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('ringVolume', v)} />
      <SliderRow icon={Mic} label="Spatial Pass-through Mic" value={settings.spatialMicVolume} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('spatialMicVolume', v)} />

      <Section label="VR Spatial Audio & HRTF" />
      <ToggleRow icon={Sparkles} title="3D Spatial Audio" subtitle="Binaural HRTF spatial positioning" active={settings.spatialAudio} onToggle={(v: boolean) => updateSetting('spatialAudio', v)} />
      <SelectRow label="Head Tracking" value={settings.headTracking} options={['OFF', 'FIXED', 'DYNAMIC']} onChange={(v: any) => updateSetting('headTracking', v)} />
      <ToggleRow icon={Zap} title="Dolby Atmos Enhancement" subtitle="Dynamic room acoustics & spatial clarity" active={settings.dolbyAtmos} onToggle={(v: boolean) => updateSetting('dolbyAtmos', v)} />
      <SelectRow label="Equalizer Preset" value={settings.eqPreset} options={['FLAT', 'TACTICAL', 'BASS_BOOST', 'CYBER', 'VOCAL']} onChange={(v: any) => updateSetting('eqPreset', v)} />
      <SliderRow icon={Vibrate} label="Haptic Feedback Strength" value={settings.hapticStrength} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('hapticStrength', v)} />
    </div>
  );

  // --- 3. BIOMETRICS & SECURITY ---
  const renderBiometrics = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="High Security Biometric Vault" />
      <div className="p-3 bg-gradient-to-r from-cyan-950/60 via-indigo-950/40 to-black border border-cyan-500/40 rounded-xl mb-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={isBiometricUnlocked ? "text-emerald-400" : "text-cyan-400 animate-pulse"} size={18} />
            <span className="font-bold text-white text-xs">
              {isBiometricUnlocked ? "LEVEL 5 OMEGA CLEARANCE ACTIVE" : "RETINA & PALM BIOMETRIC SENSOR"}
            </span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
            isBiometricUnlocked ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-rose-500/20 text-rose-300 border border-rose-400/40"
          }`}>
            {isBiometricUnlocked ? "UNLOCKED" : "RESTRICTED"}
          </span>
        </div>
        <p className="text-[9.5px] text-white/60">
          Requires camera alignment to scan ocular vascular patterns or thermal palm ridges. Unlocks Sentience Core, Classified Repository, and System Overrides.
        </p>
        <button
          onClick={onOpenBiometrics}
          className="mt-1 w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-black text-[10px] uppercase tracking-wider rounded-lg transition-all shadow-[0_0_12px_cyan] flex items-center justify-center gap-1.5"
        >
          <Fingerprint size={14} />
          <span>{isBiometricUnlocked ? "RE-AUTHENTICATE BIOMETRICS" : "LAUNCH PALM / RETINA SCANNER"}</span>
        </button>
      </div>

      <Section label="Biometric Credentials" />
      <ToggleRow icon={Fingerprint} title="Fingerprint / Touch Sensor" subtitle="Primary biometric authentication" active={settings.fingerprintEnrolled} onToggle={(v: boolean) => updateSetting('fingerprintEnrolled', v)} />
      <ToggleRow icon={Eye} title="3D Face Unlock" subtitle="Infrared spatial depth face map" active={settings.faceUnlockEnabled} onToggle={(v: boolean) => updateSetting('faceUnlockEnabled', v)} />
      <ToggleRow icon={Sparkles} title="Eye Gaze Verification" subtitle="Iris biometric scan during headset mount" active={settings.eyeGazeAuth} onToggle={(v: boolean) => updateSetting('eyeGazeAuth', v)} />

      <Section label="Screen Lock Security" />
      <SelectRow label="Lock Type" value={settings.screenLockType} options={['NONE', 'PIN', 'PATTERN', 'BIOMETRIC']} onChange={(v: any) => updateSetting('screenLockType', v)} />
      <InputRow label="Current 4-Digit Security PIN" value={settings.screenLockPin} onChange={(v: string) => updateSetting('screenLockPin', v)} />
      <ToggleRow icon={Lock} title="App Lock & Encrypted Vault" subtitle="Require biometrics for sensitive XR apps" active={settings.appLockEnabled} onToggle={(v: boolean) => updateSetting('appLockEnabled', v)} />
    </div>
  );

  // --- 4. VR & SPATIAL COMPUTING (XR) ---
  const renderPassthrough = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Passthrough Cameras & Optics" />
      <SelectRow label="Camera Mode" value={settings.passthroughMode} options={['COLOR', 'MONO_EDGE', 'THERMAL', 'CYBER_CYAN']} onChange={(v: any) => updateSetting('passthroughMode', v)} />
      <SliderRow icon={Eye} label="Passthrough Opacity" value={settings.passthroughOpacity} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('passthroughOpacity', v)} />
      <SliderRow icon={Crosshair} label="IPD Hardware Calibration" value={settings.ipdValue} min={58} max={72} unit="mm" onChange={(v: number) => updateSetting('ipdValue', v)} />

      <Section label="Boundary / Guardian System" />
      <SelectRow label="Boundary Mode" value={settings.guardianMode} options={['ROOMSCALE', 'STATIONARY', 'OFF']} onChange={(v: any) => updateSetting('guardianMode', v)} />
      <SelectRow label="Proximity Sensitivity" value={settings.guardianSensitivity} options={['LOW', 'MEDIUM', 'HIGH']} onChange={(v: any) => updateSetting('guardianSensitivity', v)} />

      <Section label="Spatial Input & Display" />
      <ToggleRow icon={Eye} title="Stereoscopic 3D SBS Output" subtitle="Splits UI into side-by-side format for VR headsets with barrel lens distortion correction" active={settings.stereoscopicOutput} onToggle={toggleStereoscopic} />
      <ToggleRow icon={Eye} title="Eye Tracking" subtitle="Continuous foveal gaze input" active={settings.eyeTrackingEnabled} onToggle={(v: boolean) => updateSetting('eyeTrackingEnabled', v)} />
      <ToggleRow icon={MousePointer} title="Hand Gesture Tracking" subtitle="Camera pinch & air tap gestures" active={settings.handTrackingEnabled} onToggle={(v: boolean) => updateSetting('handTrackingEnabled', v)} />
      <SliderRow icon={Zap} label="Pinch Gesture Sensitivity" value={settings.pinchSensitivity} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('pinchSensitivity', v)} />
      <SelectRow label="Display Refresh Rate" value={settings.displayRefreshRate} options={['72HZ', '90HZ', '120HZ', '144HZ']} onChange={(v: any) => updateSetting('displayRefreshRate', v)} />
    </div>
  );

  // --- 5. DEVELOPER OPTIONS ---
  const renderDev = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <ToggleRow icon={Terminal} title="Developer Options Active" subtitle="Root & ADB debugging suite enabled" active={settings.devMode} onToggle={(v: boolean) => updateSetting('devMode', v)} />
      
      {settings.devMode && (
        <>
          <Section label="ADB & Wireless Debugging" />
          <ToggleRow icon={Cpu} title="USB Debugging" subtitle="Allow ADB over USB connection" active={settings.usbDebugging} onToggle={(v: boolean) => updateSetting('usbDebugging', v)} />
          <ToggleRow icon={Wifi} title="Wireless ADB" subtitle="Debugging listening on 192.168.1.104:5555" active={settings.wirelessAdb} onToggle={(v: boolean) => updateSetting('wirelessAdb', v)} />
          <ToggleRow icon={Zap} title="Stay Awake" subtitle="Screen never sleeps while charging" active={settings.stayAwake} onToggle={(v: boolean) => updateSetting('stayAwake', v)} />

          <Section label="VR Performance & Graphics" />
          <ToggleRow icon={Activity} title="VR Performance Overlay" subtitle="Show live FPS, Frame Time, GPU % on HUD" active={settings.vrPerfOverlay} onToggle={(v: boolean) => updateSetting('vrPerfOverlay', v)} />
          <SelectRow label="Foveated Rendering" value={settings.foveatedRendering} options={['OFF', 'LOW', 'MEDIUM', 'HIGH', 'EYE_TRACKED']} onChange={(v: any) => updateSetting('foveatedRendering', v)} />
          <ToggleRow icon={Sparkles} title="Force 4x MSAA" subtitle="Enable anti-aliasing in OpenXR apps" active={settings.force4xMsaa} onToggle={(v: boolean) => updateSetting('force4xMsaa', v)} />

          <Section label="Logcat Real-time Console" />
          <ToggleRow icon={FileText} title="Stream Logcat Logs" subtitle="Live kernel & XR compositor stream" active={settings.logcatStreaming} onToggle={(v: boolean) => updateSetting('logcatStreaming', v)} />
          
          <div className="p-2 bg-black/80 border border-sky-500/30 rounded-lg font-mono text-[9px] text-emerald-400 max-h-36 overflow-y-auto mt-1 flex flex-col gap-1">
            {logMessages.map((msg, i) => (
              <div key={i} className="truncate">{msg}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  // --- 6. GENESIS AI ---
  const renderGenesis = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Voice & Personality" />
      <SelectRow label="Voice Model" value={settings.voiceModel} options={['KORE', 'PUCK', 'FENRIR']} onChange={(v: any) => updateSetting('voiceModel', v)} />
      
      <div className="p-3 bg-gradient-to-r from-sky-900/30 to-purple-900/30 rounded-lg my-2 border border-sky-500/20">
        <div className="flex justify-between text-[9px] font-bold uppercase mb-1.5 text-sky-300">
          <span>Logic ({100 - settings.personalityLogic}%)</span>
          <span>Empathy ({settings.personalityLogic}%)</span>
        </div>
        <input 
          type="range" min={0} max={100} value={settings.personalityLogic} 
          onChange={(e) => updateSetting('personalityLogic', parseFloat(e.target.value))}
          className="w-full accent-purple-400 h-1.5 bg-black/50 rounded-full appearance-none cursor-pointer"
        />
      </div>

      <ToggleRow icon={VolumeX} title="Silent Assistant Mode" subtitle="Speak only when explicitly queried" active={isSarahSilent} onToggle={setIsSarahSilent} />

      <Section label="Reasoning Engine" />
      <SelectRow label="Thinking Token Budget" value={settings.thinkingTokens} options={['8K', '16K', '32K']} onChange={(v: any) => updateSetting('thinkingTokens', v)} />
      <SliderRow icon={Eye} label="Vision Confidence Floor" value={settings.visionConfidence} min={0.5} max={0.99} step={0.01} onChange={(v: number) => updateSetting('visionConfidence', v)} />
    </div>
  );

  // --- 7. DISPLAY & THEME ---
  const renderDisplay = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="HUD Theme Color" />
      <div className="grid grid-cols-5 gap-1.5 mb-3">
        {(['CYAN', 'AMBER', 'ROSE', 'GREEN', 'OLED_BLACK'] as const).map((color) => (
          <button 
            key={color}
            onClick={() => updateSetting('themeColor', color)}
            className={`py-2 rounded-lg border flex items-center justify-center font-bold text-[9px] transition-all ${
              settings.themeColor === color ? 'bg-sky-500/25 border-sky-400 text-white shadow-[0_0_10px_rgba(56,189,248,0.4)]' : 'bg-black/40 border-white/10 text-white/40'
            }`}
          >
            {color.replace('_', ' ')}
          </button>
        ))}
      </div>

      <Section label="Brightness & Refresh" />
      <SliderRow icon={Zap} label="Display Brightness" value={settings.brightness} min={0} max={100} unit="%" onChange={(v: number) => updateSetting('brightness', v)} />
      <ToggleRow icon={Moon} title="Night Light / Blue Filter" subtitle="Reduce strain during low-light VR sessions" active={settings.nightMode} onToggle={(v: boolean) => updateSetting('nightMode', v)} />
      <SelectRow label="Screen Refresh Rate" value={settings.displayRefreshRate} options={['72HZ', '90HZ', '120HZ', '144HZ']} onChange={(v: any) => updateSetting('displayRefreshRate', v)} />
      <SliderRow icon={Layers} label="UI Density Scale" value={settings.uiScale} min={0.8} max={1.5} step={0.05} onChange={(v: number) => updateSetting('uiScale', v)} />
    </div>
  );

  // --- 8. POWER & BATTERY ---
  const renderPower = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BatteryCharging size={24} className="text-emerald-400 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[14px] font-black text-white">98% Charged</span>
            <span className="text-[9px] text-emerald-300 font-mono">Health: {settings.batteryHealthPct}% | Temp: {settings.batteryTempC}°C</span>
          </div>
        </div>
        <span className="text-[8px] font-bold uppercase bg-emerald-400 text-black px-2 py-0.5 rounded">GOOD</span>
      </div>

      <Section label="Power Modes" />
      <SelectRow label="Performance Profile" value={settings.powerProfile} options={['PERFORMANCE', 'BALANCED', 'SAVER', 'ULTRA_VR']} onChange={(v: any) => updateSetting('powerProfile', v)} />
      <ToggleRow icon={Battery} title="Battery Saver Mode" subtitle="Limit background sync and reduce refresh to 72Hz" active={settings.batterySaver} onToggle={(v: boolean) => updateSetting('batterySaver', v)} />
      <ToggleRow icon={Zap} title="Smart Charge Limit (80%)" subtitle="Preserve lithium battery lifespan" active={settings.chargeLimit80} onToggle={(v: boolean) => updateSetting('chargeLimit80', v)} />
    </div>
  );

  // --- 9. PRIVACY & PERMISSIONS ---
  const renderPrivacy = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Global Hardware Switches" />
      <ToggleRow icon={Mic} title="Global Microphone Access" subtitle="Hardware cut-off for all apps" active={!settings.globalMicMute} onToggle={(v: boolean) => updateSetting('globalMicMute', !v)} />
      <ToggleRow icon={EyeOff} title="Global Camera Access" subtitle="Hardware cut-off for passthrough cameras" active={!settings.globalCamMute} onToggle={(v: boolean) => updateSetting('globalCamMute', !v)} />
      <ToggleRow icon={Compass} title="Location Services" subtitle="Spatial GPS & indoor positioning" active={settings.locationEnabled} onToggle={(v: boolean) => updateSetting('locationEnabled', v)} />
      <ToggleRow icon={Shield} title="Incognito Mode" subtitle="Zero session data persistence" active={settings.incognitoMode} onToggle={(v: boolean) => updateSetting('incognitoMode', v)} />
    </div>
  );

  // --- 10. STORAGE & ACCESSIBILITY & ABOUT ---
  const renderStorage = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Storage Breakdown" />
      <div className="p-3 bg-white/5 border border-white/10 rounded-xl mb-3">
        <div className="flex justify-between text-[11px] font-bold text-white mb-1">
          <span>{settings.usedStorageGb} GB used</span>
          <span>{settings.totalStorageGb} GB total</span>
        </div>
        <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden flex">
          <div className="h-full bg-sky-400 w-[45%]" title="System & Apps" />
          <div className="h-full bg-purple-400 w-[20%]" title="Spatial Cache" />
          <div className="h-full bg-emerald-400 w-[10%]" title="Media" />
        </div>
        <div className="flex gap-3 text-[8px] font-mono text-white/50 mt-2">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-sky-400"/> System (22.8GB)</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-400"/> Spatial Cache (8.4GB)</span>
        </div>
      </div>

      <button 
        onClick={() => {
          updateSetting('cacheCleared', true);
          setTimeout(() => updateSetting('cacheCleared', false), 2000);
        }}
        className="py-2.5 px-3 bg-sky-500/20 border border-sky-400 text-sky-300 font-bold text-[10px] rounded-lg hover:bg-sky-500/30 transition-all flex items-center justify-center gap-2"
      >
        <RefreshCw size={14} className={settings.cacheCleared ? "animate-spin" : ""} />
        {settings.cacheCleared ? "CACHE CLEARED (+4.2GB FREED)" : "CLEAR SPATIAL & APP CACHE"}
      </button>
    </div>
  );

  const renderAccessibility = () => (
    <div className="flex flex-col animate-in fade-in duration-200">
      <Section label="Accessibility Suite" />
      <SelectRow label="System Language" value={settings.language} options={['EN_US', 'EN_UK', 'JP', 'ES', 'DE']} onChange={(v: any) => updateSetting('language', v)} />
      <ToggleRow icon={Mic} title="TalkBack Voice Reader" subtitle="Spoken feedback for visual HUD elements" active={settings.talkback} onToggle={(v: boolean) => updateSetting('talkback', v)} />
      <ToggleRow icon={Sun} title="High Contrast Sun Boost Mode" subtitle="Boosts font stroke weight & 98% text background opacity for bright outdoor environments" active={settings.highContrastText} onToggle={toggleHighContrast} />
      <SelectRow label="Color Correction" value={settings.colorCorrection} options={['NONE', 'PROTANOPIA', 'DEUTERANOPIA', 'TRITANOPIA']} onChange={(v: any) => updateSetting('colorCorrection', v)} />
    </div>
  );

  const renderAbout = () => (
    <div className="flex flex-col animate-in fade-in duration-200 gap-2">
      <div className="p-4 bg-sky-500/10 border border-sky-500/20 rounded-xl flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center font-black text-black text-[16px] shadow-[0_0_15px_cyan]">
          XR
        </div>
        <div className="flex flex-col">
          <span className="text-[13px] font-black text-white">Genesis-XR Pro</span>
          <span className="text-[9.5px] font-mono text-sky-300">Android 15 (XR Spatial Edition)</span>
        </div>
      </div>

      <div className="p-3 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-1.5 font-mono text-[9.5px]">
        <div className="flex justify-between"><span className="text-white/40">Build Number</span><span className="text-white font-bold">AP2A.260723.001</span></div>
        <div className="flex justify-between"><span className="text-white/40">Kernel Version</span><span className="text-white font-bold">6.6.18-android-xr-generic</span></div>
        <div className="flex justify-between"><span className="text-white/40">OpenXR Version</span><span className="text-white font-bold">1.1.38 (3D Spatial API)</span></div>
        <div className="flex justify-between"><span className="text-white/40">Device IP Address</span><span className="text-sky-300 font-bold">192.168.1.104</span></div>
      </div>

      <button className="py-2.5 px-3 bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-bold text-[10px] rounded-lg flex items-center justify-center gap-2 mt-2">
        <Check size={14} /> SYSTEM IS UP TO DATE (ANDROID 15 XR)
      </button>
    </div>
  );

  // --- ROUTER / SCREEN SWITCHER ---
  const renderContent = () => {
    switch (currentScreen) {
      case 'MAIN': return renderMain();
      
      // NETWORK
      case 'NETWORK': return renderNetwork();
      case 'WIFI': return renderWifi();
      case 'MOBILE': return renderNetwork();
      case 'HOTSPOT': return renderNetwork();
      case 'VPN': return renderNetwork();
      case 'DNS': return renderNetwork();

      // SOUND & AUDIO
      case 'SOUND': return renderSound();
      case 'SPATIAL_AUDIO': return renderSound();

      // BIOMETRICS & SECURITY
      case 'BIOMETRICS': return renderBiometrics();
      case 'LOCKSCREEN': return renderBiometrics();

      // VR & PASSTHROUGH
      case 'PASSTHROUGH': return renderPassthrough();
      case 'GUARDIAN': return renderPassthrough();

      // DEV OPTIONS
      case 'DEV': return renderDev();

      // GENESIS AI
      case 'GENESIS': return renderGenesis();

      // DISPLAY & THEME
      case 'DISPLAY': return renderDisplay();

      // POWER & BATTERY
      case 'POWER': return renderPower();

      // PRIVACY
      case 'PRIVACY': return renderPrivacy();

      // STORAGE
      case 'STORAGE': return renderStorage();

      // ACCESSIBILITY
      case 'ACCESSIBILITY': return renderAccessibility();

      // ABOUT
      case 'ABOUT': return renderAbout();

      default: return renderMain();
    }
  };

  return (
    <div className="h-[560px] w-[420px] bg-[#0c0c0c] border border-sky-500/30 rounded-[20px] overflow-hidden flex flex-col font-sans select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
      {/* Android 15 Status Bar */}
      <div className="h-6 flex justify-between items-center px-4 bg-black/80 text-[9.5px] text-white/80 font-mono font-bold border-b border-sky-500/10 z-20 shrink-0">
        <span className="text-sky-300">20:35 • XR</span>
        <div className="flex items-center gap-2.5">
          <Wifi size={11} className={settings.wifi ? "text-sky-300" : "opacity-30"} />
          <Bluetooth size={11} className={settings.bluetooth ? "text-sky-300" : "opacity-30"} />
          <Signal size={11} className={settings.mobileData ? "text-sky-300" : "opacity-30"} />
          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <span>98%</span>
            <Battery size={11} />
          </div>
        </div>
      </div>

      {/* Instant Search Bar (Active on Root Screen) */}
      <div className="px-3 py-2 bg-black/60 border-b border-sky-500/10 shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-sky-500/20 rounded-lg px-2.5 py-1.5 focus-within:border-sky-400 transition-colors">
          <Search size={14} className="text-sky-400/70" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Android & VR settings..."
            className="w-full bg-transparent text-[11px] text-white placeholder-white/30 outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-white/40 hover:text-white">
              <RotateCcw size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-[#080808]">
        <Header title={
          currentScreen === 'MAIN' ? 'SYSTEM SETTINGS' : 
          currentScreen.replace(/_/g, ' ')
        } />
        
        <div className="p-2.5">
          {renderContent()}
        </div>
      </div>

      {/* Android 15 Gesture Navigation Bar */}
      <div className="h-9 bg-black/90 flex justify-center items-center gap-16 border-t border-sky-500/15 z-20 shrink-0">
        {/* Back */}
        <button 
          onClick={goBack} 
          className="p-1.5 text-sky-400/60 hover:text-sky-300 hover:bg-sky-500/10 rounded-full transition-all active:scale-90"
          title="Back"
        >
          <div className="border-l-2 border-b-2 border-current w-2.5 h-2.5 transform rotate-45 translate-x-0.5" />
        </button>

        {/* Home */}
        <button 
          onClick={() => { setScreenStack(['MAIN']); setSearchQuery(''); }} 
          className="w-3.5 h-3.5 rounded-full border-2 border-sky-400/60 hover:bg-sky-400/30 transition-all active:scale-90"
          title="Home"
        />

        {/* Recents */}
        <button 
          onClick={() => setScreenStack(['MAIN'])}
          className="w-3 h-3 border-2 border-sky-400/60 rounded-[2px] hover:bg-sky-400/30 transition-all active:scale-90"
          title="Recents"
        />
      </div>
    </div>
  );
};

export default SettingsMenu;
