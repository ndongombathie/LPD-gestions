// ==========================================================
// 👥 Utilisateurs.jsx — Responsable
// CRUD + RESET PASSWORD + MODIFICATION
// VERSION STABLE FINALE — PRODUCTION READY
// ==========================================================

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Trash2,
  Edit2,
  Circle,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  KeyRound,
} from "lucide-react";

import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import utilisateursAPI from "../../services/api/utilisateurs.js";

/* ===================== */
const ROLES = [
  "Responsable",
  "Vendeur",
  "Caissier",
  "Gestionnaire Dépôt",
  "Gestionnaire Boutique",
];

const cls = (...a) => a.filter(Boolean).join(" ");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/* =======================
   🔔 TOASTS
======================= */
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

/* =======================
   🧾 FORMULAIRE CRÉATION
======================= */
function UserForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    numero_cni: "",
    role: "Vendeur",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.prenom || !form.nom || !isEmail(form.email)) {
      alert("Veuillez remplir correctement les champs requis");
      return;
    }
    onSubmit(form);
  };

  const input = "border rounded-lg px-3 py-2 text-sm w-full";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <input className={input} placeholder="Prénom" value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
        <input className={input} placeholder="Nom" value={form.nom} onChange={(e) => update("nom", e.target.value)} />
        <input className={input} placeholder="Email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        <input className={input} placeholder="Téléphone" value={form.telephone} onChange={(e) => update("telephone", e.target.value)} />
        <input className={input} placeholder="CNI" value={form.numero_cni} onChange={(e) => update("numero_cni", e.target.value)} />

        <select className={input} value={form.role} onChange={(e) => update("role", e.target.value)}>
          {ROLES.map((r) => <option key={r}>{r}</option>)}
        </select>

        <input className={`${input} col-span-2`} placeholder="Adresse" value={form.adresse} onChange={(e) => update("adresse", e.target.value)} />
      </div>

      <div className="flex justify-end gap-3">
        <button onClick={onCancel} className="border px-4 py-2 rounded-lg">
          Annuler
        </button>
        <button onClick={submit} className="bg-[#472EAD] text-white px-4 py-2 rounded-lg">
          Créer utilisateur
        </button>
      </div>
    </div>
  );
}

/* =======================
   📋 PAGE PRINCIPALE
======================= */
export default function Utilisateurs() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [toasts, setToasts] = useState([]);

  const toast = (title, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, title, type }]);
    setTimeout(() => removeToast(id), 3000);
  };
  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const loadUsers = async () => {
    try {
      const res = await utilisateursAPI.getAll();
      setUsers(Array.isArray(res) ? res : res?.data || []);
    } catch {
      setUsers([]);
      toast("Erreur chargement utilisateurs", "error");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.prenom?.toLowerCase().includes(q) ||
      u.nom?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-[#472EAD]">
        Gestion des utilisateurs
      </h1>

      <div className="relative w-full md:w-1/3">
        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou rôle..."
          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
        />
      </div>

      <div className="flex gap-3">
        <button onClick={() => setOpenAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg">
          <UserPlus size={16} /> Nouvel utilisateur
        </button>

        <button onClick={loadUsers} className="flex items-center gap-2 px-4 py-2 border rounded-lg">
          <RefreshCw size={16} /> Rafraîchir
        </button>
      </div>

      <DataTable
        data={filteredUsers}
        columns={[
          { label: "Nom", render: (_, r) => `${r.prenom} ${r.nom}` },
          { label: "Email", key: "email" },
          { label: "Rôle", key: "role" },
          {
            label: "Statut",
            render: (_, r) => (
              <span className="flex items-center gap-1 text-xs">
                <Circle size={10} className={r.is_online ? "text-green-600" : "text-gray-400"} />
                {r.is_online ? "En ligne" : "Hors ligne"}
              </span>
            ),
          },
        ]}
        actions={[
          { title: "Modifier", icon: <Edit2 size={16} />, onClick: setEditTarget },
          { title: "Réinitialiser mot de passe", icon: <KeyRound size={16} />, onClick: setResetTarget },
          { title: "Supprimer", icon: <Trash2 size={16} />, onClick: setDeleteTarget },
        ]}
      />

      {/* ➕ CRÉATION */}
      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouvel utilisateur">
        <UserForm
          onSubmit={async (data) => {
            try {
              await utilisateursAPI.create(data);
              toast("Utilisateur créé (mot de passe envoyé par email)");
              setOpenAdd(false);
              loadUsers();
            } catch {
              toast("Erreur création utilisateur", "error");
            }
          }}
          onCancel={() => setOpenAdd(false)}
        />
      </FormModal>

      {/* ✏️ MODIFICATION */}
      <FormModal open={!!editTarget} onClose={() => setEditTarget(null)} title="Modifier utilisateur">
        {editTarget && (
          <div className="space-y-4">
            <input className="border rounded-lg px-3 py-2 w-full" value={editTarget.telephone || ""} onChange={(e) => setEditTarget({ ...editTarget, telephone: e.target.value })} placeholder="Téléphone" />
            <input className="border rounded-lg px-3 py-2 w-full" value={editTarget.adresse || ""} onChange={(e) => setEditTarget({ ...editTarget, adresse: e.target.value })} placeholder="Adresse" />
            <select className="border rounded-lg px-3 py-2 w-full" value={editTarget.role} onChange={(e) => setEditTarget({ ...editTarget, role: e.target.value })}>
              {ROLES.map((r) => <option key={r}>{r}</option>)}
            </select>

            <div className="flex justify-end gap-3">
              <button onClick={() => setEditTarget(null)} className="border px-4 py-2 rounded-lg">Annuler</button>
              <button
                onClick={async () => {
                  try {
                    await utilisateursAPI.update(editTarget.id, {
                      telephone: editTarget.telephone,
                      adresse: editTarget.adresse,
                      role: editTarget.role,
                    });
                    toast("Utilisateur modifié");
                    setEditTarget(null);
                    loadUsers();
                  } catch {
                    toast("Erreur modification", "error");
                  }
                }}
                className="bg-[#472EAD] text-white px-4 py-2 rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}
      </FormModal>

      {/* 🔐 RESET PASSWORD */}
      <FormModal open={!!resetTarget} onClose={() => setResetTarget(null)} title="Réinitialiser mot de passe">
        <p className="mb-4 text-sm">
          Un nouveau mot de passe sera généré et envoyé à <b>{resetTarget?.email}</b>
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setResetTarget(null)} className="border px-4 py-2 rounded-lg">Annuler</button>
          <button
            onClick={async () => {
              try {
                await utilisateursAPI.resetPassword(resetTarget.id);
                toast("Nouveau mot de passe envoyé");
                setResetTarget(null);
              } catch {
                toast("Erreur réinitialisation", "error");
              }
            }}
            className="bg-[#472EAD] text-white px-4 py-2 rounded-lg"
          >
            Confirmer
          </button>
        </div>
      </FormModal>

      {/* 🗑️ SUPPRESSION */}
      <FormModal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer utilisateur">
        <p className="mb-4 text-sm">
          Supprimer <b>{deleteTarget?.prenom} {deleteTarget?.nom}</b> ?
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="border px-4 py-2 rounded-lg">Annuler</button>
          <button
            onClick={async () => {
              try {
                await utilisateursAPI.remove(deleteTarget.id);
                toast("Utilisateur supprimé", "error");
                setDeleteTarget(null);
                loadUsers();
              } catch {
                toast("Erreur suppression", "error");
              }
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
