// ==========================================================
// 📋 EmployeeHistoryModal.jsx — Modal d'historique des commandes (Scrollable)
// ==========================================================

import React, { useState } from "react";
import {
  X,
  Search,
  Filter,
  Calendar,
  User,
  Phone,
  Package,
  ShoppingBag,
  Palette,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  BarChart3,
  RefreshCw,
  Eye,
  ChevronDown,
  Download,
  List,
} from "lucide-react";

const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "XOF",
  }).format(Number(n || 0));

export default function EmployeeHistoryModal({ employee, isOpen, onClose }) {
  const [filtreStatut, setFiltreStatut] = useState("tous");
  const [filtreTypeVente, setFiltreTypeVente] = useState("tous");
  const [filtreDate, setFiltreDate] = useState("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [recherche, setRecherche] = useState("");
  const [commandeSelectionnee, setCommandeSelectionnee] = useState(null);
  const [modalDetailOuvert, setModalDetailOuvert] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Générer des données de commandes simulées pour ce vendeur
  const genererCommandesSimulees = () => {
    const aujourdhui = new Date();
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    const ilYa3Jours = new Date(aujourdhui);
    ilYa3Jours.setDate(ilYa3Jours.getDate() - 3);
    const ilYa5Jours = new Date(aujourdhui);
    ilYa5Jours.setDate(ilYa5Jours.getDate() - 5);

    return [
      {
        id: 1,
        numero_commande: "CMD-2024-001",
        client: { nom: "Marie Diop", telephone: "77 123 45 67", adresse: "Dakar, Plateau" },
        total_ht: 40000,
        tva: 7200,
        total_ttc: 47200,
        statut: "complétée",
        types_vente: ["détail", "gros"],
        date: aujourdhui.toISOString(),
        vendeur: employee?.name || "Vendeur",
        produits: [
          { 
            nom: "Bloc Note Mood diary", 
            quantite: 2, 
            prix_unitaire: 350, 
            prix_vente: 350, 
            reference: "Mood diary",
            sous_total: 700,
            type_vente: "détail"
          },
          { 
            nom: "Kirene", 
            quantite: 10, 
            prix_unitaire: 3800, 
            prix_vente: 3800, 
            reference: "Kirene",
            sous_total: 38000,
            type_vente: "gros"
          }
        ]
      },
      {
        id: 2,
        numero_commande: "CMD-2024-002",
        client: { nom: "Jean Dupont", telephone: "76 234 56 78", adresse: "Dakar, Almadies" },
        total_ht: 75000,
        tva: 13500,
        total_ttc: 88500,
        statut: "en_attente_paiement",
        types_vente: ["gros"],
        date: hier.toISOString(),
        vendeur: employee?.name || "Vendeur",
        produits: [
          { 
            nom: "Aggraffes", 
            quantite: 5, 
            prix_unitaire: 1000, 
            prix_vente: 1000, 
            reference: "Agg-NO-384556",
            sous_total: 5000,
            type_vente: "gros"
          },
          { 
            nom: "Kirene", 
            quantite: 10, 
            prix_unitaire: 3800, 
            prix_vente: 3800, 
            reference: "Kirene",
            sous_total: 38000,
            type_vente: "gros"
          }
        ]
      }
    ];
  };

  const commandes = genererCommandesSimulees();

  // Helpers
  const normaliserDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    } catch (error) {
      return null;
    }
  };

  const commandeCorrespondAuType = (commande, typeFiltre) => {
    if (typeFiltre === "tous") return true;
    if (typeFiltre === "mixte") {
      return commande.types_vente && commande.types_vente.length > 1;
    }
    if (commande.types_vente && Array.isArray(commande.types_vente)) {
      return commande.types_vente.includes(typeFiltre);
    }
    return commande.type_vente === typeFiltre;
  };

  const commandeCorrespondADate = (commande, dateFiltre) => {
    if (dateFiltre === "tous") return true;
    const dateCommande = normaliserDate(commande.date);
    if (!dateCommande) return false;
    if (dateFiltre === "personnalisee") {
      if (!dateDebut && !dateFin) return true;
      const debut = dateDebut ? normaliserDate(dateDebut) : null;
      const fin = dateFin ? normaliserDate(dateFin) : null;
      if (debut && !fin) return dateCommande.getTime() === debut.getTime();
      if (!debut && fin) return dateCommande.getTime() === fin.getTime();
      if (debut && fin) return dateCommande >= debut && dateCommande <= fin;
      return true;
    }
    const aujourdhui = normaliserDate(new Date());
    const hier = new Date(aujourdhui);
    hier.setDate(hier.getDate() - 1);
    switch (dateFiltre) {
      case "aujourdhui":
        return dateCommande.getTime() === aujourdhui.getTime();
      case "hier":
        return dateCommande.getTime() === hier.getTime();
      case "7jours": {
        const date7Jours = new Date(aujourdhui);
        date7Jours.setDate(date7Jours.getDate() - 7);
        return dateCommande >= date7Jours;
      }
      case "30jours": {
        const date30Jours = new Date(aujourdhui);
        date30Jours.setDate(date30Jours.getDate() - 30);
        return dateCommande >= date30Jours;
      }
      default:
        return true;
    }
  };

  const commandeCorrespondARecherche = (commande, termeRecherche) => {
    if (!termeRecherche.trim()) return true;
    const terme = termeRecherche.toLowerCase().trim();
    if (commande.numero_commande?.toLowerCase().includes(terme)) return true;
    if (commande.client?.nom?.toLowerCase().includes(terme)) return true;
    if (commande.client?.telephone?.includes(terme)) return true;
    return false;
  };

  const commandesFiltrees = commandes.filter(commande => {
    const matchStatut = filtreStatut === "tous" || commande.statut === filtreStatut;
    const matchTypeVente = commandeCorrespondAuType(commande, filtreTypeVente);
    const matchDate = commandeCorrespondADate(commande, filtreDate);
    const matchRecherche = commandeCorrespondARecherche(commande, recherche);
    return matchStatut && matchTypeVente && matchDate && matchRecherche;
  });

  const getAffichageTypesVente = (commande) => {
    if (commande.types_vente && Array.isArray(commande.types_vente)) {
      return commande.types_vente.length === 1 ? commande.types_vente[0] : "mixte";
    }
    return commande.type_vente || "détail";
  };

  const getStatutIcone = (statut) => {
    switch (statut) {
      case "complétée": return <CheckCircle className="w-3 h-3 text-emerald-500" />;
      case "en_attente_paiement": return <Clock className="w-3 h-3 text-amber-500" />;
      case "annulée": return <XCircle className="w-3 h-3 text-red-500" />;
      default: return <FileText className="w-3 h-3 text-gray-500" />;
    }
  };

  const getStatutClasse = (statut) => {
    switch (statut) {
      case "complétée": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "en_attente_paiement": return "bg-amber-50 text-amber-700 border-amber-200";
      case "annulée": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getTypeVenteIcone = (type) => {
    switch (type) {
      case "détail": return <ShoppingBag className="w-3 h-3" />;
      case "gros": return <Palette className="w-3 h-3" />;
      case "mixte": return <TrendingUp className="w-3 h-3" />;
      default: return <Package className="w-3 h-3" />;
    }
  };

  const getTypeVenteClasse = (type) => {
    switch (type) {
      case "détail": return "bg-blue-50 text-blue-700 border-blue-200";
      case "gros": return "bg-purple-50 text-purple-700 border-purple-200";
      case "mixte": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const formaterDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  const formaterDateSimple = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch (error) {
      return "Date invalide";
    }
  };

  const ouvrirDetails = (commande) => {
    setCommandeSelectionnee(commande);
    setModalDetailOuvert(true);
  };

  const fermerDetails = () => {
    setModalDetailOuvert(false);
    setCommandeSelectionnee(null);
  };

  const compterProduitsParType = (commande) => {
    const compteur = { détail: 0, gros: 0 };
    if (commande.produits && Array.isArray(commande.produits)) {
      commande.produits.forEach(produit => {
        if (produit.type_vente === "détail") compteur.détail += produit.quantite || 0;
        else if (produit.type_vente === "gros") compteur.gros += produit.quantite || 0;
      });
    }
    return compteur;
  };

  const calculerTotalParType = (commande) => {
    const totals = { détail: 0, gros: 0 };
    if (commande.produits && Array.isArray(commande.produits)) {
      commande.produits.forEach(produit => {
        const sousTotal = (produit.prix_vente || produit.prix_unitaire || 0) * (produit.quantite || 0);
        if (produit.type_vente === "détail") totals.détail += sousTotal;
        else if (produit.type_vente === "gros") totals.gros += sousTotal;
      });
    }
    return totals;
  };

  const reinitialiserFiltres = () => {
    setFiltreStatut("tous");
    setFiltreTypeVente("tous");
    setFiltreDate("tous");
    setDateDebut("");
    setDateFin("");
    setRecherche("");
    setShowAdvancedFilters(false);
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filtreStatut !== "tous") count++;
    if (filtreTypeVente !== "tous") count++;
    if (filtreDate !== "tous") count++;
    if (recherche) count++;
    return count;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
        <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* En-tête FIXE (seulement celui-ci reste fixe) */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <List className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-bold text-gray-800">Historique des commandes</h2>
              </div>
              <p className="text-xs text-gray-500 mt-1 truncate">
                Vendeur: <span className="font-semibold">{employee?.name || "Non spécifié"}</span>
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

          {/* Contenu SCROLLABLE (tout le reste défile) */}
          <div className="flex-1 overflow-y-auto">
            {/* Statistiques compactes */}
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Total</div>
                  <div className="text-sm font-bold text-indigo-600">{commandes.length}</div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Complétées</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {commandes.filter(c => c.statut === "complétée").length}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">En attente</div>
                  <div className="text-sm font-bold text-amber-600">
                    {commandes.filter(c => c.statut === "en_attente_paiement").length}
                  </div>
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-2">
                  <div className="text-xs text-gray-500">Chiffre total</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatFCFA(commandes.reduce((sum, c) => sum + (c.total_ttc || 0), 0))}
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                {/* Recherche */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-3 h-3 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Rechercher..."
                      className="pl-8 w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                    />
                  </div>
                </div>

                {/* Filtres basiques */}
                <div className="flex gap-1">
                  <select
                    value={filtreStatut}
                    onChange={(e) => setFiltreStatut(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                  >
                    <option value="tous">Tous statuts</option>
                    <option value="complétée">Complétées</option>
                    <option value="en_attente_paiement">En attente</option>
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

              {/* Filtres avancés */}
              {showAdvancedFilters && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Type de vente
                      </label>
                      <select
                        value={filtreTypeVente}
                        onChange={(e) => setFiltreTypeVente(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-xs"
                      >
                        <option value="tous">Tous types</option>
                        <option value="détail">Détail uniquement</option>
                        <option value="gros">Gros uniquement</option>
                        <option value="mixte">Mixtes</option>
                      </select>
                    </div>

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
                        <option value="hier">Hier</option>
                        <option value="7jours">7 derniers jours</option>
                      </select>
                    </div>

                    <div className="flex items-end gap-1">
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

            {/* Liste des commandes */}
            <div className="p-4">
              {commandesFiltrees.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-2 bg-gray-100 rounded-full mb-2">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700 text-sm">Aucune commande trouvée</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Aucune commande ne correspond à vos critères
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commandesFiltrees.map((commande) => {
                    const typesAffichage = getAffichageTypesVente(commande);
                    const compteurProduits = compterProduitsParType(commande);
                    const totalsParType = calculerTotalParType(commande);

                    return (
                      <div key={commande.id} className="bg-white border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors">
                        {/* En-tête de la carte */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          {/* Informations principales */}
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-1.5 mb-2">
                              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatutClasse(commande.statut)}`}>
                                {getStatutIcone(commande.statut)} <span className="hidden sm:inline">{commande.statut}</span>
                              </div>
                              <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeVenteClasse(typesAffichage)}`}>
                                {getTypeVenteIcone(typesAffichage)} <span className="hidden sm:inline">{typesAffichage}</span>
                              </div>
                            </div>

                            <h3 className="font-semibold text-gray-800 text-sm mb-1">
                              {commande.numero_commande}
                            </h3>
                            
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 mb-2">
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">{commande.client?.nom}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formaterDate(commande.date)}
                              </span>
                            </div>

                            {/* Produits */}
                            <div className="mt-2">
                              <div className="flex flex-wrap gap-1">
                                {compteurProduits.détail > 0 && (
                                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded">
                                    <ShoppingBag className="w-2.5 h-2.5 inline mr-0.5" />
                                    {compteurProduits.détail} détail - {formatFCFA(totalsParType.détail)}
                                  </span>
                                )}
                                {compteurProduits.gros > 0 && (
                                  <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded">
                                    <Palette className="w-2.5 h-2.5 inline mr-0.5" />
                                    {compteurProduits.gros} gros - {formatFCFA(totalsParType.gros)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Total et actions */}
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-right">
                              <div className="text-sm font-bold text-emerald-600">
                                {formatFCFA(commande.total_ttc || 0)}
                              </div>
                              <div className="text-xs text-gray-500">
                                HT: {formatFCFA(commande.total_ht || 0)}
                              </div>
                            </div>

                            <button
                              onClick={() => ouvrirDetails(commande)}
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
              {commandesFiltrees.length} sur {commandes.length} commandes
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

      {/* Modal de détails (séparé) */}
      {modalDetailOuvert && commandeSelectionnee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-2">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* En-tête FIXE */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h2 className="text-sm font-bold text-gray-800">Détails de commande</h2>
                    <p className="text-xs text-gray-500">{commandeSelectionnee.numero_commande}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={fermerDetails}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors ml-2"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Contenu SCROLLABLE */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Informations générales */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <Receipt className="w-4 h-4 text-indigo-600" />
                    Informations
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Statut</div>
                      <div className={`inline-flex items-center gap-1 text-xs font-medium mt-0.5 ${getStatutClasse(commandeSelectionnee.statut)} px-1.5 py-0.5 rounded`}>
                        {getStatutIcone(commandeSelectionnee.statut)}
                        <span className="capitalize">{commandeSelectionnee.statut}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <div className="text-xs text-gray-500">Date</div>
                      <div className="text-xs font-medium text-gray-800 mt-0.5">{formaterDate(commandeSelectionnee.date)}</div>
                    </div>
                    <div className="bg-gray-50 rounded p-2 col-span-2">
                      <div className="text-xs text-gray-500">Type(s) de vente</div>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {commandeSelectionnee.types_vente?.map((type) => (
                          <span key={type} className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeVenteClasse(type)}`}>
                            {getTypeVenteIcone(type)} {type}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informations client */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <User className="w-4 h-4 text-indigo-600" />
                    Client
                  </h3>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs text-gray-500">Nom</div>
                        <div className="text-xs font-medium text-gray-800">{commandeSelectionnee.client?.nom}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Téléphone</div>
                        <div className="text-xs font-medium text-gray-800">{commandeSelectionnee.client?.telephone}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Adresse</div>
                        <div className="text-xs font-medium text-gray-800">{commandeSelectionnee.client?.adresse}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Produits */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <Package className="w-4 h-4 text-indigo-600" />
                    Produits ({commandeSelectionnee.produits?.length || 0})
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-2 py-1 text-left font-medium text-gray-500">Produit</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-500">Type</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-500">Qté</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-500">Prix</th>
                          <th className="px-2 py-1 text-left font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commandeSelectionnee.produits?.map((produit, index) => {
                          const prixUnitaire = produit.prix_vente || produit.prix_unitaire || 0;
                          const sousTotal = prixUnitaire * (produit.quantite || 0);
                          return (
                            <tr key={index} className="border-t border-gray-100">
                              <td className="px-2 py-1.5">
                                <div>
                                  <div className="font-medium">{produit.nom}</div>
                                  <div className="text-gray-500 text-xs">{produit.reference}</div>
                                </div>
                              </td>
                              <td className="px-2 py-1.5">
                                <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs ${produit.type_vente === 'détail' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                  {produit.type_vente === 'détail' ? (
                                    <ShoppingBag className="w-2.5 h-2.5" />
                                  ) : (
                                    <Palette className="w-2.5 h-2.5" />
                                  )}
                                </span>
                              </td>
                              <td className="px-2 py-1.5">{produit.quantite}</td>
                              <td className="px-2 py-1.5">{formatFCFA(prixUnitaire)}</td>
                              <td className="px-2 py-1.5 font-medium text-emerald-600">{formatFCFA(sousTotal)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Totaux */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1">
                    <BarChart3 className="w-4 h-4 text-indigo-600" />
                    Totaux
                  </h3>
                  <div className="bg-gray-50 rounded p-3">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total HT</span>
                        <span className="text-xs font-medium">{formatFCFA(commandeSelectionnee.total_ht || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">TVA (18%)</span>
                        <span className="text-xs font-medium">{formatFCFA(commandeSelectionnee.tva || 0)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-300">
                        <span className="text-sm font-semibold">Total TTC</span>
                        <span className="text-sm font-bold text-emerald-600">
                          {formatFCFA(commandeSelectionnee.total_ttc || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pied de modal FIXE */}
            <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0">
              <button
                onClick={fermerDetails}
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