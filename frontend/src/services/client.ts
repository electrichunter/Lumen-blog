'use client';

import { API_BASE_URL, Token, User, UserCreate, Post, PostsPage, PostCreate, FileUpload } from './api';

class ApiClient {
    private accessToken: string | null = null;

    setToken(token: string | null) {
        this.accessToken = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    getToken(): string | null {
        if (this.accessToken) return this.accessToken;
        if (typeof window !== 'undefined') {
            this.accessToken = localStorage.getItem('access_token');
        }
        return this.accessToken;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || 'Request failed');
        }

        if (response.status === 204) {
            return {} as T;
        }

        return response.json();
    }

    // Auth endpoints
    async register(data: UserCreate): Promise<User> {
        return this.request<User>('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(email: string, password: string): Promise<Token> {
        const formData = new URLSearchParams();
        formData.append('username', email);
        formData.append('password', password);

        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Login failed' }));
            throw new Error(error.detail);
        }

        const token = await response.json();
        this.setToken(token.access_token);
        localStorage.setItem('refresh_token', token.refresh_token);
        return token;
    }

    async logout() {
        this.setToken(null);
        localStorage.removeItem('refresh_token');
    }

    async getCurrentUser(): Promise<User> {
        return this.request<User>('/api/auth/me');
    }

    async refreshToken(): Promise<Token> {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const token = await this.request<Token>('/api/auth/refresh', {
            method: 'POST',
            body: JSON.stringify({ refresh_token: refreshToken }),
        });

        this.setToken(token.access_token);
        localStorage.setItem('refresh_token', token.refresh_token);
        return token;
    }

    // Posts endpoints
    async getPosts(page = 1, size = 10): Promise<PostsPage> {
        return this.request<PostsPage>(`/api/posts?page=${page}&size=${size}`);
    }

    async getPostBySlug(slug: string): Promise<Post> {
        return this.request<Post>(`/api/posts/${slug}`);
    }

    async getMyPosts(): Promise<Post[]> {
        return this.request<Post[]>('/api/posts/my');
    }

    async createPost(data: PostCreate): Promise<Post> {
        return this.request<Post>('/api/posts', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePost(postId: string, data: Partial<PostCreate>): Promise<Post> {
        return this.request<Post>(`/api/posts/${postId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async deletePost(postId: string): Promise<void> {
        return this.request<void>(`/api/posts/${postId}`, {
            method: 'DELETE',
        });
    }

    async searchPosts(query: string, page = 1, size = 10, tag?: string): Promise<PostsPage> {
        let url = `/api/posts/search?q=${encodeURIComponent(query)}&page=${page}&size=${size}`;
        if (tag) {
            url += `&tag=${encodeURIComponent(tag)}`;
        }
        return this.request<PostsPage>(url);
    }

    // Comments & Interactions
    async getComments(postId: string, page = 1): Promise<import('./api').Comment[]> {
        return this.request<import('./api').Comment[]>(`/api/posts/${postId}/comments?page=${page}`);
    }

    async getReplies(postId: string, commentId: string, page = 1): Promise<import('./api').Comment[]> {
        return this.request<import('./api').Comment[]>(`/api/posts/${postId}/comments/${commentId}/replies?page=${page}`);
    }

    async createComment(postId: string, data: import('./api').CommentCreate): Promise<import('./api').Comment> {
        return this.request<import('./api').Comment>(`/api/posts/${postId}/comments`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async deleteComment(postId: string, commentId: string): Promise<void> {
        return this.request<void>(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
        });
    }

    async likePost(postId: string, claps = 1): Promise<import('./api').LikeResponse> {
        return this.request<import('./api').LikeResponse>(`/api/posts/${postId}/like`, {
            method: 'POST',
            body: JSON.stringify({ clap_count: claps }),
        });
    }

    async getPostLikes(postId: string): Promise<import('./api').PostLikeStats> {
        return this.request<import('./api').PostLikeStats>(`/api/posts/${postId}/likes`);
    }

    // Bookmarks
    async bookmarkPost(postId: string): Promise<import('./api').BookmarkResponse> {
        return this.request<import('./api').BookmarkResponse>(`/api/posts/${postId}/bookmark`, {
            method: 'POST'
        });
    }

    async removeBookmark(postId: string): Promise<void> {
        return this.request<void>(`/api/posts/${postId}/bookmark`, {
            method: 'DELETE'
        });
    }

    async checkBookmark(postId: string): Promise<import('./api').BookmarkStatus> {
        return this.request<import('./api').BookmarkStatus>(`/api/posts/${postId}/bookmark`);
    }

    async getMyBookmarks(): Promise<import('./api').BookmarkResponse[]> {
        return this.request<import('./api').BookmarkResponse[]>('/api/bookmarks');
    }

    // Follow
    async followUser(userId: string): Promise<import('./api').FollowResponse> {
        return this.request<import('./api').FollowResponse>(`/api/users/${userId}/follow`, {
            method: 'POST'
        });
    }

    async unfollowUser(userId: string): Promise<void> {
        return this.request<void>(`/api/users/${userId}/follow`, {
            method: 'DELETE'
        });
    }

    async checkFollowStatus(userId: string): Promise<import('./api').FollowStatus> {
        return this.request<import('./api').FollowStatus>(`/api/users/${userId}/follow`);
    }

    async getUserFollowStats(userId: string): Promise<import('./api').UserFollowStats> {
        return this.request<import('./api').UserFollowStats>(`/api/users/${userId}/stats`);
    }

    // Upload endpoints
    async uploadFile(file: File): Promise<FileUpload> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.getToken();
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }

        return response.json();
    }

    async uploadImage(file: File): Promise<FileUpload> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.getToken();
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/upload/image`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }

        return response.json();
    }

    async uploadAudio(file: File): Promise<FileUpload> {
        const formData = new FormData();
        formData.append('file', file);

        const token = this.getToken();
        const headers: HeadersInit = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/upload/audio`, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
            throw new Error(error.detail);
        }

        return response.json();
    }

    async uploadVideo(file: File): Promise<FileUpload> {
        // Use generic upload for now as there is no specific /api/upload/video
        return this.uploadFile(file);
    }
}

export const apiClient = new ApiClient();
