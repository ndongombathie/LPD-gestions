import { Routes, Route } from "react-router-dom";
import DepotLayout from "./layout/DepotLayout";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import StockMovements from "./pages/StockMovements";
import Suppliers from "./pages/Suppliers";
import StockReport from "./pages/StockReport";

export default function DepotRoutes() {
  return (
    <Routes>
      <Route path="/" element={<DepotLayout />}>

        <Route index element={<Dashboard />} />
        <Route path="products" element={<Products />} />
        <Route path="movementStock" element={<StockMovements />} />
        <Route path="suppliers" element={<Suppliers />} />
        <Route path="rapports" element={<StockReport />} />

      </Route>
    </Routes>
  );
}
