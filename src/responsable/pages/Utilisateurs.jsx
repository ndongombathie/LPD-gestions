// ==========================================================
// 👥 Utilisateurs.jsx — Interface Responsable (LPD Manager)
// PRO READY: CRUD UI + recherche/filtre + présence temps réel (simulée)
// - Formulaires AJOUT / ÉDITION sans "statut"
// - Colonne "Présence" (En ligne / Hors ligne + dernier passage)
// - Pré-câblé pour API (axios) et future présence WebSocket
// - ✅ Validations avancées (email, tel=9, CNI=13) au clic "Enregistrer"
// - ✅ Dialogue de confirmation (Continuer / Annuler) si champs vides/invalides
// - ✅ Toasts (succès/erreur) en haut à droite (ajout + modif)
// - ✅ Génération de mot de passe + "envoi d'e-mail" simulé à l'ajout
// - ✅ Zéro contour jaune/orange (focus/auto-fill neutralisés)
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  ShieldCheck,
  X,
  Loader2,
  Circle,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

// 🔗 A remplacer par ton endpoint Laravel
const API_URL = "http://localhost:8000/api/utilisateurs";

const ROLES = ["Vendeur", "Caissier", "Gestionnaire Dépôt", "Gestionnaire Boutique"];

// ————————————————————————————————————————————————
// Utils
// ————————————————————————————————————————————————
const nowIso = () => new Date().toISOString();
const fmtPhone = (s) => s.trim().replace(/\s+/g, "");
const cls = (...a) => a.filter(Boolean).join(" ");
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const isNineDigits = (v) => /^\d{9}$/.test(v);
const isThirteenDigits = (v) => /^\d{13}$/.test(v);
const genPassword = () =>
  Math.random().toString(36).slice(-4) + Math.random().toString(36).toUpperCase().slice(-4);

// ————————————————————————————————————————————————
// Style global (neutralise contours jaune/orange & autofill)
// ————————————————————————————————————————————————
const GlobalStyle = () => (
  <style>{`
  input, select, button, textarea { outline: none !important; box-shadow: none !important; }
  input:focus, select:focus, textarea:focus { outline: none !important; box-shadow: none !important; }
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  textarea:-webkit-autofill,
  select:-webkit-autofill {
    -webkit-text-fill-color: #111827;
    transition: background-color 9999s ease-in-out 0s;
  }
  *::-moz-focus-inner { border: 0 !important; }
  *:focus { outline: none !important; }
`}</style>
);

