import { BaseApiService, ApiResponse } from './BaseApiService';

export interface RefundRequest {
  bookedScheduleId: string;
  bookingId?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  receiverName?: string;
  receiverAvatar?: string;
  totalAmount: number;
  depositAmount?: number;
  refundAmount: number;
  refundStatus: 'pending' | 'approved' | 'rejected' | 'completed';
  refundReason?: string;
  refundImages?: string[];
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    accountHolderName?: string;
  };
  createdAt: string;
  updatedAt?: string;
  bookingDate?: string;
  bookingTime?: string;
}

export interface GetRefundRequestsParams {
  limit?: number;
  offset?: number;
  status?: 'pending' | 'approved' | 'rejected' | 'completed';
  accountId?: string;
}

export interface CreateRefundRequestData {
  bookedScheduleId: string;
  refundReason: string;
  refundImages?: string[];
}

class RefundApiService extends BaseApiService {
  constructor(token: string) {
    super(token);
  }

  async getRefundRequests(params?: GetRefundRequestsParams): Promise<ApiResponse<RefundRequest[]>> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.accountId) queryParams.append('accountId', params.accountId);

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/admin/refund-requests?${queryString}` : '/admin/refund-requests';

    return this.makeRequest<RefundRequest[]>(endpoint, {
      method: 'GET',
    });
  }

  async getRefundRequestDetail(bookedScheduleId: string): Promise<ApiResponse<RefundRequest>> {
    return this.makeRequest<RefundRequest>(`/admin/refund-requests/${bookedScheduleId}`, {
      method: 'GET',
    });
  }

  async updateRefundStatus(
    bookedScheduleId: string,
    refundStatus: 'pending' | 'approved' | 'rejected' | 'completed'
  ): Promise<ApiResponse<RefundRequest>> {
    return this.makeRequest<RefundRequest>(`/admin/refund-requests/${bookedScheduleId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ refundStatus }),
    });
  }

  // Note: API để user tạo refund request có thể không có, cần kiểm tra backend
  // Nếu không có, có thể cần tạo endpoint mới hoặc sử dụng endpoint khác
  async createRefundRequest(data: CreateRefundRequestData): Promise<ApiResponse<RefundRequest>> {
    // Giả sử endpoint này tồn tại, nếu không cần điều chỉnh
    return this.makeRequest<RefundRequest>('/refund-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const createRefundApi = (token: string) => new RefundApiService(token);

