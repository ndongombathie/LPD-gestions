import httpClient from "../http/client";

const safeNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const journalCaisseAPI = {
  async getControleCaisse({ date = null, page = 1 } = {}) {
    try {
      const response = await httpClient.get(
        "/caissier/caisses-journals",
        {
          params: {
            ...(date ? { date } : {}),
            page,
          },
        }
      );

      const payload = response?.data ?? {};

      return {
        data: Array.isArray(payload.data) ? payload.data : [],
        currentPage: safeNumber(payload.current_page) || 1,
        lastPage: safeNumber(payload.last_page) || 1,
        total: safeNumber(payload.total),
        perPage: safeNumber(payload.per_page),
      };

    } catch (error) {
      console.error("❌ Erreur getControleCaisse:", error);
      return {
        data: [],
        currentPage: 1,
        lastPage: 1,
        total: 0,
        perPage: 0,
      };
    }
  },
};

export default journalCaisseAPI;