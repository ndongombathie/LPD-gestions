import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

let echoInstance = null;
try {
  const key = import.meta.env.VITE_REVERB_APP_KEY ?? '';
  if (key) {
    echoInstance = new Echo({
      broadcaster: 'pusher',
      key,
      wsHost: import.meta.env.VITE_REVERB_HOST || '127.0.0.1',
      wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
      cluster: 'mt1',
      forceTLS: false,
      encrypted: false,
      disableStats: true,
      enabledTransports: ['ws', 'wss'],
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          const token = localStorage.getItem('token') || sessionStorage.getItem('token');
          const url = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api').replace(/\/$/, '') + '/broadcasting/auth';
          fetch(url, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
          })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((data) => callback(null, data))
            .catch((err) => {
              console.error('Broadcasting auth error:', err);
              callback(err, null);
            });
        },
      }),
    });
  }
} catch (e) {
  console.warn('Echo init skipped:', e?.message || e);
}

export const echo = echoInstance;

export const initializeEcho = () => echoInstance;
export const getEcho = () => echoInstance;