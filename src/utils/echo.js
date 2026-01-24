import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

// Configuration de Laravel Echo pour les WebSockets
let echoInstance = null;

export const initializeEcho = () => {
  if (echoInstance) {
    return echoInstance;
  }

  // Utiliser sessionStorage (utilisé partout dans l'app) + fallback localStorage
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  
  if (!token) {
    // Pas de token => pas de websocket (silencieux)
    return null;
  }

  // Configuration pour Reverb (WebSocket Laravel)
  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY || 'your-app-key',
    wsHost: import.meta.env.VITE_REVERB_HOST || window.location.hostname,
    wsPort: import.meta.env.VITE_REVERB_PORT || 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT || 8080,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    },
  });

  return echoInstance;
};

export const getEcho = () => {
  if (!echoInstance) {
    return initializeEcho();
  }
  return echoInstance;
};

export const disconnectEcho = () => {
  if (echoInstance) {
    echoInstance.disconnect();
    echoInstance = null;
  }
};

// Réinitialiser Echo quand le token change
export const reconnectEcho = () => {
  disconnectEcho();
  return initializeEcho();
};

