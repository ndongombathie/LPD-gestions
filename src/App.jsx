// ==========================================================
// ⚙️ App.jsx — Entrée principale (multi-modules)
// ==========================================================
import React from "react";

import ComptableApp from "./comptable/ComptableApp.jsx";
import AppResponsable from "./responsable/AppResponsable.jsx";

// ✅ Choisis le module à afficher
const MODULE = "responsable"; // "comptable" | "responsable" (tu peux ajouter d'autres plus tard)

export default function App() {
  if (MODULE === "comptable") return <ComptableApp />;
  if (MODULE === "responsable") return <AppResponsable />;

  // fallback
  return <ComptableApp />;
}
