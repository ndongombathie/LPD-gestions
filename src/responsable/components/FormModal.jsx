// ==========================================================
// 🧱 FormModal.jsx — Modale de formulaire réutilisable (LPD Manager)
// Design harmonisé : backdrop blur + border-black + header gradient
// ==========================================================

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function FormModal({
  open,
  title,
  children,
  onClose,
  width = "max-w-2xl",
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Contenu */}
          <motion.div
            className={`relative w-[95%] sm:w-auto ${width} bg-white/95 rounded-2xl border border-black shadow-[0_18px_45px_rgba(15,23,42,0.45)] overflow-hidden`}
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/10 bg-gradient-to-r from-[#F7F5FF] via-white to-[#FFF9F5]">
              <h3 className="text-base sm:text-lg font-semibold text-[#472EAD]">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-[#F1EEFF] active:scale-95 transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
