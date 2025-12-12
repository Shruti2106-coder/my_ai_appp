import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import CameraFeed from './CameraFeed';
import { AppSettings } from '../types';

interface LiveAssistantProps {
  isActive: boolean;
  onStatusChange: (status: string) => void;
  settings: AppSettings;
}

const LiveAssistant: React.FC<LiveAssistantProps> = ({ isActive, onStatusChange, settings }) => {
  const [connected, setConnected] = useState(false);
  const [isTalking, setIsTalking] = useState(false);
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio Playback
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Session
  const sessionPromiseRef = useRef<Promise<any> | null>(null);

  // Apply pitch changes immediately to all active live sources
  useEffect(() => {
    sourcesRef.current.forEach(source => {
        try {
            // Speed (playbackRate) is not applied to Live streams to avoid buffer underruns
            source.detune.value = settings.voicePitch * 100;
        } catch(e) { console.error(e); }
    });
  }, [settings.voicePitch]);

  // Initialize Audio Contexts
  useEffect(() => {
    if (isActive && !inputAudioContextRef.current) {
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    return () => {
      // Cleanup happens in disconnect
    };
  }, [isActive]);

  const connectToLiveAPI = async () => {
    onStatusChange("Connecting to VisionVoice Live...");
    try {
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setConnected(true);
            onStatusChange("Live Assistant Active - Speak naturally");
            
            // Start Audio Streaming Input
            if (inputAudioContextRef.current) {
                const ctx = inputAudioContextRef.current;
                const source = ctx.createMediaStreamSource(stream);
                const processor = ctx.createScriptProcessor(4096, 1, 1);
                processorRef.current = processor;
                
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcmBlob = createPcmBlob(inputData);
                    sessionPromise.then(session => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                
                source.connect(processor);
                processor.connect(ctx.destination);
            }
          },
          onmessage: async (msg: LiveServerMessage) => {
             // Handle Audio Output
             const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current) {
                 setIsTalking(true);
                 const ctx = outputAudioContextRef.current;
                 const rawBytes = base64ToUint8Array(base64Audio);
                 const audioBuffer = await decodeAudioData(rawBytes, ctx, 24000, 1);
                 
                 // Schedule playback
                 nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                 
                 const source = ctx.createBufferSource();
                 source.buffer = audioBuffer;
                 
                 // Apply current settings (Pitch Only for Live)
                 source.detune.value = settings.voicePitch * 100;
                 
                 source.connect(ctx.destination);
                 
                 source.addEventListener('ended', () => {
                     sourcesRef.current.delete(source);
                     if (sourcesRef.current.size === 0) setIsTalking(false);
                 });
                 
                 source.start(nextStartTimeRef.current);
                 nextStartTimeRef.current += audioBuffer.duration;
                 sourcesRef.current.add(source);
             }

             // Handle Interruptions
             if (msg.serverContent?.interrupted) {
                 console.log("Interrupted");
                 sourcesRef.current.forEach(s => {
                     try { s.stop(); } catch(e) {}
                 });
                 sourcesRef.current.clear();
                 nextStartTimeRef.current = 0;
                 setIsTalking(false);
             }
          },
          onclose: () => {
            console.log("Live Session Closed");
            setConnected(false);
            onStatusChange("Session Ended");
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            onStatusChange("Connection Error. Retrying...");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: "You are VisionVoice, a helpful and empathetic navigational assistant for the blind. You will receive a stream of images and audio. Constantly describe what you see relevant to the user's safety and curiosity. Be brief but informative. If user asks a question, answer it. If you see hazards (stairs, cars), warn immediately.",
          speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e) {
      console.error(e);
      onStatusChange("Failed to connect");
    }
  };

  const disconnect = () => {
    setConnected(false);
    onStatusChange("Offline");

    // Stop Audio Input
    if (processorRef.current && inputAudioContextRef.current) {
        processorRef.current.disconnect();
        processorRef.current = null;
    }
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
    }
    
    // Stop Audio Output
    sourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  useEffect(() => {
    if (isActive) {
      connectToLiveAPI();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [isActive]);

  const handleVideoFrame = useCallback((base64Image: string) => {
    if (sessionPromiseRef.current && connected) {
        sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({
                media: {
                    mimeType: 'image/jpeg',
                    data: base64Image
                }
            });
        }).catch(err => console.error("Session not ready", err));
    }
  }, [connected]);

  return (
    <div className="w-full h-full relative">
       {/* Live Camera Feed */}
       <div className="absolute inset-0 z-0">
         <CameraFeed 
            isActive={isActive} 
            isLive={true} 
            onCapture={() => {}} 
            onFrame={handleVideoFrame}
         />
       </div>
       
       {/* Overlay UI */}
       <div className="absolute bottom-10 left-0 right-0 z-20 flex flex-col items-center justify-center pointer-events-none">
          <div className={`
             flex items-center gap-3 px-6 py-3 rounded-full backdrop-blur-md border border-white/20 shadow-xl transition-all duration-500
             ${isTalking ? 'bg-blue-600/80 scale-105' : 'bg-black/60'}
          `}>
             <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
             <span className="text-white font-medium text-lg pointer-events-auto">
                {isTalking ? "Speaking..." : connected ? "Listening..." : "Initializing..."}
             </span>
             {isTalking && (
                <div className="flex gap-1 h-4 items-center">
                    <div className="w-1 bg-white animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-1 bg-white animate-[bounce_1s_infinite_0.2s] h-4"></div>
                    <div className="w-1 bg-white animate-[bounce_1s_infinite_0.4s] h-3"></div>
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default LiveAssistant;
