export const logger = {
  info: (message, meta = {}) => {
    // plus tard : envoi serveur / Sentry / fichier
    if (import.meta.env.DEV) {
      console.info("[INFO]", message, meta);
    }
  },

  warn: (message, meta = {}) => {
    if (import.meta.env.DEV) {
      console.warn("[WARN]", message, meta);
    }
  },

  error: (message, meta = {}) => {
    if (import.meta.env.DEV) {
      console.error("[ERROR]", message, meta);
    }
  },
};
