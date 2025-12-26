// ==========================================================
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// Version Premium harmonisée avec Clients & Fournisseurs
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  Loader2,
  Circle,
  CheckCircle2,
  AlertCircle,
  X,
  FileDown,
} from "lucide-react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";

const ROLES = ["Vendeur", "Caissier", "Gestionnaire Dépôt", "Gestionnaire Boutique"];
const cls = (...a) => a.filter(Boolean).join(" ");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNineDigits = (v) => /^\d{9}$/.test(v);
const isThirteenDigits = (v) => /^\d{13}$/.test(v);
const genPassword = () =>
  Math.random().toString(36).slice(-4) + Math.random().toString(36).toUpperCase().slice(-4);

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
              "min-w-[280px] max-w-[360px] rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3",
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
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
              {t.message && <div className="text-xs mt-0.5 opacity-90">{t.message}</div>}
            </div>
            <button className="opacity-60 hover:opacity-100" onClick={() => remove(t.id)}>
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ————————————————————————————————————————————————
// ✅ Formulaire Utilisateur
// ————————————————————————————————————————————————
function UserForm({ initial, onSubmit, onCancel, submitting = false }) {
  const [form, setForm] = useState(
    initial ?? {
      prenom: "",
      nom: "",
      email: "",
      tel: "",
      adresse: "",
      cni: "",
      role: ROLES[0],
    }
  );
  const [errors, setErrors] = useState({});

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.prenom.trim()) e.prenom = "Le prénom est requis.";
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.email.trim() || !isEmail(form.email)) e.email = "Email invalide.";
    if (!isNineDigits(form.tel)) e.tel = "Téléphone invalide (9 chiffres).";
    if (!form.adresse.trim()) e.adresse = "Adresse requise.";
    if (!isThirteenDigits(form.cni)) e.cni = "CNI invalide (13 chiffres).";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const base = (err) =>
    `mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 transition ${
      err
        ? "border-rose-500 focus:ring-rose-200"
        : "border-black focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Prénom */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Prénom <span className="text-rose-600">*</span>
          </label>
          <input
            className={base(errors.prenom)}
            value={form.prenom}
            onChange={(e) => update("prenom", e.target.value)}
            placeholder="Ex: Aïcha"
          />
          {errors.prenom && <p className="text-xs text-rose-600 mt-1">{errors.prenom}</p>}
        </div>
        {/* Nom */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Nom <span className="text-rose-600">*</span>
          </label>
          <input
            className={base(errors.nom)}
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex: Fall"
          />
          {errors.nom && <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>}
        </div>
        {/* Email */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Email <span className="text-rose-600">*</span>
          </label>
          <input
            type="email"
            className={base(errors.email)}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="Ex: aicha@lpd.com"
          />
          {errors.email && <p className="text-xs text-rose-600 mt-1">{errors.email}</p>}
        </div>
        {/* Téléphone */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Téléphone <span className="text-rose-600">*</span>
          </label>
          <input
            className={base(errors.tel)}
            value={form.tel}
            onChange={(e) => update("tel", e.target.value.replace(/\D/g, "").slice(0, 9))}
            placeholder="77XXXXXXX"
          />
          {errors.tel && <p className="text-xs text-rose-600 mt-1">{errors.tel}</p>}
        </div>
        {/* Adresse */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Adresse <span className="text-rose-600">*</span>
          </label>
          <input
            className={base(errors.adresse)}
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex: Colobane, Dakar"
          />
          {errors.adresse && <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>}
        </div>
        {/* CNI */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            CNI <span className="text-rose-600">*</span>
          </label>
          <input
            className={base(errors.cni)}
            value={form.cni}
            onChange={(e) => update("cni", e.target.value.replace(/\D/g, "").slice(0, 13))}
            placeholder="13 chiffres"
          />
          {errors.cni && <p className="text-xs text-rose-600 mt-1">{errors.cni}</p>}
        </div>
        {/* Rôle */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Rôle <span className="text-rose-600">*</span>
          </label>
          <select
            className={base(false)}
            value={form.role}
            onChange={(e) => update("role", e.target.value)}
          >
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-black text-sm hover:bg-gray-50"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={cls(
            "px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95",
            submitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {submitting ? "Enregistrement..." : initial ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// ————————————————————————————————————————————————
// ✅ Page principale
// ————————————————————————————————————————————————
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("Tous");
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Simulation initiale
  useEffect(() => {
    const simulated = [
      {
        id: 1,
        prenom: "Aïcha",
        nom: "Fall",
        email: "aicha@lpd.com",
        tel: "771234567",
        adresse: "Thiaroye",
        cni: "1234567890123",
        role: "Vendeur",
        isOnline: true,
      },
      {
        id: 2,
        prenom: "Moussa",
        nom: "Diop",
        email: "moussa@lpd.com",
        tel: "774561234",
        adresse: "Colobane",
        cni: "2345678901234",
        role: "Caissier",
        isOnline: false,
      },
    ];
    setTimeout(() => {
      setUsers(simulated);
      setLoading(false);
    }, 400);
  }, []);

  // Export PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des utilisateurs — LPD Manager", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["Nom complet", "Email", "Téléphone", "Rôle", "Adresse"]],
      body: users.map((u) => [`${u.prenom} ${u.nom}`, u.email, u.tel, u.role, u.adresse]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save(`Utilisateurs_LPD_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast("success", "Export PDF", "Fichier téléchargé avec succès.");
  };

  const handleAdd = (payload) => {
    setSubmitting(true);
    const newUser = { id: Date.now(), ...payload, isOnline: false };
    const pwd = genPassword();
    console.log(`[EMAIL] Envoyé à ${payload.email} | Mot de passe : ${pwd}`);
    setUsers((p) => [newUser, ...p]);
    toast("success", "Utilisateur ajouté", `${payload.prenom} ${payload.nom}`);
    setOpenAdd(false);
    setSubmitting(false);
  };

  const handleEdit = (payload) => {
    setSubmitting(true);
    setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? { ...u, ...payload } : u)));
    toast("success", "Utilisateur modifié", `${payload.prenom} ${payload.nom}`);
    setEditTarget(null);
    setSubmitting(false);
  };

  const handleDelete = (u) => {
    setUsers((prev) => prev.filter((x) => x.id !== u.id));
    toast("success", "Utilisateur supprimé", `${u.prenom} ${u.nom}`);
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.nom.toLowerCase().includes(q) ||
          u.prenom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.tel.includes(q) ||
          u.adresse.toLowerCase().includes(q)) &&
        (filterRole === "Tous" || u.role === filterRole)
    );
  }, [users, searchTerm, filterRole]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#472EAD] animate-spin" />
      </div>
    );

  return (
    <div className="p-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500">Liste, ajout, modification et suppression des utilisateurs.</p>
        </div>

        <div className="flex gap-3 mt-4 sm:mt-0">
          <button
            onClick={exportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-[#F7F5FF] text-[#472EAD] rounded-lg border border-[#E4E0FF] hover:shadow-sm"
          >
            <FileDown size={16} /> Exporter PDF
          </button>
          <button
            onClick={() => setOpenAdd(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg shadow hover:scale-[1.03] transition"
          >
            <UserPlus size={16} /> Nouvel utilisateur
          </button>
        </div>
      </div>

      {/* RECHERCHE + FILTRE */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-black rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
          />
        </div>
        <select
          className="border border-black rounded-lg text-sm px-3 py-2 focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option>Tous</option>
          {ROLES.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* TABLE */}
      <DataTable
        columns={[
          { label: "Nom complet", key: "prenom", render: (_, r) => `${r.prenom} ${r.nom}` },
          { label: "Email", key: "email" },
          {
            label: "Rôle",
            key: "role",
            render: (val) => (
              <span
                className={`px-2 py-1 rounded-md text-xs font-semibold ${
                  val === "Vendeur"
                    ? "bg-emerald-50 text-emerald-700"
                    : val === "Caissier"
                    ? "bg-[#FFF4E5] text-[#F58020]"
                    : val.includes("Gestionnaire")
                    ? "bg-[#F7F5FF] text-[#472EAD]"
                    : "bg-gray-100 text-gray-700"
                }`}
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
                  "inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full",
                  r.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                )}
              >
                <Circle
                  className={cls("w-3 h-3", r.isOnline ? "text-emerald-600" : "text-gray-400")}
                  fill="currentColor"
                />
                {r.isOnline ? "En ligne" : "Hors ligne"}
              </span>
            ),
          },
        ]}
        data={filtered}
        actions={[
          {
            title: "Modifier",
            icon: <Edit2 size={16} />,
            color: "text-[#472EAD]",
            hoverBg: "bg-[#F7F5FF]",
            onClick: (r) => setEditTarget(r),
          },
          {
            title: "Supprimer",
            icon: <Trash2 size={16} />,
            color: "text-rose-600",
            hoverBg: "bg-rose-50",
            onClick: (r) => setDeleteTarget(r),
          },
        ]}
      />

      {/* MODALES */}
      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouvel utilisateur">
        <UserForm onSubmit={handleAdd} onCancel={() => setOpenAdd(false)} submitting={submitting} />
      </FormModal>

      <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Modifier : ${editTarget?.prenom}`}>
        {editTarget && (
          <UserForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
          />
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" width="max-w-md">
        <p className="text-sm text-gray-600 mb-4">
          Voulez-vous vraiment supprimer <b>{deleteTarget?.prenom} {deleteTarget?.nom}</b> ?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 border border-black rounded-lg text-sm">
            Annuler
          </button>
          <button
            onClick={() => handleDelete(deleteTarget)}
            className="px-4 py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700"
          >
            Supprimer
          </button>
        </div>
      </FormModal>

      {/* TOASTS */}
      <Toasts toasts={toasts} remove={removeToast} />
    </div>
  );
}
