import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

/**
 * Composant pour l'impression de facture
 * À utiliser avec window.print() pour l'impression
 */
const InvoicePrint = ({ ticket }) => {
  if (!ticket) return null;

  return (
    <div className="bg-white p-8 max-w-4xl mx-auto print:mx-0 print:p-4" style={{ display: 'none' }} id="invoice-print">
      <div className="print:block">
        {/* En-tête de la facture */}
        <div className="border-b-2 border-primary-600 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-primary-600 mb-2">LPD GESTIONS</h1>
              <p className="text-gray-600 text-sm">Boutique: [Nom de la boutique]</p>
              <p className="text-gray-600 text-sm">Adresse: [Adresse de la boutique]</p>
              <p className="text-gray-600 text-sm">Téléphone: [Téléphone]</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-gray-900">FACTURE</p>
              <p className="text-sm text-gray-600 mt-2">N° {ticket.numero}</p>
              <p className="text-sm text-gray-600">{formatDateTime(ticket.date_ticket)}</p>
            </div>
          </div>
        </div>

        {/* Informations client */}
        {ticket.client_nom && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">CLIENT</h3>
            <p className="text-sm text-gray-600">{ticket.client_nom}</p>
          </div>
        )}

        {/* Détails des produits */}
        <div className="mb-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                  Produit
                </th>
                <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900">
                  Qté
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">
                  Prix unitaire
                </th>
                <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {ticket.lignes?.map((ligne, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                    {ligne.produit || ligne.nom_produit}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center text-sm text-gray-900">
                    {ligne.quantite}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm text-gray-900">
                    {formatCurrency(ligne.prix || ligne.prix_unitaire)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold text-gray-900">
                    {formatCurrency((ligne.prix || ligne.prix_unitaire) * ligne.quantite)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totaux */}
        <div className="flex justify-end mb-6">
          <div className="w-80">
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">Total HT:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(ticket.total_ht)}</span>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <span className="text-gray-600">TVA (18%):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(ticket.tva)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-gray-300 text-lg font-bold">
              <span className="text-gray-900">Total TTC:</span>
              <span className="text-primary-600">{formatCurrency(ticket.total_ttc)}</span>
            </div>
          </div>
        </div>

        {/* Informations de paiement */}
        <div className="mb-6">
          <p className="text-sm text-gray-600">
            <span className="font-semibold">Moyen de paiement:</span>{' '}
            {ticket.moyen_paiement === 'especes' ? 'Espèces' :
             ticket.moyen_paiement === 'carte' ? 'Carte bancaire' :
             ticket.moyen_paiement === 'wave' ? 'Wave' :
             ticket.moyen_paiement === 'om' ? 'Orange Money' :
             ticket.moyen_paiement === 'cheque' ? 'Chèque' : 'Autre'}
          </p>
          {ticket.montant_paye && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Montant payé:</span> {formatCurrency(ticket.montant_paye)}
            </p>
          )}
        </div>

        {/* Pied de page */}
        <div className="border-t border-gray-300 pt-4 text-center text-xs text-gray-500">
          <p>Merci de votre visite !</p>
          <p className="mt-2">Facture générée le {formatDateTime(new Date().toISOString())}</p>
          <p>Vendeur: {ticket.vendeur_nom}</p>
        </div>
      </div>
    </div>
  );
};

/**
 * Fonction utilitaire pour imprimer une facture
 */
export const printInvoice = (ticket) => {
  // Créer un élément temporaire pour l'impression
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres popup pour imprimer la facture');
    return;
  }

  const invoiceHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Facture ${ticket.numero}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            color: #111827;
          }
          .header {
            border-bottom: 2px solid #472EAD;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #472EAD;
            font-size: 28px;
            margin-bottom: 10px;
          }
          .header-info {
            display: flex;
            justify-content: space-between;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
          }
          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }
          .totals {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
          }
          .totals-table {
            width: 320px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-final {
            border-top: 2px solid #d1d5db;
            padding-top: 12px;
            font-size: 18px;
            font-weight: bold;
          }
          .footer {
            border-top: 1px solid #d1d5db;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body {
              padding: 20px;
            }
            @page {
              margin: 1cm;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-info">
            <div>
              <h1>LPD GESTIONS</h1>
              <p>Boutique: [Nom de la boutique]</p>
              <p>Adresse: [Adresse]</p>
              <p>Téléphone: [Téléphone]</p>
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; margin-bottom: 10px;">FACTURE</h2>
              <p>N° ${ticket.numero}</p>
              <p>${formatDateTime(ticket.date_ticket)}</p>
            </div>
          </div>
        </div>

        ${ticket.client_nom ? `
        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">CLIENT</h3>
          <p>${ticket.client_nom}</p>
        </div>
        ` : ''}

        <table>
          <thead>
            <tr>
              <th>Produit</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Prix unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${ticket.lignes?.map(ligne => `
              <tr>
                <td>${ligne.produit || ligne.nom_produit}</td>
                <td style="text-align: center;">${ligne.quantite}</td>
                <td style="text-align: right;">${formatCurrency(ligne.prix || ligne.prix_unitaire)}</td>
                <td style="text-align: right; font-weight: bold;">${formatCurrency((ligne.prix || ligne.prix_unitaire) * ligne.quantite)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div class="totals-table">
            <div class="totals-row">
              <span>Total HT:</span>
              <span style="font-weight: bold;">${formatCurrency(ticket.total_ht)}</span>
            </div>
            <div class="totals-row">
              <span>TVA (18%):</span>
              <span style="font-weight: bold;">${formatCurrency(ticket.tva)}</span>
            </div>
            <div class="totals-row total-final">
              <span>Total TTC:</span>
              <span style="color: #472EAD;">${formatCurrency(ticket.total_ttc)}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <p style="font-size: 14px;">
            <strong>Moyen de paiement:</strong> ${
              ticket.moyen_paiement === 'especes' ? 'Espèces' :
              ticket.moyen_paiement === 'carte' ? 'Carte bancaire' :
              ticket.moyen_paiement === 'wave' ? 'Wave' :
              ticket.moyen_paiement === 'om' ? 'Orange Money' :
              ticket.moyen_paiement === 'cheque' ? 'Chèque' : 'Autre'
            }
          </p>
          ${ticket.montant_paye ? `
          <p style="font-size: 14px;">
            <strong>Montant payé:</strong> ${formatCurrency(ticket.montant_paye)}
          </p>
          ` : ''}
        </div>

        <div class="footer">
          <p>Merci de votre visite !</p>
          <p style="margin-top: 10px;">Facture générée le ${formatDateTime(new Date().toISOString())}</p>
          <p>Vendeur: ${ticket.vendeur_nom}</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(invoiceHTML);
  printWindow.document.close();
  printWindow.focus();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export default InvoicePrint;

