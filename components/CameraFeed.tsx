import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraDevice } from '../types';

interface CameraFeedProps {
  onCapture: (base64Image: string) => void;
  isActive: boolean;
  isLive: boolean;
  onFrame?: (base64Image: string) => void; // For live stream
}

const CameraFeed: React.FC<CameraFeedProps> = ({ onCapture, isActive, isLive, onFrame }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const liveIntervalRef = useRef<number | null>(null);

  const startCamera = async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
      setError('');
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (liveIntervalRef.current) {
      clearInterval(liveIntervalRef.current);
      liveIntervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [isActive]);

  // Handle Live Frame Streaming
  useEffect(() => {
    if (isLive && isActive && onFrame) {
      liveIntervalRef.current = window.setInterval(() => {
        captureFrame(true);
      }, 1000); // Send 1 frame per second for Live API to save bandwidth/quota while keeping context
    } else {
       if (liveIntervalRef.current) {
        clearInterval(liveIntervalRef.current);
        liveIntervalRef.current = null;
      }
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current);
    }
  }, [isLive, isActive, onFrame]);

  const captureFrame = useCallback((isStreaming: boolean = false) => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // High quality for analysis, lower for streaming if needed
          const quality = isStreaming ? 0.6 : 0.9; 
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          const base64 = dataUrl.split(',')[1];
          
          if (isStreaming && onFrame) {
            onFrame(base64);
          } else if (!isStreaming) {
            onCapture(base64);
          }
        }
      }
    }
  }, [onCapture, onFrame]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-xl shadow-2xl border border-gray-800">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gray-900 text-red-400 text-center z-10">
          <p>{error}</p>
        </div>
      )}
      
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {!isLive && isActive && !error && (
        <button
          onClick={() => captureFrame(false)}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg active:scale-95 transition-transform flex items-center justify-center z-20 focus:outline-none focus:ring-4 focus:ring-blue-500"
          aria-label="Capture Image for Analysis"
        >
          <div className="w-16 h-16 bg-white rounded-full border-2 border-black opacity-20"></div>
        </button>
      )}
    </div>
  );
};

export default CameraFeed;
