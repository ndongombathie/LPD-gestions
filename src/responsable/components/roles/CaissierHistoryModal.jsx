// ==========================================================
// 💰 CaissierHistoryModal.jsx — Historique des opérations financières
// ==========================================================

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Filter,
  Calendar,
  Banknote,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Receipt,
  BarChart3,
  RefreshCw,
  Eye,
  ChevronDown,
  Download,
  List,
  CreditCard,
  Smartphone,
  Wallet,
  Loader2
} from "lucide-react";
import { journalResponsableAPI } from "@/responsable/services/api/JournalResponsable";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "Date invalide";
  }
};

export default function CaissierHistoryModal({ employee,date, isOpen, onClose }) {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreDate, setFiltreDate] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [operationSelectionnee, setOperationSelectionnee] = useState(null);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Charger l'historique réel
  useEffect(() => {
    if (!isOpen || !employee?.caissier?.id) return;

    const loadHistorique = async () => {
      try {
        setLoading(true);

        const response = await journalResponsableAPI.getHistoriqueCaissier(
          employee.caissier.id,
          {
            search: recherche || undefined,
            date: date || undefined,
          }
        );

        setOperations(response ?? []);
      } catch (error) {

        setOperations([]);
      } finally {
        setLoading(false);
      }
    };

    loadHistorique();
  }, [isOpen, employee?.id, recherche]);

  const operationsFiltrees = operations.filter(operation => {
    const typeOperation = operation.type;
    
    const matchType = filtreType === "tous" || typeOperation === filtreType;
    
    // Filtre date
    let matchDate = true;
    if (filtreDate !== "tous") {
      const today = new Date();
      const opDate = new Date(operation.created_at);
      const diffDays = Math.floor((today - opDate) / (1000 * 60 * 60 * 24));
      
      if (filtreDate === "aujourdhui") {
        matchDate = diffDays === 0;
      } else if (filtreDate === "7jours") {
        matchDate = diffDays <= 7;
      } else if (filtreDate === "30jours") {
        matchDate = diffDays <= 30;
      }
    }
    
    const clientNom = operation.client ? `${operation.client.prenom || ''} ${operation.client.nom || ''}`.trim() : '';
    const matchRecherche = !recherche || 
      operation.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
      clientNom.toLowerCase().includes(recherche.toLowerCase()) ||
      operation.fournisseur_nom?.toLowerCase().includes(recherche.toLowerCase()) ||
      operation.description?.toLowerCase().includes(recherche.toLowerCase());
    
    return matchType && matchDate && matchRecherche;
  });

  const getStatutIcone = (statut) => {
    switch (statut) {
      case "payee":
      case "partiellement_payee": return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "en_attente":
      case "en cours": return <Clock className="w-3 h-3 text-amber-500" />;
      case "annulee": return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatutClasse = (statut) => {
    switch (statut) {
      case "payee":
      case "partiellement_payee": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "en_attente":
      case "en cours": return "bg-amber-50 text-amber-700 border-amber-200";
      case "annulee": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getModePaiementIcone = (mode) => {
    switch (mode) {
      case "espèces":
      case "especes": return <DollarSign className="w-3 h-3" />;
      case "carte": return <CreditCard className="w-3 h-3" />;
      case "mobile_money":
      case "mobile money": return <Smartphone className="w-3 h-3" />;
      default: return <Wallet className="w-3 h-3" />;
    }
  };

  const getModePaiementClasse = (mode) => {
    switch (mode) {
      case "espèces":
      case "especes": return "bg-green-50 text-green-700 border-green-200";
      case "carte": return "bg-blue-50 text-blue-700 border-blue-200";
      case "mobile_money":
      case "mobile money": return "bg-purple-50 text-purple-700 border-purple-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const ouvrirDetails = (operation) => {
    setOperationSelectionnee(operation);
    setModalDetailOuvert(true);
  };

  const reinitialiserFiltres = () => {
    setFiltreType("tous");
    setFiltreDate("tous");
    setRecherche("");
    setShowAdvancedFilters(false);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filtreType !== "tous") count++;
    if (filtreDate !== "tous") count++;
    if (recherche) count++;
    return count;
  };

  if (!isOpen) return null;

  const stats = {
    total: operations.length,

    encaissements: operations.filter(o => o.type === 'encaissement' && o.statut !== 'annulee').length,

    decaissements: operations.filter(o => o.type === 'decaissement' && o.statut !== 'annulee').length,

    totalEncaissements: operations
      .filter(o => o.type === 'encaissement' && o.statut !== 'annulee')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0),

    totalDecaissements: operations
      .filter(o => o.type === 'decaissement' && o.statut !== 'annulee')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0),

    soldeNet:
      operations
        .filter(o => o.type === 'encaissement' && o.statut !== 'annulee')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
      -
      operations
        .filter(o => o.type === 'decaissement' && o.statut !== 'annulee')
        .reduce((sum, o) => sum + (Number(o.total) || 0), 0),
  };

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* En-tête FIXE */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-800">Historique des opérations</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                Caissier: <span className="font-semibold">{employee?.name || "Non spécifié"}</span>
                {employee?.email && ` • ${employee.email}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Contenu SCROLLABLE */}
          <div className="flex-1 overflow-y-auto">
            {/* Statistiques */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-sm font-bold text-indigo-600">{stats.total}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Encaissements</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatFCFA(stats.totalEncaissements)}
                  </div>
                  <div className="text-xs text-gray-500">{stats.encaissements} op.</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Décaissements</div>
                  <div className="text-sm font-bold text-red-600">
                    {formatFCFA(stats.totalDecaissements)}
                  </div>
                  <div className="text-xs text-gray-500">{stats.decaissements} op.</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Solde net</div>
                  <div className={`text-sm font-bold ${stats.soldeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatFCFA(stats.soldeNet)}
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-3 h-3 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher référence, client, bénéficiaire..."
                      className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                <div className="flex gap-1">
                  <select
                    value={filtreType}
                    onChange={(e) => setFiltreType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="tous">Tous types</option>
                    <option value="encaissement">Encaissements</option>
                    <option value="decaissement">Décaissements</option>
                  </select>

                  <button
                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                  >
                    <Filter className="w-3 h-3" />
                    {activeFiltersCount() > 0 && `(${activeFiltersCount()})`}
                    <ChevronDown className={`w-3 h-3 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} />
                  </button>
                </div>
              </div>

              {showAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Période
                      </label>
                      <select
                        value={filtreDate}
                        onChange={(e) => setFiltreDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="tous">Toutes dates</option>
                        <option value="aujourdhui">Aujourd'hui</option>
                        <option value="7jours">7 derniers jours</option>
                        <option value="30jours">30 derniers jours</option>
                      </select>
                    </div>

                    <div className="flex items-end justify-end gap-1">
                      {activeFiltersCount() > 0 && (
                        <button
                          onClick={reinitialiserFiltres}
                          className="flex items-center gap-1 px-2 py-1.5 text-xs text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Réinitialiser
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des opérations */}
            <div className="p-4">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm text-gray-600">Chargement des opérations...</p>
                </div>
              ) : operationsFiltrees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-2 bg-gray-100 rounded-full mb-2">
                    <Banknote className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 text-sm">Aucune opération trouvée</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {operations.length === 0 
                      ? "Aucune opération enregistrée pour ce caissier"
                      : "Aucune opération ne correspond à vos critères"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {operationsFiltrees.map((operation) => {
                    const typeOperation = operation.type || 'decaissement';
                    const clientNom = operation.client ? `${operation.client.prenom || ''} ${operation.client.nom || ''}`.trim() : 'Non spécifié';
                    
                    return (
                      <div key={operation.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              {typeOperation === 'encaissement' && (
                                <div className="bg-emerald-50 text-emerald-700 border-emerald-200 px-1.5 py-0.5 rounded text-xs font-medium">
                                  <TrendingUp className="w-2.5 h-2.5 inline mr-1" /> Encaissement
                                </div>
                              )}

                              {typeOperation === 'decaissement' && (
                                <div className="bg-red-50 text-red-700 border-red-200 px-1.5 py-0.5 rounded text-xs font-medium">
                                  <TrendingDown className="w-2.5 h-2.5 inline mr-1" /> Décaissement
                                </div>
                              )}

                              {typeOperation === 'annulation' && (
                                <div className="bg-yellow-50 text-yellow-700 border-yellow-200 px-1.5 py-0.5 rounded text-xs font-medium">
                                  Annulation
                                </div>
                              )}

                              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatutClasse(operation.statut)}`}>
                                {getStatutIcone(operation.statut)} {operation.statut}
                              </div>
                              {operation.mode_paiement && (
                                <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getModePaiementClasse(operation.mode_paiement)}`}>
                                  {getModePaiementIcone(operation.mode_paiement)} {operation.mode_paiement}
                                </div>
                              )}
                            </div>

                            <h3 className="font-semibold text-gray-800 text-sm mb-1">
                              {operation.reference}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(operation.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                {typeOperation === 'encaissement' ? 
                                  <>Client: {clientNom}</> : 
                                  <>Bénéficiaire: {operation.fournisseur_nom || 'Non spécifié'}</>
                                }
                              </span>
                            </div>

                            {/* Détails rapides */}
                            <div className="mt-2">
                              <div className="text-xs text-gray-500">
                                {typeOperation === 'encaissement' ? 
                                  <>Ticket: {operation.numero_ticket || 'Non spécifié'}</> : 
                                  <>Motif: {operation.description || 'Non spécifié'}</>
                                }
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className={`text-sm font-bold ${typeOperation === 'encaissement' ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatFCFA(operation.total || 0)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {typeOperation === 'encaissement' ? 
                                  <>TTC: {formatFCFA(operation.total || 0)}</> : 
                                  <>Catégorie: {operation.categorie || 'Général'}</>
                                }
                              </div>
                            </div>

                            <button
                              onClick={() => ouvrirDetails(operation)}
                              className="flex items-center gap-1 px-2 py-1 text-xs text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              Détails
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pied de modal FIXE */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-gray-600">
              {operationsFiltrees.length} sur {operations.length} opérations
            </div>
            <div className="flex items-center gap-1">
              <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 bg-white border border-gray-300 rounded hover:bg-gray-50">
                <Download className="w-3 h-3" />
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de détails */}
      {modalDetailOuvert && operationSelectionnee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* En-tête */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Détails de l'opération</h2>
                    <p className="text-xs text-gray-500">{operationSelectionnee.reference}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setModalDetailOuvert(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Contenu */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Informations générales */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-blue-600" />
                    Informations
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Type</div>
                      <div className="text-xs font-medium mt-0.5">
                        {operationSelectionnee.type}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Date</div>
                      <div className="text-xs font-medium text-gray-800 mt-0.5">{formatDate(operationSelectionnee.created_at)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${getStatutClasse(operationSelectionnee.statut)} px-1.5 py-0.5 rounded`}>
                        {getStatutIcone(operationSelectionnee.statut)} {operationSelectionnee.statut}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Montant</div>
                      <div className={`text-xs font-bold mt-0.5 ${operationSelectionnee.type === 'encaissement' ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatFCFA(operationSelectionnee.total || 0)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bloc annulation */}
                {operationSelectionnee.statut === 'annulee' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                      <XCircle className="w-4 h-4 text-red-600" />
                      Annulation
                    </h3>
                    <div className="bg-red-50 rounded p-3 border border-red-200">
                      <div className="text-xs text-red-700">
                        <span className="font-medium">Raison :</span> {operationSelectionnee.raison_annulation || 'Non spécifiée'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Détails spécifiques */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    {operationSelectionnee.type === 'encaissement' ? 'Détails encaissement' : 'Détails décaissement'}
                  </h3>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {operationSelectionnee.type === 'encaissement' ? (
                        <>
                          <div>
                            <div className="text-xs text-gray-500">Client</div>
                            <div className="text-xs font-medium text-gray-800">
                              {operationSelectionnee.client ? `${operationSelectionnee.client.prenom || ''} ${operationSelectionnee.client.nom || ''}`.trim() : 'Non spécifié'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Mode paiement</div>
                            <div className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${getModePaiementClasse(operationSelectionnee.mode_paiement)} px-1.5 py-0.5 rounded`}>
                              {getModePaiementIcone(operationSelectionnee.mode_paiement)} {operationSelectionnee.mode_paiement || 'Non spécifié'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Ticket associé</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.numero_ticket || 'Non spécifié'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Vendeur</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.vendeur_nom || 'Non spécifié'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">Produits</div>
                            <div className="text-xs font-medium text-gray-800">
                              {operationSelectionnee.produits?.map(p => p.nom).join(', ') || 'Non spécifié'}
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <div className="text-xs text-gray-500">Bénéficiaire</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.fournisseur_nom || 'Non spécifié'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Motif</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.description || 'Non spécifié'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Catégorie</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.categorie || 'Général'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Approuvé par</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.approuve_par || 'En attente'}</div>
                          </div>
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">Justificatif</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.justificatif || 'Non fourni'}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Totaux pour encaissement */}
                {operationSelectionnee.type === 'encaissement' && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      Détails financiers
                    </h3>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">Total HT</span>
                          <span className="text-xs font-medium">{formatFCFA(operationSelectionnee.total_ht || operationSelectionnee.total * 0.847)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-xs text-gray-600">TVA (18%)</span>
                          <span className="text-xs font-medium">{formatFCFA(operationSelectionnee.tva || operationSelectionnee.total * 0.153)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-gray-300">
                          <span className="text-sm font-semibold">Total TTC</span>
                          <span className="text-sm font-bold text-emerald-600">
                            {formatFCFA(operationSelectionnee.total || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Pied de modal */}
            <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={() => setModalDetailOuvert(false)}
                className="w-full px-3 py-2 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors"
              >
                Fermer les détails
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}