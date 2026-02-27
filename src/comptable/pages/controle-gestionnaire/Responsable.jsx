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

export default function Responsable() {

  const [typeFiltre, setTypeFiltre] = useState("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===================== PAGINATION INDÉPENDANTE ===================== */

  const [decPage, setDecPage] = useState(1);
  const [decTotalPages, setDecTotalPages] = useState(1);
  const [decTotal, setDecTotal] = useState(0);

  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [clientTotal, setClientTotal] = useState(0);

  const [ventePage, setVentePage] = useState(1);
  const [venteTotalPages, setVenteTotalPages] = useState(1);

  /* ===================== DATA ===================== */

  const [decaissementsAPI, setDecaissementsAPI] = useState([]);
  const [clientsAPI, setClientsAPI] = useState([]);
  const [ventesAPI, setVentesAPI] = useState([]);

  /* ================= FETCH FUNCTIONS ================= */

  const fetchDecaissements = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await responsableAPI.getAllDecaissements({
        page,
        per_page: 8,
      });

      setDecaissementsAPI(res.data || []);
      setDecPage(res.pagination.currentPage);
      setDecTotalPages(res.pagination.lastPage);
      setDecTotal(res.pagination.total);

    } finally {
      setLoading(false);
    }
  }, []);

  const fetchClients = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await responsableAPI.getClientsEndettes({
        page,
        per_page: 8,
      });

      setClientsAPI(res.data || []);
      setClientPage(res.pagination.currentPage);
      setClientTotalPages(res.pagination.lastPage);
      setClientTotal(res.pagination.total);

    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVentes = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await responsableAPI.getVentesSpeciales({
        page,
        per_page: 8,
      });

      setVentesAPI(res.data || []);
      setVentePage(res.pagination.currentPage);
      setVenteTotalPages(res.pagination.lastPage);

    } finally {
      setLoading(false);
    }
  }, []);

  /* ================= EFFECT ================= */

  useEffect(() => {

    if (typeFiltre === "tous") {
      fetchDecaissements(decPage);
      fetchClients(clientPage);
      fetchVentes(ventePage);
    }

    if (typeFiltre === "decaissement") {
      fetchDecaissements(decPage);
    }

    if (typeFiltre === "clients_endettes") {
      fetchClients(clientPage);
    }

    if (typeFiltre === "vente_speciale") {
      fetchVentes(ventePage);
    }

  }, [
    typeFiltre,
    decPage,
    clientPage,
    ventePage,
    fetchDecaissements,
    fetchClients,
    fetchVentes
  ]);

  /* ================= FILTRAGE DÉCAISSEMENTS ================= */

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

  /* ================= PDF ================= */

  const imprimerPDF = async () => {

    const doc = new jsPDF();
    let cursorY = 20;

    doc.text("RAPPORT LPD", 14, cursorY);
    cursorY += 10;

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
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    }

    if (typeFiltre === "tous" || typeFiltre === "clients_endettes") {
      autoTable(doc, {
        startY: cursorY,
        head: [["Client", "Téléphone", "Dette"]],
        body: clientsAPI.map(c => [
          c.fullName,
          c.telephone,
          fcfa(c.dette_totale)
        ]),
      });
      cursorY = doc.lastAutoTable.finalY + 10;
    }

    if (typeFiltre === "tous" || typeFiltre === "vente_speciale") {
      autoTable(doc, {
        startY: cursorY,
        head: [["Référence", "Client", "Montant"]],
        body: ventesAPI.map(v => [
          v.reference,
          v.client?.fullName || "-",
          fcfa(v.montant_total)
        ]),
      });
    }

    doc.save(`Rapport_${typeFiltre}.pdf`);
  };

  /* ================= RENDER ================= */

  const Pagination = ({ page, totalPages, setPage }) => (
    totalPages > 1 && (
      <div className="flex justify-between items-center mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded"
        >
          <ChevronLeft size={16} />
        </button>

        <span>Page {page} / {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-6">

      {/* FILTRES */}
      <div className="bg-white rounded-2xl shadow-md mb-8 p-6">
        <div className="grid md:grid-cols-4 gap-4">
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

          <input type="date" value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border rounded-lg px-4 py-2"
          />

          <input type="date" value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="border rounded-lg px-4 py-2"
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

      {/* ================= TABLEAUX ================= */}

      {(typeFiltre === "tous" || typeFiltre === "decaissement") && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="font-bold mb-4">
            Décaissements ({decTotal})
          </h2>

          <table className="w-full">
            <tbody>
              {decaissements.map(d => (
                <tr key={d.id} className="border-b">
                  <td className="p-4">{d.date}</td>
                  <td className="p-4">{d.motif}</td>
                  <td className="p-4 text-right">{fcfa(d.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={decPage}
            totalPages={decTotalPages}
            setPage={setDecPage}
          />
        </div>
      )}

      {(typeFiltre === "tous" || typeFiltre === "clients_endettes") && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="font-bold mb-4">
            Clients endettés ({clientTotal})
          </h2>

          <table className="w-full">
            <tbody>
              {clientsAPI.map(c => (
                <tr key={c.id} className="border-b">
                  <td className="p-4">{c.fullName}</td>
                  <td className="p-4">{c.telephone}</td>
                  <td className="p-4 text-right">{fcfa(c.dette_totale)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={clientPage}
            totalPages={clientTotalPages}
            setPage={setClientPage}
          />
        </div>
      )}

      {(typeFiltre === "tous" || typeFiltre === "vente_speciale") && (
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="font-bold mb-4">
            Ventes spéciales
          </h2>

          <table className="w-full">
            <tbody>
              {ventesAPI.map(v => (
                <tr key={v.id} className="border-b">
                  <td className="p-4">{v.reference}</td>
                  <td className="p-4">{v.client?.fullName}</td>
                  <td className="p-4 text-right">{fcfa(v.montant_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            page={ventePage}
            totalPages={venteTotalPages}
            setPage={setVentePage}
          />
        </div>
      )}

    </div>
  );
}