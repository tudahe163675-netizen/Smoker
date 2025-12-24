export interface Notification {
    _id: string;
    type: 'like' | 'comment' | 'follow' | 'post' | 'mention';
    sender: {
        name: string;
        avatar: string;
    };
    senderEntityAccountId: string;
    senderEntityId: string;
    senderEntityType: string;

    receiver: any | null;
    receiverEntityAccountId: string;
    receiverEntityId: string;
    receiverEntityType: string;

    content: string;
    isRead: boolean;
    status: 'Read' | 'Unread';
    link: string;

    createdAt: string;
    updatedAt: string;
    time: string;
}

//
// export const notificationsData: Notification[] = [
//   {
//     id: '1',
//     type: 'like',
//     user: {
//       id: '1',
//       name: 'Nguyễn Văn A',
//       avatar: 'https://i.pravatar.cc/100?img=1',
//     },
//     content: 'đã thích bài viết của bạn',
//     time: '5 phút trước',
//     isRead: false,
//     postImage: 'https://picsum.photos/60/60?random=1',
//   },
//   {
//     id: '2',
//     type: 'comment',
//     user: {
//       id: '2',
//       name: 'Trần Thị B',
//       avatar: 'https://i.pravatar.cc/100?img=2',
//     },
//     content: 'đã bình luận bài viết của bạn: "Bài viết rất hay!"',
//     time: '10 phút trước',
//     isRead: false,
//     postImage: 'https://picsum.photos/60/60?random=2',
//   },
//   {
//     id: '3',
//     type: 'follow',
//     user: {
//       id: '3',
//       name: 'Lê Minh C',
//       avatar: 'https://i.pravatar.cc/100?img=3',
//     },
//     content: 'đã bắt đầu theo dõi bạn',
//     time: '30 phút trước',
//     isRead: true,
//   },
//   {
//     id: '4',
//     type: 'like',
//     user: {
//       id: '1',
//       name: 'Phạm Thị D',
//       avatar: 'https://i.pravatar.cc/100?img=4',
//     },
//     content: 'và 5 người khác đã thích bài viết của bạn',
//     time: '1 giờ trước',
//     isRead: true,
//     postImage: 'https://picsum.photos/60/60?random=4',
//   },
//   {
//     id: '5',
//     type: 'mention',
//     user: {
//       id: '2',
//       name: 'Hoàng Văn E',
//       avatar: 'https://i.pravatar.cc/100?img=5',
//     },
//     content: 'đã nhắc đến bạn trong một bình luận',
//     time: '2 giờ trước',
//     isRead: false,
//   },
//   {
//     id: '6',
//     type: 'post',
//     user: {
//       id: '3',
//       name: 'Vũ Thị F',
//       avatar: 'https://i.pravatar.cc/100?img=6',
//     },
//     content: 'đã đăng một bài viết mới',
//     time: '3 giờ trước',
//     isRead: true,
//     postImage: 'https://picsum.photos/60/60?random=6',
//   },
//   {
//     id: '7',
//     type: 'comment',
//     user: {
//       id: '1',
//       name: 'Đặng Minh G',
//       avatar: 'https://i.pravatar.cc/100?img=7',
//     },
//     content: 'đã trả lời bình luận của bạn',
//     time: '1 ngày trước',
//     isRead: true,
//     postImage: 'https://picsum.photos/60/60?random=7',
//   },
//   {
//     id: '8',
//     type: 'like',
//     user: {
//       id: '1',
//       name: 'Bùi Thị H',
//       avatar: 'https://i.pravatar.cc/100?img=8',
//     },
//     content: 'đã thích bình luận của bạn',
//     time: '2 ngày trước',
//     isRead: false,
//   },
// ];