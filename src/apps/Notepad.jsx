import { useState, useCallback, useMemo } from 'react'
import { ebosFetch } from '../api'
import {
    MdAdd,
    MdSave,
    MdFolderOpen,
    MdPreview,
    MdEdit,
    MdDelete,
    MdClose,
} from 'react-icons/md'
import './Notepad.css'

const STORAGE_KEY = 'ebos-notepad-files'

function getFiles() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
    } catch { return [] }
}
function saveFiles(files) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files))
}

/* ── Simple Markdown → HTML (Sanitized) ── */
function markdownToHtml(md) {
    if (!md) return ''

    // 1. Basic escaping to prevent raw HTML execution
    let html = md
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

    // 2. Markdown parsing
    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>')
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>')
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold & Italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Blockquote
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // Unordered list
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>')
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>')
    // Paragraphs
    html = html.replace(/\n\n/g, '</p><p>')
    html = '<p>' + html + '</p>'
    html = html.replace(/<p><\/p>/g, '')
    // Line breaks
    html = html.replace(/\n/g, '<br/>')

    return html
}

function Notepad() {
    const [text, setText] = useState('')
    const [fileName, setFileName] = useState('제목 없음')
    const [currentId, setCurrentId] = useState(null)
    const [showPreview, setShowPreview] = useState(false)
    const [showFileList, setShowFileList] = useState(false)

    const previewHtml = useMemo(() => markdownToHtml(text), [text])

    const lineCount = text.split('\n').length
    const charCount = text.length

    /* ── New ── */
    const handleNew = useCallback(() => {
        setText('')
        setFileName('제목 없음')
        setCurrentId(null)
    }, [])

    /* ── Save ── */
    const handleSave = useCallback(() => {
        const files = getFiles()
        const now = new Date().toLocaleString('ko-KR')

        if (currentId) {
            const idx = files.findIndex(f => f.id === currentId)
            if (idx !== -1) {
                files[idx] = { ...files[idx], text, name: fileName, updatedAt: now }
            }
        } else {
            const name = text.split('\n')[0]?.replace(/^#+\s*/, '').trim().slice(0, 30) || '제목 없음'
            const newFile = { id: Date.now(), name, text, createdAt: now, updatedAt: now }
            files.unshift(newFile)
            setCurrentId(newFile.id)
            setFileName(newFile.name)
        }
        saveFiles(files)
    }, [text, fileName, currentId])

    /* ── Open ── */
    const handleOpen = useCallback((file) => {
        setText(file.text)
        setFileName(file.name)
        setCurrentId(file.id)
        setShowFileList(false)
    }, [])

    /* ── Delete File ── */
    const handleDeleteFile = useCallback((e, id) => {
        e.stopPropagation()
        const files = getFiles().filter(f => f.id !== id)
        saveFiles(files)
        if (currentId === id) {
            setText('')
            setFileName('제목 없음')
            setCurrentId(null)
        }
        setShowFileList(false)
        setTimeout(() => setShowFileList(true), 50)
    }, [currentId])

    const files = showFileList ? getFiles() : []

    return (
        <div className="notepad" style={{ position: 'relative' }}>
            {/* Toolbar */}
            <div className="notepad-toolbar">
                <div className="notepad-toolbar-group">
                    <button className="notepad-toolbar-btn" onClick={handleNew} title="새 파일">
                        <MdAdd />
                    </button>
                    <button className="notepad-toolbar-btn" onClick={handleSave} title="저장">
                        <MdSave />
                    </button>
                    <button className="notepad-toolbar-btn" onClick={() => setShowFileList(true)} title="열기">
                        <MdFolderOpen />
                    </button>
                </div>

                <div className="notepad-toolbar-divider" />

                <div className="notepad-toolbar-group">
                    <button
                        className={`notepad-toolbar-btn ${!showPreview ? 'active' : ''}`}
                        onClick={() => setShowPreview(false)}
                        title="편집"
                    >
                        <MdEdit />
                    </button>
                    <button
                        className={`notepad-toolbar-btn ${showPreview ? 'active' : ''}`}
                        onClick={() => setShowPreview(true)}
                        title="미리보기"
                    >
                        <MdPreview />
                    </button>
                </div>

                <span className="notepad-file-name">{fileName}</span>
            </div>

            {/* Content */}
            <div className="notepad-content">
                {!showPreview ? (
                    <textarea
                        className="notepad-editor"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="내용을 입력하세요... (Markdown 지원)"
                        spellCheck={false}
                    />
                ) : (
                    <div
                        className="notepad-preview"
                        dangerouslySetInnerHTML={{ __html: previewHtml }}
                    />
                )}
            </div>

            {/* Status Bar */}
            <div className="notepad-statusbar">
                <span>{lineCount}줄 · {charCount}자</span>
                <span>Markdown</span>
            </div>

            {/* File List Modal */}
            {showFileList && (
                <>
                    <div className="notepad-overlay" onClick={() => setShowFileList(false)} />
                    <div className="notepad-filelist">
                        <div className="notepad-filelist-header">
                            <span>저장된 파일</span>
                            <button
                                className="notepad-toolbar-btn"
                                onClick={() => setShowFileList(false)}
                                style={{ width: 28, height: 28 }}
                            >
                                <MdClose />
                            </button>
                        </div>
                        <div className="notepad-filelist-body">
                            {files.length === 0 ? (
                                <div className="notepad-filelist-empty">저장된 파일이 없습니다</div>
                            ) : (
                                files.map(f => (
                                    <div
                                        key={f.id}
                                        className="notepad-filelist-item"
                                        onClick={() => handleOpen(f)}
                                    >
                                        <span>{f.name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <span className="date">{f.updatedAt}</span>
                                            <button
                                                className="notepad-toolbar-btn"
                                                onClick={(e) => handleDeleteFile(e, f.id)}
                                                style={{ width: 24, height: 24, fontSize: 14 }}
                                            >
                                                <MdDelete />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default Notepad
