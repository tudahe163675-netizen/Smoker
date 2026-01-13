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
    TableListResponse,
    ComboListResponse,
    VoucherValidationResponse,
    CreateBookingWithComboRequest,
    QRCodeResponse,
    ScanQRRequest,
    ScanQRResponse,
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

    // Create full payment for combo booking (giống web)
    async createTableFullPayment(
        bookingId: string,
        paymentData: { amount: number; discountPercentages?: number }
    ): Promise<ApiResponse<PaymentResponse>> {
        return this.makeRequest<PaymentResponse>(
            `/bookingtable/${bookingId}/create-full-payment`,
            {
                method: "POST",
                body: JSON.stringify(paymentData),
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

    // Combo APIs
    // Use same endpoint as web: /combo/bar/${barPageId}
    async getBarCombos(barPageId: string): Promise<ApiResponse<ComboListResponse>> {
        return this.makeRequest<ComboListResponse>(
            `/combo/bar/${barPageId}`
        );
    }

    // Voucher APIs
    async getAvailableVouchers(minComboValue: number = 0): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(
            `/bookingtable/available-vouchers?minComboValue=${minComboValue}`
        );
    }

    async validateVoucher(voucherCode: string, totalAmount: number): Promise<ApiResponse<VoucherValidationResponse>> {
        return this.makeRequest<VoucherValidationResponse>(
            `/bookingtable/validate-voucher`,
            {
                method: "POST",
                body: JSON.stringify({ voucherCode, totalAmount }),
            }
        );
    }

    // Create Booking with Combo
    async createBookingWithCombo(
        bookingData: CreateBookingWithComboRequest
    ): Promise<ApiResponse<CreateBookingResponse>> {
        return this.makeRequest<CreateBookingResponse>(
            `/bookingtable/with-combo`,
            {
                method: "POST",
                body: JSON.stringify(bookingData),
            }
        );
    }

    // QR Code APIs
    async getBookingQRCode(bookingId: string): Promise<ApiResponse<QRCodeResponse>> {
        return this.makeRequest<QRCodeResponse>(
            `/bookingtable/${bookingId}/qr-code`
        );
    }

    async scanQRCode(qrData: string, barId: string): Promise<ApiResponse<ScanQRResponse>> {
        return this.makeRequest<ScanQRResponse>(
            `/bookingtable/scan-qr`,
            {
                method: "POST",
                body: JSON.stringify({ qrData, barId }),
            }
        );
    }

    // Booking Status Update APIs
    async confirmArrival(bookingId: string): Promise<ApiResponse<CreateBookingResponse>> {
        return this.makeRequest<CreateBookingResponse>(
            `/bookingtable/${bookingId}/confirm-arrival`,
            {
                method: "PATCH",
            }
        );
    }

    async endBooking(bookingId: string): Promise<ApiResponse<CreateBookingResponse>> {
        return this.makeRequest<CreateBookingResponse>(
            `/bookingtable/${bookingId}/end`,
            {
                method: "PATCH",
            }
        );
    }

    // Event APIs
    async getBarEvents(barPageId: string): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(`/events/bar/${barPageId}`);
    }
}