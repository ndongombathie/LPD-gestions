import { BrowserRouter, Routes, Route } from "react-router-dom";
import DepotRoutes from "./DepotRoutes";

export default function AppGestionnaireDepot() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/gestionnaire_depot/*" element={<DepotRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}