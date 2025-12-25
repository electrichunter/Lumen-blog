'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/services/auth-context';
import { apiClient } from '@/services/client';
import { Post, BookmarkResponse } from '@/services/api';

export default function DashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const [posts, setPosts] = useState<Post[]>([]);
    const [bookmarks, setBookmarks] = useState<BookmarkResponse[]>([]);
    const [stats, setStats] = useState({ followers: 0, following: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'posts' | 'bookmarks'>('posts');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.id) return;
            try {
                const [myPosts, myBookmarks, userStats] = await Promise.all([
                    apiClient.getMyPosts(),
                    apiClient.getMyBookmarks(),
                    apiClient.getUserFollowStats(user.id)
                ]);
                setPosts(myPosts);
                setBookmarks(myBookmarks);
                setStats({ followers: userStats.followers_count, following: userStats.following_count });
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (isAuthenticated) {
            fetchDashboardData();
        }
    }, [isAuthenticated, user?.id]);

    const handleDelete = async (postId: string) => {
        if (!confirm('Bu yazıyı silmek istediğinizden emin misiniz?')) return;

        try {
            await apiClient.deletePost(postId);
            setPosts(posts.filter(p => p.id !== postId));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRemoveBookmark = async (postId: string) => {
        try {
            await apiClient.removeBookmark(postId);
            setBookmarks(bookmarks.filter(b => b.post_id !== postId));
        } catch (err) {
            console.error(err);
        }
    }

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center text-xl font-bold text-violet-600 dark:text-violet-400">
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt={user.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                user?.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user?.full_name || user?.username}</h1>
                            <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                                <span>{stats.followers} Takipçi</span>
                                <span>{stats.following} Takip Edilen</span>
                            </div>
                        </div>
                    </div>
                    <Link
                        href="/write"
                        className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-violet-500/25 transition-all text-center"
                    >
                        Yeni Yazı Oluştur
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{posts.length}</p>
                                <p className="text-gray-500 dark:text-gray-400">Toplam Yazı</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {posts.filter(p => p.status === 'published').length}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">Yayınlanan</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {posts.reduce((acc, p) => acc + p.view_count, 0)}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400">Görüntülenme</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab('posts')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'posts'
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                    >
                        Yazılarım
                        {activeTab === 'posts' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('bookmarks')}
                        className={`pb-4 px-2 font-medium transition-colors relative ${activeTab === 'bookmarks'
                            ? 'text-violet-600 dark:text-violet-400'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            }`}
                    >
                        Okuma Listem
                        {activeTab === 'bookmarks' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-violet-600 dark:bg-violet-400 rounded-t-full" />
                        )}
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                    {isLoading ? (
                        <div className="p-12 text-center">
                            <div className="animate-spin w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full mx-auto" />
                        </div>
                    ) : (
                        activeTab === 'posts' ? (
                            // Posts List
                            posts.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">Henüz yazınız yok</p>
                                    <Link href="/write" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                                        İlk yazınızı oluşturun
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {posts.map((post) => (
                                        <div key={post.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <Link href={`/post/${post.slug}`} className="block">
                                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate hover:text-violet-600 dark:hover:text-violet-400">
                                                        {post.title}
                                                    </h3>
                                                </Link>
                                                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${post.status === 'published'
                                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                                                        }`}>
                                                        {post.status === 'published' ? 'Yayında' : 'Taslak'}
                                                    </span>
                                                    <span>{post.view_count} görüntülenme</span>
                                                    <span>{new Date(post.created_at).toLocaleDateString('tr-TR')}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2 ml-4">
                                                <Link href={`/write?edit=${post.id}`} className="p-2 text-gray-400 hover:text-violet-500 transition-colors">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(post.id)}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ) : (
                            // Bookmarks List
                            bookmarks.length === 0 ? (
                                <div className="p-12 text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">Henüz kaydedilmiş yazınız yok</p>
                                    <Link href="/" className="text-violet-600 dark:text-violet-400 font-medium hover:underline">
                                        Yazıları keşfet
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {bookmarks.map((bookmark) => {
                                        const post = bookmark.post;
                                        if (!post) return null; // Should not happen with new backend logic

                                        return (
                                            <div key={bookmark.id} className="p-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <Link href={`/post/${post.slug}`} className="block">
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate hover:text-violet-600 dark:hover:text-violet-400">
                                                            {post.title}
                                                        </h3>
                                                    </Link>
                                                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        <span>Yazar: {post.author.full_name || post.author.username}</span>
                                                        <span>Kaydedilme: {new Date(bookmark.created_at).toLocaleDateString('tr-TR')}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleRemoveBookmark(post.id)}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Listeden Çıkar"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
