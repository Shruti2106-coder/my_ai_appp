import React, { useState } from 'react';
import { AppMode, Language, AppSettings } from './types';
import AnalysisView from './components/AnalysisView';
import LiveAssistant from './components/LiveAssistant';
import SettingsModal from './components/SettingsModal';

// Icons
const IconEye = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>;
const IconText = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
const IconShield = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const IconMic = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>;
const IconGear = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.OBJECT_RECOGNITION);
  const [language, setLanguage] = useState<Language>('English');
  const [status, setStatus] = useState("Ready");
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    speechRate: 1.0,
    voicePitch: 0
  });

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      <SettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={setSettings}
      />

      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center bg-slate-900 border-b border-slate-800 shadow-md z-10">
        <div>
           <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">VisionVoice</h1>
           <p className="text-xs text-slate-400">{status}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="bg-slate-800 text-slate-200 text-sm rounded-lg px-3 py-1.5 border border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Marathi">Marathi</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
          </select>
          
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-500 transition-colors"
            aria-label="Settings"
          >
            <IconGear />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden relative">
        {mode === AppMode.LIVE_ASSISTANT ? (
          <LiveAssistant 
             isActive={true} 
             onStatusChange={setStatus} 
             settings={settings}
          />
        ) : (
          <AnalysisView 
             mode={mode} 
             language={language} 
             settings={settings}
          />
        )}
      </main>

      {/* Navigation / Mode Switcher */}
      <nav className="bg-slate-900 border-t border-slate-800 pb-safe">
        <div className="flex justify-around items-center p-2">
           <button 
             onClick={() => setMode(AppMode.OBJECT_RECOGNITION)}
             className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${mode === AppMode.OBJECT_RECOGNITION ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <IconEye />
             <span className="text-[10px] font-bold tracking-wide">OBJECTS</span>
           </button>

           <button 
             onClick={() => setMode(AppMode.TEXT_READING)}
             className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${mode === AppMode.TEXT_READING ? 'bg-blue-600/20 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <IconText />
             <span className="text-[10px] font-bold tracking-wide">READ</span>
           </button>

           <button 
             onClick={() => setMode(AppMode.SAFE_MODE)}
             className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${mode === AppMode.SAFE_MODE ? 'bg-red-600/20 text-red-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <IconShield />
             <span className="text-[10px] font-bold tracking-wide">SAFETY</span>
           </button>

           <button 
             onClick={() => setMode(AppMode.LIVE_ASSISTANT)}
             className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${mode === AppMode.LIVE_ASSISTANT ? 'bg-green-600/20 text-green-400' : 'text-slate-500 hover:text-slate-300'}`}
           >
             <IconMic />
             <span className="text-[10px] font-bold tracking-wide">LIVE</span>
           </button>
        </div>
      </nav>
    </div>
  );
};

export default App;
