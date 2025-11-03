// ==========================================================
// 🚚 Fournisseurs.jsx — Interface Responsable (LPD Manager)
// Version PRO : contrôles de saisie + placeholders "Ex:" + date ≤ aujourd’hui
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
  X,
} from "lucide-react";

const cls = (...a) => a.filter(Boolean).join(" ");

// ————————————————————————
// Modale réutilisable
// ————————————————————————
const Modal = ({ open, onClose, title, children, width = "max-w-2xl" }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center"
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
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="text-lg font-semibold text-[#472EAD]">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[#F7F5FF]"
              aria-label="Fermer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ————————————————————————
// Formulaire Ajout/Édition avec contrôles
// ————————————————————————
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
    const newErrors = {};

    if (!form.nom.trim()) newErrors.nom = "Le nom du fournisseur est requis.";
    if (!/^[0-9]{9}$/.test(form.contact))
      newErrors.contact = "Le contact doit contenir exactement 9 chiffres.";
    if (!form.adresse.trim()) newErrors.adresse = "L’adresse est requise.";
    if (!form.typeProduit.trim())
      newErrors.typeProduit = "Le type de produits est requis.";

    if (form.derniereLivraison) {
      const parsed = Date.parse(form.derniereLivraison);
      if (isNaN(parsed)) {
        newErrors.derniereLivraison = "La date saisie est invalide.";
      } else {
        const d = new Date(parsed);
        const today = new Date();
        // Normaliser à minuit pour comparer uniquement la date
        d.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        if (d > today) {
          newErrors.derniereLivraison =
            "La date doit être antérieure ou égale à aujourd’hui.";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nom */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nom du fournisseur
          </label>
          <input
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex: SEN Distribution"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 ${
              errors.nom
                ? "border-rose-400 focus:ring-rose-300"
                : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            }`}
            required
          />
          {errors.nom && <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>}
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Contact</label>
          <input
            value={form.contact}
            onChange={(e) =>
              update("contact", e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            placeholder="Ex: 771234567"
            maxLength={9}
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 ${
              errors.contact
                ? "border-rose-400 focus:ring-rose-300"
                : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            }`}
            required
          />
          {errors.contact && (
            <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>
          )}
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Adresse</label>
          <input
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex: Colobane, Dakar"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 ${
              errors.adresse
                ? "border-rose-400 focus:ring-rose-300"
                : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            }`}
            required
          />
          {errors.adresse && (
            <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>
          )}
        </div>

        {/* Type de produits */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Type de produits
          </label>
          <input
            value={form.typeProduit}
            onChange={(e) => update("typeProduit", e.target.value)}
            placeholder="Ex: Papeterie, Stylos, Livres..."
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 ${
              errors.typeProduit
                ? "border-rose-400 focus:ring-rose-300"
                : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            }`}
            required
          />
          {errors.typeProduit && (
            <p className="text-xs text-rose-600 mt-1">{errors.typeProduit}</p>
          )}
        </div>

        {/* Dernière livraison facultative */}
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">
            Dernière livraison (facultatif)
          </label>
          <input
            type="date"
            value={form.derniereLivraison}
            onChange={(e) => update("derniereLivraison", e.target.value)}
            placeholder="Ex: 2025-10-12"
            className={`mt-1 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 ${
              errors.derniereLivraison
                ? "border-rose-400 focus:ring-rose-300"
                : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
            }`}
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
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm hover:bg-gray-50"
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

// ————————————————————————
// Page principale
// ————————————————————————
export default function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

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
    const newF = { id: Date.now(), ...form };
    setFournisseurs((prev) => [newF, ...prev]);
    setSubmitting(false);
    setOpenAdd(false);
  };

  const handleEdit = (form) => {
    setSubmitting(true);
    setFournisseurs((prev) =>
      prev.map((f) => (f.id === editTarget.id ? { ...f, ...form } : f))
    );
    setSubmitting(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    setSubmitting(true);
    setFournisseurs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
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
    <>
      {/* === Header === */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#472EAD]">Gestion des fournisseurs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Liste, ajout, modification et suppression des fournisseurs.
          </p>
        </div>

        <button
          onClick={() => setOpenAdd(true)}
          className="mt-4 sm:mt-0 flex items-center gap-2 px-4 py-2 bg-[#472EAD] text-white rounded-lg shadow hover:scale-[1.03] hover:shadow-md transition-all duration-200"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouveau fournisseur</span>
        </button>
      </div>

      {/* === Recherche === */}
      <div className="relative flex-1 mb-5">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par nom, contact, adresse ou type de produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] outline-none"
        />
      </div>

      {/* === Tableau === */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-[#F7F5FF] text-[#472EAD] uppercase text-xs font-semibold">
            <tr>
              <th className="px-5 py-3 text-left">Nom</th>
              <th className="px-5 py-3 text-left">Contact</th>
              <th className="px-5 py-3 text-left">Adresse</th>
              <th className="px-5 py-3 text-left">Type de produits</th>
              <th className="px-5 py-3 text-left">Dernière livraison</th>
              <th className="px-5 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length ? (
              filtered.map((f) => (
                <motion.tr
                  key={f.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="border-b border-gray-100 hover:bg-[#F9F9FF] transition"
                >
                  <td className="px-5 py-3 font-medium text-gray-800">{f.nom}</td>
                  <td className="px-5 py-3 text-gray-600">{f.contact}</td>
                  <td className="px-5 py-3 text-gray-600 flex items-center gap-1">
                    <MapPin size={14} className="text-[#F58020]" /> {f.adresse}
                  </td>
                  <td className="px-5 py-3 text-gray-600">{f.typeProduit}</td>
                  <td className="px-5 py-3 text-gray-700 font-medium">
                    {f.derniereLivraison ? (
                      <>
                        <CalendarDays className="inline w-4 h-4 text-[#472EAD] mr-1" />
                        {new Date(f.derniereLivraison).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </>
                    ) : (
                      <span className="text-gray-400 italic">Pas encore livré</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => setEditTarget(f)}
                        className="p-1.5 rounded-md hover:bg-[#F7F5FF] text-[#472EAD]"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(f)}
                        className="p-1.5 rounded-md hover:bg-rose-50 text-rose-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-gray-400 py-6">
                  Aucun fournisseur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === Modales === */}
      <Modal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouveau fournisseur">
        <FournisseurForm
          onSubmit={handleAdd}
          onCancel={() => setOpenAdd(false)}
          submitting={submitting}
        />
      </Modal>

      <Modal
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
      </Modal>

      <Modal
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
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm"
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
      </Modal>
    </>
  );
}
