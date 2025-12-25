import { Node, mergeAttributes } from '@tiptap/core'

export const Video = Node.create({
    name: 'video',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
        }
    },

    parseHTML() {
        return [
            {
                tag: 'video',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['video', mergeAttributes(HTMLAttributes, { controls: 'true', class: 'w-full rounded-lg my-6 shadow-lg aspect-video bg-black' })]
    },
})
