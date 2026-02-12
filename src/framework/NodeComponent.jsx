import { getNodeDef, getCategoryInfo, PIN_COLORS } from './nodeTypes'

/**
 * NodeComponent - 개별 노드 렌더링 (블루프린트 스타일)
 */
function NodeComponent({
    node,
    selected,
    onSelect,
    onDragStart,
    onPinMouseDown,
    onPinMouseUp,
}) {
    const def = getNodeDef(node.type)
    if (!def) return null

    const catInfo = getCategoryInfo(def.category)
    const headerColor = catInfo?.color || '#666'

    const handleMouseDown = (e) => {
        e.stopPropagation()
        onSelect(node.id)
        onDragStart(e, node.id)
    }

    const handlePinDown = (e, pinId, pinType, isOutput) => {
        e.stopPropagation()
        onPinMouseDown(node.id, pinId, pinType, isOutput, e)
    }

    const handlePinUp = (e, pinId, pinType, isOutput) => {
        e.stopPropagation()
        onPinMouseUp(node.id, pinId, pinType, isOutput)
    }

    return (
        <div
            className={`node-component ${selected ? 'selected' : ''}`}
            style={{ left: node.x, top: node.y }}
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
        >
            {/* Header */}
            <div className="node-header" style={{ background: headerColor }}>
                <span className="node-icon">{catInfo?.icon}</span>
                <span className="node-title">{def.label}</span>
            </div>

            {/* Body */}
            <div className="node-body">
                {/* Input Pins */}
                <div className="node-pins-left">
                    {def.inputs.map(pin => (
                        <div key={pin.id} className="node-pin input">
                            <div
                                className={`pin-dot ${pin.type === 'exec' ? 'exec' : 'data'}`}
                                style={{ borderColor: PIN_COLORS[pin.type] || PIN_COLORS.any }}
                                onMouseDown={(e) => handlePinDown(e, pin.id, pin.type, false)}
                                onTouchStart={(e) => handlePinDown(e, pin.id, pin.type, false)}
                                onMouseUp={(e) => handlePinUp(e, pin.id, pin.type, false)}
                                onTouchEnd={(e) => handlePinUp(e, pin.id, pin.type, false)}
                                data-node-id={node.id}
                                data-pin-id={pin.id}
                                data-is-output="false"
                            />
                            {pin.label && <span className="pin-label">{pin.label}</span>}
                        </div>
                    ))}
                </div>

                {/* Output Pins */}
                <div className="node-pins-right">
                    {def.outputs.map(pin => (
                        <div key={pin.id} className="node-pin output">
                            {pin.label && <span className="pin-label">{pin.label}</span>}
                            <div
                                className={`pin-dot ${pin.type === 'exec' ? 'exec' : 'data'}`}
                                style={{ borderColor: PIN_COLORS[pin.type] || PIN_COLORS.any }}
                                onMouseDown={(e) => handlePinDown(e, pin.id, pin.type, true)}
                                onTouchStart={(e) => handlePinDown(e, pin.id, pin.type, true)}
                                onMouseUp={(e) => handlePinUp(e, pin.id, pin.type, true)}
                                onTouchEnd={(e) => handlePinUp(e, pin.id, pin.type, true)}
                                data-node-id={node.id}
                                data-pin-id={pin.id}
                                data-is-output="true"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Inline Properties */}
            {Object.keys(def.properties).length > 0 && (
                <div className="node-props-preview">
                    {Object.entries(def.properties).map(([key, prop]) => (
                        <div key={key} className="node-prop-row">
                            <span className="node-prop-label">{prop.label}:</span>
                            <span className="node-prop-value">
                                {node.properties?.[key] !== undefined
                                    ? String(node.properties[key])
                                    : String(prop.default)}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default NodeComponent
