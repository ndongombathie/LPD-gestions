import React, { useState, useEffect } from "react";
import { FileText, Filter, Download, Eye } from "lucide-react";
import DataTable from "../components/DataTable";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import { gestionnaireBoutiqueAPI } from "@/services/api";
import { toast } from "sonner";

const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreAction, setFiltreAction] = useState("Tous");
  const [detailEntry, setDetailEntry] = useState(null);

  const actions = ["Tous", "Transfert reçu", "Produit validé", "Produit modifié", "Produit supprimé"];

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        
        // Utiliser Promise.allSettled pour mieux gérer les erreurs
        const results = await Promise.allSettled([
          gestionnaireBoutiqueAPI.getProduitsTransfer(),
          gestionnaireBoutiqueAPI.getTransfertsValides(),
        ]);
        
        if (!mounted) return;
        
        const [pendingResult, validesResult] = results;
        
        const pendingData = pendingResult.status === 'fulfilled' ? pendingResult.value : { data: [], total: 0 };
        const validesData = validesResult.status === 'fulfilled' ? validesResult.value : { data: [], total: 0 };
        
        const pending = Array.isArray(pendingData?.data) ? pendingData.data : [];
        const valides = Array.isArray(validesData?.data) ? validesData.data : [];
        
        const mapPending = pending.map((t) => ({
          id: `p-${t.id}`,
          date: t.created_at || new Date().toISOString(),
          action: 'Transfert reçu',
          produit: t.produit?.nom || t.nom || `#${t.produit_id}`,
          code_produit: t.produit?.code || 'N/A',
          quantite: t.quantite,
          cartons: t.nombre_carton,
          utilisateur: 'Gestionnaire dépôt',
          statut: 'en_attente',
        }));
        
        const mapValides = valides.map((t) => ({
          id: `v-${t.id}`,
          date: t.updated_at || t.created_at || new Date().toISOString(),
          action: 'Produit validé',
          produit: t.produit?.nom || t.nom || `#${t.produit_id}`,
          code_produit: t.produit?.code || 'N/A',
          quantite: t.quantite,
          cartons: t.nombre_carton,
          utilisateur: 'Gestionnaire boutique',
          statut: 'validé',
        }));
        
        const merged = [...mapPending, ...mapValides].sort((a, b) => new Date(b.date) - new Date(a.date));
        setHistorique(merged);
      } catch (error) {
        console.error('❌ Erreur chargement historique:', error);
        toast.error('Erreur de chargement', { description: "Impossible de charger l'historique" });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const historiqueFiltres = historique.filter((h) =>
    filtreAction === "Tous" || h.action === filtreAction
  );

  const downloadCSV = () => {
    const headers = ["Date", "Action", "Produit", "Quantité", "Utilisateur", "Statut"];
    const rows = historiqueFiltres.map((h) => [
      new Date(h.date).toLocaleString("fr-FR"),
      h.action,
      h.produit,
      h.quantite || "-",
      h.utilisateur,
      h.statut || "-",
    ]);
    const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `historique_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getActionColor = (action) => {
    switch (action) {
      case "Produit validé":
        return "bg-green-100 text-green-800";
      case "Transfert reçu":
        return "bg-blue-100 text-blue-800";
      case "Produit modifié":
        return "bg-yellow-100 text-yellow-800";
      case "Produit supprimé":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case "validé":
        return "text-green-600 font-semibold";
      case "en_attente":
        return "text-[#F58020] font-semibold";
      case "rejeté":
        return "text-red-600 font-semibold";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-y-auto">
      <div className="px-6 space-y-6 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-[#111827] flex items-center gap-3">
              <FileText size={32} className="text-[#472EAD]" />
              Historique et Audit
            </h2>
            <p className="text-gray-600 mt-1">Tous les changements et validations sont enregistrés</p>
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 bg-[#472EAD] text-white px-4 py-2 rounded-lg hover:bg-[#3b2594]"
          >
            <Download size={18} />
            Exporter CSV
          </button>
        </div>

        {/* Résumé statistiques */}
        {historiqueFiltres.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
              <h4 className="text-sm text-gray-600 font-medium">Total d'entrées</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">{historiqueFiltres.length}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-600">
              <h4 className="text-sm text-gray-600 font-medium">Validés</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {historiqueFiltres.filter((h) => h.statut === "validé").length}
              </p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-600">
              <h4 className="text-sm text-gray-600 font-medium">En attente</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-1">
                {historiqueFiltres.filter((h) => h.statut === "en_attente").length}
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-[#472EAD]">
              <h4 className="text-sm text-gray-600 font-medium">Total reçu</h4>
              <p className="text-2xl font-bold text-[#472EAD] mt-1">
                {historiqueFiltres.reduce((sum, h) => sum + (h.quantite || 0), 0)}
              </p>
            </div>
          </div>
        )}

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-gray-500" />
              <label className="font-medium text-[#111827]">Filtrer par action:</label>
            </div>
            <div className="flex gap-2 flex-wrap">
              {actions.map((action) => (
                <button
                  key={action}
                  onClick={() => setFiltreAction(action)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filtreAction === action
                      ? "bg-[#472EAD] text-white"
                      : "bg-gray-100 text-[#111827] hover:bg-gray-200"
                  }`}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tableau d'historique */}
        <div className="bg-white rounded-lg shadow p-4 overflow-auto">
          {loading ? (
            <LoadingSpinner />
          ) : historiqueFiltres.length === 0 ? (
            <EmptyState message="Aucun enregistrement trouvé" />
          ) : (
            <DataTable
              columns={[
                {
                  label: "Date & Heure",
                  key: "date",
                  render: (d) => new Date(d).toLocaleString("fr-FR"),
                },
                {
                  label: "Action",
                  key: "action",
                  render: (action) => (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getActionColor(action)}`}>
                      {action}
                    </span>
                  ),
                },
                { label: "Produit", key: "produit" },
                { label: "Code", key: "code_produit" },
                {
                  label: "Quantité",
                  key: "quantite",
                  render: (q) => q ? `${q} unités` : "-",
                },
                {
                  label: "Cartons",
                  key: "cartons",
                  render: (c) => c ? `${c}` : "-",
                },
                { label: "Utilisateur", key: "utilisateur" },
                {
                  label: "Statut",
                  key: "statut",
                  render: (s) => <span className={getStatutColor(s)}>{s || "-"}</span>,
                },
              ]}
              data={historiqueFiltres}
              actions={[
                {
                  title: "Détails",
                  icon: <Eye size={16} />,
                  color: "text-blue-600",
                  hoverBg: "bg-blue-50",
                  onClick: (row) => setDetailEntry(row),
                },
              ]}
            />
          )}
        </div>



        {/* Modal détails */}
        {detailEntry && (
          <div className="fixed inset-0 z-200 bg-black/40 bg-opacity-10 flex items-center justify-center">
            <div className="relative z-50 bg-white p-6 rounded-lg w-[500px] shadow-xl space-y-4">
              <h3 className="text-xl font-bold text-[#111827]">Détails de l'enregistrement</h3>
              <div className="space-y-3 text-sm">
                <div className="border-b pb-3">
                  <p className="text-gray-600">Date et heure</p>
                  <p className="font-semibold text-[#111827] mt-1">{new Date(detailEntry.date).toLocaleString("fr-FR")}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Action</p>
                  <p className={`font-semibold mt-1 px-3 py-1 rounded-full inline-block ${getActionColor(detailEntry.action)}`}>
                    {detailEntry.action}
                  </p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Produit</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.produit}</p>
                </div>
                <div className="border-b pb-3">
                  <p className="text-gray-600">Code Produit</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.code_produit}</p>
                </div>
                {detailEntry.quantite && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Quantité</p>
                    <p className="font-semibold text-[#111827] mt-1">{detailEntry.quantite} unités</p>
                  </div>
                )}
                {detailEntry.cartons && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Cartons</p>
                    <p className="font-semibold text-[#111827] mt-1">{detailEntry.cartons}</p>
                  </div>
                )}
                <div className="border-b pb-3">
                  <p className="text-gray-600">Utilisateur</p>
                  <p className="font-semibold text-[#111827] mt-1">{detailEntry.utilisateur}</p>
                </div>
                {detailEntry.statut && (
                  <div className="border-b pb-3">
                    <p className="text-gray-600">Statut</p>
                    <p className={`font-semibold mt-1 ${getStatutColor(detailEntry.statut)}`}>{detailEntry.statut}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setDetailEntry(null)}
                  className="px-4 py-2 bg-[#472EAD] text-white rounded hover:bg-[#3b2594]"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Historique;
