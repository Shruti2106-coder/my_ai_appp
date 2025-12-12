import React, { useState, useEffect, useRef } from 'react';
import CameraFeed from './CameraFeed';
import { AppMode, Language, AppSettings } from '../types';
import { analyzeImage, generateSpeech } from '../services/geminiService';
import { decodeAudioData } from '../services/audioUtils';

interface AnalysisViewProps {
  mode: AppMode;
  language: Language;
  settings: AppSettings;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ mode, language, settings }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [resultText, setResultText] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  
  // Apply settings changes immediately to currently playing audio
  useEffect(() => {
    if (currentSourceRef.current && isPlaying) {
      const source = currentSourceRef.current;
      // AudioParams typically have .value for immediate change
      source.playbackRate.value = settings.speechRate;
      source.detune.value = settings.voicePitch * 100; // Convert semitones to cents
    }
  }, [settings, isPlaying]);

  const handleCapture = async (base64Image: string) => {
    if (analyzing) return;
    
    // Stop any existing audio
    if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch(e) {}
        currentSourceRef.current = null;
        setIsPlaying(false);
    }
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(50);
    
    setAnalyzing(true);
    setResultText('Analyzing...');
    
    try {
      // 1. Analyze Image
      const text = await analyzeImage(base64Image, mode, language);
      setResultText(text);
      
      // 2. Generate Speech (TTS)
      const audioData = await generateSpeech(text);
      
      // 3. Play Audio
      if (audioData) {
        playAudio(audioData);
      }
    } catch (error) {
      setResultText("Something went wrong.");
    } finally {
      setAnalyzing(false);
    }
  };

  const playAudio = async (data: Uint8Array) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    const ctx = audioContextRef.current;
    
    // Ensure context is running (mobile browsers suspend it)
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    try {
      const audioBuffer = await decodeAudioData(data, ctx, 24000);
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      
      // Apply initial settings
      source.playbackRate.value = settings.speechRate;
      source.detune.value = settings.voicePitch * 100;
      
      source.connect(ctx.destination);
      source.onended = () => {
        setIsPlaying(false);
        currentSourceRef.current = null;
      };
      
      currentSourceRef.current = source;
      setIsPlaying(true);
      source.start(0);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  // Re-announce mode when it changes and clear previous results
  useEffect(() => {
     setResultText('');
     if (currentSourceRef.current) {
         try { currentSourceRef.current.stop(); } catch(e) {}
         setIsPlaying(false);
     }
  }, [mode]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Camera Area - Flex grow to fill space */}
      <div className="flex-grow relative overflow-hidden m-4 rounded-2xl border-2 border-slate-700 shadow-2xl">
        <CameraFeed 
            onCapture={handleCapture} 
            isActive={true} 
            isLive={false} 
        />
        
        {/* Loading Overlay */}
        {analyzing && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-30">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-white text-xl font-semibold animate-pulse">VisionVoice is Thinking...</p>
            </div>
        )}
      </div>

      {/* Result Card */}
      <div className="min-h-[200px] bg-slate-800 rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-slate-400 text-sm font-bold uppercase tracking-wider">{mode.replace('_', ' ')}</h2>
            {isPlaying && <span className="text-green-400 text-xs font-bold animate-pulse">PLAYING AUDIO</span>}
        </div>
        
        <div className="bg-slate-900/50 p-4 rounded-xl min-h-[100px] max-h-[150px] overflow-y-auto border border-slate-700">
            <p className="text-slate-100 text-lg leading-relaxed">
                {resultText || "Tap the circle button to capture and analyze."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
