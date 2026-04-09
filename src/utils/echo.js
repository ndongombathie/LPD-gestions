import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const reverbKey = import.meta.env.VITE_REVERB_APP_KEY;
const apiUrl = import.meta.env.VITE_API_URL;
const wsHost = import.meta.env.VITE_REVERB_HOST;
const wsPortRaw = import.meta.env.VITE_REVERB_PORT;

// Ne pas crasher l'app si Reverb/Pusher n'est pas configuré en local
export const echo = reverbKey && apiUrl && wsHost && wsPortRaw
  ? new Echo({
    broadcaster: 'pusher',
    key: reverbKey,
    wsHost,
    wsPort: Number(wsPortRaw),
    cluster: import.meta.env.VITE_REVERB_CLUSTER,
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    
    // Configuration personnalisée de l'authentification
    authorizer: (channel) => {
        return {
            authorize: (socketId, callback) => {
                fetch(`${apiUrl}/broadcasting/auth`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        socket_id: socketId,
                        channel_name: channel.name,
                    }),
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    callback(null, data);
                })
                .catch(error => {
                    console.error('Broadcasting auth error:', error);
                    callback(error, null);
                });
            },
        };
    },
})
  : null;
export const boutiqueId = localStorage.getItem('boutique_id');
