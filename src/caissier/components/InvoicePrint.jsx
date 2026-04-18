import React from 'react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

/** Espèces : libellé API `especes` ou variantes */
const isPaiementEspeces = (m) =>
  m === 'especes' ||
  m === 'Espèces' ||
  String(m || '')
    .toLowerCase()
    .replace(/\s/g, '') === 'especes';

/** Montant encaissé sur cette opération (tranche ou total), pas confondre avec le TTC commande */
const montantEncaisseFacture = (t) => {
  const m = Number(t?.montant_paye);
  if (Number.isFinite(m) && m >= 0) return m;
  return Number(t?.total_ttc || 0);
};

const afficherTotalCommandeTTC = (t) => {
  const tt = Number(t?.total_ttc || 0);
  const me = montantEncaisseFacture(t);
  return tt > 0 && Math.abs(me - tt) > 0.01;
};

/** Évite les injections dans le document d’impression (noms produits, etc.) */
const escHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Styles ticket thermique (ex. Epson TM-T20X, rouleau 80 mm).
 * Largeur contenu ~72 mm. Rouleau 58 mm : classes body `receipt receipt-58` (voir printInvoice).
 */
const THERMAL_RECEIPT_STYLES = `
  @page {
    size: 80mm auto;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :root {
    --receipt-width: 72mm;
  }
  body.receipt {
    margin: 0 auto;
    padding: 2mm 3mm 4mm;
    width: var(--receipt-width);
    max-width: var(--receipt-width);
    font-family: ui-monospace, 'Cascadia Code', 'Segoe UI', system-ui, sans-serif;
    font-size: 10.5px;
    line-height: 1.35;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .receipt-brand {
    text-align: center;
    font-weight: 700;
    font-size: 13px;
    letter-spacing: 0.04em;
    margin-bottom: 4px;
  }
  .receipt-shop {
    font-size: 9.5px;
    text-align: center;
  }
  .receipt-shop p {
    margin: 2px 0;
  }
  .receipt-rule {
    border: none;
    border-top: 1px dashed #000;
    margin: 6px 0;
  }
  .receipt-title {
    text-align: center;
    font-weight: 700;
    font-size: 11px;
    margin: 4px 0 2px;
  }
  .receipt-meta {
    font-size: 9.5px;
    margin-bottom: 6px;
    text-align: center;
  }
  .receipt-meta span {
    display: block;
    margin: 1px 0;
  }
  .receipt-block {
    margin-bottom: 6px;
    font-size: 9.5px;
  }
  .receipt-block strong {
    display: block;
    font-size: 9px;
    margin-bottom: 2px;
  }
  table.receipt-lines {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 6px;
    font-size: 9px;
  }
  table.receipt-lines th,
  table.receipt-lines td {
    padding: 3px 1px;
    vertical-align: top;
    border-bottom: 1px solid #bbb;
    word-break: break-word;
  }
  table.receipt-lines th {
    font-weight: 700;
    border-bottom: 1px solid #000;
    text-align: left;
  }
  table.receipt-lines th:nth-child(2),
  table.receipt-lines td:nth-child(2) {
    text-align: center;
    width: 8%;
    white-space: nowrap;
  }
  table.receipt-lines th:nth-child(3),
  table.receipt-lines td:nth-child(3),
  table.receipt-lines th:nth-child(4),
  table.receipt-lines td:nth-child(4) {
    text-align: right;
    white-space: nowrap;
    width: 22%;
  }
  table.receipt-lines td:first-child {
    max-width: 38mm;
  }
  .receipt-totals {
    margin-top: 4px;
    margin-bottom: 6px;
    font-size: 10px;
  }
  .receipt-totals .row {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    padding: 3px 0;
  }
  .receipt-totals .row-strong {
    font-weight: 700;
    font-size: 12px;
    border-top: 2px solid #000;
    margin-top: 4px;
    padding-top: 6px;
  }
  .receipt-pay {
    font-size: 9.5px;
    margin-bottom: 6px;
  }
  .receipt-pay p {
    margin: 3px 0;
  }
  .receipt-footer {
    text-align: center;
    font-size: 8.5px;
    border-top: 1px dashed #000;
    padding-top: 6px;
    margin-top: 4px;
  }
  .receipt-footer p {
    margin: 2px 0;
  }
  @media print {
    body.receipt {
      padding: 1mm 2mm 3mm;
    }
  }
  /* Rouleau 58 mm : sur <body> utiliser class="receipt receipt-58" (largeur utile ~52 mm) */
  body.receipt.receipt-58 {
    --receipt-width: 52mm;
  }
`;

/**
 * Composant pour l'impression de facture
 * À utiliser avec window.print() pour l'impression
 */
