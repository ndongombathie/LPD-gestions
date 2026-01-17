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

  // ⚠️ QR léger (meilleur scan + impression)
  const qrData = JSON.stringify({
    numero_commande: commande.numero_commande,
    total_ttc: commande.total_ttc,
    date: commande.date,
  });

  return (
    /* ✅ ref DOIT être sur le conteneur principal */
    <div
      ref={ref}
      className="w-[280px] p-3 text-xs font-mono text-black bg-white"
    >
      {/* EN-TÊTE */}
      <div className="text-center mb-2">
        <h2 className="font-bold text-sm">LPD</h2>
        <p>Librairie Papeterie Daradji</p>

        {/* ✅ utilisateur connecté */}
        <p className="mt-1">
          Vendeur : {getDisplayName(vendeur)}
        </p>

        <p className="text-[10px]">
          {new Date(commande.date).toLocaleString("fr-FR")}
        </p>

        <p className="font-bold mt-1">
          Ticket #{commande.numero_commande}
        </p>
      </div>

      <hr className="my-2" />

      {/* QR CODE */}
      <div className="flex justify-center mt-2">
        <QRCodeCanvas
          value={qrData}
          size={120}
          level="M"
          includeMargin
        />
      </div>

      {/* MESSAGE */}
      <p className="text-center mt-2 text-[10px] flex justify-center items-center gap-1">
        <FontAwesomeIcon icon={faHandshake} />
        <span>Merci pour votre confiance</span>
      </p>
    </div>
  );
});

export default Ticket;
