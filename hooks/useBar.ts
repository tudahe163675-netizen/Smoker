import { BarApiService } from "@/services/barApi";
import {
  BarDetail,
  BarDetailApiResponseWrapper,
  BarItem,
  ComboItem,
} from "@/types/barType";
import { mapBarDetail, mapComboList } from "@/utils/mapper";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  // Fix: Use useMemo để tránh tạo instance mới mỗi lần render
  const barApi = useMemo(
    () => new BarApiService(authState.token!),
    [authState.token]
  );

  const fetchBars = useCallback(
    async (pageNum: number = 1, refresh = false) => {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      setError(null);

      try {
        const response = await barApi.getBars(pageNum, 10);

        if (response.success && response.data) {
          const list = response.data.data;

          if (refresh) setBars(list);
          else if (pageNum === 1) setBars(list);
          else setBars((prev) => [...prev, ...list]);

          setPage(pageNum);
          setHasMore(list.length === 10);
        } else {
          setError(response.message || "Không thể tải danh sách bar");
        }
      } catch (err) {
        setError("Lỗi tải danh sách bar");
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
    },
    [barApi]
  );

  const fetchBarDetail = useCallback(
    async (barId: string) => {
      setLoadingDetail(true);
      setError(null);

      try {
        const response = await barApi.getBarDetail(barId);

        const raw = response as BarDetailApiResponseWrapper;

        if (raw.data) {
          const mapped = mapBarDetail(raw.data);
          setBarDetail(mapped);
        } else {
          setError("Không thể tải thông tin bar");
        }
      } catch (err) {
        setError("Lỗi tải thông tin bar");
      } finally {
        setLoadingDetail(false);
      }
    },
    [barApi]
  );

  const fetchCombos = useCallback(
    async (barId: string) => {
      setLoadingCombo(true);
      setError(null);

      try {
        const response = await barApi.getBarCombos(barId);
        console.log(response);


        if (response.data) {
          const mapped = mapComboList(response.data);
          setCombos(mapped);
        } else {
          setError(response.message || "Không thể tải combos");
        }
      } catch (err) {
        setError("Lỗi tải combo");
      } finally {
        setLoadingCombo(false);
      }
    },
    [barApi]
  );

  useEffect(() => {
    fetchBars(1);
  }, [fetchBars]);

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
  };
};