// ==========================================================
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// VERSION FINALE STABLE + RECHERCHE
// ==========================================================

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Edit2,
  Trash2,
  Circle,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
} from "lucide-react";

import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";

/* ✅ ROLES */
const ROLES = [
  "Responsable",
  "Vendeur",
  "Caissier",
  "Gestionnaire Dépôt",
  "Gestionnaire Boutique",
];

const cls = (...a) => a.filter(Boolean).join(" ");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNineDigits = (v) => /^\d{9}$/.test(v);
const isThirteenDigits = (v) => /^\d{13}$/.test(v);

// ==========================================================
// 🔔 Toasts
// ==========================================================
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
              "min-w-[280px] rounded-xl border shadow px-4 py-3 flex gap-3",
              t.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            )}
          >
            {t.type === "success" ? <CheckCircle2 /> : <AlertCircle />}
            <div className="flex-1 text-sm font-medium">{t.title}</div>
            <button onClick={() => remove(t.id)}>
              <X size={16} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// ==========================================================
// 🧾 Formulaire utilisateur
// ==========================================================
function UserForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState(
    initial ?? {
      prenom: "",
      nom: "",
      email: "",
      tel: "",
      adresse: "",
      cni: "",
      role: "Vendeur",
    }
  );

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () =>
    form.prenom.trim() &&
    form.nom.trim() &&
    isEmail(form.email) &&
    isNineDigits(form.tel) &&
    isThirteenDigits(form.cni) &&
    form.adresse.trim();

  const submit = (e) => {
    e.preventDefault();
    if (!validate()) {
      alert("Veuillez remplir correctement tous les champs.");
      return;
    }
    onSubmit(form);
  };

  const input = "border border-black rounded-lg px-3 py-2 text-sm w-full";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input className={input} placeholder="Prénom" value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
        <input className={input} placeholder="Nom" value={form.nom} onChange={(e) => update("nom", e.target.value)} />
        <input className={input} placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input className={input} placeholder="Téléphone" value={form.tel} onChange={(e) => update("tel", e.target.value.replace(/\D/g, "").slice(0, 9))} />
        <input className={input} placeholder="CNI" value={form.cni} onChange={(e) => update("cni", e.target.value.replace(/\D/g, "").slice(0, 13))} />
        <select className={input} value={form.role} onChange={(e) => update("role", e.target.value)}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>
        <input className={`${input} col-span-2`} placeholder="Adresse" value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="border px-4 py-2 rounded-lg">
          Annuler
        </button>
        <button type="submit" className="bg-[#472EAD] text-white px-4 py-2 rounded-lg">
          Enregistrer
        </button>
      </div>
    </form>
  );
}

// ==========================================================
// 📋 Page principale
// ==========================================================
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = (title, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, title, type }]);
    setTimeout(() => removeToast(id), 3000);
  };

  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  useEffect(() => {
    setUsers([
      {
        id: 1,
        prenom: "Admin",
        nom: "LPD",
        email: "admin@lpd.com",
        tel: "770000000",
        adresse: "Dakar",
        cni: "1111111111111",
        role: "Responsable",
        isOnline: true,
      },
    ]);
  }, []);

  /* 🔍 FILTRAGE */
  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.prenom.toLowerCase().includes(q) ||
      u.nom.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#472EAD]">
        Gestion des utilisateurs
      </h1>

      {/* 🔍 Recherche */}
      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou rôle..."
          className="w-full pl-9 pr-3 py-2 border border-black rounded-lg text-sm"
        />
      </div>

      <button
        onClick={() => setOpenAdd(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg"
      >
        <UserPlus size={16} /> Nouvel utilisateur
      </button>

      <DataTable
        data={filteredUsers}
        columns={[
          { label: "Nom", key: "prenom", render: (_, r) => `${r.prenom} ${r.nom}` },
          { label: "Email", key: "email" },
          { label: "Rôle", key: "role" },
          {
            label: "Statut",
            key: "isOnline",
            render: (_, r) => (
              <span className="flex items-center gap-1 text-xs">
                <Circle size={10} className={r.isOnline ? "text-green-600" : "text-gray-400"} />
                {r.isOnline ? "En ligne" : "Hors ligne"}
              </span>
            ),
          },
        ]}
        actions={[
          { title: "Modifier", icon: <Edit2 size={16} />, onClick: setEditTarget },
          { title: "Supprimer", icon: <Trash2 size={16} />, onClick: setDeleteTarget },
        ]}
      />

      {/* MODALES */}
      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouvel utilisateur">
        <UserForm
          onSubmit={(u) => {
            setUsers((p) => [...p, { ...u, id: Date.now(), isOnline: false }]);
            toast("Utilisateur ajouté");
            setOpenAdd(false);
          }}
          onCancel={() => setOpenAdd(false)}
        />
      </FormModal>

      <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier utilisateur">
        {editTarget && (
          <UserForm
            initial={editTarget}
            onSubmit={(u) => {
              setUsers((p) => p.map((x) => (x.id === editTarget.id ? { ...x, ...u } : x)));
              toast("Utilisateur modifié");
              setEditTarget(null);
            }}
            onCancel={() => setEditTarget(null)}
          />
        )}
      </FormModal>

      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer utilisateur">
        <p className="mb-4 text-sm">
          Supprimer <b>{deleteTarget?.prenom} {deleteTarget?.nom}</b> ?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="border px-4 py-2 rounded-lg">
            Annuler
          </button>
          <button
            onClick={() => {
              setUsers((p) => p.filter((u) => u.id !== deleteTarget.id));
              toast("Utilisateur supprimé", "error");
              setDeleteTarget(null);
            }}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg"
          >
            Supprimer
          </button>
        </div>
      </FormModal>

      <Toasts toasts={toasts} remove={removeToast} />
    </div>
  );
}
