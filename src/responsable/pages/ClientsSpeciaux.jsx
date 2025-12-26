// ==========================================================
// 🧍‍♂️ ClientsSpeciaux.jsx — Interface Responsable (LPD Manager)
// Gestion des clients privilégiés (vente en gros + paiements par tranches)
// Version PRO harmonisée avec Utilisateurs & Fournisseurs + Toasts intégrés
// ==========================================================

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Edit2,
  Trash2,
  Search,
  ShoppingCart,
  FileDown,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { useNavigate } from "react-router-dom";

const cls = (...a) => a.filter(Boolean).join(" ");
const formatFCFA = (n) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "XOF" }).format(Number(n || 0));

// ————————————————————————————————————————————————
// ✅ Composant Toasts
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

// ————————————————————————————————————————————————
// 🧾 Formulaire client spécial
// ————————————————————————————————————————————————
function ClientForm({ initial, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState(
    initial ?? { nom: "", contact: "", entreprise: "", adresse: "" }
  );
  const [errors, setErrors] = useState({});

  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis.";
    if (!form.contact.match(/^[0-9]{9}$/))
      e.contact = "Le contact doit contenir exactement 9 chiffres.";
    if (!form.entreprise.trim()) e.entreprise = "L’entreprise est requise.";
    if (!form.adresse.trim()) e.adresse = "L’adresse est requise.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev) => {
    ev.preventDefault();
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
          <label className="block text-sm font-medium text-gray-700">
            Nom complet <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.nom}
            onChange={(e) => update("nom", e.target.value)}
            placeholder="Ex : DIOP Mamadou"
            className={base(errors.nom)}
            required
          />
          {errors.nom && <p className="text-xs text-rose-600 mt-1">{errors.nom}</p>}
        </div>

        {/* Contact */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Contact <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.contact}
            onChange={(e) =>
              update("contact", e.target.value.replace(/\D/g, "").slice(0, 9))
            }
            placeholder="Ex : 771234567"
            maxLength={9}
            className={base(errors.contact)}
            required
          />
          {errors.contact && (
            <p className="text-xs text-rose-600 mt-1">{errors.contact}</p>
          )}
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Entreprise <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.entreprise}
            onChange={(e) => update("entreprise", e.target.value)}
            placeholder="Ex : Imprisol SARL"
            className={base(errors.entreprise)}
            required
          />
          {errors.entreprise && (
            <p className="text-xs text-rose-600 mt-1">{errors.entreprise}</p>
          )}
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Adresse <span className="text-rose-600">*</span>
          </label>
          <input
            value={form.adresse}
            onChange={(e) => update("adresse", e.target.value)}
            placeholder="Ex : Dakar Plateau"
            className={base(errors.adresse)}
            required
          />
          {errors.adresse && (
            <p className="text-xs text-rose-600 mt-1">{errors.adresse}</p>
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

// ————————————————————————————————————————————————
// 📋 Page principale
// ————————————————————————————————————————————————
export default function ClientsSpeciaux() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

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
        nom: "DIOP Mamadou",
        contact: "771234567",
        entreprise: "Bureau Afrique Service",
        adresse: "Dakar Plateau",
        totalDette: 50000,
      },
      {
        id: 2,
        nom: "SOW Aissatou",
        contact: "781112233",
        entreprise: "Imprisol SARL",
        adresse: "Thiès",
        totalDette: 0,
      },
      {
        id: 3,
        nom: "NDIAYE Cheikh",
        contact: "761234555",
        entreprise: "École Al Falah",
        adresse: "Kaolack",
        totalDette: 35000,
      },
    ];
    setTimeout(() => {
      setClients(simulated);
      setLoading(false);
    }, 500);
  }, []);

  const handleAdd = (data) => {
    setSubmitting(true);
    setClients((p) => [{ id: Date.now(), ...data, totalDette: 0 }, ...p]);
    toast("success", "Client ajouté", `${data.nom} a été ajouté avec succès.`);
    setSubmitting(false);
    setOpenAdd(false);
  };

  const handleEdit = (data) => {
    setSubmitting(true);
    setClients((p) => p.map((c) => (c.id === editTarget.id ? { ...c, ...data } : c)));
    toast("success", "Client modifié", `${data.nom} a été mis à jour.`);
    setSubmitting(false);
    setEditTarget(null);
  };

  const handleDelete = () => {
    setSubmitting(true);
    setClients((p) => p.filter((c) => c.id !== deleteTarget.id));
    toast("success", "Client supprimé", `${deleteTarget.nom} a été supprimé.`);
    setSubmitting(false);
    setDeleteTarget(null);
  };

  const goToCommandes = (nomClient) => {
    navigate("/responsable/commandes", { state: { client: nomClient } });
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Liste des clients spéciaux — LPD Manager", 14, 16);
    doc.autoTable({
      startY: 24,
      head: [["Nom", "Contact", "Entreprise", "Adresse", "Dette totale"]],
      body: clients.map((c) => [
        c.nom,
        c.contact,
        c.entreprise,
        c.adresse,
        formatFCFA(c.totalDette),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [71, 46, 173] },
    });
    doc.save("ClientsSpeciaux.pdf");
    toast("success", "Export PDF", "Le fichier ClientsSpeciaux.pdf a été généré.");
  };

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return clients.filter(
      (c) =>
        c.nom.toLowerCase().includes(q) ||
        c.contact.toLowerCase().includes(q) ||
        c.entreprise.toLowerCase().includes(q) ||
        c.adresse.toLowerCase().includes(q)
    );
  }, [clients, searchTerm]);

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
          <h1 className="text-2xl font-bold text-[#472EAD]">Clients spéciaux</h1>
          <p className="text-sm text-gray-500">
            Liste, ajout, modification et suivi des clients privilégiés.
          </p>
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
            <UserPlus size={16} /> Nouveau client
          </button>
        </div>
      </div>

      {/* RECHERCHE */}
      <div className="relative flex-1 mb-5">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Rechercher par nom, contact, entreprise, adresse..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-black rounded-lg text-sm focus:ring-2 focus:ring-[#472EAD]/30 focus:border-[#472EAD]"
        />
      </div>

      {/* TABLEAU */}
      <DataTable
        columns={[
          { key: "nom", label: "Nom" },
          { key: "contact", label: "Contact" },
          { key: "entreprise", label: "Entreprise" },
          { key: "adresse", label: "Adresse" },
          {
            key: "totalDette",
            label: "Dette totale",
            render: (v) => <span className="font-semibold text-[#472EAD]">{formatFCFA(v)}</span>,
          },
        ]}
        data={filtered}
        actions={[
          {
            icon: <ShoppingCart size={16} />,
            title: "Voir les commandes",
            color: "text-[#472EAD]",
            hoverBg: "bg-[#F7F5FF]",
            onClick: (row) => goToCommandes(row.nom),
          },
          {
            icon: <Edit2 size={16} />,
            title: "Modifier",
            color: "text-[#472EAD]",
            hoverBg: "bg-[#F7F5FF]",
            onClick: (row) => setEditTarget(row),
          },
          {
            icon: <Trash2 size={16} />,
            title: "Supprimer",
            color: "text-rose-600",
            hoverBg: "bg-rose-50",
            onClick: (row) => setDeleteTarget(row),
          },
        ]}
      />

      {/* MODALES */}
      <FormModal open={openAdd} onClose={() => setOpenAdd(false)} title="Nouveau client spécial">
        <ClientForm onSubmit={handleAdd} onCancel={() => setOpenAdd(false)} submitting={submitting} />
      </FormModal>

      <FormModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Modifier : ${editTarget?.nom}`}
      >
        {editTarget && (
          <ClientForm
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
