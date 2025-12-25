'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@/services/client';
import { Post } from '@/services/api';
import PostCard from '@/components/PostCard';

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // URL params
    const initialQuery = searchParams.get('q') || '';
    const initialTag = searchParams.get('tag') || '';

    // State
    const [query, setQuery] = useState(initialQuery);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // Effect to perform search when URL params change
    useEffect(() => {
        const fetchPosts = async () => {
            if (!initialQuery && !initialTag) {
                setPosts([]);
                return;
            }

            setIsLoading(true);
            try {
                const result = await apiClient.searchPosts(initialQuery, 1, 20, initialTag);
                setPosts(result.items);
                setTotal(result.total);
            } catch (error) {
                console.error("Search failed:", error);
                setPosts([]);
            } finally {
                setIsLoading(false);
            }
        };

        setQuery(initialQuery); // Sync local state with URL
        fetchPosts();
    }, [initialQuery, initialTag]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Update URL to trigger effect
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (initialTag) params.set('tag', initialTag); // Keep tag if exists? Or clear it? Let's keep it generally, or assume new search clears it. 
        // For simple UX, let's clear tag if user manual searches.

        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                        {initialTag ? `#${initialTag} için sonuçlar` : 'Blogda Ara'}
                    </h1>
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Makale, konu veya yazar ara..."
                                className="w-full pl-12 pr-4 py-4 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-200 transition-all text-lg shadow-lg"
                            />
                            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <button
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 px-6 bg-violet-600 text-white rounded-full font-medium hover:bg-violet-700 transition-colors"
                            >
                                Ara
                            </button>
                        </div>
                    </form>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm animate-pulse h-96">
                                <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-xl mb-4"></div>
                                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {posts.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {posts.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : (
                            (initialQuery || initialTag) && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 mx-auto mb-6 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400">
                                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Sonuç bulunamadı</h3>
                                    <p className="text-gray-500 dark:text-gray-400">Farklı anahtar kelimelerle aramayı deneyebilirsiniz.</p>
                                </div>
                            )
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900" />}>
            <SearchContent />
        </Suspense>
    );
}
