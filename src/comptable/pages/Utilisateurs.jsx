// ==========================================================
// 👥 Utilisateurs.jsx — VERSION FLUIDE 🔥
// CRUD + RECHERCHE MANUELLE + FILTRES + PAGINATION + TOASTS
// ✅ RECHERCHE UNIQUEMENT AU CLIC SUR BOUTON RECHERCHER
// ✅ PERSISTANCE DE LA RECHERCHE
// ✅ FLUIDITÉ TOTALE (pas de debounce)
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Trash2,
  Edit2,
  Eye,
  
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Users,
  RefreshCw,
  Mail,
  Phone,
  MapPin,
  IdCard,
  User,
} from "lucide-react";

import FormModal from "../components/FormModal.jsx";
import DataTable from "../components/DataTable.jsx";
import utilisateursAPI from "../../services/api/utilisateurs.js";

/* ===================== CONSTANTES ===================== */

// ⚠️ RÔLES AU FORMAT BASE DE DONNÉES (snake_case)
const ROLES_DB = [
  "responsable",
  "vendeur",
  "caissier",
  "gestionnaire_depot",
  "gestionnaire_boutique",
];

// 🎯 MAPPAGE POUR L'AFFICHAGE (DB -> UI)
const ROLE_DISPLAY_MAPPING = {
  "responsable": "Responsable",
  "vendeur": "Vendeur",
  "caissier": "Caissier",
  "gestionnaire_depot": "Gestionnaire Dépôt",
  "gestionnaire_boutique": "Gestionnaire Boutique"
};

// 📋 RÔLES POUR L'AFFICHAGE DANS L'UI
const ROLES_UI = Object.values(ROLE_DISPLAY_MAPPING);

const DEFAULT_PER_PAGE = 20;

