import {
    BarDetailResponse,
    BarListResponse,
    ComboListResponse,
} from "@/types/barType";
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

    async getBars(page: number = 1, limit: number = 10): Promise<ApiResponse<BarListResponse>> {
        return this.makeRequest<BarListResponse>(`/bar?page=${page}&limit=${limit}`);
    }

    async getBarDetail(barId: string): Promise<ApiResponse<BarDetailResponse>> {
        return this.makeRequest<BarDetailResponse>(`/bar/${barId}`);
    }

    async getBarCombos(barId: string): Promise<ApiResponse<ComboListResponse>> {
        return this.makeRequest<ComboListResponse>(`/combo/bar/${barId}`);
    }

}
