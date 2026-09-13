import { useState } from 'react';
import { AppState } from '../types';
import { store } from '../store';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Upload, FileText, Clipboard, Loader2 } from 'lucide-react';
import { demoTranscript } from '../data/seed';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap';

interface Props {
  state: AppState;
  interactionId: string | null;
  navigate: (screen: Screen, interactionId?: string) => void;
}

export default function UploadTranscript({ state, interactionId, navigate }: Props) {
  const [transcript, setTranscript] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'paste' | 'upload'>('paste');

  const interaction = state.interactions.find(i => i.id === interactionId);

  const handleLoadDemo = () => {
    setTranscript(demoTranscript);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setTranscript(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!transcript.trim() || !interactionId) return;
    
    setLoading(true);
    
    const transcriptRecord = {
      id: uuidv4(),
      interactionId,
      content: transcript.trim(),
      source: 'paste' as const,
      uploadedAt: new Date().toISOString(),
    };
    
    store.addTranscript(transcriptRecord);
    store.updateInteraction(interactionId, { status: 'performed' });
    
    // Navigate to post-interaction analysis
    setLoading(false);
    navigate('post', interactionId);
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="bg-white border-b border-surface-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('dashboard')} className="p-2 hover:bg-surface-100 rounded-lg transition-all">
            <ArrowLeft size={18} className="text-surface-600" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-surface-900">Upload Interaction</h1>
            <p className="text-sm text-surface-400">{interaction?.customer} · {interaction?.name}</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-surface-100 p-6 shadow-sm animate-fade-in">
          {/* Demo loader */}
          <div className="mb-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <p className="text-sm text-primary-700 mb-2 font-medium">Want to see the analysis?</p>
            <p className="text-sm text-primary-600 mb-3">Load a demo transcript from the renewal meeting to see the full analysis flow.</p>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-all"
            >
              Load Demo Transcript
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setMode('paste')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                mode === 'paste' ? 'bg-primary-100 text-primary-700' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
              }`}
            >
              <Clipboard size={14} />
              Paste transcript
            </button>
            <button
              onClick={() => setMode('upload')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                mode === 'upload' ? 'bg-primary-100 text-primary-700' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
              }`}
            >
              <Upload size={14} />
              Upload file
            </button>
          </div>

          {mode === 'paste' ? (
            <div>
              <textarea
                value={transcript}
                onChange={e => setTranscript(e.target.value)}
                rows={15}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm font-mono resize-none"
                placeholder="Paste the meeting transcript here...

Example format:
[Meeting Transcript]
Date: ...
Attendees: ...

Person A: Hello...
Person B: Thanks for meeting..."
              />
              <p className="text-xs text-surface-400 mt-2">
                {transcript.length > 0 ? `${transcript.split('\n').length} lines · ${transcript.length} characters` : 'Paste any format — the system will parse it'}
              </p>
            </div>
          ) : (
            <div className="border-2 border-dashed border-surface-200 rounded-xl p-8 text-center hover:border-primary-300 transition-all">
              <FileText size={32} className="text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-600 mb-2">Drop a transcript file here or click to browse</p>
              <p className="text-xs text-surface-400 mb-4">Supports .txt, .srt, .vtt files</p>
              <input
                type="file"
                accept=".txt,.srt,.vtt,.csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="px-4 py-2 bg-surface-100 text-surface-700 text-sm font-medium rounded-lg hover:bg-surface-200 transition-all cursor-pointer inline-block"
              >
                Choose file
              </label>
              {transcript && (
                <p className="text-sm text-emerald-600 mt-3">✓ File loaded ({transcript.length} characters)</p>
              )}
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-surface-100">
            <button
              onClick={handleSubmit}
              disabled={!transcript.trim() || loading}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:bg-surface-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText size={18} />
                  Analyze Interaction
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
