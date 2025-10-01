export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  coverImage?: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  isFollowing?: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  content: string;
  images: string[];
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  commentsCount: number;
  shares: number;
  createdAt: string;
  location?: string;
}

export interface CreatePostData {
  content: string;
  images: string[];
  location?: string;
}

export interface CreateCommentData {
  postId: string;
  content: string;
  parentCommentId?: string;
}

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'DJ Mike Trần',
    username: '@djmiketran',
    avatar: 'https://i.pravatar.cc/100?img=1',
    coverImage: 'https://picsum.photos/400/200?random=1',
    bio: 'Resident DJ @ SkyBar | House & Techno lover',
    followers: 3205,
    following: 456,
    posts: 127,
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Linh Nguyễn',
    username: '@mixologist_linh',
    avatar: 'https://i.pravatar.cc/100?img=2',
    coverImage: 'https://picsum.photos/400/200?random=2',
    bio: 'Bartender chuyên nghiệp | Đam mê pha chế cocktail',
    followers: 2856,
    following: 534,
    posts: 89,
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Khánh Vũ',
    username: '@khanh_dancer',
    avatar: 'https://i.pravatar.cc/100?img=3',
    coverImage: 'https://picsum.photos/400/200?random=3',
    bio: 'Professional dancer | Cháy hết mình trên sàn nhảy',
    followers: 4567,
    following: 823,
    posts: 156,
    isFollowing: false,
  },
  {
    id: '4',
    name: 'Tuấn Nguyễn',
    username: '@tuan_nightlife',
    avatar: 'https://i.pravatar.cc/100?img=4',
    coverImage: 'https://picsum.photos/400/200?random=4',
    bio: 'Party lover | Khám phá các quán bar mới mỗi tuần',
    followers: 1324,
    following: 289,
    posts: 64,
    isFollowing: false,
  },
  {
    id: '10',
    name: 'Bạn',
    username: '@me',
    avatar: 'https://i.pravatar.cc/100?img=10',
    coverImage: 'https://picsum.photos/400/200?random=10',
    bio: 'Khách hàng thân thiết | Yêu thích không gian bar',
    followers: 456,
    following: 187,
    posts: 28,
    isFollowing: false,
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    userId: '2',
    user: mockUsers[1],
    content: 'Set nhạc hôm qua quá đỉnh! Khi nào chơi tiếp?',
    createdAt: '2024-01-15T22:30:00Z',
    likes: 15,
    isLiked: false,
  },
  {
    id: 'c2',
    userId: '3',
    user: mockUsers[2],
    content: 'Cocktail này làm thế nào vậy? Trông hấp dẫn quá!',
    createdAt: '2024-01-15T21:00:00Z',
    likes: 8,
    isLiked: true,
  },
  {
    id: 'c3',
    userId: '4',
    user: mockUsers[3],
    content: 'Tối nay có đi không? Nhóm mình book bàn rồi',
    createdAt: '2024-01-15T19:30:00Z',
    likes: 3,
    isLiked: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    content: 'Đêm nay sẽ drop set House mới! Ai có mặt tại SkyBar nhớ lên rooftop nhé',
    images: ['https://picsum.photos/400/300?random=1'],
    likes: 234,
    isLiked: false,
    comments: [mockComments[0], mockComments[1]],
    commentsCount: 18,
    shares: 12,
    createdAt: '2024-01-15T18:00:00Z',
    location: 'SkyBar Rooftop - Quận 1',
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    content: 'Menu cocktail mùa hè mới - "Tropical Sunset" với vị chanh dây và bạc hà. Ai muốn thử không?',
    images: ['https://picsum.photos/400/300?random=2', 'https://picsum.photos/400/300?random=12'],
    likes: 189,
    isLiked: true,
    comments: [mockComments[2]],
    commentsCount: 23,
    shares: 8,
    createdAt: '2024-01-15T17:00:00Z',
    location: 'SkyBar - Quận 1',
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    content: 'Performance đêm qua tại The Myst. Cảm ơn mọi người đã cháy cùng tôi!',
    images: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=13', 'https://picsum.photos/400/300?random=23'],
    likes: 456,
    isLiked: false,
    comments: [],
    commentsCount: 34,
    shares: 21,
    createdAt: '2024-01-14T23:30:00Z',
    location: 'The Myst Club - TP.HCM',
  },
  {
    id: '4',
    userId: '4',
    user: mockUsers[3],
    content: 'Happy Hour tối nay! Giảm 40% toàn bộ đồ uống từ 17h-19h. Ai rủ đi không?',
    images: ['https://picsum.photos/400/300?random=4'],
    likes: 167,
    isLiked: false,
    comments: [],
    commentsCount: 15,
    shares: 9,
    createdAt: '2024-01-15T15:45:00Z',
    location: 'Chill Bar & Lounge',
  },
];

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

export const getPostsByUserId = (userId: string): Post[] => {
  return mockPosts.filter(post => post.userId === userId);
};