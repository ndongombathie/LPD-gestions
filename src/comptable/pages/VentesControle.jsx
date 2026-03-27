// ==========================================================
// 🧾 ControleVendeur.jsx — VERSION ENTERPRISE ULTRA STABLE
// Durable, robuste, backend-safe
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Printer, Loader, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";
import controleVenteAPI from "@/services/api/controleVente";

/* ================= UTILITIES ================= */

const formatFCFA = (value = 0) =>
  Number(value || 0)
    .toLocaleString("fr-FR")
    .replace(/\s/g, ".") + " FCFA";

const formatDateFR = (value) =>
  value ? new Date(value).toLocaleDateString("fr-FR") : "-";

/* ========================================================== */

export default function ControleVendeur() {

  /* ================= DATE DU JOUR PAR DÉFAUT ================= */

  const today = new Date();

  const todayFormatted =
    today.getFullYear() +
    "-" +
    String(today.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(today.getDate()).padStart(2, "0");

  const [ventes, setVentes] = useState([]);
  const [ventesGlobales, setVentesGlobales] = useState([]);

  const [pagination, setPagination] = useState({});

  const [loading, setLoading] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");

  const [dateDebut, setDateDebut] = useState(todayFormatted);
  const [dateFin, setDateFin] = useState(todayFormatted);

  const [typeClient, setTypeClient] = useState("");

  const [page, setPage] = useState(1);

  /* ================= RESET PAGE ================= */

  useEffect(() => {
    setPage(1);
  }, [dateDebut, dateFin, typeClient]);

  /* ================= FETCH PAGE ================= */

  const fetchPage = async () => {
    try {
      setLoading(true);
      const startDate = (dateDebut || todayFormatted) + " 00:00:00";
      const endDate = (dateFin || todayFormatted) + " 23:59:59";

      const response = await controleVenteAPI.getCommandes({
        page,
        per_page: 15,
        date_debut: startDate,
        date_fin: endDate,
        type_client: typeClient || undefined
      });

      setVentes(response?.items || []);
      setPagination(response?.pagination || {});

    } catch (error) {
      console.error("Erreur fetch page :", error);
      setVentes([]);
      setPagination({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage();
  }, [page, dateDebut, dateFin, typeClient]);

  /* ================= FETCH GLOBAL ================= */

  const fetchGlobal = async () => {
    try {
      setLoadingGlobal(true);
      let current = 1;
      let last = 1;
      let all = [];

      do {
        const response = await controleVenteAPI.getCommandes({
          page: current,
          per_page: 100,
          date_debut: dateDebut,
          date_fin: dateFin,
          type_client: typeClient || undefined
        });

        const items = response?.items || [];
        const pagination = response?.pagination || {};

        all = [...all, ...items];
        last = pagination.lastPage || 1;
        current++;

      } while (current <= last && last > 0);

      setVentesGlobales(all);
    } catch (error) {
      console.error("Erreur fetch global :", error);
      setVentesGlobales([]);
    } finally {
      setLoadingGlobal(false);
    }
  };

  useEffect(() => {
    fetchGlobal();
  }, [dateDebut, dateFin, typeClient]);

  /* ================= ACTUALISER ================= */

  const actualiserPage = async () => {
    setRefreshing(true);
    try {
      await fetchPage();
      await fetchGlobal();
    } catch (error) {
      console.error("Erreur lors de l'actualisation :", error);
    } finally {
      setRefreshing(false);
    }
  };

  /* ================= FILTER FRONT ================= */

  const ventesFiltrees = useMemo(() => {
    return ventes.filter((v) =>
      (v.vendeurNom || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [ventes, search]);

  /* ================= PAGINATION HANDLERS ================= */

  const goToFirstPage = () => {
    setPage(1);
  };

  const goToPreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const goToNextPage = () => {
    if (page < (pagination.lastPage || 1)) {
      setPage(page + 1);
    }
  };

  const goToLastPage = () => {
    setPage(pagination.lastPage || 1);
  };

  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= (pagination.lastPage || 1)) {
      setPage(pageNumber);
    }
  };

  /* ================= RENDER PAGINATION BUTTONS ================= */

  const renderPaginationButtons = () => {
    const currentPage = page;
    const lastPage = pagination.lastPage || 1;
    const totalItems = pagination.total || 0;
    const perPage = pagination.perPage || 15;
    const startItem = (currentPage - 1) * perPage + 1;
    const endItem = Math.min(currentPage * perPage, totalItems);

    // Calculate which page numbers to show
    const getPageNumbers = () => {
      const delta = 2;
      const range = [];
      const rangeWithDots = [];
      let l;

      for (let i = 1; i <= lastPage; i++) {
        if (i === 1 || i === lastPage || (i >= currentPage - delta && i <= currentPage + delta)) {
          range.push(i);
        }
      }

      range.forEach((i) => {
        if (l) {
          if (i - l === 2) {
            rangeWithDots.push(l + 1);
          } else if (i - l !== 1) {
            rangeWithDots.push('...');
          }
        }
        rangeWithDots.push(i);
        l = i;
      });

      return rangeWithDots;
    };

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-b-xl">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Précédent
          </button>
          <button
            onClick={goToNextPage}
            disabled={currentPage === lastPage}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Affichage de <span className="font-medium">{startItem}</span> à{' '}
              <span className="font-medium">{endItem}</span> sur{' '}
              <span className="font-medium">{totalItems}</span> résultats
            </p>
          </div>
          <div>
            <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Première page</span>
                <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Précédent</span>
                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              
              {getPageNumbers().map((pageNum, idx) => (
                pageNum === '...' ? (
                  <span
                    key={`dots-${idx}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      currentPage === pageNum
                        ? 'z-10 bg-[#472EAD] text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#472EAD]'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === lastPage}
                className="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Suivant</span>
                <ChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === lastPage}
                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="sr-only">Dernière page</span>
                <ChevronsRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  /* ================= UI ================= */

  return (

    <div className="flex flex-col gap-6 p-6">

      <h1 className="text-2xl font-bold text-[#472EAD]">
        Contrôle des ventes vendeurs
      </h1>

      {/* FILTRES */}

      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 bg-white p-4 rounded-xl shadow">

        <input
          placeholder="Recherche vendeur"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 text-sm"
        />

        <select
          value={typeClient}
          onChange={(e) => setTypeClient(e.target.value)}
          className="px-3 py-2 rounded bg-gray-100 text-sm"
        >

          <option value="">Tous les clients</option>
          <option value="special">Clients spéciaux</option>
          <option value="normal">Clients normaux</option>

        </select>

        <div className="flex items-center gap-2 col-span-2">

          <input
            type="date"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className="px-3 py-2 rounded bg-gray-100 text-sm flex-1"
          />

          <span className="text-gray-500">au</span>

          <input
            type="date"
            value={dateFin}
            onChange={(e) => setDateFin(e.target.value)}
            className="px-3 py-2 rounded bg-gray-100 text-sm flex-1"
          />

        </div>

        <button
          onClick={actualiserPage}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded px-4 py-2 disabled:opacity-50"
        >

          {refreshing ? (
            <>
              <Loader size={16} className="animate-spin" />
              Actualisation...
            </>
          ) : (
            <>
              <RefreshCw size={16} /> Actualiser
            </>
          )}

        </button>

      </div>

      {/* TABLE */}

      {!loading && ventesFiltrees.length > 0 && (

        <div className="bg-white rounded-xl shadow overflow-hidden">

          <DataTable
            data={ventesFiltrees}
            columns={[
              { label: "Vendeur", key: "vendeurNom" },
              { label: "Client", key: "clientNom" },
              { label: "Date", key: "date", render: formatDateFR },
              { label: "Produits", key: "nombreProduits" },
              { label: "Total", key: "total", render: formatFCFA },
              { label: "Payé", key: "totalPaye", render: formatFCFA },
              { label: "Reste", key: "reste", render: formatFCFA },
            ]}
          />

          {renderPaginationButtons()}

        </div>

      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-[#472EAD]" />
          <span className="ml-2 text-gray-600">Chargement des données...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && ventesFiltrees.length === 0 && (
        <div className="bg-white rounded-xl shadow p-8 text-center text-gray-500">
          Aucune vente trouvée pour cette période
        </div>
      )}

    </div>

  );

}