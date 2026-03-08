import React, { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const TicketCommande = forwardRef(({ commande }, ref) => {
  if (!commande) return null;

  const date = new Date(commande.date || Date.now());

  return (
    <>
      <style>
        {`
          @media print {
            @page {
              size: 58mm auto;
              margin: 0;
            }

            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .ticket-print {
              width: 58mm !important;
              max-width: 58mm !important;
              margin: 0 auto !important;
              padding: 5mm !important;
              box-shadow: none !important;
            }

            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      <div
        ref={ref}
        className="ticket-print bg-white text-black font-mono text-center"
        style={{ width: "58mm" }}
      >
        <div className="mb-2">
          <h1 className="text-lg font-bold tracking-wide">LPD</h1>
          <p className="text-xs uppercase tracking-wider">
            Librairie Papeterie Daradji
          </p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="text-xs mb-2 space-y-1">
          <p>
            {date.toLocaleDateString('fr-FR')} —{" "}
            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p>Vendeur : {commande.vendeur?.nom_complet || '—'}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="mb-2">
          <p className="text-xs">Client</p>
          <p className="text-sm font-bold">
            {commande.client.nom} {commande.client.prenom}
          </p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <div className="flex justify-center my-3">
          <QRCodeCanvas
            value={commande.numero_commande}
            size={120}
          />
        </div>

        <p className="text-xs break-all">
          {commande.numero_commande}
        </p>

        <div className="border-t border-dashed border-black my-2" />

        <p className="text-xs mt-2">
          Merci • Confiance • Fidélité
        </p>
      </div>
    </>
  );
});

export default TicketCommande;