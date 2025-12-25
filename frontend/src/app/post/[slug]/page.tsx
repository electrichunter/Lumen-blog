'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '@/services/client';
import { Post } from '@/services/api';
import Comments from '@/components/Comments';
import FollowButton from '@/components/FollowButton';

export default function PostDetailPage() {
    const params = useParams();
    const slug = params.slug as string;
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPost = async () => {
            try {
                const data = await apiClient.getPostBySlug(slug);
                setPost(data);
            } catch (err) {
                setError('Yazı bulunamadı');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (slug) {
            fetchPost();
        }
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    if (error || !post) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Yazı Bulunamadı</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Aradığınız yazı mevcut değil veya kaldırılmış olabilir.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-full"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    // Render block-based content
    const renderContent = (content: Record<string, unknown> | undefined) => {
        if (!content) return null;

        const blocks = (content.blocks || content.content || []) as Array<Record<string, unknown>>;

        return blocks.map((block, index) => {
            const type = block.type as string;
            const text = block.text as string;

            switch (type) {
                case 'paragraph':
                    return <p key={index} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">{text}</p>;
                case 'heading':
                    const level = (block.level as number) || 2;
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const HeadingTag = `h${level}` as any;
                    return <HeadingTag key={index} className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">{text}</HeadingTag>;
                case 'image':
                    return (
                        <figure key={index} className="my-8">
                            <img
                                src={block.url as string}
                                alt={block.caption as string || ''}
                                className="w-full rounded-xl"
                            />
                            {block.caption && (
                                <figcaption className="text-center text-sm text-gray-500 mt-2">{block.caption as string}</figcaption>
                            )}
                        </figure>
                    );
                case 'quote':
                    return (
                        <blockquote key={index} className="border-l-4 border-violet-500 pl-4 my-6 italic text-gray-600 dark:text-gray-400">
                            {text}
                        </blockquote>
                    );
                default:
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return <p key={index} className="mb-4 text-gray-700 dark:text-gray-300">{text || JSON.stringify(block as any)}</p>;
            }
        });
    };

    return (
        <article className="min-h-screen">
            {/* Hero */}
            <header className="bg-gradient-to-br from-violet-600 via-indigo-600 to-purple-700 text-white py-16 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-medium">
                            {post.author.avatar_url ? (
                                <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                post.author.username.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <p className="font-medium flex items-center space-x-2">
                                <span>{post.author.full_name || post.author.username}</span>
                                <FollowButton authorId={post.author.id} />
                            </p>
                            <p className="text-violet-200 text-sm">{formattedDate} · {post.read_time} dk okuma</p>
                        </div>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">{post.title}</h1>

                    {post.subtitle && (
                        <p className="text-xl text-violet-100">{post.subtitle}</p>
                    )}
                </div>
            </header>

            {/* Featured Image */}
            {post.featured_image && (
                <div className="max-w-4xl mx-auto -mt-8 px-4">
                    <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full rounded-2xl shadow-2xl"
                    />
                </div>
            )}

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="prose prose-lg dark:prose-invert max-w-none">
                    {renderContent(post.content)}
                </div>

                {/* Tags and Share */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{post.view_count} görüntülenme</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <Comments postId={post.id} />
            </div>
        </article>
    );
}
