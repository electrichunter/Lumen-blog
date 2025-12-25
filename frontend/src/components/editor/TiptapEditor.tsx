'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { useEffect } from 'react'

interface TiptapEditorProps {
    content?: string
    onChange?: (content: string) => void
    editable?: boolean
    placeholder?: string
}

const TiptapEditor = ({ content, onChange, editable = true, placeholder = 'Yazmaya başlayın...' }: TiptapEditorProps) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Image,
            Link.configure({
                openOnClick: false,
            }),
            Placeholder.configure({
                placeholder: placeholder,
            }),
        ],
        content: content,
        editable: editable,
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert max-w-none focus:outline-none min-h-[300px]',
            },
        },
        immediatelyRender: false // Fix for hydration mismatch in Next.js
    })

    // Optional: Sync content if it changes externally
    useEffect(() => {
        if (editor && content && editor.getHTML() !== content) {
            // Check if content is truly different (parsing HTML can change strings)
            // editor.commands.setContent(content)
        }
    }, [content, editor])

    if (!editor) {
        return null
    }

    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm">
            {editable && <MenuBar editor={editor} />}
            <EditorContent editor={editor} />
        </div>
    )
}

const MenuBar = ({ editor }: { editor: any }) => {
    if (!editor) {
        return null
    }

    const buttons = [
        { label: 'Kalın', action: () => editor.chain().focus().toggleBold().run(), isActive: editor.isActive('bold') },
        { label: 'İtalik', action: () => editor.chain().focus().toggleItalic().run(), isActive: editor.isActive('italic') },
        { label: 'Başlık 1', action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor.isActive('heading', { level: 1 }) },
        { label: 'Başlık 2', action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor.isActive('heading', { level: 2 }) },
        { label: 'Liste', action: () => editor.chain().focus().toggleBulletList().run(), isActive: editor.isActive('bulletList') },
        { label: 'Alıntı', action: () => editor.chain().focus().toggleBlockquote().run(), isActive: editor.isActive('blockquote') },
    ]

    return (
        <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
            {buttons.map((btn, index) => (
                <button
                    key={index}
                    onClick={btn.action}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${btn.isActive
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300 shadow-sm'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                    {btn.label}
                </button>
            ))}
        </div>
    )
}

export default TiptapEditor
