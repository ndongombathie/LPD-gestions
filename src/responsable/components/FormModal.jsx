// ==========================================================
// 🧱 FormModal.jsx — Modale de formulaire réutilisable (LPD Manager)
// Design cohérent + logique simple : ouverture, fermeture, validation
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
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className={`relative w-[95%] sm:w-auto ${width} bg-white rounded-2xl border border-gray-200 shadow-2xl`}
            initial={{ scale: 0.96, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-[#472EAD]">{title}</h3>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[#F7F5FF]"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
