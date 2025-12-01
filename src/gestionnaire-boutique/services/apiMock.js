// Mock simple d'API pour simulation locale
// Renvoie des Promises pour imiter les appels asynchrones

const sampleStocks = [
  {
    id: 1,
    nom: "Savon OMO",
    code: "PR001",
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
    code: "PR002",
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
    code: "PR003",
    categorie: "Alimentation",
    quantite: 2,
    nbr_pieces: 6,
    prix_gros: 6500,
    prix_detail: 7000,
    seuil: 10,
    fournisseur: "Senhuile SA",
  },
];

const sampleTransferts = [
  { id: 1, produit: "Savon OMO", source: "Boutique A", destination: "Boutique B", quantite: 10, statut: "en_attente" },
  { id: 2, produit: "Riz 5kg", source: "Boutique B", destination: "Boutique C", quantite: 5, statut: "validé" },
  { id: 3, produit: "Lait", source: "Boutique A", destination: "Boutique C", quantite: 8, statut: "rejeté" },
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
    prix_vente: 1000,
    quantite: 12,
    prix_seuil: 5,
  },
  {
    id: 2,
    nom: "Riz Royal 50kg",
    code: "PR002",
    code_barre: "987654321",
    categorie: "Alimentation",
    prix_vente: 32000,
    quantite: 4,
    prix_seuil: 3,
  },
  {
    id: 3,
    nom: "Huile Awa 5L",
    code: "PR003",
    code_barre: "555666777",
    categorie: "Alimentation",
    prix_vente: 7000,
    quantite: 2,
    prix_seuil: 10,
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
    setTimeout(() => resolve(JSON.parse(JSON.stringify(sampleTransferts))), 350);
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

export default {
  fetchStocks,
  deleteStock,
  fetchTransferts,
  deleteTransfert,
};
