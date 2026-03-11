import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
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
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Link as LinkIcon, Highlighter, Type, Heading1, Heading2, List, ListTodo, Code, Quote } from 'lucide-react'

const lowlight = createLowlight(common)

export default function TiptapEditor({ content, onChange, placeholder = 'Start typing (type "/" for commands)...', editable = true }) {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                heading: { levels: [1, 2, 3] },
            }),
            Placeholder.configure({ placeholder }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: { class: 'text-accent underline hover:opacity-80 transition-opacity cursor-pointer' },
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
                class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[50vh]',
            },
        },
        onUpdate: ({ editor }) => {
            onChange?.(editor.getHTML())
        },
    })

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
        <div className="tiptap-wrapper relative">
            {/* ── BUBBLE MENU (Appears on text selection) ── */}
            {editor && (
                <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 bg-surface-1/90 backdrop-blur-xl border border-border shadow-2xl rounded-xl px-2 py-1">
                    <MenuBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
                        <Bold size={16} />
                    </MenuBtn>
                    <MenuBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
                        <Italic size={16} />
                    </MenuBtn>
                    <MenuBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
                        <UnderlineIcon size={16} />
                    </MenuBtn>
                    <MenuBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough">
                        <Strikethrough size={16} />
                    </MenuBtn>
                    <div className="w-px h-4 bg-border mx-1" />
                    <MenuBtn onClick={setLink} active={editor.isActive('link')} title="Link">
                        <LinkIcon size={16} />
                    </MenuBtn>
                    <MenuBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight">
                        <Highlighter size={16} />
                    </MenuBtn>
                    <div className="w-px h-4 bg-border mx-1" />
                    <MenuBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Heading 1">
                        <Heading1 size={18} />
                    </MenuBtn>
                    <MenuBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
                        <Heading2 size={18} />
                    </MenuBtn>
                </BubbleMenu>
            )}

            {/* ── FLOATING MENU (Appears on empty lines, acts like a slash command palette) ── */}
            {editor && (
                <FloatingMenu editor={editor} tippyOptions={{ duration: 100, placement: 'right-start' }} className="flex flex-col gap-1 bg-surface-1/90 backdrop-blur-xl border border-border shadow-2xl rounded-2xl p-2 w-48 animate-in-scale">
                    <p className="text-[10px] font-mono tracking-widest text-ink-faint uppercase px-2 mb-1">Add Block</p>
                    <BlockBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} icon={Heading1}>Heading 1</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} icon={Heading2}>Heading 2</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().setParagraph().run()} icon={Type} active={editor.isActive('paragraph')}>Text</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().toggleBulletList().run()} icon={List}>Bullet List</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().toggleTaskList().run()} icon={ListTodo}>Task List</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} icon={Code}>Code Block</BlockBtn>
                    <BlockBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} icon={Quote}>Quote</BlockBtn>
                </FloatingMenu>
            )}

            {/* ── Editor Area ── */}
            <EditorContent editor={editor} />
        </div>
    )
}

function MenuBtn({ children, onClick, active, title }) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${active ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'}`}
        >
            {children}
        </button>
    )
}

function BlockBtn({ children, onClick, icon: Icon, active }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors ${active ? 'bg-accent-soft text-accent' : 'text-ink-muted hover:bg-surface-2 hover:text-ink'}`}
        >
            <Icon size={16} />
            <span className="font-medium font-sans">{children}</span>
        </button>
    )
}
