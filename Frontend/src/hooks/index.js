import { useState, useEffect, useCallback } from 'react';

export function useFetch(apiFn, params = null, deps = []) {
  const [data, setData] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const execute = useCallback(async (overrideParams) => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFn(overrideParams ?? params);
      const body = res.data;
      setData(body.data);
      if (body.pagination) setPagination(body.pagination);
      return body;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    execute();
  }, [execute]);

  return { data, pagination, loading, error, refetch: execute };
}

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit] = useState(initialLimit);

  return {
    page,
    limit,
    setPage,
    nextPage: () => setPage((p) => p + 1),
    prevPage: () => setPage((p) => Math.max(1, p - 1)),
    reset: () => setPage(1),
  };
}

export function useFilters(defaults = {}) {
  const [filters, setFilters] = useState(defaults);

  const setFilter = (key, value) => {
    setFilters((prev) => {
      if (value === '' || value === null || value === undefined) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: value };
    });
  };

  const clearFilters = () => setFilters(defaults);

  return { filters, setFilter, clearFilters, setFilters };
}
