import React, { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

const TicketCommande = forwardRef(({ commande }, ref) => {
  if (!commande) return null;

  const date = new Date(commande.date || Date.now());

  return (
    <>
      {/* ===== CSS IMPRESSION EMBARQUÉ ===== */}
      <style>
        {`
          @media print {
            body {
              background: white !important;
            }
            .ticket-print {
              box-shadow: none !important;
              margin: 0 !important;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        `}
      </style>

      {/* ===== TICKET ===== */}
      <div
        ref={ref}
        className="ticket-print w-[280px] bg-white text-black font-mono text-center px-4 py-3"
      >
        {/* EN-TÊTE */}
        <div className="mb-2">
          <h1 className="text-lg font-bold tracking-wide">LPD</h1>
          <p className="text-xs uppercase tracking-wider">
            Librairie Papeterie Daradji
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* DATE & VENDEUR */}
        <div className="text-[11px] text-gray-700 mb-2 space-y-1">
          <p>
            {date.toLocaleDateString('fr-FR')} —{' '}
            {date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p>
            Vendeur : {commande.vendeur?.nom_complet || '—'}
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* CLIENT */}
        <div className="mb-2">
          <p className="text-xs text-gray-600">Client</p>
          <p className="text-sm font-semibold">
            {commande.client.nom} {commande.client.prenom}
          </p>
        </div>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* QR CODE */}
        <div className="flex justify-center my-3">
          <QRCodeCanvas value={commande.numero_commande} size={150} />
        </div>

        <p className="text-[11px] tracking-widest break-all">
          {commande.numero_commande}
        </p>

        <div className="border-t border-dashed border-gray-400 my-2" />

        {/* MESSAGE */}
        <p className="text-xs mt-2">
          Merci • Confiance • Fidélité
        </p>
      </div>
    </>
  );
});

export default TicketCommande;
