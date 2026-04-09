import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT),
    cluster: import.meta.env.VITE_REVERB_CLUSTER,
    forceTLS: true,
    encrypted: true,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    
    // Configuration personnalisée de l'authentification
    authorizer: (channel) => {
        return {
            authorize: (socketId, callback) => {
                fetch(`${import.meta.env.VITE_API_URL}/broadcasting/auth`, {
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
});
export const boutiqueId = localStorage.getItem('boutique_id');
