import { BarApiService } from "@/services/barApi";
import {
  BarDetail,
  BarItem,
  ComboItem
} from "@/types/barType";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";

export const useBar = () => {
  const [bars, setBars] = useState<BarItem[]>([]);
  const [barDetail, setBarDetail] = useState<BarDetail | null>(null);
  const [combos, setCombos] = useState<ComboItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingCombo, setLoadingCombo] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const { authState } = useAuth();
  const token = authState.token!;
  const barApi = new BarApiService(token);

  // ============================================================
  // 🔹 Fetch list bars
  // ============================================================
  const fetchBars = useCallback(
    async (pageNum: number = 1, refresh: boolean = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await barApi.getBars(pageNum, 10);

        if (response.success && response.data) {
          const list = response.data.data; // ⬅ Array BarItem[]

          if (refresh || pageNum === 1) {
            setBars(list);
          } else {
            setBars((prev) => [...prev, ...list]);
          }

          setPage(pageNum);
          setHasMore(list.length === 10);
        } else {
          setError(response.message || "Không thể tải danh sách bar");
        }
      } catch (err) {
        console.error("Error fetching bars:", err);
        setError("Lỗi tải danh sách bar");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [barApi]
  );

  // ============================================================
  // 🔹 Fetch bar detail
  // ============================================================
  const fetchBarDetail = useCallback(
    async (barId: string) => {
      setLoadingDetail(true);
      setError(null);

      try {
        const response = await barApi.getBarDetail(barId);

        if (response.success && response.data) {
          setBarDetail(response.data.data); // ⬅ barDetail
        } else {
          setError(response.message || "Không thể tải thông tin bar");
        }
      } catch (err) {
        console.error("Error fetching bar detail:", err);
        setError("Lỗi tải thông tin bar");
      } finally {
        setLoadingDetail(false);
      }
    },
    [barApi]
  );

  // ============================================================
  // 🔹 Fetch combos
  // ============================================================
  const fetchCombos = useCallback(
    async (barId: string) => {
      setLoadingCombo(true);
      setError(null);

      try {
        const response = await barApi.getBarCombos(barId);

        if (response.success && response.data) {
          setCombos(response.data.data); // ⬅ Array ComboItem[]
        } else {
          setError(response.message || "Không thể tải combos");
        }
      } catch (err) {
        console.error("Error fetching combos:", err);
        setError("Lỗi tải combo");
      } finally {
        setLoadingCombo(false);
      }
    },
    [barApi]
  );

  // ============================================================
  // 🔹 Load bars lần đầu
  // ============================================================
  useEffect(() => {
    fetchBars(1, false);
  }, [fetchBars]);

  const refresh = useCallback(() => {
    fetchBars(1, true);
  }, [fetchBars]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchBars(page + 1);
    }
  }, [loading, hasMore, page, fetchBars]);

  return {
    bars,
    barDetail,
    combos,

    loading,
    loadingDetail,
    loadingCombo,

    error,
    hasMore,
    refreshing,

    fetchBars,
    fetchBarDetail,
    fetchCombos,

    loadMore,
    refresh,
  };
};
