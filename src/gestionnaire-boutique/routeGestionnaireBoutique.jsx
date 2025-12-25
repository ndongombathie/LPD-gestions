import Dashboard from "./pages/Dashboard";
import Produits from "./pages/Produits";
import Stock from "./pages/Stock";
import Historique from "./pages/Historique";
import Rapports from "./pages/Rapports";
import Alertes from "./pages/Alertes";
import LayoutGestionnaire from "./components/LayoutGestionnaire";

const routes = {
  dashboard: Dashboard,
  produits: Produits,
  stock: Stock,
  historique: Historique,
  alertes: Alertes,
  rapports: Rapports,
};

export const RenderRoute = ({ currentPage }) => {
  const Component = routes[currentPage] || Dashboard;
  return (
    <LayoutGestionnaire>
      <Component />
    </LayoutGestionnaire>
  );
};
