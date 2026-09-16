import { getProviderInfo, checkBackendHealth, setLLMAvailable } from '../llm-provider';
import { Wifi, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function LLMStatus() {
  const [info, setInfo] = useState(getProviderInfo());
  const [checking, setChecking] = useState(true);

  // Check backend health on mount to determine if we're in LIVE AI mode
  useEffect(() => {
    console.log('🔍 LLMStatus: Checking backend health...');
    checkBackendHealth().then(health => {
      console.log('🔍 LLMStatus: Backend health check result:', health);
      if (health.available) {
        console.log('✅ LLMStatus: Backend is available, setting LIVE mode');
        setLLMAvailable(true, health.provider, health.model);
        setInfo({
          name: health.provider || 'Gemini',
          model: health.model || 'gemini-3.6-flash',
          isLive: true,
        });
      } else {
        console.log('⚠️ LLMStatus: Backend is NOT available, using Demo mode');
      }
      setChecking(false);
    }).catch((error) => {
      console.error('❌ LLMStatus: Backend health check failed:', error);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-surface-100 text-surface-500 border border-surface-200">
        <span className="animate-pulse">Checking...</span>
      </div>
    );
  }

  if (info.isLive) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200" title={`Using ${info.name} ${info.model} — API key secured server-side`}>
        <Wifi size={10} />
        <span>AI: {info.name}</span>
        <span className="text-emerald-500">({info.model})</span>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200" title="Running in demo mode with simulated responses. Backend not available or GEMINI_API_KEY not configured.">
      <WifiOff size={10} />
      <span>Demo Mode</span>
    </div>
  );
}
