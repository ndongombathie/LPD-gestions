import Dashboard from "./pages/Dashboard";
import Produits from "./pages/Produits";
import Stock from "./pages/Stock";
import Transferts from "./pages/Transferts";
import Rapports from "./pages/Rapports";

const routes = {
  dashboard: Dashboard,
  produits: Produits,
  stock: Stock,
  transferts: Transferts,
  rapports: Rapports,
};

export const RenderRoute = ({ currentPage }) => {
  const Component = routes[currentPage] || Dashboard;
  return <Component />;
};
