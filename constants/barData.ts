export interface BannerItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  discount: string;
}

export interface ComboItem {
  id: string;
  title: string;
  image: string;
  originalPrice: string;
  salePrice: string;
  category: string;
  items: string[];
  suitable: string;
  rating: number;
  reviews: number;
  isHot: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export const bannerData: BannerItem[] = [
  {
    id: "1",
    title: "Happy Hour 50% OFF",
    subtitle: "Mọi đồ uống từ 17h-19h",
    image: "https://picsum.photos/400/250?random=1",
    discount: "50%",
  },
  {
    id: "2",
    title: "Combo Sinh Nhật VIP",
    subtitle: "Miễn phí bánh kem + trang trí",
    image: "https://picsum.photos/400/250?random=2",
    discount: "FREE",
  },
  {
    id: "3",
    title: "Weekend Party",
    subtitle: "DJ live + Cocktail đặc biệt",
    image: "https://picsum.photos/400/250?random=3",
    discount: "30%",
  },
];

export const combosData: ComboItem[] = [
  {
    id: "1",
    title: "COMBO ROMANTIC",
    image: "https://picsum.photos/300/240?random=10",
    originalPrice: "850.000đ",
    salePrice: "650.000đ",
    category: "couple",
    items: ["2 Cocktail đặc biệt", "Bánh ngọt", "Nến thơm"],
    suitable: "2-3 người",
    rating: 4.8,
    reviews: 124,
    isHot: true,
  },
  {
    id: "2",
    title: "COMBO FRIENDS",
    image: "https://picsum.photos/300/240?random=11",
    originalPrice: "1.200.000đ",
    salePrice: "950.000đ",
    category: "group",
    items: ["6 Bia craft", "Mix snack", "Karaoke 2h"],
    suitable: "4-6 người",
    rating: 4.6,
    reviews: 89,
    isHot: false,
  },
  {
    id: "3",
    title: "COMBO PREMIUM",
    image: "https://picsum.photos/300/240?random=12",
    originalPrice: "2.500.000đ",
    salePrice: "2.000.000đ",
    category: "vip",
    items: ["Whisky premium", "Hải sản", "Phòng VIP"],
    suitable: "6-10 người",
    rating: 4.9,
    reviews: 67,
    isHot: true,
  },
  {
    id: "4",
    title: "COMBO BIRTHDAY",
    image: "https://picsum.photos/300/240?random=13",
    originalPrice: "1.500.000đ",
    salePrice: "1.200.000đ",
    category: "party",
    items: ["Bánh kem", "Trang trí", "6 đồ uống"],
    suitable: "5-8 người",
    rating: 4.7,
    reviews: 156,
    isHot: false,
  },
  {
    id: "5",
    title: "COMBO BUSINESS",
    image: "https://picsum.photos/300/240?random=14",
    originalPrice: "1.800.000đ",
    salePrice: "1.500.000đ",
    category: "business",
    items: ["Wine premium", "Món Âu", "Không gian riêng"],
    suitable: "4-6 người",
    rating: 4.5,
    reviews: 43,
    isHot: false,
  },
];

export const categories: Category[] = [
  { id: 'all', name: 'Tất cả', icon: 'apps-outline' },
  { id: 'couple', name: 'Hẹn hò', icon: 'heart-outline' },
  { id: 'group', name: 'Nhóm bạn', icon: 'people-outline' },
  { id: 'vip', name: 'VIP', icon: 'diamond-outline' },
  { id: 'party', name: 'Tiệc tùng', icon: 'balloon-outline' },
  { id: 'business', name: 'Công việc', icon: 'briefcase-outline' },
];

export const getCategoryColor = (category: string): string => {
  const colors: Record<string, string> = {
    couple: '#ef4444',
    group: '#3b82f6',
    vip: '#f59e0b',
    party: '#8b5cf6',
    business: '#10b981',
  };
  return colors[category] || '#6b7280';
};