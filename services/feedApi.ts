import { CreateCommentData, CreatePostData, Post, User } from "@/constants/feedData";
import { CommentData } from "@/types/commentType";
import { PostData } from "@/types/postType";
import { API_CONFIG } from "./apiConfig";

interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message: string;
    error?: string;
}

export class FeedApiService {
    private token: string;

    constructor(token: string) {
        this.token = token;
    }

    private async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        try {

            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`,
                    ...options.headers,
                },
                ...options,
            });

            const data = await response.json();

            // Handle 409 Conflict (Already following) gracefully
            if (response.status === 409) {
                return {
                    success: false,
                    message: data.message || 'Already following',
                    error: data.message || 'Already following',
                    data: data.data || { isFollowing: true } // Return isFollowing: true for 409
                };
            }

            if (!response.ok) {
                throw new Error(data.message || 'API request failed');
            }

            // If response is ok but doesn't have success field, add it
            if (response.ok && data.success === undefined) {
                return {
                    ...data,
                    success: true,
                };
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async getCurrentUserId(): Promise<ApiResponse<string>> {
        try {
            const response = await this.makeRequest<{ userId: string }>('/auth/current-user');
            if (response.success && response.data) {
                return {success: true, data: response.data.userId, message: 'Lấy user ID thành công'};
            }
            return {success: false, message: 'Không thể lấy user ID', error: 'No user ID found'};
        } catch (error) {
            console.error('Error getting current user ID:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async getFeedPosts(page: number = 1, limit: number = 10): Promise<ApiResponse<Post[]>> {
        return this.makeRequest<Post[]>(`/posts?page=${page}&limit=${limit}&includeMedias=true&includeMusic=true`);
    }

    async uploadPostMedia(files: { uri: string; type: 'image' | 'video' }[]): Promise<ApiResponse<Array<{
        url: string;
        secure_url: string;
        public_id: string;
        format: string;
        type: string
    }>>> {
        const formData = new FormData();

        files.forEach((file, index) => {
            const fileExtension = file.uri.split('.').pop()?.toLowerCase() || 'jpg';
            const mimeType = file.type === 'video'
                ? `video/${fileExtension}`
                : `image/${fileExtension}`;

            const fieldName = file.type === 'video' ? 'videos' : 'images';

            formData.append(fieldName, {
                uri: file.uri,
                type: mimeType,
                name: `${file.type}_${Date.now()}_${index}.${fileExtension}`,
            } as any);
        });

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}/posts/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Upload failed');
            }

            return data;
        } catch (error) {
            console.error('Upload Error:', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error occurred',
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    async createPost(postData: CreatePostData): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/posts', {
            method: 'POST',
            body: JSON.stringify(postData),
        });
    }
    async rePost(repost: any): Promise<ApiResponse<any>> {
        return this.makeRequest<any>('/posts', {
            method: 'POST',
            body: JSON.stringify(repost),
        });
    }

    async likePost(postId: string): Promise<ApiResponse<{ liked: boolean; }>> {
        return this.makeRequest<{ liked: boolean; }>(`/posts/${postId}/like`, {
            method: 'POST',
        });
    }

    async getPostDetails(postId: string): Promise<ApiResponse<PostData>> {
        return this.makeRequest<PostData>(`/posts/${postId}?includeMedias=true&includeMusic=true`);
    }

    async updatePost(postId: string, postData: { content?: string; status?: string; images?: any; videos?: any; medias?: any[] }): Promise<ApiResponse<Post>> {
        return this.makeRequest<Post>(`/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(postData),
        });
    }

    async deletePost(postId: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/posts/${postId}`, {
            method: 'DELETE',
        });
    }

    async trashPost(postId: string, data: { entityAccountId: string }): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/posts/${postId}/trash`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getTrashedPosts(params?: { page?: number; limit?: number; entityAccountId?: string }): Promise<ApiResponse<Post[]>> {
        const queryParams = new URLSearchParams();
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.limit) queryParams.append('limit', params.limit.toString());
        if (params?.entityAccountId) queryParams.append('entityAccountId', params.entityAccountId);
        const queryString = queryParams.toString();
        return this.makeRequest<Post[]>(`/posts/trash${queryString ? `?${queryString}` : ''}`);
    }

    async restorePost(postId: string, data?: { entityAccountId: string }): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/posts/${postId}/restore`, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        });
    }

    async getPostComments(postId: string): Promise<ApiResponse<Comment[]>> {
        return this.makeRequest<Comment[]>(`/posts/${postId}/comments`);
    }

    async createComment(commentData: CreateCommentData, postId: string): Promise<ApiResponse<CommentData>> {
        return this.makeRequest<CommentData>(`/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify(commentData),
        });
    }

    async likeComment(postId: string, commentId: string): Promise<ApiResponse<{ liked: boolean; likesCount: number }>> {
        return this.makeRequest<{ liked: boolean; likesCount: number }>(`/posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
        });
    }

    async addReply(postId: string, commentId: string, replyData: any): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(`/posts/${postId}/comments/${commentId}/replies`, {
            method: 'POST',
            body: JSON.stringify(replyData),
        });
    }

    async addReplyToReply(postId: string, commentId: string, replyId: string, replyData: any): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(`/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
            method: 'POST',
            body: JSON.stringify(replyData),
        });
    }

    async likeReply(postId: string, commentId: string, replyId: string): Promise<ApiResponse<{ liked: boolean }>> {
        return this.makeRequest<{ liked: boolean }>(`/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
            method: 'POST',
        });
    }

    async unlikeReply(postId: string, commentId: string, replyId: string): Promise<ApiResponse<{ liked: boolean }>> {
        return this.makeRequest<{ liked: boolean }>(`/posts/${postId}/comments/${commentId}/replies/${replyId}/like`, {
            method: 'DELETE',
        });
    }

    async updateReply(postId: string, commentId: string, replyId: string, data: { content: string }): Promise<ApiResponse<any>> {
        return this.makeRequest<any>(`/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deleteReply(postId: string, commentId: string, replyId: string): Promise<ApiResponse<null>> {
        return this.makeRequest<null>(`/posts/${postId}/comments/${commentId}/replies/${replyId}`, {
            method: 'DELETE',
        });
    }

    async getUserProfile(userId: string): Promise<ApiResponse<User>> {
        return this.makeRequest<User>(`/users/${userId}`);
    }

    async getViewInformation(userId: string): Promise<ApiResponse<User>> {
        // Use /profile/{entityId} endpoint like web
        return this.makeRequest<User>(`/profile/${userId}`);
    }

    async getUserPosts(accountId: string): Promise<ApiResponse<Post[]>> {
        return this.makeRequest<Post[]>(`/posts/author/${accountId}?includeMedias=true&includeMusic=true`,{method: 'GET'});
    }

    async getFollowers(accountId: string): Promise<ApiResponse<Post[]>> {
        return this.makeRequest<Post[]>(`/follow/followers/${accountId}`,{method: 'GET'});
    }
    async getFollowing(accountId: string): Promise<ApiResponse<Post[]>> {
        return this.makeRequest<Post[]>(`/follow/following/${accountId}`,{method: 'GET'});
    }

    async followUser(followerId: string, followingId: string, followingType: string): Promise<ApiResponse<{
        isFollowing: boolean
    }>> {
        // Validate required fields
        if (!followerId || !followingId || !followingType) {
            console.error('[FeedApi] Missing required fields for followUser:', {
                hasFollowerId: !!followerId,
                hasFollowingId: !!followingId,
                hasFollowingType: !!followingType
            });
            return {
                success: false,
                message: 'Missing required fields: followerId, followingId, and followingType are required.',
                error: 'Missing required fields'
            };
        }
        
        console.log('[FeedApi] followUser request:', {
            followerId,
            followingId,
            followingType
        });
        
        return this.makeRequest<{ isFollowing: boolean }>(`/follow/follow`, {
            method: 'POST',
            body: JSON.stringify({
                followerId: String(followerId).trim(),
                followingId: String(followingId).trim(),
                followingType: String(followingType).trim(),
            })
        });
    }
    async unFollowUser(followerId: string, followingId: string): Promise<ApiResponse<{
        isFollowing: boolean
    }>> {
        return this.makeRequest<{ isFollowing: boolean }>(`/follow/unfollow`, {
            method: 'POST',
            body: JSON.stringify({
                followerId,
                followingId
            })
        });
    }

    async checkFollow(followerId: string, followingId: string): Promise<ApiResponse<{
        isFollowing: boolean
    }>> {
        return this.makeRequest<{ isFollowing: boolean }>(`/follow/check?followerId=${followerId}&followingId=${followingId}`, {
            method: 'GET'
        });
    }

    async uploadImage(imageUri: string): Promise<ApiResponse<{ imageUrl: string }>> {
        const formData = new FormData();
        formData.append('image', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `image_${Date.now()}.jpg`,
        } as any);

        return this.makeRequest<{ imageUrl: string }>('/upload/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            body: formData,
        });
    }

    async reportPost(postId: string, reportData: {
        reason: string;
        details?: string;
        reporterId: string;
        reporterRole: string;
        targetOwnerId?: string;
    }): Promise<ApiResponse<null>> {
        return this.makeRequest<null>('/reports', {
            method: 'POST',
            body: JSON.stringify({
                ReporterId: reportData.reporterId,
                ReporterRole: reportData.reporterRole,
                TargetType: 'post',
                TargetId: postId,
                TargetOwnerId: reportData.targetOwnerId,
                Reason: reportData.reason,
                Description: reportData.details || '',
                Status: 'Pending',
            }),
        });
    }
}