// Production uses this service's origin unless explicitly configured.
// Hostname alone cannot distinguish a local Docker container from Vite dev.
export const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '')
  || (import.meta.env.DEV ? 'http://localhost:3001' : '');
