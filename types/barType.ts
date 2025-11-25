
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
