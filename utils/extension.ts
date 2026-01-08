export const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Vừa xong';
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    return `${Math.floor(diffInHours / 24)} ngày trước`;
};
export const formatReviewTime = (dateString: string) => {
    const date = new Date(dateString);

    const pad = n => n.toString().padStart(2, "0");

    return `${pad(date.getHours())}:${pad(date.getMinutes())} ${pad(date.getDate())}/${pad(date.getMonth()+1)}/${date.getFullYear()}`;
};

export const CountItem = (data: object) => {
    return Object.keys(data).length;
}

const phoneRegex = /^(0|\+84)(3|5|7|8|9)[0-9]{8}$/;
export const isValidPhone = (phone: string) => phoneRegex.test(phone);

export const isStoryValid = (createdAt: string): boolean => {
    const storyDate = new Date(createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
};