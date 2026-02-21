// ==========================================================
// 📊 TableauDeBord.jsx — Vendeur PREMIUM (LPD Manager)
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  RefreshCw,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import { commandesAPI } from "../services/api/commandes";

const TableauDeBord = () => {
  const [commandes, setCommandes] = useState([]);
  const [commandesRecentes, setCommandesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [aucuneVente, setAucuneVente] = useState(false);

  // ========== FONCTIONS UTILITAIRES ==========
  const estAujourdhui = (dateString) => {
    try {
      const aujourdhui = new Date();
      const dateCommande = new Date(dateString);
      
      return (
        dateCommande.getDate() === aujourdhui.getDate() &&
        dateCommande.getMonth() === aujourdhui.getMonth() &&
        dateCommande.getFullYear() === aujourdhui.getFullYear()
      );
    } catch {
      return false;
    }
  };

  const mapStatut = (statut) => {
    const statutsComplete = ['complétée', 'completed', 'payee', 'paid', 'delivered', 'livree', 'validée'];
    const statutsEnAttente = ['en_attente_paiement', 'pending', 'en_attente', 'processing', 'traitement', 'attente', 'à préparer', 'préparée', 'local_only'];
    const statutsAnnule = ['annulée', 'cancelled', 'annulee'];
    
    const statutLower = String(statut || '').toLowerCase().trim();
    
    if (statutsComplete.includes(statutLower)) return 'complétée';
    if (statutsEnAttente.includes(statutLower)) return 'en_attente';
    if (statutsAnnule.includes(statutLower)) return 'annulée';
    
    return statut || 'inconnu';
  };

  const formaterMontant = (v) => 
    new Intl.NumberFormat("fr-FR").format(v || 0) + " FCFA";

  // ========== CALCUL DES STATISTIQUES ==========
  const stats = useMemo(() => {
    // Si aucune vente, retourner des statistiques à zéro
    if (aucuneVente || commandes.length === 0) {
      return {
        ventesAujourdhui: 0,
        commandesTraitees: 0,
        commandesCompletees: 0,
        commandesEnAttente: 0,
        commandesAnnulees: 0,
      };
    }

    const commandesAujourdhui = commandes.filter(c => estAujourdhui(c.date));
    
    const ventesAujourdhui = commandesAujourdhui
      .filter(c => mapStatut(c.statut) === 'complétée')
      .reduce((sum, cmd) => sum + (cmd.total_ttc || 0), 0);
    
    const commandesTraitees = commandesAujourdhui.length;
    
    const commandesCompletees = commandesAujourdhui.filter(c => mapStatut(c.statut) === 'complétée');
    
    return {
      ventesAujourdhui,
      commandesTraitees,
      commandesCompletees: commandesCompletees.length,
      commandesEnAttente: commandesAujourdhui.filter(c => mapStatut(c.statut) === 'en_attente').length,
      commandesAnnulees: commandesAujourdhui.filter(c => mapStatut(c.statut) === 'annulée').length,
    };
  }, [commandes, aucuneVente]);

  // ========== CHARGEMENT DES COMMANDES ==========
  const chargerCommandes = useCallback(async (showRefreshAnimation = false) => {
    setRefreshing(true);
    setError(null);
    setAucuneVente(false);
    
    try {
      console.log("Chargement de l'historique des commandes...");
      
      const response = await commandesAPI.getAll({
        perPage: 100,
        page: 1,
        sort: 'desc',
        orderBy: 'date'
      });
      
      // Gestion des différents formats de réponse
      let commandesData = [];
      if (response.data && Array.isArray(response.data)) {
        commandesData = response.data;
      } else if (Array.isArray(response)) {
        commandesData = response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        commandesData = response.data.data;
      }
      
      // Vérifier s'il y a des données
      if (commandesData && commandesData.length > 0) {
        // Transformer les données
        const commandesTransformees = commandesData.map(commande => {
          return {
            id: commande.id || commande.uuid,
            client: commande.client_nom || commande.client_name || commande.client?.nom || 'Client',
            total_ttc: commande.total_ttc || commande.total || 0,
            statut: mapStatut(commande.statut || commande.status),
            date: commande.date || commande.created_at || new Date().toISOString(),
          };
        })
        .filter(c => c.date) // Filtrer ceux sans date
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Trier du plus récent au plus ancien
        
        console.log(`${commandesTransformees.length} commandes chargées`);
        
        if (commandesTransformees.length > 0) {
          setCommandes(commandesTransformees);
          // Prendre les 4 plus récentes
          setCommandesRecentes(commandesTransformees.slice(0, 4));
          setAucuneVente(false);
        } else {
          // Pas de commandes après transformation
          setCommandes([]);
          setCommandesRecentes([]);
          setAucuneVente(true);
        }
      } else {
        // Pas de données reçues de l'API
        console.log("Aucune commande trouvée dans l'API");
        setCommandes([]);
        setCommandesRecentes([]);
        setAucuneVente(true);
      }
      
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error("Erreur chargement des commandes:", err);
      setError("Impossible de charger les données du dashboard");
      
      // En cas d'erreur, on affiche un état vide mais pas de données mock
      setCommandes([]);
      setCommandesRecentes([]);
      setAucuneVente(true);
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ========== CHARGEMENT INITIAL ==========
  useEffect(() => {
    chargerCommandes();

    const interval = setInterval(() => {
      if (!loading) {
        chargerCommandes(true);
      }
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, [chargerCommandes]);

  // ========== RENDU ==========
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <Loader2 className="animate-spin text-[#472EAD]" size={36} />
        <p className="text-gray-500">Chargement du tableau de bord...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ===== HEADER ===== */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-extrabold text-[#2F1F7A] flex items-center gap-2">
            <TrendingUp size={24} /> Tableau de bord vendeur
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aperçu de votre activité en temps réel
          </p>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-amber-600 text-sm bg-amber-50 px-3 py-1.5 rounded-lg">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          
          {lastUpdate && !aucuneVente && (
            <div className="text-sm text-gray-500">
              Dernière mise à jour : {lastUpdate.toLocaleTimeString('fr-FR', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          )}
          
          <div className="flex gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <Calendar size={16} />
              {new Date().toLocaleDateString("fr-FR")}
            </span>
            <button
              onClick={() => chargerCommandes(true)}
              disabled={refreshing}
              className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== 2 KPI CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Carte 1 : Ventes du jour */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Ventes du jour</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {formaterMontant(stats.ventesAujourdhui)}
              </h3>
              {!aucuneVente && stats.commandesCompletees > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {stats.commandesCompletees} commande{stats.commandesCompletees > 1 ? 's' : ''} complétée{stats.commandesCompletees > 1 ? 's' : ''}
                </p>
              )}
              {aucuneVente && (
                <p className="text-xs text-gray-400 mt-1">
                  Aucune vente aujourd'hui
                </p>
              )}
            </div>
            <div className="bg-[#472EAD]/10 p-3 rounded-xl">
              <DollarSign className="text-[#472EAD]" size={24} />
            </div>
          </div>
        </div>

        {/* Carte 2 : Commandes traitées */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-gray-500">Commandes du jour</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.commandesTraitees}
              </h3>
              {!aucuneVente && stats.commandesTraitees > 0 && (
                <div className="flex items-center gap-2 mt-1 text-xs">
                  {stats.commandesCompletees > 0 && (
                    <>
                      <span className="text-green-600">{stats.commandesCompletees} complétée{stats.commandesCompletees > 1 ? 's' : ''}</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  {stats.commandesEnAttente > 0 && (
                    <>
                      <span className="text-yellow-600">{stats.commandesEnAttente} en attente</span>
                      <span className="text-gray-300">•</span>
                    </>
                  )}
                  {stats.commandesAnnulees > 0 && (
                    <span className="text-red-600">{stats.commandesAnnulees} annulée{stats.commandesAnnulees > 1 ? 's' : ''}</span>
                  )}
                </div>
              )}
              {aucuneVente && (
                <p className="text-xs text-gray-400 mt-1">
                  Aucune commande aujourd'hui
                </p>
              )}
            </div>
            <div className="bg-[#F58020]/10 p-3 rounded-xl">
              <ShoppingCart className="text-[#F58020]" size={24} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ===== COMMANDES RÉCENTES ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-sm border border-gray-200 mt-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Dernières commandes
              </h2>
              <p className="text-sm text-gray-500">
                {aucuneVente 
                  ? "Aucune commande pour le moment" 
                  : "Les 4 dernières commandes enregistrées"}
              </p>
            </div>
          </div>
          {!aucuneVente && commandes.length > 4 && (
            <span className="text-xs text-gray-400">
              + {commandes.length - 4} commande{commandes.length - 4 > 1 ? 's' : ''} plus ancienne{commandes.length - 4 > 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="space-y-3">
          {!aucuneVente && commandesRecentes.length > 0 ? (
            commandesRecentes.map((cmd, index) => (
              <div
                key={cmd.id || index}
                className="flex items-center justify-between p-4 rounded-xl bg-white border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#472EAD] rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {cmd.client?.charAt(0) || 'C'}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {cmd.client || 'Client'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cmd.statut === 'complétée' ? 'bg-emerald-100 text-emerald-800' :
                        cmd.statut === 'en_attente' ? 'bg-amber-100 text-amber-800' :
                        cmd.statut === 'annulée' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {cmd.statut === 'complétée' ? 'Complétée' :
                         cmd.statut === 'en_attente' ? 'En attente' :
                         cmd.statut === 'annulée' ? 'Annulée' : cmd.statut}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-[#472EAD]">
                    {formaterMontant(cmd.total_ttc)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(cmd.date).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Aucune commande pour le moment</p>
              <p className="text-sm text-gray-400 mt-1">
                Les commandes apparaîtront ici quand vous en aurez
              </p>
              <button
                onClick={() => chargerCommandes(true)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mx-auto"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Actualiser
              </button>
            </div>
          )}
        </div>

        {/* Indicateur de mise à jour */}
        {lastUpdate && !aucuneVente && commandesRecentes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
              <RefreshCw size={10} className={refreshing ? "animate-spin" : ""} />
              Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TableauDeBord;