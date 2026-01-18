/**
 * Formate un montant en devise (XOF)
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 FCFA';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount).replace('XOF', 'FCFA');
};

/**
 * Formate une date au format français
 */
export const formatDate = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
};

/**
 * Formate une date et heure au format français
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

/**
 * Formate une date au format court
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(date));
};

/**
 * Calcule le THT, TVA et TTC
 */
export const calculateTVA = (totalHT, tauxTVA = 18) => {
  const tva = (totalHT * tauxTVA) / 100;
  const totalTTC = totalHT + tva;
  return {
    totalHT,
    tauxTVA,
    tva,
    totalTTC,
  };
};

