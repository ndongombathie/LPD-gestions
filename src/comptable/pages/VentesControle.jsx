// ==========================================================
// 🧾 ControleVendeur.jsx — VERSION ENTERPRISE ULTRA STABLE
// Durable, robuste, backend-safe
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { Printer, Loader } from "lucide-react";
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

  useEffect(() => {

    const fetchPage = async () => {

      try {

        setLoading(true);

        const response = await controleVenteAPI.getCommandes({
          page,
          per_page: 15,
          date_debut: dateDebut,
          date_fin: dateFin,
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

    fetchPage();

  }, [page, dateDebut, dateFin, typeClient]);

  /* ================= FETCH GLOBAL ================= */

  useEffect(() => {

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

    fetchGlobal();

  }, [dateDebut, dateFin, typeClient]);

  /* ================= FILTER FRONT ================= */

  const ventesFiltrees = useMemo(() => {

    return ventes.filter((v) =>
      (v.vendeurNom || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );

  }, [ventes, search]);

  /* ================= PDF ================= */

  const imprimerPDF = () => {

    if (!ventesGlobales.length) return;

    const doc = new jsPDF();

    /* ===== HEADER ===== */

    doc.setFillColor(71, 46, 173);
    doc.rect(0, 0, 210, 35, "F");

    doc.setTextColor(245, 128, 32);
    doc.setFontSize(24);
    doc.text("LPD", 105, 15, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text("LIBRAIRIE PAPETERIE DARADJI", 105, 22, { align: "center" });

    doc.setFontSize(12);
    doc.text("CONTROLE GLOBAL DES VENTES", 105, 30, { align: "center" });

    doc.setTextColor(0, 0, 0);

    /* ===== INFOS ===== */

    const now = new Date();

    doc.setFontSize(10);

    doc.text(
      `Date impression : ${now.toLocaleDateString("fr-FR")} ${now.toLocaleTimeString("fr-FR")}`,
      14,
      50
    );

    doc.text(
      `Période du ${formatDateFR(dateDebut)} au ${formatDateFR(dateFin)}`,
      14,
      57
    );

    if (typeClient) {

      doc.text(
        `Type client : ${typeClient === "special"
          ? "Clients spéciaux"
          : "Clients normaux"
        }`,
        14,
        64
      );

    }

    /* ===== TABLE ===== */

    autoTable(doc, {
      startY: typeClient ? 70 : 65,
      head: [["Vendeur", "Client", "Date", "Produits", "Total", "Payé", "Reste"]],
      body: ventesGlobales.map((v) => [
        v.vendeurNom || "-",
        v.clientNom || "-",
        formatDateFR(v.date),
        v.nombreProduits || 0,
        formatFCFA(v.total),
        formatFCFA(v.totalPaye),
        formatFCFA(v.reste),
      ]),
      styles: { fontSize: 9 },
    });

    doc.save("controle_global_ventes.pdf");

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
          onClick={imprimerPDF}
          disabled={!ventesGlobales.length || loadingGlobal}
          className="flex items-center justify-center gap-2 bg-[#472EAD] text-white rounded px-4 py-2 disabled:opacity-50"
        >

          {loadingGlobal ? (
            <>
              <Loader size={16} className="animate-spin" />
              Chargement...
            </>
          ) : (
            <>
              <Printer size={16} /> Impression Globale
            </>
          )}

        </button>

      </div>

      {/* TABLE */}

      {!loading && ventesFiltrees.length > 0 && (

        <div className="bg-white p-4 rounded-xl shadow">

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

        </div>

      )}

    </div>

  );

}