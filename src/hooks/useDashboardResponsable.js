// ==========================================================
// 📊 useDashboardResponsable.js — VERSION SIMPLIFIÉE
// ==========================================================

import { useEffect, useRef, useState } from "react";
import { dashboardResponsableAPI } from "@/responsable/services/api/dashboardResponsable";

const createSignature = (data) => JSON.stringify(data);

export default function useDashboardResponsable() {

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const lastSignatureRef = useRef(null);

  useEffect(() => {
    let intervalId;

    const load = async (isRefresh = false) => {
      try {

        if (!isRefresh && lastSignatureRef.current === null) {
          setLoading(true);
        }

        if (isRefresh) {
          setIsRefreshing(true);
        }

        const response = await dashboardResponsableAPI.getDashboardData();

        const newSignature = createSignature(response);

        // refresh intelligent (update seulement si changement)
        if (lastSignatureRef.current === newSignature && isRefresh) {
          return;
        }

      lastSignatureRef.current = newSignature;
      setData(response);

      if (!isRefresh) {
        setLoading(false);
      }

      } catch (e) {

        setError(e);
      } finally {
        setIsRefreshing(false);
      }
    };

    load(false);

    intervalId = setInterval(() => {
      load(true);
    }, 30000);

    return () => clearInterval(intervalId);

  }, []);

  return {
    loading,
    isRefreshing,
    error,
    utilisateurs: data?.utilisateurs || null,
    finance: data?.finance || null,
    alertesStock: data?.alertesStock || null,
  };
}