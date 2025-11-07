// gestionnaire-boutique/components/Layout.jsx
import React from "react";
import Sidebar from "./Sidebar";

const Layout = ({ currentPage, setCurrentPage, children }) => {
  return (
    <div className="flex min-h-screen overflow-y-auto">
      {/* Sidebar fixe */}
      <div className="w-64 fixed top-0 left-0 bottom-0 bg-[#472EAD] text-white z-40">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      {/* Contenu principal */}
      <div className="flex-1 ml-64 bg-[#F3F4F6]">
        {children}
      </div>
    </div>
  );
};

export default Layout;
