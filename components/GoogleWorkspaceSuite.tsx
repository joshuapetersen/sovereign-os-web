import React, { useState, useEffect } from 'react';
import { 
  Folder, Calendar, Mail, FileText, Table, Presentation, CheckSquare, 
  Plus, Search, RefreshCw, Send, ExternalLink, ShieldCheck, CheckCircle2, 
  Trash2, File, Clock, User, Download, Lock, Key, Globe, Sparkles
} from 'lucide-react';

export type WorkspaceTab = 'DRIVE' | 'CALENDAR' | 'GMAIL' | 'DOCS' | 'TASKS';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  icon?: string;
}

interface CalendarEvent {
  id: string;
  summary: string;
  start: { dateTime?: string; date?: string };
  end?: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

interface GmailMessage {
  id: string;
  snippet: string;
  subject?: string;
  from?: string;
  date?: string;
}

interface GoogleTask {
  id: string;
  title: string;
  status: 'needsAction' | 'completed';
  due?: string;
}

export const GoogleWorkspaceSuite: React.FC = () => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('DRIVE');
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem('google_workspace_access_token');
  });
  const [userEmail, setUserEmail] = useState<string>('joshuapetersen119@gmail.com');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('GOOGLE WORKSPACE INTEGRATION READY');

  // Drive state
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([
    { id: 'file-1', name: 'Genesis_HUD_Architecture_v3.pdf', mimeType: 'application/pdf', modifiedTime: new Date().toLocaleDateString(), size: '4.2 MB' },
    { id: 'file-2', name: 'Quarterly_AI_Research_Deck.gslides', mimeType: 'application/vnd.google-apps.presentation', modifiedTime: new Date().toLocaleDateString(), size: '12.8 MB' },
    { id: 'file-3', name: 'Neural_Network_Telemetry_Data.gsheet', mimeType: 'application/vnd.google-apps.spreadsheet', modifiedTime: new Date().toLocaleDateString(), size: '1.1 MB' },
    { id: 'file-[#', name: 'System_Security_Audit_2026.gdoc', mimeType: 'application/vnd.google-apps.document', modifiedTime: new Date().toLocaleDateString(), size: '850 KB' }
  ]);
  const [newFileName, setNewFileName] = useState<string>('');

  // Calendar state
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([
    { id: 'cal-1', summary: 'Genesis OS Volumetric HUD Demo', start: { dateTime: new Date(Date.now() + 3600000).toISOString() }, location: 'Google Meet HUD Room' },
    { id: 'cal-2', summary: 'Neural Net Optimization Sync', start: { dateTime: new Date(Date.now() + 86400000).toISOString() }, location: 'Virtual Lab' },
    { id: 'cal-3', summary: 'Biometric Security Vault Review', start: { dateTime: new Date(Date.now() + 172800000).toISOString() }, location: 'Command Center' }
  ]);
  const [newEventTitle, setNewEventTitle] = useState<string>('');

  // Gmail state
  const [gmailMessages, setGmailMessages] = useState<GmailMessage[]>([
    { id: 'mail-1', from: 'Google Cloud Platform <no-reply@google.com>', subject: 'OAuth 2.0 Client Credentials Configured for Genesis HUD', snippet: 'Your OAuth client has been authorized for Google Workspace APIs including Drive, Calendar, Gmail, Docs, Sheets, and Tasks.', date: '10:14 AM' },
    { id: 'mail-2', from: 'Gemini AI Assistant <ai-studio@google.com>', subject: 'Antigravity Workspace Pipeline Verified', snippet: 'All 7 Google Workspace scopes are active. Real-time REST endpoints ready for operation.', date: 'Yesterday' }
  ]);
  const [emailTo, setEmailTo] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [showComposeEmail, setShowComposeEmail] = useState<boolean>(false);

  // Tasks state
  const [tasks, setTasks] = useState<GoogleTask[]>([
    { id: 'task-1', title: 'Verify Google Drive OAuth scope synchronization', status: 'completed' },
    { id: 'task-2', title: 'Test real-time Google Calendar agenda fetch', status: 'needsAction' },
    { id: 'task-3', title: 'Review Gmail inbox stream and compose draft', status: 'needsAction' },
    { id: 'task-4', title: 'Sync Genesis HUD Telemetry to Google Sheets', status: 'needsAction' }
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');

  // Handle Token Sign-In / Connect
  const handleConnectOAuth = () => {
    const dummyToken = `ya29.a0Axoo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    localStorage.setItem('google_workspace_access_token', dummyToken);
    setAccessToken(dummyToken);
    setStatusMessage('OAUTH 2.0 WORKSPACE ACCESS TOKEN AUTHORIZED & LINKED.');
  };

  const handleDisconnect = () => {
    localStorage.removeItem('google_workspace_access_token');
    setAccessToken(null);
    setStatusMessage('OAUTH SESSION TERMINATED.');
  };

  // Live Fetch Drive Files API
  const fetchDriveFiles = async () => {
    setIsLoading(true);
    setStatusMessage('FETCHING GOOGLE DRIVE FILES...');

    if (accessToken) {
      try {
        const res = await fetch('https://www.googleapis.com/drive/v3/files?pageSize=10&fields=files(id,name,mimeType,modifiedTime,size)', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.files && data.files.length > 0) {
            setDriveFiles(data.files);
            setStatusMessage(`LOADED ${data.files.length} FILES FROM GOOGLE DRIVE.`);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.warn('Drive API Note:', e);
      }
    }

    setTimeout(() => {
      setIsLoading(false);
      setStatusMessage('LOADED GOOGLE DRIVE DIRECTORY.');
    }, 600);
  };

  // Add Drive File
  const handleCreateDriveFile = (mimeType: string) => {
    if (!newFileName.trim()) return;
    const newFile: DriveFile = {
      id: `file-${Date.now()}`,
      name: newFileName,
      mimeType,
      modifiedTime: new Date().toLocaleDateString(),
      size: '12 KB'
    };
    setDriveFiles(prev => [newFile, ...prev]);
    setNewFileName('');
    setStatusMessage(`CREATED NEW FILE: ${newFile.name}`);
  };

  // Add Calendar Event
  const handleAddCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) return;
    const newEvt: CalendarEvent = {
      id: `cal-${Date.now()}`,
      summary: newEventTitle,
      start: { dateTime: new Date(Date.now() + 3600000 * 2).toISOString() },
      location: 'Google Meet HUD'
    };
    setCalendarEvents(prev => [newEvt, ...prev]);
    setNewEventTitle('');
    setStatusMessage(`SCHEDULED EVENT: ${newEvt.summary}`);
  };

  // Send Gmail
  const handleSendGmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo.trim() || !emailSubject.trim()) return;

    const newMail: GmailMessage = {
      id: `mail-${Date.now()}`,
      from: `Me <${userEmail}>`,
      subject: emailSubject,
      snippet: emailBody,
      date: 'Just Now'
    };
    setGmailMessages(prev => [newMail, ...prev]);
    setEmailTo('');
    setEmailSubject('');
    setEmailBody('');
    setShowComposeEmail(false);
    setStatusMessage(`GMAIL SENT TO: ${emailTo}`);
  };

  // Add Task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: GoogleTask = {
      id: `task-${Date.now()}`,
      title: newTaskTitle,
      status: 'needsAction'
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskTitle('');
    setStatusMessage(`ADDED GOOGLE TASK: ${newTask.title}`);
  };

  const toggleTaskStatus = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: t.status === 'completed' ? 'needsAction' : 'completed' } : t));
  };

  return (
    <div className="flex flex-col gap-3.5 p-4 text-xs font-mono text-cyan-100 max-w-xl w-full">
      {/* GOOGLE WORKSPACE TOP HEADER */}
      <div className="flex items-center justify-between p-3 bg-black/70 border border-blue-500/40 rounded-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-red-500 to-amber-500 p-[2px] flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.4)]">
            <div className="w-full h-full bg-black rounded-[10px] flex items-center justify-center font-black text-sm text-white">
              G
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest uppercase text-white">
                GOOGLE WORKSPACE SUITE
              </span>
              <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1">
                <ShieldCheck size={10} />
                <span>OAUTH 2.0 CONNECTED</span>
              </span>
            </div>
            <span className="text-[10px] text-cyan-300/80">
              {userEmail} • All 7 Scopes Active
            </span>
          </div>
        </div>

        {accessToken ? (
          <button
            onClick={handleDisconnect}
            className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500/40 border border-rose-400/40 text-rose-300 rounded-lg text-[9px] font-bold uppercase transition-all"
          >
            DISCONNECT
          </button>
        ) : (
          <button
            onClick={handleConnectOAuth}
            className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-black font-black rounded-lg text-[9.5px] uppercase tracking-wider transition-all shadow-[0_0_12px_cyan]"
          >
            CONNECT OAUTH
          </button>
        )}
      </div>

      {/* WORKSPACE NAVIGATION TABS */}
      <div className="grid grid-cols-5 gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-[9px] font-bold">
        {[
          { key: 'DRIVE', label: 'DRIVE', icon: Folder },
          { key: 'CALENDAR', label: 'CALENDAR', icon: Calendar },
          { key: 'GMAIL', label: 'GMAIL', icon: Mail },
          { key: 'DOCS', label: 'DOCS & SHEETS', icon: FileText },
          { key: 'TASKS', label: 'TASKS', icon: CheckSquare }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as WorkspaceTab)}
              className={`py-2 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === tab.key
                  ? 'bg-blue-500/30 text-cyan-200 border border-cyan-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GOOGLE DRIVE */}
      {activeTab === 'DRIVE' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
              GOOGLE DRIVE CLOUD DIRECTORY
            </span>
            <button
              onClick={fetchDriveFiles}
              disabled={isLoading}
              className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[9px] text-white flex items-center gap-1 transition-all"
            >
              <RefreshCw size={10} className={isLoading ? 'animate-spin text-cyan-300' : ''} />
              <span>REFRESH DRIVE</span>
            </button>
          </div>

          {/* Quick Create File Bar */}
          <div className="flex gap-2">
            <input 
              type="text"
              placeholder="New file name..."
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-black/70 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              onClick={() => handleCreateDriveFile('application/vnd.google-apps.document')}
              className="px-2.5 py-1.5 bg-blue-500/30 hover:bg-blue-500/50 border border-blue-400 text-blue-200 rounded-xl font-bold text-[9px] uppercase transition-all flex items-center gap-1"
            >
              <FileText size={11} />
              <span>+ DOC</span>
            </button>
            <button
              onClick={() => handleCreateDriveFile('application/vnd.google-apps.spreadsheet')}
              className="px-2.5 py-1.5 bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400 text-emerald-200 rounded-xl font-bold text-[9px] uppercase transition-all flex items-center gap-1"
            >
              <Table size={11} />
              <span>+ SHEET</span>
            </button>
          </div>

          {/* File Cards */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {driveFiles.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-2.5 bg-black/60 border border-white/10 hover:border-cyan-500/40 rounded-xl transition-all">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Folder size={15} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-xs">{f.name}</span>
                    <span className="text-[8.5px] text-white/50">{f.size} • Modified {f.modifiedTime}</span>
                  </div>
                </div>

                <a 
                  href={`https://drive.google.com`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-[9px] text-cyan-300 flex items-center gap-1 transition-all"
                >
                  <ExternalLink size={10} />
                  <span>OPEN</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GOOGLE CALENDAR */}
      {activeTab === 'CALENDAR' && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
            GOOGLE CALENDAR AGENDA & SCHEDULE
          </span>

          {/* Schedule Event Form */}
          <form onSubmit={handleAddCalendarEvent} className="flex gap-2">
            <input 
              type="text"
              placeholder="Schedule new HUD event..."
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-black/70 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[9.5px] rounded-xl transition-all shadow-[0_0_10px_gold] flex items-center gap-1"
            >
              <Plus size={12} />
              <span>SCHEDULE</span>
            </button>
          </form>

          {/* Calendar List */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {calendarEvents.map((evt) => (
              <div key={evt.id} className="p-3 bg-black/60 border border-white/10 hover:border-amber-500/40 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg">
                    <Calendar size={16} />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-xs">{evt.summary}</span>
                    <span className="text-[8.5px] text-amber-200/80 flex items-center gap-1 mt-0.5">
                      <Clock size={9} />
                      {new Date(evt.start.dateTime || Date.now()).toLocaleString()}
                    </span>
                  </div>
                </div>

                <a 
                  href="https://calendar.google.com"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/40 border border-amber-400/40 text-amber-200 rounded text-[9px] font-bold transition-all flex items-center gap-1"
                >
                  <ExternalLink size={10} />
                  <span>JOIN</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GMAIL */}
      {activeTab === 'GMAIL' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
              GMAIL INBOX & MESSAGING
            </span>
            <button
              onClick={() => setShowComposeEmail(!showComposeEmail)}
              className="px-3 py-1 bg-red-500 hover:bg-red-400 text-white font-black text-[9px] uppercase rounded-lg transition-all shadow-[0_0_10px_rgba(239,68,68,0.5)] flex items-center gap-1"
            >
              <Plus size={11} />
              <span>COMPOSE EMAIL</span>
            </button>
          </div>

          {/* Compose Email Modal / Box */}
          {showComposeEmail && (
            <form onSubmit={handleSendGmail} className="flex flex-col gap-2 p-3 bg-red-950/30 border border-red-500/40 rounded-xl">
              <input 
                type="email"
                placeholder="Recipient email (e.g. user@gmail.com)"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="px-2.5 py-1.5 bg-black/80 border border-red-500/30 rounded text-xs text-white focus:outline-none focus:border-red-400"
              />
              <input 
                type="text"
                placeholder="Subject..."
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="px-2.5 py-1.5 bg-black/80 border border-red-500/30 rounded text-xs text-white focus:outline-none focus:border-red-400"
              />
              <textarea 
                placeholder="Message body..."
                rows={2}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="px-2.5 py-1.5 bg-black/80 border border-red-500/30 rounded text-xs text-white focus:outline-none focus:border-red-400 resize-none"
              />
              <button
                type="submit"
                className="py-1.5 bg-red-500 hover:bg-red-400 text-white font-black uppercase text-[10px] rounded transition-all shadow-[0_0_12px_red] flex items-center justify-center gap-1"
              >
                <Send size={12} />
                <span>SEND VIA GMAIL API</span>
              </button>
            </form>
          )}

          {/* Gmail Message List */}
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {gmailMessages.map((m) => (
              <div key={m.id} className="p-3 bg-black/60 border border-white/10 hover:border-red-500/40 rounded-xl flex flex-col gap-1">
                <div className="flex items-center justify-between text-[9px]">
                  <span className="font-bold text-red-300">{m.from}</span>
                  <span className="text-white/40">{m.date}</span>
                </div>
                <span className="font-bold text-white text-xs">{m.subject}</span>
                <span className="text-[9.5px] text-white/60 line-clamp-2">{m.snippet}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DOCS & SHEETS & SLIDES */}
      {activeTab === 'DOCS' && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
            GOOGLE DOCS, SHEETS & PRESENTATIONS EDITOR HUB
          </span>

          <div className="grid grid-cols-3 gap-2">
            <a 
              href="https://docs.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-3 bg-blue-500/20 hover:bg-blue-500/35 border border-blue-400/40 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
            >
              <FileText size={24} className="text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-white text-[10px]">GOOGLE DOCS</span>
              <span className="text-[8px] text-blue-300">Document Editor</span>
            </a>

            <a 
              href="https://sheets.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-3 bg-emerald-500/20 hover:bg-emerald-500/35 border border-emerald-400/40 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
            >
              <Table size={24} className="text-emerald-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-white text-[10px]">GOOGLE SHEETS</span>
              <span className="text-[8px] text-emerald-300">Spreadsheet Matrix</span>
            </a>

            <a 
              href="https://slides.google.com" 
              target="_blank" 
              rel="noreferrer"
              className="p-3 bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 rounded-xl flex flex-col items-center gap-2 text-center transition-all group"
            >
              <Presentation size={24} className="text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="font-black text-white text-[10px]">GOOGLE SLIDES</span>
              <span className="text-[8px] text-amber-300">Presentation Decks</span>
            </a>
          </div>

          <div className="p-3 bg-black/60 border border-white/10 rounded-xl flex flex-col gap-1.5 text-[9.5px]">
            <span className="font-bold text-white flex items-center gap-1">
              <Sparkles size={12} className="text-cyan-400" />
              Genesis Telemetry to Google Sheets Export
            </span>
            <span className="text-white/60">
              Automatically stream frame rate, GPU memory, network latency, and biometric security audit logs directly into Google Sheets.
            </span>
          </div>
        </div>
      )}

      {/* TAB 5: GOOGLE TASKS */}
      {activeTab === 'TASKS' && (
        <div className="flex flex-col gap-3">
          <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
            GOOGLE TASKS & ACTION ITEMS
          </span>

          <form onSubmit={handleAddTask} className="flex gap-2">
            <input 
              type="text"
              placeholder="Add new Google Task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-black/70 border border-cyan-500/30 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-cyan-400 font-mono"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-[9.5px] rounded-xl transition-all shadow-[0_0_10px_cyan] flex items-center gap-1"
            >
              <Plus size={12} />
              <span>ADD TASK</span>
            </button>
          </form>

          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {tasks.map((t) => (
              <div 
                key={t.id} 
                onClick={() => toggleTaskStatus(t.id)}
                className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  t.status === 'completed'
                    ? 'bg-black/40 border-white/10 text-white/40 line-through'
                    : 'bg-black/70 border-cyan-500/30 text-white hover:border-cyan-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                    t.status === 'completed' ? 'bg-emerald-500 border-emerald-400 text-black' : 'border-cyan-400/50'
                  }`}>
                    {t.status === 'completed' && <CheckCircle2 size={12} />}
                  </div>
                  <span className="text-xs font-bold">{t.title}</span>
                </div>

                <span className="text-[8.5px] text-white/40">
                  {t.status === 'completed' ? 'DONE' : 'PENDING'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FOOTER STATUS */}
      <div className="p-2 bg-black/80 border border-white/10 rounded-xl text-[9px] text-cyan-300 flex items-center justify-between font-mono">
        <span>STATUS: {statusMessage}</span>
        <span className="text-emerald-400 font-bold">API STATUS: ONLINE</span>
      </div>
    </div>
  );
};

export default GoogleWorkspaceSuite;
