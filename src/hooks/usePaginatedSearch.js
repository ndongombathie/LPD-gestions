import { useState, useEffect } from "react";

export default function usePaginatedSearch(fetcher, delay = 1000) {
  const [data, setData] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // 🔎 Debounce recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchTerm(searchInput);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchInput, delay]);

  // 📡 Fetch API
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(page === 1);

        const res = await fetcher({
          page,
          search: searchTerm || undefined,
        });

        const raw = Array.isArray(res) ? res : res.data || [];

        setData(raw);

        if (!Array.isArray(res)) {
          setTotalItems(res.total || 0);
          setTotalPages(
            Math.max(1, Math.ceil((res.total || 0) / (res.per_page || 20)))
          );
        }
      } catch (e) {

      } finally {
        setLoading(false);
      }
    };

    load();
  }, [page, searchTerm, fetcher]);

  return {
    data,
    loading,
    page,
    totalPages,
    totalItems,
    searchInput,
    setSearchInput,
    setPage,
  };
}
