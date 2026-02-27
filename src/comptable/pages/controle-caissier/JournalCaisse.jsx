import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import Button from "../../../components/ui/Button.jsx";
import Input from "../../../components/ui/Input.jsx";
import journalCaisseAPI from "@/services/api/journalCaisse";
import { formatCurrency, formatDate } from "../../../utils/formatters.js";

/* ================= FORMATAGE CORRIGÉ POUR PDF ================= */
const formatFCFAPDF = (value) => {
  const num = Number(value || 0);
  // Remplacer les espaces par des points pour les milliers
  return num.toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";
};

export default function JournalCaisse() {

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [rapport, setRapport] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false); // État séparé pour l'export

  /* ================= FETCH ================= */

  const fetchJournal = async (page = 1) => {
    try {
      setLoading(true);

      const result = await journalCaisseAPI.getControleCaisse({
        date: selectedDate,
        page,
      });

      setRapport(result.data || []);
      setPagination(result);

    } catch (error) {
      console.error("Erreur contrôle caisse:", error);
      setRapport([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) fetchJournal();
  }, [selectedDate]);

  /* ================= NOM CAISSIER ================= */

  const getCaissierName = (item) => {
    if (item.caissier?.nom) return item.caissier.nom;
    if (item.caissier_id?.includes("@")) return item.caissier_id.split("@")[0];
    if (item.caissier_id?.includes("-")) {
      const uuid = item.caissier_id;
      return uuid.substring(0, 4) + "..." + uuid.substring(uuid.length - 4);
    }
    return item.caissier_id || "Inconnu";
  };

  /* ================= FORMATAGE AMÉLIORÉ POUR L'AFFICHAGE ================= */
  const formatCurrencyWithDots = (value) => {
    const num = Number(value || 0);
    // Remplacer les espaces par des points pour les milliers
    return num.toLocaleString("fr-FR").replace(/\s/g, ".") + " FCFA";
  };

  /* ================= TRI DES DONNÉES ================= */
  const getSortedRapport = () => {
    return [...rapport].sort((a, b) => {
      // D'abord par statut (Ouvert en premier)
      if (a.cloture !== b.cloture) {
        return a.cloture ? 1 : -1;
      }
      // Ensuite par solde décroissant
      return (b.solde_theorique || 0) - (a.solde_theorique || 0);
    });
  };

  /* ================= EXPORT PDF ================= */

  const handleExportPDF = async () => {

    if (!rapport.length) return;

    try {
      setExportLoading(true); // Activer l'état d'export

      let allData = [];
      let currentPage = 1;
      let lastPage = 1;

      // Charger toutes les pages
      do {
        const result = await journalCaisseAPI.getControleCaisse({
          date: selectedDate,
          page: currentPage,
        });

        allData = [...allData, ...(result.data || [])];
        lastPage = result.lastPage;
        currentPage++;

      } while (currentPage <= lastPage);

      if (!allData.length) return;

      const doc = new jsPDF();

      // Logo sécurisé
      const img = new Image();
      img.src = "/lpd-logo.png";

      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Résoudre même en cas d'erreur pour éviter de bloquer
      });

      doc.addImage(img, "PNG", 14, 10, 30, 30);

      doc.setFontSize(18);
      doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 20, { align: "center" });

      doc.setFontSize(12);
      doc.text("CONTRÔLE CAISSE — COMPTABLE", 105, 28, { align: "center" });

      const now = new Date();
      doc.setFontSize(10);
      doc.text(
        `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
        14,
        45
      );

      // Ajouter la date sélectionnée
      doc.setFontSize(10);
      doc.text(
        `Période : ${formatDate(selectedDate).replace(/\//g, ".")}`,
        14,
        52
      );

      // Trier les données par statut (Ouvert d'abord) puis par solde décroissant
      const sortedData = [...allData].sort((a, b) => {
        if (a.cloture !== b.cloture) {
          return a.cloture ? 1 : -1;
        }
        return (b.solde_theorique || 0) - (a.solde_theorique || 0);
      });

      // Fonction pour formater avec des points
      const formatWithDots = (value) => {
        return (value || 0).toLocaleString("fr-FR").replace(/\s/g, ".") + " F";
      };

      autoTable(doc, {
        startY: 60,
        head: [["Caissier", "Encaissements", "Décaissements", "Solde", "Statut"]],
        body: sortedData.map((item) => [
          getCaissierName(item),
          formatWithDots(item.total_encaissements),
          formatWithDots(item.total_decaissements),
          formatWithDots(item.solde_theorique),
          item.cloture ? "Clôturé" : "Ouvert",
        ]),
        headStyles: { 
          fillColor: [71, 46, 173],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        styles: { 
          fontSize: 9,
          cellPadding: 3,
        },
        columnStyles: {
          0: { 
            cellWidth: 45,
            halign: "left",
            fontStyle: "bold",
          },
          1: { 
            halign: "right", 
            cellWidth: 35,
          },
          2: { 
            halign: "right", 
            cellWidth: 35,
          },
          3: { 
            halign: "right", 
            cellWidth: 35,
            fontStyle: "bold",
          },
          4: { 
            halign: "center", 
            cellWidth: 30,
          },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250],
        },
        margin: { left: 14, right: 14 },
        didDrawPage: function(data) {
          // Ajouter un pied de page
          doc.setFontSize(8);
          doc.setTextColor(100);
          doc.text(
            `Imprimé le ${now.toLocaleDateString("fr-FR").replace(/\//g, ".")} à ${now.toLocaleTimeString("fr-FR")}`,
            14,
            285
          );
          
          // Ajouter le nombre total de caisses
          doc.text(
            `Total: ${sortedData.length} caisse(s)`,
            105,
            285,
            { align: "center" }
          );
        }
      });

      // Pagination
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} / ${pageCount}`, 190, 290, { align: "right" });
      }

      // Sauvegarde du fichier
      const fileDate = formatDate(selectedDate).replace(/\//g, ".");
      doc.save(`Controle_Caisse_${fileDate}.pdf`);

    } catch (error) {
      console.error("Erreur export PDF:", error);
      alert("Une erreur est survenue lors de l'export PDF. Veuillez réessayer.");
    } finally {
      setExportLoading(false); // Désactiver l'état d'export
    }
  };

  /* ================= UI ================= */

  const sortedRapport = getSortedRapport();

  return (
    <div className="min-h-screen bg-gray-100 p-6">

      {/* HEADER */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">
            Contrôle caisse — Comptable
          </h1>
          <p className="text-gray-600">
            Consultation du {formatDate(selectedDate).replace(/\//g, "/")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Button
            type="button"
            onClick={handleExportPDF}
            disabled={!rapport.length || exportLoading}
            className="border border-[#472EAD] text-[#472EAD] hover:bg-[#472EAD] hover:text-white transition-colors w-full sm:w-auto"
          >
            {exportLoading ? "Génération PDF..." : "Exporter PDF"}
          </Button>
        </div>
      </div>

      {/* LOADING pour le chargement initial */}
      {loading && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="text-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#472EAD] mx-auto mb-4"></div>
            Chargement en cours...
          </div>
        </div>
      )}

      {/* TABLE */}
      {!loading && rapport.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Caissier</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Encaissements</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Décaissements</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Solde</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-600 uppercase tracking-wider">Statut</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedRapport.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-[#472EAD] bg-opacity-10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-[#472EAD] font-semibold text-sm">
                            {getCaissierName(item).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        {getCaissierName(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium text-right">
                      {formatCurrencyWithDots(item.total_encaissements || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium text-right">
                      {formatCurrencyWithDots(item.total_decaissements || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                      {formatCurrencyWithDots(item.solde_theorique || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {item.cloture ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Clôturé
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Ouvert
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {pagination.lastPage > 1 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.currentPage}</span> sur{" "}
                  <span className="font-medium">{pagination.lastPage}</span>
                </div>
                <div className="flex gap-3">
                  <Button
                    disabled={pagination.currentPage <= 1}
                    onClick={() => fetchJournal(pagination.currentPage - 1)}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Précédent
                  </Button>
                  <Button
                    disabled={pagination.currentPage >= pagination.lastPage}
                    onClick={() => fetchJournal(pagination.currentPage + 1)}
                    variant="outline"
                    size="sm"
                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && !rapport.length && (
        <div className="bg-white rounded-xl shadow-md p-8 mb-6">
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Aucun rapport disponible</p>
            <p className="text-sm text-gray-400 mt-1">Pour la date du {formatDate(selectedDate).replace(/\//g, "/")}</p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="bg-white rounded-xl shadow-sm p-4 text-center">
        <p className="text-xs text-gray-500">
          © 2026 SSD Consulting — Interface Comptable v1.0.0
        </p>
      </div>

    </div>
  );
}