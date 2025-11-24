export interface AddressData {
  provinceId: string;
  districtId: string;
  wardId: string;
  fullAddress: string;
}

/**
 * Data của một bar trong list (/api/bar)
 */
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

/**
 * Response list bar (/api/bar)
 */
export interface BarListResponse {
  status: string;
  data: BarItem[];
}

/**
 * Data của bar detail (/api/bar/:id)
 * API trả về key viết hoa nên ta convert về camelCase
 */
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

/**
 * Response detail bar
 */
export interface BarDetailResponse {
  status: string;
  data: BarDetail;
}

/**
 * Combo item (/api/combo/bar/:id)
 */
export interface ComboItem {
  comboId: string;
  comboName: string;
  barId: string;
  tableApplyId: string | null;
  voucherApplyId: string | null;
  price: number;
}

/**
 * Response combo list
 */
export interface ComboListResponse {
  status: string;
  data: ComboItem[];
}
