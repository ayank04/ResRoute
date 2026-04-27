import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useDriverStore } from '../../stores/driverStore';
import { useRouteStore } from '../../stores/routeStore';
import { useUIStore } from '../../stores/uiStore';

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
  start: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export default function VoiceButton() {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const { drivers, setSelectedDriver } = useDriverStore();
  const { reroute } = useRouteStore();
  const { showToast } = useUIStore();

  function speak(text: string) {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1.1; u.pitch = 1;
    window.speechSynthesis.speak(u);
  }

  function handleCommand(cmd: string) {
    const lower = cmd.toLowerCase();
    // "show driver [name]"
    const showMatch = lower.match(/show driver (.+)/);
    if (showMatch) {
      const name = showMatch[1].trim();
      const driver = drivers.find(d => d.name.toLowerCase().includes(name));
      if (driver) {
        setSelectedDriver(driver.id);
        showToast(`📍 Showing ${driver.name}'s route`, 'info');
        speak(`Showing ${driver.name}'s route on map.`);
      } else {
        speak(`Driver ${name} not found.`);
      }
      return;
    }
    if (lower.includes('accept reroute')) {
      showToast('✅ Reroute accepted via voice command', 'success');
      speak('Reroute accepted. Updating route on map.');
      return;
    }
    if (lower.includes('predict disruption') || lower.includes('show predictions')) {
      showToast('🔮 Displaying predictive disruptions', 'info');
      speak('Showing predicted disruptions on map.');
      return;
    }
    speak(`Command not recognised: ${cmd}`);
    showToast(`❓ Command not recognised: "${cmd}"`, 'warning');
  }

  function startListening() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { showToast('Speech recognition not supported in this browser', 'error'); return; }
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = 'en-IN';
    rec.onstart = () => { setListening(true); setShowTranscript(true); setTranscript('Listening…'); };
    rec.onresult = (e: any) => {
      const t = Array.from(e.results).map((r: any) => r[0].transcript).join('');
      setTranscript(t);
      if (e.results[e.results.length - 1].isFinal) handleCommand(t);
    };
    rec.onend = () => { setListening(false); setTimeout(() => setShowTranscript(false), 3000); };
    rec.onerror = () => { setListening(false); setShowTranscript(false); };
    recRef.current = rec;
    rec.start();
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  return (
    <>
      {showTranscript && (
        <div className="voice-transcript">
          <div style={{ fontSize: 11, color: 'var(--primary)', marginBottom: 4, fontWeight: 600 }}>
            {listening ? '🎤 Listening…' : '✅ Heard:'}
          </div>
          <div style={{ fontSize: 13 }}>{transcript}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 4 }}>
            Try: "show driver Arjun" · "accept reroute" · "predict disruptions"
          </div>
        </div>
      )}
      <button
        onClick={listening ? stopListening : startListening}
        style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: listening ? 'var(--danger)' : 'var(--primary)',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: listening ? '0 0 0 6px rgba(239,68,68,0.3)' : '0 4px 16px rgba(59,130,246,0.4)',
          animation: listening ? 'pulse 1.5s infinite' : 'none',
          transition: 'all 0.2s',
        }}
        title="Voice Commands"
      >
        {listening ? <MicOff size={18} /> : <Mic size={18} />}
      </button>
    </>
  );
}
