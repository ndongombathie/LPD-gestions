import React from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

const AppLayout = ({
  user,
  commandes,
  onLogout,
  sectionActive,
  setSectionActive,
  children,
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* SIDEBAR */}
      <Sidebar
        user={user}
        sectionActive={sectionActive}
        setSectionActive={setSectionActive}
      />

      {/* HEADER */}
      <Header
        user={user}
        commandes={commandes}
        onLogout={onLogout}
      />

      {/* CONTENU */}
      <main className="ml-64 pt-16 px-6">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
