import Link from 'next/link';
import { Post } from '@/services/api';

interface PostCardProps {
    post: Post;
}

export default function PostCard({ post }: PostCardProps) {
    const formattedDate = new Date(post.published_at || post.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <article className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700">
            {/* Featured Image */}
            {post.featured_image && (
                <Link href={`/post/${post.slug}`} className="block overflow-hidden">
                    <div
                        className="h-48 bg-cover bg-center transform group-hover:scale-105 transition-transform duration-500"
                        style={{ backgroundImage: `url(${post.featured_image})` }}
                    />
                </Link>
            )}

            <div className="p-6">
                {/* Author and Meta */}
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-white font-medium">
                        {post.author.avatar_url ? (
                            <img src={post.author.avatar_url} alt={post.author.username} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            post.author.username.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{post.author.full_name || post.author.username}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{formattedDate} · {post.read_time} dk okuma</p>
                    </div>
                </div>

                {/* Title */}
                <Link href={`/post/${post.slug}`}>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors line-clamp-2">
                        {post.title}
                    </h2>
                </Link>

                {/* Subtitle */}
                {post.subtitle && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                        {post.subtitle}
                    </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{post.view_count}</span>
                        </span>
                    </div>

                    {post.is_member_only && (
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full">
                            Premium
                        </span>
                    )}

                    {post.is_featured && (
                        <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-full">
                            Öne Çıkan
                        </span>
                    )}
                </div>
            </div>
        </article>
    );
}
