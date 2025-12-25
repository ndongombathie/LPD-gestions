// src/data/produitsSimules.js
export const produitsSimules = [
  {
    id: 1,
    nom: "Bloc Note ",
    code_barre: "694689174174",
    reference: "Mood diary",
    prix: 350, // Prix détail
    prix_seuil: 300, // Seuil détail
    prix_gros: 3000, // Prix gros
    prix_seuil_gros: 2500, // Seuil gros
    stock: 15,
    seuil_alerte: 5,
    categorie: "Etudes",
    tva: 18
  },
  {
    id: 2,
    nom: "Bouteille d'eau 1.5L",
    code_barre: "6044000268101",
    reference: "Paix-peace-1.5L",
    prix: 400,
    prix_seuil: 350,
    prix_gros: 3750,
    prix_seuil_gros: 3000,
    stock: 50,
    seuil_alerte: 35,
    categorie: "Alimentaires",
    tva: 18
  },
    {
    id: 5,
    nom: "Aggraffes",
    code_barre: "8901057524421",
    reference: "Agg-NO-384556",
    prix: 500,
    prix_seuil: 400,
    prix_gros: 1000,
    prix_seuil_gros: 900,
    stock: 10,
    seuil_alerte: 2,
    categorie: "Outils",
    tva: 18
  },
{
    id: 6,
    nom: "Kirene",
    code_barre: "9501100460028",
    reference: "Kirene",
    prix: 400,
    prix_seuil: 375,
    prix_gros: 3800,
    prix_seuil_gros: 3500,
    stock: 10,
    seuil_alerte: 2,
    categorie: "Alimentaires",
    tva: 18
  },
  // ... autres produits avec prix_gros et prix_seuil_gros
];