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

// data/profileData.ts

export const mockUserProfile: UserProfile = {
  id: '1',
  name: 'Nguyễn Thành Nam',
  phone: '0123456789',
  bio: 'Yêu thích công nghệ và du lịch. Đam mê khám phá những điều mới mẻ.',
  avatar: 'https://i.pravatar.cc/150?img=10',
  coverImage: 'https://picsum.photos/400/200?random=1',
  location: 'Hà Nội, Việt Nam',
  website: 'https://mywebsite.com',
  tiktok: '@username',
  facebook: 'facebook.com/username',
  instagram: '@username',
  posts: 42,
  followers: 1205,
  following: 356,
  balance: 1250000, // 1,250,000 VND
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

export const mockPosts = [
  {
    id: '1',
    content: 'Hôm nay thật là một ngày tuyệt vời! 🌞',
    images: ['https://picsum.photos/400/300?random=1'],
    likes: 24,
    comments: 5,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: '2',
    content: 'Cafe buổi sáng ☕',
    images: ['https://picsum.photos/400/300?random=2', 'https://picsum.photos/400/300?random=3'],
    likes: 18,
    comments: 3,
    createdAt: '2024-01-14T08:00:00Z',
  },
  {
    id: '3',
    content: 'Sunset view 🌅',
    images: ['https://picsum.photos/400/300?random=4'],
    likes: 45,
    comments: 12,
    createdAt: '2024-01-13T18:30:00Z',
  },
];