import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
    MdSave, MdPlayArrow, MdStop, MdDelete, MdAdd, MdClose,
    MdZoomIn, MdZoomOut, MdCenterFocusStrong,
} from 'react-icons/md'
import NodeComponent from './NodeComponent'
import { NODE_TYPES, NODE_CATEGORIES, PIN_COLORS, createNodeInstance, getNodeDef, getNodeTypesByCategory } from './nodeTypes'
import { UI_COMPONENT_TYPES, createUIComponent, createEmptyApp, saveApp } from './nodeSchema'
import { MiniAppRuntime } from './Runtime'
import './NodeEditor.css'

function NodeEditor({ app: initialApp, onSave, onClose }) {
    /* ── App State ── */
    const [app, setApp] = useState(() => initialApp || createEmptyApp())
    const [mode, setMode] = useState('node') // 'node' | 'ui'
    const [selectedNodeId, setSelectedNodeId] = useState(null)
    const [selectedUiId, setSelectedUiId] = useState(null)

    /* ── Drag State ── */
    const [draggingNodeId, setDraggingNodeId] = useState(null)
    const [draggingUiId, setDraggingUiId] = useState(null)
    const dragOffset = useRef({ x: 0, y: 0 })

    /* ── Connection State ── */
    const [connecting, setConnecting] = useState(null)  // { nodeId, pinId, pinType, isOutput }
    const [tempLine, setTempLine] = useState(null)       // { x1, y1, x2, y2 }
    const canvasRef = useRef(null)

    /* ── Runtime State ── */
    const [isRunning, setIsRunning] = useState(false)
    const [runtimeLogs, setRuntimeLogs] = useState([])
    const runtimeRef = useRef(null)

    /* ── UI Runtime State (for preview) ── */
    const [runtimeUiState, setRuntimeUiState] = useState({})

    /* ── Canvas Pan/Zoom State ── */
    const [zoom, setZoom] = useState(1)
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
    const [isPanning, setIsPanning] = useState(false)
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })

    /* ── Node Layers ── */
    const [layers, setLayers] = useState(app.layers || [
        { id: 'default', name: '기본 레이어', visible: true },
    ])

    /* ── UI Pages ── */
    const [editingPageId, setEditingPageId] = useState('page_0')

    const nodesByCategory = useMemo(() => getNodeTypesByCategory(), [])

    /* ─── Canvas coordinate helpers ─── */
    const clientToCanvas = useCallback((clientX, clientY) => {
        const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
        return {
            x: (clientX - rect.left - panOffset.x) / zoom,
            y: (clientY - rect.top - panOffset.y) / zoom,
        }
    }, [zoom, panOffset])

    /* ═══ Touch/Mouse helper ═══ */
    const getPointer = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
        }
        return { clientX: e.clientX, clientY: e.clientY }
    }

    /* ═══ NODE DRAG ═══ */
    const handleNodeDragStart = useCallback((e, nodeId) => {
        const node = app.nodes.find(n => n.id === nodeId)
        if (!node) return
        const pt = getPointer(e)
        const canvasPos = clientToCanvas(pt.clientX, pt.clientY)
        dragOffset.current = {
            x: canvasPos.x - node.x,
            y: canvasPos.y - node.y,
        }
        setDraggingNodeId(nodeId)
    }, [app.nodes, clientToCanvas])

    /* ═══ UI COMPONENT DRAG ═══ */
    const handleUiDragStart = useCallback((e, uiId) => {
        const comp = app.uiComponents.find(c => c.id === uiId)
        if (!comp) return
        const pt = getPointer(e)
        dragOffset.current = {
            x: pt.clientX - comp.x,
            y: pt.clientY - comp.y,
        }
        setDraggingUiId(uiId)
        setSelectedUiId(uiId)
    }, [app.uiComponents])

    /* ═══ Pointer Move (drag + connection + pan) ═══ */
    const handlePointerMove = useCallback((e) => {
        const pt = getPointer(e)

        if (isPanning) {
            const dx = pt.clientX - panStart.current.x
            const dy = pt.clientY - panStart.current.y
            setPanOffset({
                x: panStart.current.panX + dx,
                y: panStart.current.panY + dy,
            })
            return
        }

        if (draggingNodeId) {
            const canvasPos = clientToCanvas(pt.clientX, pt.clientY)
            const newX = canvasPos.x - dragOffset.current.x
            const newY = canvasPos.y - dragOffset.current.y
            setApp(prev => ({
                ...prev,
                nodes: prev.nodes.map(n =>
                    n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n
                ),
            }))
        }

        if (draggingUiId) {
            const newX = pt.clientX - dragOffset.current.x
            const newY = pt.clientY - dragOffset.current.y
            setApp(prev => ({
                ...prev,
                uiComponents: prev.uiComponents.map(c =>
                    c.id === draggingUiId ? { ...c, x: Math.max(0, newX), y: Math.max(0, newY) } : c
                ),
            }))
        }

        if (connecting) {
            const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 }
            setTempLine(prev => prev ? {
                ...prev,
                x2: (pt.clientX - rect.left - panOffset.x) / zoom,
                y2: (pt.clientY - rect.top - panOffset.y) / zoom,
            } : null)
        }
    }, [draggingNodeId, draggingUiId, connecting, isPanning, clientToCanvas, zoom, panOffset])

    const handlePointerUp = useCallback(() => {
        setDraggingNodeId(null)
        setDraggingUiId(null)
        setIsPanning(false)
        if (connecting) {
            setConnecting(null)
            setTempLine(null)
        }
    }, [connecting])

    /* ═══ PIN CONNECTION ═══ */
    const handlePinMouseDown = useCallback((nodeId, pinId, pinType, isOutput, e) => {
        if (!isOutput) return  // Start connection only from output pins
        const pt = getPointer(e)
        const canvasPos = clientToCanvas(pt.clientX, pt.clientY)
        setConnecting({ nodeId, pinId, pinType, isOutput })
        setTempLine({ x1: canvasPos.x, y1: canvasPos.y, x2: canvasPos.x, y2: canvasPos.y })
    }, [clientToCanvas])

    const handlePinMouseUp = useCallback((nodeId, pinId, pinType, isOutput) => {
        if (!connecting || isOutput) return  // End at input pins only
        if (connecting.nodeId === nodeId) return  // No self-connections

        // Type compatibility: exec→exec or data*→data*
        const isExec = connecting.pinType === 'exec' && pinType === 'exec'
        const isData = connecting.pinType !== 'exec' && pinType !== 'exec'
        if (!isExec && !isData) return

        // Remove existing connections to this input pin
        const newConnections = app.connections.filter(
            c => !(c.to.nodeId === nodeId && c.to.pinId === pinId)
        )

        newConnections.push({
            from: { nodeId: connecting.nodeId, pinId: connecting.pinId },
            to: { nodeId, pinId },
        })

        setApp(prev => ({ ...prev, connections: newConnections }))
        setConnecting(null)
        setTempLine(null)
    }, [connecting, app.connections])

    /* ═══ CONNECTION RENDERING ═══ */
    const getConnectionPath = useCallback((conn) => {
        // Find DOM elements for pins
        const fromEl = canvasRef.current?.querySelector(
            `[data-node-id="${conn.from.nodeId}"][data-pin-id="${conn.from.pinId}"][data-is-output="true"]`
        )
        const toEl = canvasRef.current?.querySelector(
            `[data-node-id="${conn.to.nodeId}"][data-pin-id="${conn.to.pinId}"][data-is-output="false"]`
        )

        if (!fromEl || !toEl) return null

        const canvasRect = canvasRef.current.getBoundingClientRect()
        const fromRect = fromEl.getBoundingClientRect()
        const toRect = toEl.getBoundingClientRect()

        const x1 = (fromRect.left + fromRect.width / 2 - canvasRect.left - panOffset.x) / zoom
        const y1 = (fromRect.top + fromRect.height / 2 - canvasRect.top - panOffset.y) / zoom
        const x2 = (toRect.left + toRect.width / 2 - canvasRect.left - panOffset.x) / zoom
        const y2 = (toRect.top + toRect.height / 2 - canvasRect.top - panOffset.y) / zoom

        const dx = Math.abs(x2 - x1) * 0.5
        return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`
    }, [zoom, panOffset])

    /* ═══ NODE ACTIONS ═══ */
    const addNode = useCallback((type, x, y) => {
        const node = createNodeInstance(type, x || 100, y || 100)
        if (!node) return
        node.layer = 'default'
        setApp(prev => ({ ...prev, nodes: [...prev.nodes, node] }))
        setSelectedNodeId(node.id)
    }, [])

    const deleteSelectedNode = useCallback(() => {
        if (!selectedNodeId) return
        setApp(prev => ({
            ...prev,
            nodes: prev.nodes.filter(n => n.id !== selectedNodeId),
            connections: prev.connections.filter(
                c => c.from.nodeId !== selectedNodeId && c.to.nodeId !== selectedNodeId
            ),
        }))
        setSelectedNodeId(null)
    }, [selectedNodeId])

    const updateNodeProperty = useCallback((nodeId, key, value) => {
        setApp(prev => ({
            ...prev,
            nodes: prev.nodes.map(n =>
                n.id === nodeId
                    ? { ...n, properties: { ...n.properties, [key]: value } }
                    : n
            ),
        }))
    }, [])

    /* ═══ UI COMPONENT ACTIONS ═══ */
    const addUiComponent = useCallback((type) => {
        const comp = createUIComponent(type)
        if (!comp) return
        comp.pageId = editingPageId
        setApp(prev => ({
            ...prev,
            uiComponents: [...prev.uiComponents, comp]
        }))
        setSelectedUiId(comp.id)
    }, [editingPageId])

    /* ═══ PAGE ACTIONS ═══ */
    const addPage = useCallback(() => {
        const newPageId = `page_${Date.now()}`
        const newPage = { id: newPageId, name: `페이지 ${app.pages?.length || 0 + 1}` }
        setApp(prev => ({
            ...prev,
            pages: [...(prev.pages || []), newPage]
        }))
        setEditingPageId(newPageId)
    }, [app.pages])

    const deletePage = useCallback((pageId) => {
        if (app.pages?.length <= 1) return
        setApp(prev => ({
            ...prev,
            pages: prev.pages.filter(p => p.id !== pageId),
            uiComponents: prev.uiComponents.filter(c => c.pageId !== pageId)
        }))
        if (editingPageId === pageId) {
            setEditingPageId(app.pages.find(p => p.id !== pageId)?.id || 'page_0')
        }
    }, [app.pages, editingPageId])

    const deleteSelectedUi = useCallback(() => {
        if (!selectedUiId) return
        setApp(prev => ({
            ...prev,
            uiComponents: prev.uiComponents.filter(c => c.id !== selectedUiId),
        }))
        setSelectedUiId(null)
    }, [selectedUiId])

    const updateUiProp = useCallback((uiId, key, value) => {
        setApp(prev => ({
            ...prev,
            uiComponents: prev.uiComponents.map(c =>
                c.id === uiId ? { ...c, props: { ...c.props, [key]: value } } : c
            ),
        }))
    }, [])

    const updateUiStyle = useCallback((uiId, key, value) => {
        setApp(prev => ({
            ...prev,
            uiComponents: prev.uiComponents.map(c =>
                c.id === uiId
                    ? { ...c, style: { ...c.style, [key]: isNaN(value) ? value : Number(value) } }
                    : c
            ),
        }))
    }, [])

    /* ═══ SAVE ═══ */
    const handleSave = useCallback(() => {
        const saved = saveApp(app)
        setApp(saved)
        if (onSave) onSave(saved)
    }, [app, onSave])

    /* ═══ RUNTIME ═══ */
    const handleRun = useCallback(() => {
        if (isRunning) {
            runtimeRef.current?.stop()
            runtimeRef.current = null
            setIsRunning(false)
            setRuntimeUiState({})
            return
        }

        setRuntimeLogs([])
        setRuntimeUiState({})

        const runtime = new MiniAppRuntime(app, {
            onSetText: (targetId, value) => {
                setRuntimeUiState(prev => ({
                    ...prev,
                    [targetId]: { ...prev[targetId], text: value },
                }))
            },
            onSetStyle: (targetId, prop, value) => {
                setRuntimeUiState(prev => ({
                    ...prev,
                    [targetId]: {
                        ...prev[targetId],
                        style: { ...(prev[targetId]?.style || {}), [prop]: value },
                    },
                }))
            },
            onAlert: (msg) => {
                setRuntimeLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: `[Alert] ${msg}` }])
            },
            onLog: (msg) => {
                setRuntimeLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), message: msg }])
            },
            onGetInputValue: (targetId) => {
                return runtimeUiState[targetId]?.value || ''
            },
        })

        runtimeRef.current = runtime
        setIsRunning(true)
        runtime.start()
    }, [isRunning, app, runtimeUiState])

    // Cleanup runtime on unmount
    useEffect(() => {
        return () => {
            runtimeRef.current?.stop()
        }
    }, [])

    /* ═══ KEYBOARD ═══ */
    useEffect(() => {
        const handleKey = (e) => {
            if (e.key === 'Delete') {
                if (mode === 'node') deleteSelectedNode()
                if (mode === 'ui') deleteSelectedUi()
            }
        }
        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [mode, deleteSelectedNode, deleteSelectedUi])

    /* ═══ Canvas click ═══ */
    const handleCanvasClick = useCallback((e) => {
        if (e.target === e.currentTarget || e.target.closest('.ne-canvas-inner') === e.target) {
            setSelectedNodeId(null)
            setSelectedUiId(null)
        }
    }, [])

    /* ═══ Canvas right-click / middle-click to pan ═══ */
    const handleCanvasMouseDown = useCallback((e) => {
        // Middle-click or right-click to start panning
        if (e.button === 1 || e.button === 2) {
            e.preventDefault()
            setIsPanning(true)
            panStart.current = {
                x: e.clientX,
                y: e.clientY,
                panX: panOffset.x,
                panY: panOffset.y,
            }
        }
    }, [panOffset])

    /* ═══ Wheel Zoom ═══ */
    const handleWheel = useCallback((e) => {
        if (mode !== 'node') return
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.08 : 0.08
        setZoom(prev => Math.min(3, Math.max(0.15, prev + delta)))
    }, [mode])

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.addEventListener('wheel', handleWheel, { passive: false })
        return () => canvas.removeEventListener('wheel', handleWheel)
    }, [handleWheel])

    /* ═══ Zoom Controls ═══ */
    const handleZoomIn = useCallback(() => setZoom(prev => Math.min(3, prev + 0.15)), [])
    const handleZoomOut = useCallback(() => setZoom(prev => Math.max(0.15, prev - 0.15)), [])
    const handleZoomReset = useCallback(() => { setZoom(1); setPanOffset({ x: 0, y: 0 }) }, [])

    /* ═══ Double click to add node ═══ */
    const handleCanvasDoubleClick = useCallback((e) => {
        if (mode !== 'node') return
        const pt = getPointer(e)
        const canvasPos = clientToCanvas(pt.clientX, pt.clientY)
        addNode('onClick', canvasPos.x, canvasPos.y)
    }, [mode, addNode, clientToCanvas])

    /* ═══ Prevent context menu on canvas ═══ */
    const handleContextMenu = useCallback((e) => {
        e.preventDefault()
    }, [])

    /* ── Selected items for properties panel ── */
    const selectedNode = useMemo(
        () => app.nodes.find(n => n.id === selectedNodeId),
        [app.nodes, selectedNodeId]
    )
    const selectedNodeDef = selectedNode ? getNodeDef(selectedNode.type) : null

    const selectedUi = useMemo(
        () => app.uiComponents.find(c => c.id === selectedUiId),
        [app.uiComponents, selectedUiId]
    )
    const selectedUiDef = selectedUi ? UI_COMPONENT_TYPES[selectedUi.type] : null

    /* ═══════════════════════════════
       RENDER
       ═══════════════════════════════ */
    return (
        <div className="node-editor" onMouseMove={handlePointerMove} onMouseUp={handlePointerUp} onTouchMove={handlePointerMove} onTouchEnd={handlePointerUp}>
            {/* ── Left: Palette ── */}
            <div className="ne-palette">
                <div className="ne-mode-tabs">
                    <button
                        className={`ne-mode-tab ${mode === 'node' ? 'active' : ''}`}
                        onClick={() => setMode('node')}
                    >노드</button>
                    <button
                        className={`ne-mode-tab ${mode === 'ui' ? 'active' : ''}`}
                        onClick={() => setMode('ui')}
                    >UI</button>
                </div>

                {mode === 'node' ? (
                    <>
                        <div className="ne-palette-header">노드 팔레트</div>
                        {Object.entries(NODE_CATEGORIES).map(([key, cat]) => (
                            <div key={key} className="ne-palette-category">
                                <div className="ne-palette-cat-title">
                                    <span className="ne-palette-cat-dot" style={{ background: cat.color }} />
                                    {cat.label}
                                </div>
                                {(nodesByCategory[cat.id] || []).map(nodeDef => (
                                    <div
                                        key={nodeDef.type}
                                        className="ne-palette-item"
                                        onClick={() => addNode(nodeDef.type, 150, 100 + app.nodes.length * 30)}
                                    >
                                        {nodeDef.label}
                                    </div>
                                ))}
                            </div>
                        ))}

                        {/* Layer Panel */}
                        <div className="ne-layer-panel">
                            <div className="ne-palette-cat-title">
                                🗂️ 레이어
                                <button
                                    className="ne-layer-add-btn"
                                    onClick={() => setLayers(prev => [...prev, {
                                        id: `layer_${Date.now()}`,
                                        name: `레이어 ${prev.length + 1}`,
                                        visible: true,
                                    }])}
                                    title="레이어 추가"
                                >+</button>
                            </div>
                            {layers.map(layer => (
                                <div key={layer.id} className="ne-layer-item">
                                    <button
                                        className={`ne-layer-eye ${layer.visible ? 'visible' : ''}`}
                                        onClick={() => setLayers(prev =>
                                            prev.map(l => l.id === layer.id ? { ...l, visible: !l.visible } : l)
                                        )}
                                    >
                                        {layer.visible ? '👁️' : '🙈'}
                                    </button>
                                    <span className="ne-layer-name">{layer.name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="ne-palette-header">UI 컴포넌트</div>
                        {Object.values(UI_COMPONENT_TYPES).map(comp => (
                            <div
                                key={comp.type}
                                className="ne-ui-palette-item"
                                onClick={() => addUiComponent(comp.type)}
                            >
                                <span className="ne-ui-icon">{comp.icon}</span>
                                {comp.label}
                            </div>
                        ))}

                        <div className="ne-layer-panel">
                            <div className="ne-palette-cat-title">
                                📄 페이지
                                <button className="ne-layer-add-btn" onClick={addPage} title="페이지 추가">+</button>
                            </div>
                            {(app.pages || [{ id: 'page_0', name: '메인 페이지' }]).map(page => (
                                <div
                                    key={page.id}
                                    className={`ne-layer-item ${editingPageId === page.id ? 'active' : ''}`}
                                    onClick={() => setEditingPageId(page.id)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span className="ne-layer-name">{page.name}</span>
                                    {app.pages?.length > 1 && (
                                        <button
                                            className="ne-layer-eye"
                                            onClick={(e) => { e.stopPropagation(); deletePage(page.id) }}
                                            title="페이지 삭제"
                                        >
                                            🗑️
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* ── Center: Canvas ── */}
            <div className="ne-center">
                {/* Toolbar */}
                <div className="ne-toolbar">
                    <button className="ne-toolbar-btn" onClick={handleSave}>
                        <MdSave size={14} /> 저장
                    </button>
                    <button
                        className={`ne-toolbar-btn ${isRunning ? '' : 'accent'}`}
                        onClick={handleRun}
                    >
                        {isRunning ? <><MdStop size={14} /> 중지</> : <><MdPlayArrow size={14} /> 테스트</>}
                    </button>
                    {(selectedNodeId || selectedUiId) && (
                        <button className="ne-toolbar-btn" onClick={mode === 'node' ? deleteSelectedNode : deleteSelectedUi}>
                            <MdDelete size={14} /> 삭제
                        </button>
                    )}

                    <div className="ne-toolbar-spacer" />

                    <div className="ne-toolbar-name">
                        <input
                            value={app.name}
                            onChange={(e) => setApp(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="앱 이름"
                        />
                    </div>

                    <select
                        className="ne-display-mode-select"
                        value={app.displayMode || 'fullscreen'}
                        onChange={(e) => setApp(prev => ({ ...prev, displayMode: e.target.value }))}
                        title="실행 모드"
                    >
                        <option value="fullscreen">전체화면</option>
                        <option value="floating">플로팅</option>
                    </select>

                    {mode === 'node' && (
                        <div className="ne-zoom-controls">
                            <button className="ne-toolbar-btn" onClick={handleZoomOut} title="축소">
                                <MdZoomOut size={14} />
                            </button>
                            <span className="ne-zoom-label">{Math.round(zoom * 100)}%</span>
                            <button className="ne-toolbar-btn" onClick={handleZoomIn} title="확대">
                                <MdZoomIn size={14} />
                            </button>
                            <button className="ne-toolbar-btn" onClick={handleZoomReset} title="리셋">
                                <MdCenterFocusStrong size={14} />
                            </button>
                        </div>
                    )}

                    <button className="ne-toolbar-btn" onClick={onClose}>
                        <MdClose size={14} />
                    </button>
                </div>

                {/* Canvas */}
                <div
                    ref={canvasRef}
                    className={`ne-canvas-area ${isPanning ? 'panning' : ''}`}
                    onClick={handleCanvasClick}
                    onDoubleClick={handleCanvasDoubleClick}
                    onMouseDown={handleCanvasMouseDown}
                    onContextMenu={handleContextMenu}
                >
                    {mode === 'node' ? (
                        /* ── Node Canvas ── */
                        <div
                            className="ne-canvas-inner"
                            style={{
                                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                                transformOrigin: '0 0',
                            }}
                        >
                            {/* SVG Connections */}
                            <svg className="ne-connections-svg">
                                {app.connections.map((conn, i) => {
                                    const path = getConnectionPath(conn)
                                    if (!path) return null
                                    const fromNode = app.nodes.find(n => n.id === conn.from.nodeId)
                                    const fromDef = fromNode ? getNodeDef(fromNode.type) : null
                                    const fromPin = fromDef?.outputs.find(p => p.id === conn.from.pinId)
                                    const isExec = fromPin?.type === 'exec'
                                    return (
                                        <path
                                            key={i}
                                            d={path}
                                            className={`ne-connection-line ${isExec ? 'exec' : 'data'}`}
                                        />
                                    )
                                })}
                                {/* Temp connecting line */}
                                {tempLine && (
                                    <line
                                        x1={tempLine.x1} y1={tempLine.y1}
                                        x2={tempLine.x2} y2={tempLine.y2}
                                        className="ne-temp-line"
                                    />
                                )}
                            </svg>

                            {/* Nodes */}
                            {app.nodes
                                .filter(node => {
                                    const nodeLayer = node.layer || 'default'
                                    const layerDef = layers.find(l => l.id === nodeLayer)
                                    return !layerDef || layerDef.visible
                                })
                                .map(node => (
                                    <NodeComponent
                                        key={node.id}
                                        node={node}
                                        selected={selectedNodeId === node.id}
                                        onSelect={setSelectedNodeId}
                                        onDragStart={handleNodeDragStart}
                                        onPinMouseDown={handlePinMouseDown}
                                        onPinMouseUp={handlePinMouseUp}
                                    />
                                ))}
                        </div>
                    ) : (
                        /* ── UI Canvas ── */
                        <div
                            className="ne-ui-canvas"
                            style={{
                                width: app.canvas.width,
                                height: app.canvas.height,
                                backgroundColor: app.canvas.backgroundColor,
                                margin: '20px auto',
                            }}
                        >
                            {app.uiComponents
                                .filter(comp => (comp.pageId || 'page_0') === editingPageId)
                                .map(comp => {
                                    const overrides = runtimeUiState[comp.id] || {}
                                    const style = { ...comp.style, ...(overrides.style || {}) }
                                    const text = overrides.text !== undefined ? overrides.text : comp.props.text

                                    return (
                                        <div
                                            key={comp.id}
                                            className={`ne-ui-component ${selectedUiId === comp.id ? 'selected' : ''}`}
                                            style={{ left: comp.x, top: comp.y, position: 'absolute' }}
                                            onMouseDown={(e) => handleUiDragStart(e, comp.id)}
                                            onTouchStart={(e) => handleUiDragStart(e, comp.id)}
                                            onClick={(e) => { e.stopPropagation(); setSelectedUiId(comp.id) }}
                                        >
                                            <span className="ui-id-tag">{comp.id.split('_').pop()}</span>
                                            {comp.type === 'button' && (
                                                <button
                                                    style={style}
                                                    onClick={() => {
                                                        if (isRunning) runtimeRef.current?.handleEvent('onClick', comp.id)
                                                    }}
                                                >
                                                    {text}
                                                </button>
                                            )}
                                            {comp.type === 'text' && (
                                                <div style={style}>{text}</div>
                                            )}
                                            {comp.type === 'input' && (
                                                <input
                                                    style={style}
                                                    placeholder={comp.props.placeholder}
                                                    value={overrides.value ?? comp.props.value ?? ''}
                                                    onChange={(e) => {
                                                        setRuntimeUiState(prev => ({
                                                            ...prev,
                                                            [comp.id]: { ...prev[comp.id], value: e.target.value },
                                                        }))
                                                    }}
                                                />
                                            )}
                                            {comp.type === 'image' && (
                                                <div style={{ ...style, background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: 12 }}>
                                                    {comp.props.src ? <img src={comp.props.src} alt={comp.props.alt} style={style} /> : '🖼️'}
                                                </div>
                                            )}
                                            {comp.type === 'container' && (
                                                <div style={style}></div>
                                            )}
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                </div>

                {/* Console */}
                {runtimeLogs.length > 0 && (
                    <div className="ne-console">
                        {runtimeLogs.map((log, i) => (
                            <div key={i} className="ne-console-line">
                                <span className="time">{log.time}</span>
                                <span className="msg">{log.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Right: Properties Panel ── */}
            <div className="ne-properties">
                <div className="ne-props-header">속성</div>

                {mode === 'node' && selectedNode && selectedNodeDef ? (
                    <>
                        <div className="ne-props-section">
                            <div className="ne-props-section-title">노드 정보</div>
                            <div className="ne-prop-field">
                                <label>타입</label>
                                <input type="text" value={selectedNodeDef.label} readOnly />
                            </div>
                            <div className="ne-prop-field">
                                <label>ID</label>
                                <input type="text" value={selectedNode.id} readOnly style={{ fontSize: 10 }} />
                            </div>
                        </div>

                        {Object.keys(selectedNodeDef.properties).length > 0 && (
                            <div className="ne-props-section">
                                <div className="ne-props-section-title">속성</div>
                                {Object.entries(selectedNodeDef.properties).map(([key, prop]) => (
                                    <div key={key} className="ne-prop-field">
                                        <label>{prop.label}</label>
                                        {prop.type === 'select' ? (
                                            <select
                                                value={selectedNode.properties[key] ?? prop.default}
                                                onChange={(e) => updateNodeProperty(selectedNode.id, key, e.target.value)}
                                            >
                                                {prop.options.map(opt => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        ) : prop.type === 'boolean' ? (
                                            <select
                                                value={String(selectedNode.properties[key] ?? prop.default)}
                                                onChange={(e) => updateNodeProperty(selectedNode.id, key, e.target.value === 'true')}
                                            >
                                                <option value="true">True</option>
                                                <option value="false">False</option>
                                            </select>
                                        ) : (
                                            <input
                                                type={prop.type === 'number' ? 'number' : 'text'}
                                                value={selectedNode.properties[key] ?? prop.default}
                                                onChange={(e) => updateNodeProperty(
                                                    selectedNode.id,
                                                    key,
                                                    prop.type === 'number' ? Number(e.target.value) : e.target.value
                                                )}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Component ID selector for event/action nodes */}
                        {selectedNodeDef.properties.targetId !== undefined && app.uiComponents.length > 0 && (
                            <div className="ne-props-section">
                                <div className="ne-props-section-title">UI 컴포넌트 연결</div>
                                <div className="ne-prop-field">
                                    <label>대상 선택</label>
                                    <select
                                        value={selectedNode.properties.targetId || ''}
                                        onChange={(e) => updateNodeProperty(selectedNode.id, 'targetId', e.target.value)}
                                    >
                                        <option value="">선택하세요</option>
                                        {app.uiComponents.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {UI_COMPONENT_TYPES[c.type]?.label} ({c.id.split('_').pop()})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                ) : mode === 'ui' && selectedUi && selectedUiDef ? (
                    <>
                        <div className="ne-props-section">
                            <div className="ne-props-section-title">컴포넌트 정보</div>
                            <div className="ne-prop-field">
                                <label>타입</label>
                                <input type="text" value={selectedUiDef.label} readOnly />
                            </div>
                            <div className="ne-prop-field">
                                <label>ID</label>
                                <input type="text" value={selectedUi.id} readOnly style={{ fontSize: 10 }} />
                            </div>
                        </div>

                        <div className="ne-props-section">
                            <div className="ne-props-section-title">속성</div>
                            {Object.entries(selectedUi.props).map(([key, value]) => (
                                <div key={key} className="ne-prop-field">
                                    <label>{key}</label>
                                    <input
                                        type="text"
                                        value={value}
                                        onChange={(e) => updateUiProp(selectedUi.id, key, e.target.value)}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="ne-props-section">
                            <div className="ne-props-section-title">위치 & 크기</div>
                            <div className="ne-style-row">
                                <div className="ne-prop-field">
                                    <label>X</label>
                                    <input type="number" value={selectedUi.x}
                                        onChange={(e) => setApp(prev => ({
                                            ...prev,
                                            uiComponents: prev.uiComponents.map(c =>
                                                c.id === selectedUi.id ? { ...c, x: Number(e.target.value) } : c
                                            ),
                                        }))} />
                                </div>
                                <div className="ne-prop-field">
                                    <label>Y</label>
                                    <input type="number" value={selectedUi.y}
                                        onChange={(e) => setApp(prev => ({
                                            ...prev,
                                            uiComponents: prev.uiComponents.map(c =>
                                                c.id === selectedUi.id ? { ...c, y: Number(e.target.value) } : c
                                            ),
                                        }))} />
                                </div>
                            </div>
                            <div className="ne-style-row">
                                <div className="ne-prop-field">
                                    <label>너비</label>
                                    <input type="number" value={selectedUi.style.width || ''}
                                        onChange={(e) => updateUiStyle(selectedUi.id, 'width', e.target.value)} />
                                </div>
                                <div className="ne-prop-field">
                                    <label>높이</label>
                                    <input type="number" value={selectedUi.style.height || ''}
                                        onChange={(e) => updateUiStyle(selectedUi.id, 'height', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <div className="ne-props-section">
                            <div className="ne-props-section-title">스타일</div>
                            <div className="ne-prop-field">
                                <label>배경색</label>
                                <input type="text" value={selectedUi.style.backgroundColor || ''}
                                    onChange={(e) => updateUiStyle(selectedUi.id, 'backgroundColor', e.target.value)} />
                            </div>
                            <div className="ne-prop-field">
                                <label>글자색</label>
                                <input type="text" value={selectedUi.style.color || ''}
                                    onChange={(e) => updateUiStyle(selectedUi.id, 'color', e.target.value)} />
                            </div>
                            <div className="ne-prop-field">
                                <label>글자 크기</label>
                                <input type="number" value={selectedUi.style.fontSize || ''}
                                    onChange={(e) => updateUiStyle(selectedUi.id, 'fontSize', e.target.value)} />
                            </div>
                            <div className="ne-prop-field">
                                <label>테두리 둥글기</label>
                                <input type="number" value={selectedUi.style.borderRadius || ''}
                                    onChange={(e) => updateUiStyle(selectedUi.id, 'borderRadius', e.target.value)} />
                            </div>
                        </div>

                        <div className="ne-props-section">
                            <div className="ne-props-section-title">배치 정보</div>
                            <div className="ne-prop-field">
                                <label>페이지</label>
                                <select
                                    value={selectedUi.pageId || 'page_0'}
                                    onChange={(e) => {
                                        const pageId = e.target.value
                                        setApp(prev => ({
                                            ...prev,
                                            uiComponents: prev.uiComponents.map(c =>
                                                c.id === selectedUi.id ? { ...c, pageId } : c
                                            ),
                                        }))
                                    }}
                                >
                                    {(app.pages || [{ id: 'page_0', name: '메인 페이지' }]).map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="ne-prop-field">
                                <label>레이어</label>
                                <select
                                    value={selectedUi.layer || 'default'}
                                    onChange={(e) => {
                                        const layerId = e.target.value
                                        setApp(prev => ({
                                            ...prev,
                                            uiComponents: prev.uiComponents.map(c =>
                                                c.id === selectedUi.id ? { ...c, layer: layerId } : c
                                            ),
                                        }))
                                    }}
                                >
                                    {layers.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="ne-props-empty">
                        {mode === 'node' ? '노드를 선택하세요' : 'UI 컴포넌트를 선택하세요'}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NodeEditor
