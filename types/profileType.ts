import { Role } from "@/constants/authData";

export interface UserProfileData {
  id: string;
  entityAccountId?: string;
  targetId?: string;
  type?: string;
  email: string;
  userName: string;
  role: Role;
  avatar: string;
  background: string;
  coverImage: string;
  phone: string;
  address: string;
  // Raw address fields (for AddressSelector)
  provinceId?: string;
  districtId?: string;
  wardId?: string;
  addressDetail?: string;
  addressObject?: any;
  addressData: AddressData | null;
  bio: string;
  gender: string | null;  // nếu backend không cố định thì để string | null
  // Performer pricing (DJ/Dancer) - may be present in /profile/{id} response
  pricePerHours?: number | string | null;
  pricePerSession?: number | string | null;
  status: string;         // "active", "inactive", ...
  createdAt: string;
}

export interface AddressData {
  province?: string;
  district?: string;
  ward?: string;
  street?: string;
}

export interface UpdateProfileRequestData {
  avatar?: UploadFile;
  background?: UploadFile;  // Thay đổi từ string sang UploadFile
  userName?: string;
  phone?: string;
  bio?: string;
  gender?: string;
  address?: string;  // JSON string format: {"detail":"...","provinceId":"...","districtId":"...","wardId":"..."}
}

export interface UploadFile {
  uri: string;   // URI local của ảnh/video
  name: string;  // Tên file, ví dụ "avatar.jpg"
  type: string;  // MIME type, ví dụ "image/jpeg"
}

export interface PublicProfileResponse {
  success: boolean;
  data?: PublicProfileData;
}

export interface PublicProfileData {
  entityId: string;
  entityAccountId: string;
  targetId: string;
  targetType: string;
  type: string;
  name: string;
  avatar: string;
  background: string;
  role: string;
  bio: string;
  contact: Contact;
}

export interface Contact {
  email: string;
  phone: string;
  address: string;
}


