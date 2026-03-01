// ==========================================================
// 🏪 GestionnaireBoutiqueHistoryModal.jsx — Historique des opérations de stock
// ==========================================================

import React, { useState } from "react";
import {
  X,
  Search,
  Filter,
  Calendar,
  Package,
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
  Truck,
  Box,
  Layers,
  AlertTriangle,
  CheckSquare,
} from "lucide-react";

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

export default function GestionnaireBoutiqueHistoryModal({ employee, isOpen, onClose }) {
  const [filtreType, setFiltreType] = useState("tous");
  const [filtreDate, setFiltreDate] = useState("tous");
  const [recherche, setRecherche] = useState("");
  const [operationSelectionnee, setOperationSelectionnee] = useState(null);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Générer des données d'opérations simulées basées sur l'historique fourni
  const genererOperationsSimulees = () => {
    return [
      {
        id: "OP-STK-001",
        type: "transfert_recu",
        action: "Transfert reçu",
        produit: "Ramette A4",
        quantite: 100,
        valeur: 150000,
        reference: "TRF-BOUT-2024-001",
        fournisseur: "Dépôt Central",
        date: new Date().toISOString(),
        statut: "validé",
        utilisateur: employee?.name || "Gestionnaire Boutique",
        details: {
          numero_bon: "BON-TRF-2024-123",
          vendeur: "Mohamed Diallo",
          emplacement: "Rayon Papeterie A",
          notes: "Livraison complète, vérifiée",
          produits_associes: ["Ramette A4", "Classeurs A4"],
          prix_unitaire: 1500
        }
      },
      {
        id: "OP-STK-002",
        type: "produit_valide",
        action: "Produit validé",
        produit: "Stylo bleu BIC",
        quantite: 50,
        valeur: 25000,
        reference: "VAL-PROD-2024-001",
        fournisseur: "Fournisseur Papeterie",
        date: new Date(Date.now() - 3600000).toISOString(),
        statut: "validé",
        utilisateur: employee?.name || "Gestionnaire Boutique",
        details: {
          numero_bon: "BON-REC-2024-456",
          categorie: "Fournitures bureau",
          code_barre: "1234567890123",
          seuil_alerte: 20,
          emplacement: "Rayon Écriture B",
          prix_vente: 600
        }
      },
      {
        id: "OP-STK-003",
        type: "produit_modifie",
        action: "Produit modifié",
        produit: "Classeur archives A4",
        quantite: null,
        valeur: null,
        reference: "MOD-PROD-2024-001",
        fournisseur: null,
        date: new Date(Date.now() - 7200000).toISOString(),
        statut: "validé",
        utilisateur: employee?.name || "Gestionnaire Boutique",
        details: {
          modifications: "Mise à jour du seuil d'alerte de 15 à 20 unités",
          ancienne_valeur: "Seuil: 15",
          nouvelle_valeur: "Seuil: 20",
          raison: "Adaptation à la demande",
          emplacement: "Rayon Archives"
        }
      },
      {
        id: "OP-STK-004",
        type: "inventaire",
        action: "Inventaire partiel",
        produit: "Cahier 200 pages",
        quantite: -3,
        valeur: -4500,
        reference: "INV-PART-2024-001",
        fournisseur: null,
        date: new Date(Date.now() - 10800000).toISOString(),
        statut: "validé",
        utilisateur: employee?.name || "Gestionnaire Boutique",
        details: {
          type_inventaire: "Partiel",
          rayon: "Rayon Cahiers",
          stock_theorique: 87,
          stock_reel: 84,
          difference: -3,
          raison: "Ajustement suite comptage"
        }
      },
      {
        id: "OP-STK-005",
        type: "transfert_recu",
        action: "Transfert reçu",
        produit: "Enveloppes kraft",
        quantite: 200,
        valeur: 30000,
        reference: "TRF-BOUT-2024-002",
        fournisseur: "Dépôt Central",
        date: new Date(Date.now() - 14400000).toISOString(),
        statut: "en_attente",
        utilisateur: employee?.name || "Gestionnaire Boutique",
        details: {
          numero_bon: "BON-TRF-2024-789",
          vendeur: "Fatou Bâ",
          emplacement: "Rayon Emballage",
          notes: "En attente de vérification qualité",
          produits_associes: ["Enveloppes kraft A5", "Enveloppes kraft A4"],
          prix_unitaire: 150
        }
      }
    ];
  };

  const operations = genererOperationsSimulees();

  const operationsFiltrees = operations.filter(operation => {
    const matchType = filtreType === "tous" || operation.type === filtreType;
    const matchRecherche = !recherche || 
      operation.reference?.toLowerCase().includes(recherche.toLowerCase()) ||
      operation.produit?.toLowerCase().includes(recherche.toLowerCase()) ||
      operation.fournisseur?.toLowerCase().includes(recherche.toLowerCase()) ||
      operation.action?.toLowerCase().includes(recherche.toLowerCase());
    
    return matchType && matchRecherche;
  });

  const getStatutIcone = (statut) => {
    switch (statut) {
      case "validé":
        return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "en_attente":
        return <Clock className="w-3 h-3 text-amber-500" />;
      case "rejeté":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatutClasse = (statut) => {
    switch (statut) {
      case "validé":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "en_attente":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejeté":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getActionIcone = (type) => {
    switch (type) {
      case "transfert_recu":
        return <Truck className="w-3 h-3" />;
      case "produit_valide":
        return <CheckSquare className="w-3 h-3" />;
      case "produit_modifie":
        return <Layers className="w-3 h-3" />;
      case "inventaire":
        return <BarChart3 className="w-3 h-3" />;
      default:
        return <Package className="w-3 h-3" />;
    }
  };

  const getActionClasse = (type) => {
    switch (type) {
      case "transfert_recu":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "produit_valide":
        return "bg-green-50 text-green-700 border-green-200";
      case "produit_modifie":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "inventaire":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
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
    transferts: operations.filter(o => o.type === "transfert_recu").length,
    validations: operations.filter(o => o.type === "produit_valide").length,
    modifications: operations.filter(o => o.type === "produit_modifie").length,
    inventaires: operations.filter(o => o.type === "inventaire").length,
    totalQuantite: operations.reduce((sum, o) => sum + (o.quantite || 0), 0),
    totalValeur: operations.reduce((sum, o) => sum + (o.valeur || 0), 0),
    valides: operations.filter(o => o.statut === "validé").length,
    enAttente: operations.filter(o => o.statut === "en_attente").length,
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
                <h2 className="text-lg font-bold text-gray-800">Historique des opérations de stock</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                Gestionnaire: <span className="font-semibold">{employee?.name || "Non spécifié"}</span>
                {employee?.boutique && ` • ${employee.boutique}`}
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
                  <div className="text-xs text-gray-500">Total opérations</div>
                  <div className="text-sm font-bold text-indigo-600">{stats.total}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Transferts reçus</div>
                  <div className="text-sm font-bold text-blue-600">{stats.transferts}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Quantité totale</div>
                  <div className="text-sm font-bold text-emerald-600">{stats.totalQuantite} unités</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Valeur totale</div>
                  <div className="text-sm font-bold text-purple-600">{formatFCFA(stats.totalValeur)}</div>
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
                      placeholder="Rechercher référence, produit, fournisseur..."
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
                    <option value="transfert_recu">Transferts reçus</option>
                    <option value="produit_valide">Produits validés</option>
                    <option value="produit_modifie">Produits modifiés</option>
                    <option value="inventaire">Inventaires</option>
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
              {operationsFiltrees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-2 bg-gray-100 rounded-full mb-2">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 text-sm">Aucune opération trouvée</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Aucune opération ne correspond à vos critères
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {operationsFiltrees.map((operation) => (
                    <div key={operation.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getActionClasse(operation.type)}`}>
                              {getActionIcone(operation.type)} {operation.action}
                            </div>
                            <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatutClasse(operation.statut)}`}>
                              {getStatutIcone(operation.statut)} {operation.statut}
                            </div>
                          </div>

                          <h3 className="font-semibold text-gray-800 text-sm mb-1">
                            {operation.produit}
                          </h3>
                          
                          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(operation.date)}
                            </span>
                            <span className="flex items-center gap-1">
                              Réf: {operation.reference}
                            </span>
                            {operation.fournisseur && (
                              <span className="flex items-center gap-1">
                                Fournisseur: {operation.fournisseur}
                              </span>
                            )}
                          </div>

                          {/* Détails rapides */}
                          <div className="mt-2">
                            <div className="text-xs text-gray-500">
                              {operation.details?.notes || operation.details?.modifications || operation.details?.type_inventaire}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            {operation.quantite !== null && (
                              <div className="text-sm font-bold text-gray-800">
                                {operation.quantite > 0 ? '+' : ''}{operation.quantite} unités
                              </div>
                            )}
                            {operation.valeur !== null && (
                              <div className={`text-xs font-semibold ${operation.valeur >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {formatFCFA(operation.valeur)}
                              </div>
                            )}
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
                  ))}
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
                      <div className="text-xs text-gray-500">Action</div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${getActionClasse(operationSelectionnee.type)} px-1.5 py-0.5 rounded`}>
                        {getActionIcone(operationSelectionnee.type)} {operationSelectionnee.action}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Date</div>
                      <div className="text-xs font-medium text-gray-800 mt-0.5">{formatDate(operationSelectionnee.date)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${getStatutClasse(operationSelectionnee.statut)} px-1.5 py-0.5 rounded`}>
                        {getStatutIcone(operationSelectionnee.statut)} {operationSelectionnee.statut}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Produit</div>
                      <div className="text-xs font-medium text-gray-800 mt-0.5">{operationSelectionnee.produit}</div>
                    </div>
                  </div>
                </div>

                {/* Détails spécifiques */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    Détails opération
                  </h3>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2">
                      {operationSelectionnee.quantite !== null && (
                        <div>
                          <div className="text-xs text-gray-500">Quantité</div>
                          <div className={`text-xs font-bold mt-0.5 ${operationSelectionnee.quantite >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {operationSelectionnee.quantite > 0 ? '+' : ''}{operationSelectionnee.quantite} unités
                          </div>
                        </div>
                      )}
                      {operationSelectionnee.valeur !== null && (
                        <div>
                          <div className="text-xs text-gray-500">Valeur</div>
                          <div className={`text-xs font-bold mt-0.5 ${operationSelectionnee.valeur >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {formatFCFA(operationSelectionnee.valeur)}
                          </div>
                        </div>
                      )}
                      {operationSelectionnee.fournisseur && (
                        <div>
                          <div className="text-xs text-gray-500">Fournisseur</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.fournisseur}</div>
                        </div>
                      )}
                      {operationSelectionnee.details?.numero_bon && (
                        <div>
                          <div className="text-xs text-gray-500">N° Bon</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.numero_bon}</div>
                        </div>
                      )}
                      {operationSelectionnee.details?.emplacement && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">Emplacement</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.emplacement}</div>
                        </div>
                      )}
                      {operationSelectionnee.details?.modifications && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">Modifications</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.modifications}</div>
                        </div>
                      )}
                      {operationSelectionnee.details?.notes && (
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">Notes</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires pour inventaire */}
                {operationSelectionnee.type === "inventaire" && operationSelectionnee.details && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                      <Layers className="w-4 h-4 text-blue-600" />
                      Détails inventaire
                    </h3>
                    <div className="bg-gray-50 rounded p-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-gray-500">Type</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.type_inventaire}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Rayon</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.rayon}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Stock théorique</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.stock_theorique} unités</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Stock réel</div>
                          <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.stock_reel} unités</div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-gray-500">Différence</div>
                          <div className={`text-xs font-bold ${operationSelectionnee.details.difference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {operationSelectionnee.details.difference > 0 ? '+' : ''}{operationSelectionnee.details.difference} unités
                          </div>
                        </div>
                        {operationSelectionnee.details.raison && (
                          <div className="col-span-2">
                            <div className="text-xs text-gray-500">Raison</div>
                            <div className="text-xs font-medium text-gray-800">{operationSelectionnee.details.raison}</div>
                          </div>
                        )}
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