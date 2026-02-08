// ==========================================================
// 🚚 Fournisseurs.jsx — Interface Responsable (LPD Manager)
// Version PRO harmonisée + API Laravel (/api/fournisseurs)
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
  Eye,
  Phone,
  Package,
} from "lucide-react";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import { fournisseursAPI } from '@/services/api';

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
    if (!form.adresse.trim()) e.adresse = "L'adresse est requise.";
    if (!form.typeProduit.trim())
      e.typeProduit = "Le type de produits est requis.";
    if (form.derniereLivraison) {
      const d = new Date(form.derniereLivraison);
      const today = new Date();
      d.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (d > today)
        e.derniereLivraison =
          "La date doit être antérieure ou égale à aujourd'hui.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const base = (err) =>
    `mt-1 w-full rounded-xl border px-3 py-2.5 text-sm bg-white focus:ring-2 transition shadow-sm ${
      err
        ? "border-rose-500 focus:ring-rose-200"
        : "border-gray-300 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
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
          {errors.nom && (
            <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>
          )}
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
          {errors.contact && (
            <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>
          )}
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
          {errors.adresse && (
            <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>
          )}
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
            <p className="text-xs text-rose-600 mt-1">
              {errors.typeProduit}
            </p>
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
            <p className="text-xs text-rose-600 mt-1">
              {errors.derniereLivraison}
            </p>
          )}
        </div>
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 shadow-sm"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={cls(
            "px-4 py-2.5 rounded-lg text-sm text-white bg-gradient-to-r from-[#472EAD] to-[#6A4DF5] hover:shadow-md hover:scale-[1.01] active:scale-[0.98] transition",
            submitting && "opacity-70 cursor-not-allowed"
          )}
        >
          {submitting
            ? "Enregistrement..."
            : initial
            ? "Mettre à jour"
            : "Enregistrer"}
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
  const [searchInput, setSearchInput] = useState(""); // ce que tape l'utilisateur
  const [searchTerm, setSearchTerm] = useState("");   // envoyé à l'API
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedFournisseur, setSelectedFournisseur] = useState(null);
  // Pagination backend
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const removeToast = (id) =>
    setToasts((t) => t.filter((x) => x.id !== id));

  const toast = (type, title, message) => {
    const id = Date.now();
    setToasts((t) => [...t, { id, type, title, message }]);
    setTimeout(() => removeToast(id), 4000);
  };

  // Debounce pour la recherche : attendre que l'utilisateur arrête de taper
  // ET réinitialiser la page en même temps
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setPage(1);
        setSearchTerm(searchInput);
      }
    }, 1000); // délai 1 seconde

    return () => clearTimeout(timer);
  }, [searchInput, searchTerm]);

  // 🔗 Chargement depuis l'API Laravel
  useEffect(() => {
    const fetchFournisseurs = async () => {
      try {
        setLoading(page === 1); // Afficher le loader seulement pour la première page
        const data = await fournisseursAPI.getAll({
          page,
          search: searchTerm || undefined,
        });
        
        const raw = Array.isArray(data) ? data : data.data || [];

        // Gestion de la pagination Laravel
        if (!Array.isArray(data)) {
          const total = data.total || 0;
          const perPage = data.per_page || 20;

          setTotalItems(total);
          setTotalPages(Math.max(1, Math.ceil(total / perPage)));
        }

        const normalized = raw.map((f) => ({
          id: f.id,
          nom: f.nom || "",
          contact: f.contact || "",
          adresse: f.adresse || "",
          typeProduit: f.type_produit || "",
          derniereLivraison: f.derniere_livraison || "",
          totalAchats: f.total_achats ?? 0,
        }));

        setFournisseurs(normalized);
      } catch (err) {
        toast(
          "error",
          "Erreur",
          "Impossible de charger la liste des fournisseurs."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFournisseurs();
  }, [page, searchTerm]);

  // Stats rapides
  const stats = useMemo(() => {
    const total = totalItems;
    const avecLivraison = fournisseurs.filter(
      (f) => !!f.derniereLivraison
    ).length;
    return { total, avecLivraison };
  }, [totalItems, fournisseurs]);

  // ➕ Ajout (POST /api/fournisseurs)
  const handleAdd = async (form) => {
    const tempId = `tmp-${Date.now()}`;

    const optimisticFournisseur = {
      id: tempId,
      nom: form.nom,
      contact: form.contact,
      adresse: form.adresse,
      typeProduit: form.typeProduit,
      derniereLivraison: form.derniereLivraison || "",
      totalAchats: 0,
    };

    // 1️⃣ Optimistic update UI
    setFournisseurs((prev) => [optimisticFournisseur, ...prev]);
    setSubmitting(true);

    try {
      const payload = {
        nom: form.nom,
        contact: form.contact,
        adresse: form.adresse,
        type_produit: form.typeProduit,
        derniere_livraison: form.derniereLivraison || null,
      };

      const data = await fournisseursAPI.create(payload);

      // 2️⃣ Remplacer le faux fournisseur par le vrai
      setFournisseurs((prev) =>
        prev.map((f) =>
          f.id === tempId
            ? {
                id: data.id,
                nom: data.nom || "",
                contact: data.contact || "",
                adresse: data.adresse || "",
                typeProduit: data.type_produit || "",
                derniereLivraison: data.derniere_livraison || "",
                totalAchats: data.total_achats ?? 0,
              }
            : f
        )
      );

      toast(
        "success",
        "Fournisseur ajouté",
        `${data.nom} a été ajouté avec succès.`
      );
      setOpenAdd(false);
    } catch {
      // 3️⃣ Rollback si erreur
      setFournisseurs((prev) =>
        prev.filter((f) => f.id !== tempId)
      );

      toast(
        "error",
        "Erreur",
        "Impossible d'ajouter le fournisseur."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ✏️ Modification (PUT /api/fournisseurs/{id})
  const handleEdit = async (form) => {
    if (!editTarget) return;

    const previous = fournisseurs;

    const optimisticUpdated = {
      ...editTarget,
      nom: form.nom,
      contact: form.contact,
      adresse: form.adresse,
      typeProduit: form.typeProduit,
      derniereLivraison: form.derniereLivraison || "",
    };

    // 1️⃣ Optimistic update
    setFournisseurs((prev) =>
      prev.map((f) => (f.id === editTarget.id ? optimisticUpdated : f))
    );

    setSubmitting(true);

    try {
      const payload = {
        nom: form.nom,
        contact: form.contact,
        adresse: form.adresse,
        type_produit: form.typeProduit,
        derniere_livraison: form.derniereLivraison || null,
      };

      await fournisseursAPI.update(editTarget.id, payload);

      toast(
        "success",
        "Fournisseur modifié",
        `${form.nom} a été mis à jour.`
      );
      setEditTarget(null);
    } catch {
      // 2️⃣ Rollback
      setFournisseurs(previous);

      toast(
        "error",
        "Erreur",
        "Impossible de modifier le fournisseur."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 🗑️ Suppression (DELETE /api/fournisseurs/{id})
  const handleDelete = async () => {
    if (!deleteTarget) return;

    const previous = fournisseurs;

    // 1️⃣ Optimistic removal
    setFournisseurs((prev) =>
      prev.filter((f) => f.id !== deleteTarget.id)
    );

    setSubmitting(true);

    try {
      await fournisseursAPI.delete(deleteTarget.id);

      toast(
        "success",
        "Fournisseur supprimé",
        `${deleteTarget.nom} a été supprimé.`
      );
      setDeleteTarget(null);
    } catch {
      // 2️⃣ Rollback
      setFournisseurs(previous);

      toast(
        "error",
        "Erreur",
        "Impossible de supprimer le fournisseur."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Loader harmonisé
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[70vh] bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/80 border border-[#E4E0FF] shadow-sm">
          <Loader2 className="w-5 h-5 text-[#472EAD] animate-spin" />
          <span className="text-sm font-medium text-[#472EAD]">
            Chargement des fournisseurs...
          </span>
        </div>
      </div>
    );

  return (
    <>
      <div className="min-h-screen w-full bg-gradient-to-br from-[#F7F6FF] via-[#F9FAFF] to-white px-4 sm:px-6 lg:px-10 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8"> {/* Changé de space-y-7 à space-y-8 */}
          
          {/* HEADER */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6 mb-8" 
          >
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-[#E4E0FF] shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-[#F58020]" />
                <span className="text-[11px] font-semibold tracking-wide text-[#472EAD] uppercase">
                  Module Fournisseurs — Responsable
                </span>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#2F1F7A]">
                  Gestion des fournisseurs
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Suivi des partenaires d'approvisionnement : ajout,
                  modification et suppression des fournisseurs.
                </p>
              </div>
              <p className="text-[11px] text-gray-400">
                {stats.total} fournisseur
                {stats.total > 1 && "s"} • {stats.avecLivraison} avec
                livraison renseignée
              </p>
            </div>

            <button
              onClick={() => setOpenAdd(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#472EAD] text-white rounded-lg shadow-md hover:bg-[#5A3CF5] hover:shadow-lg text-xs sm:text-sm transition"
            >
              <UserPlus size={18} />
              Nouveau fournisseur
            </button>
          </motion.header>

          {/* RECHERCHE & TABLEAU */}
          <section className="bg-white/90 border border-[#E4E0FF] rounded-2xl shadow-[0_18px_45px_rgba(15,23,42,0.06)] px-4 sm:px-5 py-4 sm:py-5 space-y-4"> {/* Supprimé le mt-8, gardé seulement le padding interne */}
            
            {/* Recherche */}
            <div className="relative mb-4"> {/* Ajout de mb-4 */}
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, contact, adresse ou type de produit..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm bg-white/80 shadow-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD] placeholder:text-gray-400"
              />
            </div>

            {/* Tableau */}
            <DataTable
              columns={[
                { label: "Nom", key: "nom" },
                { label: "Contact", key: "contact" },
                {
                  label: "Adresse",
                  key: "adresse",
                  render: (val) => (
                    <span className="flex items-center gap-1 text-sm">
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
                      <span className="flex items-center gap-1 text-sm">
                        <CalendarDays
                          size={14}
                          className="text-[#472EAD]"
                        />
                        {new Date(val).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic text-xs">
                        Pas encore livré
                      </span>
                    ),
                },
              ]}
              data={fournisseurs}
              actions={[
                {
                  title: "Voir la fiche",
                  icon: <Eye size={16} />,
                  color: "text-sky-600",
                  hoverBg: "bg-sky-50",
                  onClick: (row) => setSelectedFournisseur(row),
                },
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
          </section>

          {/* MODALES CRUD */}
          <FormModal
            open={openAdd}
            onClose={() => setOpenAdd(false)}
            title="Nouveau fournisseur"
          >
            <FournisseurForm
              onSubmit={handleAdd}
              onCancel={() => setOpenAdd(false)}
              submitting={submitting}
            />
          </FormModal>

          <FormModal
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            title={editTarget ? `Modifier : ${editTarget.nom}` : "Modifier"}
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
              <span className="font-semibold">
                {deleteTarget?.nom}
              </span>{" "}
              de la liste des fournisseurs ?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2.5 rounded-lg text-sm text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Supprimer
              </button>
            </div>
          </FormModal>

          {/* TOASTS */}
          <Toasts toasts={toasts} remove={removeToast} />
        </div>
      </div>

      {/* SLIDE-OVER FICHE FOURNISSEUR */}
      <AnimatePresence>
        {selectedFournisseur && (
          <motion.div
            className="fixed inset-0 z-40 flex justify-end bg-black/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedFournisseur(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              className="h-full w-full max-w-md bg-white shadow-2xl border-l border-[#E4E0FF] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#ECE9FF] bg-gradient-to-r from-white via-[#F9F7FF] to-white flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <div className="h-9 w-9 rounded-full bg-[#F58020]/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-[#F58020]" />
                    </div>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-[#F7F5FF] border border-[#E4E0FF] mb-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#F58020]" />
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-[#472EAD]">
                        Fiche fournisseur
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#2F1F7A] leading-snug">
                      {selectedFournisseur.nom}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Type de produits :{" "}
                      <span className="font-semibold text-[#472EAD]">
                        {selectedFournisseur.typeProduit}
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFournisseur(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Contenu */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                {/* Adresse */}
                <div className="rounded-xl border border-gray-100 bg-[#F9FAFF] px-3 py-2.5 text-xs flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#F58020]" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Adresse
                    </p>
                    <p className="font-semibold text-gray-800">
                      {selectedFournisseur.adresse}
                    </p>
                  </div>
                </div>

                {/* Contact + Produits */}
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#472EAD]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Contact
                      </p>
                      <p className="font-semibold text-gray-800">
                        {selectedFournisseur.contact}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs flex items-center gap-2">
                    <Package className="w-4 h-4 text-[#472EAD]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Type de produits
                      </p>
                      <p className="font-semibold text-gray-800">
                        {selectedFournisseur.typeProduit}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-xs flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-[#472EAD]" />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Dernière livraison
                      </p>
                      <p className="font-semibold text-gray-800">
                        {selectedFournisseur.derniereLivraison
                          ? new Date(
                              selectedFournisseur.derniereLivraison
                            ).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "long",
                              year: "numeric",
                            })
                          : "Aucune livraison renseignée"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-[#ECE9FF] bg-white flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  Fiche informative — les modifications se font depuis le module
                  principal.
                </p>
                <button
                  onClick={() => setSelectedFournisseur(null)}
                  className="text-xs font-medium text-[#472EAD] hover:text-[#2F1F7A] px-3 py-1.5 rounded-lg hover:bg-[#F5F3FF] transition"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}