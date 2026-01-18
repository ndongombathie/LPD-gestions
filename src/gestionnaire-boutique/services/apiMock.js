// Mock simple d'API pour simulation locale
// Renvoie des Promises pour imiter les appels asynchrones

const sampleStocks = [
  {
    id: 1,
    nom: "Savon OMO",
    code: "001",
    categorie: "Hygiène",
    quantite: 10,
    nbr_pieces: 5,
    prix_gros: 900,
    prix_detail: 1000,
    seuil: 15,
    fournisseur: "Distribution Dakar",
  },
  {
    id: 2,
    nom: "Riz Royal 50kg",
    code: "002",
    categorie: "Alimentation",
    quantite: 4,
    nbr_pieces: 1,
    prix_gros: 30000,
    prix_detail: 32000,
    seuil: 3,
    fournisseur: "SunuRiz",
  },
  {
    id: 3,
    nom: "Huile Awa 5L",
    code: "003",
    categorie: "Alimentation",
    quantite: 2,
    nbr_pieces: 6,
    prix_gros: 6500,
    prix_detail: 7000,
    seuil: 10,
    fournisseur: "Senhuile SA",
  },
];

// === Transferts (de dépôt vers boutique) ===
let transferAutoId = 100;
const sampleTransferts = [
  { id: 101, nom: "Savon OMO", code: "T001", categorie: "Hygiène", quantite: 10, source: "Dépôt Principal", statut: "en_attente", dateCreation: new Date(Date.now() - 2*24*60*60*1000).toISOString() },
  { id: 102, nom: "Riz Royal 50kg", code: "T002", categorie: "Alimentation", quantite: 5, source: "Dépôt Principal", statut: "en_attente", dateCreation: new Date(Date.now() - 1*24*60*60*1000).toISOString() },
  { id: 103, nom: "Huile Awa 5L", code: "T003", categorie: "Alimentation", quantite: 3, source: "Dépôt Principal", statut: "validé", dateValidation: new Date(Date.now() - 3*60*60*1000).toISOString() },
];

// === Historique des modifications et validations ===
const sampleHistorique = [
  { id: 1, action: "Transfert reçu", produit: "Huile Awa 5L", quantite: 3, utilisateur: "Gestionnaire Dépôt", date: new Date(Date.now() - 3*60*60*1000).toISOString(), statut: "en_attente" },
  { id: 2, action: "Produit validé", produit: "Huile Awa 5L", quantite: 3, utilisateur: "Gestionnaire Boutique", date: new Date(Date.now() - 2*60*60*1000).toISOString(), statut: "validé", prix: 7000 },
  { id: 3, action: "Transfert reçu", produit: "Riz Royal 50kg", quantite: 5, utilisateur: "Gestionnaire Dépôt", date: new Date(Date.now() - 1*24*60*60*1000).toISOString(), statut: "en_attente" },
  { id: 4, action: "Transfert reçu", produit: "Savon OMO", quantite: 10, utilisateur: "Gestionnaire Dépôt", date: new Date(Date.now() - 2*24*60*60*1000).toISOString(), statut: "en_attente" },
];

// === Produits (pour la page Produits) ===
let productAutoId = 1000;
const sampleProducts = [
  {
    id: 1,
    nom: "Savon OMO",
    code: "PR001",
    code_barre: "123456789",
    categorie: "Hygiène",
    quantite: 12,
    prix_vente: 1000,
    prix_gros: 900,
    prix_detail: 1000,
    seuil: 5,
  },
  {
    id: 2,
    nom: "Riz Royal 50kg",
    code: "PR002",
    code_barre: "987654321",
    categorie: "Alimentation",
    quantite: 4,
    prix_vente: 32000,
    prix_gros: 30000,
    prix_detail: 32000,
    seuil: 3,
  },
  {
    id: 3,
    nom: "Huile Awa 5L",
    code: "PR003",
    code_barre: "555666777",
    categorie: "Alimentation",
    quantite: 2,
    prix_vente: 7000,
    prix_gros: 6500,
    prix_detail: 7000,
    seuil: 10,
  },
];

export function fetchStocks() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(sampleStocks))), 400);
  });
}

export function deleteStock(id) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, id }), 200);
  });
}

export function fetchTransferts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(sampleTransferts))), 400);
  });
}

export function getTransfertById(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const t = sampleTransferts.find((x) => x.id === id);
      resolve(t ? JSON.parse(JSON.stringify(t)) : null);
    }, 200);
  });
}

export function validateTransfert(id, productPayload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const t = sampleTransferts.find((x) => x.id === id);
      if (t) {
        // Mark as validated
        t.statut = "validé";
        t.dateValidation = new Date().toISOString();
        
        // Add or update product
        const existing = sampleProducts.find((p) => p.code === t.code);
        if (existing) {
          existing.quantite += t.quantite;
          Object.assign(existing, productPayload);
        } else {
          const newProd = {
            id: ++productAutoId,
            nom: t.nom,
            code: t.code,
            code_barre: productPayload.code_barre || "",
            categorie: t.categorie,
            quantite: t.quantite,
            ...productPayload,
          };
          sampleProducts.push(newProd);
        }
        
        // Log to historique
        sampleHistorique.push({
          id: sampleHistorique.length + 1,
          action: "Produit validé",
          produit: t.nom,
          quantite: t.quantite,
          utilisateur: "Gestionnaire Boutique",
          date: new Date().toISOString(),
          statut: "validé",
          prix: productPayload.prix_vente,
        });
        
        resolve({ ok: true, transfert: t, product: existing || sampleProducts[sampleProducts.length - 1] });
      } else {
        resolve({ ok: false, error: "Transfert not found" });
      }
    }, 300);
  });
}

export function fetchHistorique() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(sampleHistorique))), 400);
  });
}

export function fetchProducts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(JSON.parse(JSON.stringify(sampleProducts))), 420);
  });
}

export function addProduct(payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const p = { id: ++productAutoId, ...payload };
      sampleProducts.push(p);
      resolve(JSON.parse(JSON.stringify(p)));
    }, 300);
  });
}

export function updateProduct(id, payload) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const idx = sampleProducts.findIndex((s) => s.id === id);
      if (idx !== -1) {
        sampleProducts[idx] = { ...sampleProducts[idx], ...payload };
        resolve(JSON.parse(JSON.stringify(sampleProducts[idx])));
      } else {
        resolve(null);
      }
    }, 300);
  });
}

export function deleteProduct(id) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const before = sampleProducts.length;
      for (let i = 0; i < sampleProducts.length; i++) {
        if (sampleProducts[i].id === id) {
          sampleProducts.splice(i, 1);
          break;
        }
      }
      resolve({ ok: true, removed: before - sampleProducts.length });
    }, 200);
  });
}

export function deleteTransfert(id) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ ok: true, id }), 200);
  });
}

export function addHistoriqueEntry(entry) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const h = { id: sampleHistorique.length + 1, date: new Date().toISOString(), ...entry };
      sampleHistorique.push(h);
      resolve(JSON.parse(JSON.stringify(h)));
    }, 150);
  });
}

export default {
  fetchStocks,
  deleteStock,
  fetchTransferts,
  getTransfertById,
  validateTransfert,
  fetchHistorique,
  addHistoriqueEntry,
  deleteTransfert,
  fetchProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