// ————————————————————————————————————————————————
// Toasts
// ————————————————————————————————————————————————
function Toasts({ toasts, remove }) {
  return (
    <div className="fixed top-4 right-4 z-[120] space-y-2">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 20, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
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
              {t.message ? <div className="text-xs mt-0.5 opacity-90">{t.message}</div> : null}
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
// Modale générique
// ————————————————————————————————————————————————
function Modal({ open, onClose, title, children, width = "max-w-2xl" }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden />
          <motion.div
            role="dialog"
            aria-modal="true"
            className={cls(
              "relative w-[95%] sm:w-auto",
              width,
              "rounded-2xl bg-white border border-gray-200 shadow-2xl"
            )}
            initial={{ scale: 0.96, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <h3 className="text-lg font-semibold text-[#472EAD]">{title}</h3>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[#F7F5FF]" aria-label="Fermer">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ————————————————————————————————————————————————
// Dialogue de confirmation (Continuer / Annuler)
// ————————————————————————————————————————————————
function ConfirmDialog({ open, onCancel, onConfirm, issues = [] }) {
  const hasIssues = issues && issues.length;
  return (
    <Modal open={open} onClose={onCancel} title="Confirmer l’enregistrement">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div className="text-sm text-gray-700">
            Certains champs sont vides ou invalides. Voulez-vous <b>continuer quand même</b> ?
          </div>
        </div>
        {hasIssues ? (
          <ul className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg p-3 list-disc list-inside">
            {issues.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        ) : null}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm text-white bg-[#472EAD] hover:opacity-95"
          >
            Continuer
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ————————————————————————————————————————————————
// Formulaire (Ajout / Edition)
// ————————————————————————————————————————————————
function UserForm({ initial, onSubmit, onCancel, submitting = false }) {
  const [form, setForm] = useState(
    initial ?? { prenom: "", nom: "", email: "", tel: "", adresse: "", cni: "", role: ROLES[0] }
  );

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const baseInput =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:outline-none focus:ring-0 focus:border-gray-300";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Prénom</label>
          <input className={baseInput} value={form.prenom} onChange={(e) => update("prenom", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nom</label>
          <input className={baseInput} value={form.nom} onChange={(e) => update("nom", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input type="email" className={baseInput} value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Téléphone</label>
          <input
            className={baseInput}
            value={form.tel}
            onChange={(e) => update("tel", fmtPhone(e.target.value))}
            placeholder="77XXXXXXX"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Adresse</label>
          <input
            className={baseInput}
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex: Colobane, Dakar"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Numéro CNI</label>
          <input className={baseInput} value={form.cni} onChange={(e) => update("cni", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Rôle</label>
          <select className={baseInput} value={form.role} onChange={(e) => update("role", e.target.value)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
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
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement…
            </span>
          ) : initial ? "Mettre à jour" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

// ————————————————————————————————————————————————
// Page principale
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmIssues, setConfirmIssues] = useState([]);
  const [pendingAction, setPendingAction] = useState(null);
  const [toasts, setToasts] = useState([]);
  const toast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };
  const removeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // Simulation
  useEffect(() => {
    const simulated = [
      { id: 1, nom: "Fall", prenom: "Aïcha", email: "aicha@lpd.com", role: "Vendeur", tel: "771234567", adresse: "Thiaroye, Dakar", cni: "1234567890123", isOnline: true, lastSeen: nowIso() },
      { id: 2, nom: "Diop", prenom: "Moussa", email: "moussa@lpd.com", role: "Caissier", tel: "774561234", adresse: "Colobane, Dakar", cni: "2345678901234", isOnline: false, lastSeen: nowIso() },
      { id: 3, nom: "Sow", prenom: "Rouguiyatou", email: "rougui@lpd.com", role: "Gestionnaire Dépôt", tel: "789876543", adresse: "Mbour", cni: "3456789012345", isOnline: false, lastSeen: nowIso() },
      { id: 4, nom: "Niang", prenom: "Malick", email: "malick@lpd.com", role: "Gestionnaire Boutique", tel: "772298684", adresse: "Thiès", cni: "4567890123456", isOnline: true, lastSeen: nowIso() },
    ];
    setTimeout(() => {
      setUsers(simulated);
      setLoading(false);
    }, 450);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setUsers((prev) =>
        prev.map((u) =>
          Math.random() > 0.7 ? { ...u, isOnline: !u.isOnline, lastSeen: !u.isOnline ? nowIso() : u.lastSeen } : u
        )
      );
    }, 12000 + Math.random() * 8000);
    return () => clearInterval(t);
  }, []);

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return users.filter(
      (u) =>
        (u.nom.toLowerCase().includes(q) ||
          u.prenom.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.tel.toLowerCase().includes(q) ||
          u.adresse.toLowerCase().includes(q) ||
          u.cni.toLowerCase().includes(q)) &&
        (filterRole === "Tous" || u.role === filterRole)
    );
  }, [users, searchTerm, filterRole]);

  // Ajouts nouveaux comportements
  const validateBeforeSubmit = (payload, actionType) => {
    if (!payload.prenom || payload.prenom.trim() === "") {
      toast("error", "Champs requis", "Veuillez remplir au moins le prénom avant d’enregistrer.");
      return;
    }
    if (payload.tel && !isNineDigits(payload.tel)) {
      toast("error", "Téléphone invalide", "Le téléphone doit être uniquement numérique et contenir exactement 9 chiffres.");
      return;
    }
    if (payload.cni && !isThirteenDigits(payload.cni)) {
      toast("error", "CNI invalide", "Le numéro de CNI doit être uniquement numérique et contenir exactement 13 chiffres.");
      return;
    }
    submitOrAskConfirm(actionType, payload);
  };

  const collectIssues = (payload) => {
    const issues = [];
    if (!payload.prenom) issues.push("Le prénom est requis.");
    if (!payload.nom) issues.push("Le nom est requis.");
    if (!payload.email) issues.push("L’email est requis.");
    if (payload.email && !isEmail(payload.email)) issues.push("Format d’e-mail invalide.");
    if (!payload.tel) issues.push("Le téléphone est requis.");
    if (payload.tel && !isNineDigits(payload.tel)) issues.push("Le téléphone doit contenir exactement 9 chiffres.");
    if (!payload.adresse) issues.push("L’adresse est requise.");
    if (!payload.cni) issues.push("Le numéro de CNI est requis.");
    if (payload.cni && !isThirteenDigits(payload.cni))
      issues.push("Le numéro de CNI doit contenir exactement 13 chiffres.");
    if (!payload.role) issues.push("Le rôle est requis.");
    return issues;
  };

  const submitOrAskConfirm = (type, payload) => {
    const issues = collectIssues(payload);
    if (issues.length) {
      setConfirmIssues(issues);
      setPendingAction({ type, payload });
      setConfirmOpen(true);
    } else {
      if (type === "add") doAdd(payload);
      else doEdit(payload);
    }
  };

  const doAdd = async (payload) => {
    try {
      setSubmitting(true);
      const newUser = {
        id: Math.max(0, ...users.map((u) => u.id)) + 1,
        ...payload,
        isOnline: false,
        lastSeen: nowIso(),
      };
      const password = genPassword();
      console.log(`[MAIL] À: ${payload.email} | Sujet: Création de compte | MDP: ${password}`);
      toast("success", "Utilisateur ajouté", `${payload.prenom} ${payload.nom} a été créé.`);
      toast("success", "E-mail envoyé", `Identifiants envoyés à ${payload.email}`);
      setUsers((prev) => [newUser, ...prev]);
      setOpenAdd(false);
    } catch {
      toast("error", "Erreur", "Impossible d’ajouter l’utilisateur.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingAction(null);
      setConfirmIssues([]);
    }
  };

  const doEdit = async (payload) => {
    try {
      setSubmitting(true);
      setUsers((prev) => prev.map((u) => (u.id === editTarget.id ? { ...u, ...payload } : u)));
      toast("success", "Utilisateur modifié", `${payload.prenom} ${payload.nom} a été mis à jour.`);
      setEditTarget(null);
    } catch {
      toast("error", "Erreur", "Impossible de modifier l’utilisateur.");
    } finally {
      setSubmitting(false);
      setConfirmOpen(false);
      setPendingAction(null);
      setConfirmIssues([]);
    }
  };

  const handleAdd = (payload) => validateBeforeSubmit(payload, "add");
  const handleEdit = (payload) => validateBeforeSubmit(payload, "edit");

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setSubmitting(true);
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
      toast("success", "Utilisateur supprimé", `${deleteTarget.prenom} ${deleteTarget.nom} a été supprimé.`);
      setDeleteTarget(null);
    } catch {
      toast("error", "Erreur", "Suppression impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <Loader2 className="w-10 h-10 text-[#472EAD] animate-spin" />
      </div>
    );

  return (
    <>
      <GlobalStyle />
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">Gestion des utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-1">Liste, ajout, modification et suppression des utilisateurs.</p>
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg shadow hover:scale-[1.03] hover:shadow-md transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvel utilisateur</span>
        </button>
      </div>

      {/* RECHERCHE */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher par nom, adresse, CNI, email, téléphone…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-0 focus:border-gray-300 outline-none"
          />
        </div>
        <select
          className="border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-0 focus:border-gray-300"
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
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              <th className="px-5 py-3 text-left">Nom complet</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Rôle</th>
              <th className="px-5 py-3 text-left">Téléphone</th>
              <th className="px-5 py-3 text-left">Adresse</th>
              <th className="px-5 py-3 text-left">Numéro CNI</th>
              <th className="px-5 py-3 text-left">Présence</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((u) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{`${u.prenom} ${u.nom}`}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3 text-[#472EAD] font-medium">
                    <ShieldCheck className="w-4 h-4 inline mr-1 text-[#F58020]" />
                    {u.role}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{u.tel}</td>
                  <td className="px-5 py-3 text-gray-600">{u.adresse}</td>
                  <td className="px-5 py-3 text-gray-600">{u.cni}</td>
                  <td className="px-5 py-3">
                    <span
                      title={u.isOnline ? "Connecté maintenant" : `Dernière activité : ${new Date(u.lastSeen).toLocaleString()}`}
                      className={cls(
                        "inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full",
                        u.isOnline ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <Circle
                        className={cls("w-3 h-3", u.isOnline ? "text-emerald-600" : "text-gray-400")}
                        fill="currentColor"
                      />
                      {u.isOnline ? "En ligne" : "Hors ligne"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setEditTarget(u)} className="p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]" title="Modifier">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDeleteTarget(u)} className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600" title="Supprimer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center text-gray-400 py-6">
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouvel utilisateur">
        <UserForm onSubmit={handleAdd} onCancel={() => setOpenAdd(false)} submitting={submitting} />
      </Modal>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Modifier : ${editTarget ? `${editTarget.prenom} ${editTarget.nom}` : ""}`}>
        {editTarget && (
          <UserForm
            initial={{
              prenom: editTarget.prenom,
              nom: editTarget.nom,
              email: editTarget.email,
              tel: editTarget.tel,
              adresse: editTarget.adresse,
              cni: editTarget.cni,
              role: editTarget.role,
            }}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
          />
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Confirmer la suppression" width="max-w-md">
        <p className="text-sm text-gray-600 mb-4">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-semibold">{deleteTarget ? `${deleteTarget.prenom} ${deleteTarget.nom}` : ""}</span> ?
          Cette action est irréversible.
        </p>
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleDelete}
            className={cls(
              "px-4 py-2 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700",
              submitting && "opacity-70 cursor-not-allowed"
            )}
          >
            {submitting ? "Suppression…" : "Supprimer"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        issues={confirmIssues}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingAction(null);
        }}
        onConfirm={() => {
          if (!pendingAction) return;
          if (pendingAction.type === "add") doAdd(pendingAction.payload);
          else doEdit(pendingAction.payload);
        }}
      />

      <Toasts toasts={toasts} remove={removeToast} />
    </>
  );
}
