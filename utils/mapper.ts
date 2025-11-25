import {
  BarDetail,
  BarDetailApiResponse,
  BarItem,
  ComboItem
} from "@/types/barType";

export const mapBarDetail = (api: BarDetailApiResponse): BarDetail => ({
  barPageId: api.BarPageId,
  accountId: api.AccountId,
  barName: api.BarName,
  avatar: api.Avatar,
  background: api.Background,
  address: api.Address,
  phoneNumber: api.PhoneNumber,
  role: api.Role,
  email: api.Email,
  status: api.Status,
  createdAt: api.created_at,
  entityAccountId: api.EntityAccountId,
  addressData: api.addressData,
});

export const mapBarItem = (api: any): BarItem => ({
  barPageId: api.BarPageId,
  accountId: api.AccountId,
  barName: api.BarName,
  avatar: api.Avatar,
  background: api.Background,
  address: api.Address,
  addressData: api.addressData || null,
  phoneNumber: api.PhoneNumber,
  email: api.Email,
  role: api.Role,
  reviewCount: api.ReviewCount,
  averageRating: api.AverageRating,
  entityAccountId: api.EntityAccountId,
  createdAt: api.created_at,
});

export const mapComboItem = (api: any): ComboItem => ({
  comboId: api.ComboId,
  comboName: api.ComboName,
  barId: api.BarId,
  tableApplyId: api.TableApplyId,
  voucherApplyId: api.VoucherApplyId,
  price: api.Price,
});

export const mapComboList = (list: any[]): ComboItem[] =>
  list.map((item) => mapComboItem(item));

