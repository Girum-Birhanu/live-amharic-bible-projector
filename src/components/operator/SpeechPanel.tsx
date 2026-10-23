import React, { useState, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  AlertCircle,
  Sliders,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { useProjectionStore } from '../../store/projection-store';
import { AudioWaveform } from '../ui/AudioWaveform';
import { TRANSLATIONS } from '../../utils/translations';

interface SpeechPanelProps {
  onToggleMic: () => void;
  onProcessSpeech: (text: string) => void;
  onSelectAudioDevice?: (deviceId: string) => void;
}

export function SpeechPanel({ onToggleMic, onProcessSpeech, onSelectAudioDevice }: SpeechPanelProps) {
  const isListening = useProjectionStore((s) => s.isListening);
  const speechError = useProjectionStore((s) => s.speechError);
  const liveTranscript = useProjectionStore((s) => s.liveTranscript);
  const interimTranscript = useProjectionStore((s) => s.interimTranscript);
  const normalizedPreview = useProjectionStore((s) => s.normalizedPreview);
  const isAiResolving = useProjectionStore((s) => s.isAiResolving);
  const selectedAudioDeviceId = useProjectionStore((s) => s.selectedAudioDeviceId);
  const setSelectedAudioDeviceId = useProjectionStore((s) => s.setSelectedAudioDeviceId);
  const speechLang = useProjectionStore((s) => s.speechLang);
  const setSpeechLang = useProjectionStore((s) => s.setSpeechLang);
  const uiTheme = useProjectionStore((s) => s.uiTheme);
  const uiLanguage = useProjectionStore((s) => s.uiLanguage);

  const isLight = uiTheme === 'light';
  const t = TRANSLATIONS[uiLanguage] || TRANSLATIONS.am;

  const [customInput, setCustomInput] = useState('');
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [showMixerGuide, setShowMixerGuide] = useState(false);

  // Enumerate audio input devices (mixers, USB mics, headsets)
  const refreshAudioDevices = useCallback(async (requestPermissionIfNeeded = false) => {
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return;
      setIsScanningDevices(true);

      let devices = await navigator.mediaDevices.enumerateDevices();
      let audioInputs = devices.filter((d) => d.kind === 'audioinput');

      // In Chrome, device labels are blank ("") until microphone permission is granted.
      // If the user clicks the dropdown or "Rescan" and labels are blank, do a fast permission check.
      const hasBlankLabels = audioInputs.length > 0 && audioInputs.some((d) => !d.label);
      if (hasBlankLabels && requestPermissionIfNeeded && navigator.mediaDevices.getUserMedia) {
        try {
          const tempStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          tempStream.getTracks().forEach((track) => track.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
          audioInputs = devices.filter((d) => d.kind === 'audioinput');
        } catch {
          // User dismissed or denied permission prompt
        }
      }

      // Filter and deduplicate audio input devices
      const uniqueDevices: MediaDeviceInfo[] = [];
      const seenIds = new Set<string>();
      for (const dev of audioInputs) {
        const id = dev.deviceId || 'default';
        if (!seenIds.has(id)) {
          seenIds.add(id);
          uniqueDevices.push(dev);
        }
      }

      setAudioDevices(uniqueDevices);
    } catch {
      // Ignored
    } finally {
      setIsScanningDevices(false);
    }
  }, []);

  // Initial scan on mount and auto-listen for hardware plug/unplug
  useEffect(() => {
    refreshAudioDevices(false);
    if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', () => refreshAudioDevices(false));
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', () => refreshAudioDevices(false));
      };
    }
  }, [refreshAudioDevices]);

  // Whenever mic turns on, permission is guaranteed, so re-scan to display full device labels
  useEffect(() => {
    if (isListening) {
      refreshAudioDevices(false);
    }
  }, [isListening, refreshAudioDevices]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedAudioDeviceId(deviceId);
    if (onSelectAudioDevice) {
      onSelectAudioDevice(deviceId);
    }
  };

  return (
    <div
      className={`border rounded-2xl p-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-slate-900/90 border-slate-800 text-slate-100 shadow-xl'
      }`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-amber-500" />
          <h2
            className={`text-sm font-bold uppercase tracking-wider ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}
          >
            {t.speechTitle}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Speech Language Switcher (Amharic vs English STT) */}
          <div
            className={`flex items-center rounded-lg border overflow-hidden text-xs p-0.5 ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'
            }`}
          >
            <button
              type="button"
              onClick={() => setSpeechLang('am-ET')}
              title="Set Speech Recognizer to Amharic (am-ET)"
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                speechLang === 'am-ET'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇪🇹 am-ET
            </button>
            <button
              type="button"
              onClick={() => setSpeechLang('en-US')}
              title="Set Speech Recognizer to English (en-US)"
              className={`px-2 py-0.5 text-[10px] font-bold rounded transition cursor-pointer ${
                speechLang === 'en-US'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🇺🇸 en-US
            </button>
          </div>

          <span
            className={`text-[11px] font-mono ${
              isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'
            }`}
          >
            {t.speechMapReady}
          </span>
        </div>
      </div>

      {/* Mic Button + Isolated Audio Waveform */}
      <div
        className={`flex items-center gap-4 border rounded-xl p-3 mb-2.5 transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-950/90 border-slate-800/90'
        }`}
      >
        <button
          onClick={onToggleMic}
          className={`px-4 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition shadow-md shrink-0 cursor-pointer ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25 animate-pulse'
              : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" /> {t.stopMic}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" /> {t.startMic}
            </>
          )}
        </button>

        {/* Real-time Audio Visualizer Bars (Subscribes internally to eliminate re-renders) */}
        <AudioWaveform isActive={isListening} />
      </div>

      {/* Audio Input Device Selector & Mixer Quick Setup */}
      <div
        className={`border rounded-xl p-2.5 mb-3 flex flex-col gap-2 transition-colors ${
          isLight
            ? 'bg-slate-50/70 border-slate-200'
            : 'bg-slate-950/70 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div
            className={`flex items-center gap-1.5 text-xs font-medium ${
              isLight ? 'text-slate-700' : 'text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.audioSource}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => refreshAudioDevices(true)}
              title="Rescan audio devices (Mixer / Mic)"
              className={`px-2 py-0.5 rounded transition text-[11px] flex items-center gap-1 border cursor-pointer ${
                isLight
                  ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isScanningDevices ? 'animate-spin text-amber-500' : ''}`} />
              {isScanningDevices ? 'Scanning...' : t.rescan}
            </button>
            <button
              type="button"
              onClick={() => setShowMixerGuide((prev) => !prev)}
              className="text-[11px] font-semibold text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300 flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/25 transition cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
              {showMixerGuide ? t.hideMixerGuide : t.mixerGuide}
            </button>
          </div>
        </div>

        {/* Audio Device Dropdown (Auto-refreshes on focus and click) */}
        <select
          value={selectedAudioDeviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
          onFocus={() => {
            if (audioDevices.length === 0 || audioDevices.some((d) => !d.label)) {
              refreshAudioDevices(true);
            }
          }}
          onClick={() => {
            if (audioDevices.length === 0 || audioDevices.some((d) => !d.label)) {
              refreshAudioDevices(true);
            }
          }}
          className={`w-full rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400 font-sans transition-colors cursor-pointer ${
            isLight
              ? 'bg-white border border-slate-300 text-slate-800'
              : 'bg-slate-900 border border-slate-700/85 text-white'
          }`}
        >
          <option value="">{t.defaultMic}</option>
          {audioDevices.map((dev, idx) => {
            const labelText = dev.label || `Microphone Input ${idx + 1}`;
            const isMixer = /usb|line|codec|behringer|yamaha|focusrite|mixer|aux/i.test(labelText);
            return (
              <option key={dev.deviceId || idx} value={dev.deviceId}>
                {isMixer ? '🎛️ ' : '🎤 '}
                {labelText}
                {isMixer ? t.mixerTag : ''}
              </option>
            );
          })}
        </select>

        {/* Collapsible Mixer Diagnostics Guide */}
        {showMixerGuide && (
          <div
            className={`mt-1 p-3 border rounded-xl text-xs space-y-2.5 ${
              isLight
                ? 'bg-amber-50/50 border-amber-300 text-slate-700'
                : 'bg-slate-900/95 border-amber-500/30 text-slate-300'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-1.5 border-b ${
                isLight ? 'border-amber-200' : 'border-slate-800'
              }`}
            >
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                🎛️ Mixer Connection &amp; Audio Diagnostics
              </span>
              <span
                className={`text-[10px] font-mono ${
                  isLight ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                Windows / Chrome Guide
              </span>
            </div>

            <ol className="list-decimal list-inside space-y-2 text-[11px]">
              <li className="leading-relaxed">
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>
                  Windows Recording Device (Most Common Fix):
                </strong>
                <p className={`ml-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Press <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-amber-600 dark:text-amber-300 font-mono text-[10px]">Win + R</kbd>, type <code className="text-amber-600 dark:text-amber-300 font-mono">mmsys.cpl</code>, and press Enter. Go to the <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>Recording</strong> tab. Right-click your USB Mixer and click <strong className="text-emerald-600 dark:text-emerald-400">Set as Default Device</strong>. Speak into the mic and make sure the green volume meter moves!
                </p>
              </li>
              <li className="leading-relaxed">
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>Laptop 3.5mm Aux Jack Issue:</strong>
                <p className={`ml-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  If connecting using a 3.5mm cable: Modern laptop jacks are combo ports (headphones + mic). Use a USB Audio Interface or USB-to-3.5mm sound card adapter instead.
                </p>
              </li>
              <li className="leading-relaxed">
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>Mixer Physical Routing Buttons:</strong>
                <p className={`ml-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Mixers like Behringer/Yamaha have a switch labeled <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>"USB TO MAIN"</strong> vs <strong className={isLight ? 'text-slate-800' : 'text-slate-200'}>"MAIN TO USB" / "2-TR TO REC"</strong>. Turn up Channel Gain and Main/USB level.
                </p>
              </li>
              <li className="leading-relaxed">
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>Chrome Microphone Permissions:</strong>
                <p className={`ml-4 mt-0.5 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  In Google Chrome, go to <code className="text-amber-600 dark:text-amber-300 font-mono">chrome://settings/content/microphone</code> and select your USB Mixer as the default mic.
                </p>
              </li>
            </ol>
          </div>
        )}
      </div>

      {speechError && (
        <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-200 text-xs flex items-start justify-between gap-2 shadow-sm">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <span className="leading-relaxed">{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => useProjectionStore.getState().setSpeechError(null)}
            className="text-amber-600 hover:text-amber-800 dark:text-amber-400/80 dark:hover:text-amber-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-amber-500/20 transition shrink-0 cursor-pointer"
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Live Spoken Amharic Transcript Box */}
      <div
        className={`border rounded-xl p-3 space-y-2 transition-colors ${
          isLight
            ? 'bg-slate-50 border-slate-200'
            : 'bg-slate-950 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{t.preacherTranscript}</span>
          {isAiResolving && (
            <span className="text-amber-500 flex items-center gap-1 font-semibold animate-pulse">
              <Sparkles className="w-3 h-3" /> {t.aiResolving}
            </span>
          )}
        </div>
        <p
          className={`text-sm md:text-base font-medium min-h-[2.25rem] leading-relaxed ethiopic-serif ${
            isLight ? 'text-slate-900' : 'text-white'
          }`}
        >
          {liveTranscript || interimTranscript || (
            <span className={isLight ? 'text-slate-400 italic' : 'text-slate-500 italic'}>
              {t.micPromptHint}
            </span>
          )}
        </p>

        {normalizedPreview && (
          <div
            className={`pt-2 border-t flex items-center justify-between gap-2 text-xs ${
              isLight ? 'border-slate-200' : 'border-slate-800/80'
            }`}
          >
            <span className="text-slate-500 shrink-0 font-mono text-[11px]">
              {t.normalizerLabel}
            </span>
            <span
              className={`font-mono truncate ${
                isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'
              }`}
            >
              {normalizedPreview}
            </span>
          </div>
        )}
      </div>

      {/* Custom Spoken Phrase Tester Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (customInput.trim()) {
            onProcessSpeech(customInput.trim());
            setCustomInput('');
          }
        }}
        className="mt-3 flex gap-2"
      >
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={t.inputPlaceholder}
          className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-400 transition-colors ${
            isLight
              ? 'bg-white border border-slate-300 text-slate-900 placeholder-slate-400 shadow-xs'
              : 'bg-slate-950 border border-slate-800 text-white placeholder-slate-500'
          }`}
        />
        <button
          type="submit"
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer transition ${
            isLight
              ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs'
              : 'bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-300'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" /> {t.detectBtn}
        </button>
      </form>
    </div>
  );
}
