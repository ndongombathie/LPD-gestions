import AppGestionnaireBoutique from "./gestionnaire-boutique/AppGestionnaireBoutique";
import ComptableApp from './comptable/ComptableApp.jsx';
import AppResponsable from "./responsable/AppResponsable.jsx";
export default function App() {
  const MODULE = "responsable";

  if (MODULE === "comptable") return <ComptableApp />;
  if (MODULE === "responsable") return <AppResponsable />;
  if (MODULE === "gestionnaire-boutique") return <AppGestionnaireBoutique />;

  // fallback
  return <ComptableApp />;
}
