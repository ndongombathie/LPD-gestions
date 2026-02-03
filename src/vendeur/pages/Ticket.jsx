import React, { forwardRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandshake } from "@fortawesome/free-solid-svg-icons";

/* ================= Utils ================= */
const getDisplayName = (user) => {
  if (!user) return "Utilisateur";

  if (user.prenom && user.nom) {
    return `${user.prenom} ${user.nom}`;
  }

  if (user.name) {
    return user.name;
  }

  if (user.email) {
    return user.email.split("@")[0];
  }

  return "Utilisateur";
};

const Ticket = forwardRef(({ commande, vendeur }, ref) => {
  if (!commande) return null;

  // ✅ QR Code avec TOUTES les informations (invisibles sur le ticket)
  const qrData = JSON.stringify({
    // === INFORMATIONS COMMANDE ===
    id: commande.id,
    numero_commande: commande.numero_commande,
    date: commande.date || commande.date_creation,
    statut: commande.statut || "en_attente_paiement",
    
    // === INFORMATIONS CLIENT ===
    client: {
      id: commande.client?.id,
      nom: commande.client?.nom || "Non spécifié",
      telephone: commande.client?.telephone || "",
      adresse: commande.client?.adresse || ""
    },
    
    // === INFORMATIONS FINANCIÈRES ===
    totaux: {
      total_ht: commande.total_ht || 0,
      tva: commande.tva || 0,
      total_ttc: commande.total_ttc || 0,
      tva_appliquee: commande.tva_appliquee !== false
    },
    
    // === PRODUITS COMMANDÉS ===
    produits: commande.produits?.map(p => ({
      id: p.id,
      nom: p.nom,
      reference: p.reference,
      quantite: p.quantite || 0,
      type_vente: p.type_vente,
      prix_unitaire: p.prix_vente || p.prix_unitaire || 0,
      sous_total: (p.prix_vente || p.prix_unitaire || 0) * (p.quantite || 0)
    })) || [],
    
    // === INFORMATIONS VENDEUR ===
    vendeur: {
      id: vendeur?.id,
      nom: getDisplayName(vendeur),
      role: vendeur?.role
    },
    
    // === MÉTADONNÉES ===
    metadata: {
      timestamp: Date.now(),
      source: "LPD_TICKET",
      version: "1.0"
    },
    
    // === SÉCURITÉ ===
    signature: btoa(`${commande.id}_${commande.total_ttc}_${Date.now()}`).substring(0, 32)
  });

  return (
    <div
      ref={ref}
      className="w-[280px] p-3 text-xs font-mono text-black bg-white"
    >
      {/* EN-TÊTE MINIMALISTE */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-sm">LPD</h2>
        <p className="text-[10px]">Librairie Papeterie Daradji</p>
        <p className="text-[9px] mt-1">Ticket de commande</p>
      </div>

      <hr className="my-2" />

      {/* QR CODE (contient TOUTES les infos) */}
      <div className="flex justify-center mt-2 mb-2">
        <QRCodeCanvas
          value={qrData}
          size={150} // Plus grand pour contenir plus d'infos
          level="H" // Niveau de correction d'erreur élevé
          includeMargin={true}
          className="border border-gray-300 p-1"
        />
      </div>

      {/* MESSAGE INFORMATIF */}
      <div className="text-center mt-2">
        <p className="text-[10px] font-semibold">
          #{commande.numero_commande}
        </p>
        <p className="text-[9px] text-gray-600 mt-1">
          Scanner pour voir les détails
        </p>
        <p className="text-[9px] text-gray-600">
          {new Date().toLocaleDateString('fr-FR')}
        </p>
      </div>

      {/* MESSAGE DE CONFIRMATION */}
      <div className="text-center mt-3 pt-2 border-t">
        <p className="text-[10px] flex justify-center items-center gap-1">
          <FontAwesomeIcon icon={faHandshake} />
          <span>Commande confirmée</span>
        </p>
        <p className="text-[8px] text-gray-500 mt-1">
          QR Code contenant toutes les informations
        </p>
      </div>
    </div>
  );
});

export default Ticket;