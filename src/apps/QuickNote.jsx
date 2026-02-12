import { useRef, useCallback } from 'react'
import { MdClose } from 'react-icons/md'
import './QuickNote.css'

function QuickNote({ note, onUpdate, onDelete }) {
    const noteRef = useRef(null)
    const dragOffset = useRef({ x: 0, y: 0 })
    const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 })

    const getPointer = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
        }
        return { clientX: e.clientX, clientY: e.clientY }
    }

    /* ── Drag ── */
    const handleDragStart = useCallback((e) => {
        e.preventDefault()
        const pt = getPointer(e)
        const rect = noteRef.current.getBoundingClientRect()
        dragOffset.current = { x: pt.clientX - rect.left, y: pt.clientY - rect.top }

        const handleMove = (ev) => {
            const p = getPointer(ev)
            const parent = noteRef.current.parentElement.getBoundingClientRect()
            const x = p.clientX - parent.left - dragOffset.current.x
            const y = p.clientY - parent.top - dragOffset.current.y
            onUpdate(note.id, { x: Math.max(0, x), y: Math.max(0, y) })
        }
        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleUp)
    }, [note.id, onUpdate])

    /* ── Resize ── */
    const handleResizeStart = useCallback((e) => {
        e.preventDefault()
        e.stopPropagation()
        const pt = getPointer(e)
        resizeStart.current = { x: pt.clientX, y: pt.clientY, w: note.width, h: note.height }

        const handleMove = (ev) => {
            const p = getPointer(ev)
            const dw = p.clientX - resizeStart.current.x
            const dh = p.clientY - resizeStart.current.y
            onUpdate(note.id, {
                width: Math.max(160, resizeStart.current.w + dw),
                height: Math.max(120, resizeStart.current.h + dh),
            })
        }
        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove)
            window.removeEventListener('mouseup', handleUp)
            window.removeEventListener('touchmove', handleMove)
            window.removeEventListener('touchend', handleUp)
        }
        window.addEventListener('mousemove', handleMove)
        window.addEventListener('mouseup', handleUp)
        window.addEventListener('touchmove', handleMove, { passive: false })
        window.addEventListener('touchend', handleUp)
    }, [note.id, note.width, note.height, onUpdate])

    return (
        <div
            ref={noteRef}
            className="quicknote"
            style={{
                left: note.x,
                top: note.y,
                width: note.width,
                height: note.height,
                background: `var(${note.color})`,
            }}
        >
            <div className="quicknote-header" onMouseDown={handleDragStart} onTouchStart={handleDragStart}>
                <div className="quicknote-header-dots">
                    <span /><span /><span />
                </div>
                <button className="quicknote-delete" onClick={() => onDelete(note.id)}>
                    <MdClose />
                </button>
            </div>
            <div className="quicknote-body">
                <textarea
                    className="quicknote-textarea"
                    value={note.text}
                    onChange={(e) => onUpdate(note.id, { text: e.target.value })}
                    placeholder="메모를 입력하세요..."
                />
            </div>
            <div className="quicknote-resize" onMouseDown={handleResizeStart} onTouchStart={handleResizeStart} />
        </div>
    )
}

export default QuickNote
