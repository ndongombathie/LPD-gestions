
import AppGestionnaireBoutique from "./gestionnaire-boutique/AppGestionnaireBoutique";
import ComptableApp from './comptable/ComptableApp.jsx';
import AppResponsable from "./responsable/AppResponsable.jsx";
import AppCaissier from "./caissier/AppCaissier.jsx";
import AppGestionnaireDepot from "./gestionnaire-depot/AppGestionnaireDepot";

export default function App() {
  const MODULE = "gestionnaire-depot";

  if (MODULE === "comptable") return <ComptableApp />;
  if (MODULE === "responsable") return <AppResponsable />;
  if (MODULE === "gestionnaire-boutique") return <AppGestionnaireBoutique />;
  if( MODULE === "caissier") return <AppCaissier />;
  if( MODULE === "gestionnaire-depot") return <AppGestionnaireDepot />;

  // fallback
  return <ComptableApp />;
}


