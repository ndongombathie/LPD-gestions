import { useState, useMemo, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
  const [initialLoading, setInitialLoading] = useState(true);

  /* ================= PAGINATION ================= */

  const [decPage, setDecPage] = useState(1);
  const [decTotalPages, setDecTotalPages] = useState(1);
  const [decTotal, setDecTotal] = useState(0);

  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [clientTotal, setClientTotal] = useState(0);

  /* ================= DATA ================= */

  const [decaissementsAPI, setDecaissementsAPI] = useState([]);
  const [clientsAPI, setClientsAPI] = useState([]);

  /* ================= FETCH ================= */

  const fetchDecaissements = useCallback(async (page = 1) => {

    try {

      setLoading(true);

      const res = await responsableAPI.getAllDecaissements({
        page,
        per_page: 8,
      });

      setDecaissementsAPI(res?.data || []);
      setDecPage(res?.pagination?.currentPage || 1);
      setDecTotalPages(res?.pagination?.lastPage || 1);
      setDecTotal(res?.pagination?.total || 0);

    } finally {
      setLoading(false);
      setInitialLoading(false);
    }

  }, []);

  const fetchClients = useCallback(async (page = 1) => {

    try {

      setLoading(true);

      const res = await responsableAPI.getClientsEndettes({
        page,
        per_page: 8,
      });

      setClientsAPI(res?.data || []);
      setClientPage(res?.pagination?.currentPage || 1);
      setClientTotalPages(res?.pagination?.lastPage || 1);
      setClientTotal(res?.pagination?.total || 0);

    } finally {
      setLoading(false);
      setInitialLoading(false);
    }

  }, []);

  /* ================= EFFECT ================= */

  useEffect(() => {

    if (typeFiltre === "tous") {
      fetchDecaissements(decPage);
      fetchClients(clientPage);
    }

    if (typeFiltre === "decaissement") {
      fetchDecaissements(decPage);
    }

    if (typeFiltre === "clients_endettes") {
      fetchClients(clientPage);
    }

  }, [
    typeFiltre,
    decPage,
    clientPage,
    fetchDecaissements,
    fetchClients
  ]);

  /* ================= FILTRAGE ================= */

  const decaissements = useMemo(() => {

    return decaissementsAPI
      .filter(item => {

        const formatted = formatDateInput(item?.date);

        return (
          (!dateDebut || formatted >= dateDebut) &&
          (!dateFin || formatted <= dateFin)
        );

      })
      .map(item => ({
        id: item?.id,
        date: formatDate(item?.date),
        motif: item?.motif,
        montant: item?.montant,
      }));

  }, [decaissementsAPI, dateDebut, dateFin]);

  const totalDecaissements = useMemo(() =>
    decaissements.reduce((sum, item) => sum + item.montant, 0)
  , [decaissements]);

  /* ================= PAGINATION ================= */

  const Pagination = ({ page, totalPages, setPage }) => (
    totalPages > 1 && (
      <div className="flex justify-between items-center mt-4">

        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="font-medium">Page {page} / {totalPages}</span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>

      </div>
    )
  );

  /* ================= LOADER ================= */

  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#472EAD] mx-auto mb-4" />
          <p className="text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  /* ================= RENDER ================= */

  return (

    <div className="min-h-screen bg-gray-50 py-8 px-6">

      {/* FILTRES */}

      <div className="bg-white rounded-2xl shadow-md mb-8 p-6">

        <div className="grid md:grid-cols-3 gap-4">

          <select
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
            value={typeFiltre}
            onChange={(e) => setTypeFiltre(e.target.value)}
          >
            <option value="tous">Tous les rapports</option>
            <option value="decaissement">Décaissements</option>
            <option value="clients_endettes">Clients endettés</option>
          </select>

          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
            placeholder="Date début"
          />

          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#472EAD]"
            placeholder="Date fin"
          />

        </div>

      </div>

      {/* ================= DÉCAISSEMENTS ================= */}

      {(typeFiltre === "tous" || typeFiltre === "decaissement") && (

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

          <h2 className="font-bold mb-4 text-[#472EAD] text-lg">
            Décaissements ({decTotal})
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#347AA6] text-white">
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Motif</th>
                  <th className="p-4 text-right">Montant</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#472EAD] mx-auto" />
                    </td>
                  </tr>
                ) : decaissements.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">
                      Aucun décaissement trouvé
                    </td>
                  </tr>
                ) : (
                  decaissements.map(d => (
                    <tr key={d.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">{d.date}</td>
                      <td className="p-4">{d.motif}</td>
                      <td className="p-4 text-right font-medium">{fcfa(d.montant)}</td>
                    </tr>
                  ))
                )}

              </tbody>

              {decaissements.length > 0 && (
                <tfoot className="bg-gray-100 font-bold">
                  <tr>
                    <td colSpan="2" className="p-4 text-right">TOTAL</td>
                    <td className="p-4 text-right text-[#472EAD]">{fcfa(totalDecaissements)}</td>
                  </tr>
                </tfoot>
              )}

            </table>

          </div>

          <Pagination
            page={decPage}
            totalPages={decTotalPages}
            setPage={setDecPage}
          />

        </div>

      )}

      {/* ================= CLIENTS ENDETTÉS ================= */}

      {(typeFiltre === "tous" || typeFiltre === "clients_endettes") && (

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">

          <h2 className="font-bold mb-4 text-[#472EAD] text-lg">
            Clients endettés ({clientTotal})
          </h2>

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-[#347AA6] text-white">
                <tr>
                  <th className="p-4 text-left">Client</th>
                  <th className="p-4 text-left">Téléphone</th>
                  <th className="p-4 text-right">Dette</th>
                </tr>
              </thead>

              <tbody>

                {loading ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#472EAD] mx-auto" />
                    </td>
                  </tr>
                ) : clientsAPI.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="p-8 text-center text-gray-500">
                      Aucun client endetté trouvé
                    </td>
                  </tr>
                ) : (
                  clientsAPI.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-4 font-medium">{c.fullName}</td>
                      <td className="p-4">{c.telephone}</td>
                      <td className="p-4 text-right font-medium text-red-600">{fcfa(c.dette_totale)}</td>
                    </tr>
                  ))
                )}

              </tbody>

            </table>

          </div>

          <Pagination
            page={clientPage}
            totalPages={clientTotalPages}
            setPage={setClientPage}
          />

        </div>

      )}

    </div>

  );
}