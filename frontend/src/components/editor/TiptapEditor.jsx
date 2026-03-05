import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Highlight from '@tiptap/extension-highlight'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Underline from '@tiptap/extension-underline'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { common, createLowlight } from 'lowlight'
import { useEffect, useCallback } from 'react'

const lowlight = createLowlight(common)

/**
 * Premium Tiptap editor with toolbar, markdown shortcuts,
 * and keyboard-driven workflow. Replaces React Quill.
 */
export default function TiptapEditor({ content, onChange, placeholder = 'Start writing…', editable = true }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false, // replaced by lowlight version
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({ placeholder }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-accent underline hover:opacity-80 transition-opacity' },
            }),
            Highlight.configure({
                HTMLAttributes: { class: 'bg-accent-soft text-ink rounded px-0.5' },
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Underline,
            CodeBlockLowlight.configure({ lowlight }),
        ],
        content: content || '',
        editable,
        editorProps: {
            attributes: {
                class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[300px] px-1 py-2',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
    })

    // Sync external content changes (e.g. loading a note)
    useEffect(() => {
        if (editor && content !== undefined && editor.getHTML() !== content) {
            editor.commands.setContent(content || '', false)
        }
    }, [content, editor])

    useEffect(() => {
        if (editor) editor.setEditable(editable)
    }, [editable, editor])

    const setLink = useCallback(() => {
        if (!editor) return
        const url = window.prompt('URL', editor.getAttributes('link').href || 'https://')
        if (url === null) return
        if (url === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }, [editor])

    if (!editor) return null

    return (
        <div className="tiptap-wrapper">
            {/* ── Toolbar ────────────────────────────────────── */}
            <div className="flex items-center gap-0.5 flex-wrap px-2 py-2 border-b border-border bg-surface-0/50 rounded-t-2xl">
                {/* Headings */}
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    active={editor.isActive('heading', { level: 1 })}
                    title="Heading 1"
                >
                    H1
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    active={editor.isActive('heading', { level: 2 })}
                    title="Heading 2"
                >
                    H2
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    active={editor.isActive('heading', { level: 3 })}
                    title="Heading 3"
                >
                    H3
                </ToolBtn>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Formatting */}
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    active={editor.isActive('bold')}
                    title="Bold (Ctrl+B)"
                >
                    <span className="font-bold text-xs">B</span>
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    active={editor.isActive('italic')}
                    title="Italic (Ctrl+I)"
                >
                    <span className="italic text-xs">I</span>
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    active={editor.isActive('underline')}
                    title="Underline (Ctrl+U)"
                >
                    <span className="underline text-xs">U</span>
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    active={editor.isActive('strike')}
                    title="Strikethrough"
                >
                    <span className="line-through text-xs">S</span>
                </ToolBtn>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Lists */}
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    active={editor.isActive('bulletList')}
                    title="Bullet List"
                >
                    •≡
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    active={editor.isActive('orderedList')}
                    title="Numbered List"
                >
                    1.
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    active={editor.isActive('taskList')}
                    title="Task List"
                >
                    ☑
                </ToolBtn>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Blocks */}
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    active={editor.isActive('blockquote')}
                    title="Quote"
                >
                    ❝
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    active={editor.isActive('codeBlock')}
                    title="Code Block"
                >
                    {'{ }'}
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    title="Divider"
                >
                    ─
                </ToolBtn>

                <div className="w-px h-5 bg-border mx-1" />

                {/* Link + Highlight */}
                <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Add Link">
                    🔗
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().toggleHighlight().run()}
                    active={editor.isActive('highlight')}
                    title="Highlight"
                >
                    🖍
                </ToolBtn>

                {/* Undo / Redo — pushed right */}
                <div className="flex-1" />
                <ToolBtn
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    title="Undo (Ctrl+Z)"
                >
                    ↩
                </ToolBtn>
                <ToolBtn
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    title="Redo (Ctrl+Shift+Z)"
                >
                    ↪
                </ToolBtn>
            </div>

            {/* ── Editor area ──────────────────────────────────── */}
            <EditorContent editor={editor} className="px-4 py-3" />

            {/* ── Keyboard shortcuts hint ──────────────────────── */}
            <div className="px-4 py-2 border-t border-border text-2xs text-ink-ghost">
                <span>Markdown shortcuts: # heading · **bold** · *italic* · `code` · - list · [] task</span>
            </div>
        </div>
    )
}

/** Tiny reusable toolbar button */
function ToolBtn({ children, onClick, active, disabled, title }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={`
                flex items-center justify-center w-7 h-7 rounded-lg text-xs
                transition-all duration-150 select-none
                ${active
                    ? 'bg-accent-soft text-accent font-semibold'
                    : 'text-ink-muted hover:bg-surface-2 hover:text-ink'
                }
                ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
            `}
        >
            {children}
        </button>
    )
}
