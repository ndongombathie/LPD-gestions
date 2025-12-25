import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDateTime } from '../../utils/formatters';

const NotificationsDropdown = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Données fictives de tickets en attente (similaire à CaissePage)
  const getFakeTickets = () => [
    {
      id: 'ticket-1',
      commande_id: 'commande-1',
      numero: 'TKT-2025-000001',
      date_ticket: new Date().toISOString(),
      vendeur_nom: 'Amadou Diallo',
      client_nom: 'Client A',
      client_special: false,
      statut: 'en_attente',
      total_ht: 100000,
      tva: 18000,
      total_ttc: 118000,
      montant_deja_paye: 0,
      reste_du: 118000,
      lignes: [
        { produit: 'Produit A', quantite: 2, prix_unitaire: 50000 },
      ],
    },
    {
      id: 'ticket-2',
      commande_id: 'commande-2',
      numero: 'TKT-2025-000002',
      date_ticket: new Date(Date.now() - 1800000).toISOString(),
      vendeur_nom: 'Fatou Ba',
      client_nom: 'Client B',
      client_special: true,
      statut: 'en_attente',
      total_ht: 85000,
      tva: 15300,
      total_ttc: 100300,
      montant_deja_paye: 0,
      reste_du: 100300,
      lignes: [
        { produit: 'Produit B', quantite: 1, prix_unitaire: 85000 },
      ],
    },
    {
      id: 'ticket-3',
      commande_id: 'commande-3',
      numero: 'TKT-2025-000003',
      date_ticket: new Date(Date.now() - 3600000).toISOString(),
      vendeur_nom: 'Ibrahima Sall',
      client_nom: 'Client C',
      client_special: false,
      statut: 'en_attente',
      total_ht: 50000,
      tva: 9000,
      total_ttc: 59000,
      montant_deja_paye: 0,
      reste_du: 59000,
      lignes: [
        { produit: 'Produit C', quantite: 1, prix_unitaire: 50000 },
      ],
    },
  ];

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Utiliser des données fictives
      const tickets = getFakeTickets();
      const ticketsEnAttente = tickets.filter(t => t.statut === 'en_attente');
      
      const newNotifications = ticketsEnAttente.map(ticket => ({
        id: ticket.id || ticket.commande_id,
        type: 'ticket',
        message: `Nouveau ticket ${ticket.numero || 'N/A'} de ${ticket.vendeur_nom || 'Vendeur'}`,
        montant: ticket.total_ttc || 0,
        ticket: ticket,
        date: ticket.date_ticket || new Date().toISOString(),
        read: false,
      }));
      setNotifications(newNotifications);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'ticket' && notification.ticket) {
      navigate('/caissier/caisse', { state: { selectedTicketId: notification.ticket.id } });
      onClose();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-10"
          onClick={onClose}
        />
      )}
      <div className={`absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 ${isOpen ? 'block' : 'hidden'}`}>
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

