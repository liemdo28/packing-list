import { useState, useCallback } from 'react';

export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const updatePagination = useCallback((paginationData) => {
    if (paginationData) {
      setTotal(paginationData.total || 0);
      setTotalPages(paginationData.totalPages || 0);
    }
  }, []);

  const goToPage = useCallback((newPage) => {
    setPage(Math.max(1, Math.min(newPage, totalPages || 1)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (page < totalPages) setPage(p => p + 1);
  }, [page, totalPages]);

  const prevPage = useCallback(() => {
    if (page > 1) setPage(p => p - 1);
  }, [page]);

  return {
    page,
    limit,
    total,
    totalPages,
    setPage,
    setLimit,
    goToPage,
    nextPage,
    prevPage,
    updatePagination,
  };
}
