import { formatCurrency, formatDateTime } from '../../utils/formatters';

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

/**
 * Fonction utilitaire pour imprimer un décaissement (données réelles).
 * @param {Object} decaissement - Données du décaissement (id, montant, statut, motif, cree_par, fait_par, fait_le, created_at)
 * @param {Object} [boutique] - Optionnel: { nom, adresse, telephone } pour l'en-tête
 */
export const printDecaissement = (decaissement, boutique = null) => {
  const header = getBoutiqueHeader(boutique);
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Veuillez autoriser les fenêtres popup pour imprimer le décaissement');
    return;
  }

  const decaissementHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Décaissement ${decaissement.id}</title>
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
          .info-section {
            margin-bottom: 30px;
          }
          .info-section h3 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .info-label {
            font-weight: 600;
            color: #6b7280;
          }
          .info-value {
            color: #111827;
            font-weight: 500;
          }
          .montant {
            font-size: 24px;
            font-weight: bold;
            color: #dc2626;
            text-align: right;
          }
          .statut {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .statut-valide {
            background-color: #d1fae5;
            color: #065f46;
          }
          .statut-attente {
            background-color: #fed7aa;
            color: #92400e;
          }
          .motif-box {
            background-color: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
            color: #374151;
          }
          .traceability {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
          }
          .traceability h3 {
            color: #472EAD;
            margin-bottom: 15px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #d1d5db;
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
              <p>Boutique: ${header.nom}</p>
              <p>Adresse: ${header.adresse}</p>
              ${header.telephone ? `<p>Téléphone: ${header.telephone}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <h2 style="font-size: 20px; margin-bottom: 10px;">DÉCAISSEMENT</h2>
              <p>N° ${decaissement.id}</p>
              <p>${formatDateTime(decaissement.created_at)}</p>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>Informations générales</h3>
          <div class="info-row">
            <span class="info-label">Montant:</span>
            <span class="montant">${formatCurrency(decaissement.montant)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Statut:</span>
            <span class="statut ${decaissement.statut === 'valide' || decaissement.statut === 'validé' ? 'statut-valide' : 'statut-attente'}">
              ${decaissement.statut === 'valide' || decaissement.statut === 'validé' ? 'Validé' : 'En attente'}
            </span>
          </div>
        </div>

        <div class="info-section">
          <h3>Motif du décaissement</h3>
          <div class="motif-box">
            ${decaissement.motif}
          </div>
        </div>

        <div class="info-section">
          <h3>Création</h3>
          <div class="info-row">
            <span class="info-label">Créé par:</span>
            <span class="info-value">${decaissement.cree_par || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date de création:</span>
            <span class="info-value">${formatDateTime(decaissement.created_at)}</span>
          </div>
        </div>

        ${decaissement.statut === 'valide' || decaissement.statut === 'validé' ? `
        <div class="traceability">
          <h3>Traçabilité - Validation</h3>
          <div class="info-row">
            <span class="info-label">Validé par:</span>
            <span class="info-value" style="font-weight: bold; color: #472EAD;">${decaissement.fait_par || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Date et heure de validation:</span>
            <span class="info-value">${decaissement.fait_le ? formatDateTime(decaissement.fait_le) : 'N/A'}</span>
          </div>
        </div>
        ` : ''}

        <div class="footer">
          <p>Document généré le ${formatDateTime(new Date().toISOString())}</p>
          <p style="margin-top: 5px;">LPD Gestions - Système de gestion de caisse</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(decaissementHTML);
  printWindow.document.close();
  printWindow.focus();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
};

export default printDecaissement;

