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
  try {
    const d =
      typeof date === 'string' && date.includes(' ') && !date.includes('T')
        ? new Date(date.replace(' ', 'T'))
        : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch (_e) {
    return '';
  }
};

/**
 * Formate une date et heure au format français
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    const d =
      typeof date === 'string' && date.includes(' ') && !date.includes('T')
        ? new Date(date.replace(' ', 'T'))
        : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (_e) {
    return '';
  }
};

/**
 * Formate une date au format court
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  try {
    const d =
      typeof date === 'string' && date.includes(' ') && !date.includes('T')
        ? new Date(date.replace(' ', 'T'))
        : new Date(date);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
    }).format(d);
  } catch (_e) {
    return '';
  }
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

