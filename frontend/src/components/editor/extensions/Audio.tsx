import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'

const AudioComponent = (props: any) => {
    return (
        <NodeViewWrapper className="my-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-full text-violet-600 dark:text-violet-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>
                <audio controls className="w-full h-10" src={props.node.attrs.src}>
                    Your browser does not support the audio element.
                </audio>
            </div>
            {props.node.attrs.caption && (
                <p className="text-center text-sm text-gray-500 mt-2">{props.node.attrs.caption}</p>
            )}
        </NodeViewWrapper>
    )
}

export const Audio = Node.create({
    name: 'audio',
    group: 'block',
    atom: true,
    draggable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            caption: {
                default: null
            }
        }
    },

    parseHTML() {
        return [
            {
                tag: 'audio',
            },
        ]
    },

    renderHTML({ HTMLAttributes }) {
        return ['audio', mergeAttributes(HTMLAttributes), 0]
    },

    addNodeView() {
        return ReactNodeViewRenderer(AudioComponent)
    },
})
