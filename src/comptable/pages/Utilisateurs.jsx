// ==========================================================
// 👥 Utilisateurs.jsx — VERSION 100 ANS
// CRUD + RECHERCHE + FILTRES + PAGINATION + TOASTS
// ✅ CORRECTION FILTRES PAR RÔLE
// ✅ MAPPING COMPLET BACKEND/FRONTEND
// ✅ SUPPRESSION BOUTON RAFRAÎCHIR
// ✅ CORRECTION SUPERPOSITION CARTES
// ✅ ESPACEMENT VERTICAL HARMONIEUX
// ==========================================================

import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  KeyRound,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  Users,
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

// 🔄 MAPPAGE POUR L'ENVOI (UI -> DB)
const ROLE_API_MAPPING = {
  "Responsable": "responsable",
  "Vendeur": "vendeur",
  "Caissier": "caissier",
  "Gestionnaire Dépôt": "gestionnaire_depot",
  "Gestionnaire Boutique": "gestionnaire_boutique"
};

// 📋 RÔLES POUR L'AFFICHAGE DANS L'UI
const ROLES_UI = Object.values(ROLE_DISPLAY_MAPPING);

const DEFAULT_PER_PAGE = 20;
const DEBOUNCE_DELAY = 500;

const cls = (...classes) => classes.filter(Boolean).join(" ");
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

