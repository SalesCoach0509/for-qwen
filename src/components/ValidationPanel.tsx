import { useState } from 'react';
import { runFullValidation } from '../test/validation-harness';

export default function ValidationPanel() {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const runTests = async () => {
    setIsRunning(true);
    setLogs(['Starting validation suite...\n']);

    // Capture console output
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      setLogs(prev => [...prev, message]);
      originalLog(...args);
    };

    console.error = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      setLogs(prev => [...prev, `ERROR: ${message}`]);
      originalError(...args);
    };

    console.warn = (...args) => {
      const message = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
      setLogs(prev => [...prev, `WARN: ${message}`]);
      originalWarn(...args);
    };

    try {
      await runFullValidation();
      setLogs(prev => [...prev, '\n✓ Validation suite completed']);
    } catch (error) {
      setLogs(prev => [...prev, `\n✗ Validation suite failed: ${error}`]);
    } finally {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      setIsRunning(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Validation Test Suite</h2>
      <p className="text-gray-600 mb-4">
        Run comprehensive validation tests for the AI Performance Coach system.
      </p>
      
      <button
        onClick={runTests}
        disabled={isRunning}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
      >
        {isRunning ? 'Running Tests...' : 'Run Validation Suite'}
      </button>

      {logs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Test Output</h3>
          <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, idx) => (
              <div key={idx} className={`mb-1 ${
                log.startsWith('ERROR') ? 'text-red-600' :
                log.startsWith('WARN') ? 'text-yellow-600' :
                log.startsWith('✓') ? 'text-green-600' :
                log.startsWith('✗') ? 'text-red-600' :
                'text-gray-800'
              }`}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
