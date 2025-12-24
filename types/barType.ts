
export interface AddressData {
  provinceId: string;
  districtId: string;
  wardId: string;
  fullAddress: string;
}

export interface BarItem {
  barPageId: string;
  accountId: string;
  barName: string;
  avatar: string;
  background: string;
  address: string;
  addressData: AddressData | null;
  phoneNumber: string;
  email: string;
  role: string;
  reviewCount: number;
  averageRating: number | null;
  entityAccountId: string;
  createdAt: string;
}

export interface BarListResponse {
  status: string;
  data: BarItem[];
}

export interface BarDetail {
  barPageId: string;
  accountId: string;
  barName: string;
  avatar: string;
  background: string;
  address: string;
  phoneNumber: string;
  role: string;
  email: string;
  status: string | null;
  createdAt: string;
  entityAccountId: string;
  addressData: AddressData | null;
}

export interface BarDetailResponse {
  status: string;
  data: BarDetail;
}

export interface BarDetailApiResponse {
  BarPageId: string;
  AccountId: string;
  BarName: string;
  Avatar: string;
  Background: string;
  Address: string;
  PhoneNumber: string;
  Role: string;
  Email: string;
  Status: string | null;
  created_at: string;
  EntityAccountId: string;
  addressData: AddressData | null;
}

export interface BarDetailApiResponseWrapper {
  status: string;
  data: BarDetailApiResponse;
}

export interface ComboItemApiResponse {
  ComboId: string;
  ComboName: string;
  BarId: string;
  TableApplyId: string | null;
  VoucherApplyId: string | null;
  Price: number;
}


export interface ComboItem {
  comboId: string;
  comboName: string;
  barId: string;
  tableApplyId: string | null;
  voucherApplyId: string | null;
  price: number;
}

export interface ComboListResponse {
  status: string;
  data: ComboItem[];
}


export interface TableItem {
  tableName: string;
  price: string;
}

export interface DetailSchedule {
  _id: string;
  table: Record<string, TableItem>;
  note: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  location?: string;
}

export interface ReceiverInfo {
  entityAccountId: string;
  entityId: string;
  entityType: string;
  name: string;
  userName: string;
  avatar: string;
  background: string;
  phone: string;
  address: string;
  bio: string | null;
  role: string;
  barPageId: string;
  businessAccountId: string | null;
  gender: string | null;
  pricePerHours: number | null;
  pricePerSession: number | null;
}

export interface MyBooking {
  bookedScheduleId: string;
  bookerId: string;
  receiverId: string;
  type: string;
  totalAmount: number;
  paymentStatus: string;
  scheduleStatus: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  mongoDetailId: string;
  createdAt: string;
  detailSchedule: DetailSchedule;
  receiverInfo?: ReceiverInfo;
}

export interface MyBookingListResponse {
  success: boolean;
  data: MyBooking[];
}

export interface MyBookingApiResponse {
  BookedScheduleId: string;
  BookerId: string;
  ReceiverId: string;
  Type: string;
  TotalAmount: number;
  PaymentStatus: string;
  ScheduleStatus: string;
  BookingDate: string;
  StartTime: string;
  EndTime: string;
  MongoDetailId: string;
  created_at: string;
  detailSchedule: {
    _id: string;
    Table: Record<string, {
      TableName: string;
      Price: string;
    }>;
    Note: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
    location?: string;
  };
  receiverInfo?: ReceiverInfo;
}

export interface MyBookingApiResponseWrapper {
  success: boolean;
  data: MyBookingApiResponse[];
}