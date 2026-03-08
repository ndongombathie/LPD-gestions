import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatters';
import caissierApi from '../services/caissierApi';

const NotificationsDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await caissierApi.getCommandesAttente();
      const commandes = response?.data || [];

      const newNotifications = (Array.isArray(commandes) ? commandes : [])
        .slice()
        .sort((a, b) => {
          const da = a?.date || a?.created_at || '';
          const db = b?.date || b?.created_at || '';
          return String(db).localeCompare(String(da));
        })
        .slice(0, 10)
        .map((commande) => {
          const vendeurNom = commande?.vendeur
            ? `${commande.vendeur?.prenom || ''} ${commande.vendeur?.nom || ''}`.trim()
            : 'Vendeur';

          return ({
            id: commande.id,
            type: 'ticket',
            message: `Nouveau ticket CMD-${commande.id?.substring(0, 8)?.toUpperCase() || 'N/A'} de ${vendeurNom}`,
            montant: commande.total || 0,
            ticket: { id: commande.id },
            date: commande.date || commande.created_at || new Date().toISOString(),
            read: false,
          });
        });

      setNotifications(newNotifications);
    } catch (error) {
      // Erreur silencieuse - gérée par le composant
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'ticket' && notification.ticket) {
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)));
      navigate('/caissier/caisse', { state: { selectedTicketId: notification.ticket.id } });
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={onClose}
        />
      )}
      <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-40 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Chargement...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aucune notification</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                      !notification.read ? 'bg-primary-600' : 'bg-transparent'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.message}
                      </p>
                      {notification.montant && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Montant: {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(notification.montant)}
                        </p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDateTime(notification.date)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                navigate('/caissier/caisse');
                onClose();
              }}
              className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
            >
              Voir tous les tickets
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationsDropdown;

