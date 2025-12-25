'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/services/auth-context';
import { apiClient } from '@/services/client';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Audio } from '@/components/editor/extensions/Audio';
import { Video } from '@/components/editor/extensions/Video';

export default function WritePage() {
    const router = useRouter();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const [title, setTitle] = useState('');
    const [subtitle, setSubtitle] = useState('');
    const [featuredImage, setFeaturedImage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension,
            LinkExtension.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: 'Hikayenizi anlatın...',
            }),
            Audio,
            Video,
        ],
        editorProps: {
            attributes: {
                class: 'prose prose-xl dark:prose-invert max-w-none focus:outline-none min-h-[500px] leading-relaxed',
            },
        },
        immediatelyRender: false,
    });

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push('/login');
        }
    }, [authLoading, isAuthenticated, router]);

    const handleFileUpload = async (type: 'image' | 'audio' | 'video') => {
        const input = document.createElement('input');
        input.type = 'file';

        if (type === 'image') input.accept = 'image/*';
        else if (type === 'audio') input.accept = 'audio/*';
        else if (type === 'video') input.accept = 'video/*';

        input.onchange = async () => {
            if (input.files?.length) {
                const file = input.files[0];
                try {
                    let result;
                    if (type === 'image') {
                        result = await apiClient.uploadImage(file);
                        editor?.chain().focus().setImage({ src: result.file_url }).run();
                    } else if (type === 'audio') {
                        result = await apiClient.uploadAudio(file);
                        editor?.chain().focus().insertContent({ type: 'audio', attrs: { src: result.file_url } }).run();
                    } else if (type === 'video') {
                        result = await apiClient.uploadVideo(file);
                        editor?.chain().focus().insertContent({ type: 'video', attrs: { src: result.file_url } }).run();
                    }
                } catch (err) {
                    setError(`${type} yüklenemedi: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
                }
            }
        };
        input.click();
    };

    const handlePublish = async (status: 'draft' | 'published') => {
        if (!title.trim()) {
            setError('Başlık gereklidir');
            return;
        }

        if (!editor || editor.isEmpty) {
            setError('İçerik boş olamaz');
            return;
        }

        setIsSaving(true);
        setError('');

        try {
            await apiClient.createPost({
                title,
                subtitle: subtitle || undefined,
                content: editor.getJSON(),
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
        <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Toolbar */}
            <div className="sticky top-16 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
                <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                        {/* Headers */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                                className={`p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all ${editor?.isActive('heading', { level: 2 }) ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600' : 'text-gray-500'}`}
                                title="Başlık 1"
                            >
                                <span className="font-bold text-lg">H1</span>
                            </button>
                            <button
                                onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
                                className={`p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all ${editor?.isActive('heading', { level: 3 }) ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600' : 'text-gray-500'}`}
                                title="Başlık 2"
                            >
                                <span className="font-bold text-sm">H2</span>
                            </button>
                        </div>

                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />

                        {/* Formatting */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => editor?.chain().focus().toggleBold().run()}
                                className={`p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all ${editor?.isActive('bold') ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600' : 'text-gray-500'}`}
                                title="Kalın"
                            >
                                <strong>B</strong>
                            </button>
                            <button
                                onClick={() => editor?.chain().focus().toggleItalic().run()}
                                className={`p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all ${editor?.isActive('italic') ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600' : 'text-gray-500'}`}
                                title="İtalik"
                            >
                                <em>I</em>
                            </button>
                            <button
                                onClick={() => editor?.chain().focus().toggleBlockquote().run()}
                                className={`p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all ${editor?.isActive('blockquote') ? 'bg-white dark:bg-gray-700 shadow-sm text-violet-600' : 'text-gray-500'}`}
                                title="Alıntı"
                            >
                                <span className="font-serif">"</span>
                            </button>
                        </div>

                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-2" />

                        {/* Media */}
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button
                                onClick={() => handleFileUpload('image')}
                                className="p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all text-gray-500 hover:text-violet-600"
                                title="Resim ekle"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleFileUpload('audio')}
                                className="p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all text-gray-500 hover:text-violet-600"
                                title="Ses ekle"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => handleFileUpload('video')}
                                className="p-2 rounded hover:bg-white dark:hover:bg-gray-700 transition-all text-gray-500 hover:text-violet-600"
                                title="Video ekle"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        <button
                            onClick={() => handlePublish('draft')}
                            disabled={isSaving}
                            className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors font-medium text-sm"
                        >
                            Taslak
                        </button>
                        <button
                            onClick={() => handlePublish('published')}
                            disabled={isSaving}
                            className="px-6 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full hover:shadow-lg hover:shadow-violet-500/20 transition-all disabled:opacity-50 font-medium text-sm flex items-center"
                        >
                            {isSaving ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                    Kaydediliyor...
                                </>
                            ) : (
                                'Yayınla'
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Editor Container */}
            <div className="max-w-3xl mx-auto px-4 py-12">
                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {error}
                    </div>
                )}

                {/* Meta Inputs */}
                <div className="mb-8 space-y-4">
                    <div className="relative group">
                        <textarea
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="Başlık"
                            rows={1}
                            className="w-full text-4xl md:text-5xl font-bold bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 resize-none overflow-hidden"
                            style={{ minHeight: '60px' }}
                        />
                    </div>

                    <div className="relative group">
                        <textarea
                            value={subtitle}
                            onChange={(e) => {
                                setSubtitle(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="Alt başlık (opsiyonel)"
                            rows={1}
                            className="w-full text-xl text-gray-500 dark:text-gray-400 bg-transparent border-none outline-none placeholder-gray-300 dark:placeholder-gray-600 resize-none overflow-hidden"
                            style={{ minHeight: '40px' }}
                        />
                    </div>

                    {featuredImage && (
                        <div className="relative group rounded-2xl overflow-hidden shadow-lg mb-8">
                            <img src={featuredImage} alt="Featured" className="w-full h-[300px] object-cover" />
                            <button
                                onClick={() => setFeaturedImage('')}
                                className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {!featuredImage && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = async () => {
                                        if (input.files?.length) {
                                            const file = input.files[0];
                                            const res = await apiClient.uploadImage(file);
                                            setFeaturedImage(res.file_url);
                                        }
                                    };
                                    input.click();
                                }}
                                className="text-sm text-gray-400 hover:text-violet-600 flex items-center transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Kapak resmi ekle
                            </button>
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="min-h-[500px]">
                    <EditorContent editor={editor} />
                </div>
            </div>
        </div>
    );
}