const cls = (...classes) => classes.filter(Boolean).join(' ');
const isEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/* ======================= TOASTS ======================= */
const Toasts = ({ toasts, remove }) => (
  <div className="fixed top-20 right-4 z-[9999] space-y-2 pointer-events-none">
    <AnimatePresence>
      {toasts.map((toast) => (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          className={cls(
            "min-w-[320px] max-w-md rounded-xl border shadow-lg px-4 py-3 flex gap-3 pointer-events-auto",
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          )}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="flex-shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertCircle className="flex-shrink-0 mt-0.5" size={18} />
          )}
          <div className="flex-1 text-sm font-medium break-words">
            {toast.title}
          </div>
          <button 
            onClick={() => remove(toast.id)} 
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
          >
            <X size={16} />
          </button>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
);

/* ================== MODALE DE VISUALISATION ================= */
const ViewUserModal = ({ user, onClose }) => {
  if (!user) return null;

  return (
    <FormModal open={!!user} onClose={onClose} title="Détails de l'utilisateur">
      <div className="space-y-6">
        {/* En-tête avec avatar */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#472EAD] to-[#6d4fc7] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
            {user.prenom?.[0]}{user.nom?.[0]}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">
              {user.prenom} {user.nom}
            </h3>
            <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-[#472EAD] rounded-full text-xs font-medium">
              {formatRole(user.role)}
            </span>
          </div>
        </div>

        {/* Grille d'informations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Mail size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Email</span>
            </div>
            <p className="text-gray-900 font-medium break-all">{user.email || '-'}</p>
          </div>

          {/* Téléphone */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Phone size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Téléphone</span>
            </div>
            <p className="text-gray-900 font-medium">{formatPhone(user.telephone)}</p>
          </div>

          {/* CNI */}
          <div className="bg-gray-50 p-4 rounded-xl">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <IdCard size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Numéro CNI</span>
            </div>
            <p className="text-gray-900 font-medium">{user.numero_cni || '-'}</p>
          </div>

          {/* Adresse */}
          <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <MapPin size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">Adresse</span>
            </div>
            <p className="text-gray-900 font-medium">{user.adresse || 'Non renseignée'}</p>
          </div>

          {/* Date de création */}
          {user.created_at && (
            <div className="bg-gray-50 p-4 rounded-xl md:col-span-2">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <User size={16} />
                <span className="text-xs font-medium uppercase tracking-wider">Membre depuis</span>
              </div>
              <p className="text-gray-900 font-medium">
                {new Date(user.created_at).toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#472EAD] text-white rounded-lg hover:bg-[#3a2590] transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </FormModal>
  );
};

/* ================== FORMULAIRE CRÉATION ================= */
const UserForm = ({ onSubmit, onCancel, isLoading, error }) => {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    numero_cni: "",
    role: "Vendeur",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Champs obligatoires
    if (!form.prenom?.trim()) errors.prenom = "Prénom requis";
    if (!form.nom?.trim()) errors.nom = "Nom requis";
    if (!form.email?.trim()) {
      errors.email = "Email requis";
    } else if (!isEmail(form.email)) {
      errors.email = "Email invalide";
    }
    if (!form.numero_cni?.trim()) errors.numero_cni = "Numéro CNI requis";
    if (!form.role) errors.role = "Rôle requis";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(form);
    }
  };

  const inputClass = "border rounded-lg px-3 py-2 text-sm w-full transition-all focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none";
  const errorInputClass = "border-rose-500 bg-rose-50 focus:ring-rose-200 focus:border-rose-500";

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-800 flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <span className="flex-1">{error}</span>
        </div>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        {/* Prénom (obligatoire) */}
        <div className="space-y-1">
          <input
            className={cls(inputClass, fieldErrors.prenom && errorInputClass)}
            placeholder="Prénom *"
            value={form.prenom}
            onChange={(e) => updateField("prenom", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.prenom && (
            <p className="text-xs text-rose-600">{fieldErrors.prenom}</p>
          )}
        </div>

        {/* Nom (obligatoire) */}
        <div className="space-y-1">
          <input
            className={cls(inputClass, fieldErrors.nom && errorInputClass)}
            placeholder="Nom *"
            value={form.nom}
            onChange={(e) => updateField("nom", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.nom && (
            <p className="text-xs text-rose-600">{fieldErrors.nom}</p>
          )}
        </div>

        {/* Email (obligatoire) */}
        <div className="space-y-1">
          <input
            className={cls(inputClass, fieldErrors.email && errorInputClass)}
            placeholder="Email *"
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.email && (
            <p className="text-xs text-rose-600">{fieldErrors.email}</p>
          )}
        </div>

        {/* Téléphone (optionnel) */}
        <input
          className={inputClass}
          placeholder="Téléphone (optionnel)"
          value={form.telephone}
          onChange={(e) => updateField("telephone", e.target.value)}
          disabled={isLoading}
        />

        {/* CNI (obligatoire) */}
        <div className="space-y-1">
          <input
            className={cls(inputClass, fieldErrors.numero_cni && errorInputClass)}
            placeholder="Numéro CNI *"
            value={form.numero_cni}
            onChange={(e) => updateField("numero_cni", e.target.value)}
            disabled={isLoading}
          />
          {fieldErrors.numero_cni && (
            <p className="text-xs text-rose-600">{fieldErrors.numero_cni}</p>
          )}
        </div>

        {/* Rôle (obligatoire) */}
        <div className="space-y-1">
          <select
            className={cls(inputClass, fieldErrors.role && errorInputClass)}
            value={form.role}
            onChange={(e) => updateField("role", e.target.value)}
            disabled={isLoading}
          >
            {ROLES_UI.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
          {fieldErrors.role && (
            <p className="text-xs text-rose-600">{fieldErrors.role}</p>
          )}
        </div>

        {/* Adresse (optionnelle) */}
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Adresse (optionnelle)"
          value={form.adresse}
          onChange={(e) => updateField("adresse", e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Boutons */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className={cls(
            "px-4 py-2 bg-[#472EAD] text-white rounded-lg transition-all flex items-center gap-2",
            isLoading ? "opacity-70 cursor-not-allowed" : "hover:bg-[#3a2590]"
          )}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw size={16} className="animate-spin" />
              Création...
            </>
          ) : (
            "Créer l'utilisateur"
          )}
        </button>
      </div>
    </div>
  );
};

/* ================== FILTRE PAR RÔLE ================= */
const RoleFilter = ({ selectedRole, onRoleChange, onReset }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cls(
          "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors whitespace-nowrap",
          selectedRole 
            ? "bg-[#472EAD] text-white border-[#472EAD]" 
            : "hover:bg-gray-50"
        )}
      >
        <Filter size={16} />
        <span className="text-sm">
          {selectedRole ? ROLE_DISPLAY_MAPPING[selectedRole] || selectedRole : "Filtrer par rôle"}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50 py-2">
            <button
              onClick={() => {
                onReset();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm font-medium text-[#472EAD]"
            >
              🧹 Tous les rôles
            </button>
            <div className="border-t my-2" />
            {ROLES_DB.map((role) => (
              <button
                key={role}
                onClick={() => {
                  onRoleChange(role);
                  setIsOpen(false);
                }}
                className={cls(
                  "w-full text-left px-4 py-2 hover:bg-gray-50 text-sm transition-colors",
                  selectedRole === role && "bg-gray-50 text-[#472EAD] font-medium"
                )}
              >
                {ROLE_DISPLAY_MAPPING[role] || role}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

/* ================== PAGINATION ================= */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  const getPageNumbers = useCallback(() => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        <Users size={14} className="inline mr-1" />
        {totalItems} utilisateur{totalItems > 1 ? 's' : ''}
      </div>
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Première page"
        >
          <ChevronsLeft size={16} />
        </button>
        
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page précédente"
        >
          <ChevronLeft size={16} />
        </button>

        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            className={cls(
              "min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors",
              page === currentPage
                ? "bg-[#472EAD] text-white"
                : page === '...'
                ? "cursor-default"
                : "hover:bg-gray-50 border"
            )}
            disabled={page === '...'}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Page suivante"
        >
          <ChevronRight size={16} />
        </button>
        
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Dernière page"
        >
          <ChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
};

/* ================== FONCTION DE FORMATAGE DES RÔLES ================= */
const formatRole = (role) => {
  if (!role) return '-';
  return ROLE_DISPLAY_MAPPING[role.toLowerCase()] || 
         role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

/* ================== FONCTION DE FORMATAGE DU TÉLÉPHONE ================= */
const formatPhone = (phone) => {
  if (!phone) return '-';
  return phone;
};

/* ================== PAGE PRINCIPALE ================= */
export default function Utilisateurs() {
  // États des données
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // États des filtres
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState(""); // Terme de recherche actif (celui qui a été validé)
  const [selectedRole, setSelectedRole] = useState("");
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  // États des modales
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [viewTarget, setViewTarget] = useState(null); // Nouvel état pour la visualisation
  const [formError, setFormError] = useState(null);
  
  // États des toasts
  const [toasts, setToasts] = useState([]);
  
  // Refs pour éviter les appels multiples
  const loadingRef = useRef(false);
  const previousParamsRef = useRef('');

  /* ============= GESTION DES TOASTS ============= */
  const addToast = useCallback((title, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, title, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* ============= GÉNÉRATION DES PARAMÈTRES API (STABLES) ============= */
  const getApiParams = useCallback((page = currentPage) => {
    const params = { page };
    
    if (activeSearch?.trim()) {
      params.search = activeSearch.trim();
    }
    
    if (selectedRole) {
      params.role = selectedRole;
    }
    
    return params;
  }, [activeSearch, selectedRole, currentPage]);

  /* ============= CHARGEMENT DES DONNÉES (VERSION ROBUSTE) ============= */
  const loadUsers = useCallback(async (page = 1) => {
    // Éviter les appels multiples simultanés
    if (loadingRef.current) {
      console.log("⏳ Chargement déjà en cours, ignoré");
      return;
    }

    try {
      loadingRef.current = true;
      setIsLoading(true);
      
      const params = getApiParams(page);
      const paramsKey = JSON.stringify(params);
      
      // Éviter les appels avec les mêmes paramètres
      if (paramsKey === previousParamsRef.current && initialLoadDone) {
        console.log("📦 Paramètres identiques, chargement ignoré");
        return;
      }
      
      console.log("📡 Chargement avec params:", params);
      previousParamsRef.current = paramsKey;
      
      const response = await utilisateursAPI.getAll(params);
      
      console.log("📡 Réponse API:", response);
      
      if (response?.data) {
        setUsers(response.data);
        setTotalPages(response.last_page || 1);
        setTotalItems(response.total || 0);
        setCurrentPage(response.current_page || page);
      } else if (Array.isArray(response)) {
        setUsers(response);
        setTotalPages(1);
        setTotalItems(response.length);
        setCurrentPage(1);
      }
      
      setInitialLoadDone(true);
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      addToast("Impossible de charger les utilisateurs", "error");
      setUsers([]);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, [getApiParams, addToast, initialLoadDone]);

  /* ============= EFFET DE CHARGEMENT UNIQUE ============= */
  useEffect(() => {
    loadUsers(1);
  }, []); // ⚠️ Dépendances vides - ne s'exécute qu'au montage

  /* ============= EFFET POUR LES FILTRES ============= */
  useEffect(() => {
    if (initialLoadDone) {
      loadUsers(1); // Retour à la page 1 quand les filtres changent
    }
  }, [activeSearch, selectedRole]); // ⚠️ Dépendances stables (primitives)

  /* ============= CHANGEMENT DE PAGE ============= */
  const handlePageChange = useCallback((page) => {
    if (page !== currentPage && initialLoadDone) {
      loadUsers(page);
    }
  }, [currentPage, loadUsers, initialLoadDone]);

  /* ============= RECHERCHE MANUELLE ============= */
  const handleSearch = useCallback(() => {
    setActiveSearch(searchTerm);
  }, [searchTerm]);

  /* ============= RÉINITIALISATION DES FILTRES ============= */
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setActiveSearch("");
    setSelectedRole("");
    addToast("✅ Filtres réinitialisés");
  }, [addToast]);

  /* ============= GESTIONNAIRES CRUD ============= */
  const handleCreateUser = useCallback(async (formData) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      await utilisateursAPI.create(formData);
      
      addToast("✅ Utilisateur créé avec succès. Mot de passe envoyé par email.");
      setOpenAdd(false);
      await loadUsers(1); // Retour à la page 1 après création
      
    } catch (error) {
      console.error("❌ Erreur création:", error);
      
      if (error.response?.status === 422 || error.response?.status === 409) {
        const errors = error.response.data?.errors;
        if (errors?.email) {
          setFormError("❌ Cet email est déjà utilisé. Veuillez en choisir un autre.");
        } else if (errors?.numero_cni) {
          setFormError("❌ Ce numéro CNI est déjà utilisé.");
        } else {
          setFormError("❌ Erreur de validation. Vérifiez les champs.");
        }
      } else {
        setFormError("❌ Erreur lors de la création de l'utilisateur");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, loadUsers]);

  const handleUpdateUser = useCallback(async () => {
    if (!editTarget) return;
    
    try {
      setIsSubmitting(true);
      
      await utilisateursAPI.update(editTarget.id, {
        telephone: editTarget.telephone,
        adresse: editTarget.adresse,
        role: editTarget.role,
      });
      
      addToast("✅ Utilisateur modifié avec succès");
      setEditTarget(null);
      await loadUsers(currentPage);
      
    } catch (error) {
      console.error("❌ Erreur modification:", error);
      addToast("❌ Erreur lors de la modification", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [editTarget, addToast, currentPage, loadUsers]);

  const handleDeleteUser = useCallback(async () => {
    if (!deleteTarget) return;
    
    try {
      setIsSubmitting(true);
      
      await utilisateursAPI.remove(deleteTarget.id);
      
      addToast("🗑️ Utilisateur supprimé", "error");
      setDeleteTarget(null);
      
      if (users.length === 1 && currentPage > 1) {
        await loadUsers(currentPage - 1);
      } else {
        await loadUsers(currentPage);
      }
      
    } catch (error) {
      console.error("❌ Erreur suppression:", error);
      addToast("❌ Erreur lors de la suppression", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [deleteTarget, addToast, users.length, currentPage, loadUsers]);

  const handleResetPassword = useCallback(async () => {
    if (!resetTarget) return;
    
    try {
      setIsSubmitting(true);
      
      await utilisateursAPI.resetPassword(resetTarget.id);
      
      addToast("🔐 Nouveau mot de passe envoyé par email");
      setResetTarget(null);
      
    } catch (error) {
      console.error("❌ Erreur réinitialisation:", error);
      addToast("❌ Erreur lors de la réinitialisation", "error");
    } finally {
      setIsSubmitting(false);
    }
  }, [resetTarget, addToast]);

  /* ============= GESTION DE LA TOUCHE ENTRÉE ============= */
  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }, [handleSearch]);

  /* ============= FORMATAGE DES DONNÉES ============= */
  const formattedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      fullName: `${user.prenom || ''} ${user.nom || ''}`.trim() || '-',
      formattedRole: formatRole(user.role),
      formattedPhone: formatPhone(user.telephone),
    }));
  }, [users]);

  /* ============= RENDU DES ACTIONS ============= */
  const renderActions = useCallback((user) => (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setViewTarget(user)}
        className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
        title="Voir les détails"
      >
        <Eye size={16} />
      </button>
      <button
        onClick={() => setEditTarget(user)}
        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Modifier"
      >
        <Edit2 size={16} />
      </button>
      <button
        onClick={() => setResetTarget(user)}
        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
        title="Réinitialiser mot de passe"
      >
        <KeyRound size={16} />
      </button>
      <button
        onClick={() => setDeleteTarget(user)}
        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        title="Supprimer"
      >
        <Trash2 size={16} />
      </button>
    </div>
  ), []);

  /* ============= COLONNES DU TABLEAU ============= */
  const columns = useMemo(() => [
    {
      label: "Nom complet",
      render: (_, user) => user.fullName,
    },
    {
      label: "Email",
      key: "email",
    },
    {
      label: "Rôle",
      render: (_, user) => user.formattedRole,
    },
    {
      label: "Actions",
      render: (_, user) => renderActions(user),
    },
  ], [renderActions]);

  /* ============= RENDU ============= */
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* EN-TÊTE */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[#472EAD]">
                Gestion des utilisateurs
              </h1>
              <div className="text-sm bg-indigo-50 text-[#472EAD] px-4 py-2 rounded-xl font-medium">
                {!isLoading && totalItems > 0 && (
                  <span>{totalItems} utilisateur{totalItems > 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RECHERCHE ET FILTRES */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Rechercher par nom, prénom, email... (Appuyez sur Entrée)"
                  className="w-full pl-9 pr-24 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                  disabled={isLoading}
                />
                <div className="absolute right-2 top-1.5 flex gap-1">
                  {searchTerm && searchTerm !== activeSearch && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Effacer"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <button
                    onClick={handleSearch}
                    disabled={isLoading || searchTerm === activeSearch}
                    className={cls(
                      "px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                      searchTerm !== activeSearch
                        ? "bg-[#472EAD] text-white hover:bg-[#3a2590]"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    Rechercher
                  </button>
                </div>
              </div>

              <RoleFilter
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                onReset={() => setSelectedRole("")}
              />
            </div>

            {/* FILTRES ACTIFS */}
            {(activeSearch || selectedRole) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Filtres actifs :</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {activeSearch && (
                    <span className="bg-indigo-50 text-[#472EAD] px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <Search size={12} />
                      "{activeSearch}"
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setActiveSearch("");
                        }}
                        className="ml-1 hover:text-[#3a2590]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedRole && (
                    <span className="bg-indigo-50 text-[#472EAD] px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <Filter size={12} />
                      {ROLE_DISPLAY_MAPPING[selectedRole] || selectedRole}
                      <button
                        onClick={() => setSelectedRole("")}
                        className="ml-1 hover:text-[#3a2590]"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    Tout effacer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* BOUTON NOUVEL UTILISATEUR */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setFormError(null);
                  setOpenAdd(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#472EAD] text-white rounded-xl hover:bg-[#3a2590] transition-colors font-medium"
              >
                <UserPlus size={18} />
                Nouvel utilisateur
              </button>
            </div>
          </div>
        </div>

        {/* TABLEAU DES UTILISATEURS */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">
                Liste des utilisateurs
              </h2>
            </div>
            
            {!isLoading && users.length === 0 ? (
              <div className="text-center py-16">
                <Users size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg mb-2">
                  {activeSearch || selectedRole
                    ? "Aucun utilisateur ne correspond à vos critères"
                    : "Aucun utilisateur trouvé"}
                </p>
                {(activeSearch || selectedRole) && (
                  <button
                    onClick={handleResetFilters}
                    className="mt-2 text-[#472EAD] hover:underline text-sm font-medium"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                <DataTable
                  data={formattedUsers}
                  columns={columns}
                  isLoading={isLoading}
                />
                
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      totalItems={totalItems}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* CHARGEMENT */}
        {isLoading && (
          <div className="mb-8">
            <div className="bg-white p-8 rounded-2xl shadow-md flex justify-center items-center">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-3 border-[#472EAD] border-t-transparent"></div>
                <p className="text-gray-700 font-medium">Chargement des utilisateurs...</p>
              </div>
            </div>
          </div>
        )}

        {/* MODALES */}
        <FormModal
          open={openAdd}
          onClose={() => {
            setOpenAdd(false);
            setFormError(null);
          }}
          title="Nouvel utilisateur"
        >
          <UserForm
            onSubmit={handleCreateUser}
            onCancel={() => {
              setOpenAdd(false);
              setFormError(null);
            }}
            isLoading={isSubmitting}
            error={formError}
          />
        </FormModal>

        <FormModal
          open={!!editTarget}
          onClose={() => {
            setEditTarget(null);
            setFormError(null);
          }}
          title="Modifier l'utilisateur"
        >
          {editTarget && (
            <div className="space-y-4">
              <input
                className="border rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                value={editTarget.telephone || ""}
                onChange={(e) => setEditTarget({ ...editTarget, telephone: e.target.value })}
                placeholder="Téléphone"
                disabled={isSubmitting}
              />
              <input
                className="border rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                value={editTarget.adresse || ""}
                onChange={(e) => setEditTarget({ ...editTarget, adresse: e.target.value })}
                placeholder="Adresse"
                disabled={isSubmitting}
              />
              <select
                className="border rounded-lg px-3 py-2.5 w-full focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                value={editTarget.role || "Vendeur"}
                onChange={(e) => setEditTarget({ ...editTarget, role: e.target.value })}
                disabled={isSubmitting}
              >
                {ROLES_UI.map((role) => (
                  <option key={role}>{role}</option>
                ))}
              </select>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleUpdateUser}
                  className={cls(
                    "px-4 py-2 bg-[#472EAD] text-white rounded-lg transition-all flex items-center gap-2",
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[#3a2590]"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Modification...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </button>
              </div>
            </div>
          )}
        </FormModal>

        <FormModal
          open={!!resetTarget}
          onClose={() => setResetTarget(null)}
          title="Réinitialiser le mot de passe"
        >
          {resetTarget && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-800">
                  Un nouveau mot de passe sera généré et envoyé à :
                </p>
                <p className="font-semibold text-amber-900 mt-1 break-all">
                  {resetTarget.email}
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setResetTarget(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetPassword}
                  className={cls(
                    "px-4 py-2 bg-[#472EAD] text-white rounded-lg transition-all flex items-center gap-2",
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-[#3a2590]"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    "Confirmer"
                  )}
                </button>
              </div>
            </div>
          )}
        </FormModal>

        <FormModal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Supprimer l'utilisateur"
        >
          {deleteTarget && (
            <div className="space-y-4">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <p className="text-sm text-rose-800">
                  Êtes-vous sûr de vouloir supprimer cet utilisateur ?
                </p>
                <p className="font-semibold text-rose-900 mt-2">
                  {deleteTarget.prenom} {deleteTarget.nom}
                </p>
                <p className="text-xs text-rose-600 mt-2">
                  Cette action est irréversible.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  onClick={handleDeleteUser}
                  className={cls(
                    "px-4 py-2 bg-rose-600 text-white rounded-lg transition-all flex items-center gap-2",
                    isSubmitting ? "opacity-70 cursor-not-allowed" : "hover:bg-rose-700"
                  )}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Suppression...
                    </>
                  ) : (
                    "Supprimer"
                  )}
                </button>
              </div>
            </div>
          )}
        </FormModal>

        {/* MODALE DE VISUALISATION */}
        <ViewUserModal user={viewTarget} onClose={() => setViewTarget(null)} />

        {/* Toasts */}
        <Toasts toasts={toasts} remove={removeToast} />
      </div>
    </div>
  );
}