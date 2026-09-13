import { useState } from 'react';
import { store } from '../store';
import { Target, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

export default function Login({ onLogin }: Props) {
  const [name, setName] = useState('Rahul Sharma');
  const [email, setEmail] = useState('rahul@demo.com');

  const handleLogin = () => {
    if (name.trim() && email.trim()) {
      store.login(name.trim(), email.trim());
      onLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-primary-50 to-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-200">
            <Target size={32} />
          </div>
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Performance Coach</h1>
          <p className="text-surface-500 text-lg">Prepare. Practice. Perform.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl shadow-surface-200/50 p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-surface-800"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-surface-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-surface-800"
                placeholder="you@company.com"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary-200 hover:shadow-xl hover:shadow-primary-300 flex items-center justify-center gap-2 mt-6"
            >
              Continue
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-surface-100">
            <button
              onClick={() => {
                store.login('Rahul Sharma', 'rahul@demo.com');
                onLogin();
              }}
              className="w-full py-3 bg-surface-50 hover:bg-surface-100 text-surface-700 font-medium rounded-xl transition-all flex items-center justify-center gap-2 border border-surface-200"
            >
              <Sparkles size={16} className="text-primary-500" />
              Try Demo — Enterprise Renewal
            </button>
            <p className="text-xs text-surface-400 text-center mt-3">
              Demo loads with pre-populated scenario and capability history
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-surface-400 mt-6">
          Your personal AI performance coach for customer-facing interactions
        </p>
      </div>
    </div>
  );
}
