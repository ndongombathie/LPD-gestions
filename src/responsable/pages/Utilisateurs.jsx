// ========================================================== 
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// Version Responsable = CONSULTATION SEULEMENT (lecture seule)
// Connecté à l'API Laravel (/api/users) + Présence
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import {  AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Circle,
  CheckCircle2,
  AlertCircle,
  X,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import DataTable from "../components/DataTable.jsx";
import { utilisateursAPI } from "../../services/api";

const ROLES = [
  "Vendeur",
  "Caissier",
  "Gestionnaire Dépôt",
  "Gestionnaire Boutique",
  "Responsable",
];

const ROLE_LABELS = {
  vendeur: "Vendeur",
  caissier: "Caissier",
  gestionnaire_depot: "Gestionnaire Dépôt",
  gestionnaire_boutique: "Gestionnaire Boutique",
  responsable: "Responsable",
};

const cls = (...a) => a.filter(Boolean).join(" ");

// ————————————————————————————————————————————————
// ✅ Toasts de notification
// ————————————————————————————————————————————————
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[120] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={cls(
              "min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 backdrop-blur-sm",
              t.type === "success"
                ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
                : "bg-rose-50/95 border-rose-200 text-rose-800"
            )}
          >
            <div className="pt-0.5">
              {t.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title}</div>
              {t.message && (
                <div className="text-xs mt-0.5 opacity-90">
                  {t.message}
                </div>
              )}
            </div>
            <button
              className="opacity-60 hover:opacity-100"
              onClick={() => remove(t.id)}
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ————————————————————————————————————————————————
// ✅ Page principale (lecture seule, API réelle)
// ————————————————————————————————————————————————
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Tous");
  const [toasts, setToasts] = useState([]);

  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  // ————————————————————————————————————————————————
  // 🔗 Chargement des vrais utilisateurs depuis l'API
  // GET /api/users (protégé Sanctum + role:responsable)
  // ————————————————————————————————————————————————
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        const response = await utilisateursAPI.getAll();

        // response peut être un tableau brut OU response.data (Resource Laravel)
        const rawUsers = Array.isArray(response) ? response : response.data || [];

        const normalized = rawUsers.map((u) => {
          // Présence : priorité à un booléen is_online si dispo,
          // sinon estimation via last_login_at (ex: connecté il y a < 30 min).
          let isOnline = false;

          if (typeof u.is_online !== "undefined") {
            isOnline = Boolean(u.is_online);
          } else if (u.last_login_at) {
            const last = new Date(u.last_login_at);
            const diffMin = (Date.now() - last.getTime()) / 60000;
            isOnline = diffMin <= 30; // 30 minutes = considéré comme "en ligne"
          }

          return {
            id: u.id,
            prenom: u.prenom || "",
            nom: u.nom || "",
            email: u.email || "",
            tel: u.telephone || u.tel || "",
            adresse: u.adresse || "",
            cni: u.numero_cni || u.cni || "",
            role: ROLE_LABELS[u.role] || u.role || "",
            isOnline,
          };
        });

        setUsers(normalized);
      } catch (err) {
        console.error("Erreur chargement utilisateurs :", err);
        toast(
          "error",
          "Erreur",
          "Impossible de charger la liste des utilisateurs."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Stats rapides (pour les petits badges)
  const stats = useMemo(() => {
    const total = users.length;
    const enLigne = users.filter((u) => u.isOnline).length;
    const horsLigne = total - enLigne;

    return { total, enLigne, horsLigne };
  }, [users]);

  // Liste filtrée (recherche + rôle)
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.nom.toLowerCase().includes(q) ||
          u.prenom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.tel || "").includes(q) ||
          (u.adresse || "").toLowerCase().includes(q)) &&
        (filterRole === "Tous" || u.role === filterRole)
    );
  }, [users, searchTerm, filterRole]);

  // Export PDF (liste courante filtrée)
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des utilisateurs — LPD Manager", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["Nom complet", "Email", "Téléphone", "Rôle", "Adresse"]],
      body: filtered.map((u) => [
        `${u.prenom} ${u.nom}`,
        u.email,
        u.tel,
        u.role,
        u.adresse,
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(
      `Utilisateurs_LPD_${new Date().toISOString().slice(0, 10)}.pdf`
    );
    toast("success", "Export PDF", "Fichier téléchargé avec succès.");
  };

  // ————————————————————————————————————————————————
  // ⏳ Loader harmonisé
  // ————————————————————————————————————————————————
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des utilisateurs...
          </span>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                Module Utilisateurs — Responsable
              </span>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                Gestion des utilisateurs
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Consultation des profils (vendeurs, caissiers, gestionnaires) et
                export de la liste du personnel.
              </p>
            </div>
            <p className="text-[11px] text-gray-400">
              Vue en lecture seule • {stats.total} utilisateur
              {stats.total > 1 && "s"} enregistrés
            </p>
          </div>

          {/* Bouton Export PDF */}

        </motion.header>

        {/* PETITS STATS */}
        <section className="flex flex-wrap gap-2 text-[11px] text-gray-500">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/80 border border-[#ECE9FF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#472EAD]" />
            <span>
              Total : <span className="font-semibold">{stats.total}</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-100">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>
              En ligne :{" "}
              <span className="font-semibold">{stats.enLigne}</span>
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#F7F5FF] border border-[#E4E0FF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#F58020]" />
            <span>
              Hors ligne :{" "}
              <span className="font-semibold">{stats.horsLigne}</span>
            </span>
          </div>
        </section>

        {/* RECHERCHE + FILTRE */}
        <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* 🔍 Barre de recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone, adresse…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
              />
            </div>

            {/* 🎯 Filtre par rôle */}
            <div className="flex items-center gap-2 sm:w-56">
              <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                Filtrer par rôle
              </span>
              <select
                className="flex-1 border border-gray-300 rounded-xl text-sm px-3 py-2.5 bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option>Tous</option>
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* TABLE (lecture seule, aucune action) */}
          <div className="mt-1">
            <DataTable
              columns={[
                {
                  label: "Nom complet",
                  key: "prenom",
                  render: (_, r) => `${r.prenom} ${r.nom}`,
                },
                { label: "Email", key: "email" },
                {
                  label: "Rôle",
                  key: "role",
                  render: (val) => (
                    <span
                      className={cls(
                        "px-2.5 py-1 rounded-full text-[11px] font-semibold",
                        val === "Vendeur"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : val === "Caissier"
                          ? "bg-[#FFF4E5] text-[#F58020] border border-[#FFE0B8]"
                          : val.includes("Gestionnaire")
                          ? "bg-[#F7F5FF] text-[#472EAD] border border-[#E4E0FF]"
                          : val === "Responsable"
                          ? "bg-sky-50 text-sky-700 border border-sky-200"
                          : "bg-gray-100 text-gray-700 border border-gray-200"
                      )}
                    >
                      {val}
                    </span>
                  ),
                },
                { label: "Téléphone", key: "tel" },
                { label: "Adresse", key: "adresse" },
                { label: "CNI", key: "cni" },
                {
                  label: "Présence",
                  key: "isOnline",
                  render: (_, r) => (
                    <span
                      className={cls(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-full border",
                        r.isOnline
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      )}
                    >
                      <Circle
                        className={cls(
                          "w-3 h-3",
                          r.isOnline
                            ? "text-emerald-500"
                            : "text-gray-400"
                        )}
                        fill="currentColor"
                      />
                      {r.isOnline ? "En ligne" : "Hors ligne"}
                    </span>
                  ),
                },
              ]}
              data={filtered}
              actions={[]} // 👈 AUCUNE ACTION (lecture seule)
            />
          </div>
        </section>

        {/* TOASTS */}
        <Toasts toasts={toasts} remove={removeToast} />
      </div>
    </div>
  );
}
