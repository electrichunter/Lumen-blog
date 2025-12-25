'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/services/client';
import { Comment, CommentCreate, User } from '@/services/api';

interface CommentsProps {
    postId: string;
}

interface CommentItemProps {
    comment: Comment;
    postId: string;
    onDelete: (id: string) => void;
    currentUserId?: string;
}

function CommentItem({ comment, postId, onDelete, currentUserId }: CommentItemProps) {
    const [replies, setReplies] = useState<Comment[]>([]);
    const [showReplies, setShowReplies] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [localReplyCount, setLocalReplyCount] = useState(comment.reply_count);

    const formattedDate = new Date(comment.created_at).toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const handleLoadReplies = async () => {
        if (showReplies) {
            setShowReplies(false);
            return;
        }

        setIsLoadingReplies(true);
        try {
            const data = await apiClient.getReplies(postId, comment.id);
            setReplies(data);
            setShowReplies(true);
        } catch (error) {
            console.error("Failed to load replies", error);
        } finally {
            setIsLoadingReplies(false);
        }
    };

    const handleReplySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;

        try {
            const newReply = await apiClient.createComment(postId, {
                content: replyContent,
                parent_id: comment.id
            });
            setReplies([...replies, newReply]);
            setLocalReplyCount(localReplyCount + 1);
            setReplyContent('');
            setIsReplying(false);
            if (!showReplies) setShowReplies(true);
        } catch (error) {
            alert('Yanıt gönderilemedi');
        }
    };

    const handleDelete = async () => {
        if (!confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;
        onDelete(comment.id);
    };

    const handleReplyDelete = async (replyId: string) => {
        try {
            await apiClient.deleteComment(postId, replyId);
            setReplies(replies.filter(r => r.id !== replyId));
            setLocalReplyCount(localReplyCount - 1);
        } catch (error) {
            alert("Yorum silinemedi");
        }
    }

    return (
        <div className="mb-6">
            <div className="flex space-x-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 overflow-hidden">
                        {comment.author.avatar_url ? (
                            <img src={comment.author.avatar_url} alt={comment.author.username} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-sm font-medium">{comment.author.username.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                </div>
                <div className="flex-grow">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-900 dark:text-white">{comment.author.full_name || comment.author.username}</span>
                            <span className="text-xs text-gray-500">{formattedDate}</span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>

                    <div className="flex items-center space-x-4 mt-2 ml-2">
                        {localReplyCount > 0 && (
                            <button
                                onClick={handleLoadReplies}
                                className="text-violet-600 dark:text-violet-400 text-sm font-medium hover:underline flex items-center"
                            >
                                {isLoadingReplies && <div className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full mr-2" />}
                                {showReplies ? 'Yanıtları Gizle' : `${localReplyCount} Yanıtı Gör`}
                            </button>
                        )}

                        <button
                            onClick={() => setIsReplying(!isReplying)}
                            className="text-gray-500 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
                        >
                            Yanıtla
                        </button>

                        {(currentUserId === comment.author.id) && (
                            <button
                                onClick={handleDelete}
                                className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >
                                Sil
                            </button>
                        )}
                    </div>

                    {/* Reply Form */}
                    {isReplying && (
                        <form onSubmit={handleReplySubmit} className="mt-4 ml-4">
                            <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Yanıtınızı yazın..."
                                className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-violet-500 focus:outline-none text-sm"
                                rows={2}
                            />
                            <div className="flex justify-end mt-2 space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setIsReplying(false)}
                                    className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={!replyContent.trim()}
                                    className="px-3 py-1.5 text-sm bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
                                >
                                    Yanıtla
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Replies List */}
                    {showReplies && replies.length > 0 && (
                        <div className="mt-4 space-y-4 ml-4 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                            {replies.map(reply => (
                                <CommentItem
                                    key={reply.id}
                                    comment={reply}
                                    postId={postId}
                                    onDelete={handleReplyDelete} // Simplified: replies manage their own deletion via parent callback updating state
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function Comments({ postId }: CommentsProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch User
                const token = apiClient.getToken();
                if (token) {
                    try {
                        const user = await apiClient.getCurrentUser();
                        setCurrentUser(user);
                    } catch (e) {
                        // Token might be invalid
                    }
                }

                // Fetch Comments
                const data = await apiClient.getComments(postId);
                setComments(data);
            } catch (error) {
                console.error("Failed to load comments", error);
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [postId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        try {
            const comment = await apiClient.createComment(postId, { content: newComment });
            setComments([comment, ...comments]);
            setNewComment('');
        } catch (error) {
            alert('Yorum yapılamadı. Lütfen giriş yapınız.');
        }
    };

    const handleDeleteComment = async (id: string) => {
        try {
            await apiClient.deleteComment(postId, id);
            setComments(comments.filter(c => c.id !== id));
        } catch (error) {
            alert("Yorum silinemedi");
        }
    };

    return (
        <section className="max-w-3xl mx-auto px-4 py-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">Yorumlar ({comments.length})</h3>

            {/* New Comment Form */}
            <form onSubmit={handleSubmit} className="mb-12">
                <div className="relative">
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Düşüncelerinizi paylaşın..."
                        className="w-full p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-violet-500 focus:outline-none min-h-[120px] resize-y"
                    />
                    <div className="absolute bottom-4 right-4">
                        <button
                            type="submit"
                            disabled={!newComment.trim()}
                            className="px-6 py-2 bg-violet-600 text-white font-medium rounded-full hover:bg-violet-700 disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
                        >
                            Yorum Yap
                        </button>
                    </div>
                </div>
            </form>

            {/* Comments List */}
            {isLoading ? (
                <div className="space-y-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex space-x-3 animate-pulse">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-2">
                    {comments.map(comment => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            postId={postId}
                            onDelete={handleDeleteComment}
                            currentUserId={currentUser?.id}
                        />
                    ))}
                    {comments.length === 0 && (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-8">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>
                    )}
                </div>
            )}
        </section>
    );
}
