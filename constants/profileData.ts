export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  bio: string;
  avatar: string;
  coverImage: string;
  location: string;
  website: string;
  tiktok: string;
  facebook: string;
  instagram: string;
  posts: number;
  followers: number;
  following: number;
  balance: number;
}

export interface TopUpOption {
  id: string;
  amount: number;
  bonus?: number;
  popular?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
}

export const mockUserProfile: UserProfile = {
  id: '1',
  name: 'Nguyễn Minh Tuấn',
  phone: '0987654321',
  bio: 'Bartender chuyên nghiệp | Yêu thích pha chế cocktail sáng tạo',
  avatar: 'https://i.pravatar.cc/150?img=12',
  coverImage: 'https://picsum.photos/400/200?random=bar',
  location: 'Quận 1, TP.HCM',
  website: 'https://skybar-saigon.com',
  tiktok: '@bartender_pro',
  facebook: 'facebook.com/bartender.tuanminh',
  instagram: '@mixology_master',
  posts: 68,
  followers: 2450,
  following: 189,
  balance: 850000,
};

export const topUpOptions: TopUpOption[] = [
  { id: '1', amount: 50000 },
  { id: '2', amount: 100000 },
  { id: '3', amount: 200000, bonus: 10000, popular: true },
  { id: '4', amount: 500000, bonus: 50000 },
  { id: '5', amount: 1000000, bonus: 150000 },
  { id: '6', amount: 2000000, bonus: 400000 },
];

export const paymentMethods: PaymentMethod[] = [
  {
    id: 'bank_transfer',
    name: 'Chuyển khoản ngân hàng',
    icon: 'card-outline',
    description: 'Chuyển khoản qua ATM hoặc Internet Banking',
    enabled: true,
  },
  {
    id: 'momo',
    name: 'Ví MoMo',
    icon: 'wallet-outline',
    description: 'Thanh toán qua ví điện tử MoMo',
    enabled: true,
  },
  {
    id: 'zalopay',
    name: 'ZaloPay',
    icon: 'phone-portrait-outline',
    description: 'Thanh toán qua ví điện tử ZaloPay',
    enabled: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay',
    icon: 'credit-card-outline',
    description: 'Thanh toán qua VNPay',
    enabled: true,
  },
];

export const fieldLabels: { [key: string]: string } = {
  name: 'Tên',
  bio: 'Tiểu sử',
  location: 'Địa điểm',
  website: 'Website',
  phone: 'Số điện thoại',
  tiktok: 'TikTok',
  facebook: 'Facebook',
  instagram: 'Instagram',
};