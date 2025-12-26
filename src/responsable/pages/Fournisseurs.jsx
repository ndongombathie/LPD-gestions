// ==========================================================
// 🚚 Fournisseurs.jsx — Interface Responsable (LPD Manager)
// Version PRO harmonisée avec Utilisateurs & ClientsSpéciaux + Toasts intégrés
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Search,
  Edit2,
  Trash2,
  MapPin,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";

const cls = (...a) => a.filter(Boolean).join(" ");

// ———————————————————————————
// ✅ Composant Toasts
// ———————————————————————————
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
              {t.message && (
                <div className="text-xs mt-0.5 opacity-90">{t.message}</div>
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

// ———————————————————————————
// 🧾 Formulaire Fournisseur
// ———————————————————————————
function FournisseurForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? {
      nom: "",
      contact: "",
      adresse: "",
      typeProduit: "",
      derniereLivraison: "",
    }
  );
  const [errors, setErrors] = useState({});

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom du fournisseur est requis.";
    if (!/^[0-9]{9}$/.test(form.contact))
      e.contact = "Le contact doit contenir exactement 9 chiffres.";
    if (!form.adresse.trim()) e.adresse = "L’adresse est requise.";
    if (!form.typeProduit.trim())
      e.typeProduit = "Le type de produits est requis.";
    if (form.derniereLivraison) {
      const d = new Date(form.derniereLivraison);
      const today = new Date();
      d.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (d > today)
        e.derniereLivraison =
          "La date doit être antérieure ou égale à aujourd’hui.";
    }
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
        {/* Nom */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Nom du fournisseur <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex: SEN Distribution"
            className={base(errors.nom)}
            required
          />
          {errors.nom && <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>}
        </div>

        {/* Contact */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Contact <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.contact}
            onChange={(e) =>
              update("contact", e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            placeholder="Ex: 771234567"
            maxLength={9}
            className={base(errors.contact)}
            required
          />
          {errors.contact && <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>}
        </div>

        {/* Adresse */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Adresse <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex: Colobane, Dakar"
            className={base(errors.adresse)}
            required
          />
          {errors.adresse && <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>}
        </div>

        {/* Type de produits */}
        <div>
          <label className="text-sm font-medium text-gray-700">
            Type de produits <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.typeProduit}
            onChange={(e) => update("typeProduit", e.target.value)}
            placeholder="Ex: Papeterie, Stylos, Livres..."
            className={base(errors.typeProduit)}
            required
          />
          {errors.typeProduit && (
            <p className="text-xs text-rose-600 mt-1">{errors.typeProduit}</p>
          )}
        </div>

        {/* Dernière livraison facultative */}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium text-gray-700">
            Dernière livraison (facultatif)
          </label>
          <input
            type="date"
            value={form.derniereLivraison}
            onChange={(e) => update("derniereLivraison", e.target.value)}
            className={base(errors.derniereLivraison)}
          />
          {errors.derniereLivraison && (
            <p className="text-xs text-rose-600 mt-1">{errors.derniereLivraison}</p>
          )}
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

// ———————————————————————————
// 📋 Page principale
// ———————————————————————————
export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  useEffect(() => {
    const simulated = [
      {
        id: 1,
        nom: "SEN DISTRIBUTION",
        contact: "774567890",
        adresse: "Dakar Plateau",
        typeProduit: "Papeterie & Scolaire",
        derniereLivraison: "2025-10-12",
      },
      {
        id: 2,
        nom: "Imprisol SARL",
        contact: "789876543",
        adresse: "Thiès",
        typeProduit: "Imprimés & Papier A4",
        derniereLivraison: "",
      },
      {
        id: 3,
        nom: "Fournil Office",
        contact: "761234567",
        adresse: "Mbour",
        typeProduit: "Stylos et Marqueurs",
        derniereLivraison: "2025-09-22",
      },
    ];
    setTimeout(() => {
      setFournisseurs(simulated);
      setLoading(false);
    }, 600);
  }, []);

  // ✅ correction : définition de filtered
  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return fournisseurs.filter(
      (f) =>
        f.nom.toLowerCase().includes(q) ||
        f.contact.toLowerCase().includes(q) ||
        f.adresse.toLowerCase().includes(q) ||
        f.typeProduit.toLowerCase().includes(q)
    );
  }, [fournisseurs, searchTerm]);

  const handleAdd = (form) => {
    setSubmitting(true);
    setFournisseurs((p) => [{ id: Date.now(), ...form }, ...p]);
    toast("success", "Fournisseur ajouté", `${form.nom} a été ajouté avec succès.`);
    setSubmitting(false);
    setOpenAdd(false);
  };

  const handleEdit = (form) => {
    setSubmitting(true);
    setFournisseurs((p) => p.map((f) => (f.id === editTarget.id ? { ...f, ...form } : f)));
    toast("success", "Fournisseur modifié", `${form.nom} a été mis à jour.`);
    setSubmitting(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    setSubmitting(true);
    setFournisseurs((p) => p.filter((f) => f.id !== deleteTarget.id));
    toast("success", "Fournisseur supprimé", `${deleteTarget.nom} a été supprimé.`);
    setSubmitting(false);
    setDeleteTarget(null);
  };

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
          <h1 className="text-2xl font-bold text-[#472EAD]">Gestion des fournisseurs</h1>
          <p className="text-sm text-gray-500">
            Liste, ajout, modification et suppression des fournisseurs.
          </p>
        </div>
        <button
          onClick={() => setOpenAdd(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg shadow hover:scale-[1.03] transition"
        >
          <UserPlus size={16} /> Nouveau fournisseur
        </button>
      </div>

      {/* RECHERCHE */}
      <div className="relative flex-1 mb-5">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par nom, contact, adresse ou type de produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-black rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
        />
      </div>

      {/* TABLEAU */}
      <DataTable
        columns={[
          { label: "Nom", key: "nom" },
          { label: "Contact", key: "contact" },
          {
            label: "Adresse",
            key: "adresse",
            render: (val) => (
              <span className="flex items-center gap-1">
                <MapPin size={14} className="text-[#F58020]" /> {val}
              </span>
            ),
          },
          { label: "Type de produits", key: "typeProduit" },
          {
            label: "Dernière livraison",
            key: "derniereLivraison",
            render: (val) =>
              val ? (
                <span className="flex items-center gap-1">
                  <CalendarDays size={14} className="text-[#472EAD]" />
                  {new Date(val).toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              ) : (
                <span className="text-gray-400 italic">Pas encore livré</span>
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
            onClick: (row) => setEditTarget(row),
          },
          {
            title: "Supprimer",
            icon: <Trash2 size={16} />,
            color: "text-rose-600",
            hoverBg: "bg-rose-50",
            onClick: (row) => setDeleteTarget(row),
          },
        ]}
      />

      {/* MODALES */}
      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouveau fournisseur">
        <FournisseurForm onSubmit={handleAdd} onCancel={() => setOpenAdd(false)} submitting={submitting} />
      </FormModal>

      <FormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Modifier : ${editTarget?.nom}`}
      >
        {editTarget && (
          <FournisseurForm
            initial={editTarget}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            submitting={submitting}
          />
        )}
      </FormModal>

      <FormModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirmer la suppression"
        width="max-w-md"
      >
        <p className="text-sm text-gray-600 mb-4">
          Voulez-vous vraiment supprimer{" "}
          <span className="font-semibold">{deleteTarget?.nom}</span> ?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDeleteTarget(null)}
            className="px-4 py-2 border border-black rounded-lg text-sm"
          >
            Annuler
          </button>
          <button
            onClick={handleDelete}
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
