
import { AppState } from '../types';
import { store } from '../store';
import LLMStatus from './LLMStatus';

type Screen = 'login' | 'dashboard' | 'create' | 'brief' | 'roleplay' | 'results' | 'upload' | 'post' | 'capabilities' | 'roadmap' | 'validation' | 'demo';

interface DashboardProps {
  state: AppState;
  navigate: (screen: Screen, interactionId?: string, sessionId?: string) => void;
}

export default function Dashboard({ state, navigate }: DashboardProps) {
  const user = state.user;
  const interactions = state.interactions;
  const capabilityHistory = state.capabilityHistory;

  const upcomingInteractions = interactions.filter(i => i.status === 'upcoming' || i.status === 'prepared');
  const recentInteractions = interactions.filter(i => i.status === 'analyzed').slice(-3).reverse();

  const handleLogout = () => {
    store.logout();
    navigate('login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Performance Coach</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <LLMStatus />
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigate('create')}
            className="bg-blue-600 text-white p-6 rounded-xl hover:bg-blue-700 transition-colors text-left"
          >
            <h3 className="text-lg font-semibold mb-2">Create Interaction</h3>
            <p className="text-blue-100 text-sm">Start preparing for a new customer interaction</p>
          </button>

          <button
            onClick={() => navigate('capabilities')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">View Capabilities</h3>
            <p className="text-gray-600 text-sm">Track your capability development over time</p>
          </button>

          <button
            onClick={() => navigate('validation')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Validation</h3>
            <p className="text-gray-600 text-sm">Run system validation tests</p>
          </button>

          <button
            onClick={() => navigate('demo')}
            className="bg-white p-6 rounded-xl border border-gray-200 hover:border-blue-300 transition-colors text-left"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Before/After Demo</h3>
            <p className="text-gray-600 text-sm">See the coaching impact in action</p>
          </button>
        </div>

        {/* Upcoming Interactions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Interactions</h2>
          {upcomingInteractions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No upcoming interactions. Create one to get started!</p>
          ) : (
            <div className="space-y-3">
              {upcomingInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{interaction.name}</h3>
                    <p className="text-sm text-gray-600">{interaction.customer} • {interaction.role}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(interaction.dateTime).toLocaleDateString()} at {new Date(interaction.dateTime).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {interaction.status === 'upcoming' && (
                      <button
                        onClick={() => navigate('brief', interaction.id)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Prepare
                      </button>
                    )}
                    {interaction.status === 'prepared' && (
                      <button
                        onClick={() => navigate('roleplay', interaction.id)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Practice
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
          {recentInteractions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No recent activity yet.</p>
          ) : (
            <div className="space-y-3">
              {recentInteractions.map((interaction) => (
                <div
                  key={interaction.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{interaction.name}</h3>
                    <p className="text-sm text-gray-600">{interaction.customer}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Analyzed on {new Date(interaction.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate('post', interaction.id)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Analysis
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Capability Overview */}
        {capabilityHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Capability Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {capabilityHistory.slice(0, 4).map((cap) => (
                <div key={cap.capability} className="p-4 border border-gray-200 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">{cap.capability}</h3>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold text-blue-600">{cap.currentScore.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">/ 5.0</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      cap.trend === 'improving' ? 'bg-green-100 text-green-700' :
                      cap.trend === 'declining' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {cap.trend === 'improving' ? '↑ Improving' :
                       cap.trend === 'declining' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
