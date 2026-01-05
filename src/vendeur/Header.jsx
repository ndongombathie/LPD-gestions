import React, { useState, useEffect, useRef } from "react";
import {
  User,
  ChevronDown,
  LogOut,
  Key,
  X,
  Save,
  Store,
  Calendar,
  Banknote,
  Eye,
  EyeOff,
  Camera,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { authAPI } from "../utils/api";



// ================= Utils =================
const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

// ================= Toast System =================
function Toast({ toasts, removeToast }) {
  return (
    <div className="fixed top-4 right-4 z-[999] space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-md border ${
            t.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {t.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 mt-0.5" />
          )}
          <div>
            <div className="font-semibold text-sm">{t.title}</div>
            {t.message && <div className="text-xs opacity-90 mt-0.5">{t.message}</div>}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="ml-3 text-gray-500 hover:text-gray-800"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ================= Password Modal =================
function PasswordModal({ open, onClose, onSuccess, addToast }) {
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!oldPwd || !newPwd || !confirmPwd) {
      addToast("error", "Erreur", "Veuillez remplir tous les champs");
      return;
    }
    if (newPwd !== confirmPwd) {
      addToast("error", "Erreur", "Les mots de passe ne correspondent pas");
      return;
    }
    if (newPwd.length < 6) {
      addToast("error", "Erreur", "Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.changePassword(oldPwd, newPwd, confirmPwd);
      addToast("success", "Succès", "Mot de passe modifié avec succès");
      onSuccess();
      onClose();
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (error) {
      console.error("Erreur changement mot de passe:", error);
      addToast("error", "Erreur", error.response?.data?.message || "Erreur lors du changement de mot de passe");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[95%] sm:w-[420px] rounded-2xl shadow-2xl p-5">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
            <Key className="w-5 h-5" /> Changer le mot de passe
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600">Ancien mot de passe</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={oldPwd}
                onChange={(e) => setOldPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">Confirmer le mot de passe</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 mt-1 pr-10"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2"
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-white rounded-lg bg-indigo-600 disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Confirmer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ================= Profile Modal =================
function ProfileModal({ open, onClose, user, onUpdate, addToast }) {
  const [preview, setPreview] = useState(user?.photo || null);
  const [prenom, setPrenom] = useState(user?.prenom || "");
  const [nom, setNom] = useState(user?.nom || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telephone, setTelephone] = useState(user?.telephone || "");
  const [adresse, setAdresse] = useState(user?.adresse || "");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && user) {
      setPrenom(user.prenom || user.name?.split(' ')[0] || "");
      setNom(user.nom || user.name?.split(' ').slice(1).join(' ') || "");
      setEmail(user.email || "");
      setTelephone(user.telephone || "");
      setAdresse(user.adresse || "");
      setPreview(user.photo || null);
    }
  }, [open, user]);

  if (!open) return null;

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!prenom || !nom || !email) {
      addToast("error", "Erreur", "Veuillez remplir les champs obligatoires");
      return;
    }

    setLoading(true);
    try {
      const updatedUser = {
        ...user,
        prenom,
        nom,
        name: `${prenom} ${nom}`.trim(),
        email,
        telephone,
        adresse,
        photo: preview,
      };

      // TODO: Appel API pour mettre à jour le profil sur le serveur
      // const result = await updateUserAPI(updatedUser);

      // Sauvegarder dans localStorage (format API)
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const apiUser = JSON.parse(userStr);
        const updatedApiUser = {
          ...apiUser,
          prenom,
          nom,
          email,
          telephone,
          adresse,
          photo: preview,
        };
        localStorage.setItem('user', JSON.stringify(updatedApiUser));
      }

      onUpdate(updatedUser);
      addToast("success", "Succès", "Profil mis à jour avec succès");
      onClose();
    } catch (error) {
      console.error("Erreur mise à jour profil:", error);
      addToast("error", "Erreur", "Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center">
      <div className="bg-white w-[95%] sm:w-[500px] rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b pb-2 mb-4">
          <h2 className="text-lg font-semibold text-indigo-700 flex items-center gap-2">
            <User className="w-5 h-5" /> Mon Profil
          </h2>
          <button onClick={onClose}>
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Photo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-600 text-white flex items-center justify-center text-2xl font-semibold overflow-hidden">
                {preview ? (
                  <img src={preview} alt="profil" className="w-full h-full object-cover" />
                ) : (
                  getInitials(`${prenom} ${nom}`)
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-2 cursor-pointer">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
          </div>

          {/* Prénom */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Prénom</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Nom</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Téléphone</label>
            <input
              type="tel"
              className="w-full border rounded-lg px-3 py-2 mt-1"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
            />
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Adresse</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 mt-1"
              rows="2"
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
            />
          </div>

          {/* Boutique (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-600">Boutique</label>
            <input
              type="text"
              className="w-full border rounded-lg px-3 py-2 mt-1 bg-gray-50"
              value={user?.store || "Boutique"}
              disabled
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 border rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-white rounded-lg bg-indigo-600 flex items-center gap-2 disabled:opacity-50"
            >
              <Save size={14} />
              {loading ? "Chargement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= Header =================
const Header = ({
  onLogout,
  user,
  commandes,
  onUpdateUser,
}) => {
  const [ventesDuJour, setVentesDuJour] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const menuRef = useRef(null);

  // ===== Calcul ventes =====
  useEffect(() => {
    const today = new Date().toDateString();
    const total = (commandes || [])
      .filter(
        (c) =>
          new Date(c.created_at).toDateString() === today &&
          c.statut === "complétée"
      )
      .reduce((sum, c) => sum + (c.total_ttc || 0), 0);

    setVentesDuJour(total);
  }, [commandes]);

  const formatMoney = (v) =>
    new Intl.NumberFormat("fr-FR").format(v) + " FCFA";

  // ===== Toast System =====
  const addToast = (type, title, message) => {
    const id = Date.now();
    const toast = { id, type, title, message };
    setToasts((prev) => [...prev, toast]);
    setTimeout(() => removeToast(id), 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ===== Click outside =====
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="h-[5px] bg-gradient-to-r from-indigo-600 to-orange-400" />

        <div className="max-w-7xl mx-auto h-16 px-4 flex items-center justify-between">
          {/* ===== LEFT ===== */}
          <div>
            <h1 className="text-lg font-bold text-indigo-700 flex items-center gap-2">
              <Store size={18} />
              Librairie Papeterie Daradji
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Calendar size={12} />
              {new Date().toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          {/* ===== RIGHT ===== */}
          <div className="flex items-center gap-4">
            {/* Ventes */}
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs text-gray-500 flex items-center gap-1 justify-end">
                <Banknote size={12} /> Ventes du jour
              </span>
              <span className="font-semibold text-green-600">
                {formatMoney(ventesDuJour)}
              </span>
            </div>

            {/* User */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt=""
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getInitials(user?.name || "U")
                  )}
                </div>

                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold">
                    {user?.name || "Utilisateur"}
                  </span>
                  <span className="text-[10px] text-gray-500">
                    {user?.role || "Vendeur"}
                  </span>
                </div>

                <ChevronDown size={14} />
              </button>

              {/* ===== Dropdown ===== */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg p-2">
                  <div className="px-3 py-2 border-b">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                    <p className="text-xs text-gray-400">
                      {user?.store || "Boutique Principale"}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                  >
                    <User size={14} />
                    Voir le profil
                  </button>

                  <button
                    onClick={() => {
                      setPasswordModalOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 rounded-md"
                  >
                    <Key size={14} />
                    Modifier le mot de passe
                  </button>

                  <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-orange-600 hover:bg-orange-50 rounded-md"
                  >
                    <LogOut size={14} />
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ===== MODALES ===== */}
      <ProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        user={user}
        onUpdate={onUpdateUser}
        addToast={addToast}
      />

      <PasswordModal
        open={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSuccess={() => addToast("success", "Succès", "Mot de passe modifié")}
        addToast={addToast}
      />

      {/* ===== TOAST SYSTEM ===== */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default Header;
