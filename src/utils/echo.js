import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const echo = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    cluster: 'mt1',
    forceTLS: false,
    encrypted: false,
    disableStats: true,
    enabledTransports: ['ws', 'wss'],
    
    // Configuration personnalisée de l'authentification
    authorizer: (channel) => {
        return {
            authorize: (socketId, callback) => {
                fetch('http://127.0.0.1:8000/api/broadcasting/auth', {
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
