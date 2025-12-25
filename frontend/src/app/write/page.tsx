'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth-context';
import { apiClient } from '@/services/client';

interface ContentBlock {
    id: string;
    type: 'paragraph' | 'heading' | 'image' | 'quote';
    text?: string;
    url?: string;
    caption?: string;
    level?: number;
}

export default function WritePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [content, setContent] = useState<ContentBlock[]>([
        { id: '1', type: 'paragraph', text: '' }
    ]);
    const [featuredImage, setFeaturedImage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const generateId = () => Math.random().toString(36).substring(7);

    const addBlock = (type: ContentBlock['type'], afterId?: string) => {
        const newBlock: ContentBlock = {
            id: generateId(),
            type,
            text: '',
        };

        if (type === 'heading') {
            newBlock.level = 2;
        }

        if (afterId) {
            const index = content.findIndex(b => b.id === afterId);
            const newContent = [...content];
            newContent.splice(index + 1, 0, newBlock);
            setContent(newContent);
        } else {
            setContent([...content, newBlock]);
        }
    };

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setContent(content.map(block =>
            block.id === id ? { ...block, ...updates } : block
        ));
    };

    const removeBlock = (id: string) => {
        if (content.length > 1) {
            setContent(content.filter(block => block.id !== id));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock('paragraph', blockId);
        }
    };

    const handleImageUpload = async (file: File, blockId: string) => {
        try {
            const result = await apiClient.uploadImage(file);
            updateBlock(blockId, { url: result.file_url });
        } catch (err) {
            setError('Resim yüklenemedi');
        }
    };

    const handlePublish = async (status: 'draft' | 'published') => {
        if (!title.trim()) {
            setError('Başlık gereklidir');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            const postContent = {
                blocks: content.filter(b => b.text || b.url),
            };

            await apiClient.createPost({
                title,
                subtitle: subtitle || undefined,
                content: postContent,
                featured_image: featuredImage || undefined,
                status,
            });

            router.push('/dashboard');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Yazı kaydedilemedi');
        } finally {
            setIsSaving(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Toolbar */}
            <div className="sticky top-16 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => addBlock('paragraph')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Paragraf ekle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                        </button>
                        <button
                            onClick={() => addBlock('heading')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Başlık ekle"
                        >
                            <span className="font-bold">H</span>
                        </button>
                        <button
                            onClick={() => addBlock('image')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Resim ekle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </button>
                        <button
                            onClick={() => addBlock('quote')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                            title="Alıntı ekle"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => handlePublish('draft')}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Taslak Kaydet
                        </button>
                        <button
                            onClick={() => handlePublish('published')}
                            disabled={isSaving}
                            className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Kaydediliyor...' : 'Yayınla'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor */}
            <div className="max-w-3xl mx-auto px-4 py-12">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400">
                        {error}
                    </div>
                )}

                {/* Title */}
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Başlık"
                    className="w-full text-4xl md:text-5xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 mb-4"
                />

                {/* Subtitle */}
                <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="Alt başlık (opsiyonel)"
                    className="w-full text-xl text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 mb-8"
                />

                {/* Featured Image URL */}
                <div className="mb-8">
                    <input
                        type="text"
                        value={featuredImage}
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        placeholder="Öne çıkan resim URL'si (opsiyonel)"
                        className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 focus:ring-violet-500"
                    />
                </div>

                {/* Content Blocks */}
                <div className="space-y-4">
                    {content.map((block) => (
                        <div key={block.id} className="group relative">
                            {/* Block controls */}
                            <div className="absolute -left-10 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => removeBlock(block.id)}
                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Block content */}
                            {block.type === 'paragraph' && (
                                <textarea
                                    value={block.text}
                                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                    onKeyDown={(e) => handleKeyDown(e, block.id)}
                                    placeholder="Yazmaya başla..."
                                    className="w-full min-h-[60px] text-lg text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-gray-600"
                                    rows={1}
                                />
                            )}

                            {block.type === 'heading' && (
                                <input
                                    type="text"
                                    value={block.text}
                                    onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                    placeholder="Başlık..."
                                    className="w-full text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600"
                                />
                            )}

                            {block.type === 'image' && (
                                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6">
                                    {block.url ? (
                                        <img src={block.url} alt="" className="w-full rounded-lg" />
                                    ) : (
                                        <div className="text-center">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleImageUpload(file, block.id);
                                                }}
                                                className="hidden"
                                                id={`image-${block.id}`}
                                            />
                                            <label
                                                htmlFor={`image-${block.id}`}
                                                className="cursor-pointer text-gray-400 hover:text-violet-500 transition-colors"
                                            >
                                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p>Resim yüklemek için tıklayın</p>
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}

                            {block.type === 'quote' && (
                                <div className="border-l-4 border-violet-500 pl-4">
                                    <textarea
                                        value={block.text}
                                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                                        placeholder="Alıntı..."
                                        className="w-full min-h-[60px] text-lg italic text-gray-600 dark:text-gray-400 bg-transparent border-none outline-none resize-none placeholder-gray-300 dark:placeholder-gray-600"
                                        rows={1}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
