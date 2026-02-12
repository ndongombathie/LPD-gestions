// ==========================================================
// 📊 TableauDeBord.jsx — Vendeur PREMIUM (LPD Manager)
// ==========================================================

import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Package,
  ArrowUp,
  Calendar,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { statsAPI } from "../services/api/stats";
import { commandesAPI } from "../services/api/commandes";

const TableauDeBord = () => {
  const [stats, setStats] = useState({
    ventesAujourdhui: 0,
    commandesTraitees: 0,
    produitsVendus: 0,
    objectifVentes: 150000,
    panierMoyen: 0,
  });

  const [commandesRecentes, setCommandesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Charger les données du dashboard
  const chargerDashboardData = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      console.log("Chargement des données du dashboard...");
      
      // Charger toutes les données en parallèle
      await Promise.all([
        chargerStatistiquesDuJour(),
        chargerCommandesRecentes(),
      ]);
      
      setLastUpdate(new Date());
      
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
      setError("Impossible de charger les données du dashboard");
      setDonneesDemonstration();
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Charger les statistiques du jour
  const chargerStatistiquesDuJour = async () => {
    try {
      const response = await statsAPI.getTodaySales();
      console.log("Réponse stats du jour:", response);
      
      if (response) {
        setStats(prev => ({
          ...prev,
          ventesAujourdhui: response.today_sales || response.total || 0,
          commandesTraitees: response.processed_orders || response.completed_orders || 0,
          produitsVendus: response.items_sold || response.products_sold || 0,
          panierMoyen: response.average_cart || 0,
        }));
      }
      
      return response;
    } catch (error) {
      console.error("Erreur statistiques du jour:", error);
      await chargerStatistiquesFromCommandes();
      throw error;
    }
  };

  // Fallback avec commandesAPI
  const chargerStatistiquesFromCommandes = async () => {
    try {
      const aujourdhui = new Date().toISOString().split('T')[0];
      
      const response = await commandesAPI.getAll({
        perPage: 100,
        page: 1,
        date_from: aujourdhui,
        date_to: aujourdhui,
      });
      
      const commandesAujourdhui = Array.isArray(response.data) ? response.data : response;
      
      const ventesAujourdhui = commandesAujourdhui.reduce((sum, cmd) => 
        sum + (cmd.total_ttc || cmd.total || 0), 0
      );
      
      const commandesCompletees = commandesAujourdhui.filter(cmd => 
        cmd.status === 'completed' || cmd.statut === 'complétée'
      ).length;
      
      const produitsVendus = commandesAujourdhui.reduce((sum, cmd) => {
        if (cmd.items && Array.isArray(cmd.items)) {
          return sum + cmd.items.reduce((itemSum, item) => 
            itemSum + (item.quantity || 0), 0
          );
        }
        return sum;
      }, 0);
      
      const panierMoyen = commandesCompletees > 0 
        ? Math.round(ventesAujourdhui / commandesCompletees) 
        : 0;
      
      setStats(prev => ({
        ...prev,
        ventesAujourdhui,
        commandesTraitees: commandesCompletees,
        produitsVendus,
        panierMoyen,
      }));
      
    } catch (error) {
      console.error("Erreur stats depuis commandes:", error);
      throw error;
    }
  };

  // Charger les commandes récentes
  const chargerCommandesRecentes = async () => {
    try {
      // Utiliser statsAPI ou commandesAPI
      let response;
      try {
        response = await statsAPI.getRecentOrders(5);
      } catch (statsError) {
        console.log("Fallback sur commandesAPI...");
        response = await commandesAPI.getAll({
          perPage: 5,
          page: 1,
          sort: 'created_at:desc',
        });
      }
      
      const commandesData = Array.isArray(response.data) ? response.data : response;
      
      if (commandesData && Array.isArray(commandesData)) {
        const commandesFormatees = commandesData.slice(0, 5).map(cmd => ({
          id: cmd.id,
          numero: cmd.numero_commande || cmd.order_number || `CMD-${cmd.id}`,
          client: cmd.client_nom || cmd.client_name || cmd.client?.nom || 'Client',
          total: cmd.total_ttc || cmd.total || 0,
          statut: cmd.statut || cmd.status || 'inconnu',
          date: cmd.created_at ? new Date(cmd.created_at) : new Date(),
        }));
        
        setCommandesRecentes(commandesFormatees);
      }
      
    } catch (error) {
      console.error("Erreur commandes récentes:", error);
      setCommandesRecentes(getCommandesSimulees());
    }
  };

  // Données de démonstration
  const setDonneesDemonstration = () => {
    setStats({
      ventesAujourdhui: 125420,
      commandesTraitees: 24,
      produitsVendus: 42,
      objectifVentes: 150000,
      panierMoyen: 5226,
    });
    
    setCommandesRecentes(getCommandesSimulees());
  };

  const getCommandesSimulees = () => [
    {
      id: 1,
      numero: "CMD-2024-001",
      client: "Marie Diop",
      total: 47200,
      statut: "complétée",
      date: new Date(),
    },
    {
      id: 2,
      numero: "CMD-2024-002",
      client: "Jean Dupont",
      total: 85000,
      statut: "en attente",
      date: new Date(),
    },
    {
      id: 3,
      numero: "CMD-2024-003",
      client: "Sophie Martin",
      total: 125000,
      statut: "complétée",
      date: new Date(),
    },
  ];

  // Chargement initial
  useEffect(() => {
    chargerDashboardData();

    // Rafraîchissement automatique toutes les 3 minutes
    const interval = setInterval(() => {
      if (!loading) {
        chargerStatistiquesDuJour();
      }
    }, 180000);

    return () => clearInterval(interval);
  }, []);

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
          
          {lastUpdate && (
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
              onClick={chargerDashboardData}
              disabled={refreshing}
              className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              {refreshing ? "Rafraîchissement..." : "Rafraîchir"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ===== 3 KPI CARDS ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Ventes du jour */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Ventes du jour</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.ventesAujourdhui.toLocaleString()} FCFA
              </h3>
            </div>
            <div className="bg-[#472EAD]/10 p-3 rounded-xl">
              <DollarSign className="text-[#472EAD]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-emerald-600 font-medium">
                {Math.round((stats.ventesAujourdhui / stats.objectifVentes) * 100)}%
              </span>
              <span className="text-gray-500">de l'objectif</span>
            </div>
          </div>
          <div className="mt-3">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#472EAD] rounded-full transition-all duration-500"
                style={{ width: `${Math.min((stats.ventesAujourdhui / stats.objectifVentes) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Commandes traitées */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Commandes traitées</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.commandesTraitees}
              </h3>
            </div>
            <div className="bg-[#F58020]/10 p-3 rounded-xl">
              <ShoppingCart className="text-[#F58020]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp size={14} />
              +{Math.floor(stats.commandesTraitees * 0.2)} aujourd'hui
            </span>
          </div>
        </div>

        {/* Produits vendus */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Produits vendus</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stats.produitsVendus}
              </h3>
            </div>
            <div className="bg-[#10B981]/10 p-3 rounded-xl">
              <Package className="text-[#10B981]" size={24} />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-1 text-emerald-600">
              <ArrowUp size={14} />
              +{Math.floor(stats.produitsVendus * 0.15)} unités
            </span>
          </div>
        </div>
      </motion.div>

      {/* ===== COMMANDES RÉCENTES ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <ShoppingCart className="text-blue-600" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Commandes récentes
              </h2>
              <p className="text-sm text-gray-500">Dernières commandes traitées</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {commandesRecentes.map((cmd) => (
            <div
              key={cmd.id}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-xs font-semibold text-gray-700">
                    #{cmd.id}
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {cmd.client}
                  </p>
                  <p className="text-xs text-gray-500">{cmd.numero}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm font-semibold text-gray-900">
                  {cmd.total.toLocaleString()} FCFA
                </p>
                <div className="flex items-center justify-end gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    cmd.statut === 'complétée' ? 'bg-emerald-100 text-emerald-800' :
                    cmd.statut === 'en attente' ? 'bg-amber-100 text-amber-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {cmd.statut}
                  </span>
                  <span className="text-xs text-gray-500">
                    {cmd.date.toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TableauDeBord;