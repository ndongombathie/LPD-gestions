// ==========================================================
// 🚀 App.jsx — Application LPD - Point d'entrée principal
// ==========================================================

import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./Routes";

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
       <Router>
      <Routes>
        <Route path="/" element={<VendeurInterface />} />
        {/* <Route path="/login" element={<Connexion />} /> */}
        <Route path="/vendeur" element={<VendeurInterface />} />
      </Routes>
    </Router>
    </BrowserRouter>
  );
}

