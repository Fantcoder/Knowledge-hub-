import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
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
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Link as LinkIcon, Highlighter, Heading1, Heading2, Heading3,
    List, ListOrdered, ListTodo, Code, Quote, Minus, Type
} from 'lucide-react'
import './tiptap.css'

const lowlight = createLowlight(common)

export default function TiptapEditor({ content, onChange, placeholder = 'Start writing…', editable = true }) {
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
                class: 'prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[40vh] px-1',
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
        <div className="tiptap-wrapper">

            {/* ── FIXED TOOLBAR — always visible above the editor ── */}
            {editable && (
                <div className="tiptap-toolbar">

                    {/* Block Type */}
                    <ToolBtn
                        onClick={() => editor.chain().focus().setParagraph().run()}
                        active={editor.isActive('paragraph')}
                        title="Paragraph"
                    ><Type size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                        active={editor.isActive('heading', { level: 1 })}
                        title="Heading 1"
                    ><Heading1 size={16} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        active={editor.isActive('heading', { level: 2 })}
                        title="Heading 2"
                    ><Heading2 size={16} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                        active={editor.isActive('heading', { level: 3 })}
                        title="Heading 3"
                    ><Heading3 size={16} /></ToolBtn>

                    <div className="tiptap-divider" />

                    {/* Inline Formatting */}
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        active={editor.isActive('bold')}
                        title="Bold (Ctrl+B)"
                    ><Bold size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        active={editor.isActive('italic')}
                        title="Italic (Ctrl+I)"
                    ><Italic size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        active={editor.isActive('underline')}
                        title="Underline (Ctrl+U)"
                    ><UnderlineIcon size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        active={editor.isActive('strike')}
                        title="Strikethrough"
                    ><Strikethrough size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleHighlight().run()}
                        active={editor.isActive('highlight')}
                        title="Highlight"
                    ><Highlighter size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={setLink}
                        active={editor.isActive('link')}
                        title="Link"
                    ><LinkIcon size={15} /></ToolBtn>

                    <div className="tiptap-divider" />

                    {/* Lists & Blocks */}
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        active={editor.isActive('bulletList')}
                        title="Bullet List"
                    ><List size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        active={editor.isActive('orderedList')}
                        title="Numbered List"
                    ><ListOrdered size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleTaskList().run()}
                        active={editor.isActive('taskList')}
                        title="Task List"
                    ><ListTodo size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                        active={editor.isActive('codeBlock')}
                        title="Code Block"
                    ><Code size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().toggleBlockquote().run()}
                        active={editor.isActive('blockquote')}
                        title="Quote"
                    ><Quote size={15} /></ToolBtn>
                    <ToolBtn
                        onClick={() => editor.chain().focus().setHorizontalRule().run()}
                        title="Divider"
                    ><Minus size={15} /></ToolBtn>

                </div>
            )}

            {/* ── BUBBLE MENU — inline toolbar on text selection ── */}
            {editor && (
                <BubbleMenu
                    editor={editor}
                    tippyOptions={{ duration: 80 }}
                    className="bubble-menu"
                >
                    <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold"><Bold size={14} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic"><Italic size={14} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline"><UnderlineIcon size={14} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strike"><Strikethrough size={14} /></ToolBtn>
                    <div className="tiptap-divider" style={{ height: '14px' }} />
                    <ToolBtn onClick={setLink} active={editor.isActive('link')} title="Link"><LinkIcon size={14} /></ToolBtn>
                    <ToolBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Highlight"><Highlighter size={14} /></ToolBtn>
                </BubbleMenu>
            )}

            {/* ── EDITOR AREA ── */}
            <div className="tiptap-content-area">
                <EditorContent editor={editor} />
            </div>
        </div>
    )
}

function ToolBtn({ children, onClick, active, title }) {
    return (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault() // keep editor focused
                onClick()
            }}
            title={title}
            className={`tiptap-tool-btn ${active ? 'active' : ''}`}
        >
            {children}
        </button>
    )
}