const getBoutiqueHeaderComponent = (boutique) => {
  if (boutique && (boutique.nom || boutique.adresse)) {
    return {
      nom: boutique.nom || 'LPD',
      adresse: boutique.adresse || 'Colobane',
      telephone: boutique.telephone || '',
    };
  }
  return { nom: 'LPD', adresse: 'Colobane', telephone: '' };
};

const libelleMoyenPaiement = (m) =>
  m === 'especes'
    ? 'Espèces'
    : m === 'carte'
      ? 'Carte bancaire'
      : m === 'wave'
        ? 'Wave'
        : m === 'om'
          ? 'Orange Money'
          : m === 'cheque'
            ? 'Chèque'
            : 'Autre';

const InvoicePrint = ({ ticket, boutique = null, caissierNom = '' }) => {
  if (!ticket) return null;
  const header = getBoutiqueHeaderComponent(boutique);

  return (
    <div
      className="hidden print:block bg-white text-black print:max-w-[72mm] print:mx-auto print:px-2 print:py-1 print:text-[10px] print:leading-snug"
      id="invoice-print"
    >
      <div className="text-center font-bold text-sm tracking-wide print:mb-1">LPD GESTIONS</div>
      <div className="text-center text-[9px] text-neutral-700 print:mb-2">
        <p>{header.nom}</p>
        <p>{header.adresse}</p>
        {header.telephone ? <p>{header.telephone}</p> : null}
      </div>
      <hr className="border-dashed border-neutral-800 print:my-1" />
      <p className="text-center font-bold text-[11px] print:my-0.5">FACTURE</p>
      <p className="text-center text-[9px] print:mb-2">
        <span className="block">N° {ticket.numero}</span>
        <span className="block">{formatDateTime(ticket.date_ticket)}</span>
      </p>
      {ticket.client_nom ? (
        <div className="print:mb-2 text-[9px]">
          <span className="font-semibold">Client</span>
          <p>{ticket.client_nom}</p>
        </div>
      ) : null}
      <table className="w-full border-collapse text-[9px] print:mb-2">
        <thead>
          <tr className="border-b border-black">
            <th className="py-0.5 text-left font-semibold">Article</th>
            <th className="py-0.5 text-center font-semibold w-6">Qt</th>
            <th className="py-0.5 text-right font-semibold">P.U.</th>
            <th className="py-0.5 text-right font-semibold">TTC</th>
          </tr>
        </thead>
        <tbody>
          {ticket.lignes?.map((ligne, index) => (
            <tr key={index} className="border-b border-neutral-300">
              <td className="py-0.5 break-words">{ligne.produit || ligne.nom_produit}</td>
              <td className="py-0.5 text-center">{ligne.quantite}</td>
              <td className="py-0.5 text-right whitespace-nowrap">
                {formatCurrency(ligne.prix || ligne.prix_unitaire)}
              </td>
              <td className="py-0.5 text-right font-medium whitespace-nowrap">
                {formatCurrency((ligne.prix || ligne.prix_unitaire) * ligne.quantite)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-[10px] print:mb-2">
        <div className="flex justify-between border-t-2 border-black pt-1 font-bold text-[11px]">
          <span>Montant encaissé</span>
          <span>{formatCurrency(montantEncaisseFacture(ticket))}</span>
        </div>
        {afficherTotalCommandeTTC(ticket) ? (
          <div className="flex justify-between text-neutral-600 text-[9px] mt-0.5">
            <span>Total commande TTC</span>
            <span className="font-semibold">{formatCurrency(ticket.total_ttc)}</span>
          </div>
        ) : null}
      </div>
      <div className="text-[9px] print:mb-2 space-y-0.5">
        <p>
          <span className="font-semibold">Paiement :</span> {libelleMoyenPaiement(ticket.moyen_paiement)}
        </p>
        {isPaiementEspeces(ticket.moyen_paiement) ? (
          <>
            <p>
              <span className="font-semibold">Reçu :</span>{' '}
              {formatCurrency(ticket.monnaie_recue ?? ticket.montant_paye ?? 0)}
            </p>
            <p>
              <span className="font-semibold">Rendu :</span> {formatCurrency(ticket.monnaie_rendue ?? 0)}
            </p>
          </>
        ) : null}
        {!isPaiementEspeces(ticket.moyen_paiement) && ticket.montant_paye ? (
          <p>
            <span className="font-semibold">Montant payé :</span> {formatCurrency(ticket.montant_paye)}
          </p>
        ) : null}
      </div>
      <div className="border-t border-dashed border-neutral-800 text-center text-[8px] text-neutral-600 print:pt-1">
        <p>Merci de votre visite</p>
        <p>{formatDateTime(new Date().toISOString())}</p>
        <p>Vendeur : {ticket.vendeur_nom}</p>
        {caissierNom ? <p>Caissier : {caissierNom}</p> : null}
      </div>
    </div>
  );
};

/** Libellés d’en-tête pour l’impression (données réelles ou par défaut) */
const getBoutiqueHeader = (boutique) => {
  if (boutique && (boutique.nom || boutique.adresse)) {
    return {
      nom: boutique.nom || 'LPD',
      adresse: boutique.adresse || 'Colobane',
      telephone: boutique.telephone || '',
    };
  }
  return { nom: 'LPD', adresse: 'Colobane', telephone: '' };
};

const getCaissierNom = () => {
  try {
    const raw = sessionStorage.getItem('user') || sessionStorage.getItem('lpd_current_user');
    if (!raw) return '';
    const user = JSON.parse(raw);
    return [user.prenom, user.nom].filter(Boolean).join(' ').trim() || user.name || '';
  } catch (_e) {
    return '';
  }
};

/**
 * Imprime une facture (données réelles du ticket).
 * @param {Object} ticket - Données du ticket
 * @param {Object} [boutique] - Optionnel: { nom, adresse, telephone }
 * @param {string} [caissierNom] - Optionnel: nom du caissier (sinon lu depuis sessionStorage)
 */
export const printInvoice = (ticket, boutique = null, caissierNom = null) => {
  const header = getBoutiqueHeader(boutique);
  const caissier = (caissierNom != null && caissierNom !== '') ? caissierNom : getCaissierNom();
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres popup pour imprimer la facture');
    return;
  }

  const lignesHtml = (ticket.lignes || [])
    .map(
      (ligne) => `
            <tr>
              <td>${escHtml(ligne.produit || ligne.nom_produit)}</td>
              <td style="text-align:center">${escHtml(String(ligne.quantite ?? ''))}</td>
              <td style="text-align:right">${formatCurrency(ligne.prix || ligne.prix_unitaire)}</td>
              <td style="text-align:right;font-weight:600">${formatCurrency((ligne.prix || ligne.prix_unitaire) * ligne.quantite)}</td>
            </tr>`
    )
    .join('');

  const invoiceHTML = `
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Facture ${escHtml(ticket.numero)}</title>
        <style>${THERMAL_RECEIPT_STYLES}</style>
      </head>
      <body class="receipt">
        <div class="receipt-brand">LPD GESTIONS</div>
        <div class="receipt-shop">
          <p>${escHtml(header.nom)}</p>
          <p>${escHtml(header.adresse)}</p>
          ${header.telephone ? `<p>${escHtml(header.telephone)}</p>` : ''}
        </div>
        <hr class="receipt-rule" />
        <div class="receipt-title">FACTURE</div>
        <div class="receipt-meta">
          <span>N° ${escHtml(ticket.numero)}</span>
          <span>${escHtml(formatDateTime(ticket.date_ticket))}</span>
        </div>

        ${
          ticket.client_nom
            ? `<div class="receipt-block"><strong>CLIENT</strong><p>${escHtml(ticket.client_nom)}</p></div>`
            : ''
        }

        <table class="receipt-lines">
          <thead>
            <tr>
              <th>Article</th>
              <th>Qt</th>
              <th>P.U.</th>
              <th>TTC</th>
            </tr>
          </thead>
          <tbody>${lignesHtml}</tbody>
        </table>

        <div class="receipt-totals">
          <div class="row row-strong">
            <span>Montant encaissé</span>
            <span>${formatCurrency(montantEncaisseFacture(ticket))}</span>
          </div>
          ${
            afficherTotalCommandeTTC(ticket)
              ? `<div class="row" style="font-size:9px;color:#333;margin-top:2px">
            <span>Total commande TTC</span>
            <span style="font-weight:600">${formatCurrency(ticket.total_ttc)}</span>
          </div>`
              : ''
          }
        </div>

        <div class="receipt-pay">
          <p><strong>Paiement :</strong> ${escHtml(libelleMoyenPaiement(ticket.moyen_paiement))}</p>
          ${
            isPaiementEspeces(ticket.moyen_paiement)
              ? `<p><strong>Reçu :</strong> ${formatCurrency(ticket.monnaie_recue ?? ticket.montant_paye ?? 0)}</p>
            <p><strong>Rendu :</strong> ${formatCurrency(ticket.monnaie_rendue ?? 0)}</p>`
              : ticket.montant_paye
                ? `<p><strong>Montant payé :</strong> ${formatCurrency(ticket.montant_paye)}</p>`
                : ''
          }
        </div>

        <div class="receipt-footer">
          <p>Merci de votre visite</p>
          <p>${escHtml(formatDateTime(new Date().toISOString()))}</p>
          <p>Vendeur : ${escHtml(ticket.vendeur_nom)}</p>
          ${caissier ? `<p>Caissier : ${escHtml(caissier)}</p>` : ''}
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