/* ================== FORMULAIRE CRÉATION ================= */
const UserForm = ({ onSubmit, onCancel, isLoading, error }) => {
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    adresse: "",
    numero_cni: "",
    role: "Vendeur", // Format UI
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
    
    if (!form.prenom?.trim()) errors.prenom = "Prénom requis";
    if (!form.nom?.trim()) errors.nom = "Nom requis";
    if (!form.email?.trim()) {
      errors.email = "Email requis";
    } else if (!isEmail(form.email)) {
      errors.email = "Email invalide";
    }

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
        {/* Prénom */}
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

        {/* Nom */}
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

        {/* Email */}
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

        {/* Téléphone */}
        <input
          className={inputClass}
          placeholder="Téléphone"
          value={form.telephone}
          onChange={(e) => updateField("telephone", e.target.value)}
          disabled={isLoading}
        />

        {/* CNI */}
        <input
          className={inputClass}
          placeholder="CNI"
          value={form.numero_cni}
          onChange={(e) => updateField("numero_cni", e.target.value)}
          disabled={isLoading}
        />

        {/* Rôle - AFFICHAGE UI */}
        <select
          className={inputClass}
          value={form.role}
          onChange={(e) => updateField("role", e.target.value)}
          disabled={isLoading}
        >
          {ROLES_UI.map((role) => (
            <option key={role}>{role}</option>
          ))}
        </select>

        {/* Adresse */}
        <input
          className={`${inputClass} col-span-2`}
          placeholder="Adresse"
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
  // Convertir le rôle DB -> UI
  return ROLE_DISPLAY_MAPPING[role.toLowerCase()] || 
         role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState(""); // Format DB (snake_case)
  
  // États de chargement
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États des modales
  const [openAdd, setOpenAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [formError, setFormError] = useState(null);
  
  // États des toasts
  const [toasts, setToasts] = useState([]);

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

  /* ============= CHARGEMENT DES DONNÉES ============= */
  const loadUsers = useCallback(async (page = 1) => {
    try {
      setIsLoading(true);
      
      const params = { page };
      
      // Ajout de la recherche
      if (debouncedSearch?.trim()) {
        params.search = debouncedSearch.trim();
      }
      
      // Ajout du filtre rôle - DIRECTEMENT EN FORMAT DB
      if (selectedRole) {
        params.role = selectedRole; // Déjà en snake_case
      }

      console.log("📡 Chargement avec params:", params);
      
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
      
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      addToast("Impossible de charger les utilisateurs", "error");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, selectedRole, addToast]);

  /* ============= DEBOUNCE RECHERCHE ============= */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  /* ============= CHARGEMENT INITIAL ============= */
  useEffect(() => {
    loadUsers(1);
  }, [debouncedSearch, selectedRole]);

  /* ============= RÉINITIALISATION DES FILTRES ============= */
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedRole("");
    addToast("✅ Filtres réinitialisés");
  }, [addToast]);

  /* ============= GESTIONNAIRES D'ÉVÉNEMENTS ============= */
  const handlePageChange = useCallback((page) => {
    loadUsers(page);
  }, [loadUsers]);

  const handleCreateUser = useCallback(async (formData) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      await utilisateursAPI.create(formData);
      
      addToast("✅ Utilisateur créé avec succès. Mot de passe envoyé par email.");
      setOpenAdd(false);
      loadUsers(currentPage);
      
    } catch (error) {
      console.error("❌ Erreur création:", error);
      
      if (error.response?.status === 422 || error.response?.status === 409) {
        const errors = error.response.data?.errors;
        if (errors?.email) {
          setFormError("❌ Cet email est déjà utilisé. Veuillez en choisir un autre.");
        } else {
          setFormError("❌ Erreur de validation. Vérifiez les champs.");
        }
      } else {
        setFormError("❌ Erreur lors de la création de l'utilisateur");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [addToast, currentPage, loadUsers]);

  const handleUpdateUser = useCallback(async () => {
    if (!editTarget) return;
    
    try {
      setIsSubmitting(true);
      
      await utilisateursAPI.update(editTarget.id, {
        telephone: editTarget.telephone,
        adresse: editTarget.adresse,
        role: editTarget.role, // Déjà en format UI, l'API convertira
      });
      
      addToast("✅ Utilisateur modifié avec succès");
      setEditTarget(null);
      loadUsers(currentPage);
      
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
        loadUsers(currentPage - 1);
      } else {
        loadUsers(currentPage);
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

  /* ============= FORMATAGE DES DONNÉES ============= */
  const formattedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      fullName: `${user.prenom || ''} ${user.nom || ''}`.trim() || '-',
      formattedRole: formatRole(user.role), // Conversion DB -> UI
    }));
  }, [users]);

  /* ============= RENDU DES ACTIONS ============= */
  const renderActions = useCallback((user) => (
    <div className="flex items-center gap-2">
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
      render: (_, user) => user.formattedRole, // Déjà formaté
    },
    {
      label: "Statut",
      render: (_, user) => (
        <span className="flex items-center gap-1.5 text-xs">
          <Circle
            size={8}
            className={cls(
              "fill-current",
              user.is_online ? "text-green-600" : "text-gray-400"
            )}
          />
          {user.is_online ? "En ligne" : "Hors ligne"}
        </span>
      ),
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
        
        {/* ESPACEMENT EN-TÊTE - 32px en bas */}
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

        {/* ESPACEMENT RECHERCHE ET FILTRES - 32px en bas */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-md">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom, prénom, email ou rôle..."
                  className="w-full pl-9 pr-10 py-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-[#472EAD]/20 focus:border-[#472EAD] outline-none"
                  disabled={isLoading}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <RoleFilter
                selectedRole={selectedRole}
                onRoleChange={setSelectedRole}
                onReset={() => setSelectedRole("")}
              />
            </div>

            {/* FILTRES ACTIFS */}
            {(searchTerm || selectedRole) && (
              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs font-medium text-gray-500">Filtres actifs :</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {searchTerm && (
                    <span className="bg-indigo-50 text-[#472EAD] px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 font-medium">
                      <Search size={12} />
                      "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm("")}
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

        {/* ESPACEMENT BOUTON NOUVEL UTILISATEUR - 32px en bas */}
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

        {/* ESPACEMENT TABLEAU DES UTILISATEURS - 32px en bas */}
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
                  {searchTerm || selectedRole
                    ? "Aucun utilisateur ne correspond à vos critères"
                    : "Aucun utilisateur trouvé"}
                </p>
                {(searchTerm || selectedRole) && (
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

        {/* ESPACE SUPPLEMENTAIRE EN BAS */}
        <div className="h-4"></div>

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

        {/* Toasts */}
        <Toasts toasts={toasts} remove={removeToast} />
      </div>
    </div>
  );
}