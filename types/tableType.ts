// Table Types - Matching API Response
export interface BarTableApiResponse {
  BarTableId: string;
  BarId: string;
  TableName: string;
  TableTypeName: string;
  TableClassificationId: string;
  DepositPrice: number;
  Status: string;
  Color: string;
  TableApplyId: string | null;
}

export interface BarTable {
  tableId: string;
  barId: string;
  tableName: string;
  tableTypeName: string;
  depositPrice: number;
  status: string;
  color: string;
  capacity: number; // Default to 4 if not provided
}

export interface TableListApiResponse {
  status: string;
  data: BarTableApiResponse[];
}

export interface TableListResponse {
  status: string;
  data: BarTable[];
}

// Booking Types
export interface BookedTable {
  id: string;
  tableName: string;
  price: number; // This will be depositPrice from BarTable
}

export interface BookingDetail {
  Table: {
    [tableId: string]: {
      TableName: string;
      Price: string;
    };
  };
  Note: string;
}

export type BookingScheduleStatus = 'Pending' | 'Confirmed' | 'Arrived' | 'Ended' | 'Canceled' | 'Rejected';

export interface BookingItem {
  BookedScheduleId: string;
  BookerId: string;
  ReceiverId: string;
  Type: string;
  TotalAmount: number;
  PaymentStatus: string;
  ScheduleStatus: BookingScheduleStatus;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  MongoDetailId: string;
  created_at: string;
  detailSchedule: BookingDetail;
  qrCode?: string; // Optional QR code (base64 string)
}

export interface BookingListResponse {
  success: boolean;
  data: BookingItem[];
}

// Create Booking Request
export interface CreateBookingRequest {
  receiverId: string;
  tables: BookedTable[];
  note: string;
  totalAmount: number;
  bookingDate: string;
  startTime: string;
  endTime: string;
  paymentStatus: string;
  scheduleStatus: string;
}

export interface CreateBookingResponse {
  success: boolean;
  message: string;
  data: BookingItem;
}

// Payment Types
export interface CreatePaymentRequest {
  depositAmount: number;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentUrl: string;
    orderCode: number;
    bookingId: string;
  };
}

// Combo Types
export interface Combo {
  comboId: string;
  comboName: string;
  description?: string;
  price: number;
  salePrice?: number;
  image?: string;
  items?: string[];
  suitable?: string;
}

export interface ComboListResponse {
  success: boolean;
  data: Combo[];
}

// Voucher Types
export interface Voucher {
  voucherId: string;
  voucherCode: string;
  voucherName: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom: string;
  validTo: string;
}

export interface VoucherValidationResponse {
  success: boolean;
  valid: boolean;
  message: string;
  data?: {
    voucher: Voucher;
    discountAmount: number;
  };
}

// Create Booking with Combo Request
export interface CreateBookingWithComboRequest {
  receiverId: string;
  comboId: string;
  voucherCode?: string;
  tableId: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  note?: string;
}

// QR Code Types
export interface QRCodeResponse {
  success: boolean;
  data: {
    qrCode: string; // base64 string
    bookingId: string;
  };
}

export interface ScanQRRequest {
  qrData: string;
  barId: string;
}

export interface ScanQRResponse {
  success: boolean;
  data: {
    booking: BookingItem;
    canConfirm: boolean;
    message: string;
  };
}