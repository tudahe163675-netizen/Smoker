import {
    BarDetailResponse,
    BarListResponse,
    MyBookingListResponse,
} from "@/types/barType";
import {
    BookingListResponse,
    CreateBookingRequest,
    CreateBookingResponse,
    PaymentResponse,
    TableListResponse
} from "@/types/tableType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

export class BarApiService {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.token}`,
                    ...(options.headers || {}),
                },
                ...options,
            });

            const data = await response.json();            

            if (!response.ok) {
                throw new Error(data.message || "API request failed");
            }

            return data;
        } catch (error) {
            console.error("API Error:", error);
            return {
                success: false,
                message: error instanceof Error ? error.message : "Unknown error",
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }

    // Bar APIs
    async getBars(page: number = 1, limit: number = 10): Promise<ApiResponse<BarListResponse>> {
        return this.makeRequest<BarListResponse>(`/bar?page=${page}&limit=${limit}`);
    }

    async getBarDetail(barId: string): Promise<ApiResponse<BarDetailResponse>> {
        return this.makeRequest<BarDetailResponse>(`/bar/${barId}`);
    }

    // Table APIs
    async getBarTables(barId: string): Promise<ApiResponse<TableListResponse>> {
        return this.makeRequest<TableListResponse>(`/bar-table/bar/${barId}`);
    }

    async getBookedTables(
        entityAccountId: string,
        date: string
    ): Promise<ApiResponse<BookingListResponse>> {
        return this.makeRequest<BookingListResponse>(
            `/bookingtable/receiver/${entityAccountId}?date=${date}`
        );
    }

    // Booking APIs
    async createBooking(
        bookingData: CreateBookingRequest
    ): Promise<ApiResponse<CreateBookingResponse>> {
        return this.makeRequest<CreateBookingResponse>(`/bookingtable`, {
            method: "POST",
            body: JSON.stringify(bookingData),
        });
    }

    async createBookingDj(
        bookingData: any
    ): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(`/booking/request`, {
            method: "POST",
            body: JSON.stringify(bookingData),
        });
    }

    async createPaymentLink(
        bookedScheduleId: string,
        depositAmount: number
    ): Promise<ApiResponse<PaymentResponse>> {
        return this.makeRequest<PaymentResponse>(
            `/bookingtable/${bookedScheduleId}/create-payment`,
            {
                method: "POST",
                body: JSON.stringify({ depositAmount }),
            }
        );
    }

    async getPaymentLink(
        bookedScheduleId: string
    ): Promise<ApiResponse<BookingListResponse>> {
        return this.makeRequest<BookingListResponse>(
            `/bookingtable/${bookedScheduleId}/get-payment-link`
        );
    }

    async cancelBooking(bookedScheduleId: string): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(
            `/bookingtable/${bookedScheduleId}/cancel`,
            {
                method: "PATCH",
            }
        );
    }

    async getMyBookings(entityAccountId: string): Promise<ApiResponse<MyBookingListResponse>> {
        return this.makeRequest<MyBookingListResponse>(
            `/booking/booker/${entityAccountId}`
        );
    }
}