import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DepotRoutes from "./DepotRoutes";

export default function AppGestionnaireDepot() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirection vers /depot */}
        {/* <Route path="/" element={<Navigate to="/depot" replace />} /> */}

        {/* Module gestionnaire de dépôt */}
        <Route path="/depot/*" element={<DepotRoutes />} />
      </Routes>
    </BrowserRouter>
  );
}
