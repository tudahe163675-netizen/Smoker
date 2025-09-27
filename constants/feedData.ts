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
    name: 'Nguyen Van A',
    username: '@nguyenvana',
    avatar: 'https://i.pravatar.cc/100?img=1',
    coverImage: 'https://picsum.photos/400/200?random=1',
    bio: 'Yêu thích nhiếp ảnh và du lịch',
    followers: 1205,
    following: 356,
    posts: 42,
    isFollowing: false,
  },
  {
    id: '2',
    name: 'Nguyen Van B',
    username: '@nguyenvanb',
    avatar: 'https://i.pravatar.cc/100?img=2',
    coverImage: 'https://picsum.photos/400/200?random=2',
    bio: 'Food lover & travel enthusiast',
    followers: 856,
    following: 234,
    posts: 28,
    isFollowing: true,
  },
  {
    id: '3',
    name: 'Nguyen Van C',
    username: '@nguyenvanc',
    avatar: 'https://i.pravatar.cc/100?img=3',
    coverImage: 'https://picsum.photos/400/200?random=3',
    bio: 'Tech enthusiast & coffee addict',
    followers: 567,
    following: 123,
    posts: 35,
    isFollowing: false,
  },
  {
    id: '4',
    name: 'Nguyen Van D',
    username: '@nguyenvand',
    avatar: 'https://i.pravatar.cc/100?img=4',
    coverImage: 'https://picsum.photos/400/200?random=4',
    bio: 'Learning new things everyday',
    followers: 324,
    following: 89,
    posts: 16,
    isFollowing: false,
  },
  {
    id: '10',
    name: 'Bạn',
    username: '@me',
    avatar: 'https://i.pravatar.cc/100?img=10',
    coverImage: 'https://picsum.photos/400/200?random=10',
    bio: 'This is me!',
    followers: 1250,
    following: 356,
    posts: 42,
    isFollowing: false,
  },
];

export const mockComments: Comment[] = [
  {
    id: 'c1',
    userId: '2',
    user: mockUsers[1],
    content: 'Bức ảnh rất đẹp!',
    createdAt: '2024-01-15T10:30:00Z',
    likes: 5,
    isLiked: false,
  },
  {
    id: 'c2',
    userId: '3',
    user: mockUsers[2],
    content: 'Địa điểm này ở đâu vậy bạn?',
    createdAt: '2024-01-15T11:00:00Z',
    likes: 2,
    isLiked: true,
  },
  {
    id: 'c3',
    userId: '4',
    user: mockUsers[3],
    content: 'Cảm ơn bạn đã chia sẻ!',
    createdAt: '2024-01-15T11:30:00Z',
    likes: 1,
    isLiked: false,
  },
];

export const mockPosts: Post[] = [
  {
    id: '1',
    userId: '1',
    user: mockUsers[0],
    content: 'Hôm nay thật đẹp trời! Đi dạo công viên và chụp được vài tấm ảnh đẹp.',
    images: ['https://picsum.photos/400/300?random=1'],
    likes: 24,
    isLiked: false,
    comments: [mockComments[0], mockComments[1]],
    commentsCount: 5,
    shares: 3,
    createdAt: '2024-01-15T09:00:00Z',
    location: 'Công viên Thống Nhất, Hà Nội',
  },
  {
    id: '2',
    userId: '2',
    user: mockUsers[1],
    content: 'Vừa ăn món ngon tại quán mới! Ai có muốn thử không?',
    images: ['https://picsum.photos/400/300?random=2', 'https://picsum.photos/400/300?random=12'],
    likes: 18,
    isLiked: true,
    comments: [mockComments[2]],
    commentsCount: 3,
    shares: 1,
    createdAt: '2024-01-15T12:00:00Z',
    location: 'Quán Cơm Tấm Sài Gòn',
  },
  {
    id: '3',
    userId: '3',
    user: mockUsers[2],
    content: 'Cuối tuần đi du lịch cùng gia đình. Thời gian bên nhau thật quý giá!',
    images: ['https://picsum.photos/400/300?random=3', 'https://picsum.photos/400/300?random=13', 'https://picsum.photos/400/300?random=23'],
    likes: 35,
    isLiked: false,
    comments: [],
    commentsCount: 8,
    shares: 5,
    createdAt: '2024-01-14T15:30:00Z',
    location: 'Đà Lạt, Lâm Đồng',
  },
  {
    id: '4',
    userId: '4',
    user: mockUsers[3],
    content: 'Học được nhiều điều mới hôm nay. Không ngừng học hỏi là chìa khóa thành công!',
    images: ['https://picsum.photos/400/300?random=4'],
    likes: 12,
    isLiked: false,
    comments: [],
    commentsCount: 2,
    shares: 0,
    createdAt: '2024-01-14T18:45:00Z',
  },
];

export const getUserById = (userId: string): User | undefined => {
  return mockUsers.find(user => user.id === userId);
};

export const getPostsByUserId = (userId: string): Post[] => {
  return mockPosts.filter(post => post.userId === userId);
};