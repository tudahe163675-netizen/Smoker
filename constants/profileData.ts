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

export const mockPosts = [
  {
    id: '1',
    content: 'Mojito phiên bản mới với bạc hà tươi từ Đà Lạt. Ai đã thử chưa?',
    images: ['https://picsum.photos/400/300?random=10'],
    likes: 156,
    comments: 23,
    createdAt: '2024-01-15T20:30:00Z',
  },
  {
    id: '2',
    content: 'Happy Hour hôm nay - Giảm 30% tất cả cocktail signature từ 17h-19h',
    images: [
      'https://picsum.photos/400/300?random=11',
      'https://picsum.photos/400/300?random=12',
      'https://picsum.photos/400/300?random=13',
      'https://picsum.photos/400/300?random=14'
    ],
    likes: 289,
    comments: 47,
    createdAt: '2024-01-14T16:00:00Z',
  },
  {
    id: '3',
    content: 'Buổi tối tuyệt vời với live band và không gian chill',
    images: ['https://picsum.photos/400/300?random=15'],
    likes: 203,
    comments: 31,
    createdAt: '2024-01-13T21:30:00Z',
  },
  {
    id: '4',
    content: 'Workshop pha chế cocktail cơ bản - Đăng ký ngay hôm nay!',
    images: [
      'https://picsum.photos/400/300?random=16',
      'https://picsum.photos/400/300?random=17'
    ],
    likes: 178,
    comments: 56,
    createdAt: '2024-01-12T14:00:00Z',
  },
  {
    id: '5',
    content: 'Menu mùa hè mới - 5 loại cocktail độc đáo với trái cây nhiệt đới',
    images: [
      'https://picsum.photos/400/300?random=18',
      'https://picsum.photos/400/300?random=19',
      'https://picsum.photos/400/300?random=20'
    ],
    likes: 342,
    comments: 68,
    createdAt: '2024-01-11T18:45:00Z',
  },
];