import { useState, useMemo, useEffect, useCallback } from "react";
import { Printer, ChevronLeft, ChevronRight } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import responsableAPI from "@/services/api/responsable";

/* ===================== UTILS ===================== */

const fcfa = (v) =>
  Number(v || 0).toLocaleString("de-DE") + " FCFA";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("fr-FR");
};

const formatDateInput = (dateString) => {
  if (!dateString) return null;
  return new Date(dateString).toISOString().slice(0, 10);
};

/* ===================== COMPONENT ===================== */

export default function Responsable() {

  const [typeFiltre, setTypeFiltre] = useState("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  const [decaissementsAPI, setDecaissementsAPI] = useState([]);
  const [loading, setLoading] = useState(false);

  /* PAGINATION */
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  /* ================= FETCH API ================= */

  const fetchDecaissements = useCallback(async (page = 1) => {
    try {
      setLoading(true);

      const res = await responsableAPI.getAllDecaissements({
        page,
        per_page: 8,
      });

      setDecaissementsAPI(res.data || []);
      setCurrentPage(res.pagination.currentPage);
      setTotalPages(res.pagination.lastPage);
      setTotalItems(res.pagination.total);

    } catch (error) {
      console.error("Erreur chargement décaissements :", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDecaissements(1);
  }, [fetchDecaissements]);

  /* ================= FILTRAGE DATE ================= */

  const decaissements = useMemo(() => {
    return decaissementsAPI
      .filter(item => {
        const formatted = formatDateInput(item.date);
        return (
          (!dateDebut || formatted >= dateDebut) &&
          (!dateFin || formatted <= dateFin)
        );
      })
      .map(item => ({
        id: item.id,
        date: formatDate(item.date),
        motif: item.motif,
        montant: item.montant,
      }));
  }, [decaissementsAPI, dateDebut, dateFin]);

  const totalDecaissements = useMemo(() =>
    decaissements.reduce((sum, item) => sum + item.montant, 0)
  , [decaissements]);

  /* ================= PAGINATION ================= */

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      fetchDecaissements(page);
    }
  };

  /* ================= IMPRESSION PDF SELON FILTRE ================= */

  const imprimerPDF = async () => {
    const doc = new jsPDF();
    let cursorY = 15;

    /* LOGO */
    try {
      const img = new Image();
      img.src = "/lpd-logo.png";
      await new Promise(resolve => { img.onload = resolve; });
      doc.addImage(img, "PNG", 14, cursorY, 40, 20);
      cursorY += 30;
    } catch {
      cursorY += 10;
    }

    doc.setFontSize(14);
    doc.text("RAPPORT FINANCIER LPD", 14, cursorY);
    cursorY += 8;

    doc.setFontSize(10);
    doc.text(
      `Date d'édition : ${new Date().toLocaleDateString("fr-FR")}`,
      14,
      cursorY
    );
    cursorY += 10;

    /* SI TOUS OU DÉCAISSEMENT */
    if (typeFiltre === "tous" || typeFiltre === "decaissement") {
      autoTable(doc, {
        startY: cursorY,
        head: [["Date", "Motif", "Montant"]],
        body: decaissements.map(m => [
          m.date,
          m.motif,
          fcfa(m.montant)
        ]),
        foot: [["", "TOTAL", fcfa(totalDecaissements)]],
        theme: "striped",
        headStyles: { fillColor: [71, 46, 173], textColor: 255 },
        footStyles: { fontStyle: "bold" },
      });

      cursorY = doc.lastAutoTable.finalY + 15;
    }

    const nomFichier =
      typeFiltre === "tous"
        ? "Rapport_Complet_LPD.pdf"
        : `Rapport_${typeFiltre}_LPD.pdf`;

    doc.save(nomFichier);
  };

  /* ================= RENDER ================= */

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-md mb-8 p-6">
          <h1 className="text-2xl font-bold text-[#472EAD]">
            Tableau de bord Responsable
          </h1>
        </div>

        {/* FILTRES */}
        <div className="bg-white rounded-2xl shadow-md mb-8 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            <select
              className="border rounded-lg px-4 py-2"
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value)}
            >
              <option value="tous">Tous les rapports</option>
              <option value="decaissement">Décaissements</option>
              <option value="vente_speciale">Ventes spéciales</option>
              <option value="clients_endettes">Clients endettés</option>
            </select>

            <input
              type="date"
              className="border rounded-lg px-4 py-2"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
            />

            <input
              type="date"
              className="border rounded-lg px-4 py-2"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
            />

            <button
              onClick={imprimerPDF}
              className="bg-[#472EAD] text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Printer size={18} />
              Générer PDF
            </button>
          </div>
        </div>

        {/* TABLEAU DÉCAISSEMENTS */}
        {(typeFiltre === "tous" || typeFiltre === "decaissement") && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="text-lg font-bold text-[#472EAD] mb-4">
              Décaissements ({totalItems})
            </h2>

            {loading ? (
              <p>Chargement...</p>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-[#472EAD] text-white">
                    <tr>
                      <th className="p-4 text-left">Date</th>
                      <th className="p-4 text-left">Motif</th>
                      <th className="p-4 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decaissements.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-4">{item.date}</td>
                        <td className="p-4">{item.motif}</td>
                        <td className="p-4 text-right font-semibold">
                          {fcfa(item.montant)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      className="px-4 py-2 border rounded disabled:opacity-40 flex items-center gap-2"
                    >
                      <ChevronLeft size={16} />
                      Précédent
                    </button>

                    <span>
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      className="px-4 py-2 border rounded disabled:opacity-40 flex items-center gap-2"
                    >
                      Suivant
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}