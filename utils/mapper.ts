import {
  BarDetail,
  BarDetailApiResponse,
  BarItem,
  ComboItem,
  MyBooking,
  MyBookingApiResponse
} from "@/types/barType";
import { BarTable, BarTableApiResponse } from "@/types/tableType";

export const mapBarDetail = (api: BarDetailApiResponse): BarDetail => {
  return {
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
  };
};

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


/**
 * Map API table response to BarTable type
 */
export const mapBarTable = (apiTable: BarTableApiResponse): BarTable => {
  return {
    tableId: apiTable.BarTableId,
    barId: apiTable.BarId,
    tableName: apiTable.TableName,
    tableTypeName: apiTable.TableTypeName,
    depositPrice: apiTable.DepositPrice,
    status: apiTable.Status,
    color: apiTable.Color,
    capacity: 4, // Default capacity, can be updated if API provides this
  };
};

/**
 * Map array of API tables to BarTable array
 */
export const mapBarTableList = (apiTables: BarTableApiResponse[]): BarTable[] => {
  if (!apiTables || !Array.isArray(apiTables)) {
    return [];
  }
  return apiTables.map(mapBarTable);
};

export const mapMyBooking = (item: MyBookingApiResponse): MyBooking => {
  return {
    bookedScheduleId: item.BookedScheduleId,
    bookerId: item.BookerId,
    receiverId: item.ReceiverId,
    type: item.Type,
    totalAmount: item.TotalAmount,
    paymentStatus: item.PaymentStatus,
    scheduleStatus: item.ScheduleStatus,
    bookingDate: item.BookingDate,
    startTime: item.StartTime,
    endTime: item.EndTime,
    mongoDetailId: item.MongoDetailId,
    createdAt: item.created_at,
    detailSchedule: {
      _id: item.detailSchedule._id,
      table: Object.fromEntries(
        Object.entries(item.detailSchedule.Table || {}).map(([key, value]) => [
          key,
          {
            tableName: value.TableName,
            price: value.Price,
          },
        ])
      ),
      note: item.detailSchedule.Note || '',
      location: item.detailSchedule.Location || '',
      phone: item.detailSchedule.Phone || '',
      offeredPrice: item.detailSchedule.OfferedPrice || 0,
      performerRole: item.detailSchedule.PerformerRole || '',
      requesterRole: item.detailSchedule.RequesterRole || '',
      slots: item.detailSchedule.Slots || [],
      createdAt: item.detailSchedule.createdAt,
      updatedAt: item.detailSchedule.updatedAt,
    },
    receiverInfo: item.receiverInfo,
  };
};