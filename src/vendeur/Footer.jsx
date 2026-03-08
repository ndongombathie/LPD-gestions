import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer
        className="
          fixed
          bottom-0
          left-0
          right-0
          md:left-64
          border-t border-lpd-border/80
          bg-white/90 backdrop-blur-sm
          z-30
        "
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] sm:text-xs text-gray-500">

          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lpd-accent" />
            <span>
              © {currentYear}{" "}
              <span className="font-semibold text-lpd-header">
                SSD Consulting
              </span>
              {" · "}
              <span className="text-gray-400">
                Tous droits réservés.
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] sm:text-xs">
            <span className="hidden sm:inline-block h-3 w-px bg-gray-200" />
            <span className="text-gray-400">LPD Manager</span>
            <span className="text-gray-300">•</span>
            <span>Interface Vendeur</span>
            <span className="text-gray-300">•</span>
            <span className="font-semibold text-lpd-accent">v1.0.0</span>
          </div>

        </div>
      </footer>
    </>
  );
};

export default Footer;