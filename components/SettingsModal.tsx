import React from 'react';
import { AppSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
  if (!isOpen) return null;

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, speechRate: parseFloat(e.target.value) });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, voicePitch: parseFloat(e.target.value) });
  };

  const handleReset = () => {
    onSettingsChange({ speechRate: 1.0, voicePitch: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 shadow-2xl relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Voice Settings
        </h2>

        <div className="space-y-8">
          {/* Speed Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Speech Rate (Speed)</label>
              <span className="text-blue-400 font-mono bg-blue-900/30 px-2 py-0.5 rounded">{settings.speechRate.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speechRate}
              onChange={handleRateChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
            />
            <p className="text-xs text-slate-500 italic">*Applies to Object, Reading & Safe modes</p>
          </div>

          {/* Pitch Control */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <label className="text-slate-300 font-medium">Voice Pitch</label>
              <span className="text-purple-400 font-mono bg-purple-900/30 px-2 py-0.5 rounded">
                {settings.voicePitch > 0 ? '+' : ''}{settings.voicePitch}
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={settings.voicePitch}
              onChange={handlePitchChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-4 rounded-xl text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition-all font-medium text-sm"
          >
            Reset Default
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-all font-medium text-sm shadow-lg shadow-blue-900/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
