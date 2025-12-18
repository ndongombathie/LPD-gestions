// ==========================================================
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// VERSION FINALE CORRIGÉE & STABLE
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
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

/* ✅ RÔLES — RESPONSABLE AJOUTÉ */
const ROLES = [
  "Vendeur",
  "Caissier",
  "Gestionnaire Dépôt",
  "Gestionnaire Boutique",
  "Responsable",
];

const cls = (...a) => a.filter(Boolean).join(" ");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNineDigits = (v) => /^\d{9}$/.test(v);
const isThirteenDigits = (v) => /^\d{13}$/.test(v);
const genPassword = () =>
  Math.random().toString(36).slice(-4) +
  Math.random().toString(36).toUpperCase().slice(-4);

/* ==========================================================
   TOASTS
========================================================== */
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
              "min-w-[280px] rounded-xl border shadow-lg px-4 py-3 flex gap-3",
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}
          >
            {t.type === "success" ? (
              <CheckCircle2 />
            ) : (
              <AlertCircle />
            )}
            <div className="flex-1">
              <div className="font-semibold text-sm">{t.title}</div>
              <div className="text-xs">{t.message}</div>
            </div>
            <button onClick={() => remove(t.id)}>
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

/* ==========================================================
   FORMULAIRE UTILISATEUR
========================================================== */
function UserForm({ initial, onSubmit, onCancel, submitting }) {
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
    if (!form.prenom) e.prenom = "Prénom requis";
    if (!form.nom) e.nom = "Nom requis";
    if (!isEmail(form.email)) e.email = "Email invalide";
    if (!isNineDigits(form.tel)) e.tel = "Téléphone invalide";
    if (!isThirteenDigits(form.cni)) e.cni = "CNI invalide";
    if (!form.adresse) e.adresse = "Adresse requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const input = (err) =>
    `w-full mt-1 px-3 py-2 border rounded-lg text-sm ${
      err ? "border-rose-500" : "border-black"
    }`;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input className={input(errors.prenom)} placeholder="Prénom" value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
        <input className={input(errors.nom)} placeholder="Nom" value={form.nom} onChange={(e) => update("nom", e.target.value)} />
        <input className={input(errors.email)} placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input className={input(errors.tel)} placeholder="Téléphone" value={form.tel} onChange={(e) => update("tel", e.target.value.replace(/\D/g, "").slice(0,9))} />
        <input className={input(errors.cni)} placeholder="CNI" value={form.cni} onChange={(e) => update("cni", e.target.value.replace(/\D/g, "").slice(0,13))} />
        <select className={input(false)} value={form.role} onChange={(e) => update("role", e.target.value)}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input className={input(errors.adresse)} placeholder="Adresse" value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-lg">Annuler</button>
        <button disabled={submitting} className="px-4 py-2 bg-[#472EAD] text-white rounded-lg">
          {initial ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

/* ==========================================================
   PAGE PRINCIPALE
========================================================== */
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  };

  useEffect(() => {
    setUsers([
      { id: 1, prenom: "Admin", nom: "LPD", email: "admin@lpd.com", tel: "770000000", adresse: "Dakar", cni: "1111111111111", role: "Responsable", isOnline: true },
    ]);
  }, []);

  const handleDelete = (u) => {
    if (u.role === "Responsable") {
      toast("error", "Action refusée", "Impossible de supprimer un Responsable");
      return;
    }
    setUsers((p) => p.filter((x) => x.id !== u.id));
    toast("success", "Utilisateur supprimé", `${u.prenom} ${u.nom}`);
    setDeleteTarget(null);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-[#472EAD] mb-4">Gestion des utilisateurs</h1>

      <button onClick={() => setOpenAdd(true)} className="mb-4 px-4 py-2 bg-[#472EAD] text-white rounded-lg">
        <UserPlus size={16} /> Nouvel utilisateur
      </button>

      <DataTable
        data={users}
        columns={[
          { label: "Nom", key: "prenom", render: (_, r) => `${r.prenom} ${r.nom}` },
          { label: "Email", key: "email" },
          {
            label: "Rôle",
            key: "role",
            render: (r) => (
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                r === "Responsable" ? "bg-red-100 text-red-700" :
                r === "Caissier" ? "bg-orange-100 text-orange-700" :
                r.includes("Gestionnaire") ? "bg-purple-100 text-purple-700" :
                "bg-emerald-100 text-emerald-700"
              }`}>
                {r}
              </span>
            )
          }
        ]}
        actions={[
          { title: "Modifier", icon: <Edit2 />, onClick: setEditTarget },
          { title: "Supprimer", icon: <Trash2 />, onClick: setDeleteTarget }
        ]}
      />

      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouvel utilisateur">
        <UserForm onSubmit={(u) => { setUsers((p) => [...p, { ...u, id: Date.now() }]); setOpenAdd(false); }} />
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer suppression">
        <button onClick={() => handleDelete(deleteTarget)} className="px-4 py-2 bg-rose-600 text-white rounded-lg">
          Supprimer
        </button>
      </FormModal>

      <Toasts toasts={toasts} remove={() => {}} />
    </div>
  );
}
