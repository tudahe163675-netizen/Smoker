import { BarApiService } from "@/services/barApi";
import {
  BarDetail,
  BarDetailApiResponseWrapper,
  BarItem,
  MyBooking,
} from "@/types/barType";
import {
  BarTable,
  BookingItem,
  CreateBookingRequest,
} from "@/types/tableType";
import { mapBarDetail, mapBarTableList, mapMyBooking } from "@/utils/mapper";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "./useAuth";

export const useBar = () => {
  const [bars, setBars] = useState<BarItem[]>([]);
  const [barDetail, setBarDetail] = useState<BarDetail | null>(null);
  const [tables, setTables] = useState<BarTable[]>([]);
  const [bookedTables, setBookedTables] = useState<BookingItem[]>([]);
  const [myBookings, setMyBookings] = useState<MyBooking[]>([]);

  const [loading, setLoading] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);
  const [loadingBooking, setLoadingBooking] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { authState } = useAuth();

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

  const fetchTables = useCallback(
    async (barId: string) => {
      setLoadingTables(true);
      setError(null);

      try {
        const response = await barApi.getBarTables(barId);

        if (response.data) {
          const mappedTables = mapBarTableList(response.data);
          setTables(mappedTables);
        } else {
          setError(response.message || "Không thể tải danh sách bàn");
          setTables([]);
        }
      } catch (err) {
        console.error('Error fetching tables:', err);
        setError("Lỗi tải danh sách bàn");
        setTables([]);
      } finally {
        setLoadingTables(false);
      }
    },
    [barApi]
  );

  const fetchBookedTables = useCallback(
    async (entityAccountId: string, date: string) => {
      setLoadingTables(true);
      setError(null);

      try {
        const response = await barApi.getBookedTables(entityAccountId, date);

        if (response.success && response.data) {
          setBookedTables(response.data || []);
        } else {
          setError(response.message || "Không thể tải thông tin đặt bàn");
          setBookedTables([]);
        }
      } catch (err) {
        setError("Lỗi tải thông tin đặt bàn");
        setBookedTables([]);
      } finally {
        setLoadingTables(false);
      }
    },
    [barApi]
  );

  const fetchMyBookings = useCallback(
    async (entityAccountId: string) => {
      setLoadingMyBookings(true);
      setError(null);

      try {
        const response = await barApi.getMyBookings(entityAccountId);     

        if (response.success && response.data) {
          const mappedBookings = response.data.map(mapMyBooking);
          setMyBookings(mappedBookings);
        } else {
          setError(response.message || "Không thể tải thông tin đặt bàn của bạn");
          setMyBookings([]);
        }
      } catch (err) {
        setError("Lỗi tải thông tin đặt bàn của bạn");
        setMyBookings([]);
      } finally {
        setLoadingMyBookings(false);
      }
    },
    [barApi]
  );

  const createBooking = useCallback(
    async (bookingData: CreateBookingRequest) => {
      setLoadingBooking(true);
      setError(null);

      try {
        const response = await barApi.createBooking(bookingData);

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || "Không thể đặt bàn");
          return null;
        }
      } catch (err) {
        setError("Lỗi đặt bàn");
        return null;
      } finally {
        setLoadingBooking(false);
      }
    },
    [barApi]
  );

  const createPaymentLink = useCallback(
    async (bookedScheduleId: string, depositAmount: number) => {
      setLoadingBooking(true);
      setError(null);

      try {
        const response = await barApi.createPaymentLink(
          bookedScheduleId,
          depositAmount
        );

        if (response.success && response.data) {
          return response.data;
        } else {
          setError(response.message || "Không thể tạo link thanh toán");
          return null;
        }
      } catch (err) {
        setError("Lỗi tạo link thanh toán");
        return null;
      } finally {
        setLoadingBooking(false);
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
    tables,
    bookedTables,
    myBookings,
    loading,
    loadingDetail,
    loadingTables,
    loadingMyBookings,
    loadingBooking,
    error,
    hasMore,
    refreshing,
    fetchBars,
    fetchBarDetail,
    fetchTables,
    fetchBookedTables,
    fetchMyBookings,
    createBooking,
    createPaymentLink,
  };
};